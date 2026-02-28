import { useState, useEffect, useRef, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Loader2, 
  Download, 
  ArrowLeft, 
  Image as ImageIcon, 
  Settings, 
  CheckSquare, 
  Square, 
  Zap, 
  Monitor, 
  Printer, 
  CheckCircle2,
  AlertCircle,
  Layers
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import PageThumbnail from '../components/PageThumbnail';
import { addHistoryRecord } from '../db';

// Configure worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PdfToImageProps {
  onBack: () => void;
}

export default function PdfToImage({ onBack }: PdfToImageProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultFileName, setResultFileName] = useState<string>('');
  
  // Selection State
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  
  // Settings
  const [format, setFormat] = useState<'jpg' | 'png'>('jpg');
  const [scale, setScale] = useState<number>(1); // 1x, 2x, 3x
  const [quality, setQuality] = useState<number>(0.9);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setResultUrl(null);
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        
        // Default select all pages
        const allPages = new Set<number>();
        for (let i = 1; i <= pdf.numPages; i++) {
          allPages.add(i);
        }
        setSelectedPages(allPages);
      } catch (error) {
        console.error('Error loading PDF:', error);
        alert('无法加载 PDF 文件，请检查文件是否损坏。');
      }
    }
  };

  const togglePage = (pageNumber: number) => {
    setSelectedPages(prev => {
      const next = new Set(prev);
      if (next.has(pageNumber)) {
        next.delete(pageNumber);
      } else {
        next.add(pageNumber);
      }
      return next;
    });
  };

  const selectAll = () => {
    if (!pdfDoc) return;
    const all = new Set<number>();
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      all.add(i);
    }
    setSelectedPages(all);
  };

  const selectNone = () => {
    setSelectedPages(new Set());
  };

  const selectOdd = () => {
    if (!pdfDoc) return;
    const odd = new Set<number>();
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      if (i % 2 !== 0) odd.add(i);
    }
    setSelectedPages(odd);
  };

  const selectEven = () => {
    if (!pdfDoc) return;
    const even = new Set<number>();
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      if (i % 2 === 0) even.add(i);
    }
    setSelectedPages(even);
  };

  const handleConvert = async () => {
    if (!file || !pdfDoc || selectedPages.size === 0) return;

    setIsProcessing(true);
    setResultUrl(null);
    setProgress({ current: 0, total: selectedPages.size });

    try {
      const zip = new JSZip();
      const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
      
      let processedCount = 0;
      for (const pageNum of sortedPages) {
        const page = await pdfDoc.getPage(pageNum);
        // Standard PDF is 72 DPI. scale=1 is 72 DPI, scale=2 is 144 DPI, scale=3 is 216 DPI (approx 300 for print)
        const viewport = page.getViewport({ scale: scale });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        if (!context) continue;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        // Fill white background for JPG
        if (format === 'jpg') {
          context.fillStyle = '#ffffff';
          context.fillRect(0, 0, canvas.width, canvas.height);
        }

        await page.render({
          canvasContext: context as any,
          viewport: viewport,
          canvas: canvas as any,
        }).promise;

        const mimeType = format === 'jpg' ? 'image/jpeg' : 'image/png';
        const dataUrl = canvas.toDataURL(mimeType, format === 'jpg' ? quality : undefined);
        const base64Data = dataUrl.split(',')[1];
        
        zip.file(`page-${pageNum}.${format}`, base64Data, { base64: true });
        
        processedCount++;
        setProgress(prev => ({ ...prev, current: processedCount }));
        
        // Small delay to allow UI to breathe
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      const finalFileName = `${file.name.replace('.pdf', '')}_images.zip`;
      const finalBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(finalBlob);
      
      setResultUrl(url);
      setResultFileName(finalFileName);

      // Auto download
      saveAs(finalBlob, finalFileName);

      // Save history
      await addHistoryRecord({
        fileName: finalFileName,
        operationType: '转图片',
        timestamp: Date.now(),
        fileSize: finalBlob.size,
        status: 'success',
        blob: finalBlob
      });

    } catch (error) {
      console.error('Error converting PDF to images:', error);
      alert('转换 PDF 时出错，请重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-grow py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-violet-400 transition-colors font-bold group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          返回工具列表
        </button>
      </div>

      {!file && !isProcessing && !resultUrl && (
        <FileUploader 
          title="PDF 转图片" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      )}

      {file && pdfDoc && !isProcessing && !resultUrl && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Page Selection Grid */}
            <div className="flex-grow space-y-6">
              <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-8 glass">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">选择页面</h2>
                    <p className="text-sm text-gray-500 dark:text-zinc-500">已选择 {selectedPages.size} / {pdfDoc.numPages} 页</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button 
                      onClick={selectAll}
                      className="px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 rounded-xl transition-all"
                    >
                      全选
                    </button>
                    <button 
                      onClick={selectNone}
                      className="px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 rounded-xl transition-all"
                    >
                      取消全选
                    </button>
                    <button 
                      onClick={selectOdd}
                      className="px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 rounded-xl transition-all"
                    >
                      奇数页
                    </button>
                    <button 
                      onClick={selectEven}
                      className="px-4 py-2 text-xs font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 rounded-xl transition-all"
                    >
                      偶数页
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {Array.from({ length: pdfDoc.numPages }).map((_, i) => (
                    <PageThumbnail
                      key={i + 1}
                      pdf={pdfDoc}
                      pageNumber={i + 1}
                      isSelected={selectedPages.has(i + 1)}
                      onToggle={togglePage}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Settings Panel */}
            <div className="w-full lg:w-80 flex-shrink-0">
              <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-8 glass sticky top-6">
                <div className="flex items-center mb-8">
                  <Settings className="w-5 h-5 text-violet-500 mr-2" />
                  <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100">导出设置</h3>
                </div>

                <div className="space-y-8">
                  {/* Format */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-4">图片格式</label>
                    <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl">
                      <button
                        onClick={() => setFormat('jpg')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                          format === 'jpg' ? 'bg-white dark:bg-white/10 text-pdf-red dark:text-violet-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                        }`}
                      >
                        JPG
                      </button>
                      <button
                        onClick={() => setFormat('png')}
                        className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
                          format === 'png' ? 'bg-white dark:bg-white/10 text-pdf-red dark:text-violet-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:text-zinc-500 dark:hover:text-zinc-300'
                        }`}
                      >
                        PNG
                      </button>
                    </div>
                  </div>

                  {/* DPI / Scale */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-4">清晰度 (DPI)</label>
                    <div className="space-y-3">
                      {[
                        { val: 1, label: '标准 (1x)', icon: <Monitor className="w-4 h-4" />, desc: '适合屏幕查看' },
                        { val: 2, label: '高清 (2x)', icon: <Zap className="w-4 h-4" />, desc: '适合普通打印' },
                        { val: 3, label: '超清 (3x)', icon: <Printer className="w-4 h-4" />, desc: '专业印刷级' },
                      ].map((item) => (
                        <button
                          key={item.val}
                          onClick={() => setScale(item.val)}
                          className={`w-full flex items-center p-4 rounded-2xl border-2 transition-all text-left ${
                            scale === item.val 
                              ? 'border-pdf-red dark:border-violet-500 bg-red-50 dark:bg-violet-500/10 text-pdf-red dark:text-violet-400' 
                              : 'border-gray-100 dark:border-white/5 text-gray-600 dark:text-zinc-500 hover:border-gray-200 dark:hover:border-white/10'
                          }`}
                        >
                          <div className={`p-2 rounded-xl mr-4 ${scale === item.val ? 'bg-pdf-red dark:bg-violet-500 text-white' : 'bg-gray-100 dark:bg-white/5'}`}>
                            {item.icon}
                          </div>
                          <div>
                            <div className="text-sm font-bold">{item.label}</div>
                            <div className="text-[10px] opacity-70 font-medium">{item.desc}</div>
                          </div>
                          {scale === item.val && <CheckCircle2 className="w-4 h-4 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* JPG Quality Slider */}
                  {format === 'jpg' && (
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <label className="text-sm font-bold text-gray-700 dark:text-zinc-400">压缩质量</label>
                        <span className="text-xs font-bold text-pdf-red dark:text-violet-400">{Math.round(quality * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0.1" 
                        max="1.0" 
                        step="0.1" 
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-2 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-pdf-red dark:accent-violet-500"
                      />
                      <div className="flex justify-between text-[10px] text-gray-400 dark:text-zinc-600 mt-2 font-medium">
                        <span>高压缩</span>
                        <span>高质量</span>
                      </div>
                    </div>
                  )}

                  <div className="pt-6 space-y-4">
                    <button 
                      disabled={selectedPages.size === 0}
                      onClick={handleConvert}
                      className="w-full bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold py-4 rounded-2xl shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center"
                    >
                      <ImageIcon className="w-5 h-5 mr-2" />
                      开始转换
                    </button>
                    <button 
                      onClick={() => {
                        setFile(null);
                        setPdfDoc(null);
                        setSelectedPages(new Set());
                      }}
                      className="w-full text-gray-500 dark:text-zinc-500 text-sm font-bold hover:text-pdf-red dark:hover:text-violet-400 transition-colors"
                    >
                      重新选择文件
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative mb-10">
            <Loader2 className="w-24 h-24 text-pdf-red dark:text-cyan-400 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-sm font-black text-pdf-red dark:text-cyan-400">{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-gray-800 dark:text-zinc-100 mb-6 tracking-tight">正在生成高清图片...</h2>
          
          <div className="w-full max-w-md bg-gray-200 dark:bg-white/5 rounded-full h-4 mb-6 overflow-hidden shadow-inner">
            <div 
              className="bg-pdf-red dark:progress-neon h-4 rounded-full transition-all duration-500 ease-out shadow-lg"
              style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
            ></div>
          </div>
          <div className="flex items-center text-gray-500 dark:text-zinc-400 font-bold bg-white dark:bg-white/5 px-6 py-3 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm backdrop-blur-xl">
            <Layers className="w-5 h-5 mr-3 text-violet-500" />
            正在处理: 第 {progress.current} / {progress.total} 页
          </div>
          <p className="mt-8 text-sm text-gray-400 dark:text-zinc-500 max-w-xs text-center font-medium">
            正在使用 {scale}x 渲染引擎，这可能需要一点时间，请保持页面开启。
          </p>
        </div>
      )}

      {resultUrl && !isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in duration-500">
          <div className="bg-green-100 dark:bg-green-900/20 p-8 rounded-full mb-10">
            <CheckCircle2 className="w-20 h-20 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-4xl font-black text-gray-800 dark:text-zinc-100 mb-4 tracking-tight">转换成功！</h2>
          <p className="text-gray-500 dark:text-zinc-500 mb-10 text-center max-w-md font-medium">
            您的 PDF 页面已成功转换为高清图片并打包。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
            <button 
              onClick={() => saveAs(resultUrl, resultFileName)}
              className="flex-1 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-xl font-bold py-5 rounded-[1.5rem] shadow-xl transition-all hover:scale-105 flex items-center justify-center"
            >
              <Download className="w-6 h-6 mr-3" />
              下载 ZIP 包
            </button>
            <button 
              onClick={() => {
                setResultUrl(null);
                setFile(null);
                setPdfDoc(null);
              }}
              className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 text-xl font-bold py-5 rounded-[1.5rem] transition-all"
            >
              继续转换
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
