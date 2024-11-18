// /api/server.js
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const quests = JSON.parse(readFileSync('./api/quests.json', 'utf8'));

const app = express();
app.use(express.json());
app.use(cors());

// Initialisation de la base de données
let db;
async function initDB() {
  db = await open({
    filename: './api/database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_progress (
      user_id TEXT PRIMARY KEY,
      level INTEGER,
      quests TEXT
    )
  `);
  await db.exec(`
    CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      description TEXT,
      points INTEGER,
      completed BOOLEAN DEFAULT 0
    )
  `);

  const count = await db.get('SELECT COUNT(*) as count FROM quests');
  for (let i = count.count; i < 3; i++) {
    await feedQuests();
  }
}

// Routes API
app.post('/api/progress', async (req, res) => {
  const { userId, level, quests } = req.body;
  try {
    await db.run(
      'INSERT OR REPLACE INTO user_progress (user_id, level, quests) VALUES (?, ?, ?)',
      [userId, level, JSON.stringify(quests)]
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/progress/:userId', async (req, res) => {
  try {
    const progress = await db.get(
      'SELECT * FROM user_progress WHERE user_id = ?',
      [req.params.userId]
    );
    if (progress) {
      progress.quests = JSON.parse(progress.quests);
    }
    res.json(progress || {});
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

app.patch('/api/quests/:questId/complete', async (req, res) => {
  const { questId } = req.params;
  const result = await db.run('DELETE FROM quests WHERE id = ?', [questId]);
  if (result.changes) { // si une quête a été supprimée
    console.log('Quête supprimée', questId);
    await feedQuests();
  }
  res.json({ success: true });
});

// Démarrage du serveur
const PORT = process.env.PORT || 3000;
initDB().then(() => {
  app.listen(PORT, () => {
    console.log('Serveur API démarré sur le port 3000');
  });
});

async function feedQuests() {
  console.log("Ajout d'une quête");
  const randomQuest = quests[Math.floor(Math.random() * quests.length)];
  await db.run(`
    INSERT INTO quests (name, description, points) VALUES (?, ?, ?)
  `, [randomQuest.name, randomQuest.description, randomQuest.points]);
}