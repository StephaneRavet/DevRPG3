// src/main.js
const api = 'http://localhost:3000/api';

async function getQuests() {
  return fetch('http://localhost:3000/api/quests')
    .then(response => response.json())
    .catch(error => console.error('Error fetching quests:', error));
}

function displayQuests(_quests) {
  getQuests().then((quests) => {
    $('#quests-list').empty();
    quests.forEach(quest => {
      $('#quests-list').append(
        `<li class="quest-item" data-quest-id="${quest.id}">
        ${quest.name} (xp: ${quest.xp})
      </li>`
      );
    });

    // Ajouter le gestionnaire d'événements pour les clics
    $('.quest-item').on('click', function () {
      const questId = $(this).data('quest-id');
      completeQuest(questId);
    });
  });
}

async function completeQuest(questId) {
  const username = $('#username').val();
  if (!username) {
    alert('Entrez un nom de personnage');
    $('#username').focus();
    return;
  }
  return fetch(`${api}/users/${username}/quests/${questId}`, { method: 'POST' })
    .then(response => response.json())
    .then(user => displayUser(user))
    .then(displayQuests)
    .catch(error => console.error('Error completing quest:', error));
}

async function getUser() {
  const username = $('#username').val();
  return fetch(`${api}/users/${username}`)
    .then(response => response.json())
    .then(user => {
      $('#character-level').text(user.level);
      $('#character-xp').text(user.xp);
    })
    .catch(error => console.error('Error fetching user:', error));
}

function displayUser(user) {
  $('#character-level').text(user.level);
  $('#character-xp').text(user.xp);
}

// OnLoad
$(async () => {
  await displayQuests();
  $('#username').focus()
});
