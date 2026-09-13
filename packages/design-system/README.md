# @picantully/design-system

Sistema de diseño compartido de Picantully — dark cálido premium, rojo picante + verde viral.
Única fuente de verdad de tokens, íconos y componentes, consumible desde `apps/web` (Next 16)
y `apps/extension` (Vite).

## Instalación (workspace)

```jsonc
// en el package.json del app
"dependencies": {
  "@picantully/design-system": "workspace:*"
}
```

## Imports

```ts
// Tokens (objeto TS, única fuente de verdad)
import { tokens, colors, gradients, fonts, radii, shadows } from '@picantully/design-system';

// Componentes
import { Button, Card, Chip, Pill, Bar, Chili, GoogleG } from '@picantully/design-system';

// Íconos (subpath dedicado)
import { Icon, ICON_NAMES } from '@picantully/design-system/icons';
import type { IconName } from '@picantully/design-system/icons';

// Fuentes (Google Fonts)
import { GOOGLE_FONTS_HREF, FONT_LINKS } from '@picantully/design-system';
```

```css
/* CSS custom properties (contextos no-React: overlay de la extensión, Tailwind @theme) */
@import '@picantully/design-system/tokens.css';
/* expone :root y .pica con --pica-* (ej: var(--pica-accent)) */
```

```ts
// Assets de marca (resueltos por el bundler del consumidor)
import logo from '@picantully/design-system/assets/picantully-logo.png';
import still from '@picantully/design-system/assets/picantully.png';
import proud from '@picantully/design-system/assets/picantully-1.gif';
import excited from '@picantully/design-system/assets/picantully-2.gif';

// El mascot recibe las URLs ya resueltas:
<Chili srcMap={{ still, proud, excited }} mood="proud" float />
```

## Assets

| Archivo                                            | Uso                          |
| -------------------------------------------------- | ---------------------------- |
| `@picantully/design-system/assets/picantully.png`   | mascot `still` + logo redondo |
| `@picantully/design-system/assets/picantully-1.gif` | mascot `proud` (animado)      |
| `@picantully/design-system/assets/picantully-2.gif` | mascot `excited` (animado)    |
| `@picantully/design-system/assets/picantully-logo.png` | logo de marca / app icon   |

## Build

```sh
pnpm --filter @picantully/design-system build
```

Genera `dist/` con ESM + `.d.ts` y copia `tokens.css`. React queda como `peerDependency`.
