# Petbook

Write a small illustrated book about your pet and pin it on a world map.

## Status

Project skeleton only: Next.js (App Router) + Tailwind, Drizzle ORM wired to PostgreSQL, Vitest. No features yet.

## Running locally

Requirements: Node 24+ and pnpm.

```bash
pnpm install
cp .env.example .env   # then set DATABASE_URL
pnpm dev               # http://localhost:3000
```

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:generate`, `pnpm db:migrate`.

## Next steps

- Database schema, auth, book editor, map, moderation.
