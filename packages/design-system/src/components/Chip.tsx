// Chip.tsx — chip/segmented. Specs portadas de app-theme.jsx (Chip).
import type { CSSProperties, ReactNode } from 'react';
import { colors } from '../tokens';

export interface ChipProps {
  children?: ReactNode;
  active?: boolean;
  /** Color de fondo cuando está activo (default: rojo de marca). */
  color?: string;
  onClick?: () => void;
  style?: CSSProperties;
}

export function Chip({ children, active, color, onClick, style }: ChipProps) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '8px 14px',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        cursor: onClick ? 'pointer' : undefined,
        background: active ? color || colors.accent : colors.card,
        color: active ? '#fff' : colors.mut,
        border: `1px solid ${active ? 'transparent' : colors.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Chip;
