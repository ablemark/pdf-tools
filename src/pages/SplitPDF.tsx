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

      {!file && !isProcessing && !splitPdfUrl && (
        <FileUploader 
          title="拆分 PDF" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      )}

      {file && !isProcessing && !splitPdfUrl && (
        <div className="w-full max-w-4xl mx-auto p-6">
          <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8">拆分 PDF</h2>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full mb-6">
              <Settings className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">设置提取范围</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 text-center max-w-md">
              当前文件：<span className="font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
            </p>
            
            <div className="w-full max-w-md mb-8">
              <label htmlFor="pageRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                输入页码范围（例如：“1-3” 或 “5,7,9”）
              </label>
              <input
                type="text"
                id="pageRange"
                value={pageRange}
                onChange={(e) => setPageRange(e.target.value)}
                placeholder="例如：1-5, 8, 11-13"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-pdf-red focus:border-pdf-red outline-none transition-all"
              />
            </div>

            <div className="flex space-x-4">
              <button 
                onClick={handleSplit}
                className="bg-pdf-red hover:bg-pdf-red-hover text-white text-lg font-bold py-3 px-12 rounded-xl shadow-md transition-transform hover:scale-105"
              >
                拆分 PDF
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
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">正在拆分您的 PDF...</h2>
          <p className="text-gray-500 dark:text-gray-400">这可能需要几秒钟的时间，请稍候。</p>
        </div>
      )}

      {splitPdfUrl && !isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-full mb-6">
            <Download className="w-12 h-12 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">拆分成功！</h2>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-center max-w-md">
            您的 PDF 文件已成功拆分。如果没有自动下载，请点击下方按钮手动下载。
          </p>
          <div className="flex space-x-4">
            <a 
              href={splitPdfUrl} 
              download={`split_${file?.name || 'document.pdf'}`}
              className="bg-pdf-red hover:bg-pdf-red-hover text-white text-lg font-bold py-3 px-8 rounded-xl shadow-md transition-transform hover:scale-105 flex items-center"
            >
              <Download className="w-5 h-5 mr-2" />
              下载拆分后的 PDF
            </a>
            <button 
              onClick={() => {
                setSplitPdfUrl(null);
                setFile(null);
                setPageRange('');
              }}
              className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-lg font-bold py-3 px-8 rounded-xl transition-colors"
            >
              继续拆分
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
