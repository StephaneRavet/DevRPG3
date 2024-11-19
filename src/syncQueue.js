// src/syncQueue.js
import { openDB } from 'idb';
import { apiCompleteQuest } from './api';

// Initialize IndexedDB for the sync queue
async function initSyncDB() {
  const db = await openDB('devrpg-sync-db', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', {
          keyPath: 'id',
          autoIncrement: true
        });
      }
    },
  });
  return db;
}

// Add an action to the sync queue
export async function addToSyncQueue(action) {
  console.info('addToSyncQueue', action);
  const db = await initSyncDB();
  await db.add('syncQueue', {
    ...action,
    timestamp: Date.now()
  });
}

// Get all pending actions
export async function getPendingActions() {
  const db = await initSyncDB();
  return await db.getAll('syncQueue');
}

// Remove a processed action
export async function removeFromSyncQueue(id) {
  const db = await initSyncDB();
  await db.delete('syncQueue', id);
}

// Process the sync queue
export async function processSyncQueue() {
  console.info('processSyncQueue');
  const actions = await getPendingActions();

  for (const action of actions) {
    try {
      if (action.type === 'completeQuest') {
        await apiCompleteQuest(action.username, action.questId);
      }
      // Add other action types here if needed

      await removeFromSyncQueue(action.id);
    } catch (error) {
      console.error('Error processing sync action:', error);
      // Keep the action in the queue if it fails
    }
  }
} 