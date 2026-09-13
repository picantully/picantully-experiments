// Chili.tsx — mascota de Picantully (el chile con actitud) + glow suave.
// Specs portadas de focus-kit.jsx (Chili).
//
// Los assets se distribuyen con el paquete en @picantully/design-system/assets/*
// pero la resolución de URL depende del bundler del consumidor (Vite/Next),
// así que el componente recibe las URLs ya resueltas vía `srcMap`.
//
// Ejemplo (Vite):
//   import still from '@picantully/design-system/assets/picantully.png';
//   import proud from '@picantully/design-system/assets/picantully-1.gif';
//   import excited from '@picantully/design-system/assets/picantully-2.gif';
//   <Chili srcMap={{ still, proud, excited }} mood="proud" float />
import type { CSSProperties } from 'react';
import { shadows } from '../tokens';

/** Estados de ánimo del mascot mapeados a assets. */
export type ChiliMood = 'still' | 'proud' | 'excited';

/** Nombres de archivo canónicos de cada mood (en assets/). */
export const CHILI_ASSETS: Record<ChiliMood, string> = {
  still: 'picantully.png',
  proud: 'picantully-1.gif',
  excited: 'picantully-2.gif',
};

export interface ChiliProps {
  /** Mapa mood → URL de asset ya resuelta por el bundler. */
  srcMap: Partial<Record<ChiliMood, string>>;
  size?: number;
  mood?: ChiliMood;
  /** Halo rojo radial detrás del mascot. */
  glow?: boolean;
  /** Animación de flotación (loop suave). */
  float?: boolean;
  style?: CSSProperties;
}

export function Chili({
  srcMap,
  size = 120,
  mood = 'still',
  glow = true,
  float = false,
  style = {},
}: ChiliProps) {
  const src = srcMap[mood] ?? srcMap.still;

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: float ? 'pica-float 5s ease-in-out infinite' : 'none',
        ...style,
      }}
    >
      {glow && (
        <div
          style={{
            position: 'absolute',
            inset: '-12%',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239,68,56,0.45) 0%, transparent 68%)',
            filter: 'blur(3px)',
          }}
        />
      )}
      <img
        src={src}
        alt="Picantully"
        style={{
          width: '112%',
          height: '112%',
          objectFit: 'contain',
          position: 'relative',
          filter: shadows.mascot,
        }}
      />
    </div>
  );
}

export default Chili;
