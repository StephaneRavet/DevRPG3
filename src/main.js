// src/main.js
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(registration => {
      console.log('Service Worker enregistré avec succès :', registration);
    }).catch(error => {
      console.log("Échec de l'enregistrement du Service Worker :", error);
    });
  });
} else {
  console.log('Le navigateur ne supporte pas les Service Workers.');
}