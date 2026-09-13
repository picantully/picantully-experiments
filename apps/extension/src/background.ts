// Service worker — proxy entre el content script y la función de Appwrite.
// El service worker MV3 no tiene DOM/localStorage, así que no puede sostener la
// sesión del SDK Web de Appwrite. Por eso delega la ejecución de la función
// "negotiate" a un documento offscreen (mismo origen que el popup → comparte la
// sesión persistida en localStorage). Acá sólo orquestamos: storage + historial
// + mensajería con el offscreen.
import type {
  NegotiateMessage,
  NegotiateResponse,
  ConversationTurn,
  AppwriteNegotiateMessage,
  OffscreenNegotiateResponse,
  GoogleLoginMessage,
  GoogleLoginResponse,
  AppwriteCreateSessionMessage,
  AppwriteCreateSessionResponse,
  GetUsageMessage,
  GetUsageResponse,
  AppwriteGetUsageMessage,
} from './types'
import { isAuthRequired } from './types'

const MAX_HISTORY_TURNS = 10
const OFFSCREEN_DOCUMENT_PATH = 'src/offscreen.html'

// Config pública de Appwrite leída directamente de las env vars de Vite.
// NO importamos src/appwrite.ts en el service worker: construye el Client del
// SDK Web, que puede tocar window/document y romper en el SW. Vite inlinea
// estos valores en build, así que leerlos acá es seguro.
const APPWRITE_ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT
const APPWRITE_PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID

const FALLBACK_ERROR: NegotiateResponse = {
  permitir: false,
  minutos: 0,
  mensaje: '¡Ey! Algo salió mal procesando tu pedido. Probá de nuevo en un toque.'
}

// Mensaje cuando no hay sesión de Appwrite activa: hay que loguearse en el popup
const NEEDS_LOGIN: NegotiateResponse = {
  permitir: false,
  minutos: 0,
  mensaje: '¡Pará! Primero abrí la extensión (el ícono de Picantully arriba) y logueate. Después seguimos negociando.'
}

// Abre el popup de la extensión cuando el widget lo solicita
chrome.runtime.onMessage.addListener((msg) => {
  if (!msg || (msg as { type: string }).type !== 'OPEN_POPUP') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(chrome.action as any).openPopup?.().catch(console.error)
})

// Login con Google — corre en el service worker porque sobrevive al cierre del
// popup. Cuando launchWebAuthFlow abre la ventana de Google, el popup pierde el
// foco y se DESTRUYE; si el flujo viviera en el popup, el await moriría y la
// sesión nunca se crearía. Acá: lanzamos OAuth, parseamos userId+secret de la
// success URL y delegamos la creación de la sesión al offscreen (mismo origen,
// comparte el localStorage donde el SDK persiste la sesión).
chrome.runtime.onMessage.addListener(
  (msg: GoogleLoginMessage, _sender, sendResponse: (r: GoogleLoginResponse) => void) => {
    if (!msg || msg.type !== 'GOOGLE_LOGIN') return false

    handleGoogleLogin()
      .then(sendResponse)
      .catch((err) => {
        console.error('[Picantully background] Error inesperado en GOOGLE_LOGIN:', err)
        sendResponse({ ok: false, error: 'unexpected' })
      })

    return true // canal abierto para respuesta asíncrona
  },
)

async function handleGoogleLogin(): Promise<GoogleLoginResponse> {
  // URL https://<extension-id>.chromiumapp.org/ que Chrome intercepta para
  // cerrar el flujo. Debe estar registrada como plataforma Web en Appwrite
  // (ya lo está). Mismo valor que usaba el flujo anterior en el popup.
  const redirectUrl = chrome.identity.getRedirectURL()

  // Flujo de TOKEN: este endpoint adjunta userId+secret a la success URL.
  const authUrl =
    `${APPWRITE_ENDPOINT}/account/tokens/oauth2/google` +
    `?project=${APPWRITE_PROJECT_ID}` +
    `&success=${encodeURIComponent(redirectUrl)}` +
    `&failure=${encodeURIComponent(redirectUrl)}`

  let responseUrl: string | undefined
  try {
    responseUrl = await chrome.identity.launchWebAuthFlow({ url: authUrl, interactive: true })
  } catch (err) {
    // El usuario cerró la ventana o Chrome abortó el flujo.
    console.error('[Picantully background] OAuth abortado:', err)
    return { ok: false, error: 'cancelled' }
  }

  if (!responseUrl) {
    return { ok: false, error: 'no-response' }
  }

  const params = new URL(responseUrl).searchParams
  const userId = params.get('userId')
  const secret = params.get('secret')
  if (!userId || !secret) {
    console.error('[Picantully background] OAuth: faltan userId/secret en la respuesta.')
    return { ok: false, error: 'no-credentials' }
  }

  // Delegar la creación de la sesión al offscreen (tiene el SDK + el
  // localStorage compartido con el popup).
  await ensureOffscreenDocument()

  const createMsg: AppwriteCreateSessionMessage = {
    type: 'APPWRITE_CREATE_SESSION',
    userId,
    secret,
  }

  let sessionResult: AppwriteCreateSessionResponse
  try {
    sessionResult = await chrome.runtime.sendMessage(createMsg)
  } catch (err) {
    console.error('[Picantully background] Error creando la sesión en el offscreen:', err)
    return { ok: false, error: 'session-failed' }
  }

  if (!sessionResult || !sessionResult.ok) {
    return { ok: false, error: sessionResult?.error ?? 'session-failed' }
  }

  // Avisar (best-effort) a cualquier popup vivo para que refresque su estado.
  chrome.runtime.sendMessage({ type: 'AUTH_CHANGED' }).catch(() => {
    // Nadie escuchando (popup cerrado) → ignorar.
  })

  return { ok: true }
}

// GET_USAGE — consulta el uso actual sin gastar una negociación.
// Forwarding al offscreen que lee la fila de la base de Appwrite.
chrome.runtime.onMessage.addListener(
  (msg: GetUsageMessage, _sender: chrome.runtime.MessageSender, sendResponse: (r: GetUsageResponse) => void) => {
    if (!msg || msg.type !== 'GET_USAGE') return false

    ensureOffscreenDocument()
      .then(() => {
        const offscreenMsg: AppwriteGetUsageMessage = {
          type: 'APPWRITE_GET_USAGE',
          domain: msg.domain,
        }
        return chrome.runtime.sendMessage(offscreenMsg) as Promise<GetUsageResponse>
      })
      .then(sendResponse)
      .catch((err) => {
        console.error('[Picantully background] Error en GET_USAGE:', err)
        sendResponse(null)
      })

    return true // canal abierto para respuesta asíncrona
  }
)

chrome.runtime.onMessage.addListener(
  (msg: NegotiateMessage, _sender: chrome.runtime.MessageSender, sendResponse: (r: NegotiateResponse) => void) => {
    if (msg.type !== 'NEGOTIATE') return false

    handleNegotiate(msg)
      .then(sendResponse)
      .catch((err) => {
        console.error('[Picantully background] Error inesperado:', err)
        sendResponse(FALLBACK_ERROR)
      })

    return true // Canal abierto para respuesta asíncrona
  }
)

async function handleNegotiate(msg: NegotiateMessage): Promise<NegotiateResponse> {
  // Leer historial de conversación del storage
  const storage = await chrome.storage.local.get(['conversations', 'grants'])
  const conversations: Record<string, ConversationTurn[]> = storage.conversations ?? {}
  const domainHistory: ConversationTurn[] = conversations[msg.domain] ?? []

  // Asegurar el documento offscreen y delegarle la ejecución de la función
  await ensureOffscreenDocument()

  const offscreenMsg: AppwriteNegotiateMessage = {
    type: 'APPWRITE_NEGOTIATE',
    payload: {
      domain: msg.domain,
      userMessage: msg.userMessage,
      minutesToday: msg.minutesToday,
      history: domainHistory.slice(-MAX_HISTORY_TURNS)
    }
  }

  let response: OffscreenNegotiateResponse
  try {
    response = await chrome.runtime.sendMessage(offscreenMsg)
  } catch (err) {
    console.error('[Picantully background] Error hablando con el offscreen:', err)
    return FALLBACK_ERROR
  }

  // Sin sesión activa → pedir login en el popup (no tocar historial)
  if (!response || isAuthRequired(response)) {
    return NEEDS_LOGIN
  }

  const decision: NegotiateResponse = response

  // Actualizar historial en storage
  const updatedHistory: ConversationTurn[] = [
    ...domainHistory,
    { role: 'user' as const, text: msg.userMessage },
    { role: 'model' as const, text: decision.mensaje }
  ].slice(-(MAX_HISTORY_TURNS * 2))

  const updates: Record<string, unknown> = {
    conversations: { ...conversations, [msg.domain]: updatedHistory }
  }

  // Cachear el uso tridimensional para que el popup pueda mostrarlo.
  // Solo si la función lo devolvió en la forma nueva (respuestas viejas no traen `usage`).
  if (decision.usage) {
    updates.lastUsage = decision.usage
  }
  // También cachear limitKind para el overlay en visitas futuras.
  if (decision.limitKind) {
    updates.lastLimitKind = decision.limitKind
  }

  // Si se concedió acceso, guardar el grant con su expiración
  if (decision.permitir && decision.minutos !== null && decision.minutos > 0) {
    const grants: Record<string, number> = storage.grants ?? {}
    grants[msg.domain] = Date.now() + decision.minutos * 60 * 1000
    updates.grants = grants
  }

  await chrome.storage.local.set(updates)
  return decision
}

// Crea el documento offscreen si no existe todavía. Guarda contra "already exists"
// chequeando los contextos activos y atrapando la posible carrera.
async function ensureOffscreenDocument(): Promise<void> {
  const existing = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT' as chrome.runtime.ContextType],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_DOCUMENT_PATH)]
  })
  if (existing.length > 0) return

  try {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_DOCUMENT_PATH,
      reasons: ['DOM_SCRAPING' as chrome.offscreen.Reason],
      justification:
        'Ejecutar el SDK Web de Appwrite con la sesión del usuario para llamar a la función negotiate.'
    })
  } catch (err) {
    // Otra llamada concurrente pudo haberlo creado ya: ignoramos ese caso.
    if (err instanceof Error && /single offscreen|already/i.test(err.message)) return
    throw err
  }
}
