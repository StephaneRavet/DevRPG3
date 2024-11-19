// idb.js
import { openDB } from 'idb';

// Import des quêtes depuis le fichier JSON
import QUESTS from '../api/quests.json';

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

// Fonction helper pour générer une quête aléatoire
function generateRandomQuest() {
  const randomQuest = QUESTS[Math.floor(Math.random() * QUESTS.length)];
  return {
    name: randomQuest.name,
    description: randomQuest.description,
    xp: randomQuest.xp
  };
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

export async function idbCompleteQuest(username, questId) {
  const user = await idbGetUser(username);
  const quests = await idbGetQuests();
  const quest = quests.find(q => q.id === questId);

  if (!quest) return null;

  const newXp = user.xp + quest.xp;
  const newLevel = Math.floor(Math.pow(newXp, 0.4) / 2) + 1;
  const updatedUser = {
    ...user,
    xp: newXp,
    level: newLevel
  };

  // Supprimer la quête complétée et ajouter une nouvelle quête
  const remainingQuests = quests.filter(q => q.id !== questId);
  const newQuest = generateRandomQuest();
  const updatedQuests = [...remainingQuests, newQuest];

  await idbSaveQuests(updatedQuests);
  await idbSaveUser(updatedUser);

  return updatedUser;
}