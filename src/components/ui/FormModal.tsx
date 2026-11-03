'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface FormModalProps {
  isOpen: boolean
  title: ReactNode
  description?: ReactNode
  icon?: ReactNode
  headerActions?: ReactNode
  subHeader?: ReactNode
  footer?: ReactNode
  children: ReactNode
  onClose: () => void
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl'
  zIndex?: string
  noBodyPadding?: boolean
  bodyClassName?: string
}

export function FormModal({
  isOpen,
  title,
  description,
  icon,
  headerActions,
  subHeader,
  footer,
  children,
  onClose,
  maxWidth = 'lg',
  zIndex = 'z-[200]',
  noBodyPadding = false,
  bodyClassName = ''
}: FormModalProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  const maxWidthClass =
    {
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
      role="dialog"
      aria-modal="true"
      className={`fixed inset-0 ${zIndex} flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in-content`}
      onClick={onClose}>
      <div
        className={`w-full ${maxWidthClass} max-h-[90vh] bg-surface rounded-xl border border-stroke/70 shadow-2xl flex flex-col overflow-hidden text-ink relative`}
        onClick={(e) => e.stopPropagation()}>
        {/* Pinned Header */}
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-stroke/50 bg-surface shrink-0">
          <div className="flex items-start gap-3 min-w-0 pr-2">
            {icon && (
              <div className="p-2 rounded-xl bg-brand/10 text-brand border border-brand/20 shrink-0 mt-0.5 flex items-center justify-center">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-sm sm:text-base font-semibold text-ink tracking-tight break-words [word-break:break-word]">
                {title}
              </div>
              {description && (
                <div className="text-xs text-ink-muted mt-0.5 leading-relaxed break-words [word-break:break-word]">
                  {description}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {headerActions}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup modal"
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Pinned Sub-Header (Tabs / Filter Bar) */}
        {subHeader && <div className="shrink-0">{subHeader}</div>}

        {/* Scrollable Body */}
        <div
          className={`flex-1 overflow-y-auto min-h-0 ${
            noBodyPadding ? '' : 'p-5 sm:p-6'
          } ${bodyClassName}`}>
          {children}
        </div>

        {/* Optional Pinned Footer */}
        {footer && (
          <div className="px-5 sm:px-6 py-3.5 border-t border-stroke/50 bg-surface-subtle/50 flex items-center justify-between gap-3 shrink-0 flex-wrap">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
