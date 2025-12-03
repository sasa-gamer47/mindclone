import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SendIcon, LoaderIcon, BotMessageSquareIcon, AiIcon, UserIcon, MicrophoneIcon } from './icons';
import { ChatMessage } from '../types';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';


interface GlobalChatProps {
  onQuery: (query: string) => void;
  history: ChatMessage[];
  isLoading: boolean;
}

export default function GlobalChat({ onQuery, history, isLoading }: GlobalChatProps) {
  const [userInput, setUserInput] = useState('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleVoiceResult = useCallback((transcript: string) => {
    setUserInput(prev => (prev.trim() ? prev + ' ' : '') + transcript);
  }, []);

  const { isListening, startListening, stopListening, hasSupport } = useVoiceRecognition({
    onResult: handleVoiceResult,
  });

  useEffect(() => {
    // Scroll to the bottom on new messages or loading state change
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [history, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoading) return;
    if (isListening) stopListening();
    onQuery(userInput.trim());
    setUserInput('');
  };

  return (
    <div className="mb-6 bg-shark rounded-lg border border-gray-700 flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <BotMessageSquareIcon className="w-6 h-6 text-science-blue" />
          <h2 className="text-lg font-bold text-loblolly">Ask Your Memories</h2>
        </div>
      </div>
      
      <div 
        ref={chatContainerRef}
        className="p-4 space-y-4 overflow-y-auto h-64"
      >
        {history.length === 0 && !isLoading && (
            <div className="text-center text-nevada h-full flex items-center justify-center">
                <p className="text-sm">Ask a question about your memories to get started.</p>
            </div>
        )}
        {history.map((msg, index) => (
          <div key={index} className={`flex items-start space-x-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
            {msg.sender === 'ai' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-science-blue flex items-center justify-center"><AiIcon className="w-5 h-5 text-white" /></div>}
            <div className={`p-3 rounded-lg max-w-sm md:max-w-md ${msg.sender === 'user' ? 'bg-science-blue text-white rounded-br-none' : 'bg-gray-700 text-loblolly rounded-bl-none'}`}>
              <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-600/50">
                  <h4 className="text-xs font-bold text-nevada mb-2">Sources from the web:</h4>
                  <div className="flex flex-col space-y-2">
                    {msg.sources.map((source, i) => (
                      <a 
                        href={source.uri} 
                        key={i} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline truncate"
                        title={source.title || source.uri}
                      >
                        {source.title || source.uri}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {msg.sender === 'user' && <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center"><UserIcon className="w-5 h-5 text-white" /></div>}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-start space-x-3 animate-fade-in">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-science-blue flex items-center justify-center"><AiIcon className="w-5 h-5 text-white" /></div>
            <div className="p-3 rounded-lg bg-gray-700 rounded-bl-none">
               <LoaderIcon className="w-5 h-5 text-loblolly animate-spin" />
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700 flex items-center space-x-2 bg-bunker/50">
        <div className="relative flex-grow">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="e.g., 'What was that recipe...?'"
            className="w-full bg-bunker border border-gray-600 rounded-full py-2 pl-4 pr-12 focus:ring-2 focus:ring-science-blue focus:outline-none"
            disabled={isLoading}
          />
           {hasSupport && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`absolute inset-y-0 right-0 flex items-center pr-4 transition-colors disabled:opacity-50 ${isListening ? 'text-red-500' : 'text-nevada hover:text-white'}`}
                aria-label={isListening ? 'Stop recording' : 'Start recording'}
                disabled={isLoading}
              >
                <MicrophoneIcon className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
              </button>
            )}
        </div>
        <button
          type="submit"
          disabled={isLoading || !userInput.trim()}
          className="w-10 h-10 flex-shrink-0 bg-science-blue rounded-full flex items-center justify-center text-white disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          aria-label="Send query"
        >
          <SendIcon className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
}