// Tipos compartidos entre content script, background y popup

export type GeminiRole = 'user' | 'model'

export interface ConversationTurn {
  role: GeminiRole
  text: string
}

export interface TimeSpentEntry {
  date: string    // formato YYYY-MM-DD
  seconds: number
}

export interface NegotiateMessage {
  type: 'NEGOTIATE'
  domain: string
  userMessage: string
  minutesToday: number
}

// Uso de negociaciones con rate limit en tres dimensiones:
//   day    → total de negociaciones hoy       (límite 50)
//   domain → negociaciones en ESTE sitio hoy  (límite 12)
//   week   → negociaciones en los últimos 7 días (límite 200)
// La función negotiate devuelve este objeto en su respuesta JSON.
// Es opcional para degradar graciosamente con respuestas viejas que
// traían la forma plana { used, limit, remaining }.
export interface NegotiateUsage {
  day:    { used: number; limit: number }
  domain: { used: number; limit: number; name: string }
  week:   { used: number; limit: number }
}

export interface NegotiateResponse {
  permitir: boolean
  minutos: number | null  // minutos concedidos si permitir=true, null si se niega
  mensaje: string
  // Indicador de rate limit tridimensional (opcional — respuestas viejas no lo traen).
  usage?: NegotiateUsage
  // true cuando se alcanzó algún cap y no se puede negociar más.
  limitReached?: boolean
  // Qué cap específico se disparó ('domain' | 'day' | 'week').
  limitKind?: 'domain' | 'day' | 'week'
}

// Mensaje en el chat del overlay (no confundir con ConversationTurn de Gemini)
export interface ChatMessage {
  role: 'user' | 'mascota'
  text: string
}

// ── Comunicación con el documento offscreen (Appwrite) ──────────────────────────

// Payload que el background envía al offscreen para ejecutar la función negotiate
export interface NegotiatePayload {
  domain: string
  userMessage: string
  minutesToday: number
  history: ConversationTurn[]
}

// Mensaje background → offscreen
export interface AppwriteNegotiateMessage {
  type: 'APPWRITE_NEGOTIATE'
  payload: NegotiatePayload
}

// Sentinel: no hay sesión activa de Appwrite (el usuario debe loguearse)
export interface AuthRequiredResponse {
  authRequired: true
}

// Respuesta del offscreen: o bien la decisión, o el sentinel de auth requerido
export type OffscreenNegotiateResponse = NegotiateResponse | AuthRequiredResponse

export function isAuthRequired(r: OffscreenNegotiateResponse): r is AuthRequiredResponse {
  return (r as AuthRequiredResponse).authRequired === true
}

// ── Login con Google (popup → background → offscreen) ───────────────────────────

// Mensaje popup → background: inicia el flujo OAuth de Google.
// El flujo corre en el service worker (que sobrevive al cierre del popup) y la
// creación de sesión se delega al offscreen (mismo origen → comparte la sesión).
export interface GoogleLoginMessage {
  type: 'GOOGLE_LOGIN'
}

// Respuesta del background al popup tras el flujo OAuth.
export interface GoogleLoginResponse {
  ok: boolean
  error?: string
}

// Mensaje background → offscreen: crea la sesión Appwrite con las credenciales
// OAuth (userId+secret) devueltas por Appwrite en la success URL.
export interface AppwriteCreateSessionMessage {
  type: 'APPWRITE_CREATE_SESSION'
  userId: string
  secret: string
}

// Respuesta del offscreen al background tras crear la sesión.
export interface AppwriteCreateSessionResponse {
  ok: boolean
  error?: string
}

// Broadcast del background cuando el estado de auth cambió (sesión creada).
// Cualquier popup vivo lo escucha para refrescar su estado.
export interface AuthChangedMessage {
  type: 'AUTH_CHANGED'
}

// ── GET_USAGE: consulta el uso actual sin gastar una negociación ─────────────

// Mensaje content script → background: pedir el uso actual para el dominio.
export interface GetUsageMessage {
  type: 'GET_USAGE'
  domain: string
}

// Mensaje background → offscreen (forwarding del GET_USAGE)
export interface AppwriteGetUsageMessage {
  type: 'APPWRITE_GET_USAGE'
  domain: string
}

// Mensajes de límite por tipo, leídos de la tabla `personas` (fila `es-AR`).
export interface PersonaLimitMessages {
  domain: string  // puede contener {domain} como placeholder
  day: string
  week: string
}

// Respuesta del GET_USAGE: uso actual + mensajes de límite del persona.
// null si no hay sesión o cualquier error irrecuperable.
export interface GetUsageResult {
  usage: NegotiateUsage
  limitMessages: PersonaLimitMessages | null
}

export type GetUsageResponse = GetUsageResult | null
