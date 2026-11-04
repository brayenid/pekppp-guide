// src/app/admin/artikel/tulis/page.tsx
import React from 'react'
import { ArticleForm } from '../../../../components/admin/ArticleForm'

export const metadata = {
  title: 'Tulis Artikel Baru - PEKPPP.ext',
  description: 'Tulis artikel, panduan, atau kabar kegiatan baru dengan editor WYSIWYG dan optimasi SEO.'
}

export default function TulisArtikelPage() {
  return <ArticleForm />
}
