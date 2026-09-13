import type { AppId } from '../data/apps'
import { DEMO_NOW } from './demoClock'
import type { DemoState } from './types'

export function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

export function formatHourLabel(hour: number): string {
  return `${pad2(hour)}:00`
}

/** Seconds -> "M:SS", used for both the grant pill and the focus ring. */
export function formatClock(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${pad2(seconds)}`
}

/** Replaces `{app}` and `{min}` placeholders in the voice-line templates. */
export function fillTemplate(template: string, appName?: string, minutes?: number): string {
  return template
    .split('{app}')
    .join(appName ?? 'eso')
    .split('{min}')
    .join(minutes !== undefined ? String(minutes) : '')
}

/** Grants shrink after every accepted deal: 5, then 3, then 2 forever. */
export function grantMinutesFor(dealsAccepted: number): number {
  const sequence = [5, 3, 2, 2]
  return sequence[Math.min(dealsAccepted, sequence.length - 1)]
}

/**
 * A granted app-time countdown always plays out over a fixed 20 real
 * seconds on screen — regardless of whether 5, 3, or 2 virtual minutes were
 * granted — so the demo never sits through an actual 5-minute wait. The two
 * edges tick at true real-time pace (1 virtual second per real second, so
 * the viewer sees 4:59, 4:58, 4:57... tick by one at a time, and the same
 * at the very end: 0:05, 0:04... 0:00) while the middle 10 real seconds
 * absorb whatever's left of the virtual total in one fast, visibly-jumping
 * countdown.
 */
export const GRANT_REAL_DURATION_SECONDS = 20
const GRANT_EDGE_SECONDS = 5

/** `realSecondsElapsed` is real seconds since the grant started (0..20). */
export function remainingGrantSeconds(totalSeconds: number, realSecondsElapsed: number): number {
  const r = clamp(realSecondsElapsed, 0, GRANT_REAL_DURATION_SECONDS)
  const fastRealSeconds = GRANT_REAL_DURATION_SECONDS - GRANT_EDGE_SECONDS * 2
  const fastVirtualSeconds = Math.max(0, totalSeconds - GRANT_EDGE_SECONDS * 2)
  const fastEnd = GRANT_REAL_DURATION_SECONDS - GRANT_EDGE_SECONDS

  let consumed: number
  if (r <= GRANT_EDGE_SECONDS) {
    consumed = r
  } else if (r <= fastEnd) {
    consumed = GRANT_EDGE_SECONDS + ((r - GRANT_EDGE_SECONDS) / fastRealSeconds) * fastVirtualSeconds
  } else {
    consumed = totalSeconds - (GRANT_REAL_DURATION_SECONDS - r)
  }

  return Math.max(0, Math.round(totalSeconds - consumed))
}

/**
 * Whether the block schedule is "active" right now, per the demo's fake
 * clock (see `demoClock.ts`). When the schedule is off entirely, distracting
 * apps negotiate around the clock instead.
 */
export function isWithinBlockWindow(
  state: Pick<DemoState, 'scheduleOn' | 'scheduleDays' | 'scheduleFrom' | 'scheduleTo'>
): boolean {
  if (!state.scheduleOn) return true
  return (
    state.scheduleDays.includes(DEMO_NOW.dayOfWeek) &&
    DEMO_NOW.hour >= state.scheduleFrom &&
    DEMO_NOW.hour < state.scheduleTo
  )
}

export function countDistracting(mode: Record<AppId, boolean>): number {
  return Object.values(mode).filter(Boolean).length
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
