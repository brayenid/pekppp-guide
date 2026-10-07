'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ZoomableImageContainerProps {
  src: string
  alt: string
  className?: string
}

export function ZoomableImageContainer({ src, alt, className = '' }: ZoomableImageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const pinchStartDistRef = useRef<number | null>(null)
  const initialPinchScaleRef = useRef(1)

  // Reset zoom & pan when image src changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [src])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  // Zoom sensitivity: reduced multiplier for smoother control
  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.2, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev / 1.2, 1)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  // Non-passive event listeners to strictly cancel native browser pinch & ctrl+wheel zoom
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Wheel zoom handler:
    // When trackpad pinches, browsers emit WheelEvent with ctrlKey = true.
    // Standard React onWheel cannot preventDefault if passive by default in modern Chrome/Safari.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Trackpad pinch zoom generates e.ctrlKey === true
      // Lower sensitivity for both wheel and pinch:
      const sensitivity = e.ctrlKey ? 0.005 : 0.0015
      const delta = -e.deltaY * sensitivity
      const factor = Math.exp(delta)

      setScale((prev) => {
        const next = Math.min(Math.max(prev * factor, 1), 5)
        if (next === 1) setPosition({ x: 0, y: 0 })
        return next
      })
    }

    // Touch handlers with non-passive touchmove to prevent browser zoom & bounce
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        pinchStartDistRef.current = dist
        initialPinchScaleRef.current = scale
      } else if (e.touches.length === 1 && scale > 1) {
        isDraggingRef.current = true
        dragStartRef.current = {
          x: e.touches[0].clientX - position.x,
          y: e.touches[0].clientY - position.y
        }
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
        // Crucial: prevents mobile/touch browser page zoom
        e.preventDefault()
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        // Dampened ratio to reduce sensitivity
        const rawRatio = dist / pinchStartDistRef.current
        const dampedRatio = 1 + (rawRatio - 1) * 0.75
        const next = Math.min(Math.max(initialPinchScaleRef.current * dampedRatio, 1), 5)
        setScale(next)
        if (next === 1) setPosition({ x: 0, y: 0 })
      } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
        e.preventDefault()
        setPosition({
          x: e.touches[0].clientX - dragStartRef.current.x,
          y: e.touches[0].clientY - dragStartRef.current.y
        })
      }
    }

    const onTouchEnd = () => {
      pinchStartDistRef.current = null
      isDraggingRef.current = false
    }

    // Gesture events (Safari specific)
    const onGestureStart = (e: Event) => {
      e.preventDefault()
    }
    const onGestureChange = (e: Event) => {
      e.preventDefault()
    }

    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('gesturestart', onGestureStart, { passive: false })
    el.addEventListener('gesturechange', onGestureChange, { passive: false })

    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('gesturestart', onGestureStart)
      el.removeEventListener('gesturechange', onGestureChange)
    }
  }, [scale, position])

  // Mouse pan handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || scale <= 1) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  // Double click / tap to toggle zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (scale > 1) {
      handleReset()
    } else {
      setScale(2)
    }
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full overflow-hidden select-none flex items-center justify-center bg-surface-subtle ${
        scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
      } ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Floating Micro Controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-surface-elevated/90 backdrop-blur-sm p-1 rounded-lg border border-stroke/50 shadow-soft-card">
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="p-1 rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Perbesar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-semibold text-ink px-1 min-w-[32px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="p-1 rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Perkecil (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        {scale > 1 && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer transition-colors border-l border-stroke/40 ml-0.5 pl-1.5"
            title="Reset Zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Image with Hardware-accelerated CSS Transform bounded to container */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
          transformOrigin: 'center center'
        }}
        className="max-w-full max-h-full object-contain pointer-events-none rounded shadow-2xs"
      />
    </div>
  )
}
