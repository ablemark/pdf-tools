import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Privacy({ onBack }: { onBack: () => void }) {
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
          <div className="flex items-center mb-10">
            <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-4 rounded-2xl mr-6">
              <ShieldCheck className="w-12 h-12 text-pdf-red dark:text-violet-400" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">隐私政策</h1>
          </div>
          
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-zinc-400 space-y-8">
            <p className="text-xs font-black uppercase tracking-widest opacity-50">最后更新日期：{new Date().toLocaleDateString()}</p>
            
            <p className="text-xl font-medium leading-relaxed">
              在 PDF Tools，您的隐私与数据安全是我们最优先考虑的事项。本隐私政策说明了我们如何收集、使用、保护和处理您的个人信息及上传的文件。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">1. 我们收集的信息</h2>
            <p className="text-lg leading-relaxed">
              我们仅收集为您提供服务所必需的最少信息。这可能包括：
            </p>
            <ul className="list-none pl-0 space-y-4">
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">您上传的文件：</strong> 仅用于执行您请求的 PDF 处理操作。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">使用数据：</strong> 我们可能会收集匿名的使用统计数据（如访问量、使用的工具类型），以帮助我们改进服务。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg"><strong className="font-black text-gray-900 dark:text-zinc-200">设备信息：</strong> 如浏览器类型、操作系统等基本信息，用于优化显示效果。</span>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">2. 文件的处理与存储</h2>
            <p className="text-lg leading-relaxed">
              <strong className="font-black text-pdf-red dark:text-violet-400">我们绝不保留您的文件。</strong> 所有上传到我们服务器的文件在处理完成后，或者在您下载结果文件后的一小段时间内，会被自动且永久地删除。我们不会备份、查看或与任何第三方分享您的文档内容。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">3. 数据安全</h2>
            <p className="text-lg leading-relaxed">
              我们采用行业标准的加密技术（如 SSL/TLS）来保护数据在传输过程中的安全。我们的服务器托管在安全的数据中心，并实施了严格的访问控制措施。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">4. Cookie 的使用</h2>
            <p className="text-lg leading-relaxed">
              我们使用 Cookie 来提升您的浏览体验，例如记住您的深色模式偏好设置。我们不会使用侵入性的跟踪 Cookie。您可以在浏览器设置中禁用 Cookie，但这可能会影响网站的某些功能。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">5. 政策的变更</h2>
            <p className="text-lg leading-relaxed">
              我们可能会不时更新本隐私政策。任何重大变更都会在网站上显著位置公布。继续使用我们的服务即表示您同意更新后的政策。
            </p>
            
            <p className="mt-12 text-xl font-black text-pdf-red dark:text-violet-400 tracking-tight">
              如果您对本隐私政策有任何疑问，请联系我们的支持团队。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
