# CLAUDE.md

Yarn 3 monorepo: `packages/shared` (game logic, builds first) → `packages/server` (Express + Socket.IO, port 3001) → `packages/vue-client` (Vue 3 + Vite, dev port 5173).

## Commands

See root `package.json` for all scripts. Key ones: `yarn start`, `yarn build`, `yarn test`, `yarn lint`.

## Migrations

Database migrations live in `packages/server/migrations/` and use `migrate-mongo`. They run **before deploy**, so new code can assume the migration has already been applied — no need for backwards-compat with old document shapes. Always write a best-effort `down`.
