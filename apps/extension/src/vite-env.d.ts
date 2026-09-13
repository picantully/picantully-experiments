/// <reference types="vite/client" />

// Tipado de las variables de entorno públicas (VITE_*) que Vite expone en
// import.meta.env. Mantener sincronizado con .env.example.
interface ImportMetaEnv {
  readonly VITE_APPWRITE_ENDPOINT: string
  readonly VITE_APPWRITE_PROJECT_ID: string
  readonly VITE_APPWRITE_NEGOTIATE_FUNCTION_ID: string
  // IDs opcionales para registrar interés en premium (tabla feedback).
  // Si no están configurados, el botón "Hacete Premium" persiste sólo en
  // chrome.storage.local sin intentar escribir en Appwrite.
  readonly VITE_APPWRITE_FEEDBACK_DATABASE_ID?: string
  readonly VITE_APPWRITE_FEEDBACK_TABLE_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
