import type { ReactNode } from 'react'
import { CloseButton } from './CloseButton'

interface TabHeaderProps {
  title: string
  subtitle?: ReactNode
  onClose: () => void
}

/** Title (+ optional subtitle) row with a trailing close button, shared by the Picantully tabs. */
export function TabHeader({ title, subtitle, onClose }: TabHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="font-display text-lg font-bold tracking-tight">{title}</h1>
        {subtitle}
      </div>
      <CloseButton onClick={onClose} />
    </div>
  )
}
