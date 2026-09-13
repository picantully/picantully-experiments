import { useCallback, useEffect, useMemo, useReducer } from 'react'
import type { AppId } from '../data/apps'
import type { ReplyKey, Tone } from '../data/voices'
import { demoReducer, initialDemoState } from './reducer'
import type { DemoState, FocusLength, Hardness, PicantullyTab } from './types'

const TICK_MS = 1000
/** Pause before the typing indicator appears — feels like the bot is reading. */
const BOT_THINK_MS = 250
/** How long the typing indicator stays up before the reply lands. */
const BOT_TYPE_MS = 850
const TOAST_MS = 2400

/**
 * Owns the whole demo's state via a single reducer, and wires the timers
 * that turn synchronous reducer transitions into the app's paced,
 * human-feeling flow (tick loop, typing indicator, toast auto-dismiss).
 */
export function useDemoState() {
  const [state, dispatch] = useReducer(demoReducer, initialDemoState)

  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: 'TICK' }), TICK_MS)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    if (!state.pendingBotReply) return
    const { text, deal } = state.pendingBotReply
    const typingTimer = window.setTimeout(() => dispatch({ type: 'BOT_TYPING_START' }), BOT_THINK_MS)
    const replyTimer = window.setTimeout(() => dispatch({ type: 'BOT_SAY', text, deal }), BOT_THINK_MS + BOT_TYPE_MS)
    return () => {
      window.clearTimeout(typingTimer)
      window.clearTimeout(replyTimer)
    }
  }, [state.pendingBotReply])

  useEffect(() => {
    if (!state.toast) return
    const token = state.toastToken
    const timer = window.setTimeout(() => dispatch({ type: 'CLEAR_TOAST', token }), TOAST_MS)
    return () => window.clearTimeout(timer)
  }, [state.toast, state.toastToken])

  const tryOpenApp = useCallback((id: AppId) => dispatch({ type: 'TRY_OPEN_APP', id }), [])
  const goHome = useCallback(() => dispatch({ type: 'GO_HOME' }), [])
  const goPomodoro = useCallback(() => dispatch({ type: 'GO_POMODORO' }), [])
  const goPicantully = useCallback(() => dispatch({ type: 'GO_PICANTULLY' }), [])
  const setTab = useCallback((tab: PicantullyTab) => dispatch({ type: 'SET_TAB', tab }), [])
  const toggleAppMode = useCallback((id: AppId) => dispatch({ type: 'TOGGLE_APP_MODE', id }), [])
  const applyPreset = useCallback(
    (preset: 'laburo' | 'noche' | 'libre') => dispatch({ type: 'APPLY_PRESET', preset }),
    []
  )
  const setTone = useCallback((tone: Tone) => dispatch({ type: 'SET_TONE', tone }), [])
  const setHardness = useCallback((hardness: Hardness) => dispatch({ type: 'SET_HARDNESS', hardness }), [])
  const toggleSchedule = useCallback(() => dispatch({ type: 'TOGGLE_SCHEDULE' }), [])
  const toggleScheduleDay = useCallback((day: number) => dispatch({ type: 'TOGGLE_SCHEDULE_DAY', day }), [])
  const adjustScheduleFrom = useCallback((delta: number) => dispatch({ type: 'ADJUST_SCHEDULE_FROM', delta }), [])
  const adjustScheduleTo = useCallback((delta: number) => dispatch({ type: 'ADJUST_SCHEDULE_TO', delta }), [])
  const pickFocusLength = useCallback((length: FocusLength) => dispatch({ type: 'PICK_FOCUS_LENGTH', length }), [])
  const startFocusSession = useCallback(() => dispatch({ type: 'START_FOCUS_SESSION' }), [])
  const startFocusSessionFromDeal = useCallback(() => dispatch({ type: 'START_FOCUS_SESSION_FROM_DEAL' }), [])
  const toggleFocusRunning = useCallback(() => dispatch({ type: 'TOGGLE_FOCUS_RUNNING' }), [])
  const toggleDemoSpeed = useCallback(() => dispatch({ type: 'TOGGLE_DEMO_SPEED' }), [])
  const acceptDeal = useCallback(() => dispatch({ type: 'ACCEPT_DEAL' }), [])
  const giveUp = useCallback(() => dispatch({ type: 'GIVE_UP' }), [])
  const sendMessage = useCallback((text: string, chipKey?: ReplyKey) => {
    dispatch({ type: 'USER_SEND', text, chipKey, progressRoll: Math.random() })
  }, [])

  const actions = useMemo(
    () => ({
      tryOpenApp,
      goHome,
      goPomodoro,
      goPicantully,
      setTab,
      toggleAppMode,
      applyPreset,
      setTone,
      setHardness,
      toggleSchedule,
      toggleScheduleDay,
      adjustScheduleFrom,
      adjustScheduleTo,
      pickFocusLength,
      startFocusSession,
      startFocusSessionFromDeal,
      toggleFocusRunning,
      toggleDemoSpeed,
      acceptDeal,
      giveUp,
      sendMessage
    }),
    [
      tryOpenApp,
      goHome,
      goPomodoro,
      goPicantully,
      setTab,
      toggleAppMode,
      applyPreset,
      setTone,
      setHardness,
      toggleSchedule,
      toggleScheduleDay,
      adjustScheduleFrom,
      adjustScheduleTo,
      pickFocusLength,
      startFocusSession,
      startFocusSessionFromDeal,
      toggleFocusRunning,
      toggleDemoSpeed,
      acceptDeal,
      giveUp,
      sendMessage
    ]
  )

  return { state, actions }
}

export type DemoActions = ReturnType<typeof useDemoState>['actions']
export type { DemoState }
