'use client'

import React from 'react'

export interface BentoCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'subtle' | 'outline'
  hoverLift?: boolean
}

export function BentoCard({
  children,
  className = '',
  variant = 'default',
  hoverLift = false,
  ...props
}: BentoCardProps) {
  const variantStyles = {
    default: 'bg-surface border border-stroke/50 shadow-soft-card',
    elevated: 'bg-surface-elevated border border-stroke/60 shadow-soft-float',
    subtle: 'bg-surface-subtle border border-stroke/40',
    outline: 'bg-transparent border border-stroke/70',
  }

  return (
    <div
      className={`rounded-bento p-6 sm:p-7 transition-all duration-200 ${variantStyles[variant]} ${
        hoverLift ? 'hover:-translate-y-0.5 hover:shadow-soft-float hover:border-stroke' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function BentoHeader({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex items-center justify-between gap-3 pb-4 mb-4 border-b border-stroke/40 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export function BentoTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-lg font-medium text-ink tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function BentoDescription({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-xs text-ink-muted leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  )
}

export function BentoMetric({
  value,
  prefix = '%',
  label,
  badge,
  className = '',
}: {
  value: string | number
  prefix?: string
  label?: string
  badge?: string
  className?: string
}) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="flex items-baseline gap-1">
        {prefix && (
          <span className="text-xs font-medium text-ink-muted -translate-y-2 select-none">
            {prefix}
          </span>
        )}
        <span className="text-4xl sm:text-5xl font-normal text-ink tracking-tight">
          {value}
        </span>
        {badge && (
          <span className="ml-2 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-light text-brand">
            {badge}
          </span>
        )}
      </div>
      {label && <p className="text-xs text-ink-secondary">{label}</p>}
    </div>
  )
}
