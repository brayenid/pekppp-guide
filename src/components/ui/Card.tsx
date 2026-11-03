'use client'

import React from 'react'

export type CardVariant = 'default' | 'elevated' | 'subtle' | 'outline' | 'active'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
  hoverable?: boolean
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-surface border border-stroke shadow-soft-card',
  elevated: 'bg-surface-elevated border border-stroke/70 shadow-soft-card',
  subtle: 'bg-surface-subtle border border-stroke/50',
  outline: 'bg-transparent border border-stroke/70',
  active: 'bg-surface border border-brand/50 ring-1 ring-brand/20 shadow-soft-card',
}

const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0 overflow-hidden',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  children,
  className = '',
  variant = 'default',
  padding = 'md',
  hoverable = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-bento transition-all duration-200 ${variantClasses[variant]} ${paddingClasses[padding]} ${
        hoverable ? 'hover:border-stroke hover:shadow-subtle' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode
  subtitle?: React.ReactNode
  icon?: React.ReactNode
  action?: React.ReactNode
  uppercase?: boolean
  bordered?: boolean
  filled?: boolean
}

export function CardHeader({
  children,
  title,
  subtitle,
  icon,
  action,
  uppercase = false,
  bordered = true,
  filled = false,
  className = '',
  ...props
}: CardHeaderProps) {
  const baseClass = filled
    ? `px-5 py-3.5 bg-surface-subtle/60 ${bordered ? 'border-b border-stroke/50' : ''}`
    : `${bordered ? 'pb-3 mb-4 border-b border-stroke/40' : 'mb-3'}`

  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${baseClass} ${className}`}
      {...props}
    >
      {title || icon || subtitle ? (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {icon && <span className="shrink-0 text-ink-muted flex items-center">{icon}</span>}
            {title && (
              <h3
                className={
                  uppercase
                    ? 'text-xs font-semibold text-ink uppercase tracking-wider'
                    : 'text-sm font-bold text-ink tracking-tight'
                }
              >
                {title}
              </h3>
            )}
          </div>
          {subtitle && (
            <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">{subtitle}</p>
          )}
        </div>
      ) : null}

      {children}

      {action && <div className="flex items-center gap-2 shrink-0">{action}</div>}
    </div>
  )
}

export function CardTitle({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`text-sm font-bold text-ink tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardDescription({
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

export function CardContent({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({
  children,
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`pt-4 mt-4 border-t border-stroke/40 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
