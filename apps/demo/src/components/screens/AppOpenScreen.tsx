import picantito from '../../assets/picantito-character.png'
import { getApp } from '../../data/apps'
import { formatClock } from '../../state/derived'
import type { DemoState } from '../../state/types'
import type { DemoActions } from '../../state/useDemoState'
import { AppIcon } from '../ui/AppIcon'

interface AppOpenScreenProps {
  state: DemoState
  actions: DemoActions
}

export function AppOpenScreen({ state, actions }: AppOpenScreenProps) {
  const app = getApp(state.openAppId)
  if (!app) return null
  const onLoan = state.grantSeconds > 0

  return (
    <div className="absolute inset-0 flex flex-col bg-bg2 animate-[pica-in_0.25s_ease_both]">
      <div className="flex items-center gap-2 border-b border-[#1c1618] px-3.5 pb-2.5 pt-12">
        <button
          type="button"
          onClick={actions.goHome}
          aria-label="Volver"
          className="flex h-[26px] w-[26px] items-center justify-center rounded-lg border border-[#2a2223] bg-[#1a1415] text-sm leading-none text-[#cdc2c3]"
        >
          ‹
        </button>
        <AppIcon icon={app.icon} color={app.color} size={20} radius={6} />
        <p className="font-display text-[15px] font-bold tracking-tight">{app.name}</p>
        <p className="ml-auto font-mono text-[9.5px] text-mut2">{onLoan ? 'TIEMPO PRESTADO' : 'APP LIBRE'}</p>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-hidden p-3.5">
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-11 w-11 rounded-full border-2"
              style={{
                borderColor: i === 0 ? '#ff4136' : '#3a2220',
                background: 'repeating-linear-gradient(45deg,#241a1b,#241a1b 5px,#1a1314 5px,#1a1314 10px)'
              }}
            />
          ))}
        </div>
        {[0, 1].map((i) => (
          <div
            key={i}
            className="flex flex-1 items-center justify-center rounded-2xl font-mono text-[10px] text-[#6d6162]"
            style={{ background: 'repeating-linear-gradient(45deg,#1b1516,#1b1516 9px,#151011 9px,#151011 18px)' }}
          >
            {app.filler}
          </div>
        ))}
      </div>

      {onLoan && (
        <div className="absolute left-1/2 top-[78px] z-30 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#4a211e] bg-[rgba(20,10,10,0.94)] px-3 py-1.5 shadow-lg">
          <img src={picantito} alt="" className="h-[22px] w-[22px] object-contain" />
          <span className="font-mono text-[12.5px] font-medium text-[#ff8078]">{formatClock(state.grantSeconds)}</span>
          <span className="text-[11px] text-mut2">te quedan</span>
        </div>
      )}
    </div>
  )
}
