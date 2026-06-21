# Multiprovider Auth Monorepo

Boilerplate profesional con pnpm workspaces, Fastify, React 19, Tailwind CSS v4, Drizzle ORM y autenticacion multiprovider.

## Apps y paquetes

- `apps/backend`: API Fastify con JWT y auth por email, telefono y Google.
- `apps/frontend`: React + Vite + Tailwind v4 con Zustand y dashboard protegido.
- `packages/database`: Drizzle ORM + PostgreSQL schema y migraciones.
- `packages/shared`: contratos Zod compartidos entre frontend y backend.

## Primer uso

1. Copiar `.env.example` a `.env` y completar valores reales.
2. Crear la base PostgreSQL indicada en `DATABASE_URL`.
3. Generar migraciones: `pnpm db:generate`.
4. Aplicar migraciones: `pnpm db:migrate`.
5. Levantar desarrollo: `pnpm dev`.

## Nota sobre Google Auth

El backend verifica el `idToken` contra Google usando `GOOGLE_CLIENT_ID`. No confies en datos de perfil enviados desde el frontend sin verificar el token en backend.
