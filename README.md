# Petbook

Write a small illustrated book about your pet and pin it on a world map.

## Status

Works: Next.js (App Router) + shadcn/ui, PostgreSQL schema (users, pets, books, pages, reviews) with Drizzle migrations, Better Auth sign-in, admin area guarded on the server (`pnpm admin:grant <email>` gives the role).

Not yet: book editor, map, moderation.

## Running locally

Requirements: Node 24+ and pnpm.

```bash
pnpm install
cp .env.example .env   # then set DATABASE_URL, BETTER_AUTH_SECRET and the Google OAuth client
pnpm db:migrate
pnpm dev               # http://localhost:3000
```

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:generate`, `pnpm db:migrate`.

## Next steps

- Book editor, map, moderation.
