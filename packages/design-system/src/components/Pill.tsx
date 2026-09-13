// Pill.tsx — etiqueta pill redonda (frases de marca, badges de estado).
// Specs portadas de ds-pica.jsx (frases de marca / badges Disponible·Nuevo).
import type { CSSProperties, ReactNode } from 'react';
import { colors, fonts } from '../tokens';

export interface PillProps {
  children?: ReactNode;
  /** Color de fondo (default: accentSoft). */
  bg?: string;
  /** Color de texto (default: coral cálido). */
  color?: string;
  /** Variante chica para badges de estado. */
  small?: boolean;
  style?: CSSProperties;
}

export function Pill({
  children,
  bg = colors.accentSoft,
  color = '#ff8a6e',
  small,
  style,
}: PillProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: small ? '4px 10px' : '9px 16px',
        borderRadius: 999,
        background: bg,
        color,
        fontWeight: small ? 800 : 700,
        fontSize: small ? 11.5 : 14,
        fontFamily: fonts.display,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

export default Pill;
