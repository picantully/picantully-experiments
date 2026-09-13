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
 * granted — so the demo never sits through an actual 5-minute wait. It's
 * paced slow/fast/slow instead of linear: the first and last 5 real seconds
 * each burn through only 15% of the virtual time (a slow start, then a
 * suspenseful crawl toward 0:00), while the middle 10 real seconds rush
 * through the remaining 70% — the clock visibly races down in the middle.
 */
export const GRANT_REAL_DURATION_SECONDS = 20
const GRANT_SLOW_PHASE_SECONDS = 5
const GRANT_SLOW_PHASE_SHARE = 0.15

/** `realSecondsElapsed` is real seconds since the grant started (0..20). */
export function remainingGrantSeconds(totalSeconds: number, realSecondsElapsed: number): number {
  const r = clamp(realSecondsElapsed, 0, GRANT_REAL_DURATION_SECONDS)
  const fastPhaseSeconds = GRANT_REAL_DURATION_SECONDS - GRANT_SLOW_PHASE_SECONDS * 2
  const fastShare = 1 - GRANT_SLOW_PHASE_SHARE * 2
  const slowEnd = GRANT_REAL_DURATION_SECONDS - GRANT_SLOW_PHASE_SECONDS

  let consumedFraction: number
  if (r <= GRANT_SLOW_PHASE_SECONDS) {
    consumedFraction = (r / GRANT_SLOW_PHASE_SECONDS) * GRANT_SLOW_PHASE_SHARE
  } else if (r <= slowEnd) {
    consumedFraction = GRANT_SLOW_PHASE_SHARE + ((r - GRANT_SLOW_PHASE_SECONDS) / fastPhaseSeconds) * fastShare
  } else {
    consumedFraction = 1 - GRANT_SLOW_PHASE_SHARE + ((r - slowEnd) / GRANT_SLOW_PHASE_SECONDS) * GRANT_SLOW_PHASE_SHARE
  }

  return Math.max(0, Math.round(totalSeconds * (1 - consumedFraction)))
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
