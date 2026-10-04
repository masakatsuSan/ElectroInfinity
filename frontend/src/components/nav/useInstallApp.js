import { useCallback, useEffect, useState } from 'react'

const isIosDevice = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /iPad|iPhone|iPod/.test(ua) && !window.MSStream
}

const isAndroidDevice = () => {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  return /Android/i.test(ua)
}

/**
 * PWA install prompt state. Previously inlined in Navbar.jsx and used by both
 * the mobile overlay and the desktop profile dropdown; now shared by the
 * mobile Navbar, the desktop TopBar dropdown and the Sidebar bottom item.
 */
export function useInstallApp() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null)
  const [appInstalled, setAppInstalled] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [installDismissed, setInstallDismissed] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault()
      setInstallPromptEvent(e)
    }
    const onAppInstalled = () => {
      setAppInstalled(true)
      setInstallPromptEvent(null)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onAppInstalled)
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setAppInstalled(true)
    }
    setIsAndroid(isAndroidDevice())
    try {
      if (localStorage.getItem('ei_install_dismissed') === '1') {
        setInstallDismissed(true)
      }
    } catch (_) {}
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onAppInstalled)
    }
  }, [])

  const handleInstallApp = useCallback(async () => {
    if (!installPromptEvent) return
    try {
      installPromptEvent.prompt()
      const choice = await installPromptEvent.userChoice
      if (choice?.outcome === 'accepted') {
        setInstallPromptEvent(null)
      }
    } catch (_) {
      setInstallPromptEvent(null)
    }
  }, [installPromptEvent])

  const dismissInstallBar = useCallback(() => {
    setInstallDismissed(true)
    try {
      localStorage.setItem('ei_install_dismissed', '1')
    } catch (_) {}
  }, [])

  const showFloatingInstallBar = !appInstalled && !installDismissed && isAndroid && installPromptEvent
  const canInstall = !appInstalled && Boolean(installPromptEvent || isIosDevice())

  return {
    installPromptEvent,
    appInstalled,
    isAndroid,
    installDismissed,
    isIosDevice,
    handleInstallApp,
    dismissInstallBar,
    showFloatingInstallBar,
    canInstall,
  }
}