import React, { useEffect, useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { Trash2, RotateCcw, RotateCw, GripVertical } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface FileCardProps {
  id: string;
  file: File;
  rotation: number;
  onDelete: (id: string) => void;
  onRotate: (id: string, direction: 'left' | 'right') => void;
}

const FileCard: React.FC<FileCardProps> = ({ id, file, rotation, onDelete, onRotate }) => {
  const [thumbnail, setThumbnail] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;
        setPageCount(pdf.numPages);

        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas,
        }).promise;

        if (isMounted) {
          setThumbnail(canvas.toDataURL());
          setLoading(false);
        }
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        if (isMounted) setLoading(false);
      }
    };

    generateThumbnail();

    return () => {
      isMounted = false;
    };
  }, [file]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`relative group bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${isDragging ? 'ring-2 ring-pdf-red z-50' : ''}`}
    >
      {/* Drag Handle Overlay (Subtle) */}
      <div className="absolute top-2 left-2 z-10 p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <GripVertical className="w-4 h-4 text-gray-500" />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-2 right-2 z-20 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => onRotate(id, 'left')}
          className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-600 dark:text-gray-300 hover:text-pdf-red transition-colors shadow-sm"
          title="向左旋转"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRotate(id, 'right')}
          className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg text-gray-600 dark:text-gray-300 hover:text-pdf-red transition-colors shadow-sm"
          title="向右旋转"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-1.5 bg-white/80 dark:bg-gray-800/80 rounded-lg text-pdf-red hover:bg-pdf-red hover:text-white transition-all shadow-sm"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-12 h-16 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
            <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={file.name}
            className="w-full h-full object-contain transition-transform duration-300"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="text-gray-400 text-xs text-center px-4">无法预览</div>
        )}
        
        {/* Rotation Badge */}
        {rotation !== 0 && (
          <div className="absolute bottom-2 right-2 bg-pdf-red text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
            {rotation}°
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
          <span>{pageCount ? `${pageCount} 页` : '...'}</span>
          <span>{formatFileSize(file.size)}</span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
