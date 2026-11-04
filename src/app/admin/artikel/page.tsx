// src/app/admin/artikel/page.tsx
import React from 'react'
import { getAdminArticlesAction } from '../../../actions/article-actions'
import { AdminArticleListClient } from './AdminArticleListClient'

export const metadata = {
  title: 'Kelola Artikel & Kabar Berita PEKPPP',
  description: 'Pengelolaan artikel, panduan praktis, dan kabar berita teroptimasi SEO.'
}

export default async function AdminArtikelPage() {
  const res = await getAdminArticlesAction({ page: 1, limit: 10 })
  const articles = res.success && res.items ? res.items : []
  const initialTotal = res.total || 0
  const initialHasMore = Boolean(res.hasMore)
  const initialMetrics = res.metrics || {
    totalArticles: 0,
    totalPublished: 0,
    totalDraft: 0,
    totalViews: 0
  }
  const initialCategories = res.availableCategories || []

  return (
    <AdminArticleListClient
      initialArticles={articles}
      initialTotal={initialTotal}
      initialHasMore={initialHasMore}
      initialMetrics={initialMetrics}
      initialCategories={initialCategories}
    />
  )
}
