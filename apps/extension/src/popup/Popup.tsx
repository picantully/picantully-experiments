import React, { useState, useEffect } from 'react'
import { LuCrown, LuTarget, LuCheck, LuShield, LuClock, LuTrophy } from 'react-icons/lu'
import { DEFAULT_BLOCKLIST } from '../blocklist'
import characterImg from '../assets/picantito-character.png'
import { account, REQUIRE_AUTH, tablesDB, FEEDBACK_DATABASE_ID, FEEDBACK_TABLE_ID } from '../appwrite'
import { loginWithGoogle, requestEmailOtp, verifyEmailOtp } from '../auth'
import { AppwriteException, ID, Permission, Role, type Models } from 'appwrite'
import { colors, font, radius, shadow } from '../design/tokens'
import type { NegotiateUsage } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────────

type TimeSpentStorage = Record<string, Record<string, number>>
type Grants = Record<string, number> // domain → expiry ms timestamp

interface DomainStat {
  domain: string
  todayMin: number
  weekMin: number
}

type DomainStatus = 'por-negociar' | 'bloqueado' | 'habilitado'

// ── Utils ──────────────────────────────────────────────────────────────────────

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function computeStats(timeSpent: TimeSpentStorage): DomainStat[] {
  const today = todayISO()
  const weekAgo = daysAgoISO(7)
  const stats: DomainStat[] = []
  for (const [domain, dates] of Object.entries(timeSpent)) {
    const todaySecs = dates[today] ?? 0
    const weekSecs = Object.entries(dates)
      .filter(([d]) => d >= weekAgo)
      .reduce((sum, [, s]) => sum + s, 0)
    if (weekSecs > 0) {
      stats.push({ domain, todayMin: Math.floor(todaySecs / 60), weekMin: Math.floor(weekSecs / 60) })
    }
  }
  return stats.sort((a, b) => b.weekMin - a.weekMin)
}

function getDomainStatus(domain: string, grants: Grants, timeSpent: TimeSpentStorage, now: number): DomainStatus {
  const expiry = grants[domain]
  if (expiry && expiry > now) return 'habilitado'
  const hasHistory = timeSpent[domain] && Object.values(timeSpent[domain]).some(s => s > 0)
  if (hasHistory) return 'bloqueado'
  return 'por-negociar'
}

function formatRemaining(expiry: number, now: number): string {
  const totalSecs = Math.max(0, Math.floor((expiry - now) / 1000))
  if (totalSecs === 0) return '0s'
  if (totalSecs < 60) return `${totalSecs}s`
  const mins = Math.floor(totalSecs / 60)
  const secs = totalSecs % 60
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`
  const hrs = Math.floor(mins / 60)
  const remMins = mins % 60
  return remMins > 0 ? `${hrs}h ${remMins}m` : `${hrs}h`
}

// ── Helpers de sesión por usuario ─────────────────────────────────────────────

/**
 * Previene el "data bleed": si el usuario B inicia sesión en el mismo navegador
 * donde el usuario A tenía datos, limpia la blocklist, estadísticas y permisos
 * de A antes de que B los herede. La sesión de Appwrite no se toca.
 */
async function reconcileActiveUser(userId: string): Promise<void> {
  const stored = await new Promise<Record<string, unknown>>(resolve =>
    chrome.storage.local.get(['activeUserId'], resolve),
  )
  const prev = stored['activeUserId'] as string | undefined

  if (prev && prev !== userId) {
    // Usuario distinto al anterior → limpiar datos del browser de la sesión vieja
    await new Promise<void>(resolve =>
      chrome.storage.local.remove(
        ['blocklist', 'timeSpent', 'grants', 'conversations', 'lastUsage', 'lastLimitKind', 'premiumInterest'],
        resolve,
      ),
    )
  }

  // Siempre registrar el usuario activo actual
  await new Promise<void>(resolve => chrome.storage.local.set({ activeUserId: userId }, resolve))
}

/**
 * Crea un perfil mínimo en Appwrite la primera vez que el usuario inicia sesión.
 * El onboarding completo viene después; acá solo se garantiza que la fila exista.
 * Best-effort: cualquier error se ignora para no bloquear la UI.
 */
async function ensureProfile(userId: string): Promise<void> {
  try {
    await tablesDB.getRow({ databaseId: 'picantully', tableId: 'profiles', rowId: userId })
    // El perfil ya existe — no hacer nada
  } catch (err) {
    if (err instanceof AppwriteException && err.code === 404) {
      // Perfil mínimo; el onboarding completo viene después
      try {
        await tablesDB.createRow({
          databaseId: 'picantully',
          tableId: 'profiles',
          rowId: userId,
          data: { userId, locale: 'es-AR' },
          permissions: [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        })
      } catch {
        // Si la creación falla (race condition u otro error) se ignora
      }
    }
    // Cualquier otro error (red, permisos, etc.) se ignora silenciosamente
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

type Tab = 'stats' | 'uso' | 'config'

type AuthState =
  | { status: 'checking' }
  | { status: 'authed'; user: Models.User<Models.DefaultPreferences> }
  | { status: 'anon' }

export function Popup() {
  const [activeTab, setActiveTab] = useState<Tab>('stats')
  const [blocklist, setBlocklist] = useState(DEFAULT_BLOCKLIST.join('\n'))
  const [stats, setStats] = useState<DomainStat[]>([])
  const [auth, setAuth] = useState<AuthState>({ status: 'checking' })
  const [saved, setSaved] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [grants, setGrants] = useState<Grants>({})
  const [timeSpent, setTimeSpent] = useState<TimeSpentStorage>({})
  const [now, setNow] = useState(Date.now())
  // Uso tridimensional de negociaciones (rate limit), cacheado por el background.
  const [usage, setUsage] = useState<NegotiateUsage | null>(null)
  // Estado del botón "Hacete Premium": idle | done
  const [premiumState, setPremiumState] = useState<'idle' | 'done'>('idle')
  // Dominio de la pestaña activa + conteo por-dominio de hoy (para "Este sitio hoy")
  const [currentDomain, setCurrentDomain] = useState<string | null>(null)
  const [domainCounts, setDomainCounts] = useState<Record<string, number>>({})

  // Estado del formulario OTP
  type OtpStep = 'email' | 'code'
  const [otpStep, setOtpStep] = useState<OtpStep>('email')
  const [email, setEmail] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const [otpUserId, setOtpUserId] = useState('')
  const [authError, setAuthError] = useState<string | null>(null)
  const [authBusy, setAuthBusy] = useState(false)
  // Aviso suave para el flujo de Google (el popup puede cerrarse durante el OAuth)
  const [googleHint, setGoogleHint] = useState<string | null>(null)

  // Aislamiento de datos por usuario: reconcilia el usuario activo en el browser
  // y crea el perfil mínimo en Appwrite la primera vez que inicia sesión.
  const authedUserId = auth.status === 'authed' ? auth.user.$id : null
  useEffect(() => {
    if (auth.status !== 'authed' || !authedUserId) return
    reconcileActiveUser(authedUserId).then(() => ensureProfile(authedUserId))
  }, [auth.status, authedUserId])

  // Reloj: actualiza "now" cada segundo para el countdown
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Datos de storage: carga inicial + refresca cada 5s
  useEffect(() => {
    const load = () => {
      chrome.storage.local.get(['blocklist', 'timeSpent', 'grants', 'lastUsage'], (result) => {
        if (result.blocklist) setBlocklist((result.blocklist as string[]).join('\n'))
        const ts = (result.timeSpent as TimeSpentStorage) ?? {}
        setTimeSpent(ts)
        setStats(computeStats(ts))
        setGrants((result.grants as Grants) ?? {})
        setUsage((result.lastUsage as NegotiateUsage | undefined) ?? null)
      })
    }
    load()
    const id = setInterval(load, 5000)
    return () => clearInterval(id)
  }, [])

  // Dominio de la pestaña activa (para acotar "Este sitio hoy" al sitio actual)
  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = tabs[0]?.url
      if (!url) { setCurrentDomain(null); return }
      try {
        setCurrentDomain(new URL(url).hostname.replace(/^www\./, ''))
      } catch {
        setCurrentDomain(null)
      }
    })
  }, [])

  // Conteo por-dominio de hoy: leído de la fila `usage` del usuario (tiene permiso
  // de lectura propia). Alimenta la barra "Este sitio hoy" del sitio actual.
  useEffect(() => {
    if (auth.status !== 'authed') return
    const userId = auth.user.$id
    let cancelled = false
    const loadDomainCounts = async () => {
      try {
        const row = await tablesDB.getRow({
          databaseId: 'picantully',
          tableId: 'usage',
          rowId: `${userId}_${todayISO()}`,
        })
        const raw = (row as unknown as { domains?: string }).domains
        const map = raw ? JSON.parse(raw) : {}
        if (!cancelled && map && typeof map === 'object') setDomainCounts(map as Record<string, number>)
      } catch {
        // 404 (sin negociaciones hoy) u otro error → mapa vacío, sin romper
        if (!cancelled) setDomainCounts({})
      }
    }
    loadDomainCounts()
    const id = setInterval(loadDomainCounts, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [auth])

  // Chequear sesión de Appwrite al montar (omitido cuando REQUIRE_AUTH es false).
  // Resuelve account.get() y pendingOtp en paralelo para evitar flash del step "email"
  // antes de restaurar el step "code" si hay un OTP pendiente válido.
  useEffect(() => {
    if (!REQUIRE_AUTH) return

    const PENDING_OTP_KEY = 'pendingOtp'
    const OTP_TTL_MS = 15 * 60 * 1000 // 15 minutos

    Promise.all([
      // Chequear sesión activa
      account.get().then(user => ({ user })).catch(() => ({ user: null })),
      // Leer OTP pendiente del storage local del extension
      new Promise<{ userId: string; email: string; createdAt: number } | null>(resolve => {
        chrome.storage.local.get([PENDING_OTP_KEY], result => {
          resolve((result[PENDING_OTP_KEY] as { userId: string; email: string; createdAt: number } | undefined) ?? null)
        })
      }),
    ]).then(([authResult, pendingOtp]) => {
      if (authResult.user) {
        // Usuario ya autenticado — limpiar cualquier OTP pendiente residual
        chrome.storage.local.remove(PENDING_OTP_KEY)
        setAuth({ status: 'authed', user: authResult.user })
        return
      }

      // Usuario no autenticado: intentar restaurar OTP pendiente
      if (pendingOtp && Date.now() - pendingOtp.createdAt < OTP_TTL_MS) {
        // OTP válido: restaurar step "code" sin flash del step "email"
        setEmail(pendingOtp.email)
        setOtpUserId(pendingOtp.userId)
        setOtpStep('code')
      } else if (pendingOtp) {
        // OTP vencido: limpiar storage y mostrar aviso
        chrome.storage.local.remove(PENDING_OTP_KEY)
        setAuthError('El código venció, pedí uno nuevo.')
      }
      setAuth({ status: 'anon' })
    })
  }, [])

  // El login con Google corre en el background (el popup puede morir durante el
  // OAuth). Si el popup sigue vivo, el background emite AUTH_CHANGED al crear la
  // sesión: re-chequeamos account.get() para pasar a 'authed' sin reabrir.
  useEffect(() => {
    if (!REQUIRE_AUTH) return

    const onMessage = (msg: { type?: string } | undefined) => {
      if (msg?.type !== 'AUTH_CHANGED') return
      account
        .get()
        .then((user) => setAuth({ status: 'authed', user }))
        .catch(() => {
          // La sesión todavía no está visible acá; el chequeo al reabrir cubre el resto.
        })
    }

    chrome.runtime.onMessage.addListener(onMessage)
    return () => chrome.runtime.onMessage.removeListener(onMessage)
  }, [])

  const handleSaveConfig = () => {
    const blArray = blocklist.split('\n').map(d => d.trim().toLowerCase()).filter(Boolean)
    chrome.storage.local.set({ blocklist: blArray }, () => {
      setSaved(true)
      setEditMode(false)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const handleReset = () => {
    chrome.storage.local.set({ timeSpent: {}, grants: {}, conversations: {} }, () => {
      setStats([])
      setGrants({})
      setTimeSpent({})
    })
  }

  // Paso 1 OTP: solicita el código por email
  const handleRequestOtp = async () => {
    setAuthError(null)
    const trimmed = email.trim()
    if (!trimmed) {
      setAuthError('Ingresá tu email.')
      return
    }
    setAuthBusy(true)
    try {
      const userId = await requestEmailOtp(trimmed)
      // Persistir en storage local para sobrevivir el cierre del popup
      chrome.storage.local.set({ pendingOtp: { userId, email: trimmed, createdAt: Date.now() } })
      setOtpUserId(userId)
      setOtpCode('')
      setOtpStep('code')
    } catch (err) {
      if (err instanceof AppwriteException) {
        if (err.code === 429) {
          setAuthError('Demasiados intentos. Esperá un momento y volvé a intentar.')
        } else if (err.code === 400) {
          setAuthError('El email no es válido.')
        } else {
          setAuthError(err.message)
        }
      } else {
        setAuthError('No se pudo enviar el código. Verificá tu conexión.')
      }
    } finally {
      setAuthBusy(false)
    }
  }

  // Paso 2 OTP: verifica el código y abre la sesión
  const handleVerifyOtp = async () => {
    setAuthError(null)
    if (!otpCode.trim()) {
      setAuthError('Ingresá el código que te enviamos.')
      return
    }
    setAuthBusy(true)
    try {
      await verifyEmailOtp(otpUserId, otpCode.trim())
      // Sesión creada: limpiar OTP pendiente del storage
      chrome.storage.local.remove('pendingOtp')
      const user = await account.get()
      setAuth({ status: 'authed', user })
      setEmail('')
      setOtpCode('')
      setOtpUserId('')
      setOtpStep('email')
    } catch (err) {
      if (err instanceof AppwriteException) {
        setAuthError('Código incorrecto o vencido. Pedí uno nuevo.')
      } else {
        setAuthError('No se pudo verificar el código. Verificá tu conexión.')
      }
    } finally {
      setAuthBusy(false)
    }
  }

  const handleGoogleLogin = async () => {
    setAuthError(null)
    setAuthBusy(true)
    // Aviso suave: el popup suele morir cuando se abre la ventana de Google, así
    // que el await de abajo puede no resolverse. El background completa el flujo
    // igual; si el popup sigue vivo, AUTH_CHANGED nos pasa a 'authed'.
    setGoogleHint('Completá el login con Google y reabrí esta ventana.')
    try {
      await loginWithGoogle()
      const user = await account.get()
      setAuth({ status: 'authed', user })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'No se pudo iniciar sesión con Google.'
      setAuthError(msg)
    } finally {
      setAuthBusy(false)
    }
  }

  const handleLogout = async () => {
    try {
      await account.deleteSession({ sessionId: 'current' })
    } catch {
      // Ignorar: igual pasamos a estado anónimo
    }
    setAuth({ status: 'anon' })
  }

  // Registra interés en premium: escribe en la tabla `feedback` de Appwrite
  // (best-effort — jamás rompe la UI) y persiste el flag en chrome.storage.local.
  const handlePremium = async () => {
    setPremiumState('done')

    // Flag local inmediato (funciona aunque Appwrite falle)
    chrome.storage.local.set({ premiumInterest: true })

    // Señal de demanda en Appwrite — wrapped en try/catch total
    if (FEEDBACK_DATABASE_ID && FEEDBACK_TABLE_ID) {
      try {
        // Obtener el userId del usuario logueado (best-effort)
        let userId: string | undefined
        try {
          const user = await account.get()
          userId = user.$id
        } catch {
          // Sin sesión o REQUIRE_AUTH desactivado — continuamos sin userId
        }

        await tablesDB.createRow({
          databaseId: FEEDBACK_DATABASE_ID,
          tableId: FEEDBACK_TABLE_ID,
          rowId: ID.unique(),
          data: {
            kind: 'premium',
            ...(userId ? { userId } : {}),
          },
        })
      } catch {
        // El registro en Appwrite falló — ignorar silenciosamente
        // (el flag en chrome.storage.local ya captura el interés)
      }
    }
  }

  const currentDomains = blocklist.split('\n').map(d => d.trim().toLowerCase()).filter(Boolean)

  // Guard de forma: un lastUsage con forma vieja (cache previo) NO debe romper el
  // tab. Solo válido si trae las 3 dimensiones nuevas.
  const validUsage = !!(usage && usage.day && usage.domain && usage.week)
  // "Este sitio hoy" solo se muestra si la pestaña activa está en la blocklist.
  const currentDomainBlocked = !!currentDomain && currentDomains.includes(currentDomain)

  // ── Gate de autenticación (omitido cuando REQUIRE_AUTH es false) ─────────────
  if (REQUIRE_AUTH && auth.status !== 'authed') {
    return (
      <div style={s.container}>
        <PopupStyles />
        <div style={s.authShell}>
          {/* Header de login: mascota centrada + marca */}
          <div style={s.authHeader}>
            <div style={s.authMascotWrap}>
              <img src={characterImg} style={s.authMascot} alt="Picantully" />
            </div>
            <div style={s.authBrand}>Picantully</div>
            <div style={s.authTagline}>tu coach anti-distracción</div>
          </div>

          {auth.status === 'checking' ? (
            <div style={s.authCheckingBox}>
              <div style={s.spinner} className="pw-spin" />
              <div style={s.authCheckingText}>Verificando sesión…</div>
            </div>
          ) : otpStep === 'email' ? (
            <div style={s.authBody}>
              <button
                className="pw-google"
                style={s.googleBtn}
                onClick={handleGoogleLogin}
                disabled={authBusy}
              >
                <GoogleIcon />
                Continuar con Google
              </button>

              {googleHint && <div style={s.googleHint}>{googleHint}</div>}

              <div style={s.divider}>
                <span style={s.dividerLine} />
                <span style={s.dividerText}>o con tu email</span>
                <span style={s.dividerLine} />
              </div>

              <input
                className="pw-input"
                style={s.input}
                type="email"
                placeholder="vos@email.com"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleRequestOtp() }}
                disabled={authBusy}
              />

              {authError && <div style={s.authError}>{authError}</div>}

              <button className="pw-primary" style={s.btn} onClick={handleRequestOtp} disabled={authBusy}>
                {authBusy ? <span style={s.btnSpinner} className="pw-spin" /> : 'Enviar código'}
              </button>

              <div style={s.legal}>
                Te mandamos un código de un solo uso. Sin contraseñas, sin vueltas.
              </div>
            </div>
          ) : (
            <div style={s.authBody}>
              <div style={s.otpHint}>
                Meté el código que te mandamos a{' '}
                <strong style={{ color: colors.ink }}>{email}</strong>.
                Válido por 15 minutos.
              </div>

              <input
                className="pw-input pw-otp"
                style={s.otpInput}
                type="text"
                inputMode="numeric"
                placeholder="••••••"
                maxLength={6}
                autoFocus
                autoComplete="one-time-code"
                value={otpCode}
                onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => { if (e.key === 'Enter') handleVerifyOtp() }}
                disabled={authBusy}
              />

              {authError && <div style={s.authError}>{authError}</div>}

              <button
                className="pw-primary"
                style={s.btn}
                onClick={handleVerifyOtp}
                disabled={authBusy || otpCode.length < 6}
              >
                {authBusy ? <span style={s.btnSpinner} className="pw-spin" /> : 'Entrar'}
              </button>

              <div style={s.otpActions}>
                <button
                  className="pw-link"
                  style={s.otpLink}
                  onClick={() => { setAuthError(null); handleRequestOtp() }}
                  disabled={authBusy}
                >
                  Reenviar código
                </button>
                <span style={s.otpSep}>·</span>
                <button
                  className="pw-link"
                  style={s.otpLink}
                  onClick={() => {
                    // Volver al step "email": limpiar OTP pendiente del storage
                    chrome.storage.local.remove('pendingOtp')
                    setOtpStep('email')
                    setOtpCode('')
                    setOtpUserId('')
                    setAuthError(null)
                  }}
                  disabled={authBusy}
                >
                  Cambiar email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Vista autenticada (tabs existentes) ─────────────────────────────────────
  return (
    <div style={s.container}>
      <PopupStyles />

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={s.header}>
        <img src={characterImg} style={s.character} alt="Picantully" />
        <div style={s.headerText}>
          <div style={s.appName}>Picantully</div>
          {REQUIRE_AUTH && auth.status === 'authed' ? (
            <div style={s.userEmail} title={auth.user.email}>{auth.user.email}</div>
          ) : (
            <div style={s.tagline}>tu coach anti-distracción</div>
          )}
        </div>
        {REQUIRE_AUTH && auth.status === 'authed' && (
          <button className="pw-ghostbtn" style={s.logoutBtn} onClick={handleLogout} title="Cerrar sesión">
            Salir
          </button>
        )}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div style={s.tabBar}>
        {([['stats', 'Estadísticas'], ['uso', 'Uso'], ['config', 'Config']] as const).map(([k, lb]) => (
          <button
            key={k}
            style={{ ...s.tab, ...(activeTab === k ? s.tabActive : {}) }}
            onClick={() => setActiveTab(k)}
          >
            {lb}
          </button>
        ))}
      </div>

      {/* ── Stats tab ──────────────────────────────────────────────────── */}
      {activeTab === 'stats' && (
        <div style={s.tabContent}>
          {(() => {
            // Minutes spent on blocked sites today: sum timeSpent[domain][today] across all domains
            const today = todayISO()
            const todayBlockedSecs = Object.values(timeSpent).reduce(
              (sum, dates) => sum + (dates[today] ?? 0),
              0,
            )
            const todayBlockedMin = Math.floor(todayBlockedSecs / 60)

            // Negotiations today and this week from lastUsage
            const todayUsed = usage?.day.used ?? 0
            const todayLimit = usage?.day.limit ?? 0
            const weekUsed = usage?.week.used ?? 0
            const weekLimit = usage?.week.limit ?? 0

            return (
              <>
                {/* Mini stat cards — all backed by real storage data */}
                <div style={s.statGrid}>
                  <StatCard
                    icon={<LuClock size={17} color={colors.green} />}
                    iconBg={colors.greenSoft}
                    value={todayBlockedMin > 0 ? formatMinutes(todayBlockedMin) : '0m'}
                    label="min. en sitios bloqueados hoy"
                  />
                  <StatCard
                    icon={<LuShield size={17} color={colors.red} />}
                    iconBg={colors.redSoft}
                    value={String(currentDomains.length)}
                    label="sitios bloqueados"
                  />
                  <StatCard
                    icon={<LuTarget size={17} color={colors.gold} />}
                    iconBg={colors.amberSoft}
                    value={todayLimit > 0 ? `${todayUsed}/${todayLimit}` : String(todayUsed)}
                    label="negociaciones hoy"
                  />
                  <StatCard
                    icon={<LuTrophy size={17} color={colors.orange} />}
                    iconBg="rgba(255,138,60,0.14)"
                    value={weekLimit > 0 ? `${weekUsed}/${weekLimit}` : String(weekUsed)}
                    label="negociaciones esta semana"
                  />
                </div>

                {stats.length === 0 ? (
                  <div style={s.empty}>
                    <div style={s.emptyIcon}><LuTarget size={36} color={colors.red} /></div>
                    <div style={s.emptyText}>Sin historial esta semana.<br />Entrá a un sitio bloqueado para empezar.</div>
                  </div>
                ) : (
                  <>
                    <div style={s.tableHeader}>
                      <span style={{ flex: 1 }}>Sitio</span>
                      <span style={s.col}>Hoy</span>
                      <span style={s.col}>7 días</span>
                    </div>
                    <div style={s.domainList}>
                      {stats.map((stat, i) => (
                        <div key={stat.domain} style={{ ...s.domainRow, borderTop: i ? `1px solid ${colors.border}` : 'none' }}>
                          <span style={s.domainName}>{stat.domain}</span>
                          <span style={{ ...s.col, color: stat.todayMin > 30 ? colors.red : colors.green }}>
                            {formatMinutes(stat.todayMin)}
                          </span>
                          <span style={{ ...s.col, color: colors.ink400 }}>
                            {formatMinutes(stat.weekMin)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )
          })()}
          <div style={s.spacer} />
          <button className="pw-ghostbtn" style={{ ...s.btn, ...s.btnGhost }} onClick={handleReset}>
            Resetear tiempos y permisos
          </button>
        </div>
      )}

      {/* ── Uso tab ────────────────────────────────────────────────────── */}
      {activeTab === 'uso' && (
        <div style={s.tabContent}>
          {!validUsage ? (
            /* Estado vacío — todavía no hubo ninguna negociación (o cache viejo) */
            <div style={s.empty}>
              <div style={s.emptyIcon}><LuShield size={36} color={colors.red} /></div>
              <div style={s.emptyText}>Todavía no negociaste hoy.<br />Entrá a un sitio bloqueado para ver tu uso.</div>
            </div>
          ) : (
            <>
              {/* Barra: SITIO ACTUAL — arriba de todo, solo si la pestaña activa está en la blocklist */}
              {currentDomainBlocked ? (
                <UsageBar
                  label="Este sitio hoy"
                  sublabel={currentDomain!}
                  used={domainCounts[currentDomain!] ?? 0}
                  limit={usage!.domain.limit}
                />
              ) : null}

              {/* Barra: uso total del día */}
              <UsageBar
                label="Hoy"
                sublabel={`${usage!.day.used} de ${usage!.day.limit} negociaciones`}
                used={usage!.day.used}
                limit={usage!.day.limit}
              />

              {/* Barra: uso de la semana */}
              <UsageBar
                label="Esta semana"
                sublabel={`${usage!.week.used} de ${usage!.week.limit} negociaciones`}
                used={usage!.week.used}
                limit={usage!.week.limit}
              />
            </>
          )}

          {/* Botón premium — siempre visible en este tab */}
          <div style={s.premiumSeparator} />
          <PremiumButton state={premiumState} onPress={handlePremium} />
        </div>
      )}

      {/* ── Config tab ─────────────────────────────────────────────────── */}
      {activeTab === 'config' && (
        <div style={s.tabContent}>

          {/* Header de la sección */}
          <div style={s.sectionHeader}>
            <div>
              <div style={s.sectionTitle}>Sitios bloqueados</div>
              <div style={s.sectionSub}>{currentDomains.length} sitios · negociás para entrar</div>
            </div>
            <button className="pw-ghostbtn" style={s.editBtn} onClick={() => setEditMode(v => !v)}>
              {editMode ? 'Cancelar' : '+ Agregar'}
            </button>
          </div>

          {/* Lista de dominios con status */}
          {!editMode && (
            <div style={s.configDomainList}>
              {currentDomains.map((domain, i) => {
                const status = getDomainStatus(domain, grants, timeSpent, now)
                const expiry = grants[domain]
                return (
                  <div key={domain} style={{ ...s.domainRow, borderTop: i ? `1px solid ${colors.border}` : 'none' }}>
                    <span style={s.domainName}>{domain}</span>
                    {status === 'habilitado' && expiry && (
                      <span style={{ ...s.statusBadge, ...s.statusGreen }}>
                        {formatRemaining(expiry, now)}
                      </span>
                    )}
                    {status === 'bloqueado' && (
                      <span style={{ ...s.statusBadge, ...s.statusRed }}>
                        Bloqueado
                      </span>
                    )}
                    {status === 'por-negociar' && (
                      <span style={{ ...s.statusBadge, ...s.statusYellow }}>
                        Por negociar
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Resetear todos los estados */}
          {!editMode && (
            <button className="pw-ghostbtn" style={{ ...s.btn, ...s.btnGhost, marginTop: '2px' }} onClick={handleReset}>
              Resetear todo — volver a negociar
            </button>
          )}

          {/* Modo edición */}
          {editMode && (
            <>
              <div style={s.editHint}>
                Uno por línea. Si agregás un sitio nuevo, también modificá{' '}
                <span style={s.code}>manifest.json → matches</span> y reconstruí.
              </div>
              <textarea
                className="pw-input"
                style={s.textarea}
                value={blocklist}
                onChange={e => setBlocklist(e.target.value)}
                rows={9}
                spellCheck={false}
              />
              <button className="pw-primary" style={{ ...s.btn, ...(saved ? s.btnSuccess : {}) }} onClick={handleSaveConfig}>
                {saved ? (
                  <><LuCheck size={15} style={{ flexShrink: 0 }} /> ¡Guardado!</>
                ) : 'Guardar lista'}
              </button>
            </>
          )}

        </div>
      )}

    </div>
  )
}

// ── StatCard: mini tarjeta de estadística ────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode
  iconBg: string
  value: string
  label: string
}

function StatCard({ icon, iconBg, value, label }: StatCardProps) {
  return (
    <div style={s.statCard}>
      <div style={{ ...s.statIcon, background: iconBg }}>{icon}</div>
      <div style={s.statValue}>{value}</div>
      <div style={s.statLabel}>{label}</div>
    </div>
  )
}

// ── UsageBar: barra de progreso con etiqueta y sub-etiqueta ─────────────────

interface UsageBarProps {
  label: string
  sublabel: string
  used: number
  limit: number
}

function UsageBar({ label, sublabel, used, limit }: UsageBarProps) {
  const pct = limit > 0 ? Math.min(100, Math.max(0, (used / limit) * 100)) : 0
  const remaining = Math.max(0, limit - used)
  const isLow = remaining <= Math.ceil(limit * 0.2) // ámbar en el último 20%
  const fillColor = isLow ? colors.gold : colors.green

  return (
    <div style={s.usageBar}>
      <div style={s.usageBarHead}>
        <span style={s.usageBarLabel}>{label}</span>
        <span style={{ ...s.usageBarCount, color: isLow ? colors.amberText : colors.ink }}>
          {used}<span style={s.usageBarOf}> / {limit}</span>
        </span>
      </div>
      <div style={s.usageBarSub}>{sublabel}</div>
      <div style={s.usageTrack}>
        <div style={{ ...s.usageFill, width: `${pct}%`, background: fillColor }} />
      </div>
    </div>
  )
}

// ── PremiumButton: "Hacete Premium" con estado post-click ────────────────────

interface PremiumButtonProps {
  state: 'idle' | 'done'
  onPress: () => void
}

function PremiumButton({ state, onPress }: PremiumButtonProps) {
  if (state === 'done') {
    return (
      <div style={s.premiumDone}>
        <div style={s.premiumDoneIcon}>
          <LuTrophy size={28} color={colors.gold} />
        </div>
        <div style={s.premiumDoneTitle}>Premium está en camino</div>
        <div style={s.premiumDoneSub}>Te avisamos cuando esté listo. Gracias por el aguante.</div>
      </div>
    )
  }

  return (
    <button className="pw-premium" style={s.premiumBtn} onClick={onPress}>
      <LuCrown size={17} style={{ flexShrink: 0, opacity: 0.92 }} />
      Hacete Premium
    </button>
  )
}

// Logo oficial "G" de Google (4 trazos multicolor) como SVG inline.
// Inline para respetar la CSP de la extensión (sin imágenes/URLs externas).
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.98 21.98 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

// Pseudo-estados (hover/focus/spin) que los estilos inline no pueden expresar.
// Inyectado una sola vez por render del popup; el navegador deduplica reglas.
function PopupStyles() {
  return (
    <style>{`
      @keyframes pw-spin { to { transform: rotate(360deg); } }
      .pw-spin { animation: pw-spin 0.7s linear infinite; }

      @keyframes pw-fkIn { from { transform: translateY(12px); opacity: 0; } to { transform: none; opacity: 1; } }
      .pw-tab-content { animation: pw-fkIn 0.3s ease both; }

      .pw-input:focus {
        border-color: ${colors.red} !important;
        background: rgba(255,255,255,0.07) !important;
        box-shadow: 0 0 0 3.5px rgba(239,68,56,0.15) !important;
        outline: none !important;
      }
      .pw-input::placeholder { color: ${colors.ink200}; }

      .pw-primary:not(:disabled):hover {
        transform: translateY(-1px);
        box-shadow: ${shadow.redGlow};
      }
      .pw-primary:not(:disabled):active { transform: scale(0.96); box-shadow: none; }
      .pw-primary:focus-visible { outline: 3px solid rgba(239,68,56,0.35); outline-offset: 2px; }
      .pw-primary:disabled { opacity: 0.45; cursor: not-allowed; }

      .pw-google:not(:disabled):hover {
        border-color: ${colors.border2};
        background: rgba(255,255,255,0.08);
      }
      .pw-google:focus-visible { outline: 3px solid rgba(239,68,56,0.35); outline-offset: 2px; }
      .pw-google:disabled { opacity: 0.5; cursor: not-allowed; }

      .pw-ghostbtn:not(:disabled):hover { border-color: ${colors.border2}; color: ${colors.ink600}; }
      .pw-ghostbtn:focus-visible { outline: 3px solid rgba(239,68,56,0.35); outline-offset: 2px; }

      .pw-link:not(:disabled):hover { color: ${colors.red}; }
      .pw-link:disabled { opacity: 0.5; cursor: not-allowed; }

      .pw-otp:focus { letter-spacing: 0.32em; }

      .pw-premium:not(:disabled):hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 24px rgba(210,43,29,0.50);
      }
      .pw-premium:not(:disabled):active { transform: scale(0.96); box-shadow: none; }
      .pw-premium:focus-visible { outline: 3px solid rgba(239,68,56,0.35); outline-offset: 2px; }
    `}</style>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const s: Record<string, React.CSSProperties> = {
  container: {
    width: '380px',
    fontFamily: font.family,
    background: colors.bg2,
    backgroundImage: 'radial-gradient(120% 70% at 100% 0%, rgba(239,68,56,0.16), transparent 60%)',
    color: colors.ink,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    borderRadius: '0',
  },

  // ── Login shell ─────────────────────────────────────────────────────────────
  authShell: {
    display: 'flex',
    flexDirection: 'column',
    padding: '8px 28px 28px',
  },
  authHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    paddingTop: '22px',
    paddingBottom: '22px',
    position: 'relative',
  },
  authMascotWrap: {
    width: '104px',
    height: '104px',
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  authMascot: {
    height: '104px',
    width: 'auto',
    objectFit: 'contain',
    objectPosition: 'center bottom',
    userSelect: 'none',
    filter: 'drop-shadow(0 8px 18px rgba(239,68,56,0.35))',
  },
  authBrand: {
    fontSize: '30px',
    fontWeight: 700,
    fontFamily: font.display,
    color: colors.ink,
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
  },
  authTagline: {
    fontSize: '13.5px',
    color: colors.ink400,
    letterSpacing: font.trackBody,
    fontWeight: 500,
    marginTop: '2px',
  },
  authBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  authCheckingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '14px',
    padding: '24px 0 12px',
  },
  authCheckingText: {
    fontSize: '12.5px',
    color: colors.ink400,
    letterSpacing: font.trackBody,
    fontWeight: 500,
  },
  spinner: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    border: `2.5px solid ${colors.border}`,
    borderTopColor: colors.red,
  },
  btnSpinner: {
    display: 'inline-block',
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.35)',
    borderTopColor: '#fff',
  },
  legal: {
    fontSize: '11.5px',
    color: colors.ink200,
    textAlign: 'center',
    letterSpacing: font.trackBody,
    lineHeight: 1.5,
    marginTop: '2px',
  },

  // ── Header (autenticado) ─────────────────────────────────────────────────────
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '18px 18px 14px',
    borderBottom: `1px solid ${colors.border}`,
  },
  character: {
    height: '46px',
    width: 'auto',
    flexShrink: 0,
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 12px rgba(239,68,56,0.30))',
  },
  headerText: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' },
  appName: {
    fontSize: '19px',
    fontWeight: 700,
    fontFamily: font.display,
    color: colors.ink,
    letterSpacing: '-0.04em',
    lineHeight: 1.05,
  },
  tagline: { fontSize: '11px', color: colors.ink400, letterSpacing: font.trackBody },

  // ── Tabs ─────────────────────────────────────────────────────────────────────
  tabBar: {
    display: 'flex',
    gap: '4px',
    background: 'transparent',
    margin: '12px 12px 0',
    borderRadius: radius.md,
    padding: '4px',
  },
  tab: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderRadius: radius.md,
    padding: '10px 6px',
    fontSize: '13.5px',
    fontWeight: 700,
    color: colors.ink400,
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
    letterSpacing: font.trackBody,
  },
  tabActive: {
    background: colors.redGrad,
    color: '#fff',
    boxShadow: '0 6px 16px rgba(210,43,29,0.35)',
  },

  // ── Content area ───────────────────────────────────────────────────────────
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px 16px 18px',
    minHeight: '260px',
  },

  // ── Stat grid (2×2) ───────────────────────────────────────────────────────
  statGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    marginBottom: '6px',
  },
  statCard: {
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    padding: '14px',
  },
  statIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '22px',
    fontWeight: 700,
    fontFamily: font.display,
    color: colors.ink,
    lineHeight: 1.1,
  },
  statLabel: { fontSize: '11px', color: colors.ink400, marginTop: '2px' },

  // ── Stats table ───────────────────────────────────────────────────────────
  tableHeader: {
    display: 'flex',
    fontSize: '10.5px',
    color: colors.ink200,
    padding: '0 8px 8px',
    borderBottom: `1px solid ${colors.border}`,
    marginBottom: '0',
    fontWeight: 800,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.06em',
  },
  domainList: {
    display: 'flex',
    flexDirection: 'column',
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    overflow: 'hidden',
    maxHeight: '200px',
    overflowY: 'auto',
  },
  configDomainList: {
    display: 'flex',
    flexDirection: 'column',
    background: colors.card,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.md,
    overflow: 'hidden',
    maxHeight: '248px',
    overflowY: 'auto',
  },
  domainRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '11px 14px',
    gap: '8px',
  },
  domainName: {
    flex: 1,
    fontSize: '13.5px',
    color: colors.ink,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    letterSpacing: font.trackBody,
  },
  col: {
    width: '56px',
    textAlign: 'right' as const,
    fontSize: '13.5px',
    fontVariantNumeric: 'tabular-nums',
    fontWeight: 700,
    fontFamily: font.display,
    flexShrink: 0,
    letterSpacing: font.trackBody,
  },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', padding: '28px 0' },
  emptyIcon: { display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 },
  emptyText: {
    fontSize: '12.5px',
    color: colors.ink400,
    textAlign: 'center' as const,
    lineHeight: 1.55,
    letterSpacing: font.trackBody,
  },
  spacer: { height: '4px' },

  // ── Config section header ───────────────────────────────────────────────────
  sectionHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '6px',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: font.display,
    color: colors.ink,
    letterSpacing: '-0.02em',
  },
  sectionSub: {
    fontSize: '11px',
    color: colors.ink200,
    marginTop: '3px',
    letterSpacing: font.trackBody,
  },
  editBtn: {
    background: 'transparent',
    border: `1px solid ${colors.border2}`,
    borderRadius: radius.sm,
    padding: '7px 12px',
    fontSize: '12px',
    fontWeight: 700,
    color: colors.red,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    letterSpacing: font.trackBody,
    transition: 'border-color 0.15s, color 0.15s',
  },

  // ── Status badges ──────────────────────────────────────────────────────────
  statusBadge: {
    flexShrink: 0,
    fontSize: '11px',
    fontWeight: 800,
    padding: '4px 10px',
    borderRadius: radius.pill,
    letterSpacing: font.trackBody,
    whiteSpace: 'nowrap',
    fontVariantNumeric: 'tabular-nums',
  },
  statusGreen: {
    background: colors.greenSoft,
    color: colors.greenText,
    border: `1.5px solid ${colors.greenSoftBorder}`,
  },
  statusRed: {
    background: colors.redSoft,
    color: colors.red,
    border: `1.5px solid ${colors.redSoftBorder}`,
  },
  statusYellow: {
    background: colors.amberSoft,
    color: colors.gold,
    border: `1.5px solid ${colors.amberSoftBorder}`,
  },

  // ── Edit mode ──────────────────────────────────────────────────────────────
  editHint: { fontSize: '11px', color: colors.ink200, lineHeight: 1.55 },
  textarea: {
    background: colors.fieldBg,
    border: `1px solid ${colors.fieldBorder}`,
    borderRadius: radius.md,
    padding: '10px 12px',
    color: colors.ink,
    fontSize: '12px',
    width: '100%',
    resize: 'vertical' as const,
    outline: 'none',
    fontFamily: font.mono,
    lineHeight: 1.7,
    boxSizing: 'border-box' as const,
  },

  // ── Buttons ────────────────────────────────────────────────────────────────
  btn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '52px',
    background: colors.redGrad,
    color: '#fff',
    border: 'none',
    borderRadius: radius.md,
    padding: '13px 16px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
    letterSpacing: '-0.02em',
    transition: 'background 0.18s, transform 0.12s, box-shadow 0.18s',
    boxShadow: shadow.redGlow,
  },
  btnSuccess: {
    background: colors.greenSoft,
    color: colors.greenText,
    border: `1.5px solid ${colors.greenSoftBorder}`,
    boxShadow: 'none',
  },
  btnGhost: {
    background: colors.card,
    color: colors.ink400,
    border: `1px solid ${colors.border}`,
    boxShadow: 'none',
    fontSize: '13px',
    fontWeight: 600,
  },

  // ── Auth header bits ─────────────────────────────────────────────────────────
  userEmail: {
    fontSize: '11px',
    color: colors.ink400,
    letterSpacing: font.trackBody,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '210px',
  },
  logoutBtn: {
    background: 'transparent',
    border: `1px solid ${colors.border2}`,
    borderRadius: radius.md,
    padding: '8px 14px',
    fontSize: '13px',
    fontWeight: 700,
    color: colors.ink400,
    cursor: 'pointer',
    fontFamily: 'inherit',
    flexShrink: 0,
    letterSpacing: font.trackBody,
    transition: 'border-color 0.15s, color 0.15s',
  },

  // ── Inputs ────────────────────────────────────────────────────────────────
  input: {
    background: colors.fieldBg,
    border: `1px solid ${colors.fieldBorder}`,
    borderRadius: radius.md,
    padding: '14px 16px',
    color: colors.ink,
    fontSize: '14.5px',
    width: '100%',
    outline: 'none',
    fontFamily: 'inherit',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
  },
  otpInput: {
    background: colors.fieldBg,
    border: `1px solid ${colors.fieldBorder}`,
    borderRadius: radius.md,
    padding: '16px 12px',
    color: colors.ink,
    fontSize: '28px',
    width: '100%',
    outline: 'none',
    fontFamily: font.display,
    boxSizing: 'border-box' as const,
    textAlign: 'center' as const,
    letterSpacing: '0.32em',
    fontWeight: 700,
    fontVariantNumeric: 'tabular-nums',
    transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s, letter-spacing 0.2s',
  },
  authError: {
    fontSize: '12.5px',
    color: colors.red,
    background: colors.redSoft,
    borderRadius: radius.md,
    padding: '10px 13px',
    lineHeight: 1.5,
    border: `1px solid ${colors.redSoftBorder}`,
    letterSpacing: font.trackBody,
  },

  // ── Botón de Google ──────────────────────────────────────────────────────────
  googleBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '9px',
    minHeight: '50px',
    background: colors.card,
    color: colors.ink,
    border: `1px solid ${colors.border2}`,
    borderRadius: radius.md,
    padding: '12px',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    width: '100%',
    fontFamily: 'inherit',
    letterSpacing: '-0.02em',
    transition: 'border-color 0.2s, background 0.2s',
  },
  googleHint: {
    fontSize: '11.5px',
    color: colors.ink400,
    textAlign: 'center' as const,
    lineHeight: 1.5,
    letterSpacing: font.trackBody,
    marginTop: '-2px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: '4px 0',
  },
  dividerLine: { flex: 1, height: '1px', background: colors.border },
  dividerText: {
    fontSize: '12px',
    color: colors.ink200,
    fontWeight: 600,
    letterSpacing: font.trackBody,
  },

  code: {
    fontFamily: font.mono,
    background: colors.card,
    padding: '1px 5px',
    borderRadius: '4px',
    fontSize: '10.5px',
    color: colors.ink400,
  },

  // ── OTP step "code" ──────────────────────────────────────────────────────────
  otpHint: {
    fontSize: '13.5px',
    color: colors.ink400,
    lineHeight: 1.5,
    letterSpacing: font.trackBody,
    textAlign: 'center' as const,
  },
  otpActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    marginTop: '2px',
  },
  otpLink: {
    background: 'none',
    border: 'none',
    padding: '2px 4px',
    fontSize: '12.5px',
    color: colors.ink400,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: font.trackBody,
    fontWeight: 600,
    transition: 'color 0.15s',
  },
  otpSep: { fontSize: '12px', color: colors.ink200 },

  // ── Uso tab: track + fill ────────────────────────────────────────────────────
  usageTrack: {
    width: '100%',
    height: '8px',
    borderRadius: radius.pill,
    background: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  usageFill: {
    height: '100%',
    borderRadius: radius.pill,
    transition: 'width 0.3s ease, background 0.3s ease',
  },

  // ── Uso tab: barras de progreso ───────────────────────────────────────────────
  usageBar: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
    padding: '14px 16px',
    background: colors.card,
    borderRadius: radius.md,
    border: `1px solid ${colors.border}`,
  },
  usageBarHead: { display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' },
  usageBarLabel: {
    fontSize: '14px',
    fontWeight: 800,
    fontFamily: font.display,
    color: colors.ink,
    letterSpacing: '-0.02em',
  },
  usageBarCount: {
    fontSize: '16px',
    fontWeight: 700,
    fontFamily: font.display,
    fontVariantNumeric: 'tabular-nums',
    letterSpacing: '-0.02em',
  },
  usageBarOf: { fontSize: '12px', fontWeight: 600, color: colors.ink200 },
  usageBarSub: {
    fontSize: '11px',
    color: colors.ink400,
    letterSpacing: font.trackBody,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginBottom: '2px',
  },

  // ── Uso tab: separador antes del botón premium ────────────────────────────────
  premiumSeparator: { height: '6px' },

  // ── Botón "Hacete Premium" ────────────────────────────────────────────────────
  premiumBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    minHeight: '52px',
    width: '100%',
    background: colors.redGrad,
    color: '#fff',
    border: 'none',
    borderRadius: radius.md,
    padding: '14px 16px',
    fontSize: '15px',
    fontWeight: 800,
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '-0.02em',
    transition: 'transform 0.15s, box-shadow 0.18s',
    boxShadow: '0 12px 30px rgba(210,43,29,0.40), inset 0 1px 1px rgba(255,255,255,0.22)',
  },

  // ── Estado post-click del botón premium ──────────────────────────────────────
  premiumDone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    padding: '20px 16px',
    textAlign: 'center' as const,
    background: colors.redSoft,
    borderRadius: radius.md,
    border: `1px solid ${colors.redSoftBorder}`,
  },
  premiumDoneIcon: { fontSize: '28px', lineHeight: 1 },
  premiumDoneTitle: {
    fontSize: '15px',
    fontWeight: 800,
    fontFamily: font.display,
    color: colors.red,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
  },
  premiumDoneSub: {
    fontSize: '12.5px',
    color: colors.ink400,
    lineHeight: 1.5,
    letterSpacing: font.trackBody,
  },
}
