import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Notifikasi Sistem - PEKPPP.ext'
}

export default function NotifikasiLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
