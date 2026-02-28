import { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Loader2, Download, ArrowLeft, Settings } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import { addHistoryRecord } from '../db';

interface SplitPDFProps {
  onBack: () => void;
}

export default function SplitPDF({ onBack }: SplitPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageRange, setPageRange] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [splitPdfUrl, setSplitPdfUrl] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
    }
  };

  const parsePageRange = (rangeStr: string, totalPages: number): number[] => {
    const pages = new Set<number>();
    const parts = rangeStr.split(',').map(p => p.trim());

    for (const part of parts) {
      if (part.includes('-')) {
        const [start, end] = part.split('-').map(Number);
        if (!isNaN(start) && !isNaN(end) && start <= end) {
          for (let i = start; i <= end; i++) {
            if (i > 0 && i <= totalPages) {
              pages.add(i - 1); // 0-indexed
            }
          }
        }
      } else {
        const pageNum = Number(part);
        if (!isNaN(pageNum) && pageNum > 0 && pageNum <= totalPages) {
          pages.add(pageNum - 1); // 0-indexed
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file) return;
    if (!pageRange.trim()) {
      alert('请输入想要提取的页码范围。');
      return;
    }

    setIsProcessing(true);
    setSplitPdfUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const totalPages = pdf.getPageCount();

      const pagesToExtract = parsePageRange(pageRange, totalPages);

      if (pagesToExtract.length === 0) {
        alert('无效的页码范围，请检查后重试。');
        setIsProcessing(false);
        return;
      }

      const newPdf = await PDFDocument.create();
      const copiedPages = await newPdf.copyPages(pdf, pagesToExtract);
      copiedPages.forEach((page) => newPdf.addPage(page));

      const splitPdfBytes = await newPdf.save();
      const blob = new Blob([splitPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setSplitPdfUrl(url);

      const fileName = `split_${file.name}`;

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
        operationType: '拆分',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('拆分 PDF 时出错，请重试。');
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

      {!file && !isProcessing && !splitPdfUrl && (
        <FileUploader 
          title="拆分 PDF" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      )}

      {file && !isProcessing && !splitPdfUrl && (
        <div className="w-full max-w-4xl mx-auto p-6">
          <h2 className="text-4xl font-black text-center text-gray-800 dark:text-zinc-100 mb-10 tracking-tight">拆分 PDF</h2>
          <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-sm border border-gray-200 dark:border-white/5 p-12 flex flex-col items-center glass">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-8">
              <Settings className="w-16 h-16 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-zinc-100 mb-3 tracking-tight">设置提取范围</h3>
            <p className="text-gray-500 dark:text-zinc-500 mb-10 text-center max-w-md font-medium">
              当前文件：<span className="font-bold text-gray-700 dark:text-zinc-300">{file.name}</span>
            </p>
            
            <div className="w-full max-w-md mb-10">
              <label htmlFor="pageRange" className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-3">
                输入页码范围（例如：“1-3” 或 “5,7,9”）
              </label>
              <input
                type="text"
                id="pageRange"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="例如：1-5, 8, 11-13"
                className="w-full px-6 py-4 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-900 dark:text-zinc-100 rounded-2xl focus:ring-2 focus:ring-pdf-red dark:focus:ring-violet-500 outline-none transition-all font-medium"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
              <button 
                onClick={handleSplit}
                className="flex-1 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
              >
                拆分 PDF
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
          <h2 className="text-3xl font-black text-gray-800 dark:text-zinc-100 mb-4 tracking-tight">正在拆分您的 PDF...</h2>
          <p className="text-gray-500 dark:text-zinc-500 font-medium">这可能需要几秒钟的时间，请稍候。</p>
        </div>
      )}

      {splitPdfUrl && !isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 glass animate-in fade-in zoom-in duration-500">
          <div className="bg-green-100 dark:bg-green-900/20 p-8 rounded-full mb-10">
            <Download className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-4xl font-black text-gray-800 dark:text-zinc-100 mb-4 tracking-tight">拆分成功！</h2>
          <p className="text-gray-500 dark:text-zinc-500 mb-10 text-center max-w-md font-medium">
            您的 PDF 文件已成功拆分。如果没有自动下载，请点击下方按钮手动下载。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
            <a 
              href={splitPdfUrl} 
              download={`split_${file?.name || 'document.pdf'}`}
              className="flex-1 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center"
            >
              <Download className="w-6 h-6 mr-3" />
              下载 PDF
            </a>
            <button 
              onClick={() => {
                setSplitPdfUrl(null);
                setFile(null);
                setPageRange('');
              }}
              className="flex-1 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 text-xl font-bold py-5 px-8 rounded-2xl transition-all"
            >
              继续拆分
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
