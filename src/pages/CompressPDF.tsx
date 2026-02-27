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
    <div className="flex-grow bg-gray-50 dark:bg-slate-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
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
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">压缩 PDF</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-full mb-6">
              <Minimize2 className="w-12 h-12 text-pdf-red" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">选择压缩等级</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
              当前文件：<span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span> ({formatFileSize(file.size)})
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-8">
              <button 
                onClick={() => setLevel('fast')}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                  level === 'fast' ? 'border-pdf-red bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-pdf-red dark:hover:border-pdf-red'
                }`}
              >
                <span className={`font-bold text-lg mb-2 ${level === 'fast' ? 'text-pdf-red' : 'text-gray-800 dark:text-gray-200'}`}>极速压缩</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">高压缩率，质量较低</span>
              </button>
              <button 
                onClick={() => setLevel('recommended')}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all relative ${
                  level === 'recommended' ? 'border-pdf-red bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-pdf-red dark:hover:border-pdf-red'
                }`}
              >
                <div className="absolute -top-3 bg-pdf-red text-white text-xs font-bold px-3 py-1 rounded-full">推荐</div>
                <span className={`font-bold text-lg mb-2 ${level === 'recommended' ? 'text-pdf-red' : 'text-gray-800 dark:text-gray-200'}`}>推荐压缩</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">良好的质量与压缩率平衡</span>
              </button>
              <button 
                onClick={() => setLevel('lossless')}
                className={`flex flex-col items-center justify-center p-6 border-2 rounded-xl transition-all ${
                  level === 'lossless' ? 'border-pdf-red bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-pdf-red dark:hover:border-pdf-red'
                }`}
              >
                <span className={`font-bold text-lg mb-2 ${level === 'lossless' ? 'text-pdf-red' : 'text-gray-800 dark:text-gray-200'}`}>无损压缩</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 text-center">仅优化元数据，保持最高质量</span>
              </button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm px-4 py-3 rounded-lg mb-8 flex items-start w-full max-w-3xl">
              <CheckCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
              <p>所有处理均在您的浏览器本地完成，文件不会上传到任何服务器，100% 保护您的隐私安全。</p>
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={handleCompress}
                className="bg-pdf-red hover:bg-pdf-red-hover text-white text-lg font-bold py-3 px-12 rounded-xl shadow-md transition-transform hover:scale-105"
              >
                压缩 PDF
              </button>
              <button 
                onClick={() => setFile(null)}
                className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-lg font-bold py-3 px-8 rounded-xl transition-colors"
              >
                重新选择文件
              </button>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-16 h-16 text-pdf-red animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">正在压缩您的 PDF...</h2>
          <p className="text-gray-500 dark:text-gray-400">这可能需要几秒钟的时间，请稍候。</p>
        </div>
      )}

      {compressedPdfUrl && !isProcessing && stats && (
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-6">
            <Download className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">压缩成功！</h2>
          
          <div className="flex items-center justify-center space-x-6 mb-8 bg-gray-50 dark:bg-slate-900/50 p-6 rounded-2xl w-full max-w-2xl">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">原始大小</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-200">{formatFileSize(stats.original)}</p>
            </div>
            <div className="text-gray-400 dark:text-gray-600">
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">压缩后</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{formatFileSize(stats.compressed)}</p>
            </div>
            <div className="text-gray-400 dark:text-gray-600">
              <ArrowLeft className="w-6 h-6 rotate-180" />
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">节省</p>
              <p className="text-xl font-bold text-pdf-red">
                {Math.max(0, Math.round((1 - stats.compressed / stats.original) * 100))}%
              </p>
            </div>
          </div>

          <div className="flex space-x-4">
            <a 
              href={compressedPdfUrl} 
              download={`compressed_${file?.name || 'document.pdf'}`}
              className="bg-pdf-red hover:bg-pdf-red-hover text-white text-lg font-bold py-3 px-8 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              下载压缩后的 PDF
            </a>
            <button 
              onClick={() => {
                setCompressedPdfUrl(null);
                setFile(null);
                setStats(null);
              }}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-lg font-bold py-3 px-8 rounded-xl transition-colors"
            >
              继续压缩
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
