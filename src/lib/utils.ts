// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatScore(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined) return '0'
  return num.toFixed(decimals)
}

export function formatFileUrl(url: string | null | undefined): string {
  if (!url) return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('/') || trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }
  // Jika tersimpan tanpa protokol (misal pekpppcdn.orgkubar.web.id/...)
  return `https://${trimmed}`
}
