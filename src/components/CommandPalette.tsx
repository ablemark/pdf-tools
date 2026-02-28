import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { 
  Combine, Scissors, Minimize2, Image as ImageIcon, 
  RotateCw, Type, Lock, FileImage, Hash, 
  Moon, Sun, Home, History, Search 
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { isDark, toggleDark } = useDarkMode();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const tools = [
    {
      id: 'merge',
      title: '合并 PDF',
      icon: <Combine className="w-4 h-4 mr-2" />,
    },
    {
      id: 'split',
      title: '拆分 PDF',
      icon: <Scissors className="w-4 h-4 mr-2" />,
    },
    {
      id: 'editor',
      title: '页面编辑器',
      icon: <RotateCw className="w-4 h-4 mr-2" />,
    },
    {
      id: 'compress',
      title: '压缩 PDF',
      icon: <Minimize2 className="w-4 h-4 mr-2" />,
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF 转图片',
      icon: <ImageIcon className="w-4 h-4 mr-2" />,
    },
    {
      id: 'jpg-to-pdf',
      title: '图片转 PDF',
      icon: <FileImage className="w-4 h-4 mr-2" />,
    },
    {
      id: 'watermark',
      title: '添加水印',
      icon: <Type className="w-4 h-4 mr-2" />,
    },
    {
      id: 'page-numbers',
      title: '添加页码',
      icon: <Hash className="w-4 h-4 mr-2" />,
    },
    {
      id: 'encrypt',
      title: 'PDF 加密',
      icon: <Lock className="w-4 h-4 mr-2" />,
    },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] px-4">
      <div 
        className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-sm transition-opacity" 
        onClick={() => setOpen(false)}
      />
      
      <div className="relative w-full max-w-lg transform transition-all">
        <Command 
          className="w-full bg-white dark:bg-[#1a1a1a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          loop
        >
          <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-2" />
            <Command.Input 
              placeholder="搜索工具或命令..." 
              className="w-full h-14 bg-transparent outline-none text-gray-800 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-lg"
            />
            <div className="flex items-center space-x-1">
              <kbd className="hidden sm:inline-flex items-center h-5 px-1.5 text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">ESC</kbd>
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
            <Command.Empty className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              未找到相关结果
            </Command.Empty>

            <Command.Group heading="导航" className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1.5 mb-1">
              <Command.Item
                onSelect={() => runCommand(() => window.location.hash = '')}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-white/10 cursor-pointer transition-colors"
              >
                <Home className="w-4 h-4 mr-2" />
                首页
              </Command.Item>
              <Command.Item
                onSelect={() => runCommand(() => window.location.hash = 'history')}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-white/10 cursor-pointer transition-colors"
              >
                <History className="w-4 h-4 mr-2" />
                历史记录
              </Command.Item>
            </Command.Group>

            <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-1" />

            <Command.Group heading="PDF 工具" className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1.5 mb-1">
              {tools.map((tool) => (
                <Command.Item
                  key={tool.id}
                  value={tool.title}
                  onSelect={() => runCommand(() => window.location.hash = tool.id)}
                  className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-white/10 cursor-pointer transition-colors"
                >
                  {tool.icon}
                  {tool.title}
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Separator className="h-px bg-gray-100 dark:bg-gray-800 mx-2 my-1" />

            <Command.Group heading="设置" className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1.5 mb-1">
              <Command.Item
                onSelect={() => runCommand(() => toggleDark())}
                className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-700 dark:text-gray-200 aria-selected:bg-gray-100 dark:aria-selected:bg-white/10 cursor-pointer transition-colors"
              >
                {isDark ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                切换{isDark ? '浅色' : '暗黑'}模式
              </Command.Item>
            </Command.Group>
          </Command.List>
          
          <div className="border-t border-gray-100 dark:border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="font-sans px-1 bg-gray-200 dark:bg-gray-700 rounded">↵</kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-sans px-1 bg-gray-200 dark:bg-gray-700 rounded">↑↓</kbd>
                导航
              </span>
            </div>
            <span>PDF Tools Command Palette</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
