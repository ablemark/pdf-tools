import { Menu, ChevronDown, Search } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tools = [
    { id: 'merge', title: '合并 PDF' },
    { id: 'split', title: '拆分 PDF' },
    { id: 'compress', title: '压缩 PDF' },
    { id: 'pdf-to-jpg', title: 'PDF 转图片' },
    { id: 'rotate', title: '旋转 PDF' },
    { id: 'watermark', title: '添加水印' },
    { id: 'page-numbers', title: '添加页码' },
  ];

  return (
    <nav className="bg-white/80 dark:bg-white/[0.02] shadow-sm sticky top-0 z-50 transition-all border-b border-gray-100 dark:border-white/5 backdrop-blur-xl glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center">
            {/* Logo */}
            <a href="#" className="flex-shrink-0 flex items-center cursor-pointer group">
              <div className="bg-pdf-red dark:bg-violet-500 text-white font-black text-xl p-1.5 rounded-xl mr-2 group-hover:scale-110 transition-transform shadow-lg">PDF</div>
              <span className="font-black text-2xl tracking-tighter text-gray-900 dark:text-zinc-100">Tools</span>
            </a>
            
            {/* Desktop Menu */}
            <div className="hidden md:ml-12 md:flex md:space-x-10">
              <div className="relative group" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-violet-400 inline-flex items-center px-1 pt-1 text-sm font-black uppercase tracking-widest h-20 transition-all"
                >
                  全部 PDF 工具
                  <ChevronDown className={`ml-2 h-4 w-4 transition-transform duration-300 ${isMenuOpen ? 'rotate-180 text-pdf-red dark:text-violet-400' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute left-0 mt-0 w-56 rounded-3xl shadow-2xl bg-white dark:bg-zinc-900/90 backdrop-blur-2xl ring-1 ring-black ring-opacity-5 focus:outline-none py-3 z-50 border border-gray-100 dark:border-white/10 glass animate-in fade-in slide-in-from-top-2 duration-200">
                    {tools.map(tool => (
                      <a
                        key={tool.id}
                        href={`#${tool.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-6 py-3 text-sm font-bold text-gray-700 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-white/5 hover:text-pdf-red dark:hover:text-violet-400 transition-all"
                      >
                        {tool.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right side buttons */}
          <div className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => window.dispatchEvent(new Event('openCommandMenu'))}
              className="p-2 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5 rounded-full transition-colors"
              title="搜索 (Cmd+K)"
            >
              <Search className="w-5 h-5" />
            </button>
            <button className="text-gray-700 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-zinc-100 text-sm font-black uppercase tracking-widest px-3 py-2 transition-all">
              登录
            </button>
            <button className="bg-pdf-red dark:btn-neon hover:bg-pdf-red-hover text-white text-sm font-black uppercase tracking-widest px-6 py-3 rounded-2xl transition-all shadow-lg active:scale-95">
              注册
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => window.dispatchEvent(new Event('openCommandMenu'))}
              className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-100 p-2 transition-all mr-1"
            >
              <Search className="h-6 w-6" />
            </button>
            <button className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-100 p-2 transition-all">
              <Menu className="h-7 w-7" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
