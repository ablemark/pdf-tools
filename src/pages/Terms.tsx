import React from 'react';
import { ArrowLeft, FileSignature } from 'lucide-react';

export default function Terms({ onBack }: { onBack: () => void }) {
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
            <FileSignature className="w-10 h-10 text-pdf-red mr-4" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">服务条款</h1>
          </div>
          
          <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 space-y-6">
            <p className="text-sm text-gray-500">生效日期：{new Date().toLocaleDateString()}</p>
            
            <p className="text-lg">
              欢迎使用 PDF Tools。访问或使用我们的网站及服务，即表示您同意遵守以下条款和条件。请仔细阅读。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">1. 接受条款</h2>
            <p>
              通过使用本网站，您确认您已阅读、理解并同意受本服务条款及我们的隐私政策的约束。如果您不同意这些条款的任何部分，请勿使用我们的服务。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">2. 服务的使用</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>您同意仅出于合法目的使用本服务。</li>
              <li>您不得利用我们的服务处理任何非法、侵权、淫秽或有害的内容。</li>
              <li>您不得试图破坏、干扰或未经授权访问我们的服务器或网络。</li>
              <li>我们保留在任何时候以任何理由拒绝向任何人提供服务的权利。</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">3. 用户内容与版权</h2>
            <p>
              您保留对您上传到我们平台的所有文件的所有权和版权。我们不对您上传的内容主张任何所有权。您必须确保您有权处理您上传的文件。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">4. 免责声明</h2>
            <p>
              我们的服务是按“原样”和“可用”的基础提供的。我们不保证服务将不间断、及时、安全或无错误。对于因使用或无法使用我们的服务而导致的任何直接、间接、附带或后果性的损害，我们概不负责。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">5. 服务的修改与终止</h2>
            <p>
              我们保留随时修改、暂停或永久停止部分或全部服务的权利，无论是否事先通知。我们不对您或任何第三方因服务的任何修改、暂停或终止而承担责任。
            </p>

            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4">6. 适用法律</h2>
            <p>
              本服务条款受适用法律管辖并按其解释。任何因本条款引起的争议应提交至我们运营所在地的有管辖权的法院解决。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
