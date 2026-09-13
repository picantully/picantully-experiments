import type { AppId } from '../data/apps'
import type { ReplyKey, Tone } from '../data/voices'

export type Screen = 'home' | 'chat' | 'app' | 'pomodoro' | 'picantully'
export type PicantullyTab = 'casa' | 'apps' | 'foco' | 'actitud'

/** How many denials it takes to wear the negotiator down. Lower = softer. */
export type Hardness = 1 | 2 | 4

export type FocusLength = 15 | 25 | 50

export type ChatMessage = {
  id: string
  from: 'bot' | 'me'
  text: string
}

export type ActivityKind = 'block' | 'deal' | 'focus'

export type ActivityEntry = {
  id: string
  kind: ActivityKind
  text: string
  time: string
}

export interface DemoState {
  screen: Screen
  tab: PicantullyTab

  /** Which apps are currently marked as distracting (id -> distracting). */
  mode: Record<AppId, boolean>

  tone: Tone
  hardness: Hardness

  scheduleOn: boolean
  /** 0 = Sunday … 6 = Saturday, mirroring Date#getDay(). */
  scheduleDays: readonly number[]
  scheduleFrom: number
  scheduleTo: number

  /** Active negotiation, if any. */
  chatAppId: AppId | null
  messages: readonly ChatMessage[]
  turns: number
  resistance: number
  dealOpen: boolean
  typing: boolean
  /** Total deals accepted across the whole session — shrinks future grants. */
  dealsAccepted: number

  /** App currently "open" on the mock phone. */
  openAppId: AppId | null
  /** Seconds left of borrowed time before it auto-expires back into chat. */
  grantSeconds: number

  focusLength: FocusLength
  focusSeconds: number
  focusRunning: boolean
  focusSessionsDone: number
  /** 1x = real time, 20x = accelerated demo speed. */
  demoSpeed: 1 | 20

  gainedMinutes: number
  winsGivenUp: number
  toast: string
  /** Bumped on every flash() so a stale timeout never clears a newer toast. */
  toastToken: number

  activity: readonly ActivityEntry[]

  /** Set right after the user sends a message; an effect turns it into a
   *  typing indicator, then a bot reply, on a short delay. Kept in state
   *  (rather than only in a ref) so the reducer stays the single source of
   *  truth and effects are pure "react to state" schedulers. */
  pendingBotReply: { text: string; deal: boolean } | null
}

export type DemoAction =
  | { type: 'TOGGLE_APP_MODE'; id: AppId }
  | { type: 'APPLY_PRESET'; preset: 'laburo' | 'noche' | 'libre' }
  | { type: 'SET_TONE'; tone: Tone }
  | { type: 'SET_HARDNESS'; hardness: Hardness }
  | { type: 'TOGGLE_SCHEDULE' }
  | { type: 'TOGGLE_SCHEDULE_DAY'; day: number }
  | { type: 'ADJUST_SCHEDULE_FROM'; delta: number }
  | { type: 'ADJUST_SCHEDULE_TO'; delta: number }
  | { type: 'PICK_FOCUS_LENGTH'; length: FocusLength }
  | { type: 'SET_TAB'; tab: PicantullyTab }
  | { type: 'GO_HOME' }
  | { type: 'GO_POMODORO' }
  | { type: 'GO_PICANTULLY' }
  | { type: 'TRY_OPEN_APP'; id: AppId }
  | { type: 'START_FOCUS_SESSION' }
  | { type: 'START_FOCUS_SESSION_FROM_DEAL' }
  | { type: 'TOGGLE_FOCUS_RUNNING' }
  | { type: 'TOGGLE_DEMO_SPEED' }
  | { type: 'ACCEPT_DEAL' }
  | { type: 'GIVE_UP' }
  | { type: 'USER_SEND'; text: string; chipKey?: ReplyKey; progressRoll: number }
  | { type: 'BOT_TYPING_START' }
  | { type: 'BOT_SAY'; text: string; deal: boolean }
  | { type: 'TICK' }
  | { type: 'CLEAR_TOAST'; token: number }
