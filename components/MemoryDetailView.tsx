import React, { useState, useRef, useEffect } from 'react';
import { Memory, ChatMessage, MemoryType, AiAction, SmartSummary } from '../types';
import { ArrowLeftIcon, SendIcon, UserIcon, AiIcon, LoaderIcon, SaveIcon, XIcon, SparklesIcon, TextIcon, ImageIcon, LinkIcon } from './icons';
import AIActionsMenu from './AIActionsMenu';

interface MemoryDetailViewProps {
  memory: Memory;
  allMemories: Memory[];
  onSelectMemory: (memory: Memory) => void;
  onClose: () => void;
  chatWithTextMemory: (memoryContent: string, userQuery: string, history: ChatMessage[]) => Promise<string>;
  chatWithImageMemory: (base64DataUrl: string, userQuery: string, history: ChatMessage[]) => Promise<string>;
  performTextAction: (text: string, prompt: string) => Promise<string>;
  generateStoryFromImage: (base64DataUrl: string) => Promise<string>;
  onGenerateSmartSummary: (memoryId: string) => void;
  onFindRelatedMemories: (memoryId: string) => void;
  continueWriting: (text: string) => Promise<string>;
  analyzeImage: (base64DataUrl: string) => Promise<string>;
  planTrip: (context: string) => Promise<string>;
  onAddMemory: (type: MemoryType, content: string, description?: string, tags?: string[]) => void;
  onUpdateMemory: (id: string, updatedMemory: Partial<Memory>) => void;
}

const RelatedMemoryCard: React.FC<{ memory: Memory; onSelect: () => void; }> = ({ memory, onSelect }) => {
    const renderIcon = () => {
        switch (memory.type) {
            case MemoryType.TEXT: return <TextIcon className="w-4 h-4 text-nevada" />;
            case MemoryType.IMAGE: return <ImageIcon className="w-4 h-4 text-nevada" />;
            case MemoryType.LINK: return <LinkIcon className="w-4 h-4 text-nevada" />;
            default: return null;
        }
    };
    
    const title = memory.smartSummary?.title || (memory.type === MemoryType.IMAGE ? memory.description : memory.content);

    return (
        <button onClick={onSelect} className="w-full text-left p-2 bg-bunker rounded-md hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <div className="flex-shrink-0">{renderIcon()}</div>
            <p className="text-xs text-loblolly truncate">{title}</p>
        </button>
    )
};


export default function MemoryDetailView({ 
  memory, 
  allMemories,
  onSelectMemory,
  onClose, 
  chatWithTextMemory,
  chatWithImageMemory,
  performTextAction,
  generateStoryFromImage,
  onGenerateSmartSummary,
  onFindRelatedMemories,
  continueWriting,
  analyzeImage,
  planTrip,
  onAddMemory,
  onUpdateMemory,
}: MemoryDetailViewProps) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState('');
  const [newTag, setNewTag] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom of chat history when it updates
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;

    const userMessage: ChatMessage = { sender: 'user', text: userInput.trim() };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);
    setUserInput('');
    setIsLoading(true);

    try {
      let aiResponse: string;
      if (memory.type === MemoryType.IMAGE) {
        aiResponse = await chatWithImageMemory(memory.content, userMessage.text, chatHistory);
      } else {
        aiResponse = await chatWithTextMemory(memory.content, userMessage.text, chatHistory);
      }
      const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse };
      setChatHistory([...newHistory, aiMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { sender: 'ai', text: 'Sorry, I encountered an error. Please try again.' };
      setChatHistory([...newHistory, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAiAction = async (action: AiAction, options: { [key: string]: string } = {}) => {
    if (action === AiAction.SMART_SUMMARY) {
        onGenerateSmartSummary(memory.id);
        return;
    }
    if (action === AiAction.FIND_RELATED) {
        onFindRelatedMemories(memory.id);
        return;
    }
      
    setIsLoading(true);

    let userMessageText = '';
    let promise: Promise<string>;

    switch (action) {
        case AiAction.REWRITE:
            userMessageText = `Rewrite this memory in a ${options.tone} tone.`;
            promise = performTextAction(memory.content, `Rewrite the following text in a ${options.tone} tone. Output only the rewritten text.`);
            break;
        case AiAction.TRANSLATE:
            userMessageText = `Translate this memory to ${options.language}.`;
            promise = performTextAction(memory.content, `Translate the following text to ${options.language}. Output only the translated text.`);
            break;
        case AiAction.EXTRACT:
            userMessageText = `Extract key info from this memory.`;
            promise = performTextAction(memory.content, `Extract key information (like people, places, dates, and action items) from the following text. Format the output clearly with headings.`);
            break;
        case AiAction.IDEAS:
            userMessageText = `Generate ideas based on this memory.`;
            promise = performTextAction(memory.content, `Based on the following text, generate a list of creative ideas (e.g., a tweet, a blog post title, related questions to explore). Format the output clearly.`);
            break;
        case AiAction.STORY:
            userMessageText = 'Tell me a story about this image.';
            promise = generateStoryFromImage(memory.content);
            break;
        case AiAction.CONTINUE_WRITING:
            userMessageText = 'Continue writing based on this memory.';
            promise = continueWriting(memory.content);
            break;
        case AiAction.ANALYZE_IMAGE:
            userMessageText = 'Analyze this image in detail.';
            promise = analyzeImage(memory.content);
            break;
        case AiAction.PLAN_TRIP:
            userMessageText = 'Plan a trip based on this memory.';
            promise = planTrip(memory.content);
            break;
        default:
            setIsLoading(false);
            return;
    }

    const userMessage: ChatMessage = { sender: 'user', text: userMessageText };
    const newHistory = [...chatHistory, userMessage];
    setChatHistory(newHistory);

    try {
        const aiResponse = await promise;
        const aiMessage: ChatMessage = { sender: 'ai', text: aiResponse, isSavable: true };
        setChatHistory([...newHistory, aiMessage]);
    } catch (error) {
        const errorMessage: ChatMessage = { sender: 'ai', text: `Sorry, I failed to perform the action. Please try again.` };
        setChatHistory([...newHistory, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleSaveAsNewMemory = (text: string) => {
    onAddMemory(MemoryType.TEXT, text);
    setNotification('Saved as new memory!');
    setTimeout(() => setNotification(''), 3000);
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !memory.tags?.includes(trimmedTag)) {
        const updatedTags = [...(memory.tags || []), trimmedTag];
        onUpdateMemory(memory.id, { tags: updatedTags });
        setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
      const updatedTags = memory.tags?.filter(tag => tag !== tagToRemove);
      onUpdateMemory(memory.id, { tags: updatedTags });
  };


  const renderMemoryContent = () => {
    switch (memory.type) {
      case MemoryType.IMAGE:
        return (
          <>
            <img src={memory.content} alt="Memory content" className="rounded-lg max-w-full mx-auto" />
            {memory.description && <p className="text-sm text-nevada mt-2 italic">AI Description: "{memory.description}"</p>}
          </>
        );
      case MemoryType.LINK:
        return (
          <a href={memory.content} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline break-all">
            {memory.content}
          </a>
        );
      case MemoryType.TEXT:
      default:
        return <p className="whitespace-pre-wrap break-words">{memory.content}</p>;
    }
  };
  
  const renderSmartSummary = () => {
      if (memory.isProcessingSummary) {
          return (
              <div className="mt-4 pt-4 border-t border-gray-700 flex items-center space-x-2 text-nevada">
                  <LoaderIcon className="w-4 h-4 animate-spin"/>
                  <span>Generating Smart Summary...</span>
              </div>
          )
      }
      if (!memory.smartSummary) return null;

      return (
         <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
            <h4 className="text-base font-bold text-science-blue flex items-center space-x-1.5">
                <SparklesIcon className="w-5 h-5"/>
                <span>{memory.smartSummary.title}</span>
            </h4>
            <p className="text-sm text-loblolly">{memory.smartSummary.summary}</p>
             {memory.smartSummary.keyPoints && memory.smartSummary.keyPoints.length > 0 && (
                <div>
                    <h5 className="text-xs font-bold text-nevada mt-3 mb-1">KEY POINTS</h5>
                    <ul className="text-sm text-loblolly list-disc list-inside space-y-1">
                        {memory.smartSummary.keyPoints.map((point, index) => <li key={index}>{point}</li>)}
                    </ul>
                </div>
            )}
        </div>
      )
  };

  const renderRelatedMemories = () => {
    if (memory.isProcessingAi) {
      return (
         <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-bold text-nevada mb-2">Related Memories</h4>
            <div className="flex items-center space-x-2 text-nevada text-sm">
                <LoaderIcon className="w-4 h-4 animate-spin"/>
                <span>Finding connections...</span>
            </div>
         </div>
      )
    }
    
    const relatedMemories = (memory.relatedMemoryIds || [])
        .map(id => allMemories.find(m => m.id === id))
        .filter((m): m is Memory => !!m);

    if (relatedMemories.length === 0) return null;
    
    return (
        <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-bold text-nevada mb-2">Related Memories</h4>
            <div className="space-y-1">
                {relatedMemories.map(relMem => (
                    <RelatedMemoryCard key={relMem.id} memory={relMem} onSelect={() => onSelectMemory(relMem)} />
                ))}
            </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] animate-fade-in">
       {notification && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          {notification}
        </div>
      )}
      <div className="flex-shrink-0 mb-4 flex justify-between items-center">
        <button onClick={onClose} className="flex items-center space-x-2 text-nevada hover:text-white transition-colors duration-200">
          <ArrowLeftIcon className="w-5 h-5" />
          <span>Back to Memories</span>
        </button>
        <AIActionsMenu memory={memory} onAction={handleAiAction} disabled={isLoading || memory.isProcessingSummary || memory.isProcessingAi} />
      </div>

      <div className="bg-shark p-4 rounded-lg border border-gray-700 mb-4 overflow-y-auto max-h-80">
        <h3 className="text-lg font-bold mb-2 capitalize">{memory.type} Content</h3>
        {renderMemoryContent()}
        {renderSmartSummary()}
        <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-bold text-nevada mb-2">Tags</h4>
            <div className="flex flex-wrap gap-2 items-center">
                {(memory.tags || []).map(tag => (
                    <span key={tag} className="bg-gray-700 text-loblolly text-xs font-medium px-2.5 py-1 rounded-full flex items-center">
                        {tag}
                        <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 -mr-1 p-0.5 rounded-full hover:bg-red-900/50 hover:text-red-400 transition-colors">
                            <XIcon className="w-3 h-3"/>
                        </button>
                    </span>
                ))}
                <form onSubmit={handleAddTag} className="flex-grow min-w-[100px]">
                    <input 
                        type="text" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        className="bg-bunker text-xs border border-gray-600 rounded-full py-1 px-3 focus:ring-1 focus:ring-science-blue focus:outline-none w-full"
                    />
                </form>
            </div>
        </div>
        {renderRelatedMemories()}
      </div>

      <div className="flex-grow flex flex-col bg-shark rounded-lg border border-gray-700 overflow-hidden">
        <div ref={chatContainerRef} className="flex-grow p-4 space-y-4 overflow-y-auto">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-science-blue flex items-center justify-center"><AiIcon className="w-5 h-5 text-white" /></div>}
              <div className={`p-3 rounded-lg max-w-sm md:max-w-md ${msg.sender === 'user' ? 'bg-science-blue text-white rounded-br-none' : 'bg-gray-700 text-loblolly rounded-bl-none'}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                 {msg.sender === 'ai' && msg.isSavable && (
                    <div className="mt-2 pt-2 border-t border-gray-600/50 flex justify-end">
                        <button 
                            onClick={() => handleSaveAsNewMemory(msg.text)}
                            className="flex items-center space-x-1.5 text-xs text-loblolly hover:text-white bg-gray-600 hover:bg-science-blue px-2 py-1 rounded-md transition-colors"
                        >
                            <SaveIcon className="w-3 h-3" />
                            <span>Save as New Memory</span>
                        </button>
                    </div>
                )}
              </div>
               {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white" /></div>}
            </div>
          ))}
          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-science-blue flex items-center justify-center"><AiIcon className="w-5 h-5 text-white" /></div>
              <div className="p-3 rounded-lg bg-gray-700 rounded-bl-none">
                 <LoaderIcon className="w-5 h-5 text-loblolly animate-spin" />
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700 flex items-center space-x-2 bg-shark">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={`Ask about this ${memory.type}...`}
            className="flex-grow bg-gray-700 border border-gray-600 rounded-full py-2 px-4 focus:ring-2 focus:ring-science-blue focus:outline-none"
            disabled={isLoading}
          />
          <button type="submit" disabled={isLoading || !userInput.trim()} className="w-10 h-10 flex-shrink-0 bg-science-blue rounded-full flex items-center justify-center text-white disabled:bg-gray-600 disabled:cursor-not-allowed">
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}