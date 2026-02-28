import { useState, useEffect } from 'react';
import { Combine, Scissors, Minimize2, Image as ImageIcon, ArrowLeft, RotateCw, Type, Lock, FileImage, Hash } from 'lucide-react';
import ToolCard from '../components/ToolCard';
import FileUploader from '../components/FileUploader';
import MergePDF from './MergePDF';
import SplitPDF from './SplitPDF';
import WatermarkPDF from './WatermarkPDF';
import PdfToImage from './PdfToImage';
import CompressPDF from './CompressPDF';
import EncryptPDF from './EncryptPDF';
import PdfPageEditor from './PdfPageEditor';
import ImageToPdf from './ImageToPdf';
import AddPageNumbers from './AddPageNumbers';
import Layout from '../components/Layout';
import History from './History';
import About from './About';
import Help from './Help';
import Privacy from './Privacy';
import Terms from './Terms';

export default function Home() {
  const [currentTab, setCurrentTab] = useState<string>('tools');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const tools = [
    {
      id: 'merge',
      title: '合并 PDF',
      description: '按您想要的顺序将多个文件合并为一个 PDF。',
      icon: <Combine className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'split',
      title: '拆分 PDF',
      description: '从 PDF 中提取一页或多页，或者将每一页转换为独立的 PDF 文件。',
      icon: <Scissors className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'editor',
      title: '页面编辑器',
      description: '可视化旋转、删除和重新排列 PDF 页面。',
      icon: <RotateCw className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'compress',
      title: '压缩 PDF',
      description: '在保持最佳质量的同时，减小 PDF 文件的大小。',
      icon: <Minimize2 className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'pdf-to-jpg',
      title: 'PDF 转图片',
      description: '将 PDF 文件的每一页转换为 JPG 图片，或提取 PDF 中的所有图片。',
      icon: <ImageIcon className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'jpg-to-pdf',
      title: '图片转 PDF',
      description: '将 JPG、PNG、WebP 图片转换为 PDF 文件，可自定义页面大小。',
      icon: <FileImage className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'watermark',
      title: '添加水印',
      description: '选择图片或文本并将其插入到您的 PDF 中。选择排版、透明度和位置。',
      icon: <Type className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'page-numbers',
      title: '添加页码',
      description: '在 PDF 文档中添加页码。选择位置、尺寸和排版。',
      icon: <Hash className="w-12 h-12" strokeWidth={1.5} />,
    },
    {
      id: 'encrypt',
      title: 'PDF 加密',
      description: '为您的 PDF 设置密码并限制权限，保护您的隐私。',
      icon: <Lock className="w-12 h-12" strokeWidth={1.5} />,
    },
  ];

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (['history', 'about', 'help', 'privacy', 'terms'].includes(hash)) {
        setCurrentTab(hash);
        setSelectedTool(null);
      } else if (tools.some(t => t.id === hash)) {
        setCurrentTab('tools');
        setSelectedTool(hash);
      } else {
        setCurrentTab('tools');
        setSelectedTool(null);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleToolClick = (toolId: string) => {
    window.location.hash = toolId;
  };

  const handleBack = () => {
    window.location.hash = '';
  };

  const handleFilesSelected = (files: File[]) => {
    console.log(`Processing ${files.length} files for tool: ${selectedTool}`);
    alert(`准备处理 ${files.length} 个文件！`);
  };

  const renderContent = () => {
    if (currentTab === 'history') {
      return <History />;
    }
    if (currentTab === 'about') {
      return <About onBack={handleBack} />;
    }
    if (currentTab === 'help') {
      return <Help onBack={handleBack} />;
    }
    if (currentTab === 'privacy') {
      return <Privacy onBack={handleBack} />;
    }
    if (currentTab === 'terms') {
      return <Terms onBack={handleBack} />;
    }

    if (selectedTool === 'merge') {
      return <MergePDF onBack={handleBack} />;
    }

    if (selectedTool === 'split') {
      return <SplitPDF onBack={handleBack} />;
    }

    if (selectedTool === 'compress') {
      return <CompressPDF onBack={handleBack} />;
    }

    if (selectedTool === 'editor') {
      return <PdfPageEditor onBack={handleBack} />;
    }

    if (selectedTool === 'watermark') {
      return <WatermarkPDF onBack={handleBack} />;
    }

    if (selectedTool === 'page-numbers') {
      return <AddPageNumbers onBack={handleBack} />;
    }

    if (selectedTool === 'pdf-to-jpg') {
      return <PdfToImage onBack={handleBack} />;
    }

    if (selectedTool === 'jpg-to-pdf') {
      return <ImageToPdf onBack={handleBack} />;
    }

    if (selectedTool === 'encrypt') {
      return <EncryptPDF onBack={handleBack} />;
    }

    if (selectedTool) {
      const tool = tools.find(t => t.id === selectedTool);
      return (
        <div className="flex-grow py-12 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
            <button 
              onClick={handleBack}
              className="flex items-center text-gray-600 dark:text-zinc-400 hover:text-pdf-red dark:hover:text-violet-400 transition-colors font-bold group"
            >
              <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
              返回工具列表
            </button>
          </div>
          <FileUploader 
            title={tool?.title} 
            onFilesSelected={handleFilesSelected} 
          />
        </div>
      );
    }

    return (
      <div className="flex-grow transition-colors">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-zinc-100 mb-6 tracking-tight">
            让 PDF 处理变得<span className="text-pdf-red dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-r dark:from-violet-400 dark:to-indigo-400">更简单</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-zinc-500 max-w-3xl mx-auto font-medium">
            专业、安全、高效的在线 PDF 工具集，满足您的所有文档处理需求。
          </p>
        </div>

        {/* Tools Grid */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {tools.map((tool) => (
              <ToolCard
                key={tool.id}
                title={tool.title}
                description={tool.description}
                icon={tool.icon}
                onClick={() => handleToolClick(tool.id)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout currentTab={currentTab} onTabChange={(tab) => {
      window.location.hash = tab === 'tools' ? '' : tab;
    }}>
      {renderContent()}
    </Layout>
  );
}
