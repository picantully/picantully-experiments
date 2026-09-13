/**
 * Negotiation copy — verbatim product content ported from the design canvas
 * spec's `voices` / `replies` / `chipText` tables. Do not translate or
 * rewrite: this is Picantully's actual personality writing, only the
 * surrounding engine was reimplemented.
 */

export type Tone = 'amable' | 'picante' | 'insoportable'

export interface Voice {
  /** Small mono label shown under the mascot bubble (Actitud tab). */
  label: string
  /** Human name of the tone, shown in the tone picker. */
  name: string
  /** One-line description shown in the tone picker. */
  desc: string
  /** Sample line shown at the top of the Actitud tab. */
  sample: string
  /** Opening line when a negotiation chat starts. `{app}` is replaced. */
  greet: string
  /** Pool of denial lines, cycled while resistance remains. `{app}` is replaced. */
  denials: readonly string[]
  /** Line said when granting time. `{app}` and `{min}` are replaced. */
  grant: string
  /** Home-screen / Casa-tab mascot line when not in a focus session. */
  home: string
}

export const VOICES: Record<Tone, Voice> = {
  amable: {
    label: 'BUENA ONDA',
    name: 'Buena onda',
    desc: 'Te frena, pero te trata bien.',
    sample: 'Che, yo sé que estás cansado. Igual dale quince minutos más y después charlamos, ¿sí?',
    greet: '¿{app}? Dale, contame qué buscás. Si es importante te dejo pasar.',
    denials: [
      'Te entiendo, en serio. Pero ahora no es el momento. Probá de nuevo si es urgente.',
      '{app} va a seguir estando más tarde. Esta tarde tuya no.',
      'Casi me convencés. Contame un poco mejor y lo pensamos juntos.'
    ],
    grant: 'Listo, te creo. {min} minutos de {app} y volvés. ¿Trato?',
    home: 'Vas bien hoy. Si querés te abro una sesión y te acompaño.'
  },
  picante: {
    label: 'PICANTE',
    name: 'Picante',
    desc: 'Ironía argentina, sin insultos.',
    sample: '¿Otra vez? Mirá que te conozco. Andá a laburar diez minutos y después vemos.',
    greet: '¿{app} ahora? Contame qué vas a buscar ahí que no esté en lo que tenías abierto.',
    denials: [
      'No. Es martes tres de la tarde y {app} no le paga las cuentas a nadie.',
      '{app} va a seguir estando a las siete. Tu tarde no.',
      'Esa excusa ya me la contaste el lunes. Y salió mal.',
      'Todavía no. Insistí si querés, yo tengo toda la tarde.'
    ],
    grant: 'Bueno. Me convenciste a medias, que es lo máximo que vas a lograr hoy. {min} minutos de {app} y te miro el reloj.',
    home: 'Hoy te frené dos veces y seguís entero. De nada.'
  },
  insoportable: {
    label: 'INSOPORTABLE',
    name: 'Insoportable',
    desc: 'No te la va a dejar pasar nunca.',
    sample: 'No. Ni me mires así. La respuesta va a seguir siendo no dentro de diez minutos.',
    greet: 'Ah, {app}. Qué original. Contame la excusa, así me río un rato.',
    denials: [
      'No, no y no. Y si preguntás otra vez, menos.',
      'Te lo digo con cariño: sos un desastre con {app}. Por eso estoy yo acá.',
      '¿De nuevo la misma? Me tenés cansado, y mirá que yo aguanto.',
      'Seguí insistiendo. Me divierte verte pedir permiso en vez de scrollear.'
    ],
    grant: 'Pará. Te doy {min} minutos de {app} solo para que dejes de escribirme. Te lo anoto en el prontuario.',
    home: 'No me mires con cara de víctima, el celular lo agarraste vos.'
  }
}

/** Canned first-reply keys, matched against the quick-excuse chips. */
export type ReplyKey = 'trabajo' | 'cinco' | 'mensaje' | 'aburro'

/** Canned bot reply used only on the *first* user turn, if it used a chip. `{app}` is replaced. */
export const REPLIES: Record<ReplyKey, string> = {
  trabajo: '¿Trabajo en {app}? Dale, decime el nombre del cliente. Te espero, no tengo apuro.',
  cinco: 'Cinco minutos tuyos duran cuarenta y ocho. Tengo el historial acá, ¿te lo leo?',
  mensaje: 'Respondelo por WhatsApp entonces. {app} no es mensajería, es un casino con fotos.',
  aburro: 'Aburrido está bien. Es el lugar donde aparecen las ideas. Bancátela dos minutos.'
}

/** Excuse-chip labels shown above the chat input. */
export const CHIP_TEXT: Record<ReplyKey, string> = {
  trabajo: 'Es por trabajo',
  cinco: 'Solo 5 minutos',
  mensaje: 'Tengo que responder algo',
  aburro: 'Me aburro'
}

export const CHIP_ORDER: readonly ReplyKey[] = ['trabajo', 'cinco', 'mensaje', 'aburro']
