'use client'

import { useState } from 'react'
import { addCommentAction, toggleResolveCommentAction } from '../../actions/comment-actions'
import { MessageSquare, Send, CheckCircle2, Reply, CornerDownRight, User, Loader2, ChevronUp } from 'lucide-react'
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
  // If there are already comments, show them directly without needing a button!
  const [isOpen, setIsOpen] = useState(hasComments)
  const [message, setMessage] = useState('')
  const [replyParentId, setReplyParentId] = useState<string | null>(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

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
      toast.success(!currentResolved ? 'Thread ditandai Selesai (Resolved)!' : 'Thread dibuka kembali.')
    } catch {
      toast.error('Gagal mengubah status resolve.')
    }
  }

  return (
    <div>
      {!hasComments && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full text-left p-3.5 sm:p-4 rounded-xl border border-stroke bg-surface hover:border-brand/40 hover:bg-surface-subtle/40 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0 group-hover:bg-brand group-hover:text-white transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-ink group-hover:text-brand transition-colors">
                  Diskusi &amp; Catatan Klarifikasi Soal
                </span>
                <span className="text-[10px] font-medium text-brand bg-brand-light px-2 py-0.5 rounded border border-brand/20">
                  Komentar
                </span>
              </div>
              <p className="text-[11px] text-ink-muted">
                Punya pertanyaan atau butuh klarifikasi bukti dukung indikator ini dengan Evaluator/OPD?
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-subtle group-hover:bg-brand group-hover:text-white text-ink transition-colors shrink-0 border border-stroke/50">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tulis Komentar</span>
          </span>
        </button>
      )}

      {/* CASE 2: Has comments OR User clicked CTA -> Show full discussion directly */}
      {(hasComments || isOpen) && (
        <div className="rounded-xl border border-stroke bg-surface-subtle/30 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-stroke/60">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand" />
              <span className="font-semibold text-xs text-ink">
                Diskusi &amp; Catatan Klarifikasi Soal
              </span>
              {hasComments && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-light text-brand border border-brand/20">
                  {comments.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold text-ink-muted bg-surface-elevated px-2.5 py-0.5 rounded-full border border-stroke">
                Evaluator &amp; OPD
              </span>
              {!hasComments && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer transition-colors"
                  title="Tutup">
                  <ChevronUp className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Form Input Komentar */}
          <div className="space-y-2">
            <textarea
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleAddComment(e as unknown as React.FormEvent)
                }
              }}
              placeholder="Tulis catatan atau klarifikasi bukti dukung..."
              className="w-full p-3 text-xs rounded-xl border border-stroke bg-surface-elevated text-ink placeholder:text-ink-muted/80 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand resize-none leading-relaxed transition-all shadow-2xs"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-ink-muted">
                Tekan <kbd className="px-1.5 py-0.5 rounded bg-surface border border-stroke font-mono text-[10px] text-ink font-semibold">Ctrl+Enter</kbd> untuk kirim
              </span>
              <div className="flex items-center gap-2">
                {!hasComments && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 text-xs font-medium text-ink-muted hover:text-ink hover:bg-surface-subtle rounded-lg transition-colors cursor-pointer">
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleAddComment(e as unknown as React.FormEvent)}
                  disabled={loading || !message.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-hz-button">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Kirim</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Comment Threads */}
          {hasComments && (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {comments.map((c) => (
                <div
                  key={c.id}
                  className={`p-4 rounded-xl border text-xs space-y-2.5 ${
                    c.isResolved ? 'bg-pastel-green/15 border-pastel-green-border' : 'bg-surface border border-stroke shadow-2xs'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-brand/10 flex items-center justify-center text-brand font-medium text-xs">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-ink text-xs">{c.author?.fullName || 'Evaluator'}</span>
                      <span className="text-[11px] text-ink-muted">
                        {new Date(c.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}{' '}
                        •{' '}
                        {new Date(c.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleResolve(c.id, c.isResolved)}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer ${
                        c.isResolved
                          ? 'bg-pastel-green text-pastel-green-text border-pastel-green-border'
                          : 'bg-surface-elevated text-ink-secondary border border-stroke hover:bg-surface-subtle hover:text-ink'
                      }`}>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {c.isResolved ? 'Selesai' : 'Tandai Selesai'}
                    </button>
                  </div>

                  <p className="text-ink leading-relaxed text-xs">{c.message}</p>

                  {/* Reply Button */}
                  <div className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => setReplyParentId(replyParentId === c.id ? null : c.id)}
                      className="text-xs text-brand hover:underline font-medium flex items-center gap-1 cursor-pointer">
                      <Reply className="w-3.5 h-3.5" /> Balas
                    </button>
                  </div>

                  {/* Inline Reply Input */}
                  {replyParentId === c.id && (
                    <div className="mt-2 pl-3 border-l-2 border-brand flex gap-2">
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
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stroke bg-surface-elevated focus:outline-none focus:border-brand text-ink placeholder:text-ink-muted shadow-2xs"
                      />
                      <button
                        type="button"
                        onClick={() => handleReply(c.id)}
                        className="px-3.5 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors cursor-pointer shadow-hz-button">
                        Kirim
                      </button>
                    </div>
                  )}

                  {/* Nested Replies */}
                  {c.replies && c.replies.length > 0 && (
                    <div className="pl-3 mt-2 border-l-2 border-brand/50 space-y-2">
                      {c.replies.map((reply) => (
                        <div key={reply.id} className="bg-surface-elevated p-3 rounded-xl border border-stroke">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 font-medium text-ink text-xs">
                              <CornerDownRight className="w-3.5 h-3.5 text-ink-muted" />
                              {reply.author?.fullName || 'OPD'}
                            </div>
                            {reply.createdAt && (
                              <span className="text-[10px] text-ink-muted">
                                {new Date(reply.createdAt).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short'
                                })}{' '}
                                •{' '}
                                {new Date(reply.createdAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            )}
                          </div>
                          <p className="text-ink-secondary text-xs mt-1 leading-relaxed">{reply.message}</p>
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
    </div>
  )
}
