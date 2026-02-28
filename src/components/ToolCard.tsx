import { ReactNode } from 'react';

interface ToolCardProps {
  key?: string | number;
  title: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
}

export default function ToolCard({ title, description, icon, onClick }: ToolCardProps) {
  return (
    <div 
      onClick={onClick}
      className="bg-white dark:bg-white/[0.02] dark:backdrop-blur-xl rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all duration-500 hover:shadow-xl hover:-translate-y-2 border border-gray-100 dark:border-white/[0.05] dark:hover:border-indigo-500/50 dark:hover:bg-white/[0.04] group glass"
    >
      <div className="text-pdf-red dark:text-zinc-600 mb-6 group-hover:scale-110 group-hover:text-cyan-400 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)] transition-all duration-500">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-zinc-100 mb-3 group-hover:text-pdf-red dark:group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-zinc-500 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
