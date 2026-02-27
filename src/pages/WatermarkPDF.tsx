import { useState, useEffect, useCallback, useRef } from 'react';
import { PDFDocument, rgb, degrees, StandardFonts, BlendMode } from 'pdf-lib';
import { Loader2, Download, ArrowLeft, Type, LayoutGrid, AlignCenter, Layers, MoveDown, MoveUp } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import { addHistoryRecord } from '../db';
import FontManager from '../utils/FontManager';

interface WatermarkPDFProps {
  onBack: () => void;
}

export default function WatermarkPDF({ onBack }: WatermarkPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [watermarkText, setWatermarkText] = useState('机密文件\nConfidential');
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState('#ff0000');
  const [opacity, setOpacity] = useState(0.3);
  const [rotation, setRotation] = useState(45);
  const [layoutMode, setLayoutMode] = useState<'center' | 'tiled'>('tiled');
  const [layer, setLayer] = useState<'over' | 'under'>('over');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [watermarkedPdfUrl, setWatermarkedPdfUrl] = useState<string | null>(null);
  
  const [isFontLoading, setIsFontLoading] = useState(true);
  const [fontLoadError, setFontLoadError] = useState(false);
  
  const [firstPageBytes, setFirstPageBytes] = useState<Uint8Array | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewGenerating, setIsPreviewGenerating] = useState(false);

  // Preload font
  useEffect(() => {
    const loadFont = async () => {
      setIsFontLoading(true);
      const bytes = await FontManager.getFontBytes();
      if (!bytes) {
        setFontLoadError(true);
      }
      setIsFontLoading(false);
    };
    loadFont();
  }, []);

  // Extract first page for fast preview
  useEffect(() => {
    if (!file) {
      setFirstPageBytes(null);
      return;
    }
    
    const extractFirstPage = async () => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const previewPdf = await PDFDocument.create();
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
    if (!firstPageBytes || isFontLoading) return;
    
    setIsPreviewGenerating(true);
    try {
      const pdf = await PDFDocument.load(firstPageBytes);
      const customFont = await FontManager.embedFont(pdf);
      
      const page = pdf.getPages()[0];
      await applyWatermarkToPage(page, customFont, pdf);
      
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
  }, [firstPageBytes, isFontLoading, watermarkText, fontSize, color, opacity, rotation, layoutMode, layer]);

  // Debounce preview generation
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

  const applyWatermarkToPage = async (page: any, customFont: any, pdfDoc: PDFDocument) => {
    const { width, height } = page.getSize();
    const rgbColor = hexToRgb(color);
    const lines = watermarkText.split('\n');

    // Canvas Fallback Logic
    if (fontLoadError) {
      // Create a hidden canvas
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Calculate dimensions needed for the canvas
      // We need to make it large enough to hold the rotated text
      // A safe bet is to make it as large as the diagonal of the page
      const diag = Math.sqrt(width * width + height * height);
      canvas.width = diag;
      canvas.height = diag;

      // Clear canvas (transparent background)
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Set styles
      ctx.font = `${fontSize}px "Microsoft YaHei", "PingFang SC", sans-serif`;
      ctx.fillStyle = `rgba(${rgbColor.r * 255}, ${rgbColor.g * 255}, ${rgbColor.b * 255}, ${opacity})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Calculate line height
      const lineHeight = fontSize * 1.2;
      const totalHeight = lineHeight * lines.length;

      // Helper to draw multiline text at a specific center point on canvas
      const drawMultilineTextOnCanvas = (centerX: number, centerY: number) => {
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        
        const startY = -(totalHeight / 2) + (lineHeight / 2);
        
        lines.forEach((line, index) => {
          ctx.fillText(line, 0, startY + (index * lineHeight));
        });
        
        ctx.restore();
      };

      if (layoutMode === 'center') {
        drawMultilineTextOnCanvas(canvas.width / 2, canvas.height / 2);
      } else {
        // Tiled mode on canvas
        // Calculate max line width for step calculation
        let maxLineWidth = 0;
        lines.forEach(line => {
          const metrics = ctx.measureText(line);
          if (metrics.width > maxLineWidth) maxLineWidth = metrics.width;
        });

        const stepX = Math.max(maxLineWidth * 1.5, 150);
        const stepY = Math.max(totalHeight * 2, 150);
        
        for (let x = 0; x < canvas.width; x += stepX) {
          for (let y = 0; y < canvas.height; y += stepY) {
            const staggerX = (Math.floor(y / stepY) % 2 === 0) ? 0 : stepX / 2;
            drawMultilineTextOnCanvas(x + staggerX, y);
          }
        }
      }

      // Export canvas to PNG
      const dataUrl = canvas.toDataURL('image/png');
      
      // Embed PNG into PDF
      const pngImage = await pdfDoc.embedPng(dataUrl);
      
      // Draw the image onto the page
      // Since the canvas is sized to the diagonal, we need to center it on the page
      const imgWidth = diag;
      const imgHeight = diag;
      
      page.drawImage(pngImage, {
        x: width / 2 - imgWidth / 2,
        y: height / 2 - imgHeight / 2,
        width: imgWidth,
        height: imgHeight,
        blendMode: layer === 'under' ? BlendMode.Multiply : BlendMode.Normal,
      });

      return;
    }

    // Standard pdf-lib text drawing (when font is successfully loaded)
    let maxLineWidth = 0;
    lines.forEach(line => {
      const lineWidth = customFont.widthOfTextAtSize(line, fontSize);
      if (lineWidth > maxLineWidth) maxLineWidth = lineWidth;
    });
    
    const lineHeight = customFont.heightAtSize(fontSize);
    const totalHeight = lineHeight * lines.length;
    
    const drawOptions = {
      font: customFont,
      size: fontSize,
      color: rgb(rgbColor.r, rgbColor.g, rgbColor.b),
      opacity: opacity,
      rotate: degrees(rotation),
      blendMode: layer === 'under' ? BlendMode.Multiply : BlendMode.Normal,
    };

    // Helper to draw multiline text at a specific center point
    const drawMultilineText = (centerX: number, centerY: number) => {
      // Adjust starting Y so the whole block is centered
      // pdf-lib draws text from the bottom-left of the first character
      const startY = centerY + (totalHeight / 2) - lineHeight + (lineHeight * 0.2); // slight baseline adjustment
      
      lines.forEach((line, index) => {
        const lineWidth = customFont.widthOfTextAtSize(line, fontSize);
        
        // Calculate offset for rotation
        const offsetX = -lineWidth / 2;
        const offsetY = (totalHeight / 2) - (index * lineHeight) - lineHeight;
        
        // Apply rotation matrix to the offset
        const rad = (rotation * Math.PI) / 180;
        const rotatedX = offsetX * Math.cos(rad) - offsetY * Math.sin(rad);
        const rotatedY = offsetX * Math.sin(rad) + offsetY * Math.cos(rad);

        page.drawText(line, {
          x: centerX + rotatedX,
          y: centerY + rotatedY,
          ...drawOptions
        });
      });
    };

    if (layoutMode === 'center') {
      drawMultilineText(width / 2, height / 2);
    } else {
      // Tiled mode
      const stepX = Math.max(maxLineWidth * 1.5, 150);
      const stepY = Math.max(totalHeight * 2, 150);
      
      // Calculate diagonal bounds to ensure coverage when rotated
      const diag = Math.sqrt(width * width + height * height);
      const startX = (width - diag) / 2;
      const startY = (height - diag) / 2;
      const endX = startX + diag;
      const endY = startY + diag;

      for (let x = startX; x < endX; x += stepX) {
        for (let y = startY; y < endY; y += stepY) {
          // Stagger rows
          const staggerX = (Math.floor(y / stepY) % 2 === 0) ? 0 : stepX / 2;
          drawMultilineText(x + staggerX, y);
        }
      }
    }
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setWatermarkedPdfUrl(null);
    }
  };

  const handleAddWatermark = async () => {
    if (!file) return;
    if (!watermarkText.trim()) {
      alert('请输入水印文本。');
      return;
    }

    setIsProcessing(true);
    setWatermarkedPdfUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      const customFont = await FontManager.embedFont(pdf);
      const pages = pdf.getPages();

      for (const page of pages) {
        await applyWatermarkToPage(page, customFont, pdf);
      }

      const watermarkedPdfBytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([watermarkedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setWatermarkedPdfUrl(url);

      const fileName = `watermarked_${file.name}`;

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
        operationType: '水印',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (error) {
      console.error('Error adding watermark:', error);
      alert('添加水印时出错，请重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file && !watermarkedPdfUrl) {
    return (
      <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回工具列表
          </button>
        </div>
        <FileUploader 
          title="添加水印" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      </div>
    );
  }

  if (watermarkedPdfUrl && !isProcessing) {
    return (
      <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回工具列表
          </button>
        </div>
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-6">
            <Download className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">处理成功！</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
            您的 PDF 文件已成功添加水印。如果没有自动下载，请点击下方按钮手动下载。
          </p>
          <div className="flex space-x-4">
            <a 
              href={watermarkedPdfUrl} 
              download={`watermarked_${file?.name || 'document.pdf'}`}
              className="bg-pdf-red hover:bg-pdf-red-hover text-white text-lg font-bold py-3 px-8 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              下载带水印的 PDF
            </a>
            <button 
              onClick={() => {
                setWatermarkedPdfUrl(null);
                setFile(null);
              }}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-lg font-bold py-3 px-8 rounded-xl transition-colors"
            >
              继续添加水印
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-6 transition-colors h-full flex flex-col">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 mb-4 flex-shrink-0">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回工具列表
        </button>
      </div>

      {isFontLoading && (
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-4 py-3 rounded-xl flex items-center">
            <Loader2 className="w-5 h-5 animate-spin mr-3" />
            <span>正在加载中文字体库，请稍候...</span>
          </div>
        </div>
      )}

      {fontLoadError && (
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 mb-4">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400 px-4 py-3 rounded-xl flex items-center">
            <Type className="w-5 h-5 mr-3" />
            <span>中文字体库加载失败，将使用系统默认字体（中文字符可能无法正常显示）。</span>
          </div>
        </div>
      )}

      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col lg:flex-row gap-6 min-h-0 pb-6">
        {/* Left: Preview Panel */}
        <div className="flex-1 bg-gray-200 dark:bg-gray-800 rounded-2xl border border-gray-300 dark:border-gray-700 overflow-hidden flex flex-col relative min-h-[500px]">
          <div className="bg-gray-100 dark:bg-gray-900 px-4 py-3 border-b border-gray-300 dark:border-gray-700 flex justify-between items-center z-10">
            <span className="font-medium text-gray-700 dark:text-gray-300">实时预览 (第一页)</span>
            {isPreviewGenerating && <Loader2 className="w-4 h-4 animate-spin text-gray-500" />}
          </div>
          <div className="flex-1 relative overflow-auto flex items-center justify-center p-4 bg-gray-200/50 dark:bg-gray-800/50">
            {previewUrl ? (
              <iframe 
                src={`${previewUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                className="w-full h-full max-w-full max-h-full shadow-lg bg-white"
                style={{ aspectRatio: '1/1.414', maxHeight: '100%', maxWidth: '100%' }}
                title="PDF Preview"
              />
            ) : (
              <div className="flex flex-col items-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <span>生成预览中...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Configuration Panel */}
        <div className="w-full lg:w-[400px] xl:w-[450px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <Type className="w-5 h-5 mr-2 text-pdf-red" />
              水印设置
            </h2>
          </div>
          
          <div className="p-6 overflow-y-auto flex-grow space-y-6">
            {/* Watermark Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                水印内容
              </label>
              <textarea
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="支持中英文混合输入"
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pdf-red focus:border-pdf-red outline-none transition-all resize-none"
              />
            </div>

            {/* Font Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">字体设置</h3>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">字体大小</label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="100"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pdf-red"
                />
              </div>

              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">字体颜色</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-14 rounded cursor-pointer border-0 p-0 bg-transparent"
                  />
                  <span className="text-sm font-mono text-gray-600 dark:text-gray-400 uppercase">{color}</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Appearance Settings */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">外观设置</h3>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">透明度</label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{Math.round(opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={opacity}
                  onChange={(e) => setOpacity(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pdf-red"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm text-gray-600 dark:text-gray-400">旋转角度</label>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-90"
                  max="90"
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-pdf-red"
                />
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Layout Mode */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">布局模式</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLayoutMode('center')}
                  className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl border-2 transition-all ${
                    layoutMode === 'center' 
                      ? 'border-pdf-red bg-red-50 dark:bg-red-900/20 text-pdf-red' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <AlignCenter className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">单一居中</span>
                </button>
                <button
                  onClick={() => setLayoutMode('tiled')}
                  className={`flex flex-col items-center justify-center py-3 px-4 rounded-xl border-2 transition-all ${
                    layoutMode === 'tiled' 
                      ? 'border-pdf-red bg-red-50 dark:bg-red-900/20 text-pdf-red' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <LayoutGrid className="w-6 h-6 mb-2" />
                  <span className="text-sm font-medium">全屏铺满</span>
                </button>
              </div>
            </div>

            {/* Layer Selection */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider">层级选择</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setLayer('over')}
                  className={`flex items-center justify-center py-2 px-4 rounded-xl border-2 transition-all ${
                    layer === 'over' 
                      ? 'border-pdf-red bg-red-50 dark:bg-red-900/20 text-pdf-red' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <MoveUp className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">内容之上</span>
                </button>
                <button
                  onClick={() => setLayer('under')}
                  className={`flex items-center justify-center py-2 px-4 rounded-xl border-2 transition-all ${
                    layer === 'under' 
                      ? 'border-pdf-red bg-red-50 dark:bg-red-900/20 text-pdf-red' 
                      : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <MoveDown className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">内容之下</span>
                </button>
              </div>
            </div>

          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex-shrink-0">
            <button 
              onClick={handleAddWatermark}
              disabled={isProcessing || isFontLoading}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-md transition-all flex items-center justify-center ${
                isProcessing || isFontLoading
                  ? 'bg-gray-400 text-white cursor-not-allowed' 
                  : 'bg-pdf-red hover:bg-pdf-red-hover text-white hover:scale-[1.02]'
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
