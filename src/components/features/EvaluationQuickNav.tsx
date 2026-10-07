'use client'

import { useEffect, useState, useRef } from 'react'

export interface QuickNavItem {
  indicatorNumber: number
  code: string
}

export function EvaluationQuickNav({ items }: { items: QuickNavItem[] }) {
  const [activeNumber, setActiveNumber] = useState<number>(1)
  const [dirtyNumbers, setDirtyNumbers] = useState<Set<number>>(new Set())
  const railRef = useRef<HTMLDivElement>(null)

  const checkDirtyStatus = () => {
    const dirtySet = new Set<number>()
    const dirtyElements = document.querySelectorAll('[data-indicator-dirty="true"]')
    dirtyElements.forEach((el) => {
      const parentNum = el.closest('[data-indicator-number]')?.getAttribute('data-indicator-number')
      const num = parentNum || el.getAttribute('data-indicator-number')
      if (num) dirtySet.add(Number(num))
    })
    setDirtyNumbers(dirtySet)
  }

  useEffect(() => {
    checkDirtyStatus()
    window.addEventListener('input', checkDirtyStatus)
    window.addEventListener('change', checkDirtyStatus)
    window.addEventListener('submit', checkDirtyStatus)
    const interval = setInterval(checkDirtyStatus, 1000)
    return () => {
      window.removeEventListener('input', checkDirtyStatus)
      window.removeEventListener('change', checkDirtyStatus)
      window.removeEventListener('submit', checkDirtyStatus)
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const num = Number(entry.target.getAttribute('data-indicator-number'))
            if (num) setActiveNumber(num)
          }
        })
      },
      {
        rootMargin: '-30% 0px -50% 0px',
        threshold: 0.1
      }
    )

    items.forEach((item) => {
      const el = document.getElementById(`indicator-${item.indicatorNumber}`)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [items])

  // Auto-scroll the rail container to keep active number button visible
  useEffect(() => {
    if (!railRef.current) return
    const activeBtn = railRef.current.querySelector<HTMLElement>(`[data-nav-num="${activeNumber}"]`)
    if (activeBtn) {
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeNumber])

  const scrollToIndicator = (num: number) => {
    setActiveNumber(num)
    const el = document.getElementById(`indicator-${num}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  return (
    <div className="hidden xl:flex fixed left-3 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2 group">
      {/* CSS Override to hide scrollbar in Chrome/Safari/Webkit */}
      <style dangerouslySetInnerHTML={{ __html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
      `}} />

      {/* Vertical Sleek Rail */}
      <div
        ref={railRef}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        className="bg-white/95 backdrop-blur-md border border-slate-200 p-1.5 rounded-full shadow-lg flex flex-col gap-1 max-h-[74vh] overflow-y-auto hide-scrollbar">
        {items.map((item) => {
          const isActive = item.indicatorNumber === activeNumber
          const isItemDirty = dirtyNumbers.has(item.indicatorNumber)

          return (
            <div key={item.indicatorNumber} className="relative">
              <button
                type="button"
                data-nav-num={item.indicatorNumber}
                onClick={() => scrollToIndicator(item.indicatorNumber)}
                title={`Pertanyaan #${item.indicatorNumber} (${item.code})${isItemDirty ? ' - Belum Disimpan' : ''}`}
                className={`w-7 h-7 rounded-full text-[10px] font-mono font-bold transition-all flex items-center justify-center shrink-0 border-2 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md z-10'
                    : isItemDirty
                    ? 'bg-rose-50 border-rose-500 text-rose-700'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100 hover:border-slate-300 hover:text-slate-900'
                }`}>
                {item.indicatorNumber}
              </button>

              {/* Unsaved Dot Badge */}
              {isItemDirty && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-rose-600 ring-2 ring-white" />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
