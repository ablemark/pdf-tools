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
      className={`relative group rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isDeleted 
          ? 'border-red-500/50 grayscale opacity-60' 
          : 'border-transparent hover:border-pdf-red dark:hover:border-pdf-red shadow-sm hover:shadow-md'
      } bg-white dark:bg-slate-900 ${isOverlay ? 'cursor-grabbing' : 'cursor-default'}`}
    >
      {/* Drag Handle */}
      {!isOverlay && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute top-2 left-2 z-20 p-1.5 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing text-gray-500 hover:text-pdf-red"
        >
          <GripVertical className="w-4 h-4" />
        </div>
      )}

      {/* Thumbnail Container */}
      <div 
        ref={containerRef}
        className="aspect-[3/4] flex items-center justify-center relative overflow-hidden bg-gray-50 dark:bg-slate-950"
      >
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`Page ${pageNumber}`} 
            className="w-full h-full object-contain transition-transform duration-300 ease-in-out"
            style={{ transform: `rotate(${rotation}deg)` }}
          />
        ) : (
          <div className="animate-pulse w-full h-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center">
            <span className="text-xs text-gray-400">加载中...</span>
          </div>
        )}

        {/* Deleted Overlay */}
        {isDeleted && (
          <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px] flex items-center justify-center">
            <div className="bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center">
              <Trash2 className="w-3 h-3 mr-1" />
              已标记删除
            </div>
          </div>
        )}

        {/* Hover Controls */}
        {!isOverlay && (
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRotate(pageNumber);
              }}
              className="p-2 bg-white dark:bg-slate-800 rounded-full text-gray-700 dark:text-slate-200 hover:text-pdf-red transition-colors shadow-lg"
              title="旋转 90°"
            >
              <RotateCw className="w-5 h-5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(pageNumber);
              }}
              className={`p-2 rounded-full text-white transition-colors shadow-lg ${
                isDeleted ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
              title={isDeleted ? "取消删除" : "删除页面"}
            >
              {isDeleted ? <Undo2 className="w-5 h-5" /> : <Trash2 className="w-5 h-5" />}
            </button>
          </div>
        )}

        {/* Page Number Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium z-10">
          第 {pageNumber} 页
        </div>
        
        {/* Selection Status */}
        {!isDeleted && (
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <CheckCircle2 className="w-5 h-5 text-pdf-red fill-white dark:fill-slate-900" />
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorPageCard;
