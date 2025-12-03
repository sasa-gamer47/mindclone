import { GoogleGenAI, Type } from "@google/genai";
import { Memory, MemoryType, ChatMessage, SmartSummary } from "../types";

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}
const ai = new GoogleGenAI({ apiKey: API_KEY });
const textModel = 'gemini-2.5-flash';
const visionModel = 'gemini-2.5-flash';

// Helper function to parse data URL
const parseDataUrl = (dataUrl: string) => {
    const match = dataUrl.match(/^data:(.+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URL");
    return { mimeType: match[1], base64: match[2] };
};

export async function generateSmartSummary(textToSummarize: string): Promise<SmartSummary> {
  const systemInstruction = `You are an AI assistant that creates a "Smart Summary" of a given text.
Analyze the text and generate a JSON object with three fields:
1.  "title": A short, catchy title (5-10 words).
2.  "summary": A concise one-paragraph summary.
3.  "keyPoints": An array of strings, with each string being a key takeaway or action item. Extract a maximum of 3 key points.
`;
  try {
    const response = await ai.models.generateContent({
        model: textModel,
        contents: `Generate a smart summary for this text:\n\n---\n${textToSummarize}\n---`,
        config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING, description: 'A short, catchy title.' },
                    summary: { type: Type.STRING, description: 'A concise one-paragraph summary.' },
                    keyPoints: {
                        type: Type.ARRAY,
                        description: 'A list of key takeaways.',
                        items: { type: Type.STRING }
                    }
                },
                required: ['title', 'summary', 'keyPoints']
            }
        }
    });
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error generating smart summary with Gemini:", error);
    throw new Error("Failed to get summary from AI.");
  }
}

export async function continueWriting(text: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: `The user has provided the following text. Continue writing the next paragraph, maintaining the same style and tone. Do not repeat the original text.\n\n---\n${text}\n---`
        });
        return response.text;
    } catch (error) {
        console.error("Error continuing writing with Gemini:", error);
        throw new Error("Failed to get response from AI for continue writing.");
    }
}

export async function analyzeImage(base64DataUrl: string): Promise<string> {
    const { mimeType, base64 } = parseDataUrl(base64DataUrl);
    const imagePart = { inlineData: { data: base64, mimeType } };
    const textPart = { text: "Analyze this image in detail. Identify key objects, read any visible text, and describe the overall scene and context. Format the output with clear headings for each section (e.g., Objects, Text, Scene Description)." };

    try {
        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [imagePart, textPart] }
        });
        return response.text;
    } catch (error) {
        console.error("Error analyzing image:", error);
        throw new Error("Failed to analyze image with AI.");
    }
}

export async function planTrip(context: string): Promise<string> {
     try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: `Based on the following context, create a sample 3-day travel itinerary. The context might be a place name, a description, or a URL to a travel blog. Be creative and suggest interesting activities, places to eat, and logical daily schedules. If the context is vague, make reasonable assumptions.\n\n---\n${context}\n---`
        });
        return response.text;
    } catch (error) {
        console.error("Error planning trip with Gemini:", error);
        throw new Error("Failed to get response from AI for trip planning.");
    }
}


export async function chatWithTextMemory(memoryContent: string, userQuery: string, history: ChatMessage[]): Promise<string> {
    const formattedHistory = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: `You are an AI assistant. Answer the user's question based ONLY on the following context and chat history. If the answer isn't in the context, say you can't find the information in this memory.
            
            CHAT HISTORY:
            ---
            ${formattedHistory}
            ---

            CONTEXT:
            ---
            ${memoryContent}
            ---

            USER QUESTION: ${userQuery}
            `
        });
        return response.text;
    } catch (error) {
        console.error("Error chatting with memory context:", error);
        throw new Error("Failed to get response from AI.");
    }
}

export async function chatWithImageMemory(base64DataUrl: string, userQuery: string, history: ChatMessage[]): Promise<string> {
    const { mimeType, base64 } = parseDataUrl(base64DataUrl);
    const formattedHistory = history.map(msg => `${msg.sender}: ${msg.text}`).join('\n');

    const imagePart = { inlineData: { data: base64, mimeType } };
    const textPart = {
        text: `You are an AI assistant. Answer the user's question based ONLY on the provided image and chat history.
        
        CHAT HISTORY:
        ---
        ${formattedHistory}
        ---

        USER QUESTION: ${userQuery}
        `
    };

    try {
        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [imagePart, textPart] }
        });
        return response.text;
    } catch (error) {
        console.error("Error chatting with image memory:", error);
        throw new Error("Failed to get response from AI.");
    }
}

export async function performTextAction(text: string, prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents: `${prompt}\n\nText: "${text}"`
        });
        return response.text;
    } catch (error) {
        console.error("Error performing text action with Gemini:", error);
        throw new Error("Failed to get response from AI for text action.");
    }
}

export async function generateStoryFromImage(base64DataUrl: string): Promise<string> {
    const { mimeType, base64 } = parseDataUrl(base64DataUrl);
    const imagePart = { inlineData: { data: base64, mimeType } };
    const textPart = { text: "Write a short, imaginative story inspired by this image." };

    try {
        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [imagePart, textPart] }
        });
        return response.text;
    } catch (error) {
        console.error("Error generating story from image:", error);
        throw new Error("Failed to generate story from AI.");
    }
}


export async function describeImage(base64Image: string, mimeType: string): Promise<string> {
    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType,
        },
    };
    const textPart = {
        text: "Briefly describe this image in a single sentence. This description will be used for search purposes."
    };

    try {
        const response = await ai.models.generateContent({
            model: visionModel,
            contents: { parts: [imagePart, textPart] }
        });
        return response.text;
    } catch (error) {
        console.error("Error describing image with Gemini:", error);
        throw new Error("Failed to get image description from AI.");
    }
}

export async function generateTags(newMemoryContent: string, memories: Memory[]): Promise<string[]> {
  const serializedMemories = memories
    .filter(mem => mem.tags && mem.tags.length > 0)
    .slice(0, 20)
    .map(mem => {
      const content = mem.type === MemoryType.IMAGE ? mem.description : mem.content;
      return `- Content: ${content?.substring(0, 150)}...\n- Tags: [${mem.tags?.join(', ')}]`;
    }).join('\n---\n');

  const systemInstruction = `You are an AI assistant that helps organize memories by generating relevant tags.
Based on the 'New Memory Content' and the context of 'Existing Memories', generate up to 5 relevant, single-word, lowercase tags.
Prioritize reusing tags from existing memories if the content is similar. Only create new tags if necessary.
Return the tags as a JSON object with a "tags" key containing an array of strings. For example: {"tags": ["work", "project", "javascript"]}`;
  
  const contents = `CONTEXT of Existing Memories:\n${serializedMemories}\n\n---\n\nNew Memory Content to tag:\n"${newMemoryContent}"`;

  try {
    const response = await ai.models.generateContent({
      model: textModel,
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tags: {
              type: Type.ARRAY,
              description: "A list of 1-5 single-word, lowercase tags.",
              items: {
                type: Type.STRING,
                description: "A single-word, lowercase tag."
              }
            }
          }
        }
      }
    });
    const result = JSON.parse(response.text);
    return result.tags || [];
  } catch (error) {
    console.error("Error generating tags with Gemini:", error);
    return []; // Return empty array on failure
  }
}

const serializeMemoryForAnalysis = (mem: Memory): string => {
    let contentPreview = '';
    switch (mem.type) {
        case MemoryType.TEXT:
        case MemoryType.LINK:
            contentPreview = `Content: "${(mem.content || '').substring(0, 200)}${(mem.content?.length || 0) > 200 ? '...' : ''}"`;
            break;
        case MemoryType.IMAGE:
            contentPreview = `Description: "${mem.description || 'No description available.'}"`;
            break;
    }
    const tags = mem.tags && mem.tags.length > 0 ? `Tags: [${mem.tags.join(', ')}]` : '';
    return `- ID: ${mem.id}\n- Type: ${mem.type}\n- ${contentPreview}\n- ${tags}`;
};

export async function findRelatedMemories(targetMemory: Memory, allMemories: Memory[]): Promise<string[]> {
    const candidateMemories = allMemories.filter(mem => mem.id !== targetMemory.id);
    if (candidateMemories.length === 0) return [];

    const serializedTarget = serializeMemoryForAnalysis(targetMemory);
    const serializedCandidates = candidateMemories.map(serializeMemoryForAnalysis).join('\n---\n');

    const systemInstruction = `You are an AI assistant that finds connections between memories.
Analyze the 'Target Memory' and compare it against the 'List of Candidate Memories'.
Identify the 3 to 5 most semantically related memories based on shared topics, concepts, or context.
Return a JSON object with a single key, "relatedIds", containing an array of the IDs of the most related memories.
Example: {"relatedIds": ["mem_12345", "mem_67890"]}`;

    const contents = `TARGET MEMORY:\n${serializedTarget}\n\n---\n\nLIST OF CANDIDATE MEMORIES:\n${serializedCandidates}`;
    
    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        relatedIds: {
                            type: Type.ARRAY,
                            description: "An array of memory IDs.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["relatedIds"]
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.relatedIds || [];
    } catch(error) {
        console.error("Error finding related memories with Gemini:", error);
        return [];
    }
}

export async function queryAllMemories(query: string, history: ChatMessage[], memories: Memory[]): Promise<{ text: string; memoryIds: string[]; groundingChunks?: any[] }> {
  if (memories.length === 0) {
    return { text: "You don't have any memories saved yet. Add some content first!", memoryIds: [], groundingChunks: [] };
  }

  const serializedMemories = memories.map(mem => {
    let contentPreview = '';
    switch (mem.type) {
      case MemoryType.TEXT:
        contentPreview = `Content: "${(mem.content || '').substring(0, 200)}${(mem.content?.length || 0) > 200 ? '...' : ''}"`;
        break;
      case MemoryType.IMAGE:
        contentPreview = `Description: "${mem.description || 'No description available.'}"`;
        break;
      case MemoryType.LINK:
        contentPreview = `URL: "${mem.content}"`;
        break;
    }
    return `---
- ID: ${mem.id}
- Type: ${mem.type}
- Created: ${new Date(mem.createdAt).toLocaleString()}
- ${contentPreview}
---`;
  }).join('\n');

  const systemInstruction = `You are a helpful AI assistant for a personal knowledge app called MindClone. Your task is to answer the user's question based on the provided list of their saved "memories". You can also use Google Search to find up-to-date information or to get context about link/URL memories.

Synthesize information across multiple memories and search results if necessary.

When you use information from a memory, you MUST cite its ID. At the very end of your response, on a new line, list all cited memory IDs in the format:
Relevant Memories: [mem_12345, mem_67890]

If no memories are relevant, use "Relevant Memories: []". This is a strict formatting requirement.

Here is the list of memories:
${serializedMemories}`;

  const contents = [
    ...history.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model' as const,
        parts: [{ text: msg.text }]
    })),
    { role: 'user' as const, parts: [{ text: query }] }
  ];

  try {
    const response = await ai.models.generateContent({
        model: textModel,
        contents,
        config: {
            systemInstruction,
            tools: [{ googleSearch: {} }],
        }
    });
    
    let responseText = response.text;
    let memoryIds: string[] = [];
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

    const regex = /Relevant Memories: \[(.*?)\]\s*$/;
    const match = responseText.match(regex);
    
    if (match) {
        responseText = responseText.replace(regex, '').trim();
        const idsString = match[1];
        if (idsString) {
            memoryIds = idsString.split(',').map(id => id.trim()).filter(id => id);
        }
    }

    return {
        text: responseText,
        memoryIds: memoryIds,
        groundingChunks: groundingChunks
    };
  } catch (error) {
    console.error("Error querying all memories with Gemini:", error);
    throw new Error("Failed to get response from AI for global query.");
  }
}

const serializeMemoryForInsight = (mem: Memory): string => {
    const content = mem.type === MemoryType.IMAGE ? mem.description : mem.content;
    const tags = mem.tags ? `[${mem.tags.join(', ')}]` : '';
    return `- Type: ${mem.type}, Content: "${(content || '').substring(0, 100)}...", Tags: ${tags}`;
}

export async function getDashboardInsights(memories: Memory[]): Promise<string[]> {
    if (memories.length < 3) {
        return [
            "Summarize my recent notes",
            "What are the main topics I've saved?",
            "Draft a tweet based on my latest memory"
        ];
    }

    const recentMemories = memories.slice(0, 10);
    const serializedMemories = recentMemories.map(serializeMemoryForInsight).join('\n');

    const systemInstruction = `You are a proactive AI assistant for a personal knowledge app.
Analyze the user's recent memories and identify potential themes, connections, or tasks.
Generate 3 concise, actionable prompts or questions that the user might want to ask.
Frame them as if the user is asking. For example: "Summarize my notes about project X" or "What's the connection between my notes on AI and my saved link about marketing?".
Return a JSON object with a single key, "insights", containing an array of exactly 3 strings.
Example: {"insights": ["What are the key takeaways from my recent work notes?", "Compare my notes on React and Vue", "Draft a blog post outline about sustainable energy"]}`;

    const contents = `Here are the user's recent memories:\n${serializedMemories}`;

    try {
        const response = await ai.models.generateContent({
            model: textModel,
            contents,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        insights: {
                            type: Type.ARRAY,
                            description: "An array of 3 actionable prompts.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["insights"]
                }
            }
        });
        const result = JSON.parse(response.text);
        if (result.insights && Array.isArray(result.insights) && result.insights.length > 0) {
            return result.insights;
        }
        throw new Error("Invalid format from API");
    } catch (error) {
        console.error("Error generating dashboard insights with Gemini:", error);
        return [
            "Summarize my recent notes",
            "What are the main topics I've saved?",
            "Draft a tweet based on my latest memory"
        ];
    }
}