import React, { useEffect, useRef } from 'react'
import type { ChatMessage } from '../../types'

interface ChatLogProps {
  messages: ChatMessage[]
  isLoading: boolean
}

export function ChatLog({ messages, isLoading }: ChatLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Auto-scroll al último mensaje
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  if (messages.length === 0 && !isLoading) return null

  return (
    <div className="picantully-chat">
      {messages.map((msg, i) => (
        <div key={i} className={`picantully-bubble picantully-bubble--${msg.role}`}>
          {msg.text}
        </div>
      ))}

      {isLoading && (
        <div className="picantully-bubble picantully-bubble--mascota picantully-bubble--loading">
          <span className="picantully-dots">
            <span />
            <span />
            <span />
          </span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
