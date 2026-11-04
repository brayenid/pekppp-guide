// src/app/kabar/[slug]/ArticleReaderClient.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Clock,
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Tag,
  Eye,
  Bookmark,
  ChevronRight,
  ExternalLink,
  MessageCircle,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { ArticleItem } from '../../../actions/article-actions'

function formatDateIndo(dateStr?: string | Date | null): string {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(d)
}

export function ArticleReaderClient({
  article,
  relatedArticles = []
}: {
  article: ArticleItem
  relatedArticles?: ArticleItem[]
}) {
  const [copied, setCopied] = useState(false)
  const [currentViewCount, setCurrentViewCount] = useState(article.viewCount || 0)

  // Client-Side Ping: Mengirim hit viewCount secara asynchronous + Anti-Spam Sesi
  useEffect(() => {
    if (!article.id || !article.isPublished) return

    const sessionKey = `viewed_article_${article.id}`
    try {
      // Jika sudah pernah melihat artikel ini dalam sesi browser aktif, jangan hit lagi
      if (sessionStorage.getItem(sessionKey)) {
        return
      }

      // Tandai sudah dibaca dalam sesi ini
      sessionStorage.setItem(sessionKey, '1')

      // Kirim ping non-blocking ke API
      fetch(`/api/kabar/${article.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
        .then((res) => {
          if (res.ok) {
            setCurrentViewCount((prev) => prev + 1)
          }
        })
        .catch((err) => {
          // Fail silently di client
          console.debug('View ping error:', err)
        })
    } catch {
      // Fallback jika browser memblokir sessionStorage
    }
  }, [article.id, article.isPublished])

  // Copy URL
  const handleCopy = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Tautan artikel berhasil disalin ke clipboard!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Share WhatsApp
  const shareWhatsApp = () => {
    if (typeof window === 'undefined') return
    const text = encodeURIComponent(`${article.title}\n\nBaca selengkapnya di: ${window.location.href}`)
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank')
  }

  // Share Twitter / X
  const shareTwitter = () => {
    if (typeof window === 'undefined') return
    const text = encodeURIComponent(article.title)
    const url = encodeURIComponent(window.location.href)
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank')
  }

  // Share Facebook
  const shareFacebook = () => {
    if (typeof window === 'undefined') return
    const url = encodeURIComponent(window.location.href)
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank')
  }

  const coverUrl = article.coverImageAsset?.fileUrl
    ? article.coverImageAsset.fileUrl.startsWith('http') ||
      article.coverImageAsset.fileUrl.startsWith('/')
      ? article.coverImageAsset.fileUrl
      : `/api/media/${article.coverImageAsset.id}/preview`
    : null

  const tagsList = article.tags
    ? article.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
    : []

  return (
    <article className="max-w-4xl mx-auto space-y-8 pb-24 px-4 sm:px-6">
        {/* ── Breadcrumb ── */}
        <div className="text-xs text-ink-muted pt-4">
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 truncate">
            <Link href="/" className="hover:text-brand transition-colors">
              Beranda
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <Link href="/kabar" className="hover:text-brand transition-colors">
              Kabar &amp; Artikel
            </Link>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60" />
            <span className="text-ink font-medium truncate max-w-[200px] sm:max-w-xs">
              {article.category}
            </span>
          </nav>
        </div>

        {/* ── Article Header ── */}
        <header className="space-y-4">
          <div className="flex items-center gap-2.5 text-xs text-ink-muted flex-wrap">
            <span className="px-3 py-1 rounded-full bg-brand-light text-brand font-semibold text-xs">
              {article.category}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {formatDateIndo(article.publishedAt || article.createdAt)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {article.readingTime || 3} min baca
            </span>
            {currentViewCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  {currentViewCount} pembaca
                </span>
              </>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-ink leading-tight tracking-tight">
            {article.title}
          </h1>

          {article.excerpt && (
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed font-normal border-l-2 border-brand pl-4 py-1 italic">
              {article.excerpt}
            </p>
          )}

          {/* Author & Share Bar */}
          <div className="pt-4 border-t border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20">
                {article.authorName.charAt(0)}
              </div>
              <div className="text-xs">
                <div className="font-semibold text-ink text-sm">{article.authorName}</div>
                <div className="text-ink-muted">
                  {article.authorRole || 'Tim Pembina Pelayanan Publik'}
                </div>
              </div>
            </div>

            {/* Social Share Buttons */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <span className="text-xs text-ink-muted mr-1 flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5" />
                <span>Bagikan:</span>
              </span>

              <button
                type="button"
                onClick={shareWhatsApp}
                className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-medium transition-colors"
                title="Bagikan ke WhatsApp">
                WA
              </button>

              <button
                type="button"
                onClick={shareTwitter}
                className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-medium transition-colors"
                title="Bagikan ke X / Twitter">
                X
              </button>

              <button
                type="button"
                onClick={shareFacebook}
                className="px-2.5 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 text-xs font-medium transition-colors"
                title="Bagikan ke Facebook">
                FB
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface text-ink text-xs font-medium border border-line transition-colors"
                title="Salin tautan artikel">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* ── Main Cover Banner ── */}
        {coverUrl && (
          <div className="space-y-2">
            <div className="w-full rounded-2xl overflow-hidden border border-line bg-surface-subtle max-h-[460px] shadow-sm">
              <img
                src={coverUrl}
                alt={article.title}
                className="w-full h-full object-cover"
              />
            </div>
            {article.coverImageAsset?.title && (
              <p className="text-[11px] text-ink-muted text-center italic">
                Dokumentasi: {article.coverImageAsset.title}
              </p>
            )}
          </div>
        )}

        {/* ── Article Content Body ── */}
        <div
          className="article-content prose prose-base sm:prose-lg dark:prose-invert max-w-none text-ink leading-relaxed"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        {/* ── Tags / Keywords Section ── */}
        {tagsList.length > 0 && (
          <div className="pt-6 border-t border-line space-y-2.5">
            <div className="flex items-center gap-1.5 text-xs text-ink-muted font-medium">
              <Tag className="w-3.5 h-3.5 text-brand" />
              <span>Kata Kunci Terkait:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tagsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-surface-subtle text-ink-secondary border border-line">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Author Signature Box ── */}
        <div className="p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-base border border-brand/20">
              {article.authorName.charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-ink">{article.authorName}</div>
              <div className="text-xs text-ink-muted">
                {article.authorRole || 'Bagian Organisasi Sekretariat Daerah'}
              </div>
            </div>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            Artikel ini diterbitkan secara resmi oleh Bagian Organisasi Pemerintah Kabupaten Kutai Barat sebagai media edukasi, diseminasi regulasi, dan transparansi penyelenggaraan evaluasi pelayanan publik (PEKPPP).
          </p>
        </div>

        {/* ── Related Articles Section ── */}
        {relatedArticles.length > 0 && (
          <div className="pt-10 border-t border-line space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-ink tracking-tight">
                  Rekomendasi Artikel Lainnya
                </h3>
                <p className="text-xs text-ink-muted">
                  Kabar dan panduan seputar evaluasi PEKPPP yang relevan
                </p>
              </div>

              <Link
                href="/kabar"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1">
                <span>Lihat Semua</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedArticles.map((rel) => {
                const relCover = rel.coverImageAsset?.fileUrl
                  ? rel.coverImageAsset.fileUrl.startsWith('http') ||
                    rel.coverImageAsset.fileUrl.startsWith('/')
                    ? rel.coverImageAsset.fileUrl
                    : `/api/media/${rel.coverImageAsset.id}/preview`
                  : null

                return (
                  <Link
                    key={rel.id}
                    href={`/kabar/${rel.slug}`}
                    className="flex flex-col rounded-xl border border-line bg-surface hover:border-brand/40 overflow-hidden group shadow-2xs transition-all">
                    <div className="h-28 w-full bg-surface-subtle overflow-hidden">
                      {relCover ? (
                        <img
                          src={relCover}
                          alt={rel.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand/10 flex items-center justify-center text-brand">
                          <Bookmark className="w-6 h-6 opacity-30" />
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-semibold text-brand block uppercase">
                          {rel.category}
                        </span>
                        <h4 className="text-xs font-semibold text-ink line-clamp-2 group-hover:text-brand transition-colors">
                          {rel.title}
                        </h4>
                      </div>
                      <div className="text-[10px] text-ink-muted pt-2 border-t border-line">
                        {formatDateIndo(rel.publishedAt || rel.createdAt)}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </article>
    )
  }
