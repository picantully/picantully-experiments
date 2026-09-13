import { formatClock, formatHourLabel } from '../../../state/derived'
import type { DemoState, FocusLength } from '../../../state/types'
import type { DemoActions } from '../../../state/useDemoState'
import { PillGroup } from '../../ui/PillGroup'
import { Switch } from '../../ui/Switch'
import { TabHeader } from '../../ui/TabHeader'

const DAY_LABELS = ['D', 'L', 'M', 'M', 'J', 'V', 'S']
const LENGTHS: readonly FocusLength[] = [15, 25, 50]

interface FocoTabProps {
  state: DemoState
  actions: DemoActions
}

export function FocoTab({ state, actions }: FocoTabProps) {
  const focusCta = state.focusRunning ? `Ver sesión en curso · ${formatClock(state.focusSeconds)}` : 'Arrancar ahora'
  const scheduleLine = state.scheduleOn
    ? 'Dentro del rango, las distractoras abren la negociación. Fuera, pasás derecho.'
    : 'Sin rango: las distractoras negocian a toda hora.'

  return (
    <div className="flex flex-col gap-3">
      <TabHeader title="Foco" onClose={actions.goHome} />

      <div className="flex flex-col gap-2.5 rounded-[17px] border border-[#241b1c] bg-[#141011] p-3.5">
        <p className="text-[12.5px] text-[#cdc2c3]">Duración de la sesión</p>
        <PillGroup
          ariaLabel="Duración de la sesión"
          value={state.focusLength}
          onChange={actions.pickFocusLength}
          options={LENGTHS.map((n) => ({ value: n, label: `${n} min` }))}
        />
        <button
          type="button"
          onClick={actions.startFocusSession}
          className="rounded-xl py-3 text-center text-[13px] font-bold text-white"
          style={{ background: 'linear-gradient(120deg,#ff4136,#c21b13)' }}
        >
          {focusCta}
        </button>
        <p className="text-[11px] leading-relaxed text-mut2">Durante la sesión las distractoras quedan cerradas. No hay chat, no hay trato.</p>
      </div>

      <p className="font-mono text-[9.5px] tracking-[0.14em] text-[#6d6162]">HORARIO DE BLOQUEO</p>
      <div className="flex flex-col gap-2.5 rounded-[17px] border border-[#241b1c] bg-[#141011] p-3.5">
        <div className="flex items-center justify-between">
          <p className="text-[12.5px]">Bloquear en este rango</p>
          <Switch on={state.scheduleOn} onToggle={actions.toggleSchedule} label="Activar horario de bloqueo" />
        </div>
        <div className="flex gap-1">
          {DAY_LABELS.map((label, day) => {
            const active = state.scheduleDays.includes(day)
            return (
              <button
                key={day}
                type="button"
                onClick={() => actions.toggleScheduleDay(day)}
                className={`flex-1 rounded-lg py-1.5 text-[11px] ${
                  active ? 'bg-red font-semibold text-white' : 'border border-[#2a2223] bg-[#1d1516] text-mut2'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-[#3a2220] bg-[#1d1516] px-2 py-1.5">
            <button type="button" onClick={() => actions.adjustScheduleFrom(-1)} aria-label="Adelantar inicio" className="px-1.5 text-sm">
              −
            </button>
            <span className="flex-1 text-center font-mono text-[13px]">{formatHourLabel(state.scheduleFrom)}</span>
            <button type="button" onClick={() => actions.adjustScheduleFrom(1)} aria-label="Atrasar inicio" className="px-1.5 text-sm">
              +
            </button>
          </div>
          <span className="text-mut2">—</span>
          <div className="flex flex-1 items-center gap-1 rounded-xl border border-[#3a2220] bg-[#1d1516] px-2 py-1.5">
            <button type="button" onClick={() => actions.adjustScheduleTo(-1)} aria-label="Adelantar fin" className="px-1.5 text-sm">
              −
            </button>
            <span className="flex-1 text-center font-mono text-[13px]">{formatHourLabel(state.scheduleTo)}</span>
            <button type="button" onClick={() => actions.adjustScheduleTo(1)} aria-label="Atrasar fin" className="px-1.5 text-sm">
              +
            </button>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-mut2">{scheduleLine}</p>
      </div>
    </div>
  )
}
