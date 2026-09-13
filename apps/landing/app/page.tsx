'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Button, Chili } from '@picantully/design-system'
import { Icon } from '@picantully/design-system/icons'
import logo from '@picantully/design-system/assets/picantully-logo.png'
import still from '@picantully/design-system/assets/picantully.png'
import proud from '@picantully/design-system/assets/picantully-1.gif'
import excited from '@picantully/design-system/assets/picantully-2.gif'
import WaitlistForm from '@/components/WaitlistForm'
import ContactLink from '@/components/ContactLink'
import { PLATFORMS, type PlatformValue } from '@/lib/platforms'

const CHILI_SRC = {
  still: still.src,
  proud: proud.src,
  excited: excited.src,
} as const

export default function Home() {
  const [preselectedPlatform, setPreselectedPlatform] =
    useState<PlatformValue | null>(null)
  const [waitlistResolved, setWaitlistResolved] = useState(false)
  const preselectedPlatformRef = useRef<PlatformValue | null>(null)

  // Scroll-reveal + sticky-nav border, mirroring the mockup's vanilla JS.
  useEffect(() => {
    const nav = document.getElementById('nav')
    const onScroll = () => {
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 10)
    }
    window.addEventListener('scroll', onScroll)

    const io = new IntersectionObserver(
      entries =>
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('in')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.1, rootMargin: '0px 0px -8% 0px' },
    )
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))

    return () => {
      window.removeEventListener('scroll', onScroll)
      io.disconnect()
    }
  }, [])

  const scrollToWaitlist = useCallback((platform?: PlatformValue) => {
    if (platform) {
      setPreselectedPlatform(platform)
      preselectedPlatformRef.current = platform
    }
    document.getElementById('waitlist')?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <>
      {/* ── NAV ─────────────────────────────────────────────── */}
      <nav
        id="nav"
        className="sticky top-0 z-50 border-b border-transparent backdrop-blur-md transition-colors [&.scrolled]:border-border [&.scrolled]:bg-bg/85"
        style={{ background: 'rgba(11,8,7,0.6)' }}
      >
        <div className="mx-auto flex h-[72px] max-w-[1140px] items-center gap-3.5 px-6">
          <a href="#top" className="flex items-center gap-3">
            <img
              src={logo.src}
              alt=""
              className="h-[38px] w-[38px] rounded-[11px]"
              style={{ boxShadow: '0 6px 16px rgba(210,43,29,0.4)' }}
            />
            <span className="flex items-baseline gap-1.5 font-display text-[19px] font-bold leading-none">
              Picantully
              <small className="text-[11px] font-bold uppercase tracking-[0.12em] text-green">
                Focus
              </small>
            </span>
          </a>
          <div className="ml-auto hidden gap-[26px] text-[14.5px] font-semibold text-mut md:flex">
            <a href="#como" className="hover:text-ink">
              Cómo funciona
            </a>
            <a href="#porque" className="hover:text-ink">
              Por qué
            </a>
            <a href="#descargas" className="hover:text-ink">
              Descargas
            </a>
          </div>
          <a href="#waitlist" className="md:ml-0 ml-auto">
            <Button
              kind="red"
              style={{ height: 44, padding: '0 20px', fontSize: 14.5 }}
            >
              Unirme a la lista
            </Button>
          </a>
        </div>
      </nav>

      <span id="top" />

      <main>
        {/* ── HERO ──────────────────────────────────────────── */}
        <header className="pb-[26px] pt-[54px]">
          <div className="mx-auto grid max-w-[1140px] items-center gap-9 px-6 md:grid-cols-[1.08fr_0.92fr]">
            <div>
              <span className="reveal inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-[7px] text-[13px] font-bold">
                <Icon
                  name="flame"
                  size={14}
                  color="var(--pica-red)"
                  stroke={2}
                />
                Bienestar digital con personalidad
              </span>
              <h1 className="disp reveal my-[18px] text-[clamp(40px,6.2vw,74px)] font-bold">
                Recuperá tu foco. <span className="grad-red">Con onda.</span>
              </h1>
              <p className="hero-sub reveal max-w-[526px] text-[clamp(16px,2vw,20px)] leading-[1.5] text-mut">
                Cuando estás por caer en el scroll, aparece{' '}
                <b className="text-ink">Picantully</b>. En vez de un muro frío
                que te frustra, te encontrás con un personaje que te hace una
                pregunta, te saca una sonrisa y te devuelve las riendas. El
                bloqueador que{' '}
                <b className="text-ink">no vas a querer desinstalar.</b>
              </p>
              <div className="reveal mt-7 flex flex-wrap gap-3.5">
                <a href="#waitlist">
                  <Button kind="red">
                    <span className="flex items-center gap-2">
                      Unirme a la waitlist{' '}
                      <Icon name="flame" size={16} color="#fff" stroke={2} />
                    </span>
                  </Button>
                </a>
                <a href="#como">
                  <Button kind="ghost">Ver cómo funciona</Button>
                </a>
              </div>
              <div className="reveal mt-6 flex items-center gap-3 text-[14px] text-mut">
                <div className="flex">
                  {[0, 1, 2, 3].map(i => (
                    <span
                      key={i}
                      className="-ml-2 h-[30px] w-[30px] rounded-full border-2"
                      style={{
                        borderColor: 'var(--pica-bg)',
                        background:
                          'linear-gradient(135deg, var(--pica-red), var(--pica-orange))',
                      }}
                    />
                  ))}
                </div>
                <span>
                  <b className="text-ink">+2.847 personas</b> ya en la lista
                  para recuperar su tiempo
                </span>
              </div>
            </div>

            <div className="reveal relative flex min-h-[380px] items-center justify-center md:min-h-[520px]">
              <div
                className="absolute rounded-full"
                style={{
                  width: 'clamp(220px, 80vw, 420px)',
                  height: 'clamp(220px, 80vw, 420px)',
                  background:
                    'radial-gradient(circle, rgba(239,68,56,0.45), transparent 65%)',
                  filter: 'blur(24px)',
                }}
              />
              <div
                className="floaty absolute z-[3] top-[46px] left-1 max-w-[240px] rounded-[18px] rounded-br-[6px] border border-border2 bg-card-solid px-4 py-[13px] text-[14px] font-semibold leading-[1.4] md:left-auto md:right-0"
                style={{ boxShadow: '0 16px 40px rgba(0,0,0,0.5)' }}
              >
                &laquo;En serio no tenías algo mejor para hacer? 😏&raquo;
              </div>
              <div className="floaty relative z-[2] w-[min(360px,82%)]">
                <Chili
                  srcMap={CHILI_SRC}
                  mood="still"
                  size={360}
                  glow
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>

          {/* stats band */}
          <div className="mx-auto mt-6 max-w-[1140px] px-6">
            <div className="reveal grid grid-cols-2 gap-[18px] rounded-3xl border border-border bg-card p-[26px] md:grid-cols-4">
              <Stat value="2h 47m" label="recuperadas por semana" grad />
              <Stat value="8 de 10" label="veces cerrás la pestaña" />
              <Stat value="3 plataformas" label="navegador · compu · celu" />
              <Stat value="4.9 ★" label="«lo amo y lo odio»" />
            </div>
          </div>
        </header>

        {/* ── PROBLEM ───────────────────────────────────────── */}
        <section className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <SecHead
              eyebrow="El problema"
              title={
                <>
                  El scroll no avisa.
                  <br />
                  Te pide 5 minutos… y son 50.
                </>
              }
              sub="No es falta de voluntad. Las apps están diseñadas por equipos enteros para retenerte. Picantully empareja la cancha — y lo hace divertido."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <ProblemCard
                n="2h 14m"
                title="por día, promedio"
                body="Es lo que la persona promedio pasa en redes. Casi un día entero por semana."
              />
              <ProblemCard
                n="23 min"
                title="para recuperar el foco"
                body="Lo que tarda tu cabeza en volver a concentrarse después de cada distracción."
              />
              <ProblemCard
                n="~80"
                title="desbloqueos al día"
                body='Cada vez que agarrás el celu "un toque", el algoritmo gana y vos perdés.'
              />
            </div>
          </div>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────── */}
        <section id="como" className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <SecHead
              eyebrow="Cómo funciona"
              title="Mirá qué pasa cuando abrís Instagram."
              sub="Un ejemplo real en el celular. Lo mismo pasa en el navegador y en la compu."
            />
            <div className="grid grid-cols-1 items-start gap-x-3.5 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <StepCol
                n={1}
                title="Abrís la app"
                body="Tocás Instagram en el celu, como siempre. Empieza a cargar…"
              >
                <Phone>
                  <div className="absolute inset-0 bg-[#0d0d0d]">
                    <div className="flex h-10 items-center justify-between border-b border-[#222] px-3">
                      <span className="font-display text-[14px] font-bold text-white">
                        Instagram
                      </span>
                      <span className="text-[13px] text-white">♡ ✈</span>
                    </div>
                    <div className="flex gap-2 px-3 py-2.5">
                      {[0, 1, 2, 3].map(i => (
                        <span
                          key={i}
                          className="h-9 w-9 shrink-0 rounded-full"
                          style={{
                            background:
                              'linear-gradient(135deg,#f58529,#dd2a7b,#8134af)',
                          }}
                        />
                      ))}
                    </div>
                    <div className="my-1.5">
                      <div
                        className="h-[130px]"
                        style={{
                          background: 'linear-gradient(135deg,#3a3a3a,#1d1d1d)',
                        }}
                      />
                      <div className="mx-3 my-2 h-2 w-[60%] rounded bg-[#262626]" />
                      <div className="mx-3 my-2 h-2 w-[40%] rounded bg-[#262626]" />
                    </div>
                  </div>
                </Phone>
              </StepCol>

              <StepCol
                n={2}
                title="Aparece Picantully"
                body="Antes de que veas nada, te frena con cariño y una sonrisa."
              >
                <Phone>
                  <div
                    className="absolute inset-0 bg-[#0d0d0d]"
                    style={{ filter: 'blur(3px) brightness(.5)' }}
                  />
                  <Overlay>
                    <img src={CHILI_SRC.still} alt="" className="w-[74px]" />
                    <div className="mt-2 font-display text-[13px] font-bold leading-[1.15] text-white">
                      &laquo;A dónde vas, bichito de luz?&raquo;
                    </div>
                  </Overlay>
                </Phone>
              </StepCol>

              <StepCol
                n={3}
                title="Negociás"
                body="Le decís por qué entrás. Si te la compra, te da unos minutos contados."
              >
                <Phone>
                  <div
                    className="absolute inset-0 bg-[#0d0d0d]"
                    style={{ filter: 'blur(3px) brightness(.5)' }}
                  />
                  <Overlay>
                    <div className="mb-1.5 font-display text-[13px] font-bold text-white">
                      Por qué entrás?
                    </div>
                    <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
                      {[
                        'Es para el laburo',
                        'Ya terminé todo',
                        'Una cosita rápida',
                        'Necesito un respiro',
                      ].map(c => (
                        <span
                          key={c}
                          className="rounded-lg border px-2 py-[5px] text-[8.5px] font-bold"
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            borderColor: 'rgba(255,255,255,0.14)',
                            color: '#ffd9cf',
                          }}
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                    <div
                      className="mt-2.5 flex h-[30px] w-full items-center rounded-[9px] border px-2.5 text-[9px]"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        borderColor: 'rgba(255,255,255,0.14)',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      O escribí tu excusa…
                    </div>
                  </Overlay>
                </Phone>
              </StepCol>

              <StepCol
                n={4}
                title="Volvés a lo tuyo"
                body="La mayoría cierra y sigue. Picantully te muestra todo lo que le ganaste al scroll."
              >
                <Phone>
                  <div
                    className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center"
                    style={{
                      background: 'linear-gradient(160deg,#1a1411,#0b0807)',
                    }}
                  >
                    <img src={CHILI_SRC.excited} alt="" className="w-20" />
                    <div className="font-display text-[30px] font-bold text-white">
                      +18 min
                    </div>
                    <div className="text-[10px] text-mut">
                      de foco recuperados hoy
                    </div>
                    <div
                      className="mt-1.5 flex items-center gap-1 rounded-full px-2.5 py-[5px] text-[9px] font-bold text-green"
                      style={{ background: 'rgba(81,233,143,0.14)' }}
                    >
                      <Icon
                        name="flame"
                        size={10}
                        color="var(--pica-green)"
                        stroke={2}
                      />
                      Racha de 9 días
                    </div>
                  </div>
                </Phone>
              </StepCol>
            </div>
            <div className="reveal mt-9 text-center">
              <a href="#waitlist">
                <Button kind="red">
                  <span className="flex items-center gap-2">
                    Quiero probarlo{' '}
                    <Icon name="flame" size={16} color="#fff" stroke={2} />
                  </span>
                </Button>
              </a>
            </div>
          </div>
        </section>

        {/* ── SHOWCASE ──────────────────────────────────────── */}
        <section className="py-[70px]">
          <div className="mx-auto grid max-w-[1140px] items-center gap-12 px-6 md:grid-cols-2">
            <div className="reveal">
              <span className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-green">
                El momento clave
              </span>
              <h2 className="disp my-[14px] mb-1.5 text-[clamp(28px,3.8vw,42px)] font-bold">
                No te bloquea.
                <br />
                <span className="grad-red">Te entiende</span> (y te conoce).
              </h2>
              <p className="text-[16px] leading-[1.55] text-mut">
                Picantully tiene una personalidad real: canchero, con humor,
                bien argentino. Te tira un palito con cariño y te recuerda lo
                que de verdad querías hacer. Por eso funciona donde otros
                fallan: no lo querés apagar.
              </p>
              <ul className="mt-[18px] flex flex-col gap-3.5">
                <FeatLi
                  title="Conversaciones únicas, nunca un muro frío"
                  body="Cada vez que aparece, dice algo distinto. Da gusto encontrárselo."
                />
                <FeatLi
                  title="Vos tenés el control"
                  body="Negociás de verdad. Picantully no te encierra: te hace elegir."
                />
                <FeatLi
                  title="Datos que motivan, sin culpa"
                  body="Tiempo recuperado, rachas y niveles. Mejorar se siente bien."
                />
              </ul>
            </div>
            <div className="reveal flex justify-center">
              <div
                className="w-[min(300px,80%)] rounded-3xl border border-border p-2"
                style={{
                  background: 'var(--pica-card-solid)',
                  boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
                }}
              >
                <Chili
                  srcMap={CHILI_SRC}
                  mood="proud"
                  size={260}
                  glow
                  float
                  style={{ width: '100%', height: 'auto' }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── CONTRAST ──────────────────────────────────────── */}
        <section id="porque" className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <SecHead
              eyebrow="No es otro bloqueador"
              title="Por algo lo vas a recomendar."
              sub="Los bloqueadores de siempre te ponen un muro, te hacen sentir culpa y duran una semana en tu teléfono. Picantully juega otro partido."
            />
            <div className="mx-auto grid max-w-[920px] gap-[18px] md:grid-cols-2">
              <div className="reveal rounded-3xl border border-border bg-card px-7 py-[30px]">
                <h3 className="mb-[18px] flex items-center gap-2 font-display text-[19px] font-bold">
                  <Icon
                    name="lock"
                    size={20}
                    color="var(--pica-mut)"
                    stroke={1.9}
                  />
                  Un bloqueador cualquiera
                </h3>
                <ul className="flex flex-col gap-3.5">
                  {[
                    'Muro frío: "Sitio bloqueado". Fin.',
                    'Te hace sentir culpa, no ganas.',
                    'Lo desinstalás a la semana.',
                    'Aburrido. Nadie lo comparte.',
                    'Solo en una plataforma.',
                  ].map(t => (
                    <li
                      key={t}
                      className="flex gap-3 text-[14.5px] leading-[1.4] text-mut"
                    >
                      <span
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] text-[12px] font-extrabold text-mut2"
                        style={{ background: 'rgba(255,255,255,0.06)' }}
                      >
                        ✕
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <div
                className="reveal rounded-3xl px-7 py-[30px]"
                style={{
                  background:
                    'linear-gradient(160deg, rgba(239,68,56,0.12), var(--pica-card))',
                  border: '1px solid rgba(239,68,56,0.4)',
                }}
              >
                <h3 className="mb-[18px] flex items-center gap-2 font-display text-[19px] font-bold">
                  <Icon
                    name="flame"
                    size={20}
                    color="var(--pica-red)"
                    stroke={1.9}
                  />
                  Picantully Focus
                </h3>
                <ul className="flex flex-col gap-3.5">
                  {[
                    'Un personaje con alma que te habla.',
                    'Humor y control: vos decidís.',
                    'Te encariñás. Te quedás meses.',
                    'Tan gracioso que lo mandás al grupo.',
                    'Navegador, compu y celu.',
                  ].map(t => (
                    <li
                      key={t}
                      className="flex gap-3 text-[14.5px] font-medium leading-[1.4] text-ink"
                    >
                      <span
                        className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] text-[12px] font-extrabold text-green"
                        style={{ background: 'rgba(81,233,143,0.16)' }}
                      >
                        ✓
                      </span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ── FEATURES ──────────────────────────────────────── */}
        <section className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <SecHead
              eyebrow="Qué te llevás"
              title="Tu foco, cuidado en serio."
            />
            <div className="grid gap-[18px] md:grid-cols-3">
              <FeatureCard
                icon={
                  <Icon
                    name="clock"
                    size={24}
                    color="var(--pica-green)"
                    stroke={1.9}
                  />
                }
                iconBg="rgba(81,233,143,0.16)"
                title="Tiempo recuperado"
                body="Mirá cuántos minutos le ganaste al scroll, sin sermones ni culpa. Solo data que motiva."
              />
              <FeatureCard
                icon={
                  <Icon
                    name="flame"
                    size={24}
                    color="var(--pica-gold)"
                    stroke={1.9}
                  />
                }
                iconBg="rgba(255,176,46,0.16)"
                title="Rachas y niveles"
                body="Cada día que te bancás suma. Subís de nivel y Picantully lo celebra con vos."
              />
              <FeatureCard
                icon={
                  <Icon name="shield" size={24} color="#ff8a6e" stroke={1.9} />
                }
                iconBg="rgba(239,68,56,0.16)"
                title="Tus reglas"
                body="Elegís qué sitios y apps, cuántas negociaciones por día y cuánto te aprieta. Tu foco, tu cancha."
              />
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ──────────────────────────────────── */}
        <section className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <SecHead
              eyebrow="La gente habla"
              title="«No sabía que un chile me iba a cambiar el día.»"
            />
            <div className="grid gap-[18px] md:grid-cols-3">
              <Testimonial
                quote="«Probé todos los bloqueadores y los borraba a los 3 días. Con Picantully me río, negocio y termino cerrando la pestaña. Es el único que me duró.»"
                initial="M"
                name="Martina"
                role="Estudiante · UBA"
              />
              <Testimonial
                quote="«Le mandé un screen al grupo y se sumaron cuatro. Es gracioso de verdad y encima me hizo bajar 40 minutos de Insta por día.»"
                initial="F"
                name="Fede"
                role="Diseñador · freelance"
              />
              <Testimonial
                quote="«Lo mejor es que no te trata de vago. Te habla con onda y vos solo decidís mejor. Mi productividad voló.»"
                initial="V"
                name="Valen"
                role="Dev · startup"
              />
            </div>
          </div>
        </section>

        {/* ── DOWNLOADS ─────────────────────────────────────── */}
        <section id="descargas" className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <SecHead
              eyebrow="Descargas"
              title="En todas tus pantallas."
              sub="Picantully te cuida donde sea que te quieras escapar. Sumate a la lista y te avisamos apenas se libere tu lugar."
            />
            <div className="grid grid-cols-2 gap-3.5 md:grid-cols-5">
              {PLATFORMS.filter(p => p.value !== 'linux').map(p => (
                <DownloadCard
                  key={p.value}
                  icon={p.icon(32)}
                  title={p.title}
                  sub={p.sub}
                  onClick={() => scrollToWaitlist(p.value)}
                />
              ))}
            </div>
            <p className="mt-[18px] text-center text-[13px] text-mut2">
              Linux todavía no, pero ya casi. Arrancamos por estas plataformas.
            </p>
          </div>
        </section>

        {/* ── WAITLIST ──────────────────────────────────────── */}
        <section id="waitlist" className="py-[70px]">
          <div className="mx-auto max-w-[1140px] px-6">
            <div
              className="rounded-[34px] border border-border2 px-6 py-[58px] sm:px-10"
              style={{
                background:
                  'radial-gradient(60% 80% at 50% -10%, rgba(239,68,56,0.42), transparent 60%), linear-gradient(160deg, var(--pica-accent-deep), #160a07 75%)',
              }}
            >
              <div className="mx-auto max-w-[560px] text-center">
                {!waitlistResolved && (
                  <>
                    <img
                      src={CHILI_SRC.proud}
                      alt=""
                      className="mx-auto mb-2 w-[84px]"
                    />
                    <h2 className="disp text-[clamp(30px,4.6vw,48px)] font-bold leading-[1.05]">
                      Sumate a la <span className="grad-green">waitlist</span>
                    </h2>
                    <p className="my-3 mb-[26px] text-[16px] text-mut">
                      Cupos limitados. Contanos un poco de vos y te mandamos tu
                      invitación primero (y a tu medida).
                    </p>
                  </>
                )}
                <WaitlistForm
                  preselectedPlatform={preselectedPlatform}
                  onResolved={setWaitlistResolved}
                />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── FOOTER ──────────────────────────────────────────── */}
      <footer className="mt-[30px] border-t border-border pb-[60px] pt-11 text-mut">
        <div className="mx-auto flex max-w-[1140px] flex-wrap items-center justify-between gap-5 px-6">
          <a href="#top" className="flex items-center gap-3">
            <img
              src={logo.src}
              alt=""
              className="h-[38px] w-[38px] rounded-[11px]"
            />
            <span className="flex items-baseline gap-1.5 font-display text-[19px] font-bold leading-none">
              Picantully
              <small className="text-[11px] font-bold uppercase tracking-[0.12em] text-green">
                Focus
              </small>
            </span>
          </a>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-[14.5px] font-semibold text-mut">
            <a href="#como" className="hover:text-ink">
              Cómo funciona
            </a>
            <a href="#porque" className="hover:text-ink">
              Por qué
            </a>
            <a href="#descargas" className="hover:text-ink">
              Descargas
            </a>
            <a href="#waitlist" className="hover:text-ink">
              Waitlist
            </a>
          </div>
          <div className="flex items-center gap-1.5 text-[13.5px]">
            Nacido en una hackathon · Hecho con{' '}
            <Icon name="flame" size={14} color="var(--pica-red)" stroke={2} />
            en Argentina
          </div>
        </div>
        <div className="mx-auto mt-[18px] max-w-[720px] px-6 text-[12px] leading-[1.5] text-mut2">
          Picantully Focus es una herramienta de bienestar digital. El humor es
          parte del producto y siempre busca acompañarte, nunca dañar — solo
          ayudarte a recuperar tu atención.
        </div>
        <nav className="mx-auto mt-4 flex max-w-[1140px] flex-wrap justify-center gap-x-5 gap-y-2 px-6 text-[12px] text-mut2">
          <a href="/privacy" className="hover:text-ink">
            Privacidad
          </a>
          <a href="/terms" className="hover:text-ink">
            Términos
          </a>
          <ContactLink label="Contacto" className="hover:text-ink" />
          <span className="text-mut2/60">·</span>
          <ContactLink className="hover:text-ink" />
        </nav>
      </footer>
    </>
  )
}

/* ── Local presentational helpers ──────────────────────────── */

function Stat({
  value,
  label,
  grad,
}: {
  value: string
  label: string
  grad?: boolean
}) {
  return (
    <div>
      <b
        className={`disp block text-[clamp(22px,3vw,32px)] font-bold ${grad ? 'grad-green' : ''}`}
      >
        {value}
      </b>
      <span className="text-[13px] text-mut">{label}</span>
    </div>
  )
}

function SecHead({
  eyebrow,
  title,
  sub,
}: {
  eyebrow: string
  title: React.ReactNode
  sub?: string
}) {
  return (
    <div className="reveal mx-auto mb-[46px] max-w-[680px] text-center">
      <span className="text-[13px] font-extrabold uppercase tracking-[0.06em] text-green">
        {eyebrow}
      </span>
      <h2 className="disp my-3.5 text-[clamp(30px,4.4vw,50px)] font-bold">
        {title}
      </h2>
      {sub && <p className="text-[17px] leading-[1.5] text-mut">{sub}</p>}
    </div>
  )
}

function ProblemCard({
  n,
  title,
  body,
}: {
  n: string
  title: string
  body: string
}) {
  return (
    <div className="reveal rounded-[20px] border border-border bg-card p-[26px]">
      <div className="font-display text-[30px] font-bold text-red">{n}</div>
      <h4 className="mb-1.5 mt-2.5 font-display text-[18px] font-bold">
        {title}
      </h4>
      <p className="text-[14.5px] leading-[1.5] text-mut">{body}</p>
    </div>
  )
}

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative mx-auto aspect-[200/410] w-full max-w-[210px] overflow-hidden rounded-[30px] border-[7px] border-[#1a1411] bg-black"
      style={{ boxShadow: '0 24px 50px rgba(0,0,0,0.5)' }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-[23px]">
        {children}
      </div>
    </div>
  )
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center p-3.5 text-center"
      style={{
        background:
          'radial-gradient(80% 60% at 50% 38%, rgba(11,8,7,0.78), rgba(11,8,7,0.94))',
      }}
    >
      {children}
    </div>
  )
}

function StepCol({
  n,
  title,
  body,
  children,
}: {
  n: number
  title: string
  body: string
  children: React.ReactNode
}) {
  return (
    <div className="reveal text-center">
      {children}
      <h4 className="my-1.5 mt-[18px] flex items-center justify-center gap-2 font-display text-[17px] font-bold">
        <span
          className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-full font-display text-[13px] font-extrabold"
          style={{ background: 'rgba(239,68,56,0.16)', color: '#ff8a6e' }}
        >
          {n}
        </span>
        {title}
      </h4>
      <p className="px-1 text-[13.5px] leading-[1.45] text-mut">{body}</p>
    </div>
  )
}

function FeatLi({ title, body }: { title: string; body: string }) {
  return (
    <li className="flex items-start gap-3">
      <span
        className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[13px] font-extrabold text-green"
        style={{ background: 'rgba(81,233,143,0.16)' }}
      >
        ✓
      </span>
      <div>
        <b className="text-[15.5px]">{title}</b>
        <br />
        <span className="text-[14px] text-mut">{body}</span>
      </div>
    </li>
  )
}

function FeatureCard({
  icon,
  iconBg,
  title,
  body,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  body: string
}) {
  return (
    <div className="reveal rounded-[22px] border border-border bg-card px-6 py-7">
      <div
        className="mb-3.5 flex h-12 w-12 items-center justify-center rounded-[14px]"
        style={{ background: iconBg }}
      >
        {icon}
      </div>
      <h4 className="mb-2 font-display text-[20px] font-bold">{title}</h4>
      <p className="text-[14.5px] leading-[1.5] text-mut">{body}</p>
    </div>
  )
}

function Testimonial({
  quote,
  initial,
  name,
  role,
}: {
  quote: string
  initial: string
  name: string
  role: string
}) {
  return (
    <div className="reveal rounded-[22px] border border-border bg-card p-[26px]">
      <div className="tracking-[2px] text-[14px] text-gold">★★★★★</div>
      <p className="my-3 mb-[18px] text-[16px] font-medium leading-[1.5]">
        {quote}
      </p>
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full font-display font-extrabold text-white"
          style={{
            background:
              'linear-gradient(150deg,var(--pica-red),var(--pica-orange))',
          }}
        >
          {initial}
        </div>
        <div>
          <b className="text-[14.5px]">{name}</b>
          <span className="block text-[12.5px] text-mut2">{role}</span>
        </div>
      </div>
    </div>
  )
}

function DownloadCard({
  icon,
  title,
  sub,
  onClick,
}: {
  icon: React.ReactNode
  title: string
  sub: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="reveal w-full cursor-pointer rounded-[20px] border border-border bg-card px-4 py-6 text-center transition hover:-translate-y-1 hover:border-border2"
    >
      <div className="mx-auto mb-3 flex h-[46px] w-[46px] items-center justify-center">
        {icon}
      </div>
      <b className="block font-display text-[15px]">{title}</b>
      <span className="text-[12px] text-mut2">{sub}</span>
    </button>
  )
}
