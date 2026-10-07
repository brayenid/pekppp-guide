// src/components/ui/VisualDateRangePicker.tsx
'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  X,
  Check,
  CalendarDays
} from 'lucide-react'

interface VisualDateRangePickerProps {
  startDate: string | null // ISO string or YYYY-MM-DDTHH:mm
  endDate: string | null
  onChange: (range: { startDate: string | null; endDate: string | null }) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  inline?: boolean
}

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember'
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

export function VisualDateRangePicker({
  startDate,
  endDate,
  onChange,
  label,
  placeholder = 'Pilih rentang tanggal pelaksanaan...',
  disabled = false,
  className = '',
  inline = false
}: VisualDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(inline)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverPos, setPopoverPos] = useState<{ top: number; left: number; width: number } | null>(null)

  // Internal selection state (Date objects with time)
  const parsedStart = useMemo(() => (startDate ? new Date(startDate) : null), [startDate])
  const parsedEnd = useMemo(() => (endDate ? new Date(endDate) : null), [endDate])

  const [tempStart, setTempStart] = useState<Date | null>(parsedStart)
  const [tempEnd, setTempEnd] = useState<Date | null>(parsedEnd)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)

  // Default view month (focus on startDate, or today)
  const [viewDate, setViewDate] = useState<Date>(() => parsedStart || new Date())

  // Time inputs (HH:mm)
  const [startTime, setStartTime] = useState<string>(() => {
    if (!parsedStart) return '08:00'
    return `${String(parsedStart.getHours()).padStart(2, '0')}:${String(parsedStart.getMinutes()).padStart(2, '0')}`
  })
  const [endTime, setEndTime] = useState<string>(() => {
    if (!parsedEnd) return '23:59'
    return `${String(parsedEnd.getHours()).padStart(2, '0')}:${String(parsedEnd.getMinutes()).padStart(2, '0')}`
  })

  // Sinkronisasi bila startDate / endDate berubah dari luar
  useEffect(() => {
    setTempStart(parsedStart)
    setTempEnd(parsedEnd)
    if (parsedStart) {
      setViewDate(new Date(parsedStart.getFullYear(), parsedStart.getMonth(), 1))
    }
  }, [parsedStart, parsedEnd])

  // Hitung posisi popover saat dibuka
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const popoverWidth = Math.min(340, window.innerWidth - 32)
      const popoverHeight = 310 // tinggi kalender ringkas tanpa preset
      
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top

      // Jika ruang di bawah kurang dari popoverHeight dan ruang di atas lebih luas, tampilkan ke atas
      let top = rect.bottom + 6
      if (spaceBelow < popoverHeight && spaceAbove > spaceBelow) {
        top = Math.max(12, rect.top - popoverHeight - 6)
      } else if (top + popoverHeight > window.innerHeight - 12) {
        top = Math.max(12, window.innerHeight - popoverHeight - 12)
      }

      // Hindari overflow ke kanan layar
      let left = rect.left
      if (left + popoverWidth > window.innerWidth - 16) {
        left = window.innerWidth - popoverWidth - 16
      }
      left = Math.max(16, left)

      setPopoverPos({
        top,
        left,
        width: popoverWidth
      })
    }
  }, [isOpen])

  // Sync with prop changes when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempStart(parsedStart)
      setTempEnd(parsedEnd)
      if (parsedStart) {
        setViewDate(new Date(parsedStart.getFullYear(), parsedStart.getMonth(), 1))
      }
    }
  }, [isOpen, parsedStart, parsedEnd])

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popoverRef.current &&
        !popoverRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isOpen])

  // Month navigation
  const prevMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }
  const nextMonth = () => {
    setViewDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  // Calendar Day Calculation for current month
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear()
    const month = viewDate.getMonth()

    const firstDayIndex = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const days: Array<{
      date: Date
      isCurrentMonth: boolean
      isToday: boolean
    }> = []

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime()
      })
    }

    // Days in current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i)
      days.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.getTime() === today.getTime()
      })
    }

    // Trailing days from next month to complete 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({
        date: d,
        isCurrentMonth: false,
        isToday: d.getTime() === today.getTime()
      })
    }

    return days
  }, [viewDate])

  // Normalizer for date comparison (ignore time)
  const isSameDay = (d1: Date | null, d2: Date | null) => {
    if (!d1 || !d2) return false
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  const isBetween = (target: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false
    const t = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime()
    const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
    const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
    return t > s && t < e
  }

  // Click on date cell
  const handleDateClick = (clickedDate: Date) => {
    const target = new Date(clickedDate)

    // Skenario 1: Belum ada start date, atau sudah ada start dan end -> reset pilih start baru
    if (!tempStart || (tempStart && tempEnd)) {
      setTempStart(target)
      setTempEnd(null)
    } else if (tempStart && !tempEnd) {
      // Skenario 2: Sudah ada start, sekarang pilih end
      if (target.getTime() < tempStart.getTime()) {
        // Jika klik tanggal sebelum start, jadikan target sebagai start baru
        setTempStart(target)
      } else {
        setTempEnd(target)
      }
    }
  }

  // Save changes
  const handleApply = () => {
    if (!tempStart) {
      onChange({ startDate: null, endDate: null })
      setIsOpen(false)
      return
    }

    const finalStart = new Date(tempStart)
    const [sH, sM] = startTime.split(':').map(Number)
    finalStart.setHours(sH || 8, sM || 0, 0, 0)

    let finalEnd: Date | null = null
    if (tempEnd) {
      finalEnd = new Date(tempEnd)
      const [eH, eM] = endTime.split(':').map(Number)
      finalEnd.setHours(eH || 23, eM || 59, 59, 999)
    } else {
      // Jika hanya pilih 1 tanggal, buat jadi sampai akhir hari itu
      finalEnd = new Date(tempStart)
      finalEnd.setHours(23, 59, 59, 999)
    }

    onChange({
      startDate: finalStart.toISOString(),
      endDate: finalEnd.toISOString()
    })
    setIsOpen(false)
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    setTempStart(null)
    setTempEnd(null)
    onChange({ startDate: null, endDate: null })
  }

  // Formatting display text for trigger button
  const formattedTriggerText = useMemo(() => {
    if (!parsedStart && !parsedEnd) return null

    const formatDateShort = (d: Date) => {
      const day = d.getDate()
      const m = MONTH_NAMES[d.getMonth()].slice(0, 3)
      const y = d.getFullYear()
      return `${day} ${m} ${y}`
    }

    if (parsedStart && !parsedEnd) {
      return `Mulai ${formatDateShort(parsedStart)}`
    }

    if (parsedStart && parsedEnd) {
      const diffMs = parsedEnd.getTime() - parsedStart.getTime()
      const daysCount = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)))
      return `${formatDateShort(parsedStart)} – ${formatDateShort(parsedEnd)} (${daysCount} hari)`
    }

    return null
  }, [parsedStart, parsedEnd])

  // Helper untuk update parent langsung di mode inline
  const triggerInlineChange = (newStart: Date | null, newEnd: Date | null, sTime: string, eTime: string) => {
    if (!newStart) {
      onChange({ startDate: null, endDate: null })
      return
    }
    const finalStart = new Date(newStart)
    const [sH, sM] = sTime.split(':').map(Number)
    finalStart.setHours(sH || 8, sM || 0, 0, 0)

    let finalEnd: Date | null = null
    if (newEnd) {
      finalEnd = new Date(newEnd)
      const [eH, eM] = eTime.split(':').map(Number)
      finalEnd.setHours(eH || 23, eM || 59, 59, 999)
    } else {
      finalEnd = new Date(newStart)
      finalEnd.setHours(23, 59, 59, 999)
    }

    onChange({
      startDate: finalStart.toISOString(),
      endDate: finalEnd.toISOString()
    })
  }

  // Handle click date di inline mode
  const handleInlineDateClick = (clickedDate: Date) => {
    const target = new Date(clickedDate)
    let newStart = tempStart
    let newEnd = tempEnd

    if (!tempStart || (tempStart && tempEnd)) {
      newStart = target
      newEnd = null
      setTempStart(target)
      setTempEnd(null)
    } else if (tempStart && !tempEnd) {
      if (target.getTime() < tempStart.getTime()) {
        newStart = target
        newEnd = null
        setTempStart(target)
      } else {
        newEnd = target
        setTempEnd(target)
      }
    }

    triggerInlineChange(newStart, newEnd, startTime, endTime)
  }

  // Konten visual Kalender
  const calendarContent = (
    <div className="space-y-2.5">
      {/* Month Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1 rounded-lg border border-stroke/60 hover:bg-surface-subtle text-ink-secondary transition-colors cursor-pointer">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <div className="text-xs font-bold text-ink">
          {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
        </div>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1 rounded-lg border border-stroke/60 hover:bg-surface-subtle text-ink-secondary transition-colors cursor-pointer">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {DAY_NAMES.map((d, i) => (
          <span
            key={d}
            className={`text-[10px] font-semibold ${i === 0 ? 'text-rose-500' : 'text-ink-muted'}`}>
            {d}
          </span>
        ))}
      </div>

      {/* Calendar Day Grid */}
      <div className="grid grid-cols-7 gap-y-0.5 gap-x-0.5">
        {calendarDays.map(({ date, isCurrentMonth, isToday }, idx) => {
          const isStart = isSameDay(date, tempStart)
          const isEnd = isSameDay(date, tempEnd)
          const inRange = isBetween(date, tempStart, tempEnd)
          const inHoverRange =
            tempStart &&
            !tempEnd &&
            hoverDate &&
            hoverDate > tempStart &&
            isBetween(date, tempStart, hoverDate)

          return (
            <div
              key={idx}
              className={`relative p-0 ${
                inRange || inHoverRange ? 'bg-brand-light/60 first:rounded-l-md last:rounded-r-md' : ''
              }`}>
              <button
                type="button"
                onClick={() => (inline ? handleInlineDateClick(date) : handleDateClick(date))}
                onMouseEnter={() => setHoverDate(date)}
                onMouseLeave={() => setHoverDate(null)}
                className={`w-full h-7 rounded-md text-xs font-medium flex items-center justify-center transition-all cursor-pointer ${
                  isStart || isEnd
                    ? 'bg-brand text-white shadow-hz-button font-bold z-10'
                    : inRange || inHoverRange
                      ? 'text-brand font-semibold hover:bg-brand/20'
                      : isCurrentMonth
                        ? 'text-ink hover:bg-surface-subtle'
                        : 'text-ink-faint hover:bg-surface-subtle/50'
                } ${isToday && !isStart && !isEnd ? 'border border-brand/50 font-bold' : ''}`}>
                {date.getDate()}
              </button>
            </div>
          )
        })}
      </div>

      {/* Time Limit Inputs - Ditata Rapi & Kompak */}
      <div className="bg-surface-subtle/60 rounded-xl p-2.5 border border-stroke/60 space-y-1.5">
        <div className="flex items-center gap-1 text-ink-muted text-[11px] font-semibold">
          <Clock className="w-3 h-3 text-brand" />
          <span>Batas Waktu Harian:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-0.5">
            <span className="text-[10px] text-ink-muted block">Mulai</span>
            <input
              type="time"
              value={startTime}
              onChange={(e) => {
                const val = e.target.value
                setStartTime(val)
                if (inline) triggerInlineChange(tempStart, tempEnd, val, endTime)
              }}
              className="w-full px-2 py-1 rounded-lg border border-stroke/70 bg-surface text-ink text-xs font-medium focus:outline-none focus:border-brand"
            />
          </div>
          <div className="space-y-0.5">
            <span className="text-[10px] text-ink-muted block">Selesai</span>
            <input
              type="time"
              value={endTime}
              onChange={(e) => {
                const val = e.target.value
                setEndTime(val)
                if (inline) triggerInlineChange(tempStart, tempEnd, startTime, val)
              }}
              className="w-full px-2 py-1 rounded-lg border border-stroke/70 bg-surface text-ink text-xs font-medium focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Status banner on inline mode */}
      {inline && (
        <div className="flex items-center justify-between text-[11px] px-1 pt-0.5 text-ink-muted">
          <span className="font-semibold text-brand text-xs truncate">
            {formattedTriggerText || 'Pilih tanggal di kalender'}
          </span>
          {formattedTriggerText && (
            <button
              type="button"
              onClick={handleClear}
              className="text-rose-600 hover:text-rose-700 font-medium hover:underline shrink-0 cursor-pointer ml-2">
              Reset
            </button>
          )}
        </div>
      )}
    </div>
  )

  // JIKA MODE INLINE: render langsung di dalam DOM tanpa popover floating
  if (inline) {
    return (
      <div className={`w-full rounded-2xl border border-stroke/70 bg-surface p-3.5 shadow-2xs ${className}`}>
        {label && (
          <label className="block text-xs font-semibold text-ink-secondary mb-2.5 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-brand" />
            <span>{label}</span>
          </label>
        )}
        {calendarContent}
      </div>
    )
  }

  // JIKA MODE POPOVER:
  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-ink-secondary mb-1.5">{label}</label>
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl border text-xs text-left transition-all cursor-pointer ${
          isOpen
            ? 'border-brand ring-2 ring-brand/15 bg-surface text-ink shadow-xs'
            : 'border-stroke/70 hover:border-stroke bg-surface-subtle/50 hover:bg-surface text-ink shadow-2xs'
        } disabled:opacity-50 disabled:cursor-not-allowed`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0">
            <CalendarDays className="w-4 h-4" />
          </div>
          <span className={`truncate font-medium ${formattedTriggerText ? 'text-ink' : 'text-ink-muted'}`}>
            {formattedTriggerText || placeholder}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {formattedTriggerText && !disabled && (
            <span
              onClick={handleClear}
              title="Hapus tanggal"
              className="p-1 rounded-md text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors">
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <CalendarIcon className="w-3.5 h-3.5 text-ink-muted" />
        </div>
      </button>

      {/* Popover Calendar Modal via Portal */}
      {isOpen && popoverPos && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: `${popoverPos.top}px`,
            left: `${popoverPos.left}px`,
            width: `${popoverPos.width}px`,
            zIndex: 99999
          }}
          className="bg-surface rounded-2xl border border-stroke shadow-2xl p-3 space-y-2.5 animate-in fade-in zoom-in-95 duration-150">
          {calendarContent}

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between gap-2 pt-1 border-t border-stroke/50">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-stroke/60 text-ink-muted hover:text-ink text-xs font-medium transition-colors cursor-pointer">
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button cursor-pointer">
              <Check className="w-3.5 h-3.5" />
              <span>Terapkan Rentang</span>
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
