// src/app/admin/artikel/[id]/edit/page.tsx
import React from 'react'
import { notFound } from 'next/navigation'
import { getArticleByIdAction } from '../../../../../actions/article-actions'
import { ArticleForm } from '../../../../../components/admin/ArticleForm'

export const metadata = {
  title: 'Edit Artikel - PEKPPP.ext',
  description: 'Perbarui konten artikel dan optimasi SEO.'
}

export default async function EditArtikelPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const res = await getArticleByIdAction(id)

  if (!res.success || !res.article) {
    notFound()
  }

  return <ArticleForm initialArticle={res.article} />
}
