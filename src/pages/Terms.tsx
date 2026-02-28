import React from 'react';
import { ArrowLeft, FileSignature } from 'lucide-react';

export default function Terms({ onBack }: { onBack: () => void }) {
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
              <FileSignature className="w-12 h-12 text-pdf-red dark:text-violet-400" />
            </div>
            <h1 className="text-5xl font-black text-gray-900 dark:text-zinc-100 tracking-tight">服务条款</h1>
          </div>
          
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-zinc-400 space-y-8">
            <p className="text-xs font-black uppercase tracking-widest opacity-50">生效日期：{new Date().toLocaleDateString()}</p>
            
            <p className="text-xl font-medium leading-relaxed">
              欢迎使用 PDF Tools。访问或使用我们的网站及服务，即表示您同意遵守以下条款和条件。请仔细阅读。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">1. 接受条款</h2>
            <p className="text-lg leading-relaxed">
              通过使用本网站，您确认您已阅读、理解并同意受本服务条款及我们的隐私政策的约束。如果您不同意这些条款的任何部分，请勿使用我们的服务。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">2. 服务的使用</h2>
            <ul className="list-none pl-0 space-y-4">
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg">您同意仅出于合法目的使用本服务。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg">您不得利用我们的服务处理任何非法、侵权、淫秽或有害的内容。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg">您不得试图破坏、干扰或未经授权访问我们的服务器或网络。</span>
              </li>
              <li className="flex items-start">
                <div className="bg-pdf-red/10 dark:bg-violet-500/10 p-1.5 rounded-lg mr-4 mt-1">
                  <div className="w-2 h-2 bg-pdf-red dark:bg-violet-400 rounded-full"></div>
                </div>
                <span className="text-lg">我们保留在任何时候以任何理由拒绝向任何人提供服务的权利。</span>
              </li>
            </ul>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">3. 用户内容与版权</h2>
            <p className="text-lg leading-relaxed">
              您保留对您上传到我们平台的所有文件的所有权和版权。我们不对您上传的内容主张任何所有权。您必须确保您有权处理您上传的文件。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">4. 免责声明</h2>
            <p className="text-lg leading-relaxed">
              我们的服务是按“原样”和“可用”的基础提供的。我们不保证服务将不间断、及时、安全或无错误。对于因使用或无法使用我们的服务而导致的任何直接、间接、附带或后果性的损害，我们概不负责。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">5. 服务的修改与终止</h2>
            <p className="text-lg leading-relaxed">
              我们保留随时修改、暂停或永久停止部分或全部服务的权利，无论是否事先通知。我们不对您或任何第三方因服务的任何修改、暂停或终止而承担责任。
            </p>

            <h2 className="text-2xl font-black text-gray-900 dark:text-zinc-100 mt-12 mb-6 tracking-tight">6. 适用法律</h2>
            <p className="text-lg leading-relaxed">
              本服务条款受适用法律管辖并按其解释。任何因本条款引起的争议应提交至我们运营所在地的有管辖权的法院解决。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
