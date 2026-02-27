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
      className="bg-white dark:bg-slate-900/50 rounded-xl p-6 flex flex-col items-center text-center cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 dark:border-slate-800 dark:hover:border-red-500/50 dark:hover:shadow-[0_0_15px_rgba(239,68,68,0.1)] group glass"
    >
      <div className="text-pdf-red mb-4 group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-2 group-hover:text-pdf-red dark:group-hover:text-pdf-red transition-colors">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
