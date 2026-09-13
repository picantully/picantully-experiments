import { APPS } from '../../../data/apps'
import { countDistracting } from '../../../state/derived'
import type { DemoState } from '../../../state/types'
import type { DemoActions } from '../../../state/useDemoState'
import { AppIcon } from '../../ui/AppIcon'
import { Switch } from '../../ui/Switch'
import { TabHeader } from '../../ui/TabHeader'

interface AppsTabProps {
  state: DemoState
  actions: DemoActions
}

const PRESETS: { id: 'laburo' | 'noche' | 'libre'; label: string }[] = [
  { id: 'laburo', label: 'Modo laburo' },
  { id: 'noche', label: 'Modo noche' },
  { id: 'libre', label: 'Todo libre' }
]

export function AppsTab({ state, actions }: AppsTabProps) {
  const negoCount = countDistracting(state.mode)

  return (
    <div className="flex flex-col gap-2.5">
      <TabHeader
        title="Tus apps"
        subtitle={
          <p className="text-xs text-mut2">
            {negoCount} distractoras · {APPS.length - negoCount} libres
          </p>
        }
        onClose={actions.goHome}
      />

      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => actions.applyPreset(preset.id)}
            className="rounded-full border border-[#3a2220] bg-[#170f10] px-3 py-2 text-[11.5px] text-[#e7dfe0]"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <p className="rounded-2xl border border-[#241b1c] bg-[#141011] px-2.5 py-2 text-[10.5px] leading-snug text-mut2">
        Las apps marcadas como distractoras siempre te van a hacer negociar antes de abrirse. El resto pasa sin
        preguntar.
      </p>

      <div className="flex flex-col gap-1.5">
        {APPS.map((app) => {
          const active = state.mode[app.id]
          return (
            <div
              key={app.id}
              className={`flex items-center gap-2.5 rounded-2xl border px-2.5 py-2 ${
                active ? 'border-[#4a211e] bg-[#1c1112]' : 'border-[#241b1c] bg-[#141011]'
              }`}
            >
              <AppIcon icon={app.icon} color={app.color} size={26} radius={8} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12.5px] font-semibold">{app.name}</span>
                <span className="block text-[10px] text-[#6d6162]">{app.cat}</span>
              </span>
              <Switch on={active} onToggle={() => actions.toggleAppMode(app.id)} label={`Marcar ${app.name} como distractora`} />
            </div>
          )
        })}
      </div>
    </div>
  )
}
