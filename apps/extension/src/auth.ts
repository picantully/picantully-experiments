// Flujo de autenticación para la extensión Chrome MV3.
//
// - Google OAuth: el flujo entero corre en el SERVICE WORKER (background), no
//   en el popup. Motivo: cuando launchWebAuthFlow abre la ventana de Google, el
//   popup pierde el foco y se DESTRUYE; si el await viviera acá, moriría y la
//   sesión nunca se crearía. loginWithGoogle() ahora sólo le pide al background
//   que arranque el flujo (mensaje GOOGLE_LOGIN); el background lanza el OAuth y
//   delega la creación de la sesión al offscreen.
//
// - Email OTP: requestEmailOtp solicita un código de un solo uso por email.
//   verifyEmailOtp crea la sesión con ese código. No requiere contraseña ni
//   verificación de email adicional.
//
// La sesión queda persistida en el localStorage del origen chrome-extension://,
// así que el documento offscreen la reutiliza sin cambios.
import { ID } from 'appwrite'
import { account } from './appwrite'
import type { GoogleLoginResponse } from './types'

/**
 * Pide al service worker que inicie el login con Google.
 *
 * El popup probablemente se destruya cuando se abra la ventana de Google, así
 * que este await puede no resolverse acá — y está bien: el background completa
 * el flujo igual y emite AUTH_CHANGED. Si la promesa SÍ resuelve con un error,
 * lo lanzamos para que la UI muestre el mensaje en español.
 */
export async function loginWithGoogle(): Promise<void> {
  const res: GoogleLoginResponse | undefined = await chrome.runtime.sendMessage({
    type: 'GOOGLE_LOGIN',
  })

  if (!res?.ok) {
    if (res?.error === 'cancelled') {
      throw new Error('Cancelaste el inicio de sesión con Google.')
    }
    throw new Error('No se pudo iniciar sesión con Google. Probá de nuevo.')
  }
}

/**
 * Paso 1 del flujo OTP: solicita un código de un solo uso por email.
 *
 * Si el email no tiene cuenta, Appwrite la crea automáticamente.
 * Si ya existe, el userId proporcionado se ignora y se usa el del registro.
 * Devuelve el userId real (del token) que hay que pasar a verifyEmailOtp.
 */
export async function requestEmailOtp(email: string): Promise<string> {
  const token = await account.createEmailToken({ userId: ID.unique(), email })
  return token.userId
}

/**
 * Paso 2 del flujo OTP: verifica el código recibido por email y crea la sesión.
 *
 * @param userId - el userId devuelto por requestEmailOtp
 * @param code   - el OTP de 6 dígitos que recibió el usuario por email
 */
export async function verifyEmailOtp(userId: string, code: string): Promise<void> {
  await account.createSession({ userId, secret: code })
}
