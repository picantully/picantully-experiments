// Button.tsx — botón de Picantully. Kinds: red | green | ghost | dark.
// Specs portadas de focus-kit.jsx (Btn): height 52, radius 15, weight 800.
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from 'react';
import { colors, gradients, radii, shadows } from '../tokens';

export type ButtonKind = 'red' | 'green' | 'ghost' | 'dark';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  kind?: ButtonKind;
  full?: boolean;
  children?: ReactNode;
}

const KIND_STYLES: Record<ButtonKind, CSSProperties> = {
  red: { background: gradients.red, color: '#fff', boxShadow: shadows.red },
  green: { background: gradients.green, color: '#06160e', boxShadow: shadows.green },
  ghost: { background: colors.card, color: colors.ink, border: `1px solid ${colors.border2}` },
  dark: { background: colors.cardSolid, color: colors.ink, border: `1px solid ${colors.border}` },
};

export function Button({ kind = 'red', full, children, style, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      style={{
        height: 52,
        padding: '0 24px',
        borderRadius: radii.button,
        border: 'none',
        cursor: 'pointer',
        fontWeight: 800,
        fontSize: 15.5,
        fontFamily: '"Manrope", system-ui, sans-serif',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 9,
        transition: 'transform .12s ease, filter .2s, background .15s',
        width: full ? '100%' : 'auto',
        ...KIND_STYLES[kind],
        ...style,
      }}
    >
      {children}
    </button>
  );
}

export default Button;
