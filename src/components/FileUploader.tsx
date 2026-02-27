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
      <h2 className="text-3xl font-bold text-center text-gray-800 dark:text-white mb-8 transition-colors">{title}</h2>
      
      {selectedFiles.length === 0 ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all duration-300
            flex flex-col items-center justify-center min-h-[400px]
            ${isDragActive 
              ? 'border-pdf-red bg-red-50 dark:bg-red-900/20' 
              : 'border-gray-300 dark:border-gray-700 hover:border-pdf-red dark:hover:border-pdf-red hover:bg-gray-50 dark:hover:bg-gray-800 bg-white dark:bg-gray-800/50'
            }
          `}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`w-20 h-20 mb-6 transition-colors ${isDragActive ? 'text-pdf-red' : 'text-gray-400 dark:text-gray-500'}`} />
          <button className="bg-pdf-red hover:bg-pdf-red-hover text-white text-xl font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-105 mb-4">
            {buttonText}
          </button>
          <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors">
            {isDragActive ? "松开鼠标以上传文件" : dropText}
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 transition-colors">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-white transition-colors">已选文件 ({selectedFiles.length})</h3>
            <button 
              {...getRootProps()}
              className="text-pdf-red hover:text-pdf-red-hover font-medium text-sm flex items-center transition-colors"
            >
              <input {...getInputProps()} />
              + 添加更多文件
            </button>
          </div>
          
          <div className="space-y-3 mb-8 max-h-[400px] overflow-y-auto pr-2">
            {selectedFiles.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900/50 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-gray-200 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center space-x-4 overflow-hidden">
                  <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg text-pdf-red transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-xs md:max-w-md transition-colors">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 transition-colors">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                  title="移除文件"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <button 
              onClick={handleContinue}
              className="bg-pdf-red hover:bg-pdf-red-hover text-white text-lg font-bold py-3 px-12 rounded-xl shadow-md transition-transform hover:scale-105"
            >
              继续处理
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
