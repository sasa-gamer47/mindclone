import React, { useState, useMemo, useEffect } from 'react';
import { Memory, MemoryType, ChatMessage, GroundingSource } from './types';
import useMemories from './hooks/useMemories';
import Header from './components/Header';
import MemoryFeed from './components/MemoryFeed';
import MemoryDetailView from './components/MemoryDetailView';
import AddMemoryModal from './components/AddMemoryModal';
import FloatingActionButton from './components/FloatingActionButton';
import { generateSmartSummary, chatWithTextMemory, describeImage, queryAllMemories, performTextAction, chatWithImageMemory, generateStoryFromImage, continueWriting, analyzeImage, planTrip, findRelatedMemories, getDashboardInsights } from './services/geminiService';
import GlobalChat from './components/GlobalChat';
import BulkTagModal from './components/BulkTagModal';
import { TagIcon, TrashIcon, XIcon } from './components/icons';
import TimelineView from './components/TimelineView';
import CanvasView from './components/CanvasView';
import AIInsights from './components/AIInsights';
import MemoryGraphView from './components/MemoryGraphView';

export default function App() {
  const { memories, addMemory, updateMemory, deleteMemory, deleteMultipleMemories, addTagsToMultipleMemories } = useMemories();
  const [selectedMemory, setSelectedMemory] = useState<Memory | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const [globalChatHistory, setGlobalChatHistory] = useState<ChatMessage[]>([]);
  const [aiFilteredMemoryIds, setAiFilteredMemoryIds] = useState<string[] | null>(null);
  const [isGlobalChatLoading, setIsGlobalChatLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<MemoryType | 'all'>('all');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'feed' | 'timeline' | 'canvas' | 'graph'>('feed');
  
  // State for bulk actions
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBulkTagModalOpen, setIsBulkTagModalOpen] = useState(false);
  const [isBulkLoading, setIsBulkLoading] = useState(false);

  // State for AI insights
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);
  const [insightsFetched, setInsightsFetched] = useState(false);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  const isSelectionMode = selectedIds.size > 0;

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // Fetch insights when memories are loaded
  useEffect(() => {
    if (memories && memories.length > 0 && !insightsFetched) {
        const fetchInsights = async () => {
            setIsInsightsLoading(true);
            const insights = await getDashboardInsights(memories);
            setAiInsights(insights);
            setIsInsightsLoading(false);
            setInsightsFetched(true);
        };
        fetchInsights();
    } else if (memories && memories.length === 0) {
        // Reset if all memories are deleted
        setInsightsFetched(false);
        setAiInsights([]);
        setIsInsightsLoading(false);
    }
  }, [memories, insightsFetched]);

  const handleSelectMemory = (memory: Memory) => {
    setSelectedMemory(memory);
  };

  const handleCloseDetailView = () => {
    setSelectedMemory(null);
  };

  const handleGenerateSmartSummary = async (memoryId: string) => {
    const memory = memories.find(m => m.id === memoryId);
    if (!memory || (memory.type !== 'text' && memory.type !== 'link')) return;

    updateMemory(memoryId, { ...memory, isProcessingSummary: true });

    try {
      const smartSummary = await generateSmartSummary(memory.content);
      updateMemory(memoryId, { ...memory, smartSummary, isProcessingSummary: false });
    } catch (error) {
      console.error('Failed to generate smart summary:', error);
      updateMemory(memoryId, { ...memory, isProcessingSummary: false });
    }
  };

  const handleFindRelatedMemories = async (memoryId: string) => {
    const memory = memories.find(m => m.id === memoryId);
    if (!memory) return;

    updateMemory(memoryId, { isProcessingAi: true });
    try {
      const relatedIds = await findRelatedMemories(memory, memories);
      updateMemory(memoryId, { relatedMemoryIds: relatedIds, isProcessingAi: false });
    } catch (error) {
      console.error('Failed to find related memories:', error);
      updateMemory(memoryId, { isProcessingAi: false });
    }
  };

  const handleGlobalQuery = async (query: string) => {
    const userMessage: ChatMessage = { sender: 'user', text: query };
    const newHistoryWithUserMessage = [...globalChatHistory, userMessage];
    setGlobalChatHistory(newHistoryWithUserMessage);
    setIsGlobalChatLoading(true);

    try {
      const { text, memoryIds, groundingChunks } = await queryAllMemories(query, globalChatHistory, memories);
      
      const sources: GroundingSource[] = groundingChunks
        ?.map((chunk: any) => chunk.web)
        .filter((web: any) => web && web.uri)
        .map((web: any) => ({ uri: web.uri, title: web.title })) || [];

      const aiMessage: ChatMessage = { sender: 'ai', text, sources };
      setGlobalChatHistory([...newHistoryWithUserMessage, aiMessage]);
      setAiFilteredMemoryIds(memoryIds);
    } catch (error) {
      console.error("Failed to execute global query:", error);
      const errorMessage: ChatMessage = { sender: 'ai', text: "Sorry, I encountered an error while searching your memories. Please try again." };
      setGlobalChatHistory([...newHistoryWithUserMessage, errorMessage]);
      setAiFilteredMemoryIds([]);
    } finally {
      setIsGlobalChatLoading(false);
    }
  };
  
  const handleInsightClick = (prompt: string) => {
    handleGlobalQuery(prompt);
  };

  const handleClearAiFilter = () => {
    setAiFilteredMemoryIds(null);
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    if (aiFilteredMemoryIds) setAiFilteredMemoryIds(null);
  };

  const handleFilterChange = (filter: MemoryType | 'all') => {
    setActiveFilter(filter);
    if (aiFilteredMemoryIds) setAiFilteredMemoryIds(null);
  };
  
  const handleTagFilterChange = (tag: string | null) => {
    setActiveTagFilter(tag);
    if (aiFilteredMemoryIds) setAiFilteredMemoryIds(null);
  };

  const handleToggleMemorySelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.size} memories?`)) {
      await deleteMultipleMemories(Array.from(selectedIds));
      setSelectedIds(new Set());
    }
  };

  const handleSaveBulkTags = async (tags: string[]) => {
    if (selectedIds.size === 0 || tags.length === 0) return;
    setIsBulkLoading(true);
    await addTagsToMultipleMemories(Array.from(selectedIds), tags);
    setIsBulkTagModalOpen(false);
    setSelectedIds(new Set());
    setIsBulkLoading(false);
  };
  
  const handleClearSelection = () => {
      setSelectedIds(new Set());
  };
  
  const filteredMemories = useMemo(() => {
    // Start with safety checks
    if (!memories) return [];
    
    let filtered = memories.filter(memory => !!memory); // Filter out any null/undefined entries

    // AI filter has top priority
    if (aiFilteredMemoryIds !== null) {
      const idSet = new Set(aiFilteredMemoryIds);
      return filtered.filter(mem => idSet.has(mem.id));
    }

    // Apply manual filters
    return filtered
      .filter(memory => { // Tag filter
        if (!activeTagFilter) return true;
        return memory.tags?.includes(activeTagFilter);
      })
      .filter(memory => { // Type filter
        if (activeFilter === 'all') return true;
        return memory.type === activeFilter;
      })
      .filter(memory => { // Search term filter
        if (!searchTerm.trim()) return true;
        const lowerSearch = searchTerm.toLowerCase();
        // Search in content, description, title, or tags
        const contentToSearch = memory.type === MemoryType.IMAGE ? memory.description : memory.content;
        const tagsToSearch = memory.tags?.join(' ').toLowerCase() || '';
        const titleToSearch = memory.smartSummary?.title?.toLowerCase() || '';
        return contentToSearch?.toLowerCase().includes(lowerSearch) || 
               tagsToSearch.includes(lowerSearch) ||
               titleToSearch.includes(lowerSearch);
      });
  }, [memories, searchTerm, activeFilter, aiFilteredMemoryIds, activeTagFilter]);


  return (
    <div className="min-h-screen bg-bunker font-sans">
      <Header 
        showInstallButton={!!deferredPrompt}
        onInstallClick={handleInstallClick}
      />
      <main className="container mx-auto p-4 pb-40 max-w-3xl">
        {selectedMemory ? (
          <MemoryDetailView
            memory={selectedMemory}
            allMemories={memories}
            onSelectMemory={handleSelectMemory}
            onClose={handleCloseDetailView}
            chatWithTextMemory={chatWithTextMemory}
            chatWithImageMemory={chatWithImageMemory}
            performTextAction={performTextAction}
            generateStoryFromImage={generateStoryFromImage}
            onGenerateSmartSummary={handleGenerateSmartSummary}
            onFindRelatedMemories={handleFindRelatedMemories}
            continueWriting={continueWriting}
            analyzeImage={analyzeImage}
            planTrip={planTrip}
            onAddMemory={addMemory}
            onUpdateMemory={updateMemory}
          />
        ) : (
          <>
            <GlobalChat
              onQuery={handleGlobalQuery}
              history={globalChatHistory}
              isLoading={isGlobalChatLoading}
            />
            <AIInsights
              insights={aiInsights}
              isLoading={isInsightsLoading}
              onInsightClick={handleInsightClick}
            />
            <MemoryFeed
              memories={filteredMemories}
              onSelectMemory={handleSelectMemory}
              onDeleteMemory={deleteMemory}
              searchTerm={searchTerm}
              onSearchTermChange={handleSearchTermChange}
              activeFilter={activeFilter}
              onActiveFilterChange={handleFilterChange}
              aiFilteredMemoryIds={aiFilteredMemoryIds}
              onClearAiFilter={handleClearAiFilter}
              activeTagFilter={activeTagFilter}
              onTagFilterChange={handleTagFilterChange}
              selectedIds={selectedIds}
              onToggleMemorySelection={handleToggleMemorySelection}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
             {viewMode === 'timeline' && (
                <TimelineView
                    memories={filteredMemories}
                    onMemorySelect={handleSelectMemory}
                />
            )}
             {viewMode === 'canvas' && (
                <CanvasView
                    memories={filteredMemories}
                    onMemorySelect={handleSelectMemory}
                />
            )}
            {viewMode === 'graph' && (
                <MemoryGraphView
                    memories={filteredMemories}
                    onNodeClick={handleSelectMemory}
                />
            )}
          </>
        )}
      </main>
      
      {!selectedMemory && isSelectionMode ? (
        <div className="fixed bottom-0 left-0 right-0 bg-shark/90 backdrop-blur-sm border-t border-gray-700 p-4 z-20 animate-fade-in">
          <div className="container mx-auto max-w-3xl flex justify-between items-center">
            <div className="font-bold text-sm sm:text-base">{selectedIds.size} selected</div>
            <div className="flex items-center space-x-2">
              <button onClick={() => setIsBulkTagModalOpen(true)} className="flex items-center space-x-2 px-3 py-2 bg-bunker border border-gray-600 rounded-md text-sm font-medium text-loblolly hover:bg-gray-700">
                <TagIcon className="w-4 h-4" />
                <span>Add Tags</span>
              </button>
              <button onClick={handleBulkDelete} className="flex items-center space-x-2 px-3 py-2 bg-bunker border border-gray-600 rounded-md text-sm font-medium text-red-400 hover:bg-red-900/50">
                <TrashIcon className="w-4 h-4" />
                <span>Delete</span>
              </button>
               <button onClick={handleClearSelection} className="p-2 rounded-md bg-bunker border border-gray-600 text-nevada hover:bg-gray-700">
                  <XIcon className="w-5 h-5" />
               </button>
            </div>
          </div>
        </div>
      ) : !selectedMemory && (
        <FloatingActionButton onClick={() => setIsAddModalOpen(true)} />
      )}

      {isAddModalOpen && (
        <AddMemoryModal
          onClose={() => setIsAddModalOpen(false)}
          onAddMemory={addMemory}
          describeImage={describeImage}
          memories={memories}
        />
      )}

      {isBulkTagModalOpen && (
        <BulkTagModal
          onClose={() => setIsBulkTagModalOpen(false)}
          onSave={handleSaveBulkTags}
          isLoading={isBulkLoading}
        />
      )}
    </div>
  );
}