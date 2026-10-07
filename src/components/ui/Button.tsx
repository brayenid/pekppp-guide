'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'brand'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className = '',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles: pill radius, micro-scale on active, smooth transition
    const baseStyles =
      'inline-flex items-center justify-center font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer select-none'

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-full gap-1.5',
      md: 'px-5 py-2.5 text-xs font-medium rounded-full gap-2',
      lg: 'px-6 py-3 text-sm font-medium rounded-full gap-2.5',
    }

    const variantStyles = {
      brand:
        'bg-brand text-white hover:bg-brand-hover border border-transparent shadow-hz-button',
      primary:
        'bg-ink text-white hover:bg-ink-secondary border border-transparent shadow-2xs',
      secondary:
        'bg-surface-elevated text-ink hover:bg-surface-subtle border border-stroke/60 shadow-2xs',
      outline:
        'bg-transparent text-ink hover:bg-surface-subtle border border-stroke/70',
      ghost:
        'bg-transparent text-ink-secondary hover:text-ink hover:bg-surface-subtle border border-transparent',
      danger:
        'bg-pastel-rose text-pastel-rose-text hover:bg-[#fad7d9] border border-pastel-rose-border',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          leftIcon
        )}
        {children && <span>{children}</span>}
        {!isLoading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'
