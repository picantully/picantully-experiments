// index.ts — entry principal de @picantully/design-system.
// Tokens + componentes + fuentes. Los íconos viven en el subpath ./icons,
// la CSS en ./tokens.css, y los assets en ./assets/*.

// ── Tokens (única fuente de verdad) ──
export {
  tokens,
  colors,
  gradients,
  fonts,
  radii,
  shadows,
  spacing,
  animations,
} from './tokens';
export type { Tokens } from './tokens';

// ── Fuentes ──
export { GOOGLE_FONTS_HREF, FONT_LINKS, FONT_SPECS, fontLinksHtml } from './fonts';

// ── Componentes ──
export * from './components';

// ── Íconos (también disponibles en el subpath ./icons) ──
export { Icon, ICON_NAMES } from './icons';
export type { IconName, IconProps } from './icons';

export { default } from './tokens';
