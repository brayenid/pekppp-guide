// src/app/kabar/page.tsx
import React from 'react'
import { Metadata } from 'next'
import { getPublishedArticlesAction } from '../../actions/article-actions'
import { KabarClient } from './KabarClient'

export const metadata: Metadata = {
  title: 'Kabar & Artikel PEKPPP - Pemerintah Kabupaten Kutai Barat',
  description:
    'Pusat publikasi resmi seputar pemantauan evaluasi pelayanan publik, kiat pemenuhan bukti dukung, inovasi unit lokus, dan informasi terkini di Kabupaten Kutai Barat.',
  keywords: [
    'PEKPPP',
    'Kabar PEKPPP Kutai Barat',
    'Pelayanan Publik Kutai Barat',
    'Evaluasi Kinerja Pelayanan Publik',
    'Bagian Organisasi Kutai Barat',
    'Inovasi Pelayanan Publik',
    'Panduan Bukti Dukung'
  ],
  alternates: {
    canonical: 'https://pekppp.kutaibaratkab.go.id/kabar'
  },
  openGraph: {
    title: 'Kabar & Artikel PEKPPP - Pemerintah Kabupaten Kutai Barat',
    description:
      'Pusat publikasi resmi seputar pemantauan evaluasi pelayanan publik, kiat pemenuhan bukti dukung, inovasi unit lokus, dan informasi terkini di Kabupaten Kutai Barat.',
    url: 'https://pekppp.kutaibaratkab.go.id/kabar',
    siteName: 'PEKPPP.ext - Kutai Barat',
    locale: 'id_ID',
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kabar & Artikel PEKPPP - Pemerintah Kabupaten Kutai Barat',
    description:
      'Pusat publikasi resmi seputar pemantauan evaluasi pelayanan publik, kiat pemenuhan bukti dukung, dan informasi terkini di Kabupaten Kutai Barat.'
  }
}

export default async function KabarPage() {
  const res = await getPublishedArticlesAction({ page: 1, limit: 9 })
  const articles = res.success && res.items ? res.items : []
  const initialTotal = res.total || 0
  const initialHasMore = Boolean(res.hasMore)
  const categoryCounts = res.categoryCounts || {}

  return (
    <KabarClient
      initialArticles={articles}
      initialTotal={initialTotal}
      initialHasMore={initialHasMore}
      categoryCounts={categoryCounts}
    />
  )
}
