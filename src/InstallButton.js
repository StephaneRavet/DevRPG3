// src/InstallButton.js
export function createInstallButton() {
  const button = document.createElement('button')
  button.className = 'pwa-install-button'
  button.textContent = 'Installer l\'application'
  button.style.display = 'none'

  let deferredPrompt = null

  // Check if already installed
  if (window.matchMedia('(display-mode: standalone)').matches) {
    return null
  }

  // Listen for install prompt
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferredPrompt = e
    button.style.display = 'block'
  })

  // Handle install click
  button.addEventListener('click', async () => {
    if (!deferredPrompt) return

    const result = await deferredPrompt.prompt()
    console.log(`Installation ${result.outcome === 'accepted' ? 'acceptée' : 'refusée'}`)
    deferredPrompt = null
    button.style.display = 'none'
  })

  // Handle successful installation
  window.addEventListener('appinstalled', () => {
    console.log('Application installée avec succès')
    button.style.display = 'none'
  })

  return button
}