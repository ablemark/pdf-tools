import { ReactNode } from 'react';
import { Home, History, Moon, Sun } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';

interface LayoutProps {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, currentTab, onTabChange }: LayoutProps) {
  const { isDark, toggleDark } = useDarkMode();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-[#020205] transition-colors duration-300 relative overflow-hidden">
      {/* Ambient Glow */}
      <div className="absolute top-[-20%] left-[20%] w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none hidden dark:block"></div>
      <div className="absolute bottom-[-10%] right-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px] pointer-events-none hidden dark:block"></div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-white dark:bg-black/20 dark:backdrop-blur-xl border-r border-gray-200 dark:border-white/5 flex flex-col shadow-sm z-10">
        <div className="p-6 flex items-center justify-between md:justify-start">
          <div className="flex items-center cursor-pointer" onClick={() => onTabChange('tools')}>
            <div className="bg-pdf-red dark:bg-gradient-to-br dark:from-violet-600 dark:to-indigo-600 text-white font-bold text-xl p-1 rounded mr-2">PDF</div>
            <span className="font-bold text-xl tracking-tight dark:text-zinc-100">Tools</span>
          </div>
          <button 
            onClick={toggleDark}
            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5 rounded-full transition-colors"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 flex md:flex-col overflow-x-auto md:overflow-visible pb-4 md:pb-0">
          <button
            onClick={() => onTabChange('tools')}
            className={`flex items-center px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'tools' 
                ? 'bg-red-50 text-pdf-red dark:bg-white/5 dark:text-violet-400 font-medium' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5'
            }`}
          >
            <Home className="w-5 h-5 mr-3" />
            工具箱
          </button>
          <button
            onClick={() => onTabChange('history')}
            className={`flex items-center px-4 py-3 rounded-xl transition-all whitespace-nowrap ${
              currentTab === 'history' 
                ? 'bg-red-50 text-pdf-red dark:bg-white/5 dark:text-violet-400 font-medium' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5'
            }`}
          >
            <History className="w-5 h-5 mr-3" />
            历史记录
          </button>
        </nav>

        <div className="hidden md:flex p-4 border-t border-gray-200 dark:border-white/5">
          <button 
            onClick={toggleDark}
            className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/5 rounded-xl transition-all"
          >
            {isDark ? (
              <>
                <Sun className="w-5 h-5 mr-3" />
                浅色模式
              </>
            ) : (
              <>
                <Moon className="w-5 h-5 mr-3" />
                暗黑模式
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
