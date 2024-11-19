// src/pwaCustomInstall.js
import { registerSW } from 'virtual:pwa-register'

// Create update prompt function
function createUpdatePrompt() {
  const updatePrompt = document.createElement('div')
  updatePrompt.className = 'update-prompt'
  updatePrompt.innerHTML = `
    <div class="update-prompt-content">
      <p>Une nouvelle version est disponible</p>
      <button class="update-button">Mettre à jour</button>
    </div>
  `
  return updatePrompt
}

// Initialize PWA
export function initPWA() {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Show update prompt
      const prompt = createUpdatePrompt()
      document.body.appendChild(prompt)

      // Handle update click
      prompt.querySelector('.update-button').addEventListener('click', () => {
        updateSW()
        prompt.remove()
      })
    },
    onOfflineReady() {
      console.log('App ready to work offline')
    }
  })
}