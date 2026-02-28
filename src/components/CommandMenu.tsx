import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { 
  Combine, Scissors, Minimize2, Image as ImageIcon, RotateCw, Type, Lock, FileImage, 
  Hash, Home, History, Moon, Sun, Laptop, Search, ArrowRight 
} from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

export default function CommandMenu() {
  const [open, setOpen] = useState(false);
  const { setTheme } = useDarkMode();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    const openMenu = () => setOpen(true);

    document.addEventListener('keydown', down);
    window.addEventListener('openCommandMenu', openMenu);
    return () => {
      document.removeEventListener('keydown', down);
      window.removeEventListener('openCommandMenu', openMenu);
    };
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  const navigate = (hash: string) => {
    runCommand(() => {
      window.location.hash = hash;
    });
  };

  return (
    <Command.Dialog
      open={open}
      onOpenChange={setOpen}
      label="Global Command Menu"
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[20vh] bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setOpen(false)} // Close on backdrop click
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-[#1a1b1e] rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <div className="flex items-center border-b border-gray-100 dark:border-white/5 px-4 py-3">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3" />
          <Command.Input 
            placeholder="搜索工具或命令..."
            className="flex-1 bg-transparent outline-none text-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 font-medium"
          />
          <div className="flex items-center space-x-1">
            <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 opacity-100">
              <span className="text-xs">Esc</span>
            </kbd>
          </div>
        </div>
        
        <Command.List className="max-h-[60vh] overflow-y-auto p-2 scroll-py-2 custom-scrollbar">
          <Command.Empty className="py-10 text-center text-sm text-gray-500 dark:text-gray-400">
            未找到相关结果
          </Command.Empty>

          <Command.Group heading="PDF 工具" className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1.5 mb-1 uppercase tracking-wider">
            <CommandItem onSelect={() => navigate('merge')} icon={<Combine className="w-4 h-4" />} title="合并 PDF" shortcut="M" />
            <CommandItem onSelect={() => navigate('split')} icon={<Scissors className="w-4 h-4" />} title="拆分 PDF" shortcut="S" />
            <CommandItem onSelect={() => navigate('compress')} icon={<Minimize2 className="w-4 h-4" />} title="压缩 PDF" shortcut="C" />
            <CommandItem onSelect={() => navigate('pdf-to-jpg')} icon={<ImageIcon className="w-4 h-4" />} title="PDF 转图片" shortcut="I" />
            <CommandItem onSelect={() => navigate('jpg-to-pdf')} icon={<FileImage className="w-4 h-4" />} title="图片转 PDF" shortcut="P" />
            <CommandItem onSelect={() => navigate('editor')} icon={<RotateCw className="w-4 h-4" />} title="页面编辑器" shortcut="E" />
            <CommandItem onSelect={() => navigate('watermark')} icon={<Type className="w-4 h-4" />} title="添加水印" shortcut="W" />
            <CommandItem onSelect={() => navigate('page-numbers')} icon={<Hash className="w-4 h-4" />} title="添加页码" shortcut="N" />
            <CommandItem onSelect={() => navigate('encrypt')} icon={<Lock className="w-4 h-4" />} title="PDF 加密" shortcut="L" />
          </Command.Group>

          <Command.Separator className="h-px bg-gray-100 dark:bg-white/5 my-2" />

          <Command.Group heading="通用" className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1.5 mb-1 uppercase tracking-wider">
            <CommandItem onSelect={() => navigate('')} icon={<Home className="w-4 h-4" />} title="回到首页" />
            <CommandItem onSelect={() => navigate('history')} icon={<History className="w-4 h-4" />} title="历史记录" shortcut="H" />
          </Command.Group>

          <Command.Separator className="h-px bg-gray-100 dark:bg-white/5 my-2" />

          <Command.Group heading="主题" className="text-xs font-medium text-gray-400 dark:text-gray-500 px-2 py-1.5 mb-1 uppercase tracking-wider">
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))} icon={<Sun className="w-4 h-4" />} title="浅色模式" />
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))} icon={<Moon className="w-4 h-4" />} title="暗黑模式" />
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))} icon={<Laptop className="w-4 h-4" />} title="跟随系统" />
          </Command.Group>
        </Command.List>

        <div className="border-t border-gray-100 dark:border-white/5 px-4 py-2 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-600 bg-gray-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center space-x-3">
            <span className="flex items-center"><ArrowRight className="w-3 h-3 mr-1" /> 选择</span>
            <span className="flex items-center"><span className="font-mono mr-1">↵</span> 确认</span>
          </div>
          <div className="flex items-center">
            <span className="font-medium text-gray-500 dark:text-gray-500">PDF Tools Command Menu</span>
          </div>
        </div>
      </div>
    </Command.Dialog>
  );
}

function CommandItem({ icon, title, shortcut, onSelect }: { icon: React.ReactNode, title: string, shortcut?: string, onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center px-3 py-3 rounded-lg text-sm text-gray-700 dark:text-gray-200 aria-selected:bg-pdf-red/10 dark:aria-selected:bg-white/10 aria-selected:text-pdf-red dark:aria-selected:text-white cursor-pointer transition-colors group"
    >
      <div className="mr-3 text-gray-400 dark:text-gray-500 group-aria-selected:text-pdf-red dark:group-aria-selected:text-white transition-colors">
        {icon}
      </div>
      <span className="flex-1 font-medium">{title}</span>
      {shortcut && (
        <span className="text-xs font-mono text-gray-400 dark:text-gray-600 group-aria-selected:text-pdf-red/70 dark:group-aria-selected:text-gray-400">
          {shortcut}
        </span>
      )}
    </Command.Item>
  );
}
