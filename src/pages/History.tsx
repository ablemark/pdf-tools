import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { Download, Trash2, FileText, Calendar, HardDrive } from 'lucide-react';

export default function History() {
  const records = useLiveQuery(() => db.records.orderBy('timestamp').reverse().toArray());

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (blob: Blob | undefined, fileName: string) => {
    if (!blob) {
      alert('无法下载此文件，因为数据已丢失。');
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: number | undefined) => {
    if (id !== undefined) {
      try {
        await db.records.delete(id);
      } catch (error) {
        console.error('Failed to delete record:', error);
      }
    }
  };

  if (!records || records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="bg-gray-100 dark:bg-white/5 p-12 rounded-[3rem] mb-10 backdrop-blur-xl border border-transparent dark:border-white/5 shadow-2xl">
          <FileText className="w-32 h-32 text-gray-400 dark:text-zinc-600" />
        </div>
        <h2 className="text-4xl font-black text-gray-800 dark:text-zinc-100 mb-6 tracking-tight">暂无历史记录</h2>
        <p className="text-gray-500 dark:text-zinc-400 max-w-md font-medium text-lg leading-relaxed">
          您还没有处理过任何 PDF 文件。快去工具箱开始处理您的第一个 PDF 吧！
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-5xl font-black text-gray-900 dark:text-zinc-100 mb-12 tracking-tight">历史记录</h1>
      
      <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-white/5 overflow-hidden glass">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                <th className="py-6 px-8 font-black text-gray-600 dark:text-zinc-500 uppercase tracking-widest text-xs">文件名</th>
                <th className="py-6 px-8 font-black text-gray-600 dark:text-zinc-500 uppercase tracking-widest text-xs">操作类型</th>
                <th className="py-6 px-8 font-black text-gray-600 dark:text-zinc-500 uppercase tracking-widest text-xs">日期</th>
                <th className="py-6 px-8 font-black text-gray-600 dark:text-zinc-500 uppercase tracking-widest text-xs">大小</th>
                <th className="py-6 px-8 font-black text-gray-600 dark:text-zinc-500 uppercase tracking-widest text-xs text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr 
                  key={record.id} 
                  className="border-b border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/5 transition-all group"
                >
                  <td className="py-6 px-8">
                    <div className="flex items-center">
                      <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-2.5 rounded-xl mr-4 group-hover:scale-110 transition-transform">
                        <FileText className="w-6 h-6 text-pdf-red dark:text-violet-400" />
                      </div>
                      <span className="font-black text-gray-800 dark:text-zinc-200 truncate max-w-[200px] sm:max-w-xs tracking-tight">
                        {record.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-6 px-8">
                    <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-blue-100 text-blue-800 dark:bg-violet-500/20 dark:text-violet-300 border border-transparent dark:border-violet-500/30">
                      {record.operationType}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-gray-500 dark:text-zinc-400 text-sm font-bold">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2.5 opacity-50" />
                      {formatDate(record.timestamp)}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-gray-500 dark:text-zinc-400 text-sm font-bold">
                    <div className="flex items-center">
                      <HardDrive className="w-4 h-4 mr-2.5 opacity-50" />
                      {formatFileSize(record.fileSize)}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right">
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => handleDownload(record.blob, record.fileName)}
                        className="p-3 text-gray-500 hover:text-pdf-red dark:hover:text-violet-400 hover:bg-red-50 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                        title="下载"
                      >
                        <Download className="w-6 h-6" />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-3 text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-white/5 rounded-2xl transition-all active:scale-95 border border-transparent hover:border-gray-100 dark:hover:border-white/5"
                        title="删除"
                      >
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
