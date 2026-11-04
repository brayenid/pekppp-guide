// src/app/kabar/[slug]/page.tsx
import React from 'react'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getArticleBySlugAction } from '../../../actions/article-actions'
import { ArticleReaderClient } from './ArticleReaderClient'

interface Props {
  params: Promise<{ slug: string }>
}

/**
 * ── FULL DYNAMIC SEO METADATA GENERATOR ─────────────────────────────────────
 * Menghasilkan tag meta standar Open Graph, Twitter Cards, Keywords, Canonical,
 * dan Article published/modified time untuk crawler Google, Bing & Media Sosial.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const res = await getArticleBySlugAction(slug)

  if (!res.success || !res.article) {
    return {
      title: 'Artikel Tidak Ditemukan - PEKPPP Kutai Barat',
      description: 'Halaman artikel yang Anda cari tidak tersedia atau belum dipublikasikan.'
    }
  }

  const { article } = res
  const pageTitle = `${article.seoTitle || article.title} - PEKPPP Kutai Barat`
  const pageDescription =
    article.seoDescription ||
    article.excerpt ||
    `Baca ${article.title} seputar evaluasi kinerja pelayanan publik di lingkungan Pemerintah Kabupaten Kutai Barat.`
  const canonicalUrl = `https://pekppp.kutaibaratkab.go.id/kabar/${article.slug}`

  // Cover image URL
  const coverUrl = article.coverImageAsset?.fileUrl
    ? article.coverImageAsset.fileUrl.startsWith('http')
      ? article.coverImageAsset.fileUrl
      : `https://pekppp.kutaibaratkab.go.id${article.coverImageAsset.fileUrl}`
    : 'https://pekppp.kutaibaratkab.go.id/kantor.png'

  const keywords = article.tags
    ? article.tags.split(',').map((t) => t.trim())
    : ['PEKPPP', 'Kutai Barat', 'Pelayanan Publik', article.category]

  return {
    title: pageTitle,
    description: pageDescription,
    keywords,
    authors: [{ name: article.authorName, url: 'https://kutaibaratkab.go.id' }],
    creator: article.authorName,
    publisher: 'Pemerintah Kabupaten Kutai Barat',
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: canonicalUrl,
      siteName: 'PEKPPP.ext - Pemerintah Kabupaten Kutai Barat',
      locale: 'id_ID',
      type: 'article',
      publishedTime: article.publishedAt
        ? new Date(article.publishedAt).toISOString()
        : new Date(article.createdAt).toISOString(),
      modifiedTime: new Date(article.updatedAt).toISOString(),
      section: article.category,
      tags: keywords,
      images: [
        {
          url: coverUrl,
          width: 1200,
          height: 630,
          alt: article.title
        }
      ]
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: pageDescription,
      images: [coverUrl]
    },
    robots: {
      index: true,
      follow: true,
      nocache: false,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1
      }
    }
  }
}

export default async function KabarDetailPage({ params }: Props) {
  const { slug } = await params
  const res = await getArticleBySlugAction(slug)

  if (!res.success || !res.article) {
    notFound()
  }

  const { article, relatedArticles = [] } = res
  const canonicalUrl = `https://pekppp.kutaibaratkab.go.id/kabar/${article.slug}`
  const coverUrl = article.coverImageAsset?.fileUrl
    ? article.coverImageAsset.fileUrl.startsWith('http')
      ? article.coverImageAsset.fileUrl
      : `https://pekppp.kutaibaratkab.go.id${article.coverImageAsset.fileUrl}`
    : 'https://pekppp.kutaibaratkab.go.id/kantor.png'

  /**
   * ── JSON-LD STRUCTURED DATA SCHEMA (Schema.org / NewsArticle) ───────────────
   * Injeksi skema mikrodata resmi untuk Google Search Rich Snippet & Google News
   */
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl
    },
    headline: article.title,
    description: article.excerpt || article.title,
    image: [coverUrl],
    datePublished: article.publishedAt
      ? new Date(article.publishedAt).toISOString()
      : new Date(article.createdAt).toISOString(),
    dateModified: new Date(article.updatedAt).toISOString(),
    author: {
      '@type': 'Organization',
      name: article.authorName,
      url: 'https://kutaibaratkab.go.id'
    },
    publisher: {
      '@type': 'GovernmentOrganization',
      name: 'Pemerintah Kabupaten Kutai Barat',
      logo: {
        '@type': 'ImageObject',
        url: 'https://pekppp.kutaibaratkab.go.id/kantor.png'
      }
    },
    articleSection: article.category,
    keywords: article.tags || 'PEKPPP, Pelayanan Publik, Kutai Barat'
  }

  return (
    <>
      {/* ── Google Rich Snippet Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <ArticleReaderClient article={article} relatedArticles={relatedArticles} />
    </>
  )
}
