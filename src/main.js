// src/main.js
import { apiCompleteQuest, apiGetQuests, apiGetUser } from './api.js'
import { FileManager } from './fileManager.js'
import { GeoQuestManager } from './geoQuests'
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

// Déclarer la variable au niveau du module
let geoQuestManager;

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

export async function displayQuests() {
  const quests = await getQuests();
  const regularQuests = quests.filter(quest => !quest.type || quest.type !== 'geo');
  const geoQuests = quests.filter(quest => quest.type === 'geo');

  // Affichage des quêtes régulières
  const questsList = $('#quests-list');
  questsList.empty();

  regularQuests.forEach(quest => {
    const questElement = $(`
      <li class="quest-item" data-quest-id="${quest.id}">
        ${quest.name} (xp: ${quest.xp})
      </li>
    `);
    questsList.append(questElement);
  });

  // Affichage des quêtes géolocalisées
  const geoQuestsList = $('#nearby-quests-list');
  if (geoQuestsList.length) {
    geoQuestsList.empty();

    geoQuests.forEach(quest => {
      let inRange = false;
      if (geoQuestManager?.geoManager?.currentPosition) {
        const radius = $('#detection-radius').val() * 1000;
        inRange = geoQuestManager.isQuestInRange(quest, radius);
      }

      const questElement = $(`<li class="quest-item" data-quest-id="${quest.id}">
        <h3>${quest.name} (xp: ${quest.xp})</h3>
        <p class="text-sm text-gray-400">${quest.location?.name || ''}</p>
      </li>`);

      if (inRange) {
        questElement.addClass('nearby');
      }

      questElement.appendTo(geoQuestsList);
    });
  }

  // Event handler for all quests
  $('.quest-item').on('click', async function () {
    const questId = $(this).data('quest-id');
    await completeQuest(questId);
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
    $('#username').trigger('focus');
    return;
  }

  const oldLevel = (await idbGetUser(username)).level; // Save current level
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
    await sendLevelUpNotification(updatedUser.username, updatedUser.level);
  }
}

// Add at the beginning of the file
async function updateConnectionStatus() {
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
$(async () => {
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
    $('#username').trigger('focus');
  }
  $('#username').on('keyup', function () {
    const username = $('#username').val();
    localStorage.setItem('username', username);
  });

  // Initialize file manager
  new FileManager();

  // Initialize geo quests
  try {
    const quests = await getQuests();
    const hasGeoQuests = quests.some(quest => quest.type === 'geo');

    if (hasGeoQuests) {
      geoQuestManager = new GeoQuestManager(quests);  // Assigner à la variable du module
      const geoInitialized = await geoQuestManager.initialize();

      if (geoInitialized) {
        $('#geo-quests').removeClass('hidden');
        geoQuestManager.geoManager.addLocationListener(updateGPSDisplay);
      } else {
        $('#location-status').html(
          '<span class="text-red-400">❌ Géolocalisation non disponible</span>'
        );
      }
    }
  } catch (error) {
    console.error('Failed to initialize geo quests:', error);
    $('#location-status').html(
      '<span class="text-red-400">⚠️ Erreur d\'initialisation GPS</span>'
    );
  }

  $('#detection-radius').on('input', function () {
    const radius = $(this).val();
    $('#radius-value').text(radius + ' km'); // Ajouter "km"
    // Vérifier si geoQuestManager existe avant de l'utiliser
    if (geoQuestManager?.geoManager?.currentPosition) {
      geoQuestManager.checkNearbyQuests(geoQuestManager.geoManager.currentPosition);
      displayQuests(); // Rafraîchir l'affichage pour mettre à jour les couleurs
    }
  });
});

function updateGPSDisplay(position, error) {
  if (error) {
    $('#location-status').html(
      `<span class="text-red-400">❌ ${error.message}</span>`
    );
    return;
  }

  if (!position) return;

  $('#current-lat').text(position.latitude.toFixed(6));
  $('#current-lng').text(position.longitude.toFixed(6));
  $('#current-accuracy').text(Math.round(position.accuracy));

  $('#location-status').html(
    '<span class="text-green-400">📍 Position mise à jour</span>'
  );
}
