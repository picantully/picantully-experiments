import picantito from '../../assets/picantito-character.png'
import { DOCK_APP_IDS, GRID_APP_IDS, getApp } from '../../data/apps'
import { DEMO_NOW } from '../../state/demoClock'
import { countDistracting, formatClock, formatHourLabel, isWithinBlockWindow } from '../../state/derived'
import type { DemoState } from '../../state/types'
import type { DemoActions } from '../../state/useDemoState'
import { AppIcon } from '../ui/AppIcon'

interface HomeScreenProps {
  state: DemoState
  actions: DemoActions
}

export function HomeScreen({ state, actions }: HomeScreenProps) {
  const negoCount = countDistracting(state.mode)
  const modeTitle = state.focusRunning
    ? 'Sesión de foco'
    : isWithinBlockWindow(state)
      ? 'Modo foco activo'
      : 'Horario libre'
  const ruleSummary = `${negoCount} distractoras · ${
    state.scheduleOn ? `${formatHourLabel(state.scheduleFrom)} a ${formatHourLabel(state.scheduleTo)}` : 'siempre'
  }`

  return (
    <div
      className="absolute inset-0 flex flex-col gap-3.5 px-4 pb-3 pt-12"
      style={{ background: 'radial-gradient(120% 80% at 20% 0%, #331110 0%, #140a0b 45%, #0b0809 100%)' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11.5px] text-mut2">{DEMO_NOW.dayLabel}, {DEMO_NOW.hourLabel}</p>
          <p className="font-display text-[17px] font-bold tracking-tight">{modeTitle}</p>
        </div>
        <button
          type="button"
          onClick={actions.goPicantully}
          className="rounded-full border border-[#1d4a33] bg-[#0f2419] px-2 py-1.5 font-mono text-[10px] text-green"
        >
          {state.gainedMinutes} MIN
        </button>
      </div>

      {state.focusRunning && (
        <button
          type="button"
          onClick={actions.goPomodoro}
          className="flex items-center gap-2.5 rounded-2xl border border-[#5a2520] px-3.5 py-3 text-left"
          style={{ background: 'linear-gradient(120deg,#3a100c,#1b0d0c)' }}
        >
          <img src={picantito} alt="" className="h-[30px] w-[30px] object-contain" />
          <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-semibold text-[#ff8078]">Sesión de foco en curso</span>
            <span className="block text-[11.5px] text-mut2">Las distractoras están cerradas. No se negocia.</span>
          </span>
          <span className="font-mono text-[15px] text-white">{formatClock(state.focusSeconds)}</span>
        </button>
      )}

      <div className="grid grid-cols-4 gap-x-2.5 gap-y-3.5">
        {GRID_APP_IDS.map((id) => {
          const app = getApp(id)
          return (
            <button key={id} type="button" onClick={() => actions.tryOpenApp(id)} className="flex flex-col items-center gap-1.5">
              <AppIcon icon={app.icon} color={app.color} size={50} distracting={state.mode[id]} />
              <span className="max-w-[62px] truncate text-[10px] text-[#e7dfe0]">{app.name}</span>
            </button>
          )
        })}
      </div>

      <button
        type="button"
        onClick={actions.goPicantully}
        className="mb-2 mt-auto flex items-center gap-2.5 rounded-2xl border border-[#2e1f1e] bg-[#17100f] px-3.5 py-3 text-left"
      >
        <span
          className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-[10px]"
          style={{ background: 'linear-gradient(140deg,#ff4136,#8e120c)' }}
        >
          <img src={picantito} alt="" className="h-7 w-7 object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[12.5px] font-semibold">Abrir Picantully</span>
          <span className="block text-[11px] text-mut2">{ruleSummary}</span>
        </span>
        <span className="text-base text-mut2">›</span>
      </button>

      <div className="flex justify-center gap-3.5 rounded-[22px] bg-white/[0.06] px-3 py-2 backdrop-blur-md">
        {DOCK_APP_IDS.map((id) => {
          const app = getApp(id)
          return (
            <button key={id} type="button" onClick={() => actions.tryOpenApp(id)} aria-label={app.name}>
              <AppIcon icon={app.icon} color={app.color} size={46} radius={13} distracting={state.mode[id]} />
            </button>
          )
        })}
        <button
          type="button"
          onClick={actions.goPicantully}
          aria-label="Picantully"
          className="flex h-[46px] w-[46px] items-center justify-center overflow-hidden rounded-[13px]"
          style={{ background: 'linear-gradient(140deg,#ff4136,#8e120c)' }}
        >
          <img src={picantito} alt="" className="h-10 w-10 object-contain" />
        </button>
      </div>
    </div>
  )
}
