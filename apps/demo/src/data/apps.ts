import type { IconType } from 'react-icons'
import {
  SiGmail,
  SiGooglecalendar,
  SiGooglemaps,
  SiInstagram,
  SiNotion,
  SiRoblox,
  SiSpotify,
  SiTiktok,
  SiWhatsapp,
  SiX,
  SiYoutube
} from 'react-icons/si'

interface AppDefBase {
  id: string
  name: string
  /** Brand icon (react-icons/si) rendered on the tile — no network round-trip. */
  icon: IconType
  /** Brand color used as the tile background. */
  color: string
  /** Category label shown in the "Tus apps" list. */
  cat: string
  /** Fake skeleton-content caption shown in the app-open mock screen. */
  filler: string
}

/**
 * Source of truth for every app in the demo — ported from the design canvas
 * spec. `AppId` is derived from this array's ids (below) so the two can
 * never drift apart the way a hand-maintained union type could.
 */
const APP_DEFS = [
  { id: 'ig', name: 'Instagram', icon: SiInstagram, color: '#c13584', cat: 'Redes', filler: 'feed de fotos' },
  { id: 'tt', name: 'TikTok', icon: SiTiktok, color: '#111114', cat: 'Video corto', filler: 'videos infinitos' },
  { id: 'yt', name: 'YouTube', icon: SiYoutube, color: '#c4302b', cat: 'Video', filler: 'videos sugeridos' },
  { id: 'x', name: 'X', icon: SiX, color: '#111114', cat: 'Redes', filler: 'timeline' },
  { id: 'rb', name: 'Roblox', icon: SiRoblox, color: '#232527', cat: 'Juegos', filler: 'partida en curso' },
  { id: 'sp', name: 'Spotify', icon: SiSpotify, color: '#1a7a3c', cat: 'Música', filler: 'tu playlist' },
  { id: 'nt', name: 'Notion', icon: SiNotion, color: '#2b2b2b', cat: 'Trabajo', filler: 'tus notas' },
  { id: 'cl', name: 'Calendar', icon: SiGooglecalendar, color: '#2b2b2b', cat: 'Trabajo', filler: 'agenda de hoy' },
  { id: 'wa', name: 'WhatsApp', icon: SiWhatsapp, color: '#1e9e4f', cat: 'Mensajes', filler: 'chats' },
  { id: 'gm', name: 'Gmail', icon: SiGmail, color: '#2b2b2b', cat: 'Trabajo', filler: 'bandeja de entrada' },
  { id: 'mp', name: 'Maps', icon: SiGooglemaps, color: '#1a5fb4', cat: 'Utilidades', filler: 'mapa' }
] as const satisfies readonly AppDefBase[]

/** Stable id for every mock app in the phone demo — derived from APP_DEFS. */
export type AppId = (typeof APP_DEFS)[number]['id']

export interface AppDef extends AppDefBase {
  id: AppId
}

export const APPS: readonly AppDef[] = APP_DEFS

/** Home-screen grid order (8 tiles). */
export const GRID_APP_IDS: readonly AppId[] = ['ig', 'tt', 'yt', 'x', 'rb', 'sp', 'nt', 'cl']

/** Home-screen dock order (3 tiles, Picantully itself is the 4th, hardcoded). */
export const DOCK_APP_IDS: readonly AppId[] = ['wa', 'gm', 'mp']

/** A known AppId always has a matching entry — guaranteed by construction, since AppId is derived from APPS. */
export function getApp(id: AppId): AppDef
export function getApp(id: AppId | null): AppDef | undefined
export function getApp(id: AppId | null): AppDef | undefined {
  if (!id) return undefined
  return APPS.find((a) => a.id === id)
}
