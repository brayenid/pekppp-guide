'use client'

import { usePathname } from 'next/navigation'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export function AppLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicSurvey = pathname?.startsWith('/survei')
  const isSharedEvidence = pathname?.startsWith('/shared')

  if (isPublicSurvey || isSharedEvidence) {
    return <>{children}</>
  }

  return (
    <>
      <Navbar />
      <main className="flex-1 w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Footer />
    </>
  )
}
