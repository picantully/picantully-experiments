// tokens.ts — Picantully design tokens. Única fuente de verdad.
// Dark cálido premium · rojo picante + verde viral.
// Valores canónicos extraídos del handoff de Claude Design
// (focus-kit.jsx + PICA_VARS del HTML "Picantully Finance - Design System").

/** Paleta de color base. */
export const colors = {
  // ── Marca · rojo picante ──────────────────────────────────────────
  /** Rojo de marca (primario/acento). */
  accent: '#D22B1D',
  /** Rojo acento oscuro. */
  accentDark: '#a81f10',
  /** Rojo profundo (fondo de gradientes de card). */
  accentDeep: '#4a0c06',
  /** Rojo acento traslúcido (chips, fondos suaves). */
  accentSoft: 'rgba(210,43,29,0.15)',
  /** Glow rojo (sombras/halos). */
  glow: 'rgba(210,43,29,0.4)',
  /** Rojo vivo (variante para "gasto"/expense). */
  red: '#ef4438',
  /** Rojo vivo oscuro (par de gradiente). */
  redDark: '#c41f14',

  // ── Verde viral ───────────────────────────────────────────────────
  /** Verde de éxito / ingreso (mint). */
  green: '#51E98F',
  /** Verde oscuro (par de gradiente, PICA usa #179e5e). */
  greenDark: '#1f9e5e',
  /** Verde info (sky en el tema base, acá verdoso). */
  greenInfo: '#2bd9a0',
  /** Verde info oscuro. */
  greenInfoDark: '#179e5e',

  // ── Acentos cálidos ───────────────────────────────────────────────
  /** Oro / logros. */
  gold: '#ffb02e',
  /** Naranja. */
  orange: '#ff8a3c',
  /** Coral. */
  coral: '#ff6b4d',
  /** Gris transferencia. */
  transfer: '#9b938c',

  // ── Superficies ───────────────────────────────────────────────────
  /** Fondo de app. */
  bg: '#0b0807',
  /** Superficie secundaria. */
  bg2: '#17110f',
  /** Card glass (sobre fondo). */
  card: 'rgba(255,255,255,0.05)',
  /** Card sólida. */
  cardSolid: '#1e1613',
  /** Superficie 2 (modales/sheets). */
  surface2: '#241612',

  // ── Bordes ────────────────────────────────────────────────────────
  /** Borde sutil. */
  border: 'rgba(255,240,234,0.10)',
  /** Borde más marcado. */
  border2: 'rgba(255,240,234,0.18)',

  // ── Texto ─────────────────────────────────────────────────────────
  /** Tinta principal. */
  ink: '#fff5f1',
  /** Texto atenuado. */
  mut: 'rgba(255,245,241,0.60)',
  /** Texto más atenuado. */
  mut2: 'rgba(255,245,241,0.38)',
} as const;

/** Gradientes de marca. */
export const gradients = {
  /** Botón/superficie roja. */
  red: 'linear-gradient(150deg, #ef4438, #c41f14)',
  /** Botón/superficie verde. */
  green: 'linear-gradient(150deg, #6cf0a3, #1f9e5e)',
  /** Card de balance roja (acc → accD → accDeep). */
  card: `linear-gradient(155deg, ${colors.accent} 0%, ${colors.accentDark} 60%, ${colors.accentDeep} 100%)`,
  /** Texto "picante" (clip de gradiente). */
  text: 'linear-gradient(120deg, #ff6a4d, #ef4438)',
} as const;

/** Familias tipográficas (Google Fonts). */
export const fonts = {
  /** Display / titulares. */
  display: '"Space Grotesk", system-ui, sans-serif',
  /** Cuerpo. */
  body: '"Manrope", system-ui, sans-serif',
  /** Cifras / monoespaciada. */
  mono: '"IBM Plex Mono", ui-monospace, monospace',
} as const;

/** Radios de borde. */
export const radii = {
  /** Card. */
  card: 20,
  /** Botón. */
  button: 15,
  /** Pill / redondo total. */
  pill: 999,
  /** Ícono / contenedor chico. */
  icon: 13,
} as const;

/** Sombras. */
export const shadows = {
  /** Glow rojo de botón primario. */
  red: '0 12px 30px rgba(210,43,29,0.4), inset 0 1px 1px rgba(255,255,255,0.22)',
  /** Glow verde de botón. */
  green: '0 12px 30px rgba(81,233,143,0.3)',
  /** Glow de card de balance. */
  card: `0 16px 36px ${colors.glow}`,
  /** Elevación oscura genérica. */
  dark: '0 12px 40px rgba(0,0,0,0.5)',
  /** Drop-shadow del mascot. */
  mascot: 'drop-shadow(0 10px 20px rgba(0,0,0,0.45))',
} as const;

/** Escala de espaciado (px). */
export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  '2xl': 40,
} as const;

/** Animaciones (keyframes + duraciones de referencia). */
export const animations = {
  float: 'pica-float 5s ease-in-out infinite',
  in: 'pica-in .34s cubic-bezier(.2,.7,.3,1) both',
  pop: 'pica-pop .2s ease both',
  bubble: 'pica-bubble .25s ease both',
} as const;

/** Objeto único con todos los tokens. */
export const tokens = {
  colors,
  gradients,
  fonts,
  radii,
  shadows,
  spacing,
  animations,
} as const;

export type Tokens = typeof tokens;
export default tokens;
