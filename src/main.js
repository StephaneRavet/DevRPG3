// src/main.js
function getQuests() {
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
        ${quest.name}
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

function completeQuest(questId) {
  console.log(`Quest clicked: ${questId}`);
  fetch(`http://localhost:3000/api/quests/${questId}/complete`, { method: 'PATCH' })
    .then(displayQuests)
    .catch(error => console.error('Error completing quest:', error));
}

// OnLoad
$(() => {
  displayQuests();
});