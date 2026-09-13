import picantito from '../../assets/picantito-character.png'
import { formatClock } from '../../state/derived'
import type { DemoState } from '../../state/types'
import type { DemoActions } from '../../state/useDemoState'
import { ProgressRing } from '../ui/ProgressRing'

interface PomodoroScreenProps {
  state: DemoState
  actions: DemoActions
}

export function PomodoroScreen({ state, actions }: PomodoroScreenProps) {
  const total = state.focusLength * 60
  const pct = state.focusSeconds > 0 ? (1 - state.focusSeconds / total) * 100 : 100
  const label = state.focusSeconds === 0 ? 'terminada' : state.focusRunning ? 'enfocado' : 'en pausa'
  const line =
    state.focusSeconds === 0
      ? `Listo. ${state.focusLength} minutos limpios.`
      : state.focusRunning
        ? 'Las distractoras están cerradas con llave. Yo cuido la puerta.'
        : 'Cuando arranques no hay negociación posible. Te lo prometo.'
  const buttonLabel =
    state.focusSeconds === 0
      ? `Arrancar otra de ${state.focusLength}`
      : state.focusRunning
        ? 'Cortar la sesión'
        : `Arrancar los ${state.focusLength}`
  const speedLabel = state.demoSpeed === 1 ? 'ACELERAR PARA LA DEMO ×20' : 'VELOCIDAD DEMO ×20 ACTIVA'

  return (
    <div
      className="absolute inset-0 flex flex-col items-center px-4 pb-4 pt-12 animate-[pica-in_0.25s_ease_both]"
      style={{ background: 'radial-gradient(110% 70% at 50% 10%, #2a0d0b 0%, #120a0a 55%, #0a0708 100%)' }}
    >
      <div className="flex w-full items-center justify-between">
        <button type="button" onClick={actions.goHome} className="text-[12.5px] text-mut2">
          ‹ Inicio
        </button>
        <p className="font-mono text-[9.5px] tracking-[0.14em] text-[#ff6b60]">SESIÓN DE FOCO</p>
      </div>

      <div className="my-5">
        <ProgressRing pct={pct}>
          <span className="font-mono text-[38px] font-bold tracking-tight tabular-nums">{formatClock(state.focusSeconds)}</span>
          <span className="text-[11.5px] text-mut2">{label}</span>
        </ProgressRing>
      </div>

      <img src={picantito} alt="" className="h-[82px] w-[82px] object-contain" />
      <p className="max-w-[240px] text-center text-[13px] leading-relaxed text-[#cdc2c3]">{line}</p>

      <div className="mt-auto flex w-full flex-col gap-1.5">
        <button
          type="button"
          onClick={actions.toggleFocusRunning}
          className="rounded-2xl py-3.5 text-center text-[13.5px] font-semibold text-white"
          style={{ background: 'linear-gradient(120deg,#ff4136,#c21b13)' }}
        >
          {buttonLabel}
        </button>
        <button type="button" onClick={actions.toggleDemoSpeed} className="text-center font-mono text-[10px] tracking-[0.1em] text-[#6d6162]">
          {speedLabel}
        </button>
      </div>
    </div>
  )
}
