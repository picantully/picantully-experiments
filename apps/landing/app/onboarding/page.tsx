'use client'

/**
 * Onboarding flow — 6-screen state machine (screens 0..5).
 * Faithfully ported from the Claude Design HTML prototype.
 *
 *   0 · WELCOME  — confetti on mount, access ticket, Empecemos
 *   1 · CONNECT  — Google OAuth or Email OTP (real Appwrite auth)
 *   2 · ABOUT    — name, birth date, gender
 *   3 · GOALS    — occupation, distracting sites, spice level
 *   4 · INSTALL  — platform download cards
 *   5 · DONE     — confetti, personalized with first name
 *
 * Auth wiring:
 *   - Email OTP: account.createEmailToken → store userId → account.createSession
 *   - Google:    account.createOAuth2Token (redirect) → on mount parse ?userId&secret → createSession
 *   - Session check on mount: if account.get() succeeds, skip step 1
 *
 * Profile persistence:
 *   tablesDB.upsertRow with userId as rowId.
 *   Writes: userId, locale, firstName, lastName, gender, birthDate, occupation,
 *   studyField, workField, spiceLevel, occupations[], onboardingCompleted.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import { z } from 'zod'
import { ID, OAuthProvider, AppwriteException } from 'appwrite'
import { account, tablesDB, functions, DB_ID } from '@/lib/appwrite'
import logo from '@picantully/design-system/assets/picantully-logo.png'
import still from '@picantully/design-system/assets/picantully.png'
import proud from '@picantully/design-system/assets/picantully-1.gif'
import excited from '@picantully/design-system/assets/picantully-2.gif'
import { Button } from '@picantully/design-system'
import s from './onboarding.module.css'

// ── Constants ───────────────────────────────────────────────────────────────

const TABLE_PROFILES = 'profiles'

const CONFETTI_COLORS = ['#ef4438', '#51E98F', '#ffb02e', '#ff8a3c', '#ff6a4d']

// ── Types ────────────────────────────────────────────────────────────────────

type OccupationValue = 'study' | 'work' | 'procrastinate'
type SpiceLevel = 'mild' | 'medium' | 'extreme'
type Gender = 'm' | 'f' | 'x'

interface OnboardingState {
  firstName: string
  lastName: string
  birthDay: string
  birthMonth: string
  birthYear: string
  gender: Gender | null
  occupations: OccupationValue[]
  detailField: string
  distractingSites: string[]
  spiceLevel: SpiceLevel | null
}

// ── Validation ───────────────────────────────────────────────────────────────

const emailSchema = z
  .string()
  .email('Ese mail no tiene pinta de ser válido. Revisalo.')

// Months shown in the birth-date select. Index = month number - 1.
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

// Picantully is an 18+ product (see Terms). Onboarding enforces it.
const MIN_AGE = 18

// Returns a real calendar Date built from the three fields, or null if the
// combination is not a real date (e.g. day 32, or Feb 30 — the Date rolls over,
// so we detect that the parts changed).
function buildBirthDate(day: number, monthIndex: number, year: number): Date | null {
  const d = new Date(year, monthIndex, day)
  if (d.getFullYear() !== year || d.getMonth() !== monthIndex || d.getDate() !== day) {
    return null
  }
  return d
}

function ageFrom(date: Date): number {
  const now = new Date()
  let age = now.getFullYear() - date.getFullYear()
  const monthDiff = now.getMonth() - date.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < date.getDate())) age--
  return age
}

// "About you" step — names, real birth date (18+), gender handled separately
// (it's a nullable single-select, validated outside zod).
const aboutSchema = z
  .object({
    firstName: z.string().trim().min(2, 'Decime tu nombre.').max(60, 'Quedó demasiado largo.'),
    lastName: z.string().trim().min(2, 'Decime tu apellido.').max(60, 'Quedó demasiado largo.'),
    birthDay: z.string().min(1, 'Falta el día.'),
    birthMonth: z.string().min(1, 'Elegí el mes.'),
    birthYear: z.string().min(1, 'Falta el año.'),
  })
  .superRefine((v, ctx) => {
    const day = Number(v.birthDay)
    const monthIndex = MONTHS.indexOf(v.birthMonth as (typeof MONTHS)[number])
    const year = Number(v.birthYear)
    const currentYear = new Date().getFullYear()

    const dayOk = Number.isInteger(day) && day >= 1 && day <= 31
    const monthOk = monthIndex >= 0
    const yearOk =
      v.birthYear.length === 4 && Number.isInteger(year) && year >= 1900 && year <= currentYear

    if (!dayOk) ctx.addIssue({ code: 'custom', path: ['birthDay'], message: 'Día inválido (1–31).' })
    if (!monthOk) ctx.addIssue({ code: 'custom', path: ['birthMonth'], message: 'Elegí el mes.' })
    if (!yearOk) {
      ctx.addIssue({ code: 'custom', path: ['birthYear'], message: `Año inválido (1900–${currentYear}).` })
    }

    // Only validate the composed date once each part is individually plausible.
    if (dayOk && monthOk && yearOk) {
      const date = buildBirthDate(day, monthIndex, year)
      if (!date) {
        ctx.addIssue({ code: 'custom', path: ['birthDay'], message: 'Esa fecha no existe.' })
      } else if (ageFrom(date) < MIN_AGE) {
        ctx.addIssue({ code: 'custom', path: ['birthYear'], message: 'Tenés que ser mayor de 18.' })
      }
    }
  })

// "Goals" step — occupation (≥1), conditional detail, spice handled separately.
const goalsSchema = z
  .object({
    occupations: z
      .array(z.enum(['study', 'work', 'procrastinate']))
      .min(1, 'Elegí al menos una opción.'),
    detailField: z.string(),
  })
  .superRefine((v, ctx) => {
    const needsDetail = v.occupations.includes('study') || v.occupations.includes('work')
    if (needsDetail && v.detailField.trim().length < 2) {
      ctx.addIssue({ code: 'custom', path: ['detailField'], message: 'Contanos un poco más.' })
    }
  })

// Flattens zod issues into a { field: message } map (first message per field).
function issuesToErrors(issues: z.ZodIssue[]): Record<string, string> {
  const errs: Record<string, string> = {}
  for (const issue of issues) {
    const key = issue.path[0]
    if (typeof key === 'string' && !errs[key]) errs[key] = issue.message
  }
  return errs
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function deriveOccupation(
  occupations: OccupationValue[],
): string | null {
  if (occupations.includes('procrastinate')) return 'procrastinate'
  if (occupations.includes('study') && occupations.includes('work')) return 'both'
  if (occupations.includes('study')) return 'study'
  if (occupations.includes('work')) return 'work'
  return null
}

function deriveStudyField(
  occupations: OccupationValue[],
  detailField: string,
): string {
  if (occupations.includes('study')) return detailField.slice(0, 160)
  return ''
}

function deriveWorkField(
  occupations: OccupationValue[],
  detailField: string,
): string {
  if (occupations.includes('work') && !occupations.includes('study')) return detailField.slice(0, 160)
  return ''
}

async function saveOnboarding(
  userId: string,
  data: OnboardingState,
): Promise<void> {
  const occupation = deriveOccupation(data.occupations)
  const studyField = deriveStudyField(data.occupations, data.detailField)
  const workField = deriveWorkField(data.occupations, data.detailField)

  // Compose birthDate as 'YYYY-MM-DD' when all three parts are present and valid.
  let birthDate: string | null = null
  if (data.birthDay && data.birthMonth && data.birthYear) {
    const day = Number(data.birthDay)
    const monthIndex = MONTHS.indexOf(data.birthMonth as (typeof MONTHS)[number])
    const year = Number(data.birthYear)
    if (monthIndex >= 0 && Number.isInteger(day) && Number.isInteger(year)) {
      const composed = buildBirthDate(day, monthIndex, year)
      if (composed) {
        const mm = String(monthIndex + 1).padStart(2, '0')
        const dd = String(day).padStart(2, '0')
        const yyyy = String(year).padStart(4, '0')
        birthDate = `${yyyy}-${mm}-${dd}`
      }
    }
  }

  const firstName = data.firstName.trim()
  const lastName = data.lastName.trim()

  await tablesDB.upsertRow({
    databaseId: DB_ID,
    tableId: TABLE_PROFILES,
    rowId: userId,
    data: {
      userId,
      locale: 'es-AR',
      ...(firstName ? { firstName } : {}),
      ...(lastName ? { lastName } : {}),
      ...(data.gender ? { gender: data.gender } : {}),
      ...(birthDate ? { birthDate } : {}),
      ...(occupation ? { occupation } : {}),
      ...(studyField ? { studyField } : {}),
      ...(workField ? { workField } : {}),
      ...(data.spiceLevel ? { spiceLevel: data.spiceLevel } : {}),
      occupations: Array.from(data.occupations),
      onboardingCompleted: true,
    },
  })
}

// ── Confetti ──────────────────────────────────────────────────────────────────

interface ConfettiPiece {
  id: number
  left: number
  color: string
  duration: number
  delay: number
  rotation: number
}

function createConfetti(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: Date.now() + i,
    left: Math.random() * 100,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    duration: 2.4 + Math.random() * 1.8,
    delay: Math.random() * 0.6,
    rotation: Math.random() * 360,
  }))
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  // Confetti is initialized lazily: createConfetti runs once on mount via useEffect.
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  // Auth state
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [otpUserId, setOtpUserId] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [showOtp, setShowOtp] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [loggedInUserId, setLoggedInUserId] = useState<string | null>(null)
  const [loggedInEmail, setLoggedInEmail] = useState<string | null>(null)
  // Real access number, passed by the acceptance email link (/onboarding?access=427).
  const [accessNumber, setAccessNumber] = useState<string | null>(null)

  // Onboarding data
  const [formData, setFormData] = useState<OnboardingState>({
    firstName: '',
    lastName: '',
    birthDay: '',
    birthMonth: '',
    birthYear: '',
    gender: null,
    occupations: [],
    detailField: '',
    distractingSites: [],
    spiceLevel: null,
  })

  // Per-field validation errors for the About and Goals steps.
  const [errors, setErrors] = useState<Record<string, string>>({})

  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  // Track whether the welcome confetti has already been scheduled
  const welcomeConfettiFired = useRef(false)

  // Burst welcome confetti on mount. We put the initial setState inside a
  // zero-delay callback so it does not run synchronously inside the effect body,
  // which avoids the react-hooks/set-state-in-effect lint error.
  useEffect(() => {
    if (welcomeConfettiFired.current) return
    welcomeConfettiFired.current = true

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const scheduleTimer = setTimeout(() => {
      setConfetti(createConfetti(60))
      const clearTimer = setTimeout(() => setConfetti([]), 5200)
      return () => clearTimeout(clearTimer)
    }, 0)

    return () => clearTimeout(scheduleTimer)
  }, [])

  useEffect(() => {
    async function checkSessionAndOAuth() {
      const params = new URLSearchParams(window.location.search)
      const oauthUserId = params.get('userId')
      const oauthSecret = params.get('secret')

      // Real access number from the acceptance email link — read before the
      // OAuth branch below strips the query string via replaceState.
      const access = params.get('access')
      if (access) setAccessNumber(access)

      // OAuth return: create session from token
      if (oauthUserId && oauthSecret) {
        // Clean up URL without reload
        window.history.replaceState({}, '', '/onboarding')
        try {
          await account.createSession({ userId: oauthUserId, secret: oauthSecret })
          const user = await account.get()
          setLoggedInUserId(user.$id)
          setLoggedInEmail(user.email)
          await bootstrapFromWaitlist()
          await prefillFromProfile(user.$id)
          setStep(2) // skip connect, go to about
          return
        } catch {
          // OAuth failed — stay on connect screen, show error
          setAuthError('No pudimos verificar tu cuenta de Google. Probá con email.')
          setStep(1)
          return
        }
      }

      // Existing session: record it so the connect step can offer a one-tap
      // "Seguir" button — but DO NOT auto-advance. Navigation is button-only;
      // the user always starts on the welcome screen.
      try {
        const user = await account.get()
        setLoggedInUserId(user.$id)
        setLoggedInEmail(user.email)
        await bootstrapFromWaitlist()
        await prefillFromProfile(user.$id)
      } catch {
        // No session — start normally at step 0
      }
    }

    checkSessionAndOAuth()
  }, [])

  const burst = useCallback(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return
    const pieces = createConfetti(80)
    setConfetti(pieces)
    setTimeout(() => setConfetti([]), 4600)
  }, [])

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goNext() {
    if (step < 5) {
      setStep(s => {
        const next = s + 1
        if (next === 5) burst()
        return next
      })
      scrollToTop()
    }
  }

  function goPrev() {
    if (step > 1) {
      setErrors({})
      setStep(s => s - 1)
      scrollToTop()
    }
  }

  // ── Auth handlers ────────────────────────────────────────────────────────

  function handleGoogleLogin() {
    const origin = window.location.origin
    account.createOAuth2Token({
      provider: OAuthProvider.Google,
      success: `${origin}/onboarding`,
      failure: `${origin}/onboarding`,
    })
    // createOAuth2Token triggers a redirect — execution stops here
  }

  async function handleUseAnotherAccount() {
    try {
      await account.deleteSession({ sessionId: 'current' })
    } catch {
      // No active session to drop — ignore.
    }
    setLoggedInUserId(null)
    setLoggedInEmail(null)
    setShowOtp(false)
    setOtp(['', '', '', '', '', ''])
    setEmail('')
    setAuthError('')
  }

  // Lazily copy waitlist answers into the user's profile by calling the
  // server-side function. Best-effort: failures must never block onboarding.
  // Security: the function resolves the user's email from the session (not the
  // body), so there is nothing sensitive to send from the client.
  async function bootstrapFromWaitlist() {
    try {
      await functions.createExecution({
        functionId: 'waitlist',
        body: JSON.stringify({ action: 'bootstrap-profile' }),
        async: false,
      })
    } catch {
      // Best-effort — ignore failures.
    }
  }

  // Prefill occupation/detail from the user's OWN profile, if it already holds
  // data. At acceptance time the backend copies the waitlist answers
  // (occupations/studyField/workField) into the profile; the waitlist table is
  // locked to clients, so we never read it directly here — we read the profile.
  async function prefillFromProfile(userId: string) {
    try {
      const row = await tablesDB.getRow({
        databaseId: DB_ID,
        tableId: TABLE_PROFILES,
        rowId: userId,
      })
      const occupation = typeof row.occupation === 'string' ? row.occupation : ''
      const occupations: OccupationValue[] =
        occupation === 'both'
          ? ['study', 'work']
          : occupation === 'study'
            ? ['study']
            : occupation === 'work'
              ? ['work']
              : occupation === 'procrastinate'
                ? ['procrastinate']
                : []
      const detail =
        (typeof row.studyField === 'string' && row.studyField) ||
        (typeof row.workField === 'string' && row.workField) ||
        ''

      // Parse birthDate 'YYYY-MM-DD' back into separate day/month/year fields.
      let birthDay = ''
      let birthMonth = ''
      let birthYear = ''
      if (typeof row.birthDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.birthDate)) {
        const [yyyy, mm, dd] = row.birthDate.split('-')
        const monthIdx = Number(mm) - 1
        if (monthIdx >= 0 && monthIdx < MONTHS.length) {
          birthYear = yyyy
          birthMonth = MONTHS[monthIdx]
          birthDay = String(Number(dd))
        }
      }

      const rowGender =
        row.gender === 'm' || row.gender === 'f' || row.gender === 'x'
          ? (row.gender as Gender)
          : null

      const rowSpiceLevel =
        row.spiceLevel === 'mild' || row.spiceLevel === 'medium' || row.spiceLevel === 'extreme'
          ? (row.spiceLevel as SpiceLevel)
          : null

      const rowFirstName = typeof row.firstName === 'string' ? row.firstName : ''
      const rowLastName = typeof row.lastName === 'string' ? row.lastName : ''

      setFormData(prev => ({
        ...prev,
        ...(occupations.length > 0 ? { occupations } : {}),
        detailField: prev.detailField || detail,
        ...(rowFirstName && !prev.firstName ? { firstName: rowFirstName } : {}),
        ...(rowLastName && !prev.lastName ? { lastName: rowLastName } : {}),
        ...(rowGender && !prev.gender ? { gender: rowGender } : {}),
        ...(birthYear && !prev.birthYear
          ? { birthDay, birthMonth, birthYear }
          : {}),
        ...(rowSpiceLevel && !prev.spiceLevel ? { spiceLevel: rowSpiceLevel } : {}),
      }))
    } catch {
      // No profile row yet (404) or unreadable — nothing to prefill.
    }
  }

  async function handleSendCode() {
    setEmailError('')
    const result = emailSchema.safeParse(email)
    if (!result.success) {
      setEmailError(result.error.errors[0].message)
      return
    }
    setAuthLoading(true)
    try {
      const token = await account.createEmailToken({ userId: ID.unique(), email })
      setOtpUserId(token.userId)
      setShowOtp(true)
      setTimeout(() => otpRefs.current[0]?.focus(), 50)
    } catch (err) {
      if (err instanceof AppwriteException) {
        setEmailError('No pudimos mandar el código. Revisá el email o probá de nuevo.')
      } else {
        setEmailError('Algo salió mal. Intentá de nuevo en un momento.')
      }
    } finally {
      setAuthLoading(false)
    }
  }

  async function handleVerifyCode() {
    const code = otp.join('')
    if (code.length < 6) return
    setAuthLoading(true)
    setAuthError('')
    try {
      await account.createSession({ userId: otpUserId, secret: code })
      const user = await account.get()
      setLoggedInUserId(user.$id)
      setLoggedInEmail(user.email)
      await bootstrapFromWaitlist()
      await prefillFromProfile(user.$id)
      goNext()
    } catch {
      setAuthError('Código incorrecto o vencido. Pedí uno nuevo.')
    } finally {
      setAuthLoading(false)
    }
  }

  function handleOtpChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    if (digit && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // ── Finish handler ───────────────────────────────────────────────────────

  async function handleFinish() {
    if (loggedInUserId) {
      try {
        await saveOnboarding(loggedInUserId, formData)
      } catch {
        // Non-blocking — proceed to done screen even if profile save fails
      }
    }
    goNext()
  }

  // ── Per-step validation ────────────────────────────────────────────────────

  function clearError(field: string) {
    setErrors(prev => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  function validateAbout(): boolean {
    const parsed = aboutSchema.safeParse({
      firstName: formData.firstName,
      lastName: formData.lastName,
      birthDay: formData.birthDay,
      birthMonth: formData.birthMonth,
      birthYear: formData.birthYear,
    })
    const errs: Record<string, string> = parsed.success
      ? {}
      : issuesToErrors(parsed.error.issues)
    if (!formData.gender) errs.gender = 'Elegí una opción.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleAboutNext() {
    if (validateAbout()) goNext()
  }

  function validateGoals(): boolean {
    const parsed = goalsSchema.safeParse({
      occupations: formData.occupations,
      detailField: formData.detailField,
    })
    const errs: Record<string, string> = parsed.success
      ? {}
      : issuesToErrors(parsed.error.issues)
    if (!formData.spiceLevel) errs.spiceLevel = 'Elegí qué tan picante.'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleGoalsNext() {
    if (validateGoals()) goNext()
  }

  // ── Occupation logic ─────────────────────────────────────────────────────

  function toggleOccupation(v: OccupationValue) {
    setFormData(prev => {
      if (v === 'procrastinate') {
        const alreadyOn = prev.occupations.includes('procrastinate')
        return { ...prev, occupations: alreadyOn ? [] : ['procrastinate'], detailField: '' }
      }
      const withoutProc = prev.occupations.filter(x => x !== 'procrastinate')
      const already = withoutProc.includes(v)
      const next = already ? withoutProc.filter(x => x !== v) : [...withoutProc, v]
      if (next.length === 0) return { ...prev, occupations: [], detailField: '' }
      return { ...prev, occupations: next as OccupationValue[] }
    })
  }

  function toggleSite(v: string) {
    setFormData(prev => ({
      ...prev,
      distractingSites: prev.distractingSites.includes(v)
        ? prev.distractingSites.filter(x => x !== v)
        : [...prev.distractingSites, v],
    }))
  }

  // ── Detail field label ───────────────────────────────────────────────────

  function detailLabel(): string {
    const { occupations } = formData
    const est = occupations.includes('study')
    const tra = occupations.includes('work')
    if (est && tra) return '¿Qué estudiás y en qué laburás?'
    if (est) return '¿Qué estudiás?'
    return '¿En qué laburás?'
  }

  function detailPlaceholder(): string {
    const { occupations } = formData
    const est = occupations.includes('study')
    const tra = occupations.includes('work')
    if (est && tra) return 'Ej: Estudio Sistemas y trabajo de dev…'
    if (est) return 'Ej: Ingeniería, Medicina, Diseño…'
    if (tra) return 'Ej: Dev, Marketing, Ventas…'
    return ''
  }

  const showDetailInput =
    formData.occupations.includes('study') || formData.occupations.includes('work')

  // ── Progress bar ─────────────────────────────────────────────────────────

  const progressPct = (Math.min(step, 5) / 5) * 100
  const stepLabel = step >= 5 ? '¡Listo!' : `Paso ${Math.min(step + 1, 5)} de 5`

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Confetti layer */}
      <div className={s.confettiContainer} aria-hidden="true">
        {confetti.map(p => (
          <div
            key={p.id}
            className={s.confettiPiece}
            style={{
              left: `${p.left}vw`,
              background: p.color,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              transform: `rotate(${p.rotation}deg)`,
            }}
          />
        ))}
      </div>

      {/* Top bar */}
      <div className={s.top}>
        <div className={s.topIn}>
          <Link href="/" className={s.brand}>
            <img src={logo.src} alt="" />
            Picantully
            <small className={s.brandSub}>Focus</small>
          </Link>
          <div className={s.pbar}>
            <div className={s.pbarFill} style={{ width: `${progressPct}%` }} />
          </div>
          <span className={s.pstep}>{stepLabel}</span>
        </div>
      </div>

      {/* Stage */}
      <div className={s.stage}>
        {step === 0 && <ScreenWelcome onStart={() => { setStep(1); scrollToTop() }} stillSrc={still.src} excitedSrc={excited.src} accessNumber={accessNumber} />}
        {step === 1 && (
          <ScreenConnect
            email={email}
            setEmail={setEmail}
            emailError={emailError}
            showOtp={showOtp}
            otp={otp}
            otpRefs={otpRefs}
            authLoading={authLoading}
            authError={authError}
            onGoogleLogin={handleGoogleLogin}
            onSendCode={handleSendCode}
            onVerifyCode={handleVerifyCode}
            onOtpChange={handleOtpChange}
            onOtpKeyDown={handleOtpKeyDown}
            onBackToEmail={() => { setShowOtp(false); setOtp(['','','','','','']); setAuthError('') }}
            alreadyConnected={!!loggedInUserId}
            loggedInEmail={loggedInEmail}
            onContinue={goNext}
            onUseAnotherAccount={handleUseAnotherAccount}
            stillSrc={still.src}
          />
        )}
        {step === 2 && (
          <ScreenAbout
            data={formData}
            errors={errors}
            onChange={v => {
              setFormData(prev => ({ ...prev, ...v }))
              setErrors(prev => {
                const next = { ...prev }
                for (const k of Object.keys(v)) delete next[k]
                return next
              })
            }}
            onPrev={goPrev}
            onNext={handleAboutNext}
            stillSrc={still.src}
          />
        )}
        {step === 3 && (
          <ScreenGoals
            data={formData}
            errors={errors}
            onToggleOccupation={v => { toggleOccupation(v); clearError('occupations') }}
            onToggleSite={toggleSite}
            onDetailChange={v => { setFormData(prev => ({ ...prev, detailField: v })); clearError('detailField') }}
            onSpiceChange={v => { setFormData(prev => ({ ...prev, spiceLevel: v })); clearError('spiceLevel') }}
            showDetailInput={showDetailInput}
            detailLabel={detailLabel()}
            detailPlaceholder={detailPlaceholder()}
            onPrev={goPrev}
            onNext={handleGoalsNext}
            proudSrc={proud.src}
          />
        )}
        {step === 4 && (
          <ScreenInstall
            onFinish={handleFinish}
            stillSrc={still.src}
            excitedSrc={excited.src}
          />
        )}
        {step === 5 && (
          <ScreenDone
            firstName={formData.firstName}
            proudSrc={proud.src}
          />
        )}
      </div>
    </>
  )
}

// ── Screen 0: WELCOME ─────────────────────────────────────────────────────────

function ScreenWelcome({
  onStart,
  stillSrc,
  excitedSrc,
  accessNumber,
}: {
  onStart: () => void
  stillSrc: string
  excitedSrc: string
  accessNumber: string | null
}) {
  // Only render the access ticket when the email link carried a real number
  // (/onboarding?access=427). No param → no invented number, no ticket.
  const accDigits = accessNumber?.replace(/\D/g, '') ?? ''
  return (
    <div className={`${s.screen} ${s.welcome}`}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
        <div className={s.wGlow} />
        <img
          src={excitedSrc}
          alt="Picantully festejando"
          className={`${s.wChili} floaty`}
        />
      </div>

      <div className={s.pill}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#51E98F" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3l7 3v5c0 4.6-3 8-7 10-4-2-7-5.4-7-10V6z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
        Tu lugar está confirmado
      </div>

      <h1 className={`disp ${s.wH}`}>
        Lo lograste.<br />
        <span className="grad-red">Estás adentro.</span>
      </h1>

      <p className={s.wSub}>
        De miles de personas en la lista,{' '}
        <b style={{ color: 'var(--pica-ink)' }}>vos sos de los primeros</b> en entrar
        a Picantully Focus. Bienvenido al club de los que decidieron que su atención
        no se regala más.
      </p>

      {accDigits && (
        <div className={s.ticket}>
          <img src={stillSrc} alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
          <div>
            <div className={`${s.ticketNum} grad-green`}>Acceso #{accDigits.padStart(4, '0')}</div>
            <div className={s.ticketLbl}>Founding member · early access</div>
          </div>
        </div>
      )}

      <div
        className={s.says}
        style={{ maxWidth: 430, margin: '0 auto 26px', textAlign: 'left' }}
      >
        <img src={stillSrc} alt="" />
        <div>
          <b style={{ color: 'var(--pica-green)' }}>Picantully:</b>{' '}
          «Así que vos sos el que me va a hacer laburar, ¿eh? Dale, conozcámonos un poco
          antes de empezar. Te toma dos minutos, lo prometo.»
        </div>
      </div>

      <Button kind="red" style={{ minWidth: 260 }} onClick={onStart}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 5 1c1 2 1 3 1 4a5 5 0 0 1-10 0c0-3 2-5 3-7 1 1 1 2 2 2 1-2 0-4 0-6Z" />
        </svg>
        Empecemos
      </Button>

      <div style={{ fontSize: 12.5, color: 'var(--pica-mut2)', marginTop: 14 }}>
        Tarda menos de 2 minutos · 4 pasos cortos
      </div>
    </div>
  )
}

// ── Screen 1: CONNECT ─────────────────────────────────────────────────────────

function ScreenConnect({
  email,
  setEmail,
  emailError,
  showOtp,
  otp,
  otpRefs,
  authLoading,
  authError,
  onGoogleLogin,
  onSendCode,
  onVerifyCode,
  onOtpChange,
  onOtpKeyDown,
  onBackToEmail,
  alreadyConnected,
  loggedInEmail,
  onContinue,
  onUseAnotherAccount,
  stillSrc,
}: {
  email: string
  setEmail: (v: string) => void
  emailError: string
  showOtp: boolean
  otp: string[]
  otpRefs: React.MutableRefObject<(HTMLInputElement | null)[]>
  authLoading: boolean
  authError: string
  onGoogleLogin: () => void
  onSendCode: () => void
  onVerifyCode: () => void
  onOtpChange: (i: number, v: string) => void
  onOtpKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void
  onBackToEmail: () => void
  alreadyConnected: boolean
  loggedInEmail: string | null
  onContinue: () => void
  onUseAnotherAccount: () => void
  stillSrc: string
}) {
  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.stepHead}>
          <img src={stillSrc} alt="" className={s.mascot} />
          {alreadyConnected ? (
            <>
              <h2>Ya estás dentro</h2>
              <p>Te reconocimos en este navegador. No hace falta que entres de nuevo.</p>
            </>
          ) : (
            <>
              <h2>Conectá tu cuenta</h2>
              <p>Con el mismo email con el que entraste a la lista. Sin contraseñas raras.</p>
            </>
          )}
        </div>

        {alreadyConnected ? (
          <>
            {loggedInEmail && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  borderRadius: 14,
                  background: 'rgba(81,233,143,0.10)',
                  border: '1px solid rgba(81,233,143,0.30)',
                  fontSize: 14,
                  color: 'var(--pica-mut)',
                  textAlign: 'center',
                  wordBreak: 'break-all',
                }}
              >
                Sesión activa como{' '}
                <b style={{ color: 'var(--pica-ink)' }}>{loggedInEmail}</b>
              </div>
            )}
            <Button kind="red" full onClick={onContinue}>Seguir</Button>
            <button
              className={s.backBtn}
              style={{ width: '100%', textAlign: 'center', marginTop: 10 }}
              onClick={onUseAnotherAccount}
            >
              Entrar con otra cuenta
            </button>
          </>
        ) : !showOtp ? (
          <>
            <Button
              kind="ghost"
              full
              style={{ height: 52 }}
              onClick={onGoogleLogin}
              disabled={authLoading}
            >
              <GoogleIcon />
              Continuar con Google
            </Button>

            <div className={s.divider}>
              <span />
              o con tu email
              <span />
            </div>

            <input
              className={`${s.inp} ${emailError ? s.inpError : ''}`}
              type="email"
              placeholder="vos@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') onSendCode() }}
              autoComplete="email"
            />
            {emailError && <span className={s.errorMsg}>{emailError}</span>}

            <Button
              kind="red"
              full
              style={{ marginTop: 12 }}
              onClick={onSendCode}
              disabled={authLoading}
            >
              {authLoading ? 'Enviando…' : 'Enviar código'}
            </Button>

            <div style={{ fontSize: 12, color: 'var(--pica-mut2)', marginTop: 14, textAlign: 'center', lineHeight: 1.4 }}>
              Te mandamos un código de un solo uso para confirmar que sos vos.
            </div>
          </>
        ) : (
          <>
            <p style={{ textAlign: 'center', color: 'var(--pica-mut)', fontSize: 14.5, marginBottom: 18 }}>
              Meté el código que mandamos a{' '}
              <b style={{ color: 'var(--pica-ink)' }}>{email}</b>
            </p>

            <div className={s.otpWrap}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => { otpRefs.current[i] = el }}
                  className={s.otpInput}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => onOtpChange(i, e.target.value)}
                  onKeyDown={e => onOtpKeyDown(i, e)}
                  autoComplete="one-time-code"
                />
              ))}
            </div>

            {authError && <span className={s.errorMsg} style={{ display: 'block', textAlign: 'center', marginTop: 10 }}>{authError}</span>}

            <Button
              kind="red"
              full
              style={{ marginTop: 18 }}
              onClick={onVerifyCode}
              disabled={authLoading || otp.join('').length < 6}
            >
              {authLoading ? 'Verificando…' : 'Confirmar y seguir'}
            </Button>

            <button className={s.backBtn} style={{ width: '100%', textAlign: 'center', marginTop: 8 }} onClick={onBackToEmail}>
              ← Cambiar email
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// ── Screen 2: ABOUT YOU ───────────────────────────────────────────────────────

function ScreenAbout({
  data,
  errors,
  onChange,
  onPrev,
  onNext,
  stillSrc,
}: {
  data: OnboardingState
  errors: Record<string, string>
  onChange: (v: Partial<OnboardingState>) => void
  onPrev: () => void
  onNext: () => void
  stillSrc: string
}) {
  const genderOptions: { v: Gender; label: string }[] = [
    { v: 'm', label: 'Masculino' },
    { v: 'f', label: 'Femenino' },
    { v: 'x', label: 'Prefiero no decirlo' },
  ]

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.stepHead}>
          <img src={stillSrc} alt="" className={s.mascot} />
          <h2>Contame quién sos</h2>
          <p>Para hablarte como se debe (y no como un robot).</p>
        </div>

        <label className={s.label}>Nombre y apellido</label>
        <div className={s.row2}>
          <input
            className={`${s.inp} ${errors.firstName ? s.inpError : ''}`}
            placeholder="Nombre"
            value={data.firstName}
            onChange={e => onChange({ firstName: e.target.value })}
            autoComplete="given-name"
          />
          <input
            className={`${s.inp} ${errors.lastName ? s.inpError : ''}`}
            placeholder="Apellido"
            value={data.lastName}
            onChange={e => onChange({ lastName: e.target.value })}
            autoComplete="family-name"
          />
        </div>
        {(errors.firstName || errors.lastName) && (
          <span className={s.errorMsg}>{errors.firstName || errors.lastName}</span>
        )}

        <label className={s.label}>Fecha de nacimiento</label>
        <div className={s.row3}>
          <input
            className={`${s.inp} ${errors.birthDay ? s.inpError : ''}`}
            inputMode="numeric"
            placeholder="Día"
            maxLength={2}
            value={data.birthDay}
            onChange={e => onChange({ birthDay: e.target.value.replace(/\D/g, '') })}
          />
          <select
            className={`${s.inp} ${errors.birthMonth ? s.inpError : ''}`}
            value={data.birthMonth}
            onChange={e => onChange({ birthMonth: e.target.value })}
          >
            <option value="">Mes</option>
            {MONTHS.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            className={`${s.inp} ${errors.birthYear ? s.inpError : ''}`}
            inputMode="numeric"
            placeholder="Año"
            maxLength={4}
            value={data.birthYear}
            onChange={e => onChange({ birthYear: e.target.value.replace(/\D/g, '') })}
          />
        </div>
        {(errors.birthDay || errors.birthMonth || errors.birthYear) && (
          <span className={s.errorMsg}>
            {errors.birthDay || errors.birthMonth || errors.birthYear}
          </span>
        )}

        <div className={s.birthHint}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--pica-gold)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3.5" y="8" width="17" height="5" rx="1" />
            <path d="M5 13v8h14v-8M12 8v13" />
            <path d="M12 8S10.3 3.5 8 4.8 9.2 8 12 8zM12 8s1.7-4.5 4-3.2S14.8 8 12 8z" />
          </svg>
          Te preparamos algo especial para tu cumple.
        </div>

        <label className={s.label}>Género</label>
        <div className={s.seg}>
          {genderOptions.map(({ v, label }) => (
            <div
              key={v}
              className={`${s.opt} ${data.gender === v ? s.optOn : ''}`}
              onClick={() => onChange({ gender: v })}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onChange({ gender: v }) }}
            >
              {label}
            </div>
          ))}
        </div>
        {errors.gender && <span className={s.errorMsg}>{errors.gender}</span>}

        <div className={s.actions}>
          <button className={s.backBtn} onClick={onPrev}>← Atrás</button>
          <Button kind="red" style={{ flex: 1 }} onClick={onNext}>Seguir</Button>
        </div>
      </div>
    </div>
  )
}

// ── Screen 3: GOALS ───────────────────────────────────────────────────────────

function ScreenGoals({
  data,
  errors,
  onToggleOccupation,
  onToggleSite,
  onDetailChange,
  onSpiceChange,
  showDetailInput,
  detailLabel,
  detailPlaceholder,
  onPrev,
  onNext,
  proudSrc,
}: {
  data: OnboardingState
  errors: Record<string, string>
  onToggleOccupation: (v: OccupationValue) => void
  onToggleSite: (v: string) => void
  onDetailChange: (v: string) => void
  onSpiceChange: (v: SpiceLevel) => void
  showDetailInput: boolean
  detailLabel: string
  detailPlaceholder: string
  onPrev: () => void
  onNext: () => void
  proudSrc: string
}) {
  const occupations: { v: OccupationValue; label: string; icon: React.ReactNode }[] = [
    {
      v: 'study',
      label: 'Estudio',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 8l10-4 10 4-10 4z" />
          <path d="M6 10.2V15c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.8" />
        </svg>
      ),
    },
    {
      v: 'work',
      label: 'Trabajo',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="7" width="18" height="13" rx="2" />
          <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12.5h18" />
        </svg>
      ),
    },
    {
      v: 'procrastinate',
      label: 'Procrastino',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 8h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8Z" />
          <path d="M17 9h2.2a2.3 2.3 0 0 1 0 4.6H17" />
          <path d="M8 2.5c-.6 1 .6 1.8 0 2.8M12 2.5c-.6 1 .6 1.8 0 2.8" />
        </svg>
      ),
    },
  ]

  const sites: { v: string; label: string; icon: React.ReactNode }[] = [
    {
      v: 'instagram',
      label: 'Instagram',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff8a5c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17" cy="7" r="1.1" fill="#ff8a5c" stroke="none" />
        </svg>
      ),
    },
    {
      v: 'tiktok',
      label: 'TikTok',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#51E98F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="6" cy="18" r="2.4" />
          <circle cx="17" cy="16" r="2.4" />
          <path d="M8.4 18V6.5l11-2v11" />
        </svg>
      ),
    },
    {
      v: 'x',
      label: 'X / Twitter',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pica-ink)" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l14 14M19 5L5 19" />
        </svg>
      ),
    },
    {
      v: 'youtube',
      label: 'YouTube',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4438" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path d="M11 9.5l4 2.5-4 2.5z" fill="#ef4438" stroke="none" />
        </svg>
      ),
    },
    {
      v: 'reddit',
      label: 'Reddit',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ff8a3c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12Z" />
        </svg>
      ),
    },
    {
      v: 'otros',
      label: 'Otros',
      icon: (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#5bb6ff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 2.5 15.4 0 18M12 3c-2.5 2.6-2.5 15.4 0 18" />
        </svg>
      ),
    },
  ]

  const spiceLevels: { v: SpiceLevel; label: string; icon: React.ReactNode }[] = [
    {
      v: 'mild',
      label: 'Suave',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3s6 6.6 6 10.6a6 6 0 0 1-12 0C6 9.6 12 3 12 3z" />
        </svg>
      ),
    },
    {
      v: 'medium',
      label: 'Picante',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 5 1c1 2 1 3 1 4a5 5 0 0 1-10 0c0-3 2-5 3-7 1 1 1 2 2 2 1-2 0-4 0-6Z" />
        </svg>
      ),
    },
    {
      v: 'extreme',
      label: 'Extra hot',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 2.5c.6 2.4-.7 3.2-.7 4.8a2.3 2.3 0 0 0 3.8.8c.8 1.5.8 2.3.8 3a3.8 3.8 0 0 1-7.6 0c0-2.3 1.5-3.8 2.3-5.3.7.8.7 1.5 1.4 1.5.8-1.5 0-3-.2-4.8Z" />
          <path d="M16 6c.5 1.8-.5 2.4-.5 3.6a1.7 1.7 0 0 0 2.8.6c.6 1.1.6 1.7.6 2.2a2.8 2.8 0 0 1-5.6 0" />
        </svg>
      ),
    },
  ]

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.stepHead}>
          <img src={proudSrc} alt="" className={s.mascot} />
          <h2>Calibremos a Picantully</h2>
          <p>Así Picantully sabe cuándo y cómo frenarte.</p>
        </div>

        <label className={s.label}>¿Qué hacés hoy?</label>
        <div className={s.seg}>
          {occupations.map(({ v, label, icon }) => (
            <div
              key={v}
              className={`${s.opt} ${data.occupations.includes(v) ? s.optOn : ''}`}
              onClick={() => onToggleOccupation(v)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggleOccupation(v) }}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
        {errors.occupations && <span className={s.errorMsg}>{errors.occupations}</span>}

        {showDetailInput && (
          <div className={s.detailBlock}>
            <label className={s.label}>{detailLabel}</label>
            <input
              className={`${s.inp} ${errors.detailField ? s.inpError : ''}`}
              placeholder={detailPlaceholder}
              value={data.detailField}
              onChange={e => onDetailChange(e.target.value)}
            />
            {errors.detailField && <span className={s.errorMsg}>{errors.detailField}</span>}
          </div>
        )}

        <label className={s.label}>¿Qué te roba más tiempo? (elegí los que quieras)</label>
        <div className={s.gridOpts}>
          {sites.map(({ v, label, icon }) => (
            <div
              key={v}
              className={`${s.optCard} ${data.distractingSites.includes(v) ? s.optCardOn : ''}`}
              onClick={() => onToggleSite(v)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggleSite(v) }}
            >
              <span className={s.optCardIcon}>{icon}</span>
              <b className={s.optCardLabel}>{label}</b>
            </div>
          ))}
        </div>

        <label className={s.label}>¿Cuán picante querés a Picantully?</label>
        <div className={s.seg}>
          {spiceLevels.map(({ v, label, icon }) => (
            <div
              key={v}
              className={`${s.opt} ${data.spiceLevel === v ? s.optOn : ''}`}
              onClick={() => onSpiceChange(v)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSpiceChange(v) }}
            >
              {icon}
              {label}
            </div>
          ))}
        </div>
        {errors.spiceLevel && <span className={s.errorMsg}>{errors.spiceLevel}</span>}

        <div className={s.actions}>
          <button className={s.backBtn} onClick={onPrev}>← Atrás</button>
          <Button kind="red" style={{ flex: 1 }} onClick={onNext}>Casi listo</Button>
        </div>
      </div>
    </div>
  )
}

// ── Screen 4: INSTALL ─────────────────────────────────────────────────────────

function ScreenInstall({
  onFinish,
  stillSrc,
  excitedSrc,
}: {
  onFinish: () => void
  stillSrc: string
  excitedSrc: string
}) {
  const [activePlatform, setActivePlatform] = useState<string | null>(null)

  return (
    <div className={s.screen}>
      <div className={s.card}>
        <div className={s.stepHead}>
          <img src={excitedSrc} alt="" className={s.mascot} />
          {/* "campeón" replaced by "crack" per brand inclusivity rule */}
          <h2>
            ¡Listo, <span className="grad-red">crack</span>!
          </h2>
          <p>
            Instalá Picantully donde más lo necesites. Tu cuenta ya queda
            sincronizada en todos lados.
          </p>
        </div>

        <div className={s.says}>
          <img src={stillSrc} alt="" />
          <div>
            <b style={{ color: 'var(--pica-green)' }}>Picantully:</b>{' '}
            «Bienvenido oficialmente. Elegí por dónde arrancamos — yo te espero del
            otro lado. Y no, no me voy a olvidar de vos.»
          </div>
        </div>

        <div className={s.dlGrid}>
          {/* macOS */}
          <DlCard
            platform="macOS"
            sub="App desktop"
            active={activePlatform === 'macOS'}
            onPick={() => setActivePlatform('macOS')}
            href="#"
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--pica-ink)" aria-hidden="true">
                <path d="M16 3c-1.2.1-2.5.9-3.2 1.9C12 6 11.4 7.3 11.6 8.6c1.3.1 2.6-.7 3.4-1.7.7-1 1.2-2.3 1-3.9Zm4 13.6c-.6 1.4-.9 2-1.7 3.2-1.1 1.7-2.6 3.8-4.5 3.8-1.7 0-2.1-1.1-4.4-1.1s-2.8 1.1-4.4 1.1c-1.9 0-3.3-1.9-4.4-3.6C-1 16.4-1.5 10.2 1.4 7c1.2-1.4 2.9-2.3 4.5-2.3 1.7 0 2.7 1.1 4.1 1.1 1.3 0 2.1-1.1 4.1-1.1 1.4 0 2.9.8 4 2.1-3.5 1.9-3 6.9.9 8.8Z" />
              </svg>
            }
          />

          {/* Windows */}
          <DlCard
            platform="Windows"
            sub="App desktop"
            active={activePlatform === 'Windows'}
            onPick={() => setActivePlatform('Windows')}
            href="#"
            icon={
              <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#5bb6ff" d="M3 5.5 10.5 4.4V11.5H3V5.5ZM11.5 4.2 21 3v8.5h-9.5V4.2ZM3 12.5h7.5v7L3 18.4v-5.9ZM11.5 12.5H21V21l-9.5-1.3v-7.2Z" />
              </svg>
            }
          />

          {/* iOS */}
          <DlCard
            platform="iOS"
            sub="iPhone & iPad"
            active={activePlatform === 'iOS'}
            onPick={() => setActivePlatform('iOS')}
            href="#"
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--pica-ink)" aria-hidden="true">
                <path d="M16 3c-1.2.1-2.5.9-3.2 1.9C12 6 11.4 7.3 11.6 8.6c1.3.1 2.6-.7 3.4-1.7.7-1 1.2-2.3 1-3.9Zm4 13.6c-.6 1.4-.9 2-1.7 3.2-1.1 1.7-2.6 3.8-4.5 3.8-1.7 0-2.1-1.1-4.4-1.1s-2.8 1.1-4.4 1.1c-1.9 0-3.3-1.9-4.4-3.6C-1 16.4-1.5 10.2 1.4 7c1.2-1.4 2.9-2.3 4.5-2.3 1.7 0 2.7 1.1 4.1 1.1 1.3 0 2.1-1.1 4.1-1.1 1.4 0 2.9.8 4 2.1-3.5 1.9-3 6.9.9 8.8Z" />
              </svg>
            }
          />

          {/* Android */}
          <DlCard
            platform="Android"
            sub="Celular & tablet"
            active={activePlatform === 'Android'}
            onPick={() => setActivePlatform('Android')}
            href="#"
            icon={
              <svg width="32" height="32" viewBox="0 0 24 24" fill="#51E98F" aria-hidden="true">
                <path d="M6 9h12v9a2 2 0 0 1-2 2h-1v3h-2v-3h-2v3H9v-3H8a2 2 0 0 1-2-2V9Zm-3 .5A1.5 1.5 0 0 1 4.5 11v5a1.5 1.5 0 0 1-3 0v-5A1.5 1.5 0 0 1 3 9.5Zm18 0A1.5 1.5 0 0 1 22.5 11v5a1.5 1.5 0 0 1-3 0v-5A1.5 1.5 0 0 1 21 9.5ZM7.5 8a4.5 4.5 0 0 1 9 0h-9Z" />
              </svg>
            }
          />

          {/* Chrome — recommended, full width */}
          <DlCard
            platform="Chrome"
            sub="Extensión para tu navegador"
            active={activePlatform === 'Chrome'}
            onPick={() => setActivePlatform('Chrome')}
            href="#"  // TODO: Chrome Web Store URL
            prime
            recommended
            icon={
              <svg width="36" height="36" viewBox="0 0 48 48" aria-hidden="true">
                <circle cx="24" cy="24" r="9" fill="#fff" />
                <path fill="#EA4335" d="M24 4a20 20 0 0 1 17.3 10H24a10 10 0 0 0-9.2 6.1L7.5 9.4A20 20 0 0 1 24 4Z" />
                <path fill="#34A853" d="M14.8 30.1A10 10 0 0 0 33 28h.1l-7.4 13A20 20 0 0 1 7.5 16.6Z" />
                <path fill="#FBBC05" d="M44 24a20 20 0 0 1-10.9 17.8L40.4 28A10 10 0 0 0 41.3 14H44a20 20 0 0 1 0 10Z" />
                <circle cx="24" cy="24" r="8" fill="#4285F4" />
              </svg>
            }
          />
        </div>

        <div style={{ fontSize: 12, color: 'var(--pica-mut2)', marginTop: 10, textAlign: 'center' }}>
          Podés instalarlo en varias plataformas — se sincronizan solas.
        </div>

        <Button kind="red" full style={{ marginTop: 22 }} onClick={onFinish}>
          Entrar a mi panel
        </Button>
      </div>
    </div>
  )
}

function DlCard({
  platform,
  sub,
  active,
  onPick,
  href,
  icon,
  prime = false,
  recommended = false,
}: {
  platform: string
  sub: string
  active: boolean
  onPick: () => void
  href: string
  icon: React.ReactNode
  prime?: boolean
  recommended?: boolean
}) {
  return (
    <a
      href={href}
      className={`${s.dl} ${prime ? s.dlPrime : ''} ${active ? s.dlActive : ''}`}
      onClick={e => { e.preventDefault(); onPick() }}
    >
      <div className={s.dlIcon}>{icon}</div>
      <div>
        <b className={s.dlTitle}>{platform}</b>
        <span className={s.dlSub}>{sub}</span>
      </div>
      {recommended && <span className={s.tagRec}>Recomendado</span>}
    </a>
  )
}

// ── Screen 5: DONE ────────────────────────────────────────────────────────────

function ScreenDone({
  firstName,
  proudSrc,
}: {
  firstName: string
  proudSrc: string
}) {
  // "campeón" replaced by "crack" per brand inclusivity rule
  const name = firstName.trim() || 'crack'

  return (
    <div className={`${s.screen} ${s.welcome}`}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div className={s.wGlow} />
        <img
          src={proudSrc}
          alt="Picantully orgulloso"
          className={`${s.wChili} floaty`}
        />
      </div>

      <h1 className={`disp ${s.wH}`} style={{ marginTop: 20 }}>
        A darle.{' '}
        <span className="grad-green">Tu foco te espera.</span>
      </h1>

      <p className={s.wSub}>
        Ya está todo listo,{' '}
        <b style={{ color: 'var(--pica-ink)' }}>{name}</b>. La próxima vez que te
        quieras escapar al scroll… ya sabés quién va a estar del otro lado.
      </p>

      {/* TODO: point to /app when the panel exists */}
      <Link
        href="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 52,
          padding: '0 30px',
          borderRadius: 15,
          fontWeight: 800,
          fontSize: 15.5,
          background: 'linear-gradient(150deg, var(--pica-red), var(--pica-red-dark))',
          color: '#fff',
          boxShadow: '0 12px 30px rgba(210,43,29,0.4)',
          textDecoration: 'none',
          minWidth: 240,
          marginTop: 14,
          fontFamily: 'var(--pica-font-body)',
        }}
      >
        Ir a mi panel
      </Link>

      <div style={{ marginTop: 16 }}>
        <Link href="/" style={{ fontSize: 14, fontWeight: 700, color: 'var(--pica-mut)', cursor: 'pointer' }}>
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}

// ── Google icon ───────────────────────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.6-11.3-8.4l-6.5 5C9.6 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.4 36.4 44 30.7 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  )
}
