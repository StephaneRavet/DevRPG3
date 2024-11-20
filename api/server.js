// api/server.js
import cors from 'cors';
import express from 'express';
import { readFileSync } from 'fs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// Constants
const PORT = process.env.PORT || 3000;
const QUESTS = JSON.parse(readFileSync('./api/quests.json', 'utf8'));

// Database initialization
let db;
async function initDB() {
  try {
    db = await open({
      filename: './api/database.sqlite',
      driver: sqlite3.Database
    });

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        username TEXT PRIMARY KEY,
        level INTEGER,
        xp INTEGER
      )
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS quests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        description TEXT,
        xp INTEGER,
        type TEXT,
        location_lat REAL,
        location_lng REAL,
        location_radius INTEGER,
        location_name TEXT
      )
    `);

    // Add default quests if needed
    const result = await db.get('SELECT COUNT(*) as count FROM quests');
    for (let i = result.count; i < 3; i++) {
      await feedQuests();
    }
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
}

// Express app initialization
const app = express();

// Middleware configuration
app.use(express.json());
app.use(cors());
app.use((req, _res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Route handlers
const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    res.json(user || { username, level: 1, xp: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllQuests = async (_req, res) => {
  try {
    const quests = await db.all('SELECT * FROM quests');
    const formattedQuests = quests.map(quest => ({
      id: quest.id,
      name: quest.name,
      description: quest.description,
      xp: quest.xp,
      type: quest.type,
      ...(quest.type === 'geo' && {
        location: {
          latitude: quest.location_lat,
          longitude: quest.location_lng,
          radius: quest.location_radius,
          name: quest.location_name
        }
      })
    }));
    res.json(formattedQuests);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const completeQuest = async (req, res) => {
  const { username, questId } = req.params;

  if (!username || !questId) {
    return res.status(400).json({
      error: !username ? 'missing username' : 'missing questId'
    });
  }

  try {
    const quest = await db.get('SELECT * FROM quests WHERE id = ?', [questId]);
    if (!quest) {
      return res.status(400).json({ error: 'invalid questId' });
    }

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) {
      await db.run(
        'INSERT INTO users (username, level, xp) VALUES (?, ?, ?)',
        [username, 1, quest.xp]
      );
    } else {
      const newXp = quest.xp + user.xp;
      const newLevel = Math.floor(Math.pow(newXp, 0.4) / 2) + 1;
      await db.run(
        'UPDATE users SET level = ?, xp = ? WHERE username = ?',
        [newLevel, newXp, username]
      );
    }

    const result = await db.run('DELETE FROM quests WHERE id = ?', [questId]);
    if (result.changes) {
      await feedQuests();
    }

    const updatedUser = await db.get('SELECT * FROM users WHERE username = ?', [username]);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Routes
app.get('/api/users/:username', getUserByUsername);
app.get('/api/quests', getAllQuests);
app.post('/api/users/:username/quests/:questId', completeQuest);

// Helper functions
async function feedQuests() {
  const randomQuest = QUESTS[Math.floor(Math.random() * QUESTS.length)];
  const params = [
    randomQuest.name,
    randomQuest.description || '',
    randomQuest.xp,
    randomQuest.type || 'regular',
    randomQuest.location?.latitude || null,
    randomQuest.location?.longitude || null,
    randomQuest.location?.radius || null,
    randomQuest.location?.name || null
  ];

  await db.run(`
    INSERT INTO quests (
      name, 
      description, 
      xp, 
      type,
      location_lat,
      location_lng,
      location_radius,
      location_name
    ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, params);
}

// Server initialization
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`API Server started on port ${PORT}`);
  });
}).catch(error => {
  console.error('Server startup error:', error);
  process.exit(1);
});