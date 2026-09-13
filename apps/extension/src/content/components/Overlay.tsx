import React, { useState, useEffect, useRef, useCallback } from 'react'
import { LuClock, LuBan } from 'react-icons/lu'
import { GiChiliPepper } from 'react-icons/gi'
import { Mascot } from './Mascot'
import { ChatLog } from './ChatLog'
import { INITIAL_GREETINGS } from '../greetings'
import type {
  ChatMessage,
  ConversationTurn,
  NegotiateMessage,
  NegotiateResponse,
  NegotiateUsage,
  GetUsageMessage,
  GetUsageResponse,
  PersonaLimitMessages,
} from '../../types'

// Coincide con el tope del server (zod .max(500) en apps/backend/src/main.ts)
const MAX_MESSAGE_LEN = 500

interface OverlayProps {
  domain: string
  minutesToday: number
  onGranted: () => void
}

function randomGreeting(): string {
  return INITIAL_GREETINGS[Math.floor(Math.random() * INITIAL_GREETINGS.length)]
}

// Devuelve true si el objeto tiene la forma nueva (NegotiateUsage con day/domain/week).
// Guards para degradar graciosamente con respuestas viejas.
function isNewUsageShape(u: unknown): u is NegotiateUsage {
  if (!u || typeof u !== 'object') return false
  const obj = u as Record<string, unknown>
  return (
    obj.day !== null && typeof obj.day === 'object' &&
    obj.domain !== null && typeof obj.domain === 'object' &&
    obj.week !== null && typeof obj.week === 'object'
  )
}

export function Overlay({ domain, minutesToday, onGranted }: OverlayProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    // Saludo inicial aleatorio LOCAL — sin gastar una request de API
    { role: 'mascota', text: randomGreeting() },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [grantedMinutes, setGrantedMinutes] = useState<number | null>(null)
  // Rate limit tridimensional (day / domain / week) — surge de la última respuesta.
  const [usage, setUsage] = useState<NegotiateUsage | null>(null)
  const [limitReached, setLimitReached] = useState(false)
  const [limitKind, setLimitKind] = useState<'domain' | 'day' | 'week' | undefined>(undefined)
  // Mensajes de límite del persona (leídos de Appwrite junto con el uso).
  const [personaLimitMsgs, setPersonaLimitMsgs] = useState<PersonaLimitMessages | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Al montar: cargar historial de conversación previo desde chrome.storage.local.
  // Si existe, reemplaza el saludo aleatorio para no perder el hilo.
  useEffect(() => {
    chrome.storage.local.get(['conversations'], (result) => {
      const conversations: Record<string, ConversationTurn[]> = result.conversations ?? {}
      const history: ConversationTurn[] = conversations[domain] ?? []
      if (history.length === 0) return
      // Mapear ConversationTurn (roles Gemini) → ChatMessage (roles del overlay)
      const historyMessages: ChatMessage[] = history.map((turn) => ({
        role: turn.role === 'model' ? 'mascota' : 'user',
        text: turn.text,
      }))
      setMessages(historyMessages)
    })
  }, [domain])

  // Al montar: obtener el uso actual del dominio sin gastar una negociación.
  // También detecta el límite localmente para bloquear la negociación antes
  // de llegar a la función de nube (ahorra ejecuciones pagadas).
  useEffect(() => {
    const msg: GetUsageMessage = { type: 'GET_USAGE', domain }
    chrome.runtime.sendMessage(msg, (response: GetUsageResponse) => {
      if (chrome.runtime.lastError) return // sin sesión → ignorar
      if (!response || typeof response !== 'object' || !('usage' in response)) return

      const { usage: u, limitMessages } = response
      setUsage(u)
      if (limitMessages) setPersonaLimitMsgs(limitMessages)

      // Gate local: detectar si ya se alcanzó algún cap y bloquear sin llamar a la función.
      if (u.domain.used >= u.domain.limit) {
        setLimitReached(true)
        setLimitKind('domain')
      } else if (u.day.used >= u.day.limit) {
        setLimitReached(true)
        setLimitKind('day')
      } else if (u.week.used >= u.week.limit) {
        setLimitReached(true)
        setLimitKind('week')
      }
    })
  }, [domain])

  // Foco automático en el input al cargar
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const sendNegotiate = useCallback(
    (text: string) => {
      // No negociar si: cargando, vacío, ya concedido, o se agotó el cupo diario.
      if (isLoading || !text.trim() || grantedMinutes !== null || limitReached)
        return

      setMessages(prev => [...prev, { role: 'user', text }])
      setIsLoading(true)
      setInputValue('')

      const msg: NegotiateMessage = {
        type: 'NEGOTIATE',
        domain,
        userMessage: text,
        minutesToday,
      }

      chrome.runtime.sendMessage(
        msg,
        (response: NegotiateResponse | undefined) => {
          if (chrome.runtime.lastError) {
            console.error('[Picantully]', chrome.runtime.lastError.message)
            setIsLoading(false)
            setMessages(prev => [
              ...prev,
              {
                role: 'mascota',
                text: 'Uy, error de conexión con el backend. ¿Está corriendo el servidor?',
              },
            ])
            return
          }

          setIsLoading(false)

          if (!response) {
            setMessages(prev => [
              ...prev,
              {
                role: 'mascota',
                text: 'Sin respuesta del servidor, probá de nuevo.',
              },
            ])
            return
          }

          setMessages(prev => [
            ...prev,
            { role: 'mascota', text: response.mensaje },
          ])

          // Rate limit tridimensional: actualiza solo si la respuesta trae la forma nueva.
          if (isNewUsageShape(response.usage)) setUsage(response.usage)
          if (response.limitReached) {
            setLimitReached(true)
            if (response.limitKind) setLimitKind(response.limitKind)
            // personaLimitMsgs ya está cacheado del GET_USAGE del mount — no se re-fetcha.
          }

          if (response.permitir && response.minutos !== null) {
            setGrantedMinutes(response.minutos)
          } else if (!response.limitReached) {
            setTimeout(() => inputRef.current?.focus(), 100)
          }
        },
      )
    },
    [domain, minutesToday, isLoading, grantedMinutes, limitReached, onGranted],
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendNegotiate(inputValue.trim())
  }

  // El usuario ganó los minutos pero decide NO entrar → lo sacamos del sitio
  // (vuelve atrás; si no hay historial, a una pestaña en blanco).
  const handleDismiss = () => {
    if (window.history.length > 1) window.history.back()
    else window.location.href = 'about:blank'
  }

  const granted = grantedMinutes !== null

  return (
    <div className="picantully-backdrop">
      <div className={`picantully-card${granted ? ' picantully-card--granted' : ''}`}>
        <Mascot isThinking={isLoading} isHappy={granted} />

        <div
          className={`picantully-title${granted ? ' picantully-title--granted' : ''}`}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}
        >
          {granted ? (
            <>
              <LuClock size={20} style={{ flexShrink: 0, display: 'block' }} />
              Dale, pasá… por ahora
            </>
          ) : (
            <>
              <LuBan size={20} style={{ flexShrink: 0, display: 'block' }} />
              ¿A dónde vas bichito de luz?
            </>
          )}
        </div>

        <div className="picantully-divider" />

        <ChatLog messages={messages} isLoading={isLoading} />

        {/* Concedido: timer grande + decisión final. El mensaje de Picantully ya
            está en el chat de arriba (su respuesta real, no hardcodeada). */}
        {granted && (
          <>
            <div className="picantully-granted-box">
              <div className="picantully-granted-time">{grantedMinutes}:00</div>
            </div>
            <div className="picantully-granted-actions">
              <button
                className="picantully-granted-btn picantully-granted-btn--enter"
                onClick={onGranted}
                type="button"
              >
                Entrar igual
              </button>
              <button
                className="picantully-granted-btn picantully-granted-btn--close"
                onClick={handleDismiss}
                type="button"
              >
                Mejor cierro
              </button>
            </div>
          </>
        )}

        {/* Aviso prominente: se agotó algún cap de negociaciones — tono varía según cuál */}
        {grantedMinutes === null && limitReached && (
          <div className="picantully-limit" role="alert">
            <span className="picantully-limit__title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <GiChiliPepper size={16} style={{ flexShrink: 0, display: 'block' }} />
              {limitKind === 'domain'
                ? 'Demasiado de ESTE sitio por hoy'
                : limitKind === 'week'
                  ? 'Se te acabó el cupo semanal'
                  : 'Se te acabaron las fichas por hoy'}
            </span>
            <span className="picantully-limit__sub">
              {limitKind === 'domain'
                ? (personaLimitMsgs?.domain
                    ? personaLimitMsgs.domain.replace('{domain}', usage?.domain.name ?? domain)
                    : `Llegaste al máximo de ${usage?.domain.limit ?? ''} negociaciones para ${usage?.domain.name ?? domain} hoy. Probá mañana, crack.`)
                : limitKind === 'week'
                  ? (personaLimitMsgs?.week
                      ?? `Usaste tus ${usage?.week.limit ?? ''} negociaciones de la semana. Volvé la semana que viene.`)
                  : (personaLimitMsgs?.day
                      ?? `Usaste tus ${usage?.day.limit ?? ''} negociaciones del día. Volvé mañana, rey/reina.`)}
            </span>
          </div>
        )}

        {grantedMinutes === null && !limitReached && (
          <>
            {/* Input libre (sin chips de respuesta rápida — ahorran alto de pantalla) */}
            <form className="picantully-form" onSubmit={handleSubmit}>
              <div className="picantully-input-wrapper">
                <input
                  ref={inputRef}
                  className="picantully-input"
                  type="text"
                  placeholder={
                    isLoading ? 'Pensando...' : 'O escribí tu excusa acá...'
                  }
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  maxLength={MAX_MESSAGE_LEN}
                />
                {/* Contador de caracteres: visible siempre; se vuelve ámbar/rojo cerca del límite */}
                <span
                  className={`picantully-char-counter${
                    inputValue.length >= MAX_MESSAGE_LEN
                      ? ' picantully-char-counter--danger'
                      : inputValue.length >= MAX_MESSAGE_LEN - 30
                        ? ' picantully-char-counter--warning'
                        : ''
                  }`}
                >
                  {inputValue.length}/{MAX_MESSAGE_LEN}
                </span>
              </div>
              <button
                className="picantully-btn"
                type="submit"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? '...' : 'Enviar'}
              </button>
            </form>
          </>
        )}

        {/* Indicador de negociaciones restantes — prioriza el cap de dominio (el más restrictivo) */}
        {grantedMinutes === null && !limitReached && usage && (
          <>
            {/* Cap de dominio (el más binding — se agota primero) */}
            <div
              className={`picantully-usage${
                (usage.domain.limit - usage.domain.used) <= 1 ? ' picantully-usage--low' : ''
              }`}
            >
              <span className="picantully-usage__dot" />
              Te quedan {Math.max(0, usage.domain.limit - usage.domain.used)} en este sitio hoy
            </div>
            {/* Cap diario total — sólo si hay espacio (evita ruido cuando el dominio ya es el binding) */}
            {usage.day.limit - usage.day.used < usage.domain.limit - usage.domain.used && (
              <div
                className={`picantully-usage${
                  (usage.day.limit - usage.day.used) <= 1 ? ' picantully-usage--low' : ''
                }`}
                style={{ fontSize: '10.5px', marginTop: '-8px', opacity: 0.75 }}
              >
                <span className="picantully-usage__dot" />
                {Math.max(0, usage.day.limit - usage.day.used)} en total hoy
              </div>
            )}
          </>
        )}

        <div className="picantully-footer">
          Picantully · llevás {minutesToday} min efectivos en {domain} hoy
        </div>
      </div>
    </div>
  )
}
