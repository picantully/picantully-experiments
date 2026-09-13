# Picantully Experiments

## What Picantully is

Picantully is an anti-distraction coach with attitude. Its Chrome extension, "El Picante,"
intercepts distracting sites and **negotiates** access with the user via an AI model — instead
of just blocking like a traditional site blocker. The product is a Turborepo/pnpm monorepo
(`picantully-focus`) with a Chrome MV3 extension, an Appwrite backend (auth, database,
functions, storage), and a Next.js web app that serves as the landing page, waitlist, and user
dashboard. Mobile (Expo) and desktop (Tauri) clients are planned.

## What this repo is for

`picantully-experiments` is a sibling sandbox repo to the main `picantully-focus` monorepo,
used for experimenting with landing-page variants and subpages without touching the production
app. It has its own independent git history — it is **not** a fork of production code and
changes here do not merge back automatically. Useful results (winning copy, layouts, or
components) are ported back into `picantully-focus`'s `apps/web` manually.

## Structure

```
picantully-experiments/
├── apps/
│   ├── landing/       Copy of the production landing page (Next.js) — the experiment target
│   └── extension/     Copy of the Chrome extension, kept for context / shared visual language
└── packages/
    └── design-system/ Shared UI components, icons, and design tokens (@picantully/design-system)
```

`apps/extension` is included purely as reference — it shares no code with the landing
experiments and is not itself a target for experimentation here.

## Getting started

```bash
pnpm install
pnpm --filter @picantully-experiments/landing dev
```

If `apps/landing/.env.example` exists, copy it to `.env.local` and fill in the values before
running the app.

## How to add a new experiment

1. Duplicate `apps/landing` (or scaffold a fresh minimal Next.js app) into a new folder under
   `apps/`, named descriptively for the experiment — e.g. `apps/landing-pricing-v2`,
   `apps/landing-dark-hero`. One experiment per app folder, not branches inside `apps/landing`.
2. Give it its own `package.json` name under the `@picantully-experiments/*` scope.
3. It can depend on `packages/design-system` via `workspace:*` to reuse shared UI and tokens.
4. Add a one-line entry to the "Current experiments" table below (name, folder, hypothesis/goal,
   status).
5. When an experiment wins, port the relevant components/copy back into `picantully-focus`'s
   `apps/web` manually — this repo is disposable and exploratory, production is not.
6. Keep experiments self-contained — don't add cross-experiment dependencies.

## Current experiments

| Name    | Folder         | Hypothesis / goal                                              | Status   |
| ------- | -------------- | ---------------------------------------------------------------- | -------- |
| Landing | `apps/landing` | Copy of the current production landing page — starting point for variants. | baseline |
| Demo    | `apps/demo`    | Interactive phone-mockup demo of the Picantully negotiation flow (Vite + React + Tailwind), for embedding on the landing page or sharing standalone. | active |
