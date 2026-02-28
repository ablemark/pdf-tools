import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { RotateCw, Trash2, Undo2, CheckCircle2, GripVertical } from 'lucide-react';

interface EditorPageCardProps {
  id: number;
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  rotation: number;
  isDeleted: boolean;
  onRotate: (pageNumber: number) => void;
  onDelete: (pageNumber: number) => void;
  isOverlay?: boolean;
}

const EditorPageCard: React.FC<EditorPageCardProps> = ({ 
  id,
  pdf, 
  pageNumber, 
  rotation, 
  isDeleted, 
  onRotate, 
  onDelete,
  isOverlay = false
}) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.3 : 1,
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible || thumbnailUrl) return;

    let isMounted = true;

    const renderThumbnail = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
          canvasContext: context as any,
          viewport: viewport,
          canvas: canvas as any,
        }).promise;

        if (isMounted) {
          canvas.toBlob((blob) => {
            if (blob && isMounted) {
              const url = URL.createObjectURL(blob);
              setThumbnailUrl(url);
            }
          }, 'image/jpeg', 0.7);
        }
      } catch (error) {
        console.error(`Error rendering thumbnail for page ${pageNumber}:`, error);
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
    };
  }, [pdf, pageNumber, isVisible]);

  // Separate effect for cleanup to avoid stale closure issues
  useEffect(() => {
    return () => {
      if (thumbnailUrl) {
        URL.revokeObjectURL(thumbnailUrl);
      }
    };
  }, [thumbnailUrl]);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`relative group rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isDeleted 
          ? 'border-red-500/50 grayscale opacity-60' 
          : 'border-transparent hover:border-pdf-red dark:hover:border-violet-500 shadow-sm hover:shadow-xl'
      } bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl ${isOverlay ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Drag Handle */}
      {!isOverlay && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-3 left-3 z-20 p-2 bg-white/90 dark:bg-white/10 backdrop-blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-all cursor-grab active:cursor-grabbing text-gray-500 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-violet-400 shadow-sm"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Thumbnail Container */}
      <div 
        ref={containerRef}
        className="aspect-[3/4] flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-white/[0.02]"
      >
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`Page ${pageNumber}`} 
            className="w-full h-full object-contain transition-transform duration-500 ease-in-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="animate-pulse w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            <span className="text-xs text-gray-400 dark:text-zinc-600 font-bold">加载中...</span>
          </div>
        )}

        {/* Deleted Overlay */}
        {isDeleted && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[2px] flex items-center justify-center">
            <div className="bg-red-600 text-white px-4 py-2 rounded-2xl text-xs font-black shadow-2xl flex items-center tracking-tight">
              <Trash2 className="w-4 h-4 mr-2" />
              已标记删除
            </div>
          </div>
        )}

        {/* Hover Controls */}
        {!isOverlay && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-4 backdrop-blur-[4px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(pageNumber);
              }}
              className="p-3 bg-white dark:bg-white/10 rounded-2xl text-gray-700 dark:text-zinc-100 hover:text-pdf-red dark:hover:text-violet-400 transition-all shadow-2xl hover:scale-110 active:scale-95"
              title="旋转 90°"
            >
              <RotateCw className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(pageNumber);
              }}
              className={`p-3 rounded-2xl text-white transition-all shadow-2xl hover:scale-110 active:scale-95 ${
                isDeleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isDeleted ? "取消删除" : "删除页面"}
            >
              {isDeleted ? <Undo2 className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </button>
          </div>
        )}

        {/* Page Number Badge */}
        <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-xl text-white text-[11px] px-2.5 py-1 rounded-xl font-black z-10 tracking-tight">
          第 {pageNumber} 页
        </div>
        
        {/* Selection Status */}
        {!isDeleted && (
          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all">
            <CheckCircle2 className="w-6 h-6 text-pdf-red dark:text-violet-400 fill-white dark:fill-zinc-900" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPageCard;
