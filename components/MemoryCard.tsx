import React from 'react';
import { Memory, MemoryType } from '../types';
import { TextIcon, ImageIcon, LinkIcon, SparklesIcon, TrashIcon, LoaderIcon, SquareIcon, CheckSquareIcon } from './icons';

interface MemoryCardProps {
  memory: Memory;
  onSelect: () => void;
  onDelete: () => void;
  onTagClick: (tag: string) => void;
  isSelected: boolean;
  onToggleSelection: () => void;
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onSelect, onDelete, onTagClick, isSelected, onToggleSelection }) => {
  const { type, content, smartSummary, createdAt, description, tags } = memory;

  const renderIcon = () => {
    switch (type) {
      case MemoryType.TEXT:
        return <TextIcon className="w-5 h-5 text-nevada" />;
      case MemoryType.IMAGE:
        return <ImageIcon className="w-5 h-5 text-nevada" />;
      case MemoryType.LINK:
        return <LinkIcon className="w-5 h-5 text-nevada" />;
      default:
        return null;
    }
  };

  const renderContentPreview = () => {
    switch (type) {
      case MemoryType.TEXT:
        return <p className="text-sm text-loblolly line-clamp-3">{content}</p>;
      case MemoryType.IMAGE:
        return (
          <div>
            <img src={content} alt="Memory" className="rounded-lg max-h-48 w-full object-cover" />
            {description && <p className="text-xs text-nevada mt-2 italic">AI Description: "{description}"</p>}
          </div>
        );
      case MemoryType.LINK:
        return (
          <a
            href={content}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-sm text-blue-400 hover:underline break-all"
          >
            {content}
          </a>
        );
      default:
        return null;
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this memory?')) {
        onDelete();
    }
  };
  
  const handleToggle = (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggleSelection();
  };

  return (
    <div
      onClick={onSelect}
      className={`bg-shark p-4 rounded-lg border cursor-pointer hover:border-science-blue transition-all duration-200 relative ${isSelected ? 'border-science-blue' : 'border-gray-700'}`}
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-2 text-nevada text-xs">
          {renderIcon()}
          <span>{new Date(createdAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center space-x-2 z-10">
            <button onClick={handleDelete} className="p-1.5 rounded-full text-nevada hover:bg-red-900/50 hover:text-red-400 transition-colors duration-200">
                <TrashIcon className="w-4 h-4" />
            </button>
        </div>
      </div>
      
      <button onClick={handleToggle} className="absolute top-2 right-14 p-2 text-nevada hover:text-white" aria-label="Select memory">
          {isSelected ? <CheckSquareIcon className="w-5 h-5 text-science-blue" /> : <SquareIcon className="w-5 h-5" />}
      </button>

      <div className="mt-3 mr-8">{renderContentPreview()}</div>
      
      {smartSummary && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
            <h4 className="text-sm font-bold text-science-blue flex items-center space-x-1.5">
                <SparklesIcon className="w-4 h-4"/>
                <span>{smartSummary.title}</span>
            </h4>
            <p className="text-sm text-loblolly line-clamp-2">{smartSummary.summary}</p>
             {smartSummary.keyPoints && smartSummary.keyPoints.length > 0 && (
                <ul className="text-xs text-nevada list-disc list-inside space-y-1">
                    {smartSummary.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
                </ul>
            )}
        </div>
      )}
       {tags && tags.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-700 flex flex-wrap gap-2">
          {tags.map(tag => (
            <button
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="text-xs bg-gray-700 text-loblolly px-2 py-0.5 rounded-full hover:bg-science-blue hover:text-white transition-colors"
              aria-label={`Filter by tag: ${tag}`}
            >
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryCard;