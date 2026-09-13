// fonts.ts — specs de Google Fonts de Picantully.
// Space Grotesk (display) · Manrope (cuerpo) · IBM Plex Mono (cifras).

/** URL del stylesheet de Google Fonts con los tres familias y pesos usados. */
export const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';

/** Links de preconnect + stylesheet, listos para el <head>. */
export const FONT_LINKS = [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' as const },
  { rel: 'stylesheet', href: GOOGLE_FONTS_HREF },
];

/** Especificación por familia: nombre, pesos y eje (Google Fonts). */
export const FONT_SPECS = {
  display: { family: 'Space Grotesk', weights: [400, 500, 600, 700] },
  body: { family: 'Manrope', weights: [400, 500, 600, 700, 800] },
  mono: { family: 'IBM Plex Mono', weights: [400, 500, 600] },
} as const;

/**
 * Devuelve el HTML de los <link> de fuentes como string.
 * Útil para inyectar en contextos sin framework (overlay de la extensión).
 */
export function fontLinksHtml(): string {
  return FONT_LINKS.map((l) => {
    const attrs = Object.entries(l)
      .map(([k, v]) => `${k === 'crossOrigin' ? 'crossorigin' : k}="${v}"`)
      .join(' ');
    return `<link ${attrs} />`;
  }).join('\n');
}
