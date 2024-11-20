// src/geoQuest.js
import { GeoLocationManager } from './geoLocation';

export class GeoQuestManager {
  constructor(quests) {
    this.geoManager = new GeoLocationManager();
    this.activeQuests = new Map();
    this.questList = quests;
  }

  async initialize() {
    try {
      const hasPermission = await this.geoManager.requestPermission();
      if (hasPermission) {
        this.geoManager.addLocationListener(this.checkNearbyQuests.bind(this));
        this.geoManager.startTracking();
        this.updateLocationStatus('active');
        return true;
      }
      this.updateLocationStatus('denied');
      return false;
    } catch (error) {
      console.error('Error initializing GeoQuestManager:', error);
      this.updateLocationStatus('error');
      return false;
    }
  }

  updateLocationStatus(status) {
    const statusMessages = {
      active: '📍 Recherche de quêtes à proximité...',
      denied: '❌ Accès à la localisation refusé',
      error: '⚠️ Erreur de géolocalisation'
    };

    const statusClass = status === 'active' ? 'text-green-400' : 'text-red-400';
    $('#location-status').html(
      `<span class="${statusClass}">${statusMessages[status]}</span>`
    );
  }

  isQuestInRange(quest, radius) {
    if (!quest.location || !this.geoManager?.currentPosition) {
      return false;
    }

    const distance = GeoLocationManager.calculateDistance(
      this.geoManager.currentPosition.latitude,
      this.geoManager.currentPosition.longitude,
      quest.location.latitude,
      quest.location.longitude
    );

    return distance <= radius * 1000;
  }

  checkNearbyQuests(position) {
    if (!this.questList || !position) return;

    const radius = parseInt($('#detection-radius').val(), 10);

    this.questList.forEach(quest => {
      if (quest.type !== 'geo' || !quest.location) return;

      const inRange = this.isQuestInRange(quest, radius);
      console.log(quest.name, inRange);
      const $element = $(`#nearby-quests-list li[data-quest-id="${quest.id}"]`);
      $element.toggleClass('nearby', inRange);
    });
  }
} 