import { Button, Chip } from '@picantully/design-system'
import { useEffect, useRef, useState } from 'react'
import picantito from '../../assets/picantito-character.png'
import { getApp } from '../../data/apps'
import { CHIP_ORDER, CHIP_TEXT } from '../../data/voices'
import { DEMO_NOW } from '../../state/demoClock'
import { formatClock, grantMinutesFor } from '../../state/derived'
import type { DemoState } from '../../state/types'
import type { DemoActions } from '../../state/useDemoState'
import { CloseButton } from '../ui/CloseButton'

interface ChatScreenProps {
  state: DemoState
  actions: DemoActions
}

export function ChatScreen({ state, actions }: ChatScreenProps) {
  const app = getApp(state.chatAppId)
  const threadRef = useRef<HTMLDivElement>(null)
  const [draft, setDraft] = useState('')

  useEffect(() => {
    threadRef.current?.scrollTo({ top: threadRef.current.scrollHeight, behavior: 'smooth' })
  }, [state.messages.length, state.typing])

  const blockLabel = state.focusRunning
    ? 'SESIÓN DE FOCO: SIN NEGOCIACIÓN'
    : `PICANTULLY BLOQUEÓ ${app?.name.toUpperCase() ?? ''}`
  const chatTitle = state.focusRunning ? 'Ni lo intentes.' : '¿A dónde vas, bichito de luz?'
  const dealMinutes = grantMinutesFor(state.dealsAccepted)
  // A reply is already in flight (bot "thinking" or actively typing) —
  // disable sending so a fast double-send can't desync visible chat from
  // the reducer's turns/resistance state.
  const isSending = state.typing || !!state.pendingBotReply

  const submitDraft = () => {
    const value = draft.trim()
    if (!value || isSending) return
    setDraft('')
    actions.sendMessage(value)
  }

  return (
    <div
      className="absolute inset-0 flex flex-col px-3.5 pb-3.5 pt-12 animate-[pica-in_0.3s_ease_both]"
      style={{ background: 'radial-gradient(120% 70% at 50% 0%, #3d0f0c 0%, #150a0a 50%, #0a0708 100%)' }}
    >
      <div className="flex items-center justify-between pb-0.5">
        <p className="font-mono text-[9.5px] tracking-[0.14em] text-[#ff6b60]">{blockLabel}</p>
        <CloseButton onClick={actions.goHome} label="Salir" />
      </div>

      <div className="flex items-center gap-2.5 border-b border-[#2a1c1b] py-2">
        <img src={picantito} alt="" className="-my-1.5 h-[58px] w-[58px] object-contain" />
        <div className="min-w-0">
          <p className="font-display text-base font-bold leading-tight tracking-tight">{chatTitle}</p>
          <p className="mt-0.5 text-[11px] text-mut2">
            {app ? `${app.name} · ${DEMO_NOW.dayLabel.toLowerCase()} ${DEMO_NOW.hourLabel}` : ''}
          </p>
        </div>
      </div>

      <div ref={threadRef} className="flex flex-1 flex-col gap-2 overflow-y-auto py-2.5">
        {state.messages.map((m) => (
          <div key={m.id} className={`flex animate-[pica-bubble_0.22s_ease_both] ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={
                'max-w-[84%] rounded-2xl px-3 py-2.5 text-[12.5px] leading-relaxed ' +
                (m.from === 'me'
                  ? 'rounded-br-md text-white'
                  : 'rounded-bl-md border border-[#2a1f20] bg-[#1a1415] text-[#e7dfe0]')
              }
              style={m.from === 'me' ? { background: 'linear-gradient(120deg,#ff4136,#d2231a)' } : undefined}
            >
              {m.text}
            </div>
          </div>
        ))}
        {state.typing && (
          <div className="flex w-fit gap-1.5 self-start rounded-2xl rounded-bl-md bg-[#1a1415] px-3 py-2.5" aria-label="Escribiendo…">
            <span className="h-1.5 w-1.5 animate-[blink_1s_infinite] rounded-full bg-[#ff6b60]" />
            <span className="h-1.5 w-1.5 animate-[blink_1s_infinite_0.2s] rounded-full bg-[#ff6b60]" />
            <span className="h-1.5 w-1.5 animate-[blink_1s_infinite_0.4s] rounded-full bg-[#ff6b60]" />
          </div>
        )}
      </div>

      {state.focusRunning ? (
        <div className="flex flex-col gap-2 rounded-2xl border border-[#3a2220] bg-[#160f10] p-3.5">
          <p className="text-[12.5px] leading-relaxed text-[#cdc2c3]">
            Estás en sesión de foco. Acá no hay trato, no hay excusa y no hay chat. Nos vemos en {formatClock(state.focusSeconds)}.
          </p>
          <Button kind="red" full onClick={actions.goHome}>
            Volver al trabajo
          </Button>
        </div>
      ) : state.dealOpen ? (
        <div className="flex flex-col gap-1.5 rounded-2xl border border-[#3a2220] bg-[#160f10] p-3 animate-[pica-pop_0.25s_ease_both]">
          <p className="font-mono text-[9.5px] tracking-[0.14em] text-mut2">EL TRATO</p>
          <button
            type="button"
            onClick={actions.acceptDeal}
            className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-[13px] font-semibold text-white"
            style={{ background: 'linear-gradient(120deg,#ff4136,#c21b13)' }}
          >
            <span>
              Dale, {dealMinutes} minutos de {app?.name ?? 'la app'}
            </span>
            <span>›</span>
          </button>
          <button
            type="button"
            onClick={actions.startFocusSessionFromDeal}
            className="flex items-center justify-between rounded-xl border border-[#3a2220] bg-[#1d1516] px-3.5 py-2.5 text-[13px] font-semibold text-[#e7dfe0]"
          >
            <span>Mejor arranco una sesión de foco</span>
            <span>›</span>
          </button>
          <button type="button" onClick={actions.giveUp} className="py-1.5 text-center text-[12.5px] text-green">
            Cierro y sigo con lo mío
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-1.5">
            {CHIP_ORDER.map((key) => (
              <Chip
                key={key}
                onClick={isSending ? undefined : () => actions.sendMessage(CHIP_TEXT[key], key)}
                style={isSending ? { opacity: 0.5, pointerEvents: 'none' } : undefined}
              >
                {CHIP_TEXT[key]}
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitDraft()}
              placeholder="O escribí tu excusa acá..."
              disabled={isSending}
              className="min-w-0 flex-1 rounded-xl border border-[#4a211e] bg-[#120c0d] px-3 py-2.5 text-[12.5px] text-ink outline-none placeholder:text-mut2 disabled:opacity-50"
            />
            <button
              type="button"
              onClick={submitDraft}
              disabled={isSending}
              className="rounded-xl px-4 py-2.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(120deg,#ff4136,#c21b13)' }}
            >
              Enviar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
