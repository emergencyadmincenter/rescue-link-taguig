# Rescue Link Taguig

Monorepo for the Rescue Link Taguig web app, API, shared packages, and supporting docs.

## Workspace layout

- `apps/api` - NestJS backend API
- `apps/web` - Next.js frontend
- `packages/*` - shared constants, types, and utilities
- `docs/*` - architecture, onboarding, database, and decision notes
- `infra/*` - compose and Docker support files

## Common commands

From the repo root:

```bash
npm run dev:backend
npm run dev:frontend
npm run dev
```

`dev:backend` starts the API and database containers, `dev:frontend` starts the web app, and `dev` runs both.

## Notes

- Keep secrets in local `.env` files; do not commit them.
- Empty scaffold folders are preserved with `.gitkeep` files so the layout stays consistent across clones.
