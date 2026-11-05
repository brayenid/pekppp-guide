import React from 'react'

/**
 * ModernVectorBackground
 * 
 * Architectural technical grid with precision corner crosshairs (+)
 * and subtle ambient luminous glows, optimized for primary brand canvases.
 */
export function ModernVectorBackground({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none select-none ${className}`}
    >
      {/* Ambient Luminous Mesh Accents */}
      <div className="absolute -top-28 -right-24 w-[420px] h-[420px] rounded-full bg-sky-300/20 dark:bg-blue-600/10 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-[360px] h-[360px] rounded-full bg-blue-300/15 dark:bg-indigo-600/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 right-1/4 w-[380px] h-[380px] rounded-full bg-indigo-300/15 dark:bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Modern Technical Crosshair Grid with Gradient Fade to Transparent */}
      <svg
        className="absolute inset-0 w-full h-full opacity-65 dark:opacity-35 [mask-image:linear-gradient(to_bottom,black_0%,black_30%,transparent_95%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_30%,transparent_95%)]"
        xmlns="http://www.w3.org/2000/svg"
        width="100%"
        height="100%"
      >
        <defs>
          {/* Vertical fade to transparent mask */}
          <linearGradient id="grid-fade-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="65%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="90%" stopColor="#ffffff" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <mask id="grid-fade-mask">
            <rect width="100%" height="100%" fill="url(#grid-fade-gradient)" />
          </mask>

          <pattern
            id="hero-architectural-grid"
            width="44"
            height="44"
            patternUnits="userSpaceOnUse"
          >
            {/* Fine grid lines */}
            <path
              d="M 44 0 L 0 0 0 44"
              fill="none"
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth="1"
            />
            {/* Precision corner crosshair (+) */}
            <path
              d="M 0 3.5 L 0 -3.5 M -3.5 0 L 3.5 0"
              fill="none"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-architectural-grid)" mask="url(#grid-fade-mask)" />
      </svg>
    </div>
  )
}
