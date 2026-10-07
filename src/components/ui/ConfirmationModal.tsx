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
      className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in-content"
      onClick={() => { if (!loading) onCancel() }}>
      <div
        className="w-full max-w-sm bg-card rounded-2xl border border-line p-6 shadow-subtle space-y-4"
        onClick={(e) => e.stopPropagation()}>
        <div>
          <h3 className="text-base font-bold text-ink tracking-tight">{title}</h3>
          <p className="text-xs text-ink-muted mt-1.5 leading-relaxed">{description}</p>
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
            variant={variant === 'danger' ? 'danger' : 'primary'}
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
