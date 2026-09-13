// Design tokens: warm-dark Picantully brand.
// All surfaces use the #0b0807 / #17110f / rgba(255,255,255,0.05) palette.
// Both the overlay (content-script CSS) and the popup (inline React styles)
// reference this file — keep them in sync.

// ── Color ────────────────────────────────────────────────────────────────────

export const colors = {
  // Rojo picante — acento principal
  red: '#ef4438',
  redD: '#c41f14',
  redDeep: '#4a0c06',
  redHover: '#d63a2e',
  redGrad: 'linear-gradient(150deg, #ef4438, #c41f14)',
  redSoft: 'rgba(239,68,56,0.12)',
  redSoftBorder: 'rgba(239,68,56,0.32)',
  redGlow: 'rgba(210,43,29,0.22)',

  // Verde viral — estado concedido / OK
  green: '#51E98F',
  greenD: '#1f9e5e',
  greenText: '#1f9e5e',
  greenSoft: 'rgba(81,233,143,0.12)',
  greenSoftBorder: 'rgba(81,233,143,0.32)',

  // Gold y orange — logros / advertencias
  gold: '#ffb02e',
  orange: '#ff8a3c',
  amber: 'rgb(255,176,46)',
  amberText: 'rgb(185,125,10)',
  amberSoft: 'rgba(255,176,46,0.14)',
  amberSoftBorder: 'rgba(255,176,46,0.32)',

  // Fondos y superficies (warm-dark)
  bg: '#0b0807',
  bg2: '#17110f',
  surface: '#17110f',
  surfaceMuted: '#1e1613',
  card: 'rgba(255,255,255,0.05)',
  cardSolid: '#1e1613',

  // Bordes
  border: 'rgba(255,240,234,0.10)',
  border2: 'rgba(255,240,234,0.18)',
  fieldBorder: 'rgba(255,240,234,0.18)',
  fieldBg: 'rgba(255,255,255,0.04)',
  hairline: 'rgba(255,240,234,0.10)',
  hairlineSoft: 'rgba(255,255,255,0.04)',

  // Tinta (warm white)
  ink: '#fff5f1',
  ink900: '#fff5f1',
  ink800: '#fff5f1',
  ink600: 'rgba(255,245,241,0.82)',
  ink400: 'rgba(255,245,241,0.62)',
  ink300: 'rgba(255,245,241,0.62)',
  ink200: 'rgba(255,245,241,0.38)',
} as const

// ── Tipografía ───────────────────────────────────────────────────────────────

export const font = {
  // Space Grotesk para display/headlines, Manrope para cuerpo
  display: '"Space Grotesk", system-ui, sans-serif',
  family: '"Manrope", system-ui, sans-serif',
  mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
  trackTight: '-0.03em',
  trackTitle: '-0.04em',
  trackBody: '-0.01em',
} as const

// ── Radios ───────────────────────────────────────────────────────────────────

export const radius = {
  card: '22px',
  lg: '16px',
  md: '13px',
  sm: '10px',
  pill: '999px',
} as const

// ── Sombras ──────────────────────────────────────────────────────────────────

export const shadow = {
  card: '0 40px 110px rgba(0,0,0,0.7)',
  soft: '0 2px 8px rgba(0,0,0,0.35)',
  redGlow: '0 12px 30px rgba(210,43,29,0.4)',
} as const

// ── Animaciones ──────────────────────────────────────────────────────────────

export const transition = {
  base: 'all 0.18s ease',
  fast: '0.15s',
} as const
