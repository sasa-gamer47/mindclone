import React, { useMemo } from 'react';
import { Memory, MemoryType } from '../types';
import { TextIcon, ImageIcon, LinkIcon } from './icons';

const getGroupKey = (date: Date, today: Date): string => {
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeDiff = today.getTime() - startOfDate.getTime();
    const dayDiff = Math.floor(timeDiff / (1000 * 3600 * 24));

    if (dayDiff === 0) return "Today";
    if (dayDiff === 1) return "Yesterday";
    if (dayDiff < 7) return "This Week";
    
    const startOfThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (startOfDate >= startOfThisMonth) return "This Month";
    
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

const groupMemoriesByDate = (memories: Memory[]): { [key: string]: Memory[] } => {
    const groups: { [key: string]: Memory[] } = {};
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    memories.forEach(mem => {
        const memDate = new Date(mem.createdAt);
        const groupKey = getGroupKey(memDate, today);
        if (!groups[groupKey]) {
            groups[groupKey] = [];
        }
        groups[groupKey].push(mem);
    });

    return groups;
};

const renderIcon = (type: MemoryType) => {
    switch (type) {
      case MemoryType.TEXT:
        return <TextIcon className="w-4 h-4 text-nevada" />;
      case MemoryType.IMAGE:
        return <ImageIcon className="w-4 h-4 text-nevada" />;
      case MemoryType.LINK:
        return <LinkIcon className="w-4 h-4 text-nevada" />;
      default:
        return null;
    }
};

interface TimelineViewProps {
  memories: Memory[];
  onMemorySelect: (memory: Memory) => void;
}

export default function TimelineView({ memories, onMemorySelect }: TimelineViewProps) {
    const groupedMemories = useMemo(() => groupMemoriesByDate(memories), [memories]);

    const getSortableDate = (key: string): Date => {
        const now = new Date();
        switch (key) {
            case "Today": return now;
            case "Yesterday": return new Date(now.getTime() - 86400000);
            case "This Week": return new Date(now.getTime() - 2 * 86400000);
            case "This Month": return new Date(now.getFullYear(), now.getMonth(), 1);
            default: return new Date(key); // Handles "June 2024"
        }
    }

    const sortedGroupKeys = useMemo(() => {
        return Object.keys(groupedMemories).sort((a,b) => getSortableDate(b).getTime() - getSortableDate(a).getTime());
    }, [groupedMemories]);


    if (memories.length === 0) {
        return (
            <div className="text-center py-16 text-nevada">
                <p className="font-medium">No memories found.</p>
                <p className="text-sm">Try adjusting your filters to see memories in the timeline.</p>
            </div>
        );
    }

    return (
        <div className="relative mt-4 animate-fade-in">
            <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-gray-700" aria-hidden="true"></div>
            
            <div className="ml-4 space-y-8">
                {sortedGroupKeys.map(groupKey => (
                    <div key={groupKey} className="relative">
                        <div className="flex items-center">
                            <div className="absolute left-[-15.5px] z-10 w-4 h-4 bg-science-blue rounded-full border-2 border-bunker" aria-hidden="true"></div>
                            <h3 className="pl-6 font-bold text-lg text-loblolly">{groupKey}</h3>
                        </div>
                        <div className="mt-4 pl-6 space-y-4">
                            {groupedMemories[groupKey].map(memory => (
                                <button
                                    key={memory.id}
                                    onClick={() => onMemorySelect(memory)}
                                    className="w-full text-left p-3 bg-shark rounded-lg border border-gray-700 hover:border-science-blue transition-colors flex items-start space-x-3"
                                    aria-label={`View memory from ${new Date(memory.createdAt).toLocaleString()}`}
                                >
                                    <div className="flex-shrink-0 mt-1">{renderIcon(memory.type)}</div>
                                    <div className="flex-1 overflow-hidden">
                                        <p className="text-sm font-semibold text-loblolly truncate">
                                            {memory.smartSummary?.title || (memory.type === MemoryType.IMAGE ? memory.description : memory.content) || `Memory from ${new Date(memory.createdAt).toLocaleDateString()}`}
                                        </p>
                                        <p className="text-xs text-nevada mt-1">
                                            {new Date(memory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}