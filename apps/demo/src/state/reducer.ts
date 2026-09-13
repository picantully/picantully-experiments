import { APPS, getApp, type AppId } from '../data/apps'
import { REPLIES, VOICES } from '../data/voices'
import { fakeActivityTime } from './demoClock'
import { clamp, fillTemplate, grantMinutesFor, isWithinBlockWindow } from './derived'
import type { ActivityEntry, ActivityKind, DemoAction, DemoState } from './types'

let idCounter = 0
function nextId(): string {
  idCounter += 1
  return `id-${idCounter}`
}

const INITIAL_MODE: Record<AppId, boolean> = {
  ig: true,
  tt: true,
  yt: true,
  x: true,
  rb: true,
  sp: false,
  nt: false,
  cl: false,
  wa: false,
  gm: false,
  mp: false
}

export const initialDemoState: DemoState = {
  screen: 'home',
  tab: 'casa',
  mode: INITIAL_MODE,
  tone: 'picante',
  hardness: 2,
  scheduleOn: true,
  scheduleDays: [1, 2, 3, 4, 5],
  scheduleFrom: 9,
  scheduleTo: 18,
  chatAppId: null,
  messages: [],
  turns: 0,
  resistance: 2,
  dealOpen: false,
  typing: false,
  dealsAccepted: 0,
  openAppId: null,
  grantSeconds: 0,
  focusLength: 25,
  focusSeconds: 25 * 60,
  focusRunning: false,
  focusSessionsDone: 0,
  demoSpeed: 1,
  gainedMinutes: 0,
  winsGivenUp: 0,
  toast: '',
  toastToken: 0,
  activity: [
    { id: nextId(), kind: 'block', text: 'Frenaste TikTok sin pedir nada', time: '14:12' },
    { id: nextId(), kind: 'deal', text: 'Trato de 5 min en Instagram', time: '11:48' },
    { id: nextId(), kind: 'focus', text: 'Sesión de foco de 25 min', time: '10:05' }
  ],
  pendingBotReply: null
}

function flash(state: DemoState, text: string): DemoState {
  return { ...state, toast: text, toastToken: state.toastToken + 1 }
}

function logActivity(state: DemoState, kind: ActivityKind, text: string): DemoState {
  const entry: ActivityEntry = { id: nextId(), kind, text, time: fakeActivityTime() }
  return { ...state, activity: [entry, ...state.activity].slice(0, 4) }
}

/** Opens (or re-opens, on grant expiry) the negotiation chat for an app. */
function openChat(state: DemoState, appId: AppId, expired: boolean): DemoState {
  const voice = VOICES[state.tone]
  const app = getApp(appId)
  const greet = expired
    ? `Se acabó el tiempo de ${app?.name ?? 'eso'}. Volvimos al principio: contame por qué debería darte más.`
    : fillTemplate(voice.greet, app?.name)
  return {
    ...state,
    screen: 'chat',
    chatAppId: appId,
    messages: [{ id: nextId(), from: 'bot', text: greet }],
    turns: 0,
    resistance: expired ? state.hardness + 1 : state.hardness,
    dealOpen: false,
    typing: false,
    openAppId: null,
    grantSeconds: 0,
    pendingBotReply: null
  }
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  switch (action.type) {
    case 'TOGGLE_APP_MODE':
      return { ...state, mode: { ...state.mode, [action.id]: !state.mode[action.id] } }

    case 'APPLY_PRESET': {
      // Categorization derived from each AppDef's `cat` (data/apps.ts) instead
      // of a separately-maintained id list, so presets can't drift out of
      // sync with the app catalog. Work/utility/messaging apps never count as
      // distracting; music only does late at night; everything else (social,
      // video, games) is blocked in both work hours and at night.
      const NEVER_DISTRACTING_CATS = new Set(['Trabajo', 'Mensajes', 'Utilidades'])
      const NIGHT_ONLY_CATS = new Set(['Música'])
      // Building a complete Record from a runtime loop needs an assertion for
      // the compiler either way; it's sound here because AppId is derived
      // from APPS itself (see data/apps.ts), so every key gets assigned.
      const nextMode = {} as Record<AppId, boolean>
      for (const app of APPS) {
        if (action.preset === 'libre') nextMode[app.id] = false
        else if (NEVER_DISTRACTING_CATS.has(app.cat)) nextMode[app.id] = false
        else if (NIGHT_ONLY_CATS.has(app.cat)) nextMode[app.id] = action.preset === 'noche'
        else nextMode[app.id] = true
      }
      const message =
        action.preset === 'libre'
          ? 'Todo libre. Confío en vos, no me falles.'
          : action.preset === 'laburo'
            ? 'Modo laburo puesto.'
            : 'Modo noche puesto.'
      return flash({ ...state, mode: nextMode }, message)
    }

    case 'SET_TONE':
      return { ...state, tone: action.tone }

    case 'SET_HARDNESS':
      return { ...state, hardness: action.hardness }

    case 'TOGGLE_SCHEDULE':
      return { ...state, scheduleOn: !state.scheduleOn }

    case 'TOGGLE_SCHEDULE_DAY': {
      const has = state.scheduleDays.includes(action.day)
      const scheduleDays = has
        ? state.scheduleDays.filter((d) => d !== action.day)
        : [...state.scheduleDays, action.day].sort((a, b) => a - b)
      return { ...state, scheduleDays }
    }

    // Both edges are steppable and clamped so `from` can never cross `to`
    // (the source mockup only let you widen the window — this fixes that).
    case 'ADJUST_SCHEDULE_FROM':
      return { ...state, scheduleFrom: clamp(state.scheduleFrom + action.delta, 0, state.scheduleTo - 1) }

    case 'ADJUST_SCHEDULE_TO':
      return { ...state, scheduleTo: clamp(state.scheduleTo + action.delta, state.scheduleFrom + 1, 24) }

    case 'PICK_FOCUS_LENGTH':
      return {
        ...state,
        focusLength: action.length,
        focusSeconds: state.focusRunning ? state.focusSeconds : action.length * 60
      }

    case 'SET_TAB':
      return { ...state, tab: action.tab }

    case 'GO_HOME':
      // Clear any in-flight bot reply so its scheduled timer (see
      // useDemoState) can't land after we've left the chat screen.
      return { ...state, screen: 'home', pendingBotReply: null, typing: false }

    case 'GO_POMODORO':
      return { ...state, screen: 'pomodoro' }

    case 'GO_PICANTULLY':
      return { ...state, screen: 'picantully', tab: 'casa' }

    case 'TRY_OPEN_APP': {
      const distracting = !!state.mode[action.id]
      if (state.focusRunning && distracting) {
        // Route through the same reset path as any other fresh negotiation
        // so stale turns/resistance from a previous app's chat never leak in.
        return openChat(state, action.id, false)
      }
      // Reopening the very app that's already on loan resumes it instead of
      // forcing a brand-new negotiation — grantSeconds keeps ticking in the
      // background (see TICK) whether or not this screen is on screen.
      if (state.openAppId === action.id && state.grantSeconds > 0) {
        return { ...state, screen: 'app' }
      }
      if (distracting && isWithinBlockWindow(state)) {
        return openChat(state, action.id, false)
      }
      if (distracting) {
        return flash({ ...state, screen: 'app', openAppId: action.id, grantSeconds: 0 }, 'Fuera del horario de bloqueo. Pasá tranquilo.')
      }
      return { ...state, screen: 'app', openAppId: action.id, grantSeconds: 0 }
    }

    case 'START_FOCUS_SESSION':
      // Clear any in-flight bot reply — see GO_HOME.
      if (state.focusRunning) return { ...state, screen: 'pomodoro', pendingBotReply: null, typing: false }
      return {
        ...state,
        screen: 'pomodoro',
        focusSeconds: state.focusLength * 60,
        focusRunning: true,
        pendingBotReply: null,
        typing: false
      }

    case 'START_FOCUS_SESSION_FROM_DEAL':
      return { ...state, screen: 'pomodoro', focusSeconds: state.focusLength * 60, focusRunning: true, dealOpen: false }

    case 'TOGGLE_FOCUS_RUNNING':
      if (state.focusSeconds === 0) return { ...state, focusSeconds: state.focusLength * 60, focusRunning: true }
      return { ...state, focusRunning: !state.focusRunning }

    case 'TOGGLE_DEMO_SPEED':
      return { ...state, demoSpeed: state.demoSpeed === 1 ? 20 : 1 }

    case 'ACCEPT_DEAL': {
      if (!state.chatAppId || !state.dealOpen) return state
      const app = getApp(state.chatAppId)
      const minutes = grantMinutesFor(state.dealsAccepted)
      const withLog = logActivity(state, 'deal', `Trato de ${minutes} min en ${app?.name ?? ''}`)
      return {
        ...withLog,
        screen: 'app',
        openAppId: state.chatAppId,
        grantSeconds: minutes * 60,
        dealsAccepted: state.dealsAccepted + 1,
        dealOpen: false
      }
    }

    case 'GIVE_UP': {
      const app = getApp(state.chatAppId)
      const withLog = logActivity(state, 'block', `Cerraste ${app?.name ?? 'la app'} sin entrar`)
      return flash(
        {
          ...withLog,
          screen: 'home',
          gainedMinutes: state.gainedMinutes + 12,
          winsGivenUp: state.winsGivenUp + 1,
          dealOpen: false,
          pendingBotReply: null
        },
        'Bien ahí. +12 min para vos.'
      )
    }

    case 'USER_SEND': {
      // Also guard against a reply already in flight — without this, a fast
      // double-send during the bot-thinking window advances turns/resistance
      // twice but only ever shows one reply, desyncing visible chat from
      // internal state.
      if (state.dealOpen || state.focusRunning || state.pendingBotReply || state.typing) return state
      const app = getApp(state.chatAppId)
      const voice = VOICES[state.tone]
      const turns = state.turns + 1
      // 70% chance the excuse actually wears the negotiator down a notch.
      const resistance = Math.max(0, state.resistance - (action.progressRoll < 0.3 ? 0 : 1))
      const messages = [...state.messages, { id: nextId(), from: 'me' as const, text: action.text }]

      let replyText: string
      let deal = false
      if (resistance === 0) {
        replyText = fillTemplate(voice.grant, app?.name, grantMinutesFor(state.dealsAccepted))
        deal = true
      } else if (action.chipKey && turns === 1) {
        replyText = fillTemplate(REPLIES[action.chipKey], app?.name)
      } else {
        replyText = fillTemplate(voice.denials[(turns + resistance) % voice.denials.length], app?.name)
      }

      return { ...state, messages, turns, resistance, pendingBotReply: { text: replyText, deal } }
    }

    case 'BOT_TYPING_START':
      // Guard against a timer that fired after the chat was already left
      // (see GO_HOME/START_FOCUS_SESSION) — belt-and-suspenders alongside the
      // effect cleanup in useDemoState.
      if (!state.pendingBotReply) return state
      return { ...state, typing: true }

    case 'BOT_SAY':
      if (!state.pendingBotReply) return state
      return {
        ...state,
        typing: false,
        dealOpen: action.deal,
        pendingBotReply: null,
        messages: [...state.messages, { id: nextId(), from: 'bot', text: action.text }]
      }

    case 'TICK': {
      if (state.focusRunning) {
        const next = state.focusSeconds - state.demoSpeed
        if (next <= 0) {
          // The source spec never logs completed focus sessions to the
          // activity feed even though the feed has a dedicated 'focus' kind
          // — an obvious gap, closed here so a demo session actually shows up.
          const withLog = logActivity(state, 'focus', `Sesión de foco de ${state.focusLength} min`)
          return flash(
            {
              ...withLog,
              focusSeconds: 0,
              focusRunning: false,
              focusSessionsDone: state.focusSessionsDone + 1,
              gainedMinutes: state.gainedMinutes + state.focusLength
            },
            `Sesión completa. +${state.focusLength} min para vos.`
          )
        }
        return { ...state, focusSeconds: next }
      }
      // Granted time keeps counting down regardless of which screen is
      // shown, so leaving and returning to a granted app reflects real
      // elapsed time instead of a countdown that freezes on GO_HOME and then
      // gets silently discarded on reopen.
      if (state.grantSeconds > 0) {
        const next = state.grantSeconds - state.demoSpeed
        if (next <= 0 && state.openAppId) {
          // Only jump into the "time's up" chat if the user is actually
          // looking at the app right now; if they're elsewhere, just clear
          // the grant quietly — reopening it starts a fresh negotiation.
          if (state.screen === 'app') {
            return openChat({ ...state, grantSeconds: 0 }, state.openAppId, true)
          }
          return { ...state, grantSeconds: 0, openAppId: null }
        }
        return { ...state, grantSeconds: Math.max(0, next) }
      }
      return state
    }

    case 'CLEAR_TOAST':
      if (action.token !== state.toastToken) return state
      return { ...state, toast: '' }

    default:
      return state
  }
}
