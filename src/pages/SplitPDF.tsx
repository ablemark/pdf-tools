import { useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Loader2, Download, ArrowLeft, Settings, Plus, Trash2, LayoutGrid, FileDown } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import PageThumbnail from '../components/PageThumbnail';
import { addHistoryRecord } from '../db';

// Configure worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface SplitPDFProps {
  onBack: () => void;
}

interface Range {
  id: string;
  start: number | '';
  end: number | '';
}

export default function SplitPDF({ onBack }: SplitPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [splitPdfUrl, setSplitPdfUrl] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState<'range' | 'extract'>('range');
  
  // Range mode state
  const [ranges, setRanges] = useState<Range[]>([{ id: '1', start: 1, end: '' }]);
  
  // Extract mode state
  const [extractMode, setExtractMode] = useState<'all' | 'selected'>('all');
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setIsProcessing(true);
      setLoadingMessage('正在读取 PDF 页面...');
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        setTotalPages(pdf.numPages);
        setRanges([{ id: Date.now().toString(), start: 1, end: pdf.numPages }]);
      } catch (error) {
        console.error('Error loading PDF:', error);
        alert('无法加载 PDF 文件，请检查文件是否损坏。');
        setFile(null);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const addRange = () => {
    setRanges([...ranges, { id: Date.now().toString(), start: '', end: '' }]);
  };

  const removeRange = (id: string) => {
    if (ranges.length > 1) {
      setRanges(ranges.filter(r => r.id !== id));
    }
  };

  const updateRange = (id: string, field: 'start' | 'end', value: string) => {
    const numValue = value === '' ? '' : parseInt(value, 10);
    setRanges(ranges.map(r => r.id === id ? { ...r, [field]: numValue } : r));
  };

  const togglePageSelection = (pageNumber: number) => {
    if (activeTab !== 'extract' || extractMode !== 'selected') return;
    
    const newSelection = new Set(selectedPages);
    if (newSelection.has(pageNumber)) {
      newSelection.delete(pageNumber);
    } else {
      newSelection.add(pageNumber);
    }
    setSelectedPages(newSelection);
  };

  const isPageHighlighted = (pageNumber: number) => {
    if (activeTab === 'range') {
      return ranges.some(r => {
        const start = typeof r.start === 'number' ? r.start : 1;
        const end = typeof r.end === 'number' ? r.end : totalPages;
        return pageNumber >= start && pageNumber <= end;
      });
    } else {
      if (extractMode === 'all') return true;
      return selectedPages.has(pageNumber);
    }
  };

  const handleSplit = async () => {
    if (!file || !pdfDoc) return;

    setIsProcessing(true);
    setSplitPdfUrl(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(arrayBuffer);
      
      const generatedPdfs: { name: string, bytes: Uint8Array }[] = [];

      if (activeTab === 'range') {
        setLoadingMessage('正在按范围拆分 PDF...');
        for (let i = 0; i < ranges.length; i++) {
          const r = ranges[i];
          const start = typeof r.start === 'number' ? r.start : 1;
          const end = typeof r.end === 'number' ? r.end : totalPages;
          
          if (start > end || start < 1 || end > totalPages) {
            alert(`范围 ${i + 1} 无效，请检查页码。`);
            setIsProcessing(false);
            return;
          }

          const newDoc = await PDFDocument.create();
          const indices = [];
          for (let p = start; p <= end; p++) {
            indices.push(p - 1); // 0-based
          }
          
          const copiedPages = await newDoc.copyPages(originalPdf, indices);
          copiedPages.forEach(page => newDoc.addPage(page));
          
          const bytes = await newDoc.save();
          generatedPdfs.push({
            name: `${file.name.replace('.pdf', '')}-${start}-${end}.pdf`,
            bytes
          });
        }
      } else {
        if (extractMode === 'all') {
          setLoadingMessage('正在提取所有页面...');
          for (let i = 0; i < totalPages; i++) {
            const newDoc = await PDFDocument.create();
            const [copiedPage] = await newDoc.copyPages(originalPdf, [i]);
            newDoc.addPage(copiedPage);
            const bytes = await newDoc.save();
            generatedPdfs.push({
              name: `${file.name.replace('.pdf', '')}-page${i + 1}.pdf`,
              bytes
            });
          }
        } else {
          setLoadingMessage('正在提取选定页面...');
          if (selectedPages.size === 0) {
            alert('请至少选择一页。');
            setIsProcessing(false);
            return;
          }
          
          const newDoc = await PDFDocument.create();
          const indices = Array.from(selectedPages).sort((a, b) => a - b).map(p => p - 1);
          const copiedPages = await newDoc.copyPages(originalPdf, indices);
          copiedPages.forEach(page => newDoc.addPage(page));
          
          const bytes = await newDoc.save();
          generatedPdfs.push({
            name: `${file.name.replace('.pdf', '')}-extracted.pdf`,
            bytes
          });
        }
      }

      if (generatedPdfs.length === 1) {
        const blob = new Blob([generatedPdfs[0].bytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setSplitPdfUrl(url);
        saveAs(blob, generatedPdfs[0].name);
        
        await addHistoryRecord({
          fileName: generatedPdfs[0].name,
          operationType: '拆分',
          timestamp: Date.now(),
          fileSize: blob.size,
          status: 'success',
          blob
        });
      } else if (generatedPdfs.length > 1) {
        setLoadingMessage('正在打包您的文件，请稍候...');
        const zip = new JSZip();
        generatedPdfs.forEach(pdf => {
          zip.file(pdf.name, pdf.bytes);
        });
        
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        setSplitPdfUrl(url);
        const zipName = `${file.name.replace('.pdf', '')}-split.zip`;
        saveAs(zipBlob, zipName);
        
        await addHistoryRecord({
          fileName: zipName,
          operationType: '拆分',
          timestamp: Date.now(),
          fileSize: zipBlob.size,
          status: 'success',
          blob: zipBlob
        });
      }

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

      {file && pdfDoc && !isProcessing && !splitPdfUrl && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Left: Grid */}
            <div className="flex-grow bg-white dark:bg-white/[0.02] rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-6 overflow-y-auto max-h-[800px] glass">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 flex items-center tracking-tight">
                  <LayoutGrid className="w-6 h-6 mr-3 text-pdf-red dark:text-violet-400" />
                  页面预览
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 font-medium">
                  共 {totalPages} 页
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <PageThumbnail
                    key={i}
                    pdf={pdfDoc}
                    pageNumber={i + 1}
                    isSelected={isPageHighlighted(i + 1)}
                    onToggle={togglePageSelection}
                  />
                ))}
              </div>
            </div>

            {/* Right: Control Panel */}
            <div className="w-full lg:w-96 flex-shrink-0">
              <div className="bg-white dark:bg-white/[0.02] rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-6 sticky top-6 glass">
                <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 mb-6 flex items-center tracking-tight">
                  <Settings className="w-6 h-6 mr-2 text-pdf-red dark:text-violet-400" />
                  拆分选项
                </h3>
                
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl mb-6">
                  <button
                    onClick={() => setActiveTab('range')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                      activeTab === 'range' 
                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    按范围拆分
                  </button>
                  <button
                    onClick={() => setActiveTab('extract')}
                    className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${
                      activeTab === 'extract' 
                        ? 'bg-white dark:bg-white/10 text-gray-900 dark:text-zinc-100 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                    }`}
                  >
                    提取页面
                  </button>
                </div>

                {/* Tab Content */}
                {activeTab === 'range' ? (
                  <div className="space-y-4 mb-8">
                    {ranges.map((range, index) => (
                      <div key={range.id} className="flex items-center gap-2 bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/10">
                        <span className="text-sm font-bold text-gray-500 dark:text-zinc-400 w-16">范围 {index + 1}</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={range.start}
                          onChange={(e) => updateRange(range.id, 'start', e.target.value)}
                          className="w-16 px-2 py-1.5 text-center border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-zinc-100 text-sm font-medium focus:ring-2 focus:ring-pdf-red dark:focus:ring-violet-500 outline-none"
                        />
                        <span className="text-gray-400 dark:text-zinc-500">-</span>
                        <input
                          type="number"
                          min={1}
                          max={totalPages}
                          value={range.end}
                          onChange={(e) => updateRange(range.id, 'end', e.target.value)}
                          className="w-16 px-2 py-1.5 text-center border border-gray-200 dark:border-white/10 rounded-lg bg-white dark:bg-white/5 text-gray-900 dark:text-zinc-100 text-sm font-medium focus:ring-2 focus:ring-pdf-red dark:focus:ring-violet-500 outline-none"
                        />
                        {ranges.length > 1 && (
                          <button onClick={() => removeRange(range.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors ml-auto">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addRange}
                      className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-white/20 rounded-xl text-gray-600 dark:text-zinc-400 font-bold hover:border-pdf-red hover:text-pdf-red dark:hover:border-violet-400 dark:hover:text-violet-400 transition-colors flex items-center justify-center"
                    >
                      <Plus className="w-5 h-5 mr-1" />
                      添加范围
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 mb-8">
                    <button
                      onClick={() => setExtractMode('all')}
                      className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all ${
                        extractMode === 'all'
                          ? 'border-pdf-red dark:border-violet-500 bg-pdf-red/5 dark:bg-violet-500/10'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                        extractMode === 'all' ? 'border-pdf-red dark:border-violet-500' : 'border-gray-300 dark:border-white/30'
                      }`}>
                        {extractMode === 'all' && <div className="w-2.5 h-2.5 rounded-full bg-pdf-red dark:bg-violet-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-zinc-100">提取所有页面</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">每页将保存为一个独立的 PDF 文件</div>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setExtractMode('selected')}
                      className={`w-full flex items-center p-4 rounded-xl border-2 text-left transition-all ${
                        extractMode === 'selected'
                          ? 'border-pdf-red dark:border-violet-500 bg-pdf-red/5 dark:bg-violet-500/10'
                          : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${
                        extractMode === 'selected' ? 'border-pdf-red dark:border-violet-500' : 'border-gray-300 dark:border-white/30'
                      }`}>
                        {extractMode === 'selected' && <div className="w-2.5 h-2.5 rounded-full bg-pdf-red dark:bg-violet-500" />}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-zinc-100">提取选定页面</div>
                        <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">在左侧点击选择页面，合并为一个新 PDF</div>
                      </div>
                    </button>
                  </div>
                )}

                <button
                  onClick={handleSplit}
                  className="w-full bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-lg font-bold py-4 rounded-2xl shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                >
                  <FileDown className="w-5 h-5 mr-2" />
                  开始拆分
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-2xl p-12 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-gray-100 dark:border-white/5">
            <Loader2 className="w-16 h-16 text-pdf-red dark:text-cyan-400 animate-spin mx-auto mb-6" />
            <h3 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">处理中</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500 font-medium">{loadingMessage}</p>
          </div>
        </div>
      )}

      {splitPdfUrl && !isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-12 flex flex-col items-center justify-center min-h-[400px] bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 glass animate-in fade-in zoom-in duration-500">
          <div className="bg-green-100 dark:bg-green-900/20 p-8 rounded-full mb-10">
            <Download className="w-16 h-16 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-4xl font-black text-gray-800 dark:text-zinc-100 mb-4 tracking-tight">拆分成功！</h2>
          <p className="text-gray-500 dark:text-zinc-500 mb-10 text-center max-w-md font-medium">
            您的 PDF 文件已成功拆分并下载。
          </p>
          <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
            <button 
              onClick={() => {
                setSplitPdfUrl(null);
                setFile(null);
                setPdfDoc(null);
                setRanges([{ id: '1', start: 1, end: '' }]);
                setSelectedPages(new Set());
              }}
              className="flex-1 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-xl font-bold py-5 px-8 rounded-2xl shadow-xl transition-all hover:scale-[1.02]"
            >
              继续拆分
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
