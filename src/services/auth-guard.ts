// src/services/auth-guard.ts
// Authorization & Role Guard Service Layer
import { getCurrentUserAction } from '../actions/auth-actions'
import { db } from './db'
import { redirect } from 'next/navigation'

/**
 * Memverifikasi apakah sesi pengguna yang aktif memiliki peran SUPER_ADMIN.
 * - Mengarahkan ke `/login` jika pengguna belum login.
 * - Mengarahkan ke halaman utama dengan error forbidden jika pengguna bukan SUPER_ADMIN.
 * @returns Pengguna terautentikasi dengan hak akses SUPER_ADMIN.
 */
export async function requireSuperAdmin() {
  const user = await getCurrentUserAction()
  if (!user) {
    redirect('/login?error=unauthorized')
  }
  if (user.role !== 'SUPER_ADMIN') {
    redirect('/?error=forbidden')
  }
  return user
}

/**
 * Memvalidasi apakah terdapat sesi pengguna yang sedang login.
 * - Mengarahkan ke `/login` jika sesi tidak ditemukan atau kedaluwarsa.
 * @returns Data pengguna yang sedang login.
 */
export async function requireAuth() {
  const user = await getCurrentUserAction()
  if (!user) {
    redirect('/login?error=unauthorized')
  }
  return user
}

/**
 * Memeriksa izin akses pengguna ke evaluasi suatu unit lokus tertentu.
 * - SUPER_ADMIN diizinkan mengakses dan mengevaluasi seluruh unit tanpa batasan.
 * - Pengguna OPD hanya diizinkan mengakses unit yang ditugaskan ke akun mereka (`UserUnit`).
 * @param unitId ID unit lokus yang akan diakses.
 * @returns Status akses `{ allowed: boolean, reason?: string, user?: any }`.
 */
export async function canAccessUnitEvaluation(unitId: string) {
  const user = await getCurrentUserAction()
  if (!user) {
    return { allowed: false, reason: 'NOT_LOGGED_IN' }
  }

  // Super Admin can access and evaluate any unit
  if (user.role === 'SUPER_ADMIN') {
    return { allowed: true, user }
  }

  // OPD user can only access units bound to their account
  const binding = await db.userUnit.findUnique({
    where: {
      userId_unitId: {
        userId: user.id,
        unitId
      }
    }
  })

  if (!binding) {
    return { allowed: false, reason: 'UNIT_NOT_ASSIGNED', user }
  }

  return { allowed: true, user }
}
