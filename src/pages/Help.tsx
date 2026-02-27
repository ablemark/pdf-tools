import React from 'react';
import { ArrowLeft, HelpCircle, FileText, Shield, Zap } from 'lucide-react';

export default function Help({ onBack }: { onBack: () => void }) {
  const faqs = [
    {
      question: "PDF Tools 是免费的吗？",
      answer: "是的，我们提供的所有基础 PDF 处理功能都是完全免费的，无需注册即可使用。"
    },
    {
      question: "我的文件安全吗？",
      answer: "绝对安全。我们采用先进的加密技术传输您的文件。所有上传的文件在处理完成后会自动从我们的服务器上永久删除，我们绝不会查看、分享或保存您的文档。"
    },
    {
      question: "处理文件有大小限制吗？",
      answer: "为了保证所有用户的处理速度，目前单个文件的大小限制为 50MB。如果您需要处理更大的文件，建议先使用我们的压缩工具减小体积。"
    },
    {
      question: "支持在手机上使用吗？",
      answer: "支持。我们的网站采用了响应式设计，完美适配各种尺寸的屏幕，您可以在手机、平板或电脑上获得一致的流畅体验。"
    }
  ];

  return (
    <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回首页
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">帮助中心</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            在这里寻找您需要的答案，或者了解如何更好地使用我们的工具。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-pdf-red" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">使用指南</h3>
            <p className="text-gray-600 dark:text-gray-400">了解每个工具的具体操作步骤和最佳实践。</p>
          </div>
          
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-pdf-red" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">隐私与安全</h3>
            <p className="text-gray-600 dark:text-gray-400">了解我们如何保护您的数据和文件安全。</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 flex items-center">
            <HelpCircle className="w-6 h-6 mr-2 text-pdf-red" />
            常见问题 (FAQ)
          </h2>
          
          <div className="space-y-8">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {faq.question}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
