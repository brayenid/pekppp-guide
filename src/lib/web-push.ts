// src/lib/web-push.ts
import webpush from 'web-push'

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BEQ4mkI6sEeEBGPnqci_4hT6fh2IhGk-3YLO-uIsyFxdx2MfxatbD5xbGJu6fktUAvp_GHAbWx4B0UgWbZvsLjI'
const privateKey = process.env.VAPID_PRIVATE_KEY || 'bATVRT_sWc5hPopyVBz4k3Dt1w00M_KdbbZZ8mewIPw'
const subject = process.env.VAPID_SUBJECT || 'mailto:admin@kutaibaratkab.go.id'

webpush.setVapidDetails(subject, publicKey, privateKey)

export { webpush }

export interface PushPayload {
  title: string
  body: string
  url?: string
  icon?: string
  badge?: string
  tag?: string
}

export async function sendWebPush(
  subscription: {
    endpoint: string
    p256dh: string
    auth: string
  },
  payload: PushPayload
) {
  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subscription.p256dh,
      auth: subscription.auth
    }
  }

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url || '/notifikasi',
    icon: payload.icon || '/kubar.png',
    badge: payload.badge || '/kubar.png',
    tag: payload.tag || 'pekppp-alert'
  })

  return webpush.sendNotification(pushSubscription, payloadString)
}
