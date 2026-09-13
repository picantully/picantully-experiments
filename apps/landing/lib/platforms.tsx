import { Icon } from '@picantully/design-system/icons'

export type PlatformValue = 'chrome' | 'macos' | 'windows' | 'linux' | 'ios' | 'android'

export interface PlatformConfig {
  value: PlatformValue
  title: string
  sub: string
  icon: (size: number) => React.JSX.Element
}

// Tux/penguin inline SVG — currentColor, size-aware
function LinuxIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Body */}
      <ellipse cx="12" cy="15" rx="5" ry="6" fill="currentColor" opacity="0.9" />
      {/* White belly */}
      <ellipse cx="12" cy="15.5" rx="3" ry="4.2" fill="white" opacity="0.25" />
      {/* Head */}
      <circle cx="12" cy="7.5" r="3.5" fill="currentColor" />
      {/* Eyes */}
      <circle cx="10.5" cy="7" r="0.65" fill="white" />
      <circle cx="13.5" cy="7" r="0.65" fill="white" />
      {/* Beak */}
      <path d="M11 9h2l-1 1.2Z" fill="currentColor" opacity="0.7" />
    </svg>
  )
}

export const PLATFORMS: PlatformConfig[] = [
  {
    value: 'chrome',
    title: 'Chrome',
    sub: 'Extensión',
    icon: (size) => <Icon name="puzzle" size={size} color="var(--pica-ink)" />,
  },
  {
    value: 'macos',
    title: 'macOS',
    sub: 'App desktop',
    icon: (size) => <Icon name="apple" size={size} color="var(--pica-ink)" />,
  },
  {
    value: 'windows',
    title: 'Windows',
    sub: 'App desktop',
    icon: (size) => <Icon name="window" size={size} color="#5bb6ff" />,
  },
  {
    value: 'linux',
    title: 'Linux',
    sub: 'App desktop',
    icon: (size) => <LinuxIcon size={size} />,
  },
  {
    value: 'ios',
    title: 'iOS',
    sub: 'iPhone & iPad',
    icon: (size) => <Icon name="apple" size={size} color="var(--pica-ink)" />,
  },
  {
    value: 'android',
    title: 'Android',
    sub: 'Celular & tablet',
    icon: (size) => <Icon name="phone" size={size} color="var(--pica-green)" />,
  },
]
