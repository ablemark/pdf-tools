import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Loader2, Download, ArrowLeft, Minimize2, CheckCircle } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import { addHistoryRecord } from '../db';

interface CompressPDFProps {
  onBack: () => void;
}

type CompressionLevel = 'fast' | 'recommended' | 'lossless';

export default function CompressPDF({ onBack }: CompressPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<CompressionLevel>('recommended');
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressedPdfUrl, setCompressedPdfUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<{ original: number; compressed: number } | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const handleCompress = async () => {
    if (!file) return;

    setIsProcessing(true);
    setCompressedPdfUrl(null);
    setStats(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      
      if (level === 'fast' || level === 'recommended') {
        const pages = pdf.getPages();
        const scaleFactor = level === 'fast' ? 0.8 : 0.9;
        
        for (const page of pages) {
          page.scale(scaleFactor, scaleFactor);
        }
      }

      const compressedPdfBytes = await pdf.save({ useObjectStreams: true });
      const blob = new Blob([compressedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setCompressedPdfUrl(url);
      setStats({
        original: file.size,
        compressed: blob.size
      });

      const fileName = `compressed_${file.name}`;

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
        operationType: '压缩',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (error) {
      console.error('Error compressing PDF:', error);
      alert('压缩 PDF 时出错，请重试。');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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

      {!file && !isProcessing && !compressedPdfUrl && (
        <FileUploader 
          title="压缩 PDF" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      )}

      {file && !isProcessing && !compressedPdfUrl && (
        <div className="w-full max-w-4xl mx-auto p-6">
          <h2 className="text-4xl font-black text-center text-gray-800 dark:text-zinc-100 mb-10 tracking-tight">压缩 PDF</h2>
          <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-white/5 p-12 flex flex-col items-center glass">
            <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-8">
              <Minimize2 className="w-16 h-16 text-pdf-red" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-zinc-100 mb-3 tracking-tight">选择压缩等级</h3>
            <p className="text-gray-500 dark:text-zinc-500 mb-10 text-center max-w-md font-medium">
              当前文件：<span className="font-bold text-gray-700 dark:text-zinc-300">{file.name}</span> ({formatFileSize(file.size)})
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl mb-10">
              <button 
                onClick={() => setLevel('fast')}
                className={`flex flex-col items-center justify-center p-8 border-2 rounded-2xl transition-all ${
                  level === 'fast' ? 'border-pdf-red bg-red-50 dark:bg-white/5 dark:border-violet-500' : 'border-gray-200 dark:border-white/5 hover:border-pdf-red dark:hover:border-violet-500'
                }`}
              >
                <span className={`font-black text-xl mb-2 tracking-tight ${level === 'fast' ? 'text-pdf-red dark:text-violet-400' : 'text-gray-800 dark:text-zinc-200'}`}>极速压缩</span>
                <span className="text-sm text-gray-500 dark:text-zinc-500 text-center font-medium">高压缩率，质量较低</span>
              </button>
              <button 
                onClick={() => setLevel('recommended')}
                className={`flex flex-col items-center justify-center p-8 border-2 rounded-2xl transition-all relative ${
                  level === 'recommended' ? 'border-pdf-red bg-red-50 dark:bg-white/5 dark:border-violet-500' : 'border-gray-200 dark:border-white/5 hover:border-pdf-red dark:hover:border-violet-500'
                }`}
              >
                <div className="absolute -top-3 bg-pdf-red dark:btn-neon text-white text-xs font-black px-4 py-1.5 rounded-full shadow-lg tracking-tight">推荐</div>
                <span className={`font-black text-xl mb-2 tracking-tight ${level === 'recommended' ? 'text-pdf-red dark:text-violet-400' : 'text-gray-800 dark:text-zinc-200'}`}>推荐压缩</span>
                <span className="text-sm text-gray-500 dark:text-zinc-500 text-center font-medium">良好的质量与压缩率平衡</span>
              </button>
              <button 
                onClick={() => setLevel('lossless')}
                className={`flex flex-col items-center justify-center p-8 border-2 rounded-2xl transition-all ${
                  level === 'lossless' ? 'border-pdf-red bg-red-50 dark:bg-white/5 dark:border-violet-500' : 'border-gray-200 dark:border-white/5 hover:border-pdf-red dark:hover:border-violet-500'
                }`}
              >
                <span className={`font-black text-xl mb-2 tracking-tight ${level === 'lossless' ? 'text-pdf-red dark:text-violet-400' : 'text-gray-800 dark:text-zinc-200'}`}>无损压缩</span>
                <span className="text-sm text-gray-500 dark:text-zinc-500 text-center font-medium">仅优化元数据，保持最高质量</span>
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-white/5 text-blue-800 dark:text-blue-300 text-sm px-6 py-4 rounded-2xl mb-10 flex items-start w-full max-w-3xl border border-blue-100 dark:border-white/5">
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
              <p className="font-medium">所有处理均在您的浏览器本地完成，文件不会上传到任何服务器，100% 保护您的隐私安全。</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={handleCompress}
                className="flex-1 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
              >
                压缩 PDF
              </button>
              <button 
                onClick={() => setFile(null)}
                className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 text-lg font-bold py-4 px-8 rounded-2xl transition-all"
              >
                重新选择文件
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-20 h-20 text-pdf-red dark:text-cyan-400 animate-spin mb-8" />
          <h2 className="text-3xl font-black text-gray-800 dark:text-zinc-100 mb-4 tracking-tight">正在压缩您的 PDF...</h2>
          <p className="text-gray-500 dark:text-zinc-500 font-medium">这可能需要几秒钟的时间，请稍候。</p>
        </div>
      )}

      {compressedPdfUrl && !isProcessing && stats && (
        <div className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 glass animate-in fade-in zoom-in duration-500">
          <div className="bg-green-100 dark:bg-green-900/20 p-8 rounded-full mb-10">
            <Download className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-4xl font-black text-gray-800 dark:text-zinc-100 mb-6 tracking-tight">压缩成功！</h2>
          
          <div className="flex items-center justify-center space-x-8 mb-12 bg-gray-50 dark:bg-white/5 p-8 rounded-[2rem] w-full max-w-2xl border border-gray-100 dark:border-white/5">
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2 font-bold uppercase tracking-widest">原始大小</p>
              <p className="text-2xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">{formatFileSize(stats.original)}</p>
            </div>
            <div className="text-gray-300 dark:text-zinc-700">
              <ArrowLeft className="w-8 h-8 rotate-180" />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2 font-bold uppercase tracking-widest">压缩后</p>
              <p className="text-2xl font-black text-green-600 dark:text-green-400 tracking-tight">{formatFileSize(stats.compressed)}</p>
            </div>
            <div className="text-gray-300 dark:text-zinc-700">
              <ArrowLeft className="w-8 h-8 rotate-180" />
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2 font-bold uppercase tracking-widest">节省空间</p>
              <p className="text-3xl font-black text-pdf-red dark:text-violet-400 tracking-tighter">
                {Math.max(0, Math.round((1 - stats.compressed / stats.original) * 100))}%
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
            <a 
              href={compressedPdfUrl} 
              download={`compressed_${file?.name || 'document.pdf'}`}
              className="flex-1 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center"
            >
              <Download className="w-6 h-6 mr-3" />
              下载 PDF
            </a>
            <button 
              onClick={() => {
                setCompressedPdfUrl(null);
                setFile(null);
                setStats(null);
              }}
              className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 text-xl font-bold py-5 px-8 rounded-2xl transition-all"
            >
              继续压缩
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
