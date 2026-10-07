'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface FormModalProps {
  isOpen: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
}

export function FormModal({
  isOpen,
  title,
  description,
  children,
  onClose,
  maxWidth = 'lg'
}: FormModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const maxWidthClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl'
  }[maxWidth] || 'max-w-lg'

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in-content"
      onClick={onClose}>
      <div
        className={`w-full ${maxWidthClass} bg-surface rounded-bento border border-stroke/50 p-6 shadow-soft-float space-y-4 relative`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between pb-3 border-b border-stroke/40">
          <div>
            <h3 className="text-base font-semibold text-ink tracking-tight">{title}</h3>
            {description && <p className="text-xs text-ink-muted mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>,
    document.body
  )
}
