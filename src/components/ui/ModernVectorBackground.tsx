import React from 'react'

/**
 * ModernVectorBackground
 * 
 * An authored, architectural vector background representing cartographic topography
 * (inspired by Kutai Barat's Mahakam basin terrain) and engineering grid precision.
 * 
 * Avoids generic AI slop (no rainbow blobs, no neon gradients, no random blur spheres).
 * Uses crisp 0.75px-1.5px lines with token-aware opacities in both light & dark modes.
 */
export function ModernVectorBackground({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
    >
      {/* ── 1. Architectural Precision Dot Grid ──────────────────────────── */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.4] dark:opacity-[0.25]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern
            id="arch-grid-pattern"
            width="48"
            height="48"
            patternUnits="userSpaceOnUse"
          >
            {/* Fine coordinate crosshair at intersections */}
            <path
              d="M 24 21 L 24 27 M 21 24 L 27 24"
              className="stroke-line dark:stroke-stroke/60"
              strokeWidth="0.75"
              strokeLinecap="round"
            />
            {/* Subtle center dot */}
            <circle
              cx="24"
              cy="24"
              r="0.8"
              className="fill-brand/30 dark:fill-brand/40"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#arch-grid-pattern)" />
      </svg>

      {/* ── 2. Topographic & River Contour Waves (Cartographic Flow) ─────── */}
      <svg
        className="absolute -top-12 -right-16 w-[780px] h-[640px] max-w-[90vw] opacity-75 dark:opacity-40 transition-opacity"
        viewBox="0 0 780 640"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="contour-grad-primary" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.18" />
            <stop offset="50%" stopColor="var(--brand)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="contour-grad-accent" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--stroke)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--stroke)" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {/* Contour Wave 1 */}
        <path
          d="M 120 40 C 260 90 320 20 480 80 C 620 130 680 90 760 140"
          stroke="url(#contour-grad-primary)"
          strokeWidth="1.25"
          strokeDasharray="4 4"
        />

        {/* Contour Wave 2 - Main River Flow */}
        <path
          d="M 60 110 C 220 170 290 80 460 160 C 610 230 690 180 770 240"
          stroke="url(#contour-grad-primary)"
          strokeWidth="1.5"
        />

        {/* Contour Wave 3 */}
        <path
          d="M 20 190 C 180 260 250 160 430 240 C 580 310 660 260 780 320"
          stroke="url(#contour-grad-accent)"
          strokeWidth="1"
        />

        {/* Contour Wave 4 - Elevation Curve */}
        <path
          d="M 0 280 C 150 350 230 240 400 330 C 560 410 640 350 780 420"
          stroke="url(#contour-grad-primary)"
          strokeWidth="1.25"
        />

        {/* Contour Wave 5 */}
        <path
          d="M 0 380 C 130 450 200 340 380 430 C 530 500 620 450 780 520"
          stroke="url(#contour-grad-accent)"
          strokeWidth="0.85"
          strokeDasharray="3 3"
        />

        {/* Elevation Index Markers */}
        <g className="fill-ink-muted/50 text-[9px] font-mono select-none" style={{ letterSpacing: '0.05em' }}>
          <text x="490" y="88">EL. 120m</text>
          <text x="470" y="168">EL. 100m</text>
          <text x="440" y="248">EL. 80m</text>
          <text x="410" y="338">EL. 60m</text>
        </g>

        {/* Precision Target Crosshair */}
        <circle cx="480" cy="80" r="3" className="stroke-brand/40" strokeWidth="1" fill="none" />
        <circle cx="480" cy="80" r="1" className="fill-brand/60" />
      </svg>

      {/* ── 3. Subtle Bottom-Left Framing Lines ─────────────────────────── */}
      <svg
        className="absolute -bottom-8 -left-8 w-[380px] h-[320px] opacity-40 dark:opacity-20"
        viewBox="0 0 380 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M 20 300 L 120 300 L 220 200 L 360 200"
          className="stroke-line dark:stroke-stroke/60"
          strokeWidth="1"
        />
        <path
          d="M 60 320 L 140 240 L 280 240"
          className="stroke-brand/20 dark:stroke-brand/30"
          strokeWidth="1"
          strokeDasharray="2 4"
        />
        <circle cx="220" cy="200" r="2.5" className="fill-brand/40" />
      </svg>

      {/* ── 4. Soft Edge Vignette (Keeps content region 100% legible) ──── */}
      <div
        className="absolute inset-0 bg-radial from-transparent via-canvas/40 to-canvas"
        style={{
          background: 'radial-gradient(circle at 50% 30%, transparent 45%, var(--canvas) 90%)'
        }}
      />
    </div>
  )
}
