import { useEffect, useState } from 'react'
import { isSecureContext, getPermissionState } from '../utils/permissions'

const PERMISSION_INFO = {
  camera: {
    icon: '📷',
    blocked: 'Camera access is blocked for this site.',
    setting: 'Allow camera',
  },
  location: {
    icon: '📍',
    blocked: 'Location access is blocked for this site.',
    setting: 'Allow location',
  },
}

/**
 * Shows helpful banners when the page is not a secure context (HTTPS) or when
 * a required permission is permanently blocked by the browser — both cases in
 * which the browser will never show a permission popup on its own.
 */
export default function PermissionBanner({ permissions = ['camera', 'location'] }) {
  const [states, setStates] = useState({})

  useEffect(() => {
    let mounted = true
    const check = async () => {
      const next = {}
      for (const p of permissions) {
        next[p] = await getPermissionState(p)
      }
      if (mounted) setStates(next)
    }
    check()
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions.join(',')])

  if (!isSecureContext()) {
    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-red-700 dark:text-red-400 text-[13px] leading-relaxed">
        <strong>⚠ Camera &amp; Location are blocked on this page.</strong>{' '}
        Browsers only show camera/location permission popups on secure (https://) connections — plain{' '}
        <code className="font-mono">http://</code> links silently block them. Open the app at its{' '}
        <strong>https://</strong> URL (or the deployed site) and the prompts will appear.
      </div>
    )
  }

  const blocked = permissions.filter((p) => states[p] === 'denied')
  if (blocked.length === 0) return null

  return (
    <div className="space-y-2">
      {blocked.map((p) => {
        const info = PERMISSION_INFO[p]
        return (
          <div
            key={p}
            className="rounded-xl bg-amber-500/15 border border-amber-500/30 px-4 py-3 text-amber-700 dark:text-amber-300 text-[13px] leading-relaxed"
          >
            <strong>
              {info.icon} {info.blocked}
            </strong>{' '}
            Tap the lock/camera icon in the address bar → Site settings → {info.setting}, then reload this page.
          </div>
        )
      })}
    </div>
  )
}
