import React from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { Overlay } from './components/Overlay'
import { Widget } from './components/Widget'
import { DEFAULT_BLOCKLIST } from '../blocklist'

// ── Estado local del content script ──────────────────────────────────────────
let overlayRoot: Root | null = null
let overlayContainer: HTMLElement | null = null
let widgetRoot: Root | null = null
let widgetContainer: HTMLElement | null = null
let currentDomain = ''

// ── Resiliencia ante contexto de extensión invalidado ────────────────────────
// Cuando el usuario recarga la extensión sin cerrar las pestañas, el content
// script queda huérfano. chrome.runtime.id pasa a ser undefined en ese caso.

function isExtensionAlive(): boolean {
  return Boolean(chrome.runtime?.id)
}

function isContextError(e: unknown): boolean {
  return e instanceof Error && /Extension context invalidated/i.test(e.message)
}

// Referencias a los intervalos top-level para poder limpiarlos en shutdown()
let spaCheckInterval: ReturnType<typeof setInterval> | null = null
let reEvaluateInterval: ReturnType<typeof setInterval> | null = null

// Detiene todos los intervalos y limpia el listener de beforeunload.
// Se llama cuando se detecta que el contexto ya no está vivo.
function shutdown(): void {
  if (trackingInterval) { clearInterval(trackingInterval); trackingInterval = null }
  if (spaCheckInterval) { clearInterval(spaCheckInterval); spaCheckInterval = null }
  if (reEvaluateInterval) { clearInterval(reEvaluateInterval); reEvaluateInterval = null }
  if (picaRetryTimer) { clearInterval(picaRetryTimer); picaRetryTimer = null }
}

// Buffer de segundos efectivos pendientes de persistir
let localSecondsBuffer = 0
let lastPersistAt = Date.now()

// Para detectar cambios de URL en SPAs (YouTube, Instagram, etc.)
let lastHref = location.href

// ── Tracking de foco efectivo ─────────────────────────────────────────────────
// Solo cuenta cuando la página está visible Y la ventana tiene el foco del sistema.
// Esto excluye: tab en segundo plano, ventana minimizada, usuario en otra app.
let isWindowFocused = document.hasFocus()

window.addEventListener('focus', () => { isWindowFocused = true })
window.addEventListener('blur', () => { isWindowFocused = false })

function isEffectivelyActive(): boolean {
  return document.visibilityState === 'visible' && isWindowFocused
}

// ── Utilidades ────────────────────────────────────────────────────────────────

function normalizeDomain(hostname: string): string {
  return hostname.replace(/^www\./, '')
}

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// Devuelve la fecha de hace N días en formato YYYY-MM-DD
function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ── Storage: schema de timeSpent ──────────────────────────────────────────────
// { "instagram.com": { "2026-05-28": 1234, "2026-05-27": 5678 } }
// Guardamos hasta 7 días por dominio, limpiando entradas viejas en cada write.

type TimeSpentStorage = Record<string, Record<string, number>>

async function persistTimeBuffer(domain: string): Promise<void> {
  if (localSecondsBuffer === 0) return

  const secondsToAdd = localSecondsBuffer
  localSecondsBuffer = 0
  lastPersistAt = Date.now()

  try {
    const raw = await chrome.storage.local.get('timeSpent')
    const timeSpent: TimeSpentStorage = raw.timeSpent ?? {}
    const today = todayISO()
    const cutoff = daysAgoISO(7)

    if (!timeSpent[domain]) timeSpent[domain] = {}
    timeSpent[domain][today] = (timeSpent[domain][today] ?? 0) + secondsToAdd

    // Limpiar entradas más viejas de 7 días (en TODOS los dominios)
    for (const d of Object.keys(timeSpent)) {
      for (const date of Object.keys(timeSpent[d])) {
        if (date < cutoff) delete timeSpent[d][date]
      }
      // Eliminar dominios sin datos
      if (Object.keys(timeSpent[d]).length === 0) delete timeSpent[d]
    }

    await chrome.storage.local.set({ timeSpent })
  } catch (e) {
    // Contexto de extensión invalidado: detener todos los intervalos
    if (isContextError(e)) { shutdown(); return }
    throw e
  }
}

function getSecondsToday(timeSpent: TimeSpentStorage, domain: string): number {
  const today = todayISO()
  return (timeSpent[domain]?.[today] ?? 0) + localSecondsBuffer
}

// ── Overlay: montar / desmontar ───────────────────────────────────────────────

function mountOverlay(domain: string, minutesToday: number): void {
  if (overlayContainer) return

  overlayContainer = document.createElement('div')
  overlayContainer.id = 'picantully-overlay-root'
  document.documentElement.appendChild(overlayContainer)
  document.body.style.overflow = 'hidden'

  overlayRoot = createRoot(overlayContainer)
  overlayRoot.render(
    <Overlay
      domain={domain}
      minutesToday={minutesToday}
      onGranted={handleGranted}
    />
  )
}

function destroyOverlay(): void {
  if (overlayRoot) {
    overlayRoot.unmount()
    overlayRoot = null
  }
  overlayContainer?.remove()
  overlayContainer = null
  document.body.style.overflow = ''
}

function mountWidget(domain: string, expiryMs: number): void {
  if (widgetContainer) return
  widgetContainer = document.createElement('div')
  widgetContainer.id = 'picantully-widget-root'
  document.documentElement.appendChild(widgetContainer)
  widgetRoot = createRoot(widgetContainer)
  widgetRoot.render(
    <Widget domain={domain} expiryMs={expiryMs} onExpired={handleWidgetExpired} />
  )
}

function destroyWidget(): void {
  if (widgetRoot) {
    widgetRoot.unmount()
    widgetRoot = null
  }
  widgetContainer?.remove()
  widgetContainer = null
}

function handleWidgetExpired(): void {
  destroyWidget()
  evaluateDomain()
}

function handleGranted(): void {
  destroyOverlay()
  // Verificar que el contexto sigue vivo antes de llamar a la API de chrome
  if (!isExtensionAlive()) return
  try {
    chrome.storage.local.get(['grants'], (result) => {
      if (!isExtensionAlive()) return
      const grants = (result.grants as Record<string, number>) ?? {}
      const expiry = grants[currentDomain]
      if (expiry && expiry > Date.now()) mountWidget(currentDomain, expiry)
    })
  } catch (e) {
    if (isContextError(e)) { shutdown(); return }
    throw e
  }
}

// ── Tracking de tiempo ─────────────────────────────────────────────────────────

let trackingInterval: ReturnType<typeof setInterval> | null = null

function startTracking(domain: string): void {
  if (trackingInterval) return

  trackingInterval = setInterval(() => {
    // Contexto huérfano: detener silenciosamente
    if (!isExtensionAlive()) { shutdown(); return }

    if (isEffectivelyActive()) {
      localSecondsBuffer++

      // Persistir a storage cada ~5 segundos para no perder datos
      if (Date.now() - lastPersistAt > 5000) {
        persistTimeBuffer(domain)
      }
    }
  }, 1000)
}

function stopTracking(): void {
  if (trackingInterval) {
    clearInterval(trackingInterval)
    trackingInterval = null
  }
}

// ── Evaluación principal ───────────────────────────────────────────────────────

async function evaluateDomain(): Promise<void> {
  const domain = normalizeDomain(location.hostname)

  let storage: Record<string, unknown>
  try {
    storage = await chrome.storage.local.get(['blocklist', 'grants', 'timeSpent'])
  } catch (e) {
    // Contexto de extensión invalidado: detener silenciosamente
    if (isContextError(e)) { shutdown(); return }
    throw e
  }
  const blocklist: string[] = (storage.blocklist as string[]) ?? DEFAULT_BLOCKLIST

  if (!blocklist.includes(domain)) {
    destroyOverlay()
    stopTracking()
    return
  }

  // Cambio de dominio: flush y reiniciar buffer
  if (currentDomain !== domain) {
    if (currentDomain) await persistTimeBuffer(currentDomain)
    currentDomain = domain
    localSecondsBuffer = 0
    startTracking(domain)
  }

  const grants: Record<string, number> = (storage.grants as Record<string, number>) ?? {}
  const grantExpiry = grants[domain] ?? 0

  if (grantExpiry > Date.now()) {
    destroyOverlay()
    mountWidget(domain, grantExpiry)
    return
  }

  // Grant expirado o inexistente → destruir widget si existe
  destroyWidget()

  // Grant expirado o inexistente → bloquear
  const timeSpent: TimeSpentStorage = (storage.timeSpent as TimeSpentStorage) ?? {}
  const secondsToday = getSecondsToday(timeSpent, domain)
  const minutesToday = Math.floor(secondsToday / 60)

  mountOverlay(domain, minutesToday)
}

// ── Picantully content injection ──────────────────────────────────────────────
// Solo corre en la URL exacta y cuando el usuario tiene acceso (sin overlay).

const PICA_TARGET_URL = 'https://x.com/search?q=programming&src=recent_search_click'
const PICA_AVATAR = 'https://pbs.twimg.com/profile_images/2060072227039490048/rzai6QmC_400x400.jpg'
const PICA_IMAGE  = 'https://pbs.twimg.com/media/HJbomIGWoAQNw3H?format=jpg&name=large'
const PICA_TEXT   = 'Felicidades, le acabás de regalar otros 15 minutos de tu vida a Elon Musk. El estilo de vida que querés no se paga solo.'

let picaRetryTimer: ReturnType<typeof setInterval> | null = null

function isPicaTarget(): boolean {
  return location.href === PICA_TARGET_URL
}

function addPicaFollowCard(): boolean {
  const username    = 'picantully'
  const displayName = 'PICANTULLY'

  const heading = Array.from(document.querySelectorAll('h2')).find(
    h => h.textContent?.trim() === 'A quién seguir'
  )
  if (!heading) return false

  let aside: Element | null = heading.parentElement
  while (aside && aside.tagName !== 'ASIDE') aside = aside.parentElement
  if (!aside) return false

  const ul = aside.querySelector('ul')
  if (!ul) return false

  if (aside.querySelector(`[data-testid="UserAvatar-Container-${username}"]`)) return true

  const originalItem = ul.querySelector('li[data-testid="UserCell"]')
  if (!originalItem) return false

  const newItem = originalItem.cloneNode(true) as Element

  newItem.querySelectorAll('a[href]').forEach(a => a.setAttribute('href', `/${username}`))

  const img = newItem.querySelector('img') as HTMLImageElement | null
  if (img) { img.src = PICA_AVATAR; img.alt = displayName }

  const bgDiv = newItem.querySelector('[style*="background-image"]') as HTMLElement | null
  if (bgDiv) bgDiv.style.backgroundImage = `url("${PICA_AVATAR}")`

  const avatarContainer = newItem.querySelector('[data-testid^="UserAvatar-Container-"]')
  if (avatarContainer) avatarContainer.setAttribute('data-testid', `UserAvatar-Container-${username}`)

  const followBtn = newItem.querySelector('button[data-testid]')
  if (followBtn) {
    followBtn.setAttribute('data-testid', `${username}-follow`)
    followBtn.setAttribute('aria-label', `Seguir @${username}`)
  }

  const originalLinks    = originalItem.querySelectorAll('a[href]')
  const originalUsername = originalLinks[0]?.getAttribute('href')?.replace('/', '') ?? ''
  const originalDisplay  = originalLinks[1]?.textContent?.trim() ?? ''

  const walker = document.createTreeWalker(newItem, NodeFilter.SHOW_TEXT)
  let node: Node | null
  while ((node = walker.nextNode())) {
    const txt = node.textContent?.trim() ?? ''
    if (!txt) continue
    if (txt === originalDisplay)             node.textContent = displayName
    else if (txt === originalUsername)       node.textContent = username
    else if (txt === `@${originalUsername}`) node.textContent = `@${username}`
    else if (originalUsername && txt.includes(originalUsername))
      node.textContent = node.textContent!.replace(new RegExp(originalUsername, 'g'), username)
    else if (originalDisplay && txt.includes(originalDisplay))
      node.textContent = node.textContent!.replace(new RegExp(originalDisplay, 'g'), displayName)
  }

  ul.insertBefore(newItem, ul.firstChild)
  return true
}

function injectPicaTweet(): boolean {
  if (document.querySelector('[data-pica="true"]')) return true

  const source = document.querySelector('article[data-testid="tweet"]')
  if (!source) return false

  const sourceCell = source.closest('[data-testid="cellInnerDiv"]')
  if (!sourceCell) return false
  const feedList = sourceCell.parentElement
  if (!feedList) return false

  const fake    = sourceCell.cloneNode(true) as Element
  const article = fake.querySelector('article[data-testid="tweet"]')
  if (!article) return false

  ;[
    '[data-testid="tweetPhoto"]', '[data-testid="videoPlayer"]', '[data-testid="videoComponent"]',
    '[data-testid="card.wrapper"]', '[data-testid="placementTracking"]',
    '[data-testid="tweet-text-show-more-link"]', '[data-testid="caret"]',
  ].forEach(sel => article.querySelectorAll(sel).forEach(el => {
    let t: Element = el
    while (t.parentElement && t.parentElement !== article && t.parentElement.children.length === 1) t = t.parentElement
    t.remove()
  }))

  article.querySelectorAll('*').forEach(el => {
    if (el.children.length === 0 && (el.textContent?.includes('Traducido') || el.textContent?.includes('Mostrar original'))) {
      let t: Element = el
      while (t.parentElement && t.parentElement !== article && t.parentElement.children.length <= 2) t = t.parentElement
      t.remove()
    }
  })

  const tweetTextEl = article.querySelector('[data-testid="tweetText"]')
  if (tweetTextEl) {
    const cls = tweetTextEl.querySelector('span')?.className ?? ''
    tweetTextEl.innerHTML = `<span class="${cls}">${PICA_TEXT}</span>`
    tweetTextEl.insertAdjacentHTML('afterend',
      `<div style="margin-top:12px;border-radius:16px;overflow:hidden;">
         <img src="${PICA_IMAGE}" style="width:100%;height:auto;display:block;border-radius:16px;">
       </div>`
    )
  }

  const avatarImg = article.querySelector('[data-testid="Tweet-User-Avatar"] img') as HTMLImageElement | null
  if (avatarImg) { avatarImg.src = PICA_AVATAR; avatarImg.alt = 'PICANTULLY' }
  const avatarBg = article.querySelector('[data-testid="Tweet-User-Avatar"] [style*="background-image"]') as HTMLElement | null
  if (avatarBg) avatarBg.style.backgroundImage = `url("${PICA_AVATAR}")`
  const avatarCont = article.querySelector('[data-testid^="UserAvatar-Container-"]')
  if (avatarCont) avatarCont.setAttribute('data-testid', 'UserAvatar-Container-picantully')

  article.querySelector('[data-testid="User-Name"]')?.querySelectorAll('a').forEach(a => {
    a.setAttribute('href', '/picantully')
    const w = document.createTreeWalker(a, NodeFilter.SHOW_TEXT)
    let n: Node | null
    while ((n = w.nextNode())) {
      const t = n.textContent?.trim() ?? ''
      if (!t || /^\d+[hmds]$/.test(t) || t === '·') continue
      n.textContent = t.startsWith('@') ? '@picantully' : 'PICANTULLY'
    }
  })

  fake.setAttribute('data-pica', 'true')

  const getY = (c: Element) =>
    parseFloat((c.getAttribute('style') ?? '').match(/translateY\(([0-9.]+)px\)/)?.[1] ?? '0')
  const setY = (c: Element, y: number) =>
    c.setAttribute('style', `transform: translateY(${y}px); position: absolute; width: 100%;`)

  const firstY = getY(sourceCell)
  setY(fake, firstY)
  feedList.appendChild(fake)

  requestAnimationFrame(() => {
    const fakeH = fake.getBoundingClientRect().height
    feedList.querySelectorAll(':scope > [data-testid="cellInnerDiv"]').forEach(c => {
      if (c === fake) return
      const y = getY(c)
      if (y >= firstY) setY(c, y + fakeH)
    })
    const h = parseFloat((feedList as HTMLElement).style.height) || 0
    if (h > 0) (feedList as HTMLElement).style.height = `${h + fakeH}px`
  })

  return true
}

function tryPicaInject(): void {
  if (!isPicaTarget() || overlayContainer) return
  const cardOk  = addPicaFollowCard()
  const tweetOk = injectPicaTweet()
  if (cardOk && tweetOk && picaRetryTimer) {
    clearInterval(picaRetryTimer)
    picaRetryTimer = null
  }
}

function startPicaRetry(): void {
  if (picaRetryTimer) clearInterval(picaRetryTimer)
  picaRetryTimer = setInterval(tryPicaInject, 700)
  // Abandona si X no cargó los elementos en 30s
  setTimeout(() => {
    if (picaRetryTimer) { clearInterval(picaRetryTimer); picaRetryTimer = null }
  }, 30_000)
}

function stopPicaRetry(): void {
  if (picaRetryTimer) { clearInterval(picaRetryTimer); picaRetryTimer = null }
}

// ── Detectar cambios de URL en SPAs ──────────────────────────────────────────

spaCheckInterval = setInterval(() => {
  // Contexto huérfano: detener silenciosamente
  if (!isExtensionAlive()) { shutdown(); return }

  if (location.href !== lastHref) {
    lastHref = location.href
    evaluateDomain()
    if (isPicaTarget()) startPicaRetry()
    else stopPicaRetry()
  }
}, 1000)

// ── Re-evaluar periódicamente (detecta cuando expira un grant) ────────────────

reEvaluateInterval = setInterval(() => {
  // Contexto huérfano: detener silenciosamente
  if (!isExtensionAlive()) { shutdown(); return }

  if (!overlayContainer) {
    evaluateDomain()
    tryPicaInject()
  }
}, 5000)

// ── Arranque ──────────────────────────────────────────────────────────────────

evaluateDomain()
if (isPicaTarget()) startPicaRetry()

window.addEventListener('beforeunload', () => {
  if (currentDomain) persistTimeBuffer(currentDomain)
})
