import { useState, useMemo, useCallback, useEffect } from 'react';
import { PDFDocument, PageSizes } from 'pdf-lib';
import imageCompression from 'browser-image-compression';
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
  FileImage, 
  Trash2, 
  Save, 
  Settings2,
  Maximize2,
  Layout,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import FileUploader from '../components/FileUploader';
import ImageCard from '../components/ImageCard';
import { addHistoryRecord } from '../db';

interface ImageItem {
  id: string;
  file: File;
  previewUrl: string;
}

type PageSize = 'fit' | 'A4' | 'Letter';
type Orientation = 'portrait' | 'landscape';
type Margin = 'none' | 'small' | 'big';

export default function ImageToPdf({ onBack }: { onBack: () => void }) {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [pageSize, setPageSize] = useState<PageSize>('fit');
  const [orientation, setOrientation] = useState<Orientation>('portrait');
  const [margin, setMargin] = useState<Margin>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

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

  const handleFilesSelected = (files: File[]) => {
    const newImages = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      previewUrl: URL.createObjectURL(file)
    }));
    setImages(prev => [...prev, ...newImages]);
  };

  const handleDelete = (id: string) => {
    setImages(prev => {
      const filtered = prev.filter(img => img.id !== id);
      const deleted = prev.find(img => img.id === id);
      if (deleted) URL.revokeObjectURL(deleted.previewUrl);
      return filtered;
    });
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const convertToPdf = async () => {
    if (images.length === 0) return;

    setIsProcessing(true);
    setProgress(0);
    
    try {
      const pdfDoc = await PDFDocument.create();
      
      for (let i = 0; i < images.length; i++) {
        const item = images[i];
        setStatusText(`正在处理第 ${i + 1}/${images.length} 张图片...`);
        
        // 1. Compress and fix orientation
        const compressionOptions = {
          maxSizeMB: 1,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        };
        
        const compressedBlob = await imageCompression(item.file, compressionOptions);
        const imageBytes = await compressedBlob.arrayBuffer();
        
        // 2. Embed image
        let embeddedImage;
        if (item.file.type === 'image/png') {
          embeddedImage = await pdfDoc.embedPng(imageBytes);
        } else {
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
        }

        const { width: imgWidth, height: imgHeight } = embeddedImage.scale(1);
        
        // 3. Determine page size
        let pageWidth, pageHeight;
        if (pageSize === 'fit') {
          pageWidth = imgWidth;
          pageHeight = imgHeight;
        } else {
          const size = pageSize === 'A4' ? PageSizes.A4 : PageSizes.Letter;
          pageWidth = orientation === 'portrait' ? size[0] : size[1];
          pageHeight = orientation === 'portrait' ? size[1] : size[0];
        }

        const page = pdfDoc.addPage([pageWidth, pageHeight]);

        // 4. Calculate margins
        let marginSize = 0;
        if (margin === 'small') marginSize = 20;
        if (margin === 'big') marginSize = 50;

        const availableWidth = pageWidth - marginSize * 2;
        const availableHeight = pageHeight - marginSize * 2;

        // 5. Calculate scaling (Scale to Fit)
        const widthRatio = availableWidth / imgWidth;
        const heightRatio = availableHeight / imgHeight;
        const scale = Math.min(widthRatio, heightRatio);

        const finalWidth = imgWidth * scale;
        const finalHeight = imgHeight * scale;

        // 6. Center drawing
        const x = (pageWidth - finalWidth) / 2;
        const y = (pageHeight - finalHeight) / 2;

        page.drawImage(embeddedImage, {
          x,
          y,
          width: finalWidth,
          height: finalHeight,
        });

        setProgress(Math.round(((i + 1) / images.length) * 100));
      }

      setStatusText('正在生成 PDF 文件...');
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const fileName = `images_to_pdf_${Date.now()}.pdf`;
      
      saveAs(blob, fileName);

      // Save history
      await addHistoryRecord({
        fileName,
        operationType: '图片转 PDF',
        timestamp: Date.now(),
        fileSize: blob.size,
        status: 'success',
        blob
      });

    } catch (error) {
      console.error('Error converting images to PDF:', error);
      alert('转换过程中出错，请重试。');
    } finally {
      setIsProcessing(false);
      setStatusText('');
    }
  };

  const imageIds = useMemo(() => images.map(img => img.id), [images]);
  const activeImage = useMemo(() => images.find(img => img.id === activeId), [images, activeId]);

  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
    };
  }, []);

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

      {images.length === 0 && !isProcessing && (
        <FileUploader 
          title="图片转 PDF" 
          onFilesSelected={handleFilesSelected} 
          multiple={true}
          accept="image/jpeg, image/png, image/webp"
          buttonText="选择图片文件"
          dropText="或把图片文件拖拽到这里"
        />
      )}

      {images.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Left: Settings Panel */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-8 glass sticky top-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-zinc-100 mb-8 flex items-center">
                  <Settings2 className="w-5 h-5 mr-3 text-violet-500" />
                  排版设置
                </h3>

                <div className="space-y-8">
                  {/* Page Size */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-4">
                      页面大小
                    </label>
                    <div className="grid grid-cols-1 gap-3">
                      {[
                        { id: 'fit', label: '自适应图片', icon: <Maximize2 className="w-4 h-4" /> },
                        { id: 'A4', label: 'A4 (297x210mm)', icon: <FileText className="w-4 h-4" /> },
                        { id: 'Letter', label: 'US Letter', icon: <FileText className="w-4 h-4" /> },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setPageSize(option.id as PageSize)}
                          className={`flex items-center px-4 py-4 rounded-2xl border-2 transition-all ${
                            pageSize === option.id 
                              ? 'border-pdf-red dark:border-violet-500 bg-red-50 dark:bg-violet-500/10 text-pdf-red dark:text-violet-400' 
                              : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-600 dark:text-zinc-500'
                          }`}
                        >
                          <span className="mr-3">{option.icon}</span>
                          <span className="text-sm font-bold">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orientation */}
                  {pageSize !== 'fit' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-4">
                        页面方向
                      </label>
                      <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-2xl">
                        <button
                          onClick={() => setOrientation('portrait')}
                          className={`flex-1 flex items-center justify-center py-3 rounded-xl text-xs font-bold transition-all ${
                            orientation === 'portrait' 
                              ? 'bg-white dark:bg-white/10 text-pdf-red dark:text-violet-400 shadow-sm' 
                              : 'text-gray-500 dark:text-zinc-500'
                          }`}
                        >
                          <Layout className="w-4 h-4 mr-2" />
                          纵向
                        </button>
                        <button
                          onClick={() => setOrientation('landscape')}
                          className={`flex-1 flex items-center justify-center py-3 rounded-xl text-xs font-bold transition-all ${
                            orientation === 'landscape' 
                              ? 'bg-white dark:bg-white/10 text-pdf-red dark:text-violet-400 shadow-sm' 
                              : 'text-gray-500 dark:text-zinc-500'
                          }`}
                        >
                          <Layout className="w-4 h-4 mr-2 rotate-90" />
                          横向
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Margins */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 dark:text-zinc-400 mb-4">
                      页边距
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'none', label: '无' },
                        { id: 'small', label: '小' },
                        { id: 'big', label: '大' },
                      ].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => setMargin(option.id as Margin)}
                          className={`py-3 rounded-2xl border-2 text-xs font-bold transition-all ${
                            margin === option.id 
                              ? 'border-pdf-red dark:border-violet-500 bg-red-50 dark:bg-violet-500/10 text-pdf-red dark:text-violet-400' 
                              : 'border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 text-gray-600 dark:text-zinc-500'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={convertToPdf}
                    disabled={isProcessing}
                    className="w-full flex items-center justify-center px-6 py-5 bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white rounded-2xl font-bold shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        正在转换 {progress}%
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5 mr-2" />
                        生成 PDF
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Image Grid */}
            <div className="lg:col-span-3">
              <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-3xl shadow-sm border border-gray-200 dark:border-white/5 p-8 mb-8 flex items-center justify-between glass">
                <div>
                  <h2 className="text-3xl font-black text-gray-900 dark:text-zinc-100 flex items-center tracking-tight">
                    <FileImage className="w-8 h-8 mr-3 text-pdf-red dark:text-violet-400" />
                    图片列表
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500 mt-2 font-medium">
                    共 {images.length} 张图片 • 拖拽可调整合并顺序
                  </p>
                </div>
                <button
                  onClick={() => setImages([])}
                  className="text-sm font-bold text-gray-500 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  清空列表
                </button>
              </div>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={imageIds}
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 pb-20">
                    {images.map((img) => (
                      <ImageCard
                        key={img.id}
                        id={img.id}
                        file={img.file}
                        previewUrl={img.previewUrl}
                        onDelete={handleDelete}
                      />
                    ))}
                    
                    {/* Add More Button */}
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl hover:border-pdf-red dark:hover:border-pdf-red hover:bg-red-50 dark:hover:bg-red-900/10 transition-all cursor-pointer group">
                      <FileImage className="w-8 h-8 text-gray-300 group-hover:text-pdf-red mb-2" />
                      <span className="text-xs font-bold text-gray-400 group-hover:text-pdf-red">添加图片</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple 
                        accept="image/jpeg, image/png, image/webp"
                        onChange={(e) => {
                          if (e.target.files) handleFilesSelected(Array.from(e.target.files));
                        }}
                      />
                    </label>
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
                  {activeId && activeImage ? (
                    <ImageCard
                      id={activeId}
                      file={activeImage.file}
                      previewUrl={activeImage.previewUrl}
                      onDelete={() => {}}
                      isOverlay
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </div>
          </div>
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xl">
          <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-2xl p-12 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-gray-100 dark:border-white/5">
            <div className="relative w-28 h-28 mx-auto mb-8">
              <svg className="w-full h-full" viewBox="0 0 100 100">
                <circle 
                  className="text-gray-200 dark:text-white/5 stroke-current" 
                  strokeWidth="8" 
                  fill="transparent" 
                  r="40" cx="50" cy="50" 
                />
                <circle 
                  className="text-pdf-red dark:text-cyan-400 stroke-current transition-all duration-500 ease-out" 
                  strokeWidth="8" 
                  strokeDasharray={251.2}
                  strokeDashoffset={251.2 - (251.2 * progress) / 100}
                  strokeLinecap="round" 
                  fill="transparent" 
                  r="40" cx="50" cy="50" 
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center font-black text-2xl text-gray-900 dark:text-cyan-400">
                {progress}%
              </div>
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">正在转换您的图片</h3>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mb-6 font-medium">{statusText}</p>
            <div className="flex items-center justify-center text-xs text-pdf-red dark:text-violet-400 font-bold animate-pulse">
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              请勿关闭浏览器窗口
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
