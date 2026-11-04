'use client'

import { useState } from 'react'
import { addCommentAction, toggleResolveCommentAction } from '../../actions/comment-actions'
import { MessageSquare, Send, CheckCircle2, Reply, CornerDownRight, User, Loader2, ChevronUp, Plus } from 'lucide-react'
import { toast } from 'sonner'

export interface CommentItem {
  id: string
  message: string
  isResolved: boolean
  createdAt: Date
  author: {
    fullName: string
    role: string
  }
  replies?: CommentItem[]
}

function formatCommentDate(date: Date | string) {
  const d = new Date(date)
  return `${d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} • ${d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
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
        <div className="rounded-2xl border border-line bg-surface shadow-2xs p-4 sm:p-5 space-y-3.5">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-line gap-2">
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

          {/* Form Input Komentar */}
          <div className="space-y-1.5">
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
              placeholder="Tulis catatan atau klarifikasi bukti dukung..."
              className="w-full p-2.5 text-xs rounded-lg border border-stroke bg-surface-elevated text-ink placeholder:text-ink-muted/70 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none leading-relaxed transition-all shadow-2xs"
            />

            <div className="flex items-center justify-between">
              <span className="hidden sm:inline text-[10px] text-ink-muted">
                Tekan <kbd className="px-1 py-0.2 rounded bg-surface border border-stroke font-mono text-[9px] text-ink">Ctrl+Enter</kbd> untuk kirim
              </span>
              <div className="flex items-center gap-1.5 ml-auto">
                {!hasComments && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-2.5 py-1 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-subtle rounded-md transition-colors cursor-pointer">
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAddComment()}
                  disabled={loading || !message.trim()}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-xs">
                  {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                  <span>Kirim</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Comment Threads */}
          {hasComments && (
            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 divide-y divide-stroke/40 pt-1">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`pt-2.5 first:pt-0 space-y-1.5 ${
                    c.isResolved ? 'opacity-80' : ''
                  }`}>
                  {/* Author Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <div className="w-5 h-5 rounded-full bg-brand/10 dark:bg-brand/20 flex items-center justify-center text-brand shrink-0">
                        <User className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-xs text-ink truncate">
                        {c.author?.fullName || 'Evaluator'}
                      </span>
                      <span className="text-[10px] text-ink-muted shrink-0 hidden xs:inline">
                        • {formatCommentDate(c.createdAt)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleResolve(c.id, c.isResolved)}
                      title={c.isResolved ? 'Thread ditandai selesai' : 'Tandai selesai'}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer shrink-0 ${
                        c.isResolved
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-surface-elevated text-ink-muted border-stroke hover:text-ink hover:border-ink-muted'
                      }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{c.isResolved ? 'Selesai' : 'Tandai Selesai'}</span>
                    </button>
                  </div>

                  {/* Mobile timestamp below header if screen is too narrow */}
                  <div className="xs:hidden pl-6.5 text-[10px] text-ink-muted -mt-0.5">
                    {formatCommentDate(c.createdAt)}
                  </div>

                  {/* Comment Body */}
                  <p className="text-xs text-ink leading-relaxed pl-6.5">
                    {c.message}
                  </p>

                  {/* Reply Button Trigger */}
                  <div className="pl-6.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setReplyParentId(replyParentId === c.id ? null : c.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand font-medium cursor-pointer transition-colors">
                      <Reply className="w-3 h-3" />
                      <span>Balas</span>
                    </button>
                  </div>

                  {/* Inline Reply Input */}
                  {replyParentId === c.id && (
                    <div className="ml-6.5 mt-1.5 pl-2.5 border-l-2 border-brand/40 flex items-center gap-1.5">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleReply(c.id)
                          }
                        }}
                        placeholder="Tulis balasan..."
                        className="flex-1 px-2.5 py-1 text-xs rounded-md border border-stroke bg-surface-elevated focus:outline-none focus:border-brand text-ink placeholder:text-ink-muted/70"
                      />
                      <button
                        type="button"
                        onClick={() => handleReply(c.id)}
                        disabled={loading || !replyMessage.trim()}
                        className="px-2.5 py-1 rounded-md bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors disabled:opacity-40 cursor-pointer shrink-0">
                        Kirim
                      </button>
                    </div>
                  )}

                  {/* Nested Replies Stream */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="ml-6.5 mt-2 pl-2.5 border-l-2 border-brand/25 dark:border-brand/35 space-y-1.5">
                      {c.replies.map((reply) => (
                        <div key={reply.id} className="text-xs space-y-0.5 py-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <CornerDownRight className="w-3 h-3 text-brand/60 shrink-0" />
                            <span className="font-semibold text-ink text-[11px]">
                              {reply.author?.fullName || 'OPD'}
                            </span>
                            {reply.createdAt && (
                              <span className="text-[10px] text-ink-muted">
                                • {formatCommentDate(reply.createdAt)}
                              </span>
                            )}
                          </div>
                          <p className="text-ink-secondary dark:text-ink-muted text-xs pl-4.5 leading-relaxed">
                            {reply.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}
