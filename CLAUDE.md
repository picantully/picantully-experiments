# Picantully Experiments — Agent context

## Purpose

Sibling sandbox repo to the main `picantully-focus` monorepo, used for experimenting with
landing-page variants and subpages without touching the production app.

## Product context

Picantully is an anti-distraction coach with attitude. Its Chrome extension intercepts
distracting sites and **negotiates** access with the user via an AI model, instead of just
blocking. The stack is a pnpm/Turborepo monorepo: a Chrome MV3 extension, an Appwrite backend
(auth, database, functions, storage), and a Next.js web app (landing + waitlist + dashboard).
Mobile (Expo) and desktop (Tauri) clients are planned.

## Adding a new experiment

- Duplicate `apps/landing` (or scaffold a fresh minimal Next.js app) into a new folder under
  `apps/`, named descriptively — e.g. `apps/landing-pricing-v2`. One experiment per app folder.
- Name its `package.json` under the `@picantully-experiments/*` scope.
- It may depend on `packages/design-system` via `workspace:*` for shared UI/tokens.
- Add a row to the "Current experiments" table in `README.md`.
- Port winning experiments back into `picantully-focus`'s `apps/web` manually — nothing here
  merges back automatically.
- Keep experiments self-contained; no cross-experiment dependencies.

## Independent history

This repo has independent git history from `picantully-focus`. Do not assume shared CI/CD,
secrets, or deploy targets — set those up per-app as needed.

## Conventions carried over from the source repo

- `apps/landing` is Next.js — read `node_modules/next/dist/docs/` before writing code, this
  version may differ from training-data assumptions (see `apps/landing/AGENTS.md`).
- Scripts per app: `dev`, `build`, `lint`, `typecheck` (see each `package.json`).
- TypeScript everywhere, camelCase (Appwrite is document-oriented, not SQL).
