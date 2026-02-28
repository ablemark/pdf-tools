import React from 'react';
import { ArrowLeft } from 'lucide-react';

export default function About({ onBack }: { onBack: () => void }) {
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

        <div className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-gray-200 dark:border-white/5 p-10 md:p-16 glass">
          <h1 className="text-5xl font-black text-gray-900 dark:text-zinc-100 mb-10 tracking-tight">关于我们</h1>
          
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-zinc-400 space-y-8">
            <p className="text-xl font-medium leading-relaxed">
              欢迎来到 PDF Tools，您的全能在线 PDF 处理平台。我们的使命是让 PDF 文件的处理变得简单、快速且完全免费。
            </p>
            
            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">我们的愿景</h2>
            <p className="text-lg leading-relaxed">
              在数字化办公日益普及的今天，PDF 文件已经成为信息传递的标准格式。然而，处理 PDF 文件往往需要昂贵的专业软件或繁琐的操作。我们希望打破这一壁垒，为全球用户提供一个无需安装、随时随地可用的轻量级解决方案。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">我们提供什么</h2>
            <ul className="list-none pl-0 space-y-4">
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">合并与拆分：</strong> 轻松管理您的文档结构。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">压缩：</strong> 在保持质量的同时减小文件体积，方便分享。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">格式转换：</strong> 实现 PDF 与图片格式之间的无缝转换。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">编辑工具：</strong> 添加水印、旋转页面，满足您的个性化需求。</span>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">为什么选择我们？</h2>
            <p className="text-lg leading-relaxed">
              我们深知数据安全的重要性。所有的文件处理都在您的浏览器本地或安全的云端环境中进行，处理完成后我们会立即删除您的文件，绝不保留任何用户数据。同时，我们致力于提供纯净的用户体验，没有烦人的广告，也没有隐藏的收费项目。
            </p>
            
            <p className="mt-12 text-xl font-black text-pdf-red dark:text-violet-400 tracking-tight">
              感谢您选择 PDF Tools。如果您有任何建议或反馈，欢迎随时与我们联系。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
