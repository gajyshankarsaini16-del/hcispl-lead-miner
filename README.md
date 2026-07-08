# Lead Miner — HCISPL AI Lead Mining Platform

Phase 1 build: project setup, authentication, dashboard shell, database, and a working
end-to-end flow (search → enrich → store → view → export), built off the SRS you provided.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4) — one project, frontend + backend together
- **SQLite** via `better-sqlite3` — zero-config local database, file lives at `data/leadminer.db`
- **JWT sessions** via `jose` + `bcryptjs` — cookie-based auth, no third-party auth service
- **Placeholder enrichment engine** (`src/lib/mockEngine.ts`) — stands in for Phases 2–8
  (Search Engine, Website Intelligence, Decision Maker Intelligence, Social Intelligence,
  Technology Detection, Company Intelligence, AI Analysis) so the rest of the product works
  end to end. Swap it for a real scraper/AI pipeline when you build those phases — same
  return shape, nothing upstream has to change.

I picked SQLite over the SRS's suggested Postgres/Docker setup so you can run this
immediately with no extra services. The schema (`src/lib/db/schema.sql`) maps directly to
the Companies/Contacts/Social/Technologies tables from the spec, so moving to Postgres
later is a driver swap, not a redesign.

## Getting started

```bash
npm install
npm run seed   # creates admin@hcispl.local / admin123 + 3 demo companies
npm run dev
```

Open http://localhost:3000, sign in with `admin@hcispl.local` / `admin123`.

For production: set a real `AUTH_SECRET` in `.env` (see `.env.example`), then
`npm run build && npm run start`.

## What's built

- **Auth** — login/logout, JWT session cookie, admin-only pages guarded server-side
- **Dashboard** — stats (companies mined, avg. lead score, high priority count), recent activity
- **Company search** — search by name/website/GST/CIN/LinkedIn, runs the enrichment engine, saves to DB
- **Bulk upload** — CSV of company names → same enrichment pipeline, capped at 200 rows/run for this demo
- **Company profile** — decision makers, tech stack, social presence, and the lead/priority/confidence
  "core sample" score visual
- **Search history** — every search, most recent first
- **Analytics** — industry mix and lead score distribution from real data
- **Exports** — CSV export matching the SRS's Excel Output column spec
- **Users / Settings / API keys** — schema and basic UI in place; each page notes what's
  intentionally left for a later phase

## Project structure

```
src/
  app/
    login/                 public login page
    (dashboard)/            everything behind auth, shares the sidebar layout
      dashboard/  search/  bulk-upload/  companies/[id]/
      history/  analytics/  exports/  settings/  users/  api-keys/
    api/                    route handlers (auth, companies, search, bulk-upload, exports, dashboard stats, api-keys)
  components/               Sidebar, ScoreBar/CoreSample (the score visual)
  lib/
    db/                     sqlite connection + schema.sql
    repo.ts                 all data-access queries
    auth.ts / session.ts    password hashing, JWT, cookie helpers
    mockEngine.ts           placeholder Phase 2–8 enrichment — replace this first
scripts/seed.ts             creates the admin user + demo data
```

## Suggested next steps (following the SRS's phased approach)

1. **Phase 2–3**: Replace `mockEngine.ts` with a real search + scraping engine (respect
   robots.txt and each site's terms of service; only collect data that's genuinely public).
2. **Phase 9**: Turn bulk upload into a real background queue (BullMQ + Redis, or similar)
   instead of processing synchronously in the request — needed once you're past ~200 rows.
3. **Users**: Add invites and role-based permissions (schema's already there).
4. **Postgres**: Swap `better-sqlite3` for `pg` / Postgres when you're ready to deploy —
   the SQL in `schema.sql` and `repo.ts` translates almost directly.

Give this repo to your coding AI **one phase at a time**, same as the doc recommends —
that'll keep code quality high as the scraper and AI engine get built out.
