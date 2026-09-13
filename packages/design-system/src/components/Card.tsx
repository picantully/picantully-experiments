// Card.tsx — contenedor base. radius 20, card glass o accentSoft.
// Specs portadas de app-theme.jsx (Card).
import type { CSSProperties, ReactNode } from 'react';
import { colors, radii } from '../tokens';

export interface CardProps {
  children?: ReactNode;
  /** Fondo accentSoft sin borde. */
  soft?: boolean;
  /** Padding interno (px). */
  pad?: number;
  onClick?: () => void;
  style?: CSSProperties;
  className?: string;
}

export function Card({ children, soft, pad = 16, onClick, style, className }: CardProps) {
  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        background: soft ? colors.accentSoft : colors.card,
        border: `1px solid ${soft ? 'transparent' : colors.border}`,
        borderRadius: radii.card,
        padding: pad,
        cursor: onClick ? 'pointer' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
