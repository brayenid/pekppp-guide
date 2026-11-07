import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE_NAME, verifySessionToken } from './lib/jwt-auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value

  const isAdminRoute = pathname.startsWith('/admin')
  const isOpdRoute = pathname.startsWith('/opd')
  const isLoginRoute = pathname === '/login'

  // Hanya jalankan verifikasi sesi untuk route yang membutuhkan proteksi atau login redirect
  if (!isAdminRoute && !isOpdRoute && !isLoginRoute) {
    return NextResponse.next()
  }

  const session = token ? await verifySessionToken(token) : null

  // 1. Jika mengakses /admin tanpa sesi valid -> arahkan ke /login
  if (isAdminRoute) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(loginUrl)
    }
    if (session.role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/opd', request.url))
    }
    return NextResponse.next()
  }

  // 2. Jika mengakses /opd tanpa sesi valid -> arahkan ke /login
  if (isOpdRoute) {
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(loginUrl)
    }
    if (session.role === 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/admin', request.url))
    }
    return NextResponse.next()
  }

  // 3. Jika sudah punya sesi valid namun membuka /login -> arahkan ke dashboard masing-masing
  if (isLoginRoute && session) {
    const dest = session.role === 'SUPER_ADMIN' ? '/admin' : '/opd'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/opd/:path*', '/login']
}
