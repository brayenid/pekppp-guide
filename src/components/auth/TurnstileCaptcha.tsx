'use client'

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        params: {
          sitekey: string
          callback?: (token: string) => void
          'error-callback'?: (error: any) => void
          'expired-callback'?: () => void
          theme?: 'light' | 'dark' | 'auto'
          size?: 'normal' | 'compact' | 'flexible'
          action?: string
          cData?: string
        }
      ) => string
      reset: (widgetId?: string) => void
      remove: (widgetId: string) => void
    }
    onloadTurnstileCallback?: () => void
  }
}

export interface TurnstileRef {
  reset: () => void
}

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void
  onExpire?: () => void
  onError?: () => void
  theme?: 'light' | 'dark' | 'auto'
  className?: string
}

export const TurnstileCaptcha = forwardRef<TurnstileRef, TurnstileCaptchaProps>(
  function TurnstileCaptcha(
    { onVerify, onExpire, onError, theme: propTheme, className = '' },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const widgetIdRef = useRef<string | null>(null)
    const [scriptLoaded, setScriptLoaded] = useState(false)
    const [activeTheme, setActiveTheme] = useState<'light' | 'dark'>('light')

    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY

    // Deteksi mode terang vs mode gelap secara aktif
    useEffect(() => {
      if (!siteKey || typeof window === 'undefined') return

      if (propTheme === 'light' || propTheme === 'dark') {
        setActiveTheme(propTheme)
        return
      }

      const detectTheme = () => {
        const isDark =
          document.documentElement.classList.contains('dark') ||
          window.matchMedia('(prefers-color-scheme: dark)').matches
        setActiveTheme(isDark ? 'dark' : 'light')
      }

      detectTheme()

      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            detectTheme()
          }
        }
      })

      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class']
      })

      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleMediaChange = () => detectTheme()
      mediaQuery.addEventListener('change', handleMediaChange)

      return () => {
        observer.disconnect()
        mediaQuery.removeEventListener('change', handleMediaChange)
      }
    }, [siteKey, propTheme])

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (typeof window !== 'undefined' && window.turnstile && widgetIdRef.current) {
          try {
            window.turnstile.reset(widgetIdRef.current)
          } catch (e) {
            console.warn('[Turnstile] Gagal mereset widget:', e)
          }
        }
      }
    }))

    // 1. Muat skrip Cloudflare Turnstile jika belum ada di document
    useEffect(() => {
      if (!siteKey || typeof window === 'undefined') return

      if (window.turnstile) {
        setScriptLoaded(true)
        return
      }

      const existingScript = document.querySelector('script[src*="turnstile/v0/api.js"]')
      if (existingScript) {
        const interval = setInterval(() => {
          if (window.turnstile) {
            setScriptLoaded(true)
            clearInterval(interval)
          }
        }, 100)
        return () => clearInterval(interval)
      }

      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.onload = () => {
        setScriptLoaded(true)
      }
      script.onerror = () => {
        console.error('[Turnstile] Gagal memuat script Cloudflare Turnstile API.')
        onError?.()
      }
      document.head.appendChild(script)
    }, [siteKey, onError])

    // 2. Render widget Turnstile ke dalam elemen container rata kiri
    useEffect(() => {
      if (!siteKey || !scriptLoaded || !containerRef.current || typeof window === 'undefined' || !window.turnstile) {
        return
      }

      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current)
          widgetIdRef.current = null
        } catch {
          // ignore
        }
      }

      try {
        const id = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: activeTheme,
          callback: (token: string) => {
            onVerify(token)
          },
          'expired-callback': () => {
            onExpire?.()
          },
          'error-callback': () => {
            onError?.()
          }
        })
        widgetIdRef.current = id
      } catch (err) {
        console.error('[Turnstile] Error saat me-render widget:', err)
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current)
            widgetIdRef.current = null
          } catch {
            // ignore
          }
        }
      }
    }, [siteKey, scriptLoaded, activeTheme, onVerify, onExpire, onError])

    // Jika siteKey tidak diatur di environment, jangan render apa pun
    if (!siteKey) {
      return null
    }

    return (
      <div className={`flex flex-col items-start justify-start min-h-[65px] w-full ${className}`}>
        <div ref={containerRef} className="flex justify-start text-left" />
      </div>
    )
  }
)
