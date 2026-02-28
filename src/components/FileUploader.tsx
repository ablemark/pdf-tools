import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, X, UploadCloud } from 'lucide-react';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  title?: string;
  multiple?: boolean;
  accept?: string;
  buttonText?: string;
  dropText?: string;
}

export default function FileUploader({ 
  onFilesSelected, 
  title = "上传文件", 
  multiple = true,
  accept = "application/pdf",
  buttonText = "选择 PDF 文件",
  dropText = "或把 PDF 文件拖拽到这里"
}: FileUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(prev => multiple ? [...prev, ...acceptedFiles] : acceptedFiles.slice(0, 1));
  }, [multiple]);

  // Convert string accept to react-dropzone format
  const getAcceptObject = () => {
    if (accept === "application/pdf") {
      return { 'application/pdf': ['.pdf'] };
    }
    // Handle image types
    if (accept.includes('image')) {
      return {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/webp': ['.webp']
      };
    }
    return undefined;
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: getAcceptObject(),
    multiple
  } as any);

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleContinue = () => {
    onFilesSelected(selectedFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <h2 className="text-5xl font-black text-center text-gray-800 dark:text-zinc-100 mb-12 tracking-tight transition-colors">{title}</h2>
      
      {selectedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-[3rem] p-16 text-center cursor-pointer transition-all duration-700
            flex flex-col items-center justify-center min-h-[450px]
            ${isDragActive 
              ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_50px_rgba(139,92,246,0.3)] scale-[1.02]' 
              : 'border-gray-300 dark:border-white/5 hover:border-pdf-red dark:hover:border-violet-500/50 hover:bg-gray-50 dark:hover:bg-white/[0.03] bg-white dark:bg-white/[0.01] dark:backdrop-blur-2xl shadow-2xl'
            }
          `}
        >
          <input {...getInputProps()} />
          <div className={`p-8 rounded-[2.5rem] mb-10 transition-all duration-700 ${isDragActive ? 'bg-violet-500/20 scale-110 shadow-2xl' : 'bg-gray-50 dark:bg-white/5'}`}>
            <UploadCloud className={`w-24 h-24 transition-all duration-700 ${isDragActive ? 'text-violet-400' : 'text-gray-400 dark:text-zinc-700'}`} />
          </div>
          <button className="bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-2xl font-black uppercase tracking-widest py-5 px-12 rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95 mb-8">
            {buttonText}
          </button>
          <p className="text-gray-500 dark:text-zinc-500 text-xl font-medium transition-colors">
            {isDragActive ? "松开鼠标以上传文件" : dropText}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-3xl rounded-[3rem] shadow-2xl border border-gray-200 dark:border-white/5 p-10 transition-all glass">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-2xl font-black text-gray-800 dark:text-zinc-100 transition-colors tracking-tight">已选文件 ({selectedFiles.length})</h3>
            <button 
              {...getRootProps()}
              className="text-pdf-red dark:text-violet-400 hover:text-pdf-red-hover dark:hover:text-violet-300 font-black uppercase tracking-widest text-xs flex items-center transition-all hover:scale-105"
            >
              <input {...getInputProps()} />
              <span className="bg-pdf-red/10 dark:bg-violet-500/10 p-2 rounded-lg mr-2">+</span>
              添加更多文件
            </button>
          </div>
          
          <div className="space-y-4 mb-12 max-h-[450px] overflow-y-auto pr-4 custom-scrollbar">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-6 bg-gray-50 dark:bg-white/[0.03] rounded-[2rem] border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-all group"
              >
                <div className="flex items-center space-x-5 overflow-hidden">
                  <div className="bg-red-100 dark:bg-violet-500/10 p-4 rounded-2xl text-pdf-red dark:text-violet-400 transition-all group-hover:scale-110">
                    <FileText className="w-7 h-7" />
                  </div>
                  <div className="truncate">
                    <p className="text-base font-black text-gray-800 dark:text-zinc-100 truncate max-w-[200px] sm:max-w-xs md:max-w-md transition-colors tracking-tight">
                      {file.name}
                    </p>
                    <p className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-zinc-500 mt-1.5 transition-colors opacity-60">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-3 text-gray-400 dark:text-zinc-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-90"
                  title="移除文件"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleContinue}
              className="bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-xl font-black uppercase tracking-widest py-5 px-20 rounded-[2rem] shadow-2xl transition-all hover:scale-105 active:scale-95"
            >
              继续处理
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
