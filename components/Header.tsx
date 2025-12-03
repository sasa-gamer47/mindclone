import React from 'react';
import { BrainCircuitIcon, DownloadIcon } from './icons';

interface HeaderProps {
    showInstallButton?: boolean;
    onInstallClick?: () => void;
}

export default function Header({ showInstallButton, onInstallClick }: HeaderProps) {
  return (
    <header className="bg-shark/50 backdrop-blur-sm sticky top-0 z-10 border-b border-gray-800">
      <div className="container mx-auto px-4 py-3 max-w-3xl">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <BrainCircuitIcon className="w-8 h-8 text-science-blue" />
                <h1 className="text-xl font-bold text-loblolly">MindClone Gemini</h1>
            </div>
            {showInstallButton && onInstallClick && (
                <button 
                    onClick={onInstallClick}
                    className="flex items-center space-x-2 px-3 py-1.5 bg-science-blue/20 border border-science-blue text-science-blue rounded-full text-sm font-semibold hover:bg-science-blue hover:text-white transition-all duration-200 animate-pulse"
                >
                    <DownloadIcon className="w-4 h-4" />
                    <span>Install App</span>
                </button>
            )}
        </div>
      </div>
    </header>
  );
}