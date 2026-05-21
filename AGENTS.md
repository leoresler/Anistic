## Stack / tooling
- Package manager is `pnpm` (`packageManager` pinned to `pnpm@10.33.4` in `package.json`). Do not assume npm/yarn.
- This is a single-package Vite 8 + React 19 + TypeScript 6 app. No monorepo/workspaces.
- Lockfile-resolved Vite 8 requires Node `^20.19.0 || >=22.12.0`.
- Tailwind CSS v4 is wired through `@tailwindcss/vite` in `vite.config.ts`; global theme tokens and shared utility/component classes live in `src/styles/globals.css`.

## Verified commands
- Install: `pnpm install`
- Dev server: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Production build is available through Vite even though no script is defined: `pnpm exec vite build`

## Verification expectations
- There are currently no repo-defined `test`, `lint`, or `format` scripts, and no CI/workflow files in the repo.
- For small changes, the only repo-native verification step you can rely on is `pnpm typecheck`.
- If you add tooling like tests or lint, update `package.json` scripts first so future agents have a canonical command.

## App structure
- Browser HTML entry: `index.html`.
- Real entrypoint: `src/app/main.tsx`.
- Routing is defined inline there with four pages: `/`, `/explore`, `/:id`, `/my-list`.
- Feature pages live under `src/features/<feature>/`; each feature keeps its own page component plus local `components/`.
- Shared UI lives in `src/shared/components/`.
- Current data is local mock data from `src/shared/mocks/animeData.ts`; there is no API layer, async data fetching, or external state store in the repo right now.

## Repo-specific gotchas
- There is no TS path alias config in `tsconfig.json`; use relative imports.
- `tsconfig.json` only includes `src`, so keep app source there unless you also update TS config.
- Styling conventions are centralized in `src/styles/globals.css` via Tailwind v4 theme variables and reusable classes like `.page-shell`, `.page-frame`, `.panel`, etc. Prefer reusing those before inventing new one-off patterns.
- Since the app is mock-data driven, UI changes that need new content usually require updating `src/shared/mocks/animeData.ts` alongside the component work.
