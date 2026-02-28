import { useState, useEffect } from 'react';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Loader2, Download, ArrowLeft, Settings, Plus, Trash2, CheckSquare, FileText, Layers } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import PageThumbnail from '../components/PageThumbnail';
import { addHistoryRecord } from '../db';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface SplitPDFProps {
  onBack: () => void;
}

type SplitMode = 'range' | 'extract';

interface PageRange {
  id: string;
  start: string;
  end: string;
}

export default function SplitPDF({ onBack }: SplitPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfProxy, setPdfProxy] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Split Mode State
  const [mode, setMode] = useState<SplitMode>('range');
  
  // Range Mode State
  const [ranges, setRanges] = useState<PageRange[]>([{ id: '1', start: '', end: '' }]);
  
  // Extract Mode State
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [extractAll, setExtractAll] = useState(false);

  useEffect(() => {
    if (file) {
      const loadPdf = async () => {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument(arrayBuffer);
          const pdf = await loadingTask.promise;
          setPdfProxy(pdf);
          setNumPages(pdf.numPages);
          // Initialize first range to cover full document or empty
          setRanges([{ id: '1', start: '1', end: pdf.numPages.toString() }]);
        } catch (error) {
          console.error('Error loading PDF for preview:', error);
          alert('无法加载 PDF 预览，请检查文件是否损坏。');
        }
      };
      loadPdf();
    } else {
      setPdfProxy(null);
      setNumPages(0);
      setRanges([{ id: '1', start: '', end: '' }]);
      setSelectedPages(new Set());
      setExtractAll(false);
    }
  }, [file]);

  // Helper to determine if a page is selected based on current mode and state
  const isPageSelected = (pageNumber: number) => {
    if (mode === 'range') {
      return ranges.some(range => {
        const start = parseInt(range.start);
        const end = parseInt(range.end);
        if (isNaN(start)) return false;
        if (isNaN(end)) return pageNumber === start;
        return pageNumber >= start && pageNumber <= end;
      });
    } else {
      if (extractAll) return true;
      return selectedPages.has(pageNumber);
    }
  };

  const handleRangeChange = (id: string, field: 'start' | 'end', value: string) => {
    setRanges(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addRange = () => {
    setRanges(prev => [...prev, { id: Date.now().toString(), start: '', end: '' }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(prev => prev.filter(r => r.id !== id));
    }
  };

  const togglePageSelection = (pageNumber: number) => {
    if (mode === 'extract') {
      if (extractAll) {
        // If currently extracting all, switching to manual selection
        setExtractAll(false);
        const newSet = new Set<number>();
        for (let i = 1; i <= numPages; i++) {
          if (i !== pageNumber) newSet.add(i);
        }
        setSelectedPages(newSet);
      } else {
        const newSet = new Set(selectedPages);
        if (newSet.has(pageNumber)) {
          newSet.delete(pageNumber);
        } else {
          newSet.add(pageNumber);
        }
        setSelectedPages(newSet);
      }
    }
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProcessingStatus('正在初始化...');

    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      const zip = new JSZip();
      let generatedFilesCount = 0;
      let singlePdfBytes: Uint8Array | null = null;
      let singlePdfName = '';

      if (mode === 'range') {
        // Validate ranges
        const validRanges = ranges.filter(r => {
          const start = parseInt(r.start);
          const end = parseInt(r.end);
          return !isNaN(start) && start > 0 && start <= numPages && 
                 (!isNaN(end) ? end >= start && end <= numPages : true);
        });

        if (validRanges.length === 0) {
          alert('请输入有效的页码范围。');
          setIsProcessing(false);
          return;
        }

        setProcessingStatus('正在处理范围拆分...');
        
        for (let i = 0; i < validRanges.length; i++) {
          const range = validRanges[i];
          const start = parseInt(range.start);
          const end = range.end ? parseInt(range.end) : start;
          
          const newPdf = await PDFDocument.create();
          // Convert 1-based to 0-based indices
          const indices = [];
          for (let j = start; j <= end; j++) {
            indices.push(j - 1);
          }
          
          const copiedPages = await newPdf.copyPages(originalPdf, indices);
          copiedPages.forEach(page => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          const fileName = `${file.name.replace('.pdf', '')}_range_${start}-${end}.pdf`;
          
          zip.file(fileName, pdfBytes);
          generatedFilesCount++;
          singlePdfBytes = pdfBytes;
          singlePdfName = fileName;
        }

      } else {
        // Extract Mode
        if (extractAll) {
          setProcessingStatus('正在提取所有页面...');
          for (let i = 0; i < numPages; i++) {
            const newPdf = await PDFDocument.create();
            const [copiedPage] = await newPdf.copyPages(originalPdf, [i]);
            newPdf.addPage(copiedPage);
            
            const pdfBytes = await newPdf.save();
            const fileName = `${file.name.replace('.pdf', '')}_page_${i + 1}.pdf`;
            
            zip.file(fileName, pdfBytes);
            generatedFilesCount++;
          }
        } else {
          if (selectedPages.size === 0) {
            alert('请至少选择一个页面进行提取。');
            setIsProcessing(false);
            return;
          }
          
          setProcessingStatus('正在提取选中页面...');
          // Merge selected pages into ONE PDF
          const newPdf = await PDFDocument.create();
          const sortedPages = Array.from(selectedPages).sort((a, b) => a - b);
          const indices = sortedPages.map(p => p - 1); // 0-based
          
          const copiedPages = await newPdf.copyPages(originalPdf, indices);
          copiedPages.forEach(page => newPdf.addPage(page));
          
          const pdfBytes = await newPdf.save();
          const fileName = `${file.name.replace('.pdf', '')}_extracted.pdf`;
          
          // For "Extract Selected", we usually mean merge them into one, or separate?
          // The prompt says: "Extract selected pages (merge into a new PDF)"
          // So it's just one file.
          
          singlePdfBytes = pdfBytes;
          singlePdfName = fileName;
          generatedFilesCount = 1;
        }
      }

      setProcessingStatus('正在打包文件...');

      if (generatedFilesCount === 1 && singlePdfBytes) {
        // Download single file
        const blob = new Blob([singlePdfBytes], { type: 'application/pdf' });
        saveAs(blob, singlePdfName);
        
        await addHistoryRecord({
          fileName: singlePdfName,
          operationType: '拆分',
          timestamp: Date.now(),
          fileSize: blob.size,
          status: 'success',
          blob
        });
      } else if (generatedFilesCount > 1) {
        // Download ZIP
        const content = await zip.generateAsync({ type: 'blob' });
        const zipName = `${file.name.replace('.pdf', '')}_split_files.zip`;
        saveAs(content, zipName);
        
        await addHistoryRecord({
          fileName: zipName,
          operationType: '拆分',
          timestamp: Date.now(),
          fileSize: content.size,
          status: 'success',
          blob: content
        });
      }

      setProcessingStatus('完成！');
      // Optional: Reset or show success message
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStatus('');
      }, 1000);

    } catch (error) {
      console.error('Error splitting PDF:', error);
      alert('拆分 PDF 时出错，请重试。');
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-grow py-8 transition-colors min-h-screen bg-gray-50 dark:bg-slate-950">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={onBack}
            className="flex items-center text-gray-600 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-violet-400 transition-colors font-bold group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            返回工具列表
          </button>
          <h1 className="text-2xl font-black text-gray-800 dark:text-zinc-100 tracking-tight">高级拆分 PDF</h1>
          <div className="w-24"></div> {/* Spacer for centering if needed */}
        </div>

        {!file ? (
          <div className="flex-grow flex flex-col items-center justify-center">
             <FileUploader 
              title="拆分 PDF" 
              onFilesSelected={(files) => files.length > 0 && setFile(files[0])} 
              multiple={false}
            />
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)]">
            {/* Left: Visual Grid */}
            <div className="flex-grow bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-6 overflow-y-auto custom-scrollbar">
              {pdfProxy ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                  {Array.from({ length: numPages }, (_, i) => i + 1).map((pageNum) => (
                    <PageThumbnail
                      key={pageNum}
                      pdf={pdfProxy}
                      pageNumber={pageNum}
                      isSelected={isPageSelected(pageNum)}
                      onToggle={() => togglePageSelection(pageNum)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-10 h-10 text-pdf-red animate-spin" />
                </div>
              )}
            </div>

            {/* Right: Control Panel */}
            <div className="w-full lg:w-96 flex-shrink-0 flex flex-col gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-6 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-zinc-100 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-pdf-red dark:text-violet-400" />
                    拆分设置
                  </h2>
                  <span className="text-xs font-mono text-gray-400 dark:text-zinc-500 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md">
                    {numPages} 页
                  </span>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-6">
                  <button
                    onClick={() => setMode('range')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                      mode === 'range' 
                        ? 'bg-white dark:bg-slate-800 text-pdf-red dark:text-violet-400 shadow-sm' 
                        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <Layers className="w-4 h-4 mr-2" />
                    按范围拆分
                  </button>
                  <button
                    onClick={() => setMode('extract')}
                    className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-bold transition-all ${
                      mode === 'extract' 
                        ? 'bg-white dark:bg-slate-800 text-pdf-red dark:text-violet-400 shadow-sm' 
                        : 'text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300'
                    }`}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    提取页面
                  </button>
                </div>

                {/* Mode Content */}
                <div className="flex-grow overflow-y-auto custom-scrollbar pr-2">
                  {mode === 'range' ? (
                    <div className="space-y-4">
                      {ranges.map((range, index) => (
                        <div key={range.id} className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-white/5 group">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase tracking-wider">
                              范围 {index + 1}
                            </span>
                            {ranges.length > 1 && (
                              <button 
                                onClick={() => removeRange(range.id)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max={numPages}
                              value={range.start}
                              onChange={(e) => handleRangeChange(range.id, 'start', e.target.value)}
                              placeholder="开始"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pdf-red dark:focus:ring-violet-500 outline-none"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="number"
                              min="1"
                              max={numPages}
                              value={range.end}
                              onChange={(e) => handleRangeChange(range.id, 'end', e.target.value)}
                              placeholder="结束"
                              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-lg text-sm font-mono focus:ring-2 focus:ring-pdf-red dark:focus:ring-violet-500 outline-none"
                            />
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={addRange}
                        className="w-full py-3 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-xl text-gray-500 dark:text-zinc-400 hover:border-pdf-red dark:hover:border-violet-500 hover:text-pdf-red dark:hover:text-violet-400 transition-all flex items-center justify-center font-bold text-sm"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        添加范围
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div 
                        onClick={() => setExtractAll(true)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          extractAll 
                            ? 'border-pdf-red dark:border-violet-500 bg-pdf-red/5 dark:bg-violet-500/10' 
                            : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            extractAll ? 'border-pdf-red dark:border-violet-500 bg-pdf-red dark:bg-violet-500' : 'border-gray-300 dark:border-zinc-600'
                          }`}>
                            {extractAll && <CheckSquare className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-bold text-gray-800 dark:text-zinc-100">提取所有页面</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 ml-8">
                          将每一页保存为一个单独的 PDF 文件。
                        </p>
                      </div>

                      <div 
                        onClick={() => setExtractAll(false)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          !extractAll 
                            ? 'border-pdf-red dark:border-violet-500 bg-pdf-red/5 dark:bg-violet-500/10' 
                            : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                            !extractAll ? 'border-pdf-red dark:border-violet-500 bg-pdf-red dark:bg-violet-500' : 'border-gray-300 dark:border-zinc-600'
                          }`}>
                            {!extractAll && <CheckSquare className="w-3 h-3 text-white" />}
                          </div>
                          <span className="font-bold text-gray-800 dark:text-zinc-100">提取选定页面</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 ml-8">
                          在左侧勾选页面，合并为一个新的 PDF 文件。
                          <br />
                          <span className="font-bold text-pdf-red dark:text-violet-400 mt-1 block">
                            已选择 {selectedPages.size} 页
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={handleSplit}
                    disabled={isProcessing || (!file)}
                    className="w-full bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-lg font-bold py-4 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        {processingStatus || '处理中...'}
                      </>
                    ) : (
                      <>
                        <Download className="w-5 h-5 mr-2" />
                        开始拆分 PDF
                      </>
                    )}
                  </button>
                  <button 
                    onClick={() => setFile(null)}
                    className="w-full mt-3 text-gray-500 dark:text-zinc-500 hover:text-gray-700 dark:hover:text-zinc-300 text-sm font-medium py-2 transition-colors"
                  >
                    重新选择文件
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
