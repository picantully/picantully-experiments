/**
 * Single source of truth for the demo's fake "current time".
 *
 * Deliberate simplification carried over from the source spec: the demo
 * fakes a fixed clock (see the "Martes, 15:40" copy in the top bar) instead
 * of reading the real wall-clock time, so the negotiation flow is
 * reproducible no matter when someone opens the page. `dayOfWeek` uses
 * `Date#getDay()` numbering (2 = Tuesday), matching `scheduleDays`.
 */
export const DEMO_NOW = {
  dayOfWeek: 2,
  dayLabel: 'Martes',
  hour: 15,
  hourLabel: '15:40'
} as const

/** Activity-feed timestamp — flavor text only, e.g. "15:4x" with a random trailing digit. */
export function fakeActivityTime(): string {
  return `${DEMO_NOW.hour}:4${Math.floor(Math.random() * 9)}`
}
