import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard Administrator - PEKPPP.ext'
}

export default function AdminPage() {
  redirect('/admin/periode')
}
