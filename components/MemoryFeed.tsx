import React from 'react';
import { Memory, MemoryType } from '../types';
import MemoryCard from './MemoryCard';
import { FilterIcon, SearchIcon, TextIcon, ImageIcon, LinkIcon, XIcon, LayoutGridIcon, ClockIcon, ListIcon, BrainCircuitIcon } from './icons';

interface MemoryFeedProps {
  memories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  onDeleteMemory: (id: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  activeFilter: FilterType;
  onActiveFilterChange: (filter: FilterType) => void;
  aiFilteredMemoryIds: string[] | null;
  onClearAiFilter: () => void;
  activeTagFilter: string | null;
  onTagFilterChange: (tag: string | null) => void;
  selectedIds: Set<string>;
  onToggleMemorySelection: (id: string) => void;
  viewMode: 'feed' | 'timeline' | 'canvas' | 'graph';
  onViewModeChange: (mode: 'feed' | 'timeline' | 'canvas' | 'graph') => void;
}

type FilterType = 'all' | MemoryType;

const FilterButton: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium rounded-full flex items-center space-x-2 transition-colors duration-200 ${
      active
        ? 'bg-science-blue text-white'
        : 'bg-shark hover:bg-gray-700 text-loblolly'
    }`}
  >
    {children}
  </button>
);

const ViewModeButton: React.FC<{
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    ariaLabel: string;
}> = ({ active, onClick, children, ariaLabel }) => (
    <button
        onClick={onClick}
        aria-label={ariaLabel}
        className={`p-2 rounded-md transition-colors duration-200 ${
            active ? 'bg-science-blue text-white' : 'bg-shark hover:bg-gray-700 text-loblolly'
        }`}
    >
        {children}
    </button>
);

export default function MemoryFeed({
  memories,
  onSelectMemory,
  onDeleteMemory,
  searchTerm,
  onSearchTermChange,
  activeFilter,
  onActiveFilterChange,
  aiFilteredMemoryIds,
  onClearAiFilter,
  activeTagFilter,
  onTagFilterChange,
  selectedIds,
  onToggleMemorySelection,
  viewMode,
  onViewModeChange,
}: MemoryFeedProps) {

  return (
    <div className="space-y-4">
      <div className="sticky top-[61px] z-10 bg-bunker pt-4 pb-2">
        <div className="relative mb-4">
          <input
            type="text"
            placeholder="Search memories by content or #tag..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="w-full bg-shark border border-gray-700 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-science-blue focus:outline-none"
          />
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-nevada" />
        </div>
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <FilterButton active={activeFilter === 'all'} onClick={() => onActiveFilterChange('all')}>
                    <FilterIcon className="w-4 h-4" />
                    <span>All</span>
                </FilterButton>
                <FilterButton active={activeFilter === MemoryType.TEXT} onClick={() => onActiveFilterChange(MemoryType.TEXT)}>
                    <TextIcon className="w-4 h-4" />
                    <span>Text</span>
                </FilterButton>
                <FilterButton active={activeFilter === MemoryType.IMAGE} onClick={() => onActiveFilterChange(MemoryType.IMAGE)}>
                    <ImageIcon className="w-4 h-4" />
                    <span>Images</span>
                </FilterButton>
                <FilterButton active={activeFilter === MemoryType.LINK} onClick={() => onActiveFilterChange(MemoryType.LINK)}>
                    <LinkIcon className="w-4 h-4" />
                    <span>Links</span>
                </FilterButton>
            </div>
            <div className="flex items-center space-x-1 pb-2 flex-shrink-0 ml-2">
                <ViewModeButton active={viewMode === 'feed'} onClick={() => onViewModeChange('feed')} ariaLabel="Feed view">
                    <ListIcon className="w-5 h-5" />
                </ViewModeButton>
                <ViewModeButton active={viewMode === 'timeline'} onClick={() => onViewModeChange('timeline')} ariaLabel="Timeline view">
                    <ClockIcon className="w-5 h-5" />
                </ViewModeButton>
                 <ViewModeButton active={viewMode === 'canvas'} onClick={() => onViewModeChange('canvas')} ariaLabel="Canvas view">
                    <LayoutGridIcon className="w-5 h-5" />
                </ViewModeButton>
                <ViewModeButton active={viewMode === 'graph'} onClick={() => onViewModeChange('graph')} ariaLabel="Graph view">
                    <BrainCircuitIcon className="w-5 h-5" />
                </ViewModeButton>
            </div>
        </div>
      </div>

      {aiFilteredMemoryIds !== null && (
        <div className="bg-shark/80 p-3 rounded-lg border border-science-blue/50 flex justify-between items-center animate-fade-in">
          <p className="text-sm text-loblolly">
            Showing <span className="font-bold">{memories.length}</span> memories found by AI.
          </p>
          <button 
            onClick={onClearAiFilter}
            className="text-xs font-semibold text-science-blue hover:underline flex items-center space-x-1"
          >
            <XIcon className="w-4 h-4" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {activeTagFilter && (
        <div className="bg-shark/80 p-3 rounded-lg border border-science-blue/50 flex justify-between items-center animate-fade-in">
          <p className="text-sm text-loblolly">
            Filtering for tag: <span className="font-bold bg-gray-700 text-loblolly px-2 py-0.5 rounded-full">#{activeTagFilter}</span>
          </p>
          <button 
            onClick={() => onTagFilterChange(null)}
            className="text-xs font-semibold text-science-blue hover:underline flex items-center space-x-1"
          >
            <XIcon className="w-4 h-4" />
            <span>Clear Filter</span>
          </button>
        </div>
      )}

      {viewMode === 'feed' && (
        <>
            {memories.length > 0 ? (
                <div className="space-y-4 animate-fade-in">
                {memories.map(memory => (
                    <MemoryCard
                    key={memory.id}
                    memory={memory}
                    onSelect={() => onSelectMemory(memory)}
                    onDelete={() => onDeleteMemory(memory.id)}
                    onTagClick={onTagFilterChange}
                    isSelected={selectedIds.has(memory.id)}
                    onToggleSelection={() => onToggleMemorySelection(memory.id)}
                    />
                ))}
                </div>
            ) : (
                <div className="text-center py-16 text-nevada">
                <p className="font-medium">No memories found.</p>
                <p className="text-sm">{aiFilteredMemoryIds !== null ? "The AI couldn't find any relevant memories for your query." : "Try adjusting your filters or add a new memory."}</p>
                </div>
            )}
        </>
      )}
    </div>
  );
}