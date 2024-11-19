self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'showProfile') {
    // Ouvrir l'application sur le dashboard
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(windowClients => {
        const rootUrl = new URL('/', location).href;
        if (windowClients.length > 0) {
          windowClients[0].focus();
          windowClients[0].navigate(`${rootUrl}#dashboard`);
        } else {
          clients.openWindow(`${rootUrl}#dashboard`);
        }
      })
    );
  }
}); 