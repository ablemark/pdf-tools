import { Menu, ChevronDown } from 'lucide-react';
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
  ];

  return (
    <nav className="bg-white dark:bg-slate-900/80 shadow-sm sticky top-0 z-50 transition-colors border-b border-gray-100 dark:border-slate-800 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {/* Logo */}
            <a href="#" className="flex-shrink-0 flex items-center cursor-pointer">
              <div className="bg-pdf-red text-white font-bold text-xl p-1 rounded mr-1">PDF</div>
              <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-slate-200">Tools</span>
            </a>
            
            {/* Desktop Menu */}
            <div className="hidden md:ml-8 md:flex md:space-x-8">
              <div className="relative group" ref={menuRef}>
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-700 dark:text-slate-300 hover:text-pdf-red dark:hover:text-pdf-red inline-flex items-center px-1 pt-1 text-sm font-medium h-16 transition-colors"
                >
                  全部 PDF 工具
                  <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 focus:outline-none py-1 z-50 border border-gray-100 dark:border-slate-700">
                    {tools.map(tool => (
                      <a
                        key={tool.id}
                        href={`#${tool.id}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-pdf-red dark:hover:text-red-400 transition-colors"
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
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-gray-700 dark:text-slate-300 hover:text-pdf-red dark:hover:text-pdf-red text-sm font-medium px-3 py-2 transition-colors">
              登录
            </button>
            <button className="bg-pdf-red hover:bg-pdf-red-hover text-white text-sm font-medium px-4 py-2 rounded transition-colors">
              注册
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button className="text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 p-2 transition-colors">
              <Menu className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
