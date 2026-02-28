import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  ArrowLeft, 
  Eye, 
  EyeOff, 
  Shield, 
  Printer, 
  Copy, 
  Edit, 
  ChevronDown, 
  ChevronUp,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Loader2
} from 'lucide-react';
// 【关键修改】换回官方极其稳定的 pdf-lib，移除有毒的 pdf-lib-encrypt-js
import { PDFDocument } from 'pdf-lib';
import { saveAs } from 'file-saver';
import FileUploader from '../components/FileUploader';
import { motion, AnimatePresence } from 'motion/react';

interface EncryptPDFProps {
  onBack: () => void;
}

type PasswordStrength = 'none' | 'weak' | 'medium' | 'strong';

export default function EncryptPDF({ onBack }: EncryptPDFProps) {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [strength, setStrength] = useState<PasswordStrength>('none');
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    printing: true,
    copying: true,
    modifying: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    calculateStrength(password);
  }, [password]);

  const calculateStrength = (pwd: string) => {
    if (!pwd) {
      setStrength('none');
      return;
    }
    let score = 0;
    if (pwd.length > 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score < 2) setStrength('weak');
    else if (score < 4) setStrength('medium');
    else setStrength('strong');
  };

  const handleFilesSelected = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setError(null);
    }
  };

  const handleEncrypt = async () => {
    if (!file) return;
    if (!password) {
      setError('请输入打开密码');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    setIsProcessing(true);
    setProgress(20);
    setError(null);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setProgress(40);
      
      // Load the PDF
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      setProgress(60);

      // 【关键修改】主动拦截并抛出错误，阻止打包器去寻找不存在的加密引擎
      // 因为前端加密库兼容性问题，暂时让 UI 优雅处理
      throw new Error("抱歉，当前使用的加密引擎与云端环境存在兼容问题，此功能暂时挂起。我们将在后续版本更新更稳定的加密算法！");

      /* // 旧的报错逻辑（已注释）
      const ownerPassword = Math.random().toString(36).substring(2, 15);
      await (pdfDoc as any).encrypt({
        userPassword: password,
        ownerPassword: ownerPassword,
        permissions: {
          printing: permissions.printing ? 'highResolution' : 'none',
          copying: permissions.copying,
          modifying: permissions.modifying,
          annotating: permissions.modifying,
          fillingForms: permissions.modifying,
          contentAccessibility: true,
          documentAssembly: permissions.modifying,
        },
      });
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      saveAs(blob, `${file.name.replace('.pdf', '')}_encrypted.pdf`);
      */

      setProgress(100);
      setTimeout(() => {
        setIsProcessing(false);
        setProgress(0);
      }, 1000);

    } catch (err: any) {
      console.error('Encryption error:', err);
      setError(`${err.message || '请确保文件未加密且格式正确'}`);
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const strengthConfig = {
    none: { label: '', color: 'bg-gray-200', text: 'text-gray-400' },
    weak: { label: '弱', color: 'bg-red-500', text: 'text-red-500' },
    medium: { label: '中', color: 'bg-yellow-500', text: 'text-yellow-500' },
    strong: { label: '强', color: 'bg-green-500', text: 'text-green-500' },
  };

  return (
    <div className="flex-grow bg-gray-50 dark:bg-gray-900 py-12 transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button 
          onClick={onBack}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-pdf-red dark:hover:text-pdf-red transition-colors font-medium mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回工具列表
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
          <div className="bg-pdf-red p-6 text-white flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-white/20 p-3 rounded-xl mr-4">
                <Lock className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">PDF 加密</h2>
                <p className="text-white/80 text-sm">设置密码并限制文件权限</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {!file ? (
              <FileUploader 
                title="选择要加密的 PDF 文件" 
                onFilesSelected={handleFilesSelected} 
              />
            ) : (
              <div className="space-y-8">
                {/* File Info */}
                <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
                  <div className="bg-pdf-red/10 p-2 rounded-lg mr-4">
                    <Shield className="w-6 h-6 text-pdf-red" />
                  </div>
                  <div className="flex-grow overflow-hidden">
                    <p className="font-medium text-gray-900 dark:text-white truncate">{file.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <button 
                    onClick={() => setFile(null)}
                    className="text-sm text-pdf-red hover:underline font-medium"
                  >
                    更换文件
                  </button>
                </div>

                {/* Password Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      设置打开密码 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="输入密码"
                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pdf-red focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {/* Strength Indicator */}
                    {password && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 dark:text-gray-400">密码强度:</span>
                          <span className={`font-bold ${strengthConfig[strength].text}`}>
                            {strengthConfig[strength].label}
                          </span>
                        </div>
                        <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ 
                              width: strength === 'weak' ? '33%' : strength === 'medium' ? '66%' : strength === 'strong' ? '100%' : '0%' 
                            }}
                            className={`h-full ${strengthConfig[strength].color} transition-all duration-500`}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      确认密码 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入密码"
                      className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-pdf-red focus:border-transparent transition-all outline-none text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Advanced Options Accordion */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex items-center">
                      <ShieldAlert className="w-5 h-5 mr-3 text-gray-500" />
                      <span className="font-semibold text-gray-700 dark:text-gray-200">高级权限设置</span>
                    </div>
                    {isAdvancedOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  
                  <AnimatePresence>
                    {isAdvancedOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-6 space-y-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                          <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                checked={!permissions.printing}
                                onChange={() => setPermissions(p => ({ ...p, printing: !p.printing }))}
                                className="w-5 h-5 rounded border-gray-300 text-pdf-red focus:ring-pdf-red"
                              />
                            </div>
                            <div className="ml-4 flex items-center">
                              <Printer className="w-4 h-4 mr-2 text-gray-400 group-hover:text-pdf-red" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">限制打印</p>
                                <p className="text-xs text-gray-500">禁止用户打印该文件</p>
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={!permissions.copying}
                              onChange={() => setPermissions(p => ({ ...p, copying: !p.copying }))}
                              className="w-5 h-5 rounded border-gray-300 text-pdf-red focus:ring-pdf-red"
                            />
                            <div className="ml-4 flex items-center">
                              <Copy className="w-4 h-4 mr-2 text-gray-400 group-hover:text-pdf-red" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">限制内容复制</p>
                                <p className="text-xs text-gray-500">禁止选取和拷贝文字</p>
                              </div>
                            </div>
                          </label>

                          <label className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={!permissions.modifying}
                              onChange={() => setPermissions(p => ({ ...p, modifying: !p.modifying }))}
                              className="w-5 h-5 rounded border-gray-300 text-pdf-red focus:ring-pdf-red"
                            />
                            <div className="ml-4 flex items-center">
                              <Edit className="w-4 h-4 mr-2 text-gray-400 group-hover:text-pdf-red" />
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">限制修改</p>
                                <p className="text-xs text-gray-500">禁止拆分、旋转或合并</p>
                              </div>
                            </div>
                          </label>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Warning Message */}
                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 flex items-start">
                  <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-500 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    <strong>重要提示：</strong> 请妥善保管您的密码。一旦丢失将无法找回，因为加密过程完全在您的浏览器中完成，没有任何后台备份。
                  </p>
                </div>

                {/* Error Message */}
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 flex items-center text-red-800 dark:text-red-200 text-sm"
                  >
                    <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
                    {error}
                  </motion.div>
                )}

                {/* Action Button */}
                <div className="pt-4">
                  <button
                    onClick={handleEncrypt}
                    disabled={isProcessing || !password || password !== confirmPassword}
                    className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center transition-all shadow-lg ${
                      isProcessing || !password || password !== confirmPassword
                        ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed text-gray-500'
                        : 'bg-pdf-red hover:bg-red-600 text-white hover:shadow-red-500/20 active:scale-[0.98]'
                    }`}
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        正在处理...
                      </>
                    ) : (
                      <>
                        <Lock className="w-5 h-5 mr-2" />
                        立即加密并下载
                      </>
                    )}
                  </button>
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium text-gray-500">
                      <span>处理进度</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-pdf-red"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Success Info */}
        {!isProcessing && progress === 100 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800 flex items-center text-green-800 dark:text-green-200"
          >
            <CheckCircle2 className="w-6 h-6 mr-3 text-green-500" />
            <div>
              <p className="font-bold">加密成功！</p>
              <p className="text-sm">您的文件已处理完毕。</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
