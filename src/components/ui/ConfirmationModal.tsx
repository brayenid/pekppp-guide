'use client'

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Button } from './Button'

export interface ConfirmationModalProps {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'primary' | 'warning'
  loading?: boolean
  zIndex?: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  variant = 'primary',
  loading = false,
  zIndex = 'z-[300]',
  onConfirm,
  onCancel
}: ConfirmationModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !loading) onCancel() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, loading, onCancel])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in-content`}
      onClick={() => { if (!loading) onCancel() }}>
      <div
        className="w-full max-w-md bg-surface rounded-2xl border border-stroke/80 p-6 shadow-2xl space-y-4 text-ink overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-base font-bold text-ink tracking-tight break-words [word-break:break-word]">{title}</h3>
          <p className="text-xs text-ink-muted leading-relaxed break-words [word-break:break-word]">{description}</p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={loading}
            onClick={onCancel}>
            {cancelText}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'brand'}
            size="sm"
            isLoading={loading}
            onClick={onConfirm}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
