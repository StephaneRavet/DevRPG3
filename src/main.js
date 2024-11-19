// src/main.js
import { apiCompleteQuest, apiGetQuests, apiGetUser } from './api.js'
import { idbCompleteQuest, idbGetQuests, idbGetUser, idbSaveQuests, idbSaveUser } from './idb.js'
import { createInstallButton } from './InstallButton'
import { requestNotificationPermission, sendLevelUpNotification } from './notifications.js'
import { initPWA } from './pwaCustomInstall'
import { addToSyncQueue, processSyncQueue } from './syncQueue'

// Initialize PWA features
initPWA()

// Add install button to the page
const installButton = createInstallButton()
if (installButton) {
  document.body.appendChild(installButton)
}

export async function getQuests() {
  try {
    const quests = await apiGetQuests();
    await idbSaveQuests(quests);
    return quests;
  } catch (error) {
    // console.log('API Error, using cache:', error);
    return await idbGetQuests();
  }
}

async function getUser(username) {
  try {
    const user = await apiGetUser(username);
    await idbSaveUser(user);
    return user;
  } catch (error) {
    // console.log('API Error, using cache:', error);
    return await idbGetUser(username);
  }
}

export function displayQuests() {
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

    // Event handler for quests
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
    alert('Please enter a character name');
    $('#username').focus();
    return;
  }

  const oldLevel = (await idbGetUser(username)).level; // Sauvegarder le niveau actuel
  let updatedUser;

  try {
    updatedUser = await apiCompleteQuest(username, questId);
    await idbSaveUser(updatedUser);
  } catch (error) {
    // In case of error, update locally and queue for sync
    await addToSyncQueue({ type: 'completeQuest', username, questId });
    updatedUser = await idbCompleteQuest(username, questId);
    await idbSaveUser(updatedUser);
  }
  displayUser(updatedUser);
  displayQuests();
  if (updatedUser.level > oldLevel) { // Vérifier si le niveau a augmenté
    console.log('sendLevelUpNotification', updatedUser.username, updatedUser.level);
    await sendLevelUpNotification(updatedUser.username, updatedUser.level);
  }
}

// Add at the beginning of the file
async function updateConnectionStatus() {
  console.log('updateConnectionStatus', navigator.onLine);

  const online = navigator.onLine;
  $('.online').toggleClass('hidden', !online);
  $('.offline').toggleClass('hidden', online);

  // When coming back online, process the sync queue
  if (online) {
    try {
      await processSyncQueue();
    } catch (error) {
      console.error('Error processing sync queue:', error);
    }
  }
}

// Event listeners for connectivity
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

// Initialization
$(() => {
  requestNotificationPermission();
  if (localStorage.getItem('username')) {
    $('#username').val(localStorage.getItem('username'));
  }
  displayQuests();
  updateConnectionStatus();
  const username = $('#username').val();
  if (username) {
    getUser(username).then(displayUser);
  } else {
    $('#username').focus();
  }
  $('#username').on('keyup', function () {
    const username = $('#username').val();
    localStorage.setItem('username', username);
  });
});
