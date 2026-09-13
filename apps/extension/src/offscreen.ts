// Documento offscreen: corre el SDK Web de Appwrite con la sesión persistida
// por el popup (mismo origen chrome-extension://, comparte localStorage).
// Recibe mensajes del service worker y ejecuta la función "negotiate" como
// el usuario logueado, devolviendo la decisión.
import { ExecutionMethod, AppwriteException, Query } from 'appwrite'
import { account, functions, tablesDB, NEGOTIATE_FUNCTION_ID, REQUIRE_AUTH } from './appwrite'
import type {
  AppwriteNegotiateMessage,
  NegotiateResponse,
  OffscreenNegotiateResponse,
  AppwriteCreateSessionMessage,
  AppwriteCreateSessionResponse,
  AppwriteGetUsageMessage,
  GetUsageResponse,
  PersonaLimitMessages,
} from './types'

// Mantener en sync con la función negotiate (apps/backend/src/main.ts)
const DOMAIN_DAILY_LIMIT = 12
const DAILY_LIMIT = 50
const WEEKLY_LIMIT = 200

// IDs de base y tabla de uso (mismo que appwrite.config.json)
const USAGE_DATABASE_ID = 'picantully'
const USAGE_TABLE_ID = 'usage'
const PERSONAS_TABLE_ID = 'personas'

// Decisión de fallback cuando la función responde con error (no-2xx)
const FALLBACK_FUNCTION_ERROR: NegotiateResponse = {
  permitir: false,
  minutos: 0,
  mensaje: '¡Uf! Algo se quemó del lado del servidor. Probá de nuevo en un toque.',
}

chrome.runtime.onMessage.addListener(
  (
    msg: AppwriteNegotiateMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (r: OffscreenNegotiateResponse) => void,
  ) => {
    if (!msg || msg.type !== 'APPWRITE_NEGOTIATE') return false

    handleNegotiate(msg)
      .then(sendResponse)
      .catch((err) => {
        console.error('[Picantully offscreen] Error inesperado:', err)
        sendResponse(FALLBACK_FUNCTION_ERROR)
      })

    return true // canal abierto para respuesta asíncrona
  },
)

// Crea la sesión Appwrite con las credenciales OAuth (userId+secret) que el
// background obtuvo de la success URL. account.createSession persiste la sesión
// en el localStorage compartido con el popup, así que el account.get() del popup
// pasará a tener éxito.
chrome.runtime.onMessage.addListener(
  (
    msg: AppwriteCreateSessionMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (r: AppwriteCreateSessionResponse) => void,
  ) => {
    if (!msg || msg.type !== 'APPWRITE_CREATE_SESSION') return false

    account
      .createSession({ userId: msg.userId, secret: msg.secret })
      .then(() => sendResponse({ ok: true }))
      .catch((err) => {
        console.error('[Picantully offscreen] createSession falló:', err)
        const message = err instanceof Error ? err.message : 'createSession-failed'
        sendResponse({ ok: false, error: message })
      })

    return true // canal abierto para respuesta asíncrona
  },
)

// GET_USAGE — lee el uso actual del usuario desde Appwrite sin ejecutar negotiate.
chrome.runtime.onMessage.addListener(
  (
    msg: AppwriteGetUsageMessage,
    _sender: chrome.runtime.MessageSender,
    sendResponse: (r: GetUsageResponse) => void,
  ) => {
    if (!msg || msg.type !== 'APPWRITE_GET_USAGE') return false

    handleGetUsage(msg.domain)
      .then(sendResponse)
      .catch((err) => {
        console.error('[Picantully offscreen] Error inesperado en GET_USAGE:', err)
        sendResponse(null)
      })

    return true // canal abierto para respuesta asíncrona
  },
)

async function handleGetUsage(domain: string): Promise<GetUsageResponse> {
  // 1) Verificar sesión activa
  let userId: string
  try {
    const user = await account.get()
    userId = user.$id
  } catch {
    // Sin sesión → el overlay simplemente no muestra el indicador
    return null
  }

  // 2) Calcular la fecha de hoy en YYYY-MM-DD (UTC)
  const today = new Date().toISOString().slice(0, 10)

  // 3) Leer la fila de uso de hoy (404 → contadores en 0)
  let dailyUsed = 0
  let domainUsed = 0
  try {
    const row = await tablesDB.getRow({
      databaseId: USAGE_DATABASE_ID,
      tableId: USAGE_TABLE_ID,
      rowId: `${userId}_${today}`,
    })
    dailyUsed = (row as Record<string, unknown>).negotiations as number ?? 0
    const domainsRaw = (row as Record<string, unknown>).domains as string | undefined
    if (domainsRaw) {
      const domainsMap = JSON.parse(domainsRaw) as Record<string, number>
      domainUsed = domainsMap[domain] ?? 0
    }
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      // Primer uso del día → contadores en 0
      dailyUsed = 0
      domainUsed = 0
    } else {
      console.error('[Picantully offscreen] Error leyendo fila de uso:', err)
      return null
    }
  }

  // 4) Sumar negociaciones de los últimos 7 días para el cap semanal
  const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  let weekUsed = 0
  try {
    const weekRows = await tablesDB.listRows({
      databaseId: USAGE_DATABASE_ID,
      tableId: USAGE_TABLE_ID,
      queries: [
        Query.equal('userId', userId),
        Query.greaterThanEqual('date', sevenDaysAgo),
        Query.lessThanEqual('date', today),
        Query.limit(100),
      ],
    })
    for (const row of weekRows.rows) {
      weekUsed += (row as Record<string, unknown>).negotiations as number ?? 0
    }
  } catch (err) {
    console.error('[Picantully offscreen] Error leyendo filas semanales:', err)
    // No es fatal — devolver el uso parcial con weekUsed = 0
  }

  const usageResult = {
    day:    { used: dailyUsed,  limit: DAILY_LIMIT },
    domain: { used: domainUsed, limit: DOMAIN_DAILY_LIMIT, name: domain },
    week:   { used: weekUsed,   limit: WEEKLY_LIMIT },
  }

  // 5) Leer los mensajes de límite de la tabla personas (locale hardcodeado por ahora).
  // TODO: locale del perfil del usuario
  let limitMessages: PersonaLimitMessages | null = null
  try {
    const personaRow = await tablesDB.getRow({
      databaseId: USAGE_DATABASE_ID,
      tableId: PERSONAS_TABLE_ID,
      rowId: 'es-AR',
    })
    const raw = (personaRow as Record<string, unknown>).limitMessages as string | undefined
    if (raw) {
      limitMessages = JSON.parse(raw) as PersonaLimitMessages
    }
  } catch (err) {
    // No es fatal — el overlay usa los mensajes de fallback hardcodeados
    console.warn('[Picantully offscreen] No se pudieron cargar los mensajes de persona:', err)
  }

  return { usage: usageResult, limitMessages }
}

// Contexto del cliente para darle más munición a El Picante: día/hora local
// legible, zona horaria y país aproximado (de la config del navegador).
function buildClientContext(): { localTime?: string; timezone?: string; country?: string } {
  const ctx: { localTime?: string; timezone?: string; country?: string } = {}
  try {
    ctx.localTime = new Date().toLocaleString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
  } catch {
    /* Intl puede fallar en entornos raros — seguimos sin localTime */
  }
  try {
    ctx.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    /* ignore */
  }
  try {
    const lang =
      navigator.language || (navigator.languages && navigator.languages[0]) || ''
    const region = lang.includes('-') ? lang.split('-')[1] : ''
    if (region) ctx.country = region.toUpperCase()
  } catch {
    /* ignore */
  }
  return ctx
}

async function handleNegotiate(
  msg: AppwriteNegotiateMessage,
): Promise<OffscreenNegotiateResponse> {
  // 1) Verificar sesión activa (omitido cuando REQUIRE_AUTH es false)
  if (REQUIRE_AUTH) {
    try {
      await account.get()
    } catch (err) {
      if (err instanceof AppwriteException && err.code === 401) {
        return { authRequired: true }
      }
      // Cualquier otro error al verificar sesión → tratamos como auth requerido
      console.error('[Picantully offscreen] account.get() falló:', err)
      return { authRequired: true }
    }
  }

  // 2) Ejecutar la función negotiate (como usuario logueado o anónimo)
  let execution
  try {
    execution = await functions.createExecution({
      functionId: NEGOTIATE_FUNCTION_ID,
      // Sumamos contexto del cliente (hora local, zona horaria, país) al payload.
      body: JSON.stringify({ ...msg.payload, ...buildClientContext() }),
      async: false,
      xpath: '/',
      method: ExecutionMethod.POST,
    })
  } catch (err) {
    console.error('[Picantully offscreen] createExecution falló:', err)
    return FALLBACK_FUNCTION_ERROR
  }

  // 3) Validar el código HTTP de la respuesta de la función
  if (execution.responseStatusCode < 200 || execution.responseStatusCode >= 300) {
    console.error(
      '[Picantully offscreen] Función negotiate respondió',
      execution.responseStatusCode,
      execution.status,
      execution.errors,
    )
    return FALLBACK_FUNCTION_ERROR
  }

  // 4) Parsear el cuerpo de la respuesta (JSON string) a la decisión
  try {
    const decision: NegotiateResponse = JSON.parse(execution.responseBody)
    return decision
  } catch (err) {
    console.error(
      '[Picantully offscreen] No se pudo parsear responseBody:',
      execution.responseBody,
      err,
    )
    return FALLBACK_FUNCTION_ERROR
  }
}
