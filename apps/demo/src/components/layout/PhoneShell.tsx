import type { ReactNode } from 'react'
import { StatusBar } from './StatusBar'
import { Toast } from '../ui/Toast'

interface PhoneShellProps {
  children: ReactNode
  toast: string
  onHomeGesture: () => void
}

/**
 * The phone frame itself. Sizing/responsiveness (full-bleed under 760px,
 * a fixed 320×660 frame scaled to fit the viewport height above it) is
 * handled entirely by the `.phone-frame` CSS class (see styles/index.css) —
 * no resize listener or imperative style mutation, unlike the source mockup's
 * `fit()`.
 */
export function PhoneShell({ children, toast, onHomeGesture }: PhoneShellProps) {
  return (
    <div className="phone-frame overflow-hidden bg-black min-[760px]:border min-[760px]:border-[#2c2426] min-[760px]:p-[9px] min-[760px]:shadow-[0_30px_70px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,65,54,0.08),0_0_70px_rgba(255,65,54,0.1)]">
      <div className="relative h-full w-full overflow-hidden bg-bg2 min-[760px]:rounded-[36px]">
        <StatusBar />
        {children}
        <Toast message={toast} />
        <button
          type="button"
          onClick={onHomeGesture}
          aria-label="Ir a inicio"
          className="absolute bottom-1.5 left-1/2 z-[55] h-1 w-28 -translate-x-1/2 rounded-full bg-white/45"
        />
      </div>
    </div>
  )
}
