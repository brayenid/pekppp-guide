import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Kelola Unit Lokus - PEKPPP.ext'
}

export default function OldUnitsRedirect() { redirect('/admin/lokus') }
