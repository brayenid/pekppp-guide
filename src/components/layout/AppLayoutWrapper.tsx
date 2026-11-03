'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { HeaderProvider } from './HeaderContext'

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicSurvey = pathname?.startsWith('/survei')
  const isSharedEvidence = pathname?.startsWith('/shared')
  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/opd')

  if (isPublicSurvey || isSharedEvidence) {
    return <>{children}</>
  }

  // Dashboard layout (/admin & /opd) uses an integrated 2-column shell
  if (isDashboard) {
    return (
      <HeaderProvider>
        {children}
      </HeaderProvider>
    )
  }

  return (
    <HeaderProvider>
      <Navbar />
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </HeaderProvider>
  )
}
