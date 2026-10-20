# Petbook

Write a small illustrated book about your pet and pin it on a world map.

## Status

Works: Next.js (App Router) + shadcn/ui, PostgreSQL schema (users, pets, books, pages, reviews) with Drizzle migrations, Better Auth sign-in, admin area guarded on the server (`pnpm admin:grant <email>` gives the role).

Also: the landing page (the map preview on it is illustrative).

Book editor: the dashboard lists your books and, when you have none, starts the first one from the pet's name and species. The editor saves the title, the pet's details and ordered pages (text, photo, photo + text) as you type, next to a live preview of the book (`<BookView>`, reusable by the public reader). Only drafts can be edited.

Photos: a cover photo and one photo per page. The browser shrinks them before uploading, and the server re-encodes every photo with sharp (max 1600px, WebP, no EXIF or GPS) into `UPLOAD_DIR/books/<book id>/`. Photos of a book that is not published are served only to its owner and admins. The pet's city is picked from an OpenStreetMap (Nominatim) city search; only the city name is kept and the coordinates are rounded by `fuzzLocation()`.

Admin panel (read-only for now): overview with counts, users, books in any status, and the review queue with the reasons behind each decision. A Database page draws the schema (read from `src/db/schema.ts`) and shows the size of the database, of each table and of the uploaded images. User and book pages show how many images each book has and how much disk they use.

Not yet: submitting for review, real map, moderation, admin actions (approve/reject, ban).

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

Uploaded images are stored on disk, one folder per book: `<UPLOAD_DIR>/books/<book id>/`. The image sets `UPLOAD_DIR=/app/uploads`; mount a Dokploy volume there or the images are lost on every redeploy.

```bash
docker build -t petbook .
docker run --rm -p 3000:3000 --env-file .env petbook
```

Migrations are not run by the container: apply them with `pnpm db:migrate` before deploying a schema change.

## Next steps

- Submit a draft for review: `canPublish()`, `transition()`, rule checks, then the AI moderator.
- Public reader page and the real map (Leaflet) with the published books.
- In the editor on phones, a toggle between the form and the preview.
