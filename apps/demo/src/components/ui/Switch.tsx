import { colors } from '@picantully/design-system'

interface SwitchProps {
  on: boolean
  onToggle: () => void
  label: string
}

/** Small on/off toggle — the one primitive missing from the shared design system. */
export function Switch({ on, onToggle, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className="relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red"
      style={{ background: on ? colors.accent : 'rgba(255,255,255,0.14)' }}
    >
      <span
        className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-150"
        style={{ transform: on ? 'translateX(16px)' : 'translateX(0)' }}
      />
    </button>
  )
}
