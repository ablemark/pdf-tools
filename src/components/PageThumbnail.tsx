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
      className={`relative cursor-pointer group rounded-2xl overflow-hidden border-2 transition-all duration-300 ${
        isSelected 
          ? 'border-pdf-red dark:border-violet-500 ring-4 ring-pdf-red/20 dark:ring-violet-500/20 shadow-2xl scale-[1.02]' 
          : 'border-transparent hover:border-gray-300 dark:hover:border-white/20 hover:scale-[1.01]'
      }`}
    >
      <div className="aspect-[3/4] bg-gray-50 dark:bg-white/5 flex items-center justify-center relative group-hover:bg-gray-100 dark:group-hover:bg-white/10 transition-colors">
        {loading ? (
          <div className="animate-pulse w-full h-full bg-gray-200 dark:bg-white/10"></div>
        ) : thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={`Page ${pageNumber}`} 
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="text-xs text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">无法预览</span>
        )}

        {/* Selection Overlay */}
        <div className={`absolute inset-0 transition-colors duration-300 ${
          isSelected ? 'bg-pdf-red/5 dark:bg-violet-500/10' : 'group-hover:bg-black/5 dark:group-hover:bg-white/5'
        }`}></div>

        {/* Checkbox Icon */}
        <div className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg backdrop-blur-md border border-transparent dark:border-white/10 ${
          isSelected 
            ? 'bg-pdf-red dark:bg-violet-500 text-white scale-100 rotate-0' 
            : 'bg-white/80 dark:bg-white/10 text-transparent scale-0 -rotate-12 group-hover:scale-100 group-hover:rotate-0'
        }`}>
          <Check className="w-4 h-4 stroke-[3px]" />
        </div>

        {/* Page Number Badge */}
        <div className="absolute bottom-3 left-3 bg-black/60 dark:bg-white/10 backdrop-blur-md text-white text-[10px] px-2 py-1 rounded-lg font-black uppercase tracking-widest border border-transparent dark:border-white/10">
          第 {pageNumber} 页
        </div>
      </div>
    </div>
  );
};

export default PageThumbnail;
