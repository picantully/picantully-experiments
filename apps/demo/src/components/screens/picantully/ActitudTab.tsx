import picantito from '../../../assets/picantito-character.png'
import { VOICES, type Tone } from '../../../data/voices'
import type { DemoState, Hardness } from '../../../state/types'
import type { DemoActions } from '../../../state/useDemoState'
import { PillGroup } from '../../ui/PillGroup'
import { TabHeader } from '../../ui/TabHeader'

const TONE_ORDER: readonly Tone[] = ['amable', 'picante', 'insoportable']

const HARDNESS_OPTIONS: { value: Hardness; label: string }[] = [
  { value: 1, label: 'Blando' },
  { value: 2, label: 'Normal' },
  { value: 4, label: 'Hueso duro' }
]

const HARDNESS_LINE: Record<Hardness, string> = {
  1: 'Con una buena excusa te deja entrar.',
  2: 'Te va a negar un par de veces antes de aflojar.',
  4: 'Prepárate para insistir. Mucho.'
}

interface ActitudTabProps {
  state: DemoState
  actions: DemoActions
}

export function ActitudTab({ state, actions }: ActitudTabProps) {
  const voice = VOICES[state.tone]

  return (
    <div className="flex flex-col gap-3">
      <TabHeader title="Su actitud" onClose={actions.goHome} />

      <div
        className="flex items-center gap-2.5 rounded-[17px] border border-[#3a2220] p-3.5"
        style={{ background: 'linear-gradient(140deg,#2a0f0d,#150c0c)' }}
      >
        <img src={picantito} alt="" className="-my-2 h-[76px] w-[76px] object-contain" />
        <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-[#f0e8e8]">{voice.sample}</p>
      </div>

      <p className="font-mono text-[9.5px] tracking-[0.14em] text-[#6d6162]">CÓMO TE HABLA</p>
      <div className="flex flex-col gap-1.5">
        {TONE_ORDER.map((tone) => {
          const active = state.tone === tone
          const t = VOICES[tone]
          return (
            <button
              key={tone}
              type="button"
              onClick={() => actions.setTone(tone)}
              aria-pressed={active}
              className={`flex items-center gap-2.5 rounded-2xl p-2.5 text-left ${
                active ? 'border border-[#5a2520] bg-[#21100f]' : 'border border-[#241b1c] bg-[#141011]'
              }`}
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold">{t.name}</span>
                <span className="block text-[10.5px] leading-relaxed text-mut2">{t.desc}</span>
              </span>
              <span
                className="h-4 w-4 shrink-0 rounded-full border-2"
                style={{ borderColor: active ? '#ff4136' : '#3a2f30', background: active ? '#ff4136' : 'transparent' }}
              />
            </button>
          )
        })}
      </div>

      <p className="font-mono text-[9.5px] tracking-[0.14em] text-[#6d6162]">CUÁNTO CUESTA CONVENCERLO</p>
      <PillGroup ariaLabel="Cuánto cuesta convencerlo" value={state.hardness} onChange={actions.setHardness} options={HARDNESS_OPTIONS} />
      <p className="text-[11px] leading-relaxed text-mut2">{HARDNESS_LINE[state.hardness]}</p>
    </div>
  )
}
