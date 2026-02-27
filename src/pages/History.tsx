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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="bg-gray-100 dark:bg-gray-800 p-8 rounded-full mb-6">
          <FileText className="w-24 h-24 text-gray-400 dark:text-gray-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">暂无历史记录</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          您还没有处理过任何 PDF 文件。快去工具箱开始处理您的第一个 PDF 吧！
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">历史记录</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700">
                <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">文件名</th>
                <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">操作类型</th>
                <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">日期</th>
                <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300">大小</th>
                <th className="py-4 px-6 font-semibold text-gray-600 dark:text-gray-300 text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr 
                  key={record.id} 
                  className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-pdf-red mr-3" />
                      <span className="font-medium text-gray-800 dark:text-gray-200 truncate max-w-[200px] sm:max-w-xs">
                        {record.fileName}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                      {record.operationType}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-sm flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {formatDate(record.timestamp)}
                  </td>
                  <td className="py-4 px-6 text-gray-500 dark:text-gray-400 text-sm">
                    <div className="flex items-center">
                      <HardDrive className="w-4 h-4 mr-2" />
                      {formatFileSize(record.fileSize)}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end space-x-2">
                      <button 
                        onClick={() => handleDownload(record.blob, record.fileName)}
                        className="p-2 text-gray-500 hover:text-pdf-red hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
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
