// src/main.js

// Configuration de l'API
const API_BASE_URL = 'http://localhost:3000/api';

// Fonctions de récupération des données
async function getQuests() {
  try {
    const response = await fetch(`${API_BASE_URL}/quests`);
    return await response.json();
  } catch (error) {
    console.error('Erreur lors de la récupération des quêtes:', error);
    return [];
  }
}

async function getUser(username) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${username}`);
    const user = await response.json();
    return user;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error);
    return null;
  }
}

// Fonctions d'affichage
function displayQuests() {
  getQuests().then((quests) => {
    const questsList = $('#quests-list');
    questsList.empty();

    quests.forEach(quest => {
      const questElement = $(`
        <li class="quest-item" data-quest-id="${quest.id}">
          ${quest.name} (xp: ${quest.xp})
        </li>
      `);
      questsList.append(questElement);
    });

    // Gestionnaire d'événements pour les quêtes
    $('.quest-item').on('click', function () {
      const questId = $(this).data('quest-id');
      completeQuest(questId);
    });
  });
}

function displayUser(user) {
  if (!user) return;

  $('#character-level').text(user.level);
  $('#character-xp').text(user.xp);
  return user;
}

// Fonction de complétion de quête
async function completeQuest(questId) {
  const username = $('#username').val();

  if (!username) {
    alert('Veuillez entrer un nom de personnage');
    $('#username').focus();
    return;
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/users/${username}/quests/${questId}`,
      { method: 'POST' }
    );
    const user = await response.json();
    displayUser(user);
    displayQuests();
  } catch (error) {
    console.error('Erreur lors de la complétion de la quête:', error);
  }
}

// Initialisation
$(() => {
  displayQuests();
  $('#username').focus();
});
