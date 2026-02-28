import { useState, useEffect, useCallback } from 'react';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { Loader2, Download, ArrowLeft, Hash, AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter, AlignVerticalJustifyStart, AlignVerticalJustifyEnd, Grid3x3, Type, Palette, Layers } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import { addHistoryRecord } from '../db';

interface AddPageNumbersProps {
  onBack: () => void;
}

type Position = 
  | 'top-left' | 'top-center' | 'top-right'
  | 'middle-left' | 'middle-center' | 'middle-right'
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

type PageNumberFormat = 'n' | 'page-n' | 'n-of-total' | 'page-n-of-total';

export default function AddPageNumbers({ onBack }: AddPageNumbersProps) {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState<Position>('bottom-center');
  const [format, setFormat] = useState<PageNumberFormat>('n');
  const [startFromPage, setStartFromPage] = useState<number>(1); // 1-based index
  const [startNumber, setStartNumber] = useState<number>(1);
  const [fontSize, setFontSize] = useState<number>(12);
  const [color, setColor] = useState<string>('#333333');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedPdfUrl, setProcessedPdfUrl] = useState<string | null>(null);
  
  const [firstPageBytes, setFirstPageBytes] = useState<Uint8Array | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Extract first page for preview and get total pages
  useEffect(() => {
    if (!file) {
      setFirstPageBytes(null);
      setTotalPages(0);
      return;
    }
    
    const extractFirstPage = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        setTotalPages(pdf.getPageCount());
        
        const previewPdf = await PDFDocument.create();
        // Copy the page that corresponds to startFromPage if possible, else first page
        // But for preview consistency, let's just show the first page of the document
        // and simulate what it would look like if it was numbered.
        const [copiedPage] = await previewPdf.copyPages(pdf, [0]);
        previewPdf.addPage(copiedPage);
        const bytes = await previewPdf.save();
        setFirstPageBytes(bytes);
      } catch (err) {
        console.error('Error extracting first page:', err);
      }
    };
    
    extractFirstPage();
  }, [file]);

  // Generate preview
  const generatePreview = useCallback(async () => {
    if (!firstPageBytes) return;
    
    setIsPreviewGenerating(true);
    try {
      const pdf = await PDFDocument.load(firstPageBytes);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const page = pdf.getPages()[0];
      
      // Simulate numbering on the first page
      // If startFromPage > 1, and we are viewing page 1, we shouldn't show anything?
      // For UX, let's show what the number WOULD look like if this was a numbered page.
      // Or better: if startFromPage > 1, show a placeholder or the actual logic.
      // Let's assume the user wants to see the style.
      
      const pageNum = startNumber; 
      const total = totalPages || 10; // Fallback for preview if totalPages not set yet
      
      let text = '';
      switch (format) {
        case 'n': text = `${pageNum}`; break;
        case 'page-n': text = `Page ${pageNum}`; break;
        case 'n-of-total': text = `${pageNum} / ${total}`; break;
        case 'page-n-of-total': text = `Page ${pageNum} of ${total}`; break;
      }

      // Only draw if we are effectively previewing a numbered page. 
      // Since we only preview page 1, let's just draw it to show style.
      drawPageNumber(page, font, text, position, fontSize, color);
      
      const bytes = await pdf.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setIsPreviewGenerating(false);
    }
  }, [firstPageBytes, position, format, startNumber, fontSize, color, totalPages]);

  // Debounce preview
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 300);
    return () => clearTimeout(timer);
  }, [generatePreview]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 };
  };

  const drawPageNumber = (page: any, font: any, text: string, pos: Position, size: number, colorHex: string) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, size);
    const textHeight = font.heightAtSize(size); // Approximate height
    const margin = 30;
    const rgbColor = hexToRgb(colorHex);

    let x = 0;
    let y = 0;

    // Calculate X
    if (pos.includes('left')) {
      x = margin;
    } else if (pos.includes('center')) {
      x = (width - textWidth) / 2;
    } else if (pos.includes('right')) {
      x = width - textWidth - margin;
    }

    // Calculate Y (pdf-lib coordinates start at bottom-left)
    if (pos.includes('bottom')) {
      y = margin;
    } else if (pos.includes('middle')) {
      y = (height - textHeight) / 2;
    } else if (pos.includes('top')) {
      y = height - margin - size; // Subtract size to account for text height roughly
    }

    page.drawText(text, {
      x,
      y,
      size: size,
      font: font,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
    });
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setProcessedPdfUrl(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessedPdfUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const pages = pdf.getPages();
      const total = pages.length;

      pages.forEach((page, index) => {
        // index is 0-based.
        // current page number (1-based) is index + 1.
        const currentPageNum = index + 1;

        // Check if we should number this page
        if (currentPageNum >= startFromPage) {
          // Calculate the number to display
          // If startFromPage is 1, index 0 displays startNumber.
          // If startFromPage is 2, index 1 displays startNumber.
          // Formula: (currentPageNum - startFromPage) + startNumber
          const displayNumVal = (currentPageNum - startFromPage) + startNumber;
          
          let text = '';
          switch (format) {
            case 'n': text = `${displayNumVal}`; break;
            case 'page-n': text = `Page ${displayNumVal}`; break;
            case 'n-of-total': text = `${displayNumVal} / ${total}`; break; // Note: total is total pages of doc, or total numbered pages? Usually doc.
            case 'page-n-of-total': text = `Page ${displayNumVal} of ${total}`; break;
          }

          drawPageNumber(page, font, text, position, fontSize, color);
        }
      });

      const pdfBytes = await pdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setProcessedPdfUrl(url);

      const fileName = `numbered_${file.name}`;

      // Auto download
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Save history
      await addHistoryRecord({
        fileName,
        operationType: '页码',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (error) {
      console.error('Error adding page numbers:', error);
      alert('添加页码时出错，请重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file && !processedPdfUrl) {
    return (
      <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回工具列表
          </button>
        </div>
        <FileUploader 
          title="添加页码" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      </div>
    );
  }

  if (processedPdfUrl && !isProcessing) {
    return (
      <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium group"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回工具列表
          </button>
        </div>
        <div className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center min-h-[450px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="bg-green-100 dark:bg-green-500/20 p-6 rounded-3xl mb-8">
            <Download className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">处理成功！</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-10 text-center max-w-md font-medium text-lg leading-relaxed">
            您的 PDF 文件已成功添加页码。如果没有自动下载，请点击下方按钮手动下载。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <a 
              href={processedPdfUrl} 
              download={`numbered_${file?.name || 'document.pdf'}`}
              className="bg-pdf-red hover:bg-red-600 text-white text-lg font-bold py-3 px-8 rounded-xl shadow-lg transition-all hover:scale-105 flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              下载文件
            </a>
            <button 
              onClick={() => {
                setProcessedPdfUrl(null);
                setFile(null);
              }}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-lg font-bold py-3 px-8 rounded-xl transition-all"
            >
              继续添加
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-6 transition-colors h-full flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 mb-6 flex-shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          返回工具列表
        </button>
      </div>

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col lg:flex-row gap-8 min-h-0 pb-8">
        {/* Left: Preview Panel */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col relative min-h-[500px]">
          <div className="bg-gray-100 dark:bg-gray-700/50 px-6 py-4 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center z-10">
            <span className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase tracking-wider">实时预览 (第一页)</span>
            {isPreviewGenerating && <Loader2 className="w-5 h-5 animate-spin text-pdf-red" />}
          </div>
          <div className="flex-1 relative overflow-auto flex items-center justify-center p-8 bg-gray-200/50 dark:bg-transparent">
            {previewUrl ? (
              <iframe 
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full shadow-2xl bg-white rounded-lg"
                style={{ aspectRatio: '1/1.414', maxHeight: '100%', maxWidth: '100%' }}
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400 dark:text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <span className="font-bold text-sm uppercase tracking-wider">生成预览中...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Configuration Panel */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Hash className="w-6 h-6 mr-3 text-pdf-red" />
              页码设置
            </h2>
          </div>
          
          <div className="p-6 overflow-y-auto flex-grow space-y-8 custom-scrollbar">
            {/* Position Grid */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center">
                <Grid3x3 className="w-4 h-4 mr-2" />
                位置选择
              </h3>
              <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                {[
                  'top-left', 'top-center', 'top-right',
                  'middle-left', 'middle-center', 'middle-right',
                  'bottom-left', 'bottom-center', 'bottom-right'
                ].map((pos) => (
                  <button
                    key={pos}
                    onClick={() => setPosition(pos as Position)}
                    className={`w-16 h-16 rounded-xl border-2 transition-all flex items-center justify-center ${
                      position === pos
                        ? 'border-pdf-red bg-red-50 dark:bg-red-900/20 text-pdf-red'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700/50'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${position === pos ? 'bg-pdf-red' : 'bg-gray-300 dark:bg-gray-500'}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700" />

            {/* Format & Range */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center">
                <Layers className="w-4 h-4 mr-2" />
                格式与范围
              </h3>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">页码格式</label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as PageNumberFormat)}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pdf-red outline-none transition-all appearance-none"
                >
                  <option value="n">1, 2, 3...</option>
                  <option value="page-n">Page 1, Page 2...</option>
                  <option value="n-of-total">1 / 10, 2 / 10...</option>
                  <option value="page-n-of-total">Page 1 of 10...</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">起始页面</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={startFromPage}
                      onChange={(e) => setStartFromPage(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pdf-red outline-none transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      (Index)
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">起始编号</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={(e) => setStartNumber(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pdf-red outline-none transition-all"
                    />
                     <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                      (No.)
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  id="skip-cover"
                  checked={startFromPage === 2}
                  onChange={(e) => setStartFromPage(e.target.checked ? 2 : 1)}
                  className="w-4 h-4 text-pdf-red rounded border-gray-300 focus:ring-pdf-red"
                />
                <label htmlFor="skip-cover" className="text-sm text-gray-600 dark:text-gray-400 select-none">
                  跳过封面 (从第2页开始)
                </label>
              </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-gray-700" />

            {/* Style Settings */}
            <div className="space-y-6">
              <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center">
                <Palette className="w-4 h-4 mr-2" />
                样式设置
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">字体大小</label>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="72"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full appearance-none cursor-pointer accent-pdf-red"
                />
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">字体颜色</label>
                <div className="flex items-center space-x-4">
                  <div className="relative group">
                    <input
                      type="color"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="h-10 w-16 rounded-lg cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
                    />
                    <div className="absolute inset-0 rounded-lg border border-gray-200 pointer-events-none"></div>
                  </div>
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 uppercase">{color}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 flex-shrink-0">
            <button 
              onClick={handleProcess}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center ${
                isProcessing
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                  : 'bg-pdf-red hover:bg-red-600 text-white hover:scale-[1.02]'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  处理中...
                </>
              ) : (
                <>
                  <Download className="w-6 h-6 mr-2" />
                  生成并下载 PDF
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
