import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, GripVertical, Image as ImageIcon } from 'lucide-react';

interface ImageCardProps {
  id: string;
  file: File;
  previewUrl: string;
  onDelete: (id: string) => void;
  isOverlay?: boolean;
}

const ImageCard: React.FC<ImageCardProps> = ({ 
  id, 
  file, 
  previewUrl, 
  onDelete,
  isOverlay = false 
}) => {
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isDragging ? 'border-pdf-red dark:border-violet-500 shadow-2xl' : 'border-transparent hover:border-pdf-red dark:hover:border-violet-500 shadow-sm hover:shadow-xl'
      } ${isOverlay ? 'cursor-grabbing scale-105 shadow-2xl border-pdf-red dark:border-violet-500' : 'cursor-default'}`}
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

      {/* Delete Button */}
      {!isOverlay && (
        <button
          onClick={() => onDelete(id)}
          className="absolute top-3 right-3 z-20 p-2 bg-red-500/90 hover:bg-red-600 backdrop-blur-xl rounded-xl opacity-0 group-hover:opacity-100 transition-all text-white shadow-xl hover:scale-110 active:scale-95"
          title="删除图片"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Image Preview */}
      <div className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-white/[0.02] relative overflow-hidden">
        <img 
          src={previewUrl} 
          alt={file.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Info Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-8">
          <p className="text-[11px] text-white truncate font-black tracking-tight">
            {file.name}
          </p>
          <p className="text-[9px] text-white/70 font-bold">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
