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

export function getGradeBadgeColor(persen: number): string {
  if (persen >= 90) return 'bg-emerald-500 text-white border-emerald-600'
  if (persen >= 81) return 'bg-teal-500 text-white border-teal-600'
  if (persen >= 71) return 'bg-blue-500 text-white border-blue-600'
  if (persen >= 61) return 'bg-amber-500 text-white border-amber-600'
  if (persen >= 51) return 'bg-orange-500 text-white border-orange-600'
  return 'bg-rose-500 text-white border-rose-600'
}
