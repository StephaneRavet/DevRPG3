// src/main.js

import { apiCompleteQuest, apiGetQuests, apiGetUser } from './api.js';
import { idbGetQuests, idbGetUser, idbSaveQuests, idbSaveUser } from './idb.js';

async function getQuests() {
  try {
    const quests = await apiGetQuests();
    await idbSaveQuests(quests);
    return quests;
  } catch (error) {
    console.log('Erreur API, utilisation du cache:', error);
    return await idbGetQuests();
  }
}

async function getUser(username) {
  try {
    const user = await apiGetUser(username);
    await idbSaveUser(user);
    return user;
  } catch (error) {
    console.log('Erreur API, utilisation du cache:', error);
    return await idbGetUser(username);
  }
}

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

async function completeQuest(questId) {
  const username = $('#username').val();

  if (!username) {
    alert('Veuillez entrer un nom de personnage');
    $('#username').focus();
    return;
  }

  try {
    const user = await apiCompleteQuest(username, questId);
    await idbSaveUser(user);
    displayUser(user);
    displayQuests();
  } catch (error) {
    console.error('Erreur lors de la complétion de la quête:', error);
    // En cas d'erreur, mettre à jour localement
    const user = await idbGetUser(username);
    const quests = await idbGetQuests();
    const quest = quests.find(q => q.id === questId);

    if (quest) {
      const newXp = user.xp + quest.xp;
      const newLevel = Math.floor(Math.pow(newXp, 0.4) / 2) + 1;
      const updatedUser = {
        ...user,
        xp: newXp,
        level: newLevel
      };
      await idbSaveUser(updatedUser);
      displayUser(updatedUser);

      // Retirer la quête de la liste locale
      const updatedQuests = quests.filter(q => q.id !== questId);
      await idbSaveQuests(updatedQuests);
      displayQuests();
    }
  }
}

// Ajouter au début du fichier
function updateConnectionStatus() {
  const online = navigator.onLine;
  $('.online').toggleClass('hidden', !online);
  $('.offline').toggleClass('hidden', online);
}

// Écouteurs d'événements pour la connectivité
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Initialisation
$(() => {
  displayQuests();
  $('#username').focus();
  updateConnectionStatus();
  if ($('#username').val()) {
    getUser($('#username').val()).then(displayUser);
  }
});
