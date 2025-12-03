import React, { useState } from 'react';
import { LoaderIcon, TagIcon, XIcon } from './icons';

interface BulkTagModalProps {
  onClose: () => void;
  onSave: (tags: string[]) => void;
  isLoading: boolean;
}

export default function BulkTagModal({ onClose, onSave, isLoading }: BulkTagModalProps) {
  const [tags, setTags] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
    if (tagArray.length > 0) {
      onSave(tagArray);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-shark w-full max-w-md rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center space-x-2">
              <TagIcon className="w-5 h-5" />
              <span>Add Tags to Selected</span>
            </h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
              <XIcon className="w-5 h-5 text-nevada" />
            </button>
          </div>
          <div className="p-6">
            <label htmlFor="bulk-tags" className="block text-sm font-medium text-nevada mb-1">
              New tags (comma-separated)
            </label>
            <p className="text-xs text-nevada mb-2">These tags will be added to the existing tags of each selected memory.</p>
            <input
              type="text"
              id="bulk-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="e.g., project-alpha, q3-review"
              className="w-full bg-bunker border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-science-blue focus:outline-none"
              autoFocus
            />
          </div>
          <div className="p-4 bg-bunker/50 border-t border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={isLoading || !tags.trim()}
              className="px-4 py-2 bg-science-blue text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <LoaderIcon className="w-5 h-5 animate-spin" />}
              <span>{isLoading ? 'Saving...' : 'Add Tags'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}