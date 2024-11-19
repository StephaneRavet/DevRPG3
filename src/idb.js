// idb.js
import { openDB } from 'idb';

const DB_NAME = 'devrpg-db';
const DB_VERSION = 1;

async function initDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Store for users
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'username' });
      }
      // Store for quests
      if (!db.objectStoreNames.contains('quests')) {
        db.createObjectStore('quests', { keyPath: 'id', autoIncrement: true });
      }
    },
  });
}

export async function idbSaveUser(userData) {
  const db = await initDB();
  await db.put('users', userData);
}

export async function idbGetUser(username) {
  const db = await initDB();
  return await db.get('users', username) || { username, level: 1, xp: 0 };
}

export async function idbSaveQuests(quests) {
  const db = await initDB();
  const tx = db.transaction('quests', 'readwrite');
  await tx.objectStore('quests').clear();
  await Promise.all(quests.map(quest => tx.objectStore('quests').add(quest)));
  await tx.done;
}

export async function idbGetQuests() {
  const db = await initDB();
  return await db.getAll('quests');
}