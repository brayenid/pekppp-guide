'use server'

import { db } from '../services/db'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export interface UserSession {
  id: string
  email: string
  fullName: string
  role: 'SUPER_ADMIN' | 'OPD'
}

export async function loginAction(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = (formData.get('password') as string)?.trim()

  if (!email || !password) {
    return { success: false, error: 'Email dan password wajib diisi.' }
  }

  const profile = await db.profile.findUnique({
    where: { email }
  })

  if (!profile || profile.password !== password) {
    return { success: false, error: 'Email atau password salah.' }
  }

  const sessionData: UserSession = {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: profile.role
  }

  const cookieStore = await cookies()
  cookieStore.set('pekppp_session', JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/'
  })

  revalidatePath('/')
  return { success: true, user: sessionData }
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete('pekppp_session')
  revalidatePath('/')
  redirect('/login')
}

export async function getCurrentUserAction(): Promise<UserSession | null> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('pekppp_session')
  if (!sessionCookie) return null

  try {
    return JSON.parse(sessionCookie.value) as UserSession
  } catch {
    return null
  }
}

export async function updateOwnPasswordAction(password: string) {
  const user = await getCurrentUserAction()
  if (!user) return { success: false, error: 'Unauthorized.' }

  if (!password || password.trim().length < 4) {
    return { success: false, error: 'Password minimal 4 karakter.' }
  }

  await db.profile.update({
    where: { id: user.id },
    data: { password: password.trim() }
  })

  return { success: true }
}
