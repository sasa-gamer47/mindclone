import { useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../services/db';
import { Memory, MemoryType } from '../types';

export default function useMemories() {
  const memories = useLiveQuery(
    () => db.memories.orderBy('createdAt').reverse().toArray(),
    []
  ) ?? [];

  const addMemory = useCallback(async (type: MemoryType, content: string, description?: string, tags: string[] = []) => {
    const newMemory: Memory = {
      id: `mem_${Date.now()}`,
      type,
      content,
      description,
      createdAt: Date.now(),
      tags,
    };
    try {
      await db.memories.add(newMemory);
    } catch (error) {
      console.error("Failed to add memory to IndexedDB", error);
    }
  }, []);

  const updateMemory = useCallback(async (id: string, updatedFields: Partial<Memory>) => {
    try {
      await db.memories.update(id, updatedFields);
    } catch (error) {
      console.error("Failed to update memory in IndexedDB", error);
    }
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    try {
      await db.memories.delete(id);
    } catch (error) {
      console.error("Failed to delete memory from IndexedDB", error);
    }
  }, []);

  const deleteMultipleMemories = useCallback(async (ids: string[]) => {
    try {
      await db.memories.bulkDelete(ids);
    } catch (error) {
      console.error("Failed to bulk delete memories from IndexedDB", error);
    }
  }, []);

  const addTagsToMultipleMemories = useCallback(async (ids: string[], tagsToAdd: string[]) => {
    try {
      await db.transaction('rw', db.memories, async () => {
        const memoriesToUpdate = await db.memories.where('id').anyOf(ids).toArray();
        const updates = memoriesToUpdate.map(mem => {
          const existingTags = new Set(mem.tags || []);
          tagsToAdd.forEach(tag => existingTags.add(tag));
          return { ...mem, tags: Array.from(existingTags) };
        });
        await db.memories.bulkPut(updates);
      });
    } catch (error) {
      console.error("Failed to bulk add tags in IndexedDB", error);
    }
  }, []);

  return { memories, addMemory, updateMemory, deleteMemory, deleteMultipleMemories, addTagsToMultipleMemories };
}