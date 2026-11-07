import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'

export const SESSION_COOKIE_NAME = 'pekppp_session'
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7 // 7 hari

export interface UserSessionPayload {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: 'SUPER_ADMIN' | 'OPD'
}

/**
 * Mengambil secret key kriptografis untuk JWT HS256.
 * Menggunakan AUTH_SECRET atau JWT_SECRET dari environment, dengan fallback
 * deterministik berbasis konfigurasi server jika belum disetel.
 */
function getJwtSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.DATABASE_URL ||
    'pekppp-kutai-barat-secure-jwt-key-2026-v1'
  return new TextEncoder().encode(secret)
}

/**
 * Menandatangani (Sign) payload sesi pengguna menjadi JWT Token terenkripsi HS256.
 */
export async function signSessionToken(payload: UserSessionPayload): Promise<string> {
  const secretKey = getJwtSecretKey()

  return await new SignJWT({
    id: payload.id,
    email: payload.email,
    fullName: payload.fullName,
    phone: payload.phone ?? null,
    role: payload.role
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(payload.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(secretKey)
}

/**
 * Memverifikasi token JWT dari cookie.
 * Mengembalikan null jika token kedaluwarsa, rusak, atau dimanipulasi (tampered).
 */
export async function verifySessionToken(token: string): Promise<UserSessionPayload | null> {
  if (!token || typeof token !== 'string') return null

  try {
    const secretKey = getJwtSecretKey()
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256']
    })

    if (
      typeof payload.id !== 'string' ||
      typeof payload.email !== 'string' ||
      typeof payload.fullName !== 'string' ||
      (payload.role !== 'SUPER_ADMIN' && payload.role !== 'OPD')
    ) {
      return null
    }

    return {
      id: payload.id,
      email: payload.email,
      fullName: payload.fullName,
      phone: typeof payload.phone === 'string' ? payload.phone : null,
      role: payload.role
    }
  } catch {
    // Jika token lama berupa JSON mentah atau signature tidak valid -> tolak
    return null
  }
}

/**
 * Memeriksa apakah string password sudah berbentuk bcrypt hash ($2a$, $2b$, atau $2y$).
 */
export function isBcryptHash(str: string): boolean {
  return /^\$2[aby]\$\d{2}\$.{53}$/.test(str)
}

/**
 * Meng-hash password plaintext menggunakan bcrypt (cost factor 10).
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  if (isBcryptHash(plainPassword)) {
    return plainPassword
  }
  return await bcrypt.hash(plainPassword, 10)
}

/**
 * Memverifikasi kecocokan password dengan hash di database.
 * Mendukung fallback transisi dari password plaintext lama untuk di-upgrade otomatis.
 */
export async function verifyPassword(
  inputPassword: string,
  storedPassword: string
): Promise<{ isValid: boolean; needsRehash: boolean }> {
  if (isBcryptHash(storedPassword)) {
    const isValid = await bcrypt.compare(inputPassword, storedPassword)
    return { isValid, needsRehash: false }
  }

  // Fallback untuk akun existing yang masih plaintext di DB
  const isValid = inputPassword === storedPassword
  return { isValid, needsRehash: isValid }
}
