import picantito from '../../../assets/picantito-character.png'
import { VOICES } from '../../../data/voices'
import { formatClock } from '../../../state/derived'
import type { ActivityKind, DemoState } from '../../../state/types'
import type { DemoActions } from '../../../state/useDemoState'
import { TabHeader } from '../../ui/TabHeader'

interface CasaTabProps {
  state: DemoState
  actions: DemoActions
}

const KIND_DOT: Record<ActivityKind, string> = { block: '#48d08a', deal: '#ff4136', focus: '#ffb43a' }

export function CasaTab({ state, actions }: CasaTabProps) {
  const voice = VOICES[state.tone]
  const mascotLine = state.focusRunning ? 'Estoy en la puerta hasta que termine la sesión. Andá tranquilo.' : voice.home
  const primaryTitle = state.focusRunning
    ? `Sesión en curso · ${formatClock(state.focusSeconds)}`
    : `Empezar sesión de ${state.focusLength} min`
  const primarySub = state.focusRunning ? 'Tocá para ver el reloj grande' : 'Mientras dure, no se negocia con nadie'

  return (
    <div className="flex flex-col gap-3">
      <TabHeader title="Hola, che." onClose={actions.goHome} />

      <div
        className="relative flex flex-col items-center overflow-hidden rounded-[20px] border border-[#3a2220] px-4 pb-4 pt-4"
        style={{ background: 'radial-gradient(120% 90% at 50% 15%, #5e1a12 0%, #34100d 38%, #150b0b 72%, #0e0809 100%)' }}
      >
        <img
          src={picantito}
          alt="Picantully"
          className="relative h-[150px] w-[150px] object-contain drop-shadow-[0_16px_22px_rgba(0,0,0,0.55)]"
        />
        <div className="relative mt-2.5 rounded-2xl border border-[#4a211e] bg-[rgba(10,6,7,0.72)] px-3.5 py-2.5 text-center">
          <p className="text-[13px] leading-relaxed text-[#f7efef]">{mascotLine}</p>
          <p className="mt-1.5 font-mono text-[9.5px] tracking-[0.12em] text-[#ff8078]">{voice.label}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={actions.startFocusSession}
        className="flex items-center gap-2.5 rounded-2xl px-3.5 py-3.5 text-left"
        style={{ background: 'linear-gradient(120deg,#ff4136,#c21b13)' }}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-black/25 text-base text-white">◷</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13.5px] font-bold text-white">{primaryTitle}</span>
          <span className="block text-[11px] text-white/80">{primarySub}</span>
        </span>
        <span className="text-base text-white">›</span>
      </button>

      <div className="grid grid-cols-3 gap-1.5">
        <div className="rounded-2xl border border-[#241b1c] bg-[#141011] p-2.5">
          <p className="text-lg font-bold text-green">{state.gainedMinutes}</p>
          <p className="text-[10px] text-mut2">min ganados</p>
        </div>
        <div className="rounded-2xl border border-[#241b1c] bg-[#141011] p-2.5">
          <p className="text-lg font-bold">{state.winsGivenUp}</p>
          <p className="text-[10px] text-mut2">le hiciste caso</p>
        </div>
        <div className="rounded-2xl border border-[#241b1c] bg-[#141011] p-2.5">
          <p className="text-lg font-bold text-[#ff6b60]">{state.focusSessionsDone}</p>
          <p className="text-[10px] text-mut2">sesiones</p>
        </div>
      </div>

      <p className="mt-0.5 font-mono text-[9.5px] tracking-[0.14em] text-[#6d6162]">HOY EN LA PUERTA</p>
      <div className="flex flex-col gap-1.5">
        {state.activity.map((entry) => (
          <div key={entry.id} className="flex items-center gap-2.5 rounded-2xl border border-[#241b1c] bg-[#141011] px-2.5 py-2">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: KIND_DOT[entry.kind] }} />
            <span className="min-w-0 flex-1 text-xs text-[#cdc2c3]">{entry.text}</span>
            <span className="font-mono text-[10px] text-[#6d6162]">{entry.time}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
