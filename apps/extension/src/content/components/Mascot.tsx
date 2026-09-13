import React, { useState, useEffect, useRef } from 'react'
import gif1 from '../../assets/picantito-gif-1.gif'
import gif2 from '../../assets/picantito-gif-2.gif'
import staticPng from '../../assets/picantito-character.png'

interface MascotProps {
  isThinking: boolean
  isHappy: boolean
}

const GIF_PLAY_MS = 2400
const PAUSE_MIN_MS = 3000
const PAUSE_MAX_MS = 7000

export function Mascot({ isThinking, isHappy }: MascotProps) {
  const [src, setSrc] = useState<string>(gif2)
  const [imgKey, setImgKey] = useState(0)
  const [frozen, setFrozen] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()
  const nextGif = useRef<string>(gif1)

  useEffect(() => {
    if (isThinking || isHappy) {
      clearTimeout(timer.current)
      setFrozen(false)
      return
    }

    function play(gif: string) {
      setSrc(gif)
      setImgKey(k => k + 1)
      setFrozen(false)

      timer.current = setTimeout(() => {
        setFrozen(true)

        const pause = PAUSE_MIN_MS + Math.random() * (PAUSE_MAX_MS - PAUSE_MIN_MS)
        timer.current = setTimeout(() => {
          const next = nextGif.current
          nextGif.current = next === gif1 ? gif2 : gif1
          play(next)
        }, pause)
      }, GIF_PLAY_MS)
    }

    play(gif2)
    return () => clearTimeout(timer.current)
  }, [isThinking, isHappy])

  if (isThinking) {
    return (
      <div className="picantully-mascot">
        <img src={gif1} alt="El Picante" />
      </div>
    )
  }

  if (isHappy) {
    return (
      <div className="picantully-mascot picantully-mascot--happy">
        <img src={gif2} alt="El Picante" />
      </div>
    )
  }

  return (
    <div className="picantully-mascot picantully-mascot--float">
      <img key={imgKey} src={frozen ? staticPng : src} alt="El Picante" />
    </div>
  )
}
