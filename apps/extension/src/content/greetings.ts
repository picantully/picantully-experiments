// Saludos iniciales — se eligen al azar, SIN llamar a la API.
// Ahorran una request y dan contexto inmediato al usuario.
import type { IconType } from 'react-icons/lib'
import {
  LuBriefcase,
  LuSearch,
  LuSiren,
  LuCircleCheck,
  LuSend,
  LuTimer,
  LuAlarmClock,
  LuCoffee,
  LuBatteryLow,
  LuHeart,
  LuHand,
  LuLightbulb,
  LuMeh,
} from 'react-icons/lu'

export const INITIAL_GREETINGS: string[] = [
  // El primero siempre es el default (el más icónico)
  "El algoritmo te tiene domadito. Te tira un meme de un carpincho y ya te olvidaste de lo que tenías que hacer. Hagamos un pacto: cerrás esto ya o admitís que el carpincho ganó la pulseada.",
  "¿Otra vez buscando dopamina barata? El algoritmo de Meta factura, vos perdés tiempo. Salí de acá... o decime rápido cuántos minutos vas a regalarle a Zuckerberg hoy antes de volver al laburo.",
  "Ver la vida de los demás no paga el hosting de tus proyectos. Volvé a programar. A menos que me puedas justificar en diez palabras qué tiene de productiva esta pestaña... te escucho.",
  "Estás a un scroll de retrasar tu próximo lanzamiento otra semana más. Cerrá la pestaña. ¿O vas a negociar conmigo cinco minutos de gracia a cambio de meter un commit clave después?",
  "¿Otra vez acá? El perro de un streamer en Mónaco vive mejor que vos y encima le estás pagando el alimento balanceado con tu tiempo. ¿Mirás un video y cerrás?",
  "Pará, pará un minuto. ¿Me estás jodiendo? ¿Vinimos a fundar un imperio o a ver qué onda la vida de los demás? Decidite.",
  "Che, una pregunta rápida: ¿te acordás que tenías un proyecto que buildear? Sí, vos. El de las ideas millonarias. Dale, convenceme de que esta pestaña es clave.",
  "Error 404: Enfoque no encontrado. Estás a un click de que la procrastinación se convierta en tu principal habilidad en el CV. ¿Qué hacemos? ¿Cerramos con dignidad o reescribimos tu perfil de LinkedIn ahora mismo?",
  "Acá estamos de vuelta. Vos, yo, y tu fuerza de voluntad que hoy decidió tomarse el día. Contame, ¿qué estamos viendo?",
  "Justo cuando pensaba que hoy ibas a ser una persona de bien... ¿Qué querés?"
]

// Frases preconfiguradas para que el usuario elija rápido sin escribir.
// Están agrupadas por intención para que sea fácil encontrar la que aplica.
export const QUICK_REPLIES: Array<{ label: string; text: string; icon: IconType }> = [
  // Excusas "legítimas"
  { label: "Es para el laburo",      icon: LuBriefcase,   text: "Es para el trabajo, necesito buscar algo específico para una tarea." },
  { label: "Es investigación",       icon: LuSearch,      text: "Necesito investigar algo para un proyecto, es en serio." },
  { label: "Es una emergencia",      icon: LuSiren,       text: "Es una emergencia, alguien me mandó algo urgente que tengo que ver." },
  { label: "Ya terminé todo",        icon: LuCircleCheck, text: "Ya terminé todo lo que tenía pendiente, me lo gané." },
  { label: "Tengo que mandar algo",  icon: LuSend,        text: "Tengo que mandar un mensaje rápido a alguien, es importante." },

  // Negociaciones clásicas
  { label: "Solo 5 minutos",        icon: LuTimer,       text: "Dame solo 5 minutos, te prometo que después me pongo a laburar." },
  { label: "10 min y paro",         icon: LuAlarmClock,  text: "10 minutos y paro, trato. Poneme el timer vos si querés." },
  { label: "Estoy en un break",     icon: LuCoffee,      text: "Estoy en un descanso mental, necesito desconectarme un rato." },
  { label: "Laburé todo el día",    icon: LuBatteryLow,  text: "Laburé todo el día sin parar, me merezco un ratito de descanso." },

  // Desesperadas / graciosas
  { label: "Por favor",             icon: LuHeart,       text: "Por favor, por favor, por favor. Te lo pido de rodillas." },
  { label: "Es la última vez",      icon: LuHand,        text: "Te juro por lo más sagrado que es la última vez que te molesto hoy." },
  { label: "Necesito inspiración",  icon: LuLightbulb,   text: "Necesito ver contenido para inspirarme, es parte del proceso creativo." },
  { label: "No tengo excusa",       icon: LuMeh,         text: "No tengo excusa, quiero entrar y punto. ¿Hay algo de buena voluntad ahí?" },
]
