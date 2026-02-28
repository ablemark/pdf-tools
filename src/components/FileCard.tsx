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
      className={`relative group bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200 dark:border-white/5 overflow-hidden transition-all hover:shadow-2xl cursor-grab active:cursor-grabbing glass ${isDragging ? 'ring-2 ring-pdf-red dark:ring-violet-500 z-50 scale-105' : ''}`}
    >
      {/* Drag Handle Overlay (Subtle) */}
      <div className="absolute top-3 left-3 z-10 p-2 bg-white/80 dark:bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none backdrop-blur-md border border-transparent dark:border-white/5">
        <GripVertical className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
      </div>

      {/* Action Buttons */}
      <div className="absolute top-3 right-3 z-20 flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={(e) => e.stopPropagation()}>
        <button
          onClick={() => onRotate(id, 'left')}
          className="p-2 bg-white/80 dark:bg-white/5 rounded-xl text-gray-600 dark:text-zinc-300 hover:text-pdf-red dark:hover:text-violet-400 transition-all shadow-sm backdrop-blur-md border border-transparent dark:border-white/5 hover:scale-110 active:scale-95"
          title="向左旋转"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onRotate(id, 'right')}
          className="p-2 bg-white/80 dark:bg-white/5 rounded-xl text-gray-600 dark:text-zinc-300 hover:text-pdf-red dark:hover:text-violet-400 transition-all shadow-sm backdrop-blur-md border border-transparent dark:border-white/5 hover:scale-110 active:scale-95"
          title="向右旋转"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(id)}
          className="p-2 bg-white/80 dark:bg-red-500/10 rounded-xl text-pdf-red dark:text-red-400 hover:bg-pdf-red dark:hover:bg-red-500 hover:text-white transition-all shadow-sm backdrop-blur-md border border-transparent dark:border-red-500/20 hover:scale-110 active:scale-95"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Thumbnail */}
      <div className="aspect-[3/4] bg-gray-50 dark:bg-white/5 flex items-center justify-center overflow-hidden relative group-hover:bg-gray-100 dark:group-hover:bg-white/[0.08] transition-colors">
        {loading ? (
          <div className="animate-pulse flex flex-col items-center">
            <div className="w-16 h-20 bg-gray-200 dark:bg-white/10 rounded-xl mb-3 shadow-inner"></div>
            <div className="h-2.5 w-20 bg-gray-200 dark:bg-white/10 rounded-full"></div>
          </div>
        ) : thumbnail ? (
          <img
            src={thumbnail}
            alt={file.name}
            className="w-full h-full object-contain transition-all duration-500 group-hover:scale-105"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="text-gray-400 dark:text-zinc-500 text-xs font-black uppercase tracking-widest text-center px-4">无法预览</div>
        )}
        
        {/* Rotation Badge */}
        {rotation !== 0 && (
          <div className="absolute bottom-3 right-3 bg-pdf-red dark:bg-violet-500 text-white text-[10px] px-2.5 py-1 rounded-full font-black shadow-lg">
            {rotation}°
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4 bg-white/50 dark:bg-transparent backdrop-blur-sm">
        <p className="text-sm font-black text-gray-900 dark:text-zinc-100 truncate mb-1.5 tracking-tight" title={file.name}>
          {file.name}
        </p>
        <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500">
          <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{pageCount ? `${pageCount} 页` : '...'}</span>
          <span className="bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md">{formatFileSize(file.size)}</span>
        </div>
      </div>
    </div>
  );
};

export default FileCard;
