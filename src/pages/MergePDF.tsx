import { useState, useCallback, useRef } from 'react';
import { PDFDocument, degrees } from 'pdf-lib';
import { Loader2, Download, ArrowLeft, Plus, Play, Trash2, AlertCircle, Lock } from 'lucide-react';
import FileUploader from '../components/FileUploader';
import FileCard from '../components/FileCard';
import { addHistoryRecord } from '../db';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';

interface FileWithMetadata {
  id: string;
  file: File;
  rotation: number;
}

interface MergePDFProps {
  onBack: () => void;
}

export default function MergePDF({ onBack }: MergePDFProps) {
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [mergedPdfUrl, setMergedPdfUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Password handling
  const [passwordPrompt, setPasswordPrompt] = useState<{ fileIndex: number; fileName: string } | null>(null);
  const [password, setPassword] = useState('');
  const pendingFilesRef = useRef<FileWithMetadata[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleFilesSelected = (selectedFiles: File[]) => {
    const newFiles = selectedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      rotation: 0,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    setMergedPdfUrl(null);
    setError(null);
  };

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleRotate = (id: string, direction: 'left' | 'right') => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const change = direction === 'left' ? -90 : 90;
        let newRotation = (f.rotation + change) % 360;
        if (newRotation < 0) newRotation += 360;
        return { ...f, rotation: newRotation };
      }
      return f;
    }));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFiles((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError('请至少添加两个 PDF 文件进行合并。');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setProgress({ current: 0, total: files.length });

    try {
      const mergedPdf = await PDFDocument.create();
      
      for (let i = 0; i < files.length; i++) {
        const { file, rotation } = files[i];
        setProgress({ current: i + 1, total: files.length });
        
        let arrayBuffer: ArrayBuffer;
        try {
          arrayBuffer = await file.arrayBuffer();
        } catch (e) {
          throw new Error(`无法读取文件: ${file.name}`);
        }

        let pdfDoc: PDFDocument;
        try {
          pdfDoc = await PDFDocument.load(arrayBuffer);
        } catch (e: any) {
          if (e.message.includes('encrypted') || e.message.includes('password')) {
            setIsProcessing(false);
            setError(`文件 "${file.name}" 已加密。请先使用解密工具移除密码后再合并。`);
            return;
          }
          throw e;
        }

        // Copy pages
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        
        // Add pages with rotation
        for (const page of pages) {
          if (rotation !== 0) {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + rotation) % 360));
          }
          mergedPdf.addPage(page);
        }

        // Explicitly clear references to help GC
        (pdfDoc as any) = null;
        (arrayBuffer as any) = null;
      }

      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setMergedPdfUrl(url);

      const fileName = `merged_${Date.now()}.pdf`;

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
        operationType: '合并',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (err: any) {
      console.error('Error merging PDFs:', err);
      setError(err.message || '合并 PDF 时出错，请重试。');
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {files.length === 0 ? (
          <FileUploader 
            title="合并 PDF" 
            onFilesSelected={handleFilesSelected} 
            multiple={true}
          />
        ) : (
          <div className="space-y-8">
            {/* Header Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 glass">
              <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">合并列表</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1 font-medium">
                  共选择 {files.length} 个文件。拖拽卡片可调整合并顺序。
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setFiles([])}
                  className="flex items-center px-4 py-2 text-sm font-bold text-gray-500 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  清空列表
                </button>
                <label className="flex items-center px-5 py-2.5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 rounded-xl cursor-pointer transition-all text-sm font-bold shadow-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  添加更多
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf"
                    onChange={(e) => e.target.files && handleFilesSelected(Array.from(e.target.files))}
                  />
                </label>
                <button
                  disabled={isProcessing || files.length < 2}
                  onClick={handleMerge}
                  className={`flex items-center px-8 py-2.5 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed ${isProcessing ? 'animate-pulse' : ''}`}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      正在处理 ({progress.current}/{progress.total})
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      立即合并
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/30">
                <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            {/* Grid with Drag & Drop */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={files.map(f => f.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {files.map((fileMeta) => (
                    <FileCard
                      key={fileMeta.id}
                      id={fileMeta.id}
                      file={fileMeta.file}
                      rotation={fileMeta.rotation}
                      onDelete={handleDelete}
                      onRotate={handleRotate}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}
      </div>

      {/* Success Modal */}
      {mergedPdfUrl && !isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl">
          <div className="w-full max-w-md bg-white dark:bg-white/[0.02] dark:backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-500 border border-gray-100 dark:border-white/5">
            <div className="p-10 text-center">
              <div className="w-24 h-24 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                <Download className="w-12 h-12 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">合并成功！</h2>
              <p className="text-gray-500 dark:text-zinc-500 mb-10 font-medium">
                您的 PDF 文件已成功合并。点击下方按钮下载。
              </p>
              <div className="flex flex-col gap-4">
                <a 
                  href={mergedPdfUrl} 
                  download="merged_document.pdf"
                  className="w-full py-5 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white font-bold rounded-2xl shadow-xl transition-all hover:scale-[1.02] flex items-center justify-center"
                >
                  <Download className="w-6 h-6 mr-3" />
                  下载合并文件
                </a>
                <button 
                  onClick={() => setMergedPdfUrl(null)}
                  className="w-full py-5 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-zinc-300 font-bold rounded-2xl transition-all"
                >
                  继续操作
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
