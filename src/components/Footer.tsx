export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex justify-center space-x-6 md:order-2">
            <a href="#about" className="text-gray-400 hover:text-gray-500 text-sm">
              关于我们
            </a>
            <a href="#help" className="text-gray-400 hover:text-gray-500 text-sm">
              帮助中心
            </a>
            <a href="#privacy" className="text-gray-400 hover:text-gray-500 text-sm">
              隐私政策
            </a>
            <a href="#terms" className="text-gray-400 hover:text-gray-500 text-sm">
              服务条款
            </a>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-sm text-gray-400">
              &copy; {new Date().getFullYear()} PDF Tools. 保留所有权利。
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
