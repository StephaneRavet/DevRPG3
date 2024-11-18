// /api/server.js
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Liste des quêtes possibles
const quests = JSON.parse(readFileSync('./api/quests.json', 'utf8'));

const app = express();

// Middlewares de base
app.use(express.json());
app.use(cors());

// Logger middleware pour toutes les routes
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Initialisation de la base de données
let db;
async function initDB() {
  db = await open({ filename: './api/database.sqlite', driver: sqlite3.Database });
  await db.exec(`CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY,level INTEGER,xp INTEGER)`);
  await db.exec(`CREATE TABLE IF NOT EXISTS quests (id INTEGER PRIMARY KEY AUTOINCREMENT,name TEXT,description TEXT,xp INTEGER)`);
  // Ajout de 3 quêtes par défaut
  const result = await db.get('SELECT COUNT(*) as count FROM quests');
  for (let i = result.count; i < 3; i++) {
    await feedQuests();
  }
}

/******************************************************
 * Routes API
 ******************************************************/
app.get('/api/users/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [req.params.username]);
    res.json(user || { username, level: 1, xp: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/quests', async (_req, res) => {
  try {
    const quests = await db.all('SELECT * FROM quests');
    res.json(quests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users/:username/quests/:questId', async (req, res) => {
  const { username, questId } = req.params;
  if (!username) {
    res.status(400).json({ error: 'username manquant' });
    return;
  }
  if (!questId) {
    res.status(400).json({ error: 'questId manquant' });
    return;
  }
  const quest = await db.get('SELECT * FROM quests WHERE id = ?', [questId]);
  if (!quest) {
    res.status(400).json({ error: 'questId invalide' });
    return;
  }
  const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
  if (!user) {
    await db.run('INSERT INTO users (username, level, xp) VALUES (?, ?, ?)', [username, 1, quest.xp]);
  } else {
    user.xp = quest.xp + user.xp;
    user.level = Math.floor(Math.pow(user.xp, 0.4) / 2) + 1;
    await db.run('UPDATE users SET level = ?, xp = ? WHERE username = ?', [user.level, user.xp, username]);
  }
  const result = await db.run('DELETE FROM quests WHERE id = ?', [questId]);
  if (result.changes) { // si une quête a été supprimée
    await feedQuests();
  }
  res.json(user);
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('Serveur API démarré sur le port 3000');
  });
});

/******************************************************
 * Sous fonctions
 ******************************************************/

async function feedQuests() {
  const randomQuest = quests[Math.floor(Math.random() * quests.length)];
  await db.run(`
    INSERT INTO quests (name, description, xp) VALUES (?, ?, ?)
  `, [randomQuest.name, randomQuest.description, randomQuest.xp]);
}