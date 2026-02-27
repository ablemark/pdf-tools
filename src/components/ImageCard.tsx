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
      className={`relative group bg-white dark:bg-slate-900 rounded-xl overflow-hidden border-2 transition-all duration-300 ${
        isDragging ? 'border-pdf-red shadow-2xl' : 'border-transparent hover:border-pdf-red shadow-sm hover:shadow-md'
      } ${isOverlay ? 'cursor-grabbing scale-105 shadow-2xl border-pdf-red' : 'cursor-default'}`}
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

      {/* Delete Button */}
      {!isOverlay && (
        <button
          onClick={() => onDelete(id)}
          className="absolute top-2 right-2 z-20 p-1.5 bg-red-500/80 hover:bg-red-600 backdrop-blur-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-white shadow-lg"
          title="删除图片"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {/* Image Preview */}
      <div className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-slate-950 relative overflow-hidden">
        <img 
          src={previewUrl} 
          alt={file.name} 
          className="w-full h-full object-cover"
        />
        
        {/* Info Overlay */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
          <p className="text-[10px] text-white truncate font-medium">
            {file.name}
          </p>
          <p className="text-[8px] text-white/70">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageCard;
