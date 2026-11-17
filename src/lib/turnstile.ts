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
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY

  // Jika kunci rahasia belum diatur di server (baik di lokal maupun di production),
  // otomatis bypass verifikasi secara aman agar tidak memblokir akses login pengguna.
  if (!secretKey) {
    return { success: true }
  }

  // Jika kunci rahasia telah diatur di server, token wajib dikirim
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
