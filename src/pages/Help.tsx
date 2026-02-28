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
    <div className="flex-grow py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-violet-400 transition-colors font-black mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
          返回首页
        </button>

        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">帮助中心</h1>
          <p className="text-xl text-gray-600 dark:text-zinc-400 font-medium">
            在这里寻找您需要的答案，或者了解如何更好地使用我们的工具。
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/5 glass group hover:scale-[1.02] transition-all">
            <div className="w-16 h-16 bg-red-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <FileText className="w-8 h-8 text-pdf-red dark:text-violet-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">使用指南</h3>
            <p className="text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">了解每个工具的具体操作步骤和最佳实践。</p>
          </div>
          
          <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-gray-200 dark:border-white/5 glass group hover:scale-[1.02] transition-all">
            <div className="w-16 h-16 bg-red-50 dark:bg-violet-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Shield className="w-8 h-8 text-pdf-red dark:text-violet-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mb-3 tracking-tight">隐私与安全</h3>
            <p className="text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">了解我们如何保护您的数据和文件安全。</p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-white/5 p-10 md:p-16 glass">
          <h2 className="text-3xl font-black text-gray-900 dark:text-zinc-100 mb-10 flex items-center tracking-tight">
            <HelpCircle className="w-8 h-8 mr-4 text-pdf-red dark:text-violet-400" />
            常见问题 (FAQ)
          </h2>
          
          <div className="space-y-10">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-100 dark:border-white/5 pb-10 last:border-0 last:pb-0">
                <h3 className="text-xl font-black text-gray-900 dark:text-zinc-100 mb-4 tracking-tight">
                  {faq.question}
                </h3>
                <p className="text-lg text-gray-600 dark:text-zinc-400 font-medium leading-relaxed">
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
