// src/geoLocation.js
export class GeoLocationManager {
  constructor() {
    this.watchId = null;
    this.currentPosition = null;
    this.locationListeners = new Set();
  }

  async requestPermission() {
    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      return true;
    } catch (error) {
      console.error('Error requesting geolocation permission:', error);
      return false;
    }
  }

  addLocationListener(callback) {
    this.locationListeners.add(callback);
    if (this.currentPosition) {
      callback(this.currentPosition, null);
    }
  }

  removeLocationListener(callback) {
    this.locationListeners.delete(callback);
  }

  startTracking() {
    if (!('geolocation' in navigator)) {
      console.error('Geolocation not supported');
      return;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0
    };

    this.watchId = navigator.geolocation.watchPosition(
      (position) => {
        this.currentPosition = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        };
        this.notifyListeners();
      },
      (error) => {
        console.error('Error getting location:', error);
      },
      options
    );
  }

  stopTracking() {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
  }

  notifyListeners() {
    this.locationListeners.forEach(listener => {
      listener(this.currentPosition);
    });
  }

  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371e3; // Rayon de la Terre en mètres
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance en mètres
  }
}
