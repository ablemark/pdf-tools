export default function Footer() {
  return (
    <footer className="bg-white dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 mt-auto backdrop-blur-xl glass">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-8 md:order-2">
            <a href="#about" className="text-gray-400 dark:text-zinc-500 hover:text-pdf-red dark:hover:text-violet-400 text-sm font-black uppercase tracking-widest transition-colors">
              关于我们
            </a>
            <a href="#help" className="text-gray-400 dark:text-zinc-500 hover:text-pdf-red dark:hover:text-violet-400 text-sm font-black uppercase tracking-widest transition-colors">
              帮助中心
            </a>
            <a href="#privacy" className="text-gray-400 dark:text-zinc-500 hover:text-pdf-red dark:hover:text-violet-400 text-sm font-black uppercase tracking-widest transition-colors">
              隐私政策
            </a>
            <a href="#terms" className="text-gray-400 dark:text-zinc-500 hover:text-pdf-red dark:hover:text-violet-400 text-sm font-black uppercase tracking-widest transition-colors">
              服务条款
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">
              &copy; {new Date().getFullYear()} PDF Tools. 保留所有权利。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
