import { Client, TablesDB, Functions, Account } from "appwrite";

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy apps/web/.env.example to .env.local and fill it in.`,
    );
  }
  return value;
}

// Appwrite connection — public, client-side config. No inline fallbacks: these
// are environment-specific (project/region can change for staging or prod), so
// they must come from the environment and never be hardcoded here.
const endpoint = requireEnv(
  "NEXT_PUBLIC_APPWRITE_ENDPOINT",
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT,
);
const projectId = requireEnv(
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID",
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
);

const client = new Client().setEndpoint(endpoint).setProject(projectId);

export const tablesDB = new TablesDB(client);
export const functions = new Functions(client);
export const account = new Account(client);

export const DB_ID = "picantully";
export const TABLE_WAITLIST = "waitlist";

// The `waitlist` table is locked (no client access). The landing MUST go through
// this server-side function, which writes with the dynamic API key, dedups by
// email and sends the branded email.
export const FUNCTION_WAITLIST_ID = "waitlist";
