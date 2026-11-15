'use server'

import { db } from '../services/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  UserSessionPayload,
  signSessionToken,
  verifySessionToken,
  hashPassword,
  verifyPassword
} from '../lib/jwt-auth'
import { ActivityLogService } from '../services/activity-log-service'

export type UserSession = UserSessionPayload

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  const profile = await db.profile.findUnique({
    where: { email }
  })

  if (!profile) {
    await ActivityLogService.log({
      category: 'AUTH',
      action: 'LOGIN_FAILED',
      description: `Percobaan login gagal: akun dengan email "${email}" tidak ditemukan.`,
      metadata: { email, reason: 'USER_NOT_FOUND' }
    })
    return { success: false, error: 'Email atau password salah.' }
  }

  const { isValid, needsRehash } = await verifyPassword(password, profile.password)

  if (!isValid) {
    await ActivityLogService.log({
      category: 'AUTH',
      action: 'LOGIN_FAILED',
      description: `Percobaan login gagal: password salah untuk akun "${profile.fullName}" (${email}).`,
      userId: profile.id,
      userName: profile.fullName,
      userRole: profile.role,
      metadata: { email, reason: 'INVALID_PASSWORD' }
    })
    return { success: false, error: 'Email atau password salah.' }
  }

  // Auto-upgrade password plaintext lama ke bcrypt hash secara transparan
  if (needsRehash) {
    const hashedPassword = await hashPassword(password)
    await db.profile
      .update({
        where: { id: profile.id },
        data: { password: hashedPassword }
      })
      .catch(() => {})
  }

  const sessionData: UserSession = {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    phone: profile.phone ?? null,
    role: profile.role
  }

  const jwtToken = await signSessionToken(sessionData)

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, jwtToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_MAX_AGE_SECONDS,
    path: '/'
  })

  await ActivityLogService.log({
    category: 'AUTH',
    action: 'LOGIN_SUCCESS',
    description: `${profile.fullName} (${profile.role}) berhasil login ke sistem.`,
    userId: profile.id,
    userName: profile.fullName,
    userRole: profile.role
  })

  revalidatePath('/')
  return { success: true, user: sessionData }
}

export async function logoutAction() {
  const currentUser = await getCurrentUserAction()
  if (currentUser) {
    await ActivityLogService.log({
      category: 'AUTH',
      action: 'LOGOUT',
      description: `${currentUser.fullName} (${currentUser.role}) keluar dari sistem (logout).`,
      userId: currentUser.id,
      userName: currentUser.fullName,
      userRole: currentUser.role as any
    })
  }
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  revalidatePath('/')
  redirect('/login')
}

export async function getCurrentUserAction(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)
  if (!sessionCookie?.value) return null

  return await verifySessionToken(sessionCookie.value)
}

export async function updateOwnPasswordAction(password: string) {
  const user = await getCurrentUserAction()
  if (!user) return { success: false, error: 'Unauthorized.' }

  if (!password || password.trim().length < 4) {
    return { success: false, error: 'Password minimal 4 karakter.' }
  }

  const hashedPassword = await hashPassword(password.trim())

  await db.profile.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  })

  return { success: true }
}
