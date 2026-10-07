'use client'

import React from 'react'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'success' | 'info' | 'warning' | 'danger' | 'neutral' | 'default'
  size?: 'sm' | 'md'
  dot?: boolean
  pulseDot?: boolean
}

export function Badge({
  children,
  className = '',
  variant = 'neutral',
  size = 'md',
  dot = false,
  pulseDot = false,
  ...props
}: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 gap-1 font-semibold',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
  }

  const variantStyles = {
    success: 'bg-pastel-green text-pastel-green-text border border-pastel-green-border',
    info: 'bg-pastel-blue text-pastel-blue-text border border-pastel-blue-border',
    warning: 'bg-pastel-amber text-pastel-amber-text border border-pastel-amber-border',
    danger: 'bg-pastel-rose text-pastel-rose-text border border-pastel-rose-border',
    neutral: 'bg-surface-muted text-ink-secondary border border-line',
    default: 'bg-ink text-white border border-ink',
  }

  const dotColors = {
    success: 'bg-emerald-600',
    info: 'bg-sky-600',
    warning: 'bg-amber-600',
    danger: 'bg-rose-600',
    neutral: 'bg-zinc-500',
    default: 'bg-white',
  }

  return (
    <span
      className={`inline-flex items-center rounded-full tracking-tight select-none transition-colors ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]} ${
            pulseDot ? 'animate-pulse' : ''
          }`}
        />
      )}
      {children}
    </span>
  )
}
