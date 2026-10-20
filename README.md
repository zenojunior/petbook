# Petbook

Write a small illustrated book about your pet and pin it on a world map.

## Status

Works: Next.js (App Router) + shadcn/ui, PostgreSQL schema (users, pets, books, pages, reviews) with Drizzle migrations, Better Auth sign-in, admin area guarded on the server (`pnpm admin:grant <email>` gives the role).

The public `/explore` map and the landing page use Leaflet + OpenStreetMap. Only published books appear, at rounded coordinates, with clustered pins, a species filter, cover previews and links to `/b/<slug>`. The explore page also offers a text list of the filtered books.

Book editor: the dashboard lists your books and, when you have none, starts the first one from the pet's name and species. The editor saves the title, the pet's details and ordered pages (text, photo, photo + text) as you type, next to a live preview of the book (`<BookView>`, reusable by the public reader). Only drafts can be edited.

Photos: a cover photo and one photo per page. The browser shrinks them before uploading, and the server re-encodes every photo with sharp (max 1600px, WebP, no EXIF or GPS) into `UPLOAD_DIR/books/<book id>/`. Photos of a book that is not published are served only to its owner and admins. The pet's city is picked from an OpenStreetMap (Nominatim) city search; only the city name is kept and the coordinates are rounded by `fuzzLocation()`.

Covers: each book has a color from a closed palette and a pattern (plain, stripes, dots, paws, check), picked in the editor and shown on the dashboard.

Reader: a book opens closed and centered; tapping it opens the cover and turns the pages with a 3D page flip (keyboard arrows and swipe work, and `prefers-reduced-motion` turns the animation off). Published books are read at `/b/<slug>`. The **Share** button in the editor sets who can read a book: private, or anyone with a secret link (`/s/<token>`, works for drafts, not listed and not indexed; resetting the link breaks old ones). The editor also submits saved drafts for review and shows the latest decision and reasons. Rejected books can return to drafts; published books can be unpublished for editing (which also disables the secret share link).

Admin panel: overview with counts, users, books in any status, and the review queue with the reasons behind each decision. Admins can read submitted books and approve or reject them with a reason. Both `in_review` and `needs_human` books appear in the queue, so an interrupted automatic review can be resolved manually. A Database page draws the schema (read from `src/db/schema.ts`) and shows the size of the database, of each table and of the uploaded images. User and book pages show how many images each book has and how much disk they use.

Publication: `canPublish()` checks title, cover, pet, species, city and the content required by each page layout. `ruleCheck()` also checks photo ownership and page limits. Every state change goes through `transition()`. Submission and saves lock the same book row so reviewed content cannot be changed by a late autosave.

Content review uses the **OpenAI Decisions API** (`POST /v1/decisions`, `gpt-6-luna`) directly, replacing the planned 9router integration. Set `OPENAI_API_KEY` on the server. Only submitted books are sent: text, pet details and all referenced photos as inline WebP data, without making draft images public. Four independent predicates check pet-story relevance, test/spam content, unsafe content and sensitive personal information. Decisions and reasons are recorded in review history.

Automatic approval currently requires pet-story probability ≥ 0.98, test/spam ≤ 0.02, unsafe content ≤ 0.01 and private information ≤ 0.01. A clear negative (≥ 0.98, or relevance ≤ 0.02) rejects; ambiguous results go to `needs_human`. These are initial conservative thresholds, **not calibrated accuracy guarantees**: validate them against labeled real examples before relying on automatic decisions at scale. Missing credentials, unreadable photos, refusals, malformed/incomplete answers, API errors and a 30-second request timeout all go to human review. Books with more than 15 MiB of referenced photos are reviewed by a human rather than partially inspected.

Not yet: banning users and calibration of automatic review against a labeled dataset.

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

- Calibrate Decisions API thresholds with real pet stories, test books and moderation edge cases.
- Animate the flight from a map pin or shelf into the reader.
- A richer, Notion-like editor (Tiptap) and writing directly on the page.
- In the editor on phones, a toggle between the form and the preview.

## Review audit and deletion

The admin overview, user pages and book pages show recorded review usage and estimated USD costs, including deleted books. Each new Decisions API attempt creates an immutable `moderation_runs` record with the prompt version, exact questions/instructions, submitted text, referenced images and their SHA-256 digests, provider response, request id, timings and token usage. Images used in historical reviews are retained when the author later edits a draft. A book's admin page lists every run, with pagination, so resubmissions remain separate.

Cost estimates use reported input tokens and the per-million price stored on that run. `OPENAI_DECISIONS_INPUT_USD_PER_MILLION` defaults to `0.10`; override it for the applicable pricing. This is an estimate, not the provider invoice. Missing usage, interrupted calls and older AI reviews are explicitly shown as unpriced; they are never counted as free or retroactively reconstructed from the current prompt.

Deleting a book sets `books.deleted_at` and revokes its share token. The author loses editor access and the book disappears from their dashboard, the map and both public/shared readers. All owner mutations reject deleted books. Images are served with `private, no-store`, and a deleted book's images are admin-only. Admins retain the book, pages, images, reviews and costs, with a Deleted badge and a filter in the books list. A moderation result that arrives after deletion is retained in the audit but cannot publish the book.

Apply migration `0004_polite_silver_sable` before running the updated app. Existing books start active and existing reviews keep their previous decisions; detailed request data is recorded only for subsequent attempts.
