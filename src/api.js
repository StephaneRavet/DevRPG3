const API_BASE_URL = 'http://localhost:3000/api';

export async function apiGetUser(username) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function apiGetQuests() {
  try {
    const response = await fetch(`${API_BASE_URL}/quests`);
    return await response.json();
  } catch (error) {
    throw error;
  }
}

export async function apiCompleteQuest(username, questId) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${username}/quests/${questId}`,
      { method: 'POST' }
    );
    return await response.json();
  } catch (error) {
    throw error;
  }
} 