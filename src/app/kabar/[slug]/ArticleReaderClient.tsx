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

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  )
}

function XTwitterIcon({ className = 'w-3.5 h-3.5' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  )
}

function FacebookIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  )
}

type TextSize = 'sm' | 'base' | 'lg'

export function ArticleReaderClient({
  article,
  relatedArticles = []
}: {
  article: ArticleItem
  relatedArticles?: ArticleItem[]
}) {
  const [copied, setCopied] = useState(false)
  const [currentViewCount, setCurrentViewCount] = useState(article.viewCount || 0)
  const [textSize, setTextSize] = useState<TextSize>('base')

  // Load saved text size preference
  useEffect(() => {
    try {
      const saved = localStorage.getItem('pekppp-article-text-size') as TextSize | null
      if (saved && ['sm', 'base', 'lg'].includes(saved)) {
        setTextSize(saved)
      }
    } catch (_) {}
  }, [])

  const handleSetTextSize = (size: TextSize) => {
    setTextSize(size)
    try {
      localStorage.setItem('pekppp-article-text-size', size)
    } catch (_) {}
  }

  // Client-Side Ping: Mengirim hit viewCount secara asynchronous + Anti-Spam Sesi
  useEffect(() => {
    if (!article.id || !article.isPublished) return

    const sessionKey = `viewed_article_${article.id}`
    try {
      if (sessionStorage.getItem(sessionKey)) {
        return
      }

      sessionStorage.setItem(sessionKey, '1')

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
      toast.success('Tautan artikel berhasil disalin!')
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

  const textSizeClasses: Record<TextSize, string> = {
    sm: 'prose-sm sm:prose-base leading-relaxed',
    base: 'prose-base sm:prose-lg leading-relaxed',
    lg: 'prose-lg sm:prose-xl leading-loose'
  }

  return (
    <article className="max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-24">
      {/* ── Breadcrumb & Category Bar (Medium Style) ── */}
      <nav aria-label="Breadcrumb" className="flex items-center justify-between text-xs text-ink-muted pt-2 sm:pt-4">
        <Link
          href="/kabar"
          className="inline-flex items-center gap-1.5 font-medium text-ink-muted hover:text-brand transition-colors group">
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          <span>Kembali ke Kabar</span>
        </Link>
        <span className="px-2.5 py-0.5 rounded-full bg-brand/10 text-brand font-semibold text-[11px] border border-brand/15">
          {article.category}
        </span>
      </nav>

      {/* ── Editorial Header ── */}
      <header className="space-y-4 sm:space-y-5">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] font-bold text-ink leading-[1.22] tracking-tight font-sans">
          {article.title}
        </h1>

        {article.excerpt && (
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-normal">
            {article.excerpt}
          </p>
        )}

        {/* Author Byline */}
        <div className="flex items-center gap-3 pt-1">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-sm border border-brand/20 shrink-0">
            {article.authorName.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-ink text-sm sm:text-base leading-snug">
              {article.authorName}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-ink-muted flex-wrap">
              <span>{formatDateIndo(article.publishedAt || article.createdAt)}</span>
              <span className="opacity-40">•</span>
              <span>{article.readingTime || 2} min baca</span>
              {currentViewCount > 0 && (
                <>
                  <span className="opacity-40">•</span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 opacity-70" />
                    {currentViewCount} pembaca
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Bar (Medium-style: Text Size + Branded Social Share) */}
        <div className="py-2.5 border-y border-line flex items-center justify-between gap-3 text-xs">
          {/* Text Sizing Controls */}
          <div className="flex items-center gap-1.5" aria-label="Pengaturan ukuran teks">
            <span className="text-[11px] font-medium text-ink-muted hidden sm:inline mr-0.5">Teks:</span>
            <div className="inline-flex items-center rounded-lg bg-surface-subtle border border-line p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => handleSetTextSize('sm')}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                  textSize === 'sm'
                    ? 'bg-surface text-brand shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="Teks Kecil (A-)">
                A-
              </button>
              <button
                type="button"
                onClick={() => handleSetTextSize('base')}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                  textSize === 'base'
                    ? 'bg-surface text-brand shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="Teks Normal (A)">
                A
              </button>
              <button
                type="button"
                onClick={() => handleSetTextSize('lg')}
                className={`px-2 py-0.5 rounded-md text-xs font-semibold transition-all ${
                  textSize === 'lg'
                    ? 'bg-surface text-brand shadow-2xs'
                    : 'text-ink-muted hover:text-ink'
                }`}
                title="Teks Besar (A+)">
                A+
              </button>
            </div>
          </div>

          {/* Branded Social Share Icon Buttons */}
          <div className="flex items-center gap-1.5" aria-label="Bagikan artikel">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-[#25D366]/15 hover:border-[#25D366]/30 text-ink-muted hover:text-[#25D366] border border-line flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Bagikan ke WhatsApp"
              aria-label="Bagikan ke WhatsApp">
              <WhatsAppIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={shareTwitter}
              className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-black/10 dark:hover:bg-white/15 hover:border-black/20 dark:hover:border-white/25 text-ink-muted hover:text-ink border border-line flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Bagikan ke X (Twitter)"
              aria-label="Bagikan ke X">
              <XTwitterIcon className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={shareFacebook}
              className="w-8 h-8 rounded-full bg-surface-subtle hover:bg-[#1877F2]/15 hover:border-[#1877F2]/30 text-ink-muted hover:text-[#1877F2] border border-line flex items-center justify-center transition-all shadow-2xs active:scale-95"
              title="Bagikan ke Facebook"
              aria-label="Bagikan ke Facebook">
              <FacebookIcon className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleCopy}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all shadow-2xs active:scale-95 ${
                copied
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-surface-subtle hover:bg-brand/10 hover:border-brand/30 text-ink-muted hover:text-brand border-line'
              }`}
              title={copied ? 'Tautan berhasil disalin!' : 'Salin tautan artikel'}
              aria-label="Salin tautan artikel">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
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
        className={`article-content prose dark:prose-invert max-w-none text-ink ${textSizeClasses[textSize]}`}
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
