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
