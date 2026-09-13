// Bar.tsx — barra de progreso horizontal. Specs portadas de app-theme.jsx (Bar).
import { colors } from '../tokens';

export interface BarProps {
  /** Porcentaje 0–100. */
  pct: number;
  /** Color del relleno (default: rojo de marca). */
  color?: string;
  /** Alto (px). */
  h?: number;
  /** Color del track. */
  bg?: string;
}

export function Bar({ pct, color = colors.accent, h = 8, bg = 'rgba(255,255,255,0.08)' }: BarProps) {
  return (
    <div style={{ height: h, borderRadius: h, background: bg, overflow: 'hidden' }}>
      <div
        style={{
          width: `${Math.min(100, pct)}%`,
          height: '100%',
          borderRadius: h,
          background: color,
          transition: 'width .5s cubic-bezier(.2,.7,.3,1)',
        }}
      />
    </div>
  );
}

export default Bar;
