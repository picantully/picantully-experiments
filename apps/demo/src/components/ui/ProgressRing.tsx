import type { ReactNode } from 'react'

interface ProgressRingProps {
  /** 0–100. */
  pct: number
  size?: number
  strokeWidth?: number
  children?: ReactNode
}

/**
 * Circular progress indicator for the focus timer. An SVG stroke is used
 * instead of the source mockup's `conic-gradient` trick — it anti-aliases
 * cleanly at any size and its offset animates smoothly via CSS transitions.
 */
export function ProgressRing({ pct, size = 190, strokeWidth = 10, children }: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const clamped = Math.min(100, Math.max(0, pct))
  const offset = circumference * (1 - clamped / 100)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--pica-card-solid)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--pica-red)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.4s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">{children}</div>
    </div>
  )
}
