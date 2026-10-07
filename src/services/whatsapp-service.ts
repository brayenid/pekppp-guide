import { getFonnteWaConfig, FonnteWaConfig } from './system-setting-service'

export interface SendWhatsAppPayload {
  target: string // Nomor tujuan (misal: "08123456789" atau "628123456789")
  message: string
  url?: string
}

export interface FonnteResponse {
  status: boolean
  message?: string
  detail?: string
  id?: string[]
}

/**
 * Service untuk mengelola interaksi dengan WhatsApp Gateway Fonnte.
 */
export class WhatsAppService {
  /**
   * Mengirim pesan WhatsApp melalui endpoint resmi Fonnte.
   * Aman (fail-safe): jika bot nonaktif atau request gagal, tidak akan memblokir proses bisnis aplikasi.
   */
  static async sendMessage({
    target,
    message,
    url
  }: SendWhatsAppPayload): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const config = await getFonnteWaConfig()

      // Jika bot WhatsApp tidak aktif atau token kosong, lewati secara halus
      if (!config.enabled) {
        return {
          success: false,
          message: 'Integrasi WhatsApp Fonnte sedang dinonaktifkan di dashboard.'
        }
      }

      if (!config.apiToken) {
        return {
          success: false,
          message: 'Token API Fonnte belum dikonfigurasi di dashboard.'
        }
      }

      if (!target || !target.trim()) {
        return {
          success: false,
          message: 'Nomor WhatsApp tujuan tidak valid atau kosong.'
        }
      }

      // Bersihkan karakter target (mendukung nomor biasa 08xxx, multiple dengan koma, dan ID Grup WhatsApp seperti 120363xxx@g.us)
      const cleanTarget = target
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .join(',')

      let fullMessage = message.trim()
      if (url) {
        fullMessage += `\n\n🔗 Tautan: ${url}`
      }

      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: config.apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: cleanTarget,
          message: fullMessage,
          countryCode: config.countryCode || '62'
        })
      })

      const result: FonnteResponse = await response.json()

      if (!response.ok || !result.status) {
        console.warn('[WhatsAppService] Gagal mengirim pesan:', result)
        return {
          success: false,
          message: result.message || 'Gagal mengirim pesan melalui Fonnte.',
          data: result
        }
      }

      return {
        success: true,
        message: 'Pesan WhatsApp berhasil dikirim.',
        data: result
      }
    } catch (error: any) {
      console.error('[WhatsAppService] Error mengirim WhatsApp:', error)
      return {
        success: false,
        message: error?.message || 'Terjadi kesalahan sistem saat menghubungi server Fonnte.'
      }
    }
  }

  /**
   * Mengirim pesan uji coba untuk memverifikasi koneksi Fonnte dari dashboard.
   */
  static async testConnection(targetPhone: string): Promise<{ success: boolean; message: string }> {
    const config = await getFonnteWaConfig()
    if (!config.apiToken) {
      return {
        success: false,
        message: 'Silakan isi dan simpan Token API Fonnte terlebih dahulu sebelum melakukan pengujian.'
      }
    }

    const cleanPhone = targetPhone.trim()
    if (!cleanPhone) {
      return {
        success: false,
        message: 'Nomor WhatsApp atau ID Grup tujuan tes tidak boleh kosong.'
      }
    }

    const testMessage = `*Tes Koneksi PEKPPP Online*\n\n✅ Halo! Bot WhatsApp integrasi PEKPPP berhasil terhubung dengan akun Fonnte Anda.\n\nPesan ini menandakan konfigurasi token telah valid dan siap digunakan untuk notifikasi penilaian.\n\nWaktu: ${new Date().toLocaleString('id-ID')}`

    try {
      const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          Authorization: config.apiToken,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          target: cleanPhone,
          message: testMessage,
          countryCode: config.countryCode || '62'
        })
      })

      const result: FonnteResponse = await response.json()
      if (!response.ok || !result.status) {
        return {
          success: false,
          message: result.message || 'Gagal menghubungi Fonnte. Periksa apakah token valid atau masa aktif perangkat masih ada.'
        }
      }

      return {
        success: true,
        message: `Pesan tes berhasil dikirim ke ${cleanPhone}!`
      }
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Gagal mengirim pesan tes ke server Fonnte.'
      }
    }
  }
}
