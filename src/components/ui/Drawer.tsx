'use client'

import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
  widthClass?: string
}

export function Drawer({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  widthClass = 'max-w-md'
}: DrawerProps) {
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

  return createPortal(
    <div className="fixed inset-0 z-[200] overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink/40 backdrop-blur-xs transition-opacity animate-fade-in-content"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10 pointer-events-none">
        <div
          className={`w-screen ${widthClass} pointer-events-auto bg-surface border-l border-stroke/60 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300`}
          onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="px-6 py-5 border-b border-stroke/40 flex items-start justify-between bg-surface-subtle/50">
            <div className="pr-4">
              <h3 className="text-base font-semibold text-ink tracking-tight">{title}</h3>
              {description && (
                <p className="text-xs text-ink-muted mt-1 leading-relaxed">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 space-y-6">{children}</div>

          {/* Optional Footer */}
          {footer && (
            <div className="px-6 py-4 border-t border-stroke/40 bg-surface-subtle/30">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
