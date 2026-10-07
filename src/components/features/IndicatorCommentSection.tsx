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
    <div className="pt-2">
      {!hasComments && !isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="w-full text-left p-3.5 rounded-xl border border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50/30 transition-all flex items-center justify-between gap-3 group cursor-pointer shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1D5BB9] flex items-center justify-center shrink-0 group-hover:bg-[#1D5BB9] group-hover:text-white transition-colors">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-xs text-slate-800 group-hover:text-[#1D5BB9] transition-colors">
                  Diskusi &amp; Catatan Klarifikasi Soal
                </span>
                <span className="text-[10px] font-medium text-[#1D5BB9] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Komentar
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                Punya pertanyaan atau butuh klarifikasi bukti dukung indikator ini dengan Evaluator/OPD?
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 group-hover:bg-[#1D5BB9] group-hover:text-white text-slate-700 transition-colors shrink-0">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Tulis Komentar</span>
          </span>
        </button>
      )}

      {/* CASE 2: Has comments OR User clicked CTA -> Show full discussion directly */}
      {(hasComments || isOpen) && (
        <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-3">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#1D5BB9]" />
              <span className="font-semibold text-xs text-slate-800">
                Diskusi &amp; Catatan Klarifikasi Soal
              </span>
              {hasComments && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-[#1D5BB9]">
                  {comments.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                Evaluator &amp; OPD
              </span>
              {!hasComments && (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-white cursor-pointer transition-colors"
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
              className="w-full p-3 text-xs rounded-lg border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#1D5BB9] focus:ring-1 focus:ring-[#1D5BB9] resize-none leading-relaxed transition-all"
            />

            <div className="flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Tekan <kbd className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono text-[10px] text-slate-600">Ctrl+Enter</kbd> untuk kirim
              </span>
              <div className="flex items-center gap-2">
                {!hasComments && (
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-3 py-1 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer">
                    Batal
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => handleAddComment(e as unknown as React.FormEvent)}
                  disabled={loading || !message.trim()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1D5BB9] hover:bg-[#154694] text-white text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-sm">
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
                    c.isResolved ? 'bg-pastel-emerald/30 border-pastel-emerald-border' : 'bg-surface border-stroke/50 shadow-2xs'
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
                          ? 'bg-pastel-emerald text-pastel-emerald-text border-pastel-emerald-border'
                          : 'bg-surface text-ink-secondary border-stroke/60 hover:bg-surface-subtle hover:text-ink'
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
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface focus:outline-none focus:border-brand text-ink placeholder:text-ink-muted shadow-2xs"
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
                    <div className="pl-3 mt-2 border-l-2 border-stroke/60 space-y-2">
                      {c.replies.map((reply) => (
                        <div key={reply.id} className="bg-surface-subtle/50 p-3 rounded-xl border border-stroke/40">
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
