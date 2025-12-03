import React, { useState, useCallback } from 'react';
import { MemoryType, Memory } from '../types';
import { TextIcon, ImageIcon, LinkIcon, XIcon, LoaderIcon, MicrophoneIcon } from './icons';
import { generateTags } from '../services/geminiService';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';

interface AddMemoryModalProps {
  onClose: () => void;
  onAddMemory: (type: MemoryType, content: string, description?: string, tags?: string[]) => void;
  describeImage: (base64Image: string, mimeType: string) => Promise<string>;
  memories: Memory[];
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
  });
};


export default function AddMemoryModal({ onClose, onAddMemory, describeImage, memories }: AddMemoryModalProps) {
  const [memoryType, setMemoryType] = useState<MemoryType>(MemoryType.TEXT);
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [tags, setTags] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleVoiceResult = useCallback((transcript: string) => {
    setContent(prev => (prev.trim() ? prev + ' ' : '') + transcript);
  }, []);

  const { isListening, startListening, stopListening, hasSupport } = useVoiceRecognition({
    onResult: handleVoiceResult
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isListening) stopListening();
    setIsLoading(true);
    setError('');

    try {
      const userTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      let finalTags: string[];

      let memoryContent: string;
      let contentForTagging: string;
      let memoryDescription: string | undefined;

      if (memoryType === MemoryType.IMAGE) {
        if (!imageFile) {
          setError('Please select an image file.');
          setIsLoading(false);
          return;
        }
        const base64Image = await fileToBase64(imageFile);
        memoryDescription = await describeImage(base64Image, imageFile.type);
        contentForTagging = memoryDescription;
        memoryContent = `data:${imageFile.type};base64,${base64Image}`;
      } else {
        if (!content.trim()) {
          setError('Content cannot be empty.');
          setIsLoading(false);
          return;
        }
        contentForTagging = content;
        memoryContent = content;
      }

      if (userTags.length > 0) {
        finalTags = userTags;
      } else {
        finalTags = await generateTags(contentForTagging, memories);
      }

      onAddMemory(memoryType, memoryContent, memoryDescription, finalTags);
      onClose();
    } catch(err) {
        console.error("Failed to add memory:", err);
        setError('Failed to process memory. Please try again.');
    } finally {
        setIsLoading(false);
    }
  };
  
  const TabButton: React.FC<{
    type: MemoryType;
    label: string;
    icon: React.ReactNode;
  }> = ({ type, label, icon }) => (
    <button
        type="button"
        onClick={() => setMemoryType(type)}
        className={`flex-1 p-3 flex items-center justify-center space-x-2 text-sm font-medium border-b-2 transition-colors ${
            memoryType === type ? 'border-science-blue text-science-blue' : 'border-transparent text-nevada hover:text-white'
        }`}
    >
        {icon}
        <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-shark w-full max-w-md rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-4 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-bold">Add New Memory</h2>
            <button type="button" onClick={onClose} className="p-1 rounded-full hover:bg-gray-700">
                <XIcon className="w-5 h-5 text-nevada"/>
            </button>
          </div>
          <div className="border-b border-gray-700 flex">
            <TabButton type={MemoryType.TEXT} label="Text" icon={<TextIcon className="w-5 h-5"/>}/>
            <TabButton type={MemoryType.IMAGE} label="Image" icon={<ImageIcon className="w-5 h-5"/>}/>
            <TabButton type={MemoryType.LINK} label="Link" icon={<LinkIcon className="w-5 h-5"/>}/>
          </div>
          <div className="p-6">
            {memoryType === MemoryType.TEXT && (
              <div className="relative">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste, type, or start recording..."
                  className="w-full h-32 bg-bunker border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-science-blue focus:outline-none pr-12"
                  autoFocus
                />
                {hasSupport && (
                  <button
                    type="button"
                    onClick={isListening ? stopListening : startListening}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-loblolly hover:bg-gray-600'}`}
                    aria-label={isListening ? 'Stop recording' : 'Start recording'}
                  >
                    <MicrophoneIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            {memoryType === MemoryType.IMAGE && (
              <div className="flex flex-col items-center">
                 <input type="file" id="imageUpload" accept="image/*" onChange={handleImageChange} className="hidden" />
                 <label htmlFor="imageUpload" className="w-full text-center cursor-pointer bg-bunker border-2 border-dashed border-gray-700 rounded-lg p-6 hover:border-science-blue">
                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-md"/>
                    ) : (
                        <div className="text-nevada">
                            <ImageIcon className="w-10 h-10 mx-auto mb-2"/>
                            <p className="font-semibold">Click to upload an image</p>
                            <p className="text-xs">PNG, JPG, GIF</p>
                        </div>
                    )}
                 </label>
              </div>
            )}
            {memoryType === MemoryType.LINK && (
              <input
                type="url"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-bunker border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-science-blue focus:outline-none"
                autoFocus
              />
            )}
            <div className="mt-4">
              <label htmlFor="tags" className="block text-sm font-medium text-nevada mb-1">Tags (comma-separated)</label>
              <input
                type="text"
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., work, recipe... or leave blank for AI!"
                className="w-full bg-bunker border border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-science-blue focus:outline-none"
              />
            </div>
             {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <div className="p-4 bg-bunker/50 border-t border-gray-700 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-science-blue text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoading && <LoaderIcon className="w-5 h-5 animate-spin"/>}
              <span>{isLoading ? 'Saving...' : 'Save Memory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}