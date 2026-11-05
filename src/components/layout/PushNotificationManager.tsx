'use client'

import { useState, useEffect } from 'react'
import { Bell, BellRing, CheckCircle2, ShieldAlert, X } from 'lucide-react'
import { saveSubscriptionAction, removeSubscriptionAction } from '../../actions/push-actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // 1. Cek dukungan Service Worker & Push API di browser
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    ) {
      setIsSupported(true)
      setPermission(Notification.permission)

      // Registrasi service worker
      navigator.serviceWorker
        .register('/sw.js')
        .then(async (registration) => {
          const sub = await registration.pushManager.getSubscription()
          if (sub && Notification.permission === 'granted') {
            setIsSubscribed(true)
          } else if (sub && Notification.permission !== 'granted') {
            await sub.unsubscribe().catch(() => {})
            setIsSubscribed(false)
          }
        })
        .catch((err) => {
          console.error('Service worker registration failed:', err)
        })
    }

    const isDismissed = localStorage.getItem('pekppp_push_prompt_dismissed') === 'true'
    if (isDismissed) {
      setDismissed(true)
    }
  }, [])

  const handleSubscribe = async () => {
    if (!isSupported) return
    setIsLoading(true)

    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)

      if (perm !== 'granted') {
        setIsLoading(false)
        return
      }

      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey =
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
        'BEQ4mkI6sEeEBGPnqci_4hT6fh2IhGk-3YLO-uIsyFxdx2MfxatbD5xbGJu6fktUAvp_GHAbWx4B0UgWbZvsLjI'

      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey)

      let subscription = await registration.pushManager.getSubscription()
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        })
      }

      const subJson = subscription.toJSON()

      if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
        await saveSubscriptionAction({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys.p256dh,
            auth: subJson.keys.auth
          },
          userAgent: navigator.userAgent
        })
        setIsSubscribed(true)
      }
    } catch (error) {
      console.error('Error during push subscription:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = () => {
    setDismissed(true)
    localStorage.setItem('pekppp_push_prompt_dismissed', 'true')
  }

  if (!isSupported) return null

  // Jika sudah granted dan subscribed, atau ditolak, atau dismissed -> tidak perlu tampilkan banner mengganggu
  if ((isSubscribed && permission === 'granted') || permission === 'denied' || dismissed) {
    return null
  }

  return (
    <aside
      aria-label="Notifikasi Pembaruan Evaluasi"
      className="fixed bottom-4 right-4 z-50 max-w-sm w-[calc(100vw-2rem)] sm:w-auto animate-fade-in-content">
      <div className="p-4 rounded-2xl bg-surface border border-brand/30 shadow-soft-float backdrop-blur-md space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="w-8 h-8 rounded-xl bg-brand-light flex items-center justify-center shrink-0 text-brand">
            <BellRing className="w-4 h-4 animate-bounce" />
          </div>
          <div className="flex-1 min-w-0 pr-1">
            <h4 className="text-xs font-semibold text-ink">
              Aktifkan Notifikasi
            </h4>
            <p className="text-[11px] text-ink-muted leading-relaxed mt-0.5">
              Dapatkan info instan saat bukti dukung diperiksa, evaluasi direvisi, atau pengumuman penting dibagikan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Tutup notifikasi"
            className="text-ink-muted hover:text-ink p-1 rounded-lg hover:bg-surface-subtle transition-colors cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={isLoading}
            className="flex-1 py-1.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-hz-button flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50">
            <span>{isLoading ? 'Mengaktifkan...' : 'Izinkan Notifikasi'}</span>
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            className="py-1.5 px-3 rounded-xl text-ink-secondary hover:text-ink hover:bg-surface-subtle text-xs font-medium transition-colors cursor-pointer">
            Nanti
          </button>
        </div>
      </div>
    </aside>
  )
}
