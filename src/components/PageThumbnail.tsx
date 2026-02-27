import React, { useEffect, useState, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Check } from 'lucide-react';

interface PageThumbnailProps {
  pdf: pdfjsLib.PDFDocumentProxy;
  pageNumber: number;
  isSelected: boolean;
  onToggle: (pageNumber: number) => void;
}

const PageThumbnail: React.FC<PageThumbnailProps> = ({ pdf, pageNumber, isSelected, onToggle }) => {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderThumbnail = async () => {
      try {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 0.3 });
        
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
          setThumbnailUrl(canvas.toDataURL('image/jpeg', 0.7));
          setLoading(false);
        }
      } catch (error) {
        console.error(`Error rendering thumbnail for page ${pageNumber}:`, error);
        if (isMounted) setLoading(false);
      }
    };

    renderThumbnail();

    return () => {
      isMounted = false;
    };
  }, [pdf, pageNumber]);

  return (
    <div 
      onClick={() => onToggle(pageNumber)}
      className={`relative cursor-pointer group rounded-xl overflow-hidden border-2 transition-all duration-200 ${
        isSelected 
          ? 'border-pdf-red ring-2 ring-pdf-red/20 shadow-md' 
          : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600'
      }`}
    >
      <div className="aspect-[3/4] bg-gray-100 dark:bg-gray-900 flex items-center justify-center relative">
        {loading ? (
          <div className="animate-pulse w-full h-full bg-gray-200 dark:bg-gray-800"></div>
        ) : thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`Page ${pageNumber}`} 
            className="w-full h-full object-contain"
          />
        ) : (
          <span className="text-xs text-gray-400">无法预览</span>
        )}

        {/* Selection Overlay */}
        <div className={`absolute inset-0 transition-colors duration-200 ${
          isSelected ? 'bg-pdf-red/5' : 'group-hover:bg-black/5'
        }`}></div>

        {/* Checkbox Icon */}
        <div className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
          isSelected 
            ? 'bg-pdf-red text-white scale-100' 
            : 'bg-white/80 dark:bg-gray-800/80 text-transparent scale-0 group-hover:scale-100'
        }`}>
          <Check className="w-4 h-4" />
        </div>

        {/* Page Number Badge */}
        <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          第 {pageNumber} 页
        </div>
      </div>
    </div>
  );
};

export default PageThumbnail;
