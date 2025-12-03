import React, { useMemo } from 'react';
import { Memory, MemoryType } from '../types';
import { TextIcon, ImageIcon, LinkIcon } from './icons';

interface CanvasViewProps {
  memories: Memory[];
  onMemorySelect: (memory: Memory) => void;
}

const MiniCard: React.FC<{ memory: Memory; onSelect: (memory: Memory) => void; }> = ({ memory, onSelect }) => {
    const { type, content, smartSummary, description } = memory;

    const renderPreview = () => {
        switch (type) {
            case MemoryType.IMAGE:
                return <img src={content} alt={description || 'Image memory'} className="w-full h-full object-cover" />;
            case MemoryType.TEXT:
                return (
                    <div className="p-2 flex flex-col items-center justify-center h-full text-center">
                        <TextIcon className="w-6 h-6 text-nevada mb-2" />
                        <p className="text-xs text-loblolly line-clamp-3">{smartSummary?.title || content}</p>
                    </div>
                );
            case MemoryType.LINK:
                 let domain = 'Link';
                 try {
                     domain = new URL(content).hostname;
                 } catch (e) { /* Ignore invalid URLs */ }
                return (
                    <div className="p-2 flex flex-col items-center justify-center h-full text-center">
                        <LinkIcon className="w-6 h-6 text-nevada mb-2" />
                        <p className="text-xs text-blue-400 break-all line-clamp-3">{domain}</p>
                    </div>
                );
            default:
                return null;
        }
    };
    
    const title = smartSummary?.title || (type === MemoryType.IMAGE ? description : content) || `Memory from ${new Date(memory.createdAt).toLocaleDateString()}`;

    return (
        <button
            onClick={() => onSelect(memory)}
            className="aspect-square bg-shark rounded-lg border border-gray-700 hover:border-science-blue transition-all duration-200 overflow-hidden focus:outline-none focus:ring-2 focus:ring-science-blue"
            aria-label={`View memory: ${title}`}
            title={title}
        >
           {renderPreview()}
        </button>
    )
};


export default function CanvasView({ memories, onMemorySelect }: CanvasViewProps) {
    const groupedMemories = useMemo(() => {
        const groups: { [key: string]: Memory[] } = {};
        const untagged: Memory[] = [];

        memories.forEach(mem => {
            // Each memory appears in only one group.
            // We assign it to its first tag, or to 'Untagged' if it has no tags.
            if (mem.tags && mem.tags.length > 0) {
                const primaryTag = mem.tags[0]; 
                if (!groups[primaryTag]) {
                    groups[primaryTag] = [];
                }
                groups[primaryTag].push(mem);
            } else {
                untagged.push(mem);
            }
        });

        const sortedGroupKeys = Object.keys(groups).sort((a,b) => a.localeCompare(b));
        const sortedGroups: { [key: string]: Memory[] } = {};
        
        sortedGroupKeys.forEach(key => {
            sortedGroups[key] = groups[key];
        });

        if (untagged.length > 0) {
            sortedGroups['Untagged'] = untagged;
        }

        return sortedGroups;
    }, [memories]);

    if (memories.length === 0) {
        return (
            <div className="text-center py-16 text-nevada">
                <p className="font-medium">No memories found.</p>
                <p className="text-sm">Try adjusting your filters to see memories in the canvas view.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-10 mt-4 animate-fade-in">
            {Object.entries(groupedMemories).map(([groupName, groupMemories]) => (
                <div key={groupName}>
                    <h3 className="text-xl font-bold text-loblolly mb-4 pb-2 border-b-2 border-gray-700">
                        <span className="text-science-blue">#</span>{groupName}
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {/* Fix: Add type assertion for `groupMemories` as Object.entries can return `unknown` for values. */}
                        {(groupMemories as Memory[]).map(mem => (
                            <MiniCard key={mem.id} memory={mem} onSelect={onMemorySelect} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    )

}