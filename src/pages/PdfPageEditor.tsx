import { useState, useEffect, useCallback, useMemo } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';
import { saveAs } from 'file-saver';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { 
  Loader2, 
  Download, 
  ArrowLeft, 
  RotateCw, 
  Trash2, 
  Save, 
  RefreshCw, 
  LayoutGrid,
  AlertCircle,
  CheckCircle2,
  Undo2,
  GripVertical
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import EditorPageCard from '../components/EditorPageCard';
import { addHistoryRecord } from '../db';

// Configure worker
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PageConfig {
  originalIndex: number;
  rotation: number;
  isDeleted: boolean;
}

interface PdfPageEditorProps {
  onBack: () => void;
}

export default function PdfPageEditor({ onBack }: PdfPageEditorProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [pagesConfig, setPagesConfig] = useState<PageConfig[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [activeId, setActiveId] = useState<number | null>(null);

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

  const handleFilesSelected = async (files: File[]) => {
    if (files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setIsProcessing(true);
      
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        setPdfDoc(pdf);
        
        const initialConfig: PageConfig[] = [];
        for (let i = 0; i < pdf.numPages; i++) {
          initialConfig.push({
            originalIndex: i,
            rotation: 0,
            isDeleted: false,
          });
        }
        setPagesConfig(initialConfig);
      } catch (error) {
        console.error('Error loading PDF:', error);
        alert('无法加载 PDF 文件，请检查文件是否损坏。');
        setFile(null);
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleRotate = (pageNumber: number) => {
    setPagesConfig(prev => prev.map((config, idx) => {
      if (idx === pageNumber - 1) {
        return { ...config, rotation: (config.rotation + 90) % 360 };
      }
      return config;
    }));
  };

  const handleDelete = (pageNumber: number) => {
    setPagesConfig(prev => prev.map((config, idx) => {
      if (idx === pageNumber - 1) {
        return { ...config, isDeleted: !config.isDeleted };
      }
      return config;
    }));
  };

  const rotateAll = (angle: number) => {
    setPagesConfig(prev => prev.map(config => ({
      ...config,
      rotation: (config.rotation + angle + 360) % 360
    })));
  };

  const deleteOdd = () => {
    setPagesConfig(prev => prev.map((config, idx) => ({
      ...config,
      isDeleted: (idx + 1) % 2 !== 0 ? true : config.isDeleted
    })));
  };

  const deleteEven = () => {
    setPagesConfig(prev => prev.map((config, idx) => ({
      ...config,
      isDeleted: (idx + 1) % 2 === 0 ? true : config.isDeleted
    })));
  };

  const resetAll = () => {
    setPagesConfig(prev => prev.map(config => ({
      ...config,
      rotation: 0,
      isDeleted: false
    })));
  };

  const handleExport = async () => {
    if (!file || !pdfDoc) return;

    const activePages = pagesConfig.filter(p => !p.isDeleted);
    if (activePages.length === 0) {
      alert('请至少保留一个页面进行导出。');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      const originalArrayBuffer = await file.arrayBuffer();
      const originalPdf = await PDFDocument.load(originalArrayBuffer);
      const newPdf = await PDFDocument.create();
      
      const totalToExport = activePages.length;
      
      for (let i = 0; i < totalToExport; i++) {
        const config = activePages[i];
        const [copiedPage] = await newPdf.copyPages(originalPdf, [config.originalIndex]);
        
        if (config.rotation !== 0) {
          const currentRotation = copiedPage.getRotation().angle;
          copiedPage.setRotation(degrees((currentRotation + config.rotation) % 360));
        }
        
        newPdf.addPage(copiedPage);
        setExportProgress(Math.round(((i + 1) / totalToExport) * 100));
        
        // Small delay to keep UI responsive
        if (i % 10 === 0) await new Promise(resolve => setTimeout(resolve, 0));
      }

      const pdfBytes = await newPdf.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = `edited_${file.name}`;
      
      saveAs(blob, fileName);

      // Save history
      await addHistoryRecord({
        fileName,
        operationType: '编辑',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('导出 PDF 时出错，请重试。');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setPagesConfig((items) => {
        const oldIndex = items.findIndex((item) => item.originalIndex === active.id);
        const newIndex = items.findIndex((item) => item.originalIndex === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const pageIds = useMemo(() => pagesConfig.map(p => p.originalIndex), [pagesConfig]);
  const activeConfig = useMemo(() => pagesConfig.find(p => p.originalIndex === activeId), [pagesConfig, activeId]);

  return (
    <div className="flex-grow bg-gray-50 dark:bg-slate-950 py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-6">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-slate-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回工具列表
        </button>
      </div>

      {!file && !isProcessing && (
        <FileUploader 
          title="可视化 PDF 编辑器" 
          onFilesSelected={handleFilesSelected} 
          multiple={false}
        />
      )}

      {isProcessing && (
        <div className="w-full max-w-4xl mx-auto p-6 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-16 h-16 text-pdf-red animate-spin mb-6" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">正在读取 PDF 页面...</h2>
          <p className="text-gray-500 dark:text-gray-400">这可能需要几秒钟的时间，请稍候。</p>
        </div>
      )}

      {file && pdfDoc && !isProcessing && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Editor Header */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-800 p-6 mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 glass">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <LayoutGrid className="w-6 h-6 mr-2 text-pdf-red" />
                页面编辑器
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                {file.name} • 共 {pdfDoc.numPages} 页 • 已保留 {pagesConfig.filter(p => !p.isDeleted).length} 页
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={() => rotateAll(90)}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-all"
                  title="全部顺时针旋转 90°"
                >
                  <RotateCw className="w-5 h-5" />
                </button>
                <button 
                  onClick={resetAll}
                  className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-all"
                  title="重置所有修改"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl">
                <button 
                  onClick={deleteOdd}
                  className="px-3 py-2 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-all"
                >
                  删除奇数页
                </button>
                <button 
                  onClick={deleteEven}
                  className="px-3 py-2 text-xs font-bold hover:bg-white dark:hover:bg-slate-700 rounded-lg text-gray-600 dark:text-slate-300 transition-all"
                >
                  删除偶数页
                </button>
              </div>

              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center px-6 py-2.5 bg-pdf-red hover:bg-pdf-red-hover text-white rounded-xl font-bold shadow-lg shadow-pdf-red/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    正在导出 {exportProgress}%
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5 mr-2" />
                    导出 PDF
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Pages Grid */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={pageIds}
              strategy={rectSortingStrategy}
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-20">
                {pagesConfig.map((config, idx) => (
                  <EditorPageCard
                    key={config.originalIndex}
                    id={config.originalIndex}
                    pdf={pdfDoc}
                    pageNumber={idx + 1}
                    rotation={config.rotation}
                    isDeleted={config.isDeleted}
                    onRotate={handleRotate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
            
            <DragOverlay dropAnimation={{
              sideEffects: defaultDropAnimationSideEffects({
                styles: {
                  active: {
                    opacity: '0.5',
                  },
                },
              }),
            }}>
              {activeId && activeConfig && pdfDoc ? (
                <div className="w-full h-full scale-105 shadow-2xl rounded-xl overflow-hidden border-2 border-pdf-red">
                  <EditorPageCard
                    id={activeId}
                    pdf={pdfDoc}
                    pageNumber={pagesConfig.findIndex(p => p.originalIndex === activeId) + 1}
                    rotation={activeConfig.rotation}
                    isDeleted={activeConfig.isDeleted}
                    onRotate={() => {}}
                    onDelete={() => {}}
                    isOverlay
                  />
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      )}

      {/* Export Overlay */}
      {isExporting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-gray-100 dark:border-slate-800">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-gray-200 dark:text-slate-800 stroke-current" 
                  strokeWidth="8" 
                  fill="transparent" 
                  r="40" cx="50" cy="50" 
                />
                <circle 
                  className="text-pdf-red stroke-current transition-all duration-300 ease-out" 
                  strokeWidth="8" 
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * exportProgress) / 100}
                  strokeLinecap="round" 
                  fill="transparent" 
                  r="40" cx="50" cy="50" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-bold text-xl text-gray-900 dark:text-white">
                {exportProgress}%
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">正在构建您的 PDF</h3>
            <p className="text-sm text-gray-500 dark:text-slate-400">请稍候，我们正在应用您的修改并生成最终文档。</p>
          </div>
        </div>
      )}
    </div>
  );
}
