import type { IconType } from 'react-icons'

interface AppIconProps {
  icon: IconType
  color: string
  size: number
  radius?: number
  /** Shows the small red "this app negotiates" badge. */
  distracting?: boolean
}

/**
 * Brand tile for an app: a colored square with a real vector icon
 * (react-icons/si) instead of the source mockup's raster CDN images — no
 * network round-trip, crisp at every size.
 */
export function AppIcon({ icon: Icon, color, size, radius, distracting }: AppIconProps) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <div
        className="flex h-full w-full items-center justify-center border border-white/10 shadow-[0_5px_14px_rgba(0,0,0,0.45)]"
        style={{ background: color, borderRadius: radius ?? Math.round(size * 0.3) }}
      >
        <Icon size={Math.round(size * 0.52)} color="#fff" />
      </div>
      {distracting && (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-bg bg-red text-[9px] font-extrabold text-white"
        >
          !
        </span>
      )}
    </div>
  )
}
