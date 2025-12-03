export enum MemoryType {
  TEXT = 'text',
  IMAGE = 'image',
  LINK = 'link',
}

export enum AiAction {
  REWRITE = 'rewrite',
  TRANSLATE = 'translate',
  EXTRACT = 'extract',
  IDEAS = 'ideas',
  STORY = 'story',
  SMART_SUMMARY = 'smart_summary',
  CONTINUE_WRITING = 'continue_writing',
  ANALYZE_IMAGE = 'analyze_image',
  PLAN_TRIP = 'plan_trip',
  FIND_RELATED = 'find_related',
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface SmartSummary {
  title: string;
  summary: string;
  keyPoints: string[];
}

export interface Memory {
  id: string;
  type: MemoryType;
  content: string; // For text and link, this is the string. For image, this is the base64 data.
  description?: string; // AI-generated description for images
  smartSummary?: SmartSummary;
  createdAt: number; // Unix timestamp
  isProcessingSummary?: boolean;
  isProcessingAi?: boolean; // Generic state for new AI actions
  tags?: string[];
  relatedMemoryIds?: string[];
}

export interface ChatMessage {
  sender: 'user' | 'ai';
  text: string;
  isSavable?: boolean;
  sources?: GroundingSource[];
}