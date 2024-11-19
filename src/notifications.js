// Request notification permission
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return false;
  }
}

// Send level up notification
export async function sendLevelUpNotification(username, level) {
  try {
    const registration = await navigator.serviceWorker.ready;
    await registration.showNotification('Level Up! 🌟', {
      body: `Congratulations ${username} ! You reached level ${level}`,
      icon: '/icons/manifest-icon-192.maskable.png',
      badge: '/icons/manifest-icon-192.maskable.png',
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'showProfile',
          title: 'View Profile'
        }
      ]
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
} 