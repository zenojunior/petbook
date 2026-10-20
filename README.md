# Petbook

Write a small illustrated book about your pet and pin it on a world map.

## Status

Works: Next.js (App Router) + shadcn/ui, PostgreSQL schema (users, pets, books, pages, reviews) with Drizzle migrations, Better Auth sign-in, admin area guarded on the server (`pnpm admin:grant <email>` gives the role).

Also: the landing page (the map preview on it is illustrative).

Book editor: the dashboard lists your books and, when you have none, starts the first one from the pet's name and species. The editor saves the title, the pet's details and ordered pages (text, photo, photo + text) as you type, next to a live preview of the book (`<BookView>`, reusable by the public reader). Only drafts can be edited.

Admin panel (read-only for now): overview with counts, users, books in any status, and the review queue with the reasons behind each decision.

Not yet: photo upload (photo pages show an empty frame), choosing the pet's city, submitting for review, real map, moderation, admin actions (approve/reject, ban).

## Running locally

Requirements: Node 24+ and pnpm.

```bash
pnpm install
cp .env.example .env   # then set DATABASE_URL, BETTER_AUTH_SECRET and the Google OAuth client
pnpm db:migrate
pnpm dev               # http://localhost:3000
```

Other scripts: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm db:generate`, `pnpm db:migrate`.

## Deploy (Docker / Dokploy)

The `Dockerfile` is a multi-stage build that ships only the Next.js standalone server. No secrets are needed to build; set these env vars on the container: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (the public URL), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.

```bash
docker build -t petbook .
docker run --rm -p 3000:3000 --env-file .env petbook
```

Migrations are not run by the container: apply them with `pnpm db:migrate` before deploying a schema change.

## Next steps

- Photo upload with EXIF stripping, then the cover photo.
- Pick the pet's city and store it through `fuzzLocation()`.
- Submit a draft for review, map, moderation.
