import React, { useState, useEffect, useRef } from 'react'
import gif1 from '../../assets/picantito-gif-1.gif'
import staticPng from '../../assets/picantito-character.png'

interface WidgetProps {
  domain: string
  expiryMs: number
  onExpired: () => void
}

const GIF_PLAY_MS = 2400
const GIF_PAUSE_MS = 2000

function formatRemaining(ms: number): string {
  const totalSecs = Math.max(0, Math.floor(ms / 1000))
  if (totalSecs < 60) return `${totalSecs}s`
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`
}

export function Widget({ domain, expiryMs, onExpired }: WidgetProps) {
  const [now, setNow] = useState(Date.now())
  const [gifKey, setGifKey] = useState(0)
  const [playing, setPlaying] = useState(true)
  const gifTimer = useRef<ReturnType<typeof setTimeout>>()
  const expireTimer = useRef<ReturnType<typeof setTimeout>>()

  // Reloj — actualiza cada segundo para el countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Disparo exacto cuando expira el grant
  useEffect(() => {
    const delay = expiryMs - Date.now()
    if (delay <= 0) { onExpired(); return }
    expireTimer.current = setTimeout(onExpired, delay)
    return () => clearTimeout(expireTimer.current)
  }, [expiryMs, onExpired])

  // GIF cycle: play (2.4s) → pausa (2s) → play
  useEffect(() => {
    function cycle() {
      setPlaying(true)
      setGifKey(k => k + 1)
      gifTimer.current = setTimeout(() => {
        setPlaying(false)
        gifTimer.current = setTimeout(cycle, GIF_PAUSE_MS)
      }, GIF_PLAY_MS)
    }
    cycle()
    return () => clearTimeout(gifTimer.current)
  }, [])

  const remaining = expiryMs - now
  if (remaining <= 0) return null

  const remainMins = Math.floor(remaining / 60000)
  const semColor = remainMins >= 8
    ? 'rgb(34,197,94)'
    : remainMins >= 3
    ? 'rgb(245,158,11)'
    : 'rgb(210,43,29)'
  const semBg = remainMins >= 8
    ? 'rgba(34,197,94,0.12)'
    : remainMins >= 3
    ? 'rgba(245,158,11,0.12)'
    : 'rgba(210,43,29,0.12)'

  const handleClick = () => {
    chrome.runtime.sendMessage({ type: 'OPEN_POPUP' })
  }

  return (
    <div className="pw-widget" onClick={handleClick} title={`${domain} · ${formatRemaining(remaining)} restantes · Clic para abrir Picantully`}>
      <div
        className="pw-widget__badge"
        style={{ '--pw-color': semColor, '--pw-bg': semBg } as React.CSSProperties}
      >
        {formatRemaining(remaining)}
      </div>
      <img
        key={playing ? `play-${gifKey}` : 'static'}
        src={playing ? gif1 : staticPng}
        className="pw-widget__img"
        alt="Picantully"
      />
    </div>
  )
}
