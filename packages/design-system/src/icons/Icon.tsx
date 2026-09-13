// Icon.tsx — set de íconos de línea de Picantully (stroke 2, viewBox 24).
// Portado fielmente de icons.jsx. API: <Icon name size color stroke fill />.
import type { CSSProperties, ReactElement } from 'react';

export type IconName =
  | 'income'
  | 'expense'
  | 'transfer'
  | 'chat'
  | 'plus'
  | 'chevron'
  | 'home'
  | 'chart'
  | 'wallet'
  | 'user'
  | 'bell'
  | 'flame'
  | 'target'
  | 'trophy'
  | 'lock'
  | 'check'
  | 'bolt'
  | 'arrowUpR'
  | 'gear'
  | 'coins'
  | 'calendar'
  | 'repeat'
  | 'grip'
  | 'bank'
  | 'cart'
  | 'food'
  | 'health'
  | 'edu'
  | 'bag'
  | 'gift'
  | 'pet'
  | 'receipt'
  | 'film'
  | 'plane'
  | 'briefcase'
  | 'piggy'
  | 'phone'
  | 'droplet'
  | 'dumbbell'
  | 'music'
  | 'coffee'
  | 'shield'
  | 'eye'
  | 'clock'
  | 'apple'
  | 'window'
  | 'puzzle';

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  stroke?: number;
  fill?: string;
  style?: CSSProperties;
}

/** Lista canónica de nombres de íconos. */
export const ICON_NAMES: IconName[] = [
  'income',
  'expense',
  'transfer',
  'chat',
  'plus',
  'chevron',
  'home',
  'chart',
  'wallet',
  'user',
  'bell',
  'flame',
  'target',
  'trophy',
  'lock',
  'check',
  'bolt',
  'arrowUpR',
  'gear',
  'coins',
  'calendar',
  'repeat',
  'grip',
  'bank',
  'cart',
  'food',
  'health',
  'edu',
  'bag',
  'gift',
  'pet',
  'receipt',
  'film',
  'plane',
  'briefcase',
  'piggy',
  'phone',
  'droplet',
  'dumbbell',
  'music',
  'coffee',
  'shield',
  'eye',
  'clock',
  'apple',
  'window',
  'puzzle',
];

export function Icon({
  name,
  size = 20,
  color = 'currentColor',
  stroke = 1.8,
  fill = 'none',
  style = {},
}: IconProps): ReactElement {
  // props base de stroke compartidos por todos los paths
  const p = {
    fill,
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const paths: Record<IconName, ReactElement> = {
    income: (
      <>
        <path {...p} d="M12 19V5" />
        <path {...p} d="M6 11l6-6 6 6" />
      </>
    ),
    expense: (
      <>
        <path {...p} d="M12 5v14" />
        <path {...p} d="M6 13l6 6 6-6" />
      </>
    ),
    transfer: (
      <>
        <path {...p} d="M4 9h13l-3-3" />
        <path {...p} d="M20 15H7l3 3" />
      </>
    ),
    chat: <path {...p} d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />,
    plus: (
      <>
        <path {...p} d="M12 5v14" />
        <path {...p} d="M5 12h14" />
      </>
    ),
    chevron: <path {...p} d="M9 6l6 6-6 6" />,
    home: <path {...p} d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1Z" />,
    chart: (
      <>
        <path {...p} d="M5 21V10" />
        <path {...p} d="M12 21V4" />
        <path {...p} d="M19 21v-7" />
      </>
    ),
    wallet: (
      <>
        <path {...p} d="M3 7a2 2 0 0 1 2-2h13v4" />
        <path {...p} d="M3 7v10a2 2 0 0 0 2 2h14V7H5a2 2 0 0 1-2-2Z" />
        <circle cx="16" cy="13" r="1.3" fill={color} stroke="none" />
      </>
    ),
    user: (
      <>
        <circle {...p} cx="12" cy="8" r="4" />
        <path {...p} d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    bell: (
      <>
        <path {...p} d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
        <path {...p} d="M10 20a2 2 0 0 0 4 0" />
      </>
    ),
    flame: (
      <path {...p} d="M12 3c1 3-1 4-1 6a3 3 0 0 0 5 1c1 2 1 3 1 4a5 5 0 0 1-10 0c0-3 2-5 3-7 1 1 1 2 2 2 1-2 0-4 0-6Z" />
    ),
    target: (
      <>
        <circle {...p} cx="12" cy="12" r="8" />
        <circle {...p} cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="1.4" fill={color} stroke="none" />
      </>
    ),
    trophy: (
      <>
        <path {...p} d="M7 4h10v4a5 5 0 0 1-10 0Z" />
        <path {...p} d="M7 6H4v1a3 3 0 0 0 3 3" />
        <path {...p} d="M17 6h3v1a3 3 0 0 1-3 3" />
        <path {...p} d="M10 16h4M9 20h6M12 13v3" />
      </>
    ),
    lock: (
      <>
        <rect {...p} x="5" y="10" width="14" height="10" rx="2" />
        <path {...p} d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),
    check: <path {...p} d="M5 12l5 5L20 6" />,
    bolt: <path {...p} d="M13 2 4 14h7l-1 8 9-12h-7Z" />,
    arrowUpR: (
      <>
        <path {...p} d="M7 17 17 7" />
        <path {...p} d="M8 7h9v9" />
      </>
    ),
    gear: (
      <>
        <circle {...p} cx="12" cy="12" r="3" />
        <path {...p} d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </>
    ),
    coins: (
      <>
        <ellipse {...p} cx="9" cy="7" rx="6" ry="3" />
        <path {...p} d="M3 7v5c0 1.7 2.7 3 6 3s6-1.3 6-3" />
        <path {...p} d="M3 12v5c0 1.7 2.7 3 6 3 1 0 2-.1 3-.4" />
        <circle {...p} cx="17" cy="16" r="4" />
      </>
    ),
    calendar: (
      <>
        <rect {...p} x="4" y="5" width="16" height="16" rx="2.5" />
        <path {...p} d="M4 9.5h16M8.5 3v4M15.5 3v4" />
      </>
    ),
    repeat: (
      <>
        <path {...p} d="M17 2.5l3 3-3 3" />
        <path {...p} d="M20.5 5.5H8.5a4.5 4.5 0 0 0-4.5 4.5v.5" />
        <path {...p} d="M7 21.5l-3-3 3-3" />
        <path {...p} d="M3.5 18.5h12a4.5 4.5 0 0 0 4.5-4.5v-.5" />
      </>
    ),
    grip: (
      <>
        <circle cx="9" cy="6" r="1.4" fill={color} stroke="none" />
        <circle cx="15" cy="6" r="1.4" fill={color} stroke="none" />
        <circle cx="9" cy="12" r="1.4" fill={color} stroke="none" />
        <circle cx="15" cy="12" r="1.4" fill={color} stroke="none" />
        <circle cx="9" cy="18" r="1.4" fill={color} stroke="none" />
        <circle cx="15" cy="18" r="1.4" fill={color} stroke="none" />
      </>
    ),
    bank: (
      <>
        <path {...p} d="M3 9l9-5 9 5" />
        <path {...p} d="M5 9v9M9 9v9M15 9v9M19 9v9M3 21h18" />
      </>
    ),
    cart: (
      <>
        <circle cx="9" cy="20" r="1.4" fill={color} stroke="none" />
        <circle cx="17" cy="20" r="1.4" fill={color} stroke="none" />
        <path {...p} d="M2 3h2.2l2.3 12.2a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H5.2" />
      </>
    ),
    food: (
      <>
        <path {...p} d="M5 3v6a2 2 0 0 0 4 0V3M7 9v12" />
        <path {...p} d="M16.5 3C15 3 14 5.2 14 8s1 4 2.5 4 2.5-1.2 2.5-4S18 3 16.5 3zM16.5 12v9" />
      </>
    ),
    health: (
      <path {...p} d="M12 20s-7-4.4-7-9.4A3.7 3.7 0 0 1 12 7a3.7 3.7 0 0 1 7 3.6C19 15.6 12 20 12 20z" />
    ),
    edu: (
      <>
        <path {...p} d="M2 8l10-4 10 4-10 4z" />
        <path {...p} d="M6 10.2V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.8" />
      </>
    ),
    bag: (
      <>
        <path {...p} d="M5 8h14l-1 12H6z" />
        <path {...p} d="M9 8V6a3 3 0 0 1 6 0v2" />
      </>
    ),
    gift: (
      <>
        <rect {...p} x="3.5" y="8" width="17" height="5" rx="1" />
        <path {...p} d="M5 13v8h14v-8M12 8v13" />
        <path {...p} d="M12 8S10.3 3.5 8 4.8 9.2 8 12 8zM12 8s1.7-4.5 4-3.2S14.8 8 12 8z" />
      </>
    ),
    pet: (
      <>
        <circle cx="6.5" cy="11" r="1.6" fill={color} stroke="none" />
        <circle cx="10" cy="7" r="1.6" fill={color} stroke="none" />
        <circle cx="14" cy="7" r="1.6" fill={color} stroke="none" />
        <circle cx="17.5" cy="11" r="1.6" fill={color} stroke="none" />
        <path
          {...p}
          d="M12 12.5c-2.4 0-3.8 1.9-3.8 3.8 0 1.9 1.4 2.7 3.8 2.7s3.8-.8 3.8-2.7c0-1.9-1.4-3.8-3.8-3.8z"
        />
      </>
    ),
    receipt: (
      <>
        <path {...p} d="M6 2.5h12v19l-3-2-3 2-3-2-3 2z" />
        <path {...p} d="M9 7.5h6M9 11.5h6" />
      </>
    ),
    film: (
      <>
        <rect {...p} x="3" y="4" width="18" height="16" rx="2" />
        <path {...p} d="M7.5 4v16M16.5 4v16M3 9.5h4.5M3 14.5h4.5M16.5 9.5H21M16.5 14.5H21" />
      </>
    ),
    plane: <path {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
    briefcase: (
      <>
        <rect {...p} x="3" y="7" width="18" height="13" rx="2" />
        <path {...p} d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12.5h18" />
      </>
    ),
    piggy: (
      <>
        <path
          {...p}
          d="M4 13a6 5 0 0 1 9.5-4H17l2 2.5h2v3.5h-2.2A6 5 0 0 1 16 17v3h-3v-2a8 8 0 0 1-2 0v2H8v-3.2A6 5 0 0 1 4 13z"
        />
        <circle cx="14.5" cy="11.5" r="0.8" fill={color} stroke="none" />
      </>
    ),
    phone: (
      <>
        <rect {...p} x="6.5" y="2" width="11" height="20" rx="2.6" />
        <path {...p} d="M10.5 18.5h3" />
      </>
    ),
    droplet: <path {...p} d="M12 3s6 6.6 6 10.6a6 6 0 0 1-12 0C6 9.6 12 3 12 3z" />,
    dumbbell: <path {...p} d="M3 9v6M6 7v10M18 7v10M21 9v6M6 12h12" />,
    music: (
      <>
        <circle cx="6" cy="18" r="2.4" fill="none" stroke={color} strokeWidth={stroke} />
        <circle cx="17" cy="16" r="2.4" fill="none" stroke={color} strokeWidth={stroke} />
        <path {...p} d="M8.4 18V6.5l11-2v11" />
      </>
    ),
    coffee: (
      <>
        <path {...p} d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
        <path {...p} d="M17 9h2.2a2.3 2.3 0 0 1 0 4.6H17" />
        <path {...p} d="M8 2.5c-.6 1 .6 1.8 0 2.8M12 2.5c-.6 1 .6 1.8 0 2.8" />
      </>
    ),
    shield: (
      <>
        <path {...p} d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6l7-3Z" />
        <path {...p} d="M9 12l2 2 4-4" />
      </>
    ),
    eye: (
      <>
        <path {...p} d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle {...p} cx="12" cy="12" r="3" />
      </>
    ),
    clock: (
      <>
        <circle {...p} cx="12" cy="12" r="9" />
        <path {...p} d="M12 7v5l3.5 2" />
      </>
    ),
    apple: (
      <path
        {...p}
        d="M16 3c-1.2.1-2.5.9-3.2 1.9M12 8c-1-1.7-3-2.8-4.8-2.3C5 6.3 3.6 8.6 4 11.4c.4 2.8 2.4 7.1 4.5 7.5 1.2.2 1.9-.7 3.5-.7s2.3.9 3.5.7c2.1-.4 3.8-4.2 4.2-6.6-2.8-1-3.5-4.8-1.4-6.6C20.8 4 18.4 2.8 16 3Z"
      />
    ),
    window: (
      <>
        <rect {...p} x="3" y="4" width="18" height="16" rx="2.5" />
        <path {...p} d="M3 9h18" />
      </>
    ),
    puzzle: (
      <path
        {...p}
        d="M10 4a2 2 0 0 1 4 0c0 1 .8 1.5 1.6 1.2L18 4.5V8c1 .2 1.5.8 1.5 1.6S19 11 18 11.2V15l-2.4-.7c-.8-.3-1.6.2-1.6 1.2a2 2 0 0 1-4 0c0-1-.8-1.5-1.6-1.2L6 15v-3.8C5 11 4.5 10.4 4.5 9.6S5 8.2 6 8V4.5l2.4.7C9.2 5.5 10 5 10 4Z"
      />
    ),
  };

  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ display: 'block', ...style }}>
      {paths[name] ?? null}
    </svg>
  );
}

export default Icon;
