
import React from 'react';
import { PlusIcon } from './icons';

interface FloatingActionButtonProps {
  onClick: () => void;
}

export default function FloatingActionButton({ onClick }: FloatingActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-science-blue text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-500/50"
      aria-label="Add new memory"
    >
      <PlusIcon className="w-7 h-7" />
    </button>
  );
}
