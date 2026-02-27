import React from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function Privacy({ onBack }: { onBack: () => void }) {
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

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 md:p-12">
          <div className="flex items-center mb-8">
            <ShieldCheck className="w-10 h-10 text-pdf-red mr-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">隐私政策</h1>
          </div>
          
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6">
            <p className="text-sm text-gray-500">最后更新日期：{new Date().toLocaleDateString()}</p>
            
            <p className="text-lg">
              在 PDF Tools，您的隐私和数据安全是我们最优先考虑的事项。本隐私政策说明了我们如何收集、使用、保护和处理您的个人信息及上传的文件。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. 我们收集的信息</h2>
            <p>
              我们仅收集为您提供服务所必需的最少信息。这可能包括：
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>您上传的文件：</strong> 仅用于执行您请求的 PDF 处理操作。</li>
              <li><strong>使用数据：</strong> 我们可能会收集匿名的使用统计数据（如访问量、使用的工具类型），以帮助我们改进服务。</li>
              <li><strong>设备信息：</strong> 如浏览器类型、操作系统等基本信息，用于优化显示效果。</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. 文件的处理与存储</h2>
            <p>
              <strong>我们绝不保留您的文件。</strong> 所有上传到我们服务器的文件在处理完成后，或者在您下载结果文件后的一小段时间内，会被自动且永久地删除。我们不会备份、查看或与任何第三方分享您的文档内容。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. 数据安全</h2>
            <p>
              我们采用行业标准的加密技术（如 SSL/TLS）来保护数据在传输过程中的安全。我们的服务器托管在安全的数据中心，并实施了严格的访问控制措施。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. Cookie 的使用</h2>
            <p>
              我们使用 Cookie 来提升您的浏览体验，例如记住您的深色模式偏好设置。我们不会使用侵入性的跟踪 Cookie。您可以在浏览器设置中禁用 Cookie，但这可能会影响网站的某些功能。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. 政策的变更</h2>
            <p>
              我们可能会不时更新本隐私政策。任何重大变更都会在网站上显著位置公布。继续使用我们的服务即表示您同意更新后的政策。
            </p>
            
            <p className="mt-8 font-medium">
              如果您对本隐私政策有任何疑问，请联系我们的支持团队。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
