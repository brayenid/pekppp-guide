// src/lib/turnstile.ts
// Verifikasi server-side untuk Cloudflare Turnstile

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes'?: string[]
  challenge_ts?: string
  hostname?: string
  action?: string
  cdata?: string
}

// Kunci rahasia dummy bawaan Cloudflare khusus pengujian lokal (Always Passes)
const CLOUDFLARE_TEST_SECRET = '1x0000000000000000000000000000000AA'

/**
 * Memvalidasi token Cloudflare Turnstile yang dikirim dari klien.
 *
 * @param token - Token yang dihasilkan oleh widget Turnstile di browser pengguna
 * @param remoteIp - Opsional: IP address pengguna untuk memperkuat audit keamanan Cloudflare
 */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null
): Promise<{ success: boolean; error?: string }> {
  // Ambil secret key dari env, atau fallback ke test secret jika belum diset di development
  const secretKey =
    process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY ||
    (process.env.NODE_ENV !== 'production' ? CLOUDFLARE_TEST_SECRET : undefined)

  if (!secretKey) {
    console.error('[Turnstile] CLOUDFLARE_TURNSTILE_SECRET_KEY belum diatur di environment variable.')
    return {
      success: false,
      error: 'Konfigurasi Cloudflare Turnstile belum diatur di server.'
    }
  }

  if (!token) {
    return {
      success: false,
      error: 'Harap selesaikan verifikasi keamanan (CAPTCHA).'
    }
  }

  try {
    const formData = new URLSearchParams()
    formData.append('secret', secretKey)
    formData.append('response', token)
    if (remoteIp) {
      formData.append('remoteip', remoteIp)
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      console.error(`[Turnstile] HTTP error dari Cloudflare: ${response.status}`)
      return {
        success: false,
        error: 'Gagal memvalidasi keamanan ke server Cloudflare.'
      }
    }

    const data = (await response.json()) as TurnstileVerifyResponse

    if (data.success) {
      return { success: true }
    }

    console.warn('[Turnstile] Validasi token gagal:', data['error-codes'])
    return {
      success: false,
      error: 'Verifikasi keamanan kedaluwarsa atau tidak valid. Silakan coba lagi.'
    }
  } catch (err: any) {
    console.error('[Turnstile] Kesalahan jaringan saat memverifikasi token:', err)
    return {
      success: false,
      error: 'Terjadi gangguan jaringan saat verifikasi CAPTCHA.'
    }
  }
}
