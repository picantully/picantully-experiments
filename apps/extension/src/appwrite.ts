// Cliente Appwrite compartido entre el popup y el documento offscreen.
// El popup hace login (el SDK persiste la sesión en localStorage del origen
// chrome-extension://) y el documento offscreen, al ser mismo origen,
// reutiliza esa sesión para ejecutar la función como el usuario logueado.
import { Client, Account, Functions, TablesDB } from 'appwrite'

// Config pública leída desde las env vars de Vite (ver .env / .env.example).
export const ENDPOINT = import.meta.env.VITE_APPWRITE_ENDPOINT
export const PROJECT_ID = import.meta.env.VITE_APPWRITE_PROJECT_ID
export const NEGOTIATE_FUNCTION_ID = import.meta.env.VITE_APPWRITE_NEGOTIATE_FUNCTION_ID

// IDs de la base y tabla de feedback (señal de demanda de premium).
// Opcionales: si no están configurados, el botón "Hacete Premium" igual
// muestra el mensaje y persiste el flag en chrome.storage.local.
export const FEEDBACK_DATABASE_ID = import.meta.env.VITE_APPWRITE_FEEDBACK_DATABASE_ID || 'picantully'
export const FEEDBACK_TABLE_ID = import.meta.env.VITE_APPWRITE_FEEDBACK_TABLE_ID || 'feedback'

// ── Flag temporal para pruebas sin login ────────────────────────────────────
// Cuando es false: la extensión omite el login y llama a la función Appwrite
// de forma anónima (requiere que la función tenga acceso de ejecución "Any"
// en la consola de Appwrite).
// Cuando es true: se activa el flujo completo de autenticación (Google +
// email/contraseña). Cambiar a true para restaurar el comportamiento normal.
export const REQUIRE_AUTH = true

export const client = new Client()
  .setEndpoint(ENDPOINT)
  .setProject(PROJECT_ID)

export const account = new Account(client)
export const functions = new Functions(client)
export const tablesDB = new TablesDB(client)
