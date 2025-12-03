import Dexie, { Table } from 'dexie';
import { Memory } from '../types';

export const db = new Dexie('mindCloneDatabase') as Dexie & {
  memories: Table<Memory>;
};

// =================================================================
// DATABASE VERSION HISTORY
// =================================================================
// IMPORTANT: When changing the schema, you MUST increment the version
// number and add a new migration block. Modifying an existing version's
// .stores() will cause data loss for existing users.
// =================================================================

// Version 1: The schema you are currently using.
// We are treating this version as the stable baseline moving forward to prevent further data loss.
db.version(1).stores({
  memories: 'id, createdAt, type, *tags' // Primary key and indexed props
});

// Version 2: Add index for 'description'.
// This demonstrates the correct, non-destructive way to upgrade the schema.
// This will improve potential search performance on image memories in the future.
// The full schema for the table must be repeated.
db.version(2).stores({
  memories: 'id, createdAt, type, *tags, description'
});

// Version 3: Replace `summary` and `isSummarizing` with `smartSummary` and `isProcessingSummary`.
// This migration is required for the new Smart Summary feature.
db.version(3).stores({
    // `summary` and `isSummarizing` are removed from the schema.
    // Dexie automatically handles keeping non-indexed properties, so we don't need to list `smartSummary`.
    memories: 'id, createdAt, type, *tags, description'
}).upgrade(tx => {
    // This upgrade function will run for any user who has version 1 or 2.
    // It will remove the now-obsolete fields from all existing memory records.
    return tx.table('memories').toCollection().modify(memory => {
        delete memory.summary;
        delete memory.isSummarizing;
    });
});

// Version 4: Add support for related memories.
// No new index is needed for `relatedMemoryIds`, so we just need to bump the version.
// Dexie handles adding the new (unindexed) property to the object store automatically.
db.version(4).stores({
  memories: 'id, createdAt, type, *tags, description'
});


// Dexie will automatically handle upgrading users from previous versions
// without losing any data. Future schema changes will follow this pattern.