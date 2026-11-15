'use client'

import { useState } from 'react'
import { addCommentAction, toggleResolveCommentAction } from '../../actions/comment-actions'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Reply,
  ShieldCheck,
  Building2,
  Loader2,
  ChevronUp,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

export interface CommentItem {
  id: string
  message: string
  isResolved: boolean
  createdAt: Date | string
  authorId?: string
  author: {
    id?: string
    fullName: string
    role: string
  }
  replies?: CommentItem[]
}

function formatCommentDate(date: Date | string) {
  const d = new Date(date)
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
}

function getAuthorConfig(role?: string) {
  const isEvaluator = role === 'SUPER_ADMIN' || role?.toLowerCase().includes('admin')
  if (isEvaluator) {
    return {
      label: 'Evaluator',
      isEvaluator: true,
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-200/80 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50',
      avatarBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-2xs',
      bubbleClass: 'bg-blue-50/70 border-blue-200/70 dark:bg-blue-950/25 dark:border-blue-900/40 text-ink',
      replyBubbleClass: 'bg-blue-50/50 border-blue-200/60 dark:bg-blue-950/20 dark:border-blue-900/30 text-ink'
    }
  }
  return {
    label: 'OPD',
    isEvaluator: false,
    badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50',
    avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-2xs',
    bubbleClass: 'bg-surface-elevated border-stroke/80 text-ink shadow-2xs',
    replyBubbleClass: 'bg-surface-elevated border-stroke/60 text-ink shadow-2xs'
  }
}

export function IndicatorCommentSection({
  evaluationScoreId,
  comments,
  unitId,
  authorId
}: {
  evaluationScoreId: string
  comments: CommentItem[]
  unitId: string
  authorId: string
}) {
  const hasComments = comments && comments.length > 0
  const [isOpen, setIsOpen] = useState(hasComments)
  const [message, setMessage] = useState('')
  const [replyParentId, setReplyParentId] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddComment = async (e?: React.SyntheticEvent) => {
    if (e) e.preventDefault()
    if (loading || !message.trim()) return

    setLoading(true)
    try {
      await addCommentAction({
        evaluationScoreId,
        authorId,
        message: message.trim(),
        path: `/evaluasi/${unitId}`
      })
      setMessage('')
      setIsOpen(true)
      toast.success('Komentar berhasil dikirim!')
    } catch {
      toast.error('Gagal mengirim komentar.')
    } finally {
      setLoading(false)
    }
  }

  const handleReply = async (parentId: string) => {
    if (!replyMessage.trim()) return

    setLoading(true)
    try {
      await addCommentAction({
        evaluationScoreId,
        authorId,
        message: replyMessage.trim(),
        parentId,
        path: `/evaluasi/${unitId}`
      })
      setReplyMessage('')
      setReplyParentId(null)
      toast.success('Balasan berhasil dikirim!')
    } catch {
      toast.error('Gagal mengirim balasan.')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleResolve = async (commentId: string, currentResolved: boolean) => {
    try {
      await toggleResolveCommentAction(commentId, !currentResolved, `/evaluasi/${unitId}`)
      toast.success(!currentResolved ? 'Thread ditandai Selesai!' : 'Thread dibuka kembali.')
    } catch {
      toast.error('Gagal mengubah status.')
    }
  }

  return (
    <>
      {/* CASE 1: No comments yet and closed -> Noticeable yet clean, solid trigger */}
      {!hasComments && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full text-left px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl border border-line bg-surface hover:bg-surface-subtle/70 hover:border-brand/40 shadow-2xs hover:shadow-subtle transition-all flex items-center justify-between gap-3 group cursor-pointer">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-brand/10 dark:bg-brand/15 text-brand flex items-center justify-center shrink-0 border border-brand/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-3.5 h-3.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <span className="text-xs sm:text-sm font-semibold text-ink group-hover:text-brand transition-colors truncate block">
                Diskusi &amp; Catatan Klarifikasi Soal
              </span>
              <span className="text-[11px] text-ink-muted hidden sm:block">
                Ruang komunikasi tanya-jawab dan catatan telaah antara Tim Evaluator dan OPD
              </span>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-light dark:bg-brand/15 text-brand text-xs font-semibold border border-brand/20 group-hover:bg-brand group-hover:text-white transition-all shrink-0">
            <Plus className="w-3.5 h-3.5" />
            <span>Tulis Catatan</span>
          </span>
        </button>
      )}

      {/* CASE 2: Has comments OR User clicked CTA -> Compact modern thread */}
      {(hasComments || isOpen) && (
        <div className="rounded-2xl border border-line bg-surface shadow-2xs p-4 sm:p-5 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-line gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-brand/10 dark:bg-brand/15 text-brand flex items-center justify-center shrink-0 border border-brand/20">
                <MessageSquare className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-xs sm:text-sm text-ink truncate">
                Diskusi &amp; Catatan Klarifikasi
              </span>
              {hasComments && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-brand/10 text-brand border border-brand/20">
                  {comments.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-medium text-ink-muted bg-surface-subtle px-2.5 py-0.5 rounded-full border border-line">
                Evaluator &amp; OPD
              </span>
              {!hasComments && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                  title="Tutup">
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Input Komentar (Modern Bubble Composer Style) */}
          <div className="rounded-xl border border-stroke/70 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 bg-surface-elevated transition-all p-3 space-y-2.5 shadow-2xs">
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.keyCode === 13) && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleAddComment(e)
                }
              }}
              placeholder="Tulis catatan diskusi, tanggapan, atau klarifikasi bukti dukung..."
              className="w-full text-xs text-ink placeholder:text-ink-muted/70 focus:outline-none bg-transparent resize-none leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1 border-t border-stroke/30">
              <span className="hidden sm:inline text-[10px] text-ink-muted">
                Tekan <kbd className="px-1.5 py-0.5 rounded bg-surface border border-stroke font-mono text-[9px] text-ink">Ctrl+Enter</kbd> untuk kirim
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                {!hasComments && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer">
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddComment()}
                  disabled={loading || !message.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Comment Threads (Chat Bubble Stream) */}
          {hasComments && (
            <div className="space-y-4 max-h-[460px] overflow-y-auto pr-1 pt-1 divide-y divide-stroke/30">
              {comments.map((c) => {
                const authorConfig = getAuthorConfig(c.author?.role)

                return (
                  <div
                    key={c.id}
                    className={`pt-4 first:pt-0 space-y-2 transition-all ${
                      c.isResolved ? 'opacity-85' : ''
                    }`}>
                    <div className="flex items-start gap-2.5">
                      {/* Author Avatar Icon */}
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${authorConfig.avatarBg}`}
                        title={authorConfig.label}>
                        {authorConfig.isEvaluator ? (
                          <ShieldCheck className="w-3.5 h-3.5" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5" />
                        )}
                      </div>

                      {/* Content Container */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {/* Header: Name, Badge, Date, Resolve Action */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-xs text-ink truncate max-w-[200px] sm:max-w-none">
                              {c.author?.fullName || 'Pengguna'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${authorConfig.badgeClass}`}>
                              {authorConfig.label}
                            </span>
                            <span className="text-[10px] text-ink-muted">
                              • {formatCommentDate(c.createdAt)}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleResolve(c.id, c.isResolved)}
                            title={c.isResolved ? 'Thread ditandai selesai' : 'Tandai selesai'}
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer shrink-0 ${
                              c.isResolved
                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                : 'bg-surface-elevated text-ink-muted border-stroke hover:text-ink hover:border-ink-muted shadow-2xs'
                            }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            <span>{c.isResolved ? 'Selesai' : 'Tandai Selesai'}</span>
                          </button>
                        </div>

                        {/* Speech Bubble Container */}
                        <div
                          className={`rounded-2xl rounded-tl-xs px-4 py-2.5 border text-xs sm:text-sm leading-relaxed transition-all ${authorConfig.bubbleClass}`}>
                          <p className="whitespace-pre-wrap break-words">{c.message}</p>
                        </div>

                        {/* Action Footer: Reply Trigger */}
                        <div className="flex items-center gap-2 pt-0.5 pl-1">
                          <button
                            type="button"
                            onClick={() => setReplyParentId(replyParentId === c.id ? null : c.id)}
                            className="inline-flex items-center gap-1.5 text-[11px] text-ink-muted hover:text-brand font-medium cursor-pointer transition-colors py-0.5">
                            <Reply className="w-3 h-3" />
                            <span>Balas</span>
                            {c.replies && c.replies.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-brand/10 text-brand font-semibold">
                                {c.replies.length}
                              </span>
                            )}
                          </button>
                        </div>

                        {/* Inline Reply Composer */}
                        {replyParentId === c.id && (
                          <div className="mt-2.5 pl-3 border-l-2 border-brand/40 space-y-2 animate-in fade-in duration-150">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0 text-[10px] font-bold mt-1">
                                <Reply className="w-3 h-3" />
                              </div>
                              <div className="flex-1 space-y-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={replyMessage}
                                  onChange={(e) => setReplyMessage(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault()
                                      handleReply(c.id)
                                    }
                                  }}
                                  placeholder={`Balas catatan ${c.author?.fullName || ''}...`}
                                  className="w-full px-3 py-2 text-xs rounded-xl border border-stroke bg-surface-elevated focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand text-ink placeholder:text-ink-muted/70 shadow-2xs"
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setReplyParentId(null)
                                      setReplyMessage('')
                                    }}
                                    className="px-2.5 py-1 text-xs text-ink-muted hover:text-ink rounded-lg transition-colors cursor-pointer">
                                    Batal
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleReply(c.id)}
                                    disabled={loading || !replyMessage.trim()}
                                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all disabled:opacity-40 cursor-pointer shadow-xs">
                                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                                    <span>Kirim</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Nested Replies Stream (Bubble Replies) */}
                        {c.replies && c.replies.length > 0 && (
                          <div className="mt-2 pl-3 sm:pl-4 border-l-2 border-line/70 dark:border-line/40 space-y-2.5">
                            {c.replies.map((reply) => {
                              const replyConfig = getAuthorConfig(reply.author?.role)

                              return (
                                <div key={reply.id} className="flex items-start gap-2 pt-1">
                                  {/* Mini Avatar */}
                                  <div
                                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${replyConfig.avatarBg}`}
                                    title={replyConfig.label}>
                                    {replyConfig.isEvaluator ? (
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                    ) : (
                                      <Building2 className="w-2.5 h-2.5" />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0 space-y-1">
                                    {/* Reply Header */}
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-semibold text-ink text-[11px] truncate">
                                        {reply.author?.fullName || 'Pengguna'}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded-full text-[9px] font-medium border ${replyConfig.badgeClass}`}>
                                        {replyConfig.label}
                                      </span>
                                      {reply.createdAt && (
                                        <span className="text-[10px] text-ink-muted">
                                          • {formatCommentDate(reply.createdAt)}
                                        </span>
                                      )}
                                    </div>

                                    {/* Reply Speech Bubble */}
                                    <div
                                      className={`rounded-xl rounded-tl-xs px-3.5 py-2 border text-xs leading-relaxed ${replyConfig.replyBubbleClass}`}>
                                      <p className="whitespace-pre-wrap break-words">{reply.message}</p>
                                    </div>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </>
  )
}
