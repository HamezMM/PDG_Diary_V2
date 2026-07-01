# PDG Project Diary (V1 POC)

A global daily project diary for Peake Design Group. Vanilla HTML/CSS/JS
frontend, Vercel serverless API routes, Airtable as the data store. No
build step, no real authentication (staff picker + cookie only).

See the full technical requirements for behavior and design details.

## Local development

1. `npm i -g vercel` (once)
2. Copy `.env.example` to `.env.local` and fill in `AIRTABLE_PAT` (a
   personal access token scoped to the base below) — `AIRTABLE_BASE_ID`
   is already set to `appScJ8zYRT96KVZ1`.
3. `vercel dev` — serves `index.html` and the `/api/*` functions together.

## Deploying

Connect this repo to a Vercel project and set `AIRTABLE_PAT` /
`AIRTABLE_BASE_ID` in the project's Environment Variables (never commit
them). Every push to `main` auto-deploys.

## Structure

```
index.html          App shell
css/style.css        All styles (design tokens at the top)
js/                   Frontend modules (app.js is the bootstrap/entry point)
api/                  Vercel serverless functions (Node) — hold the Airtable PAT
api/_lib/             Shared server-side helpers: schema (table/field IDs),
                      Airtable REST client, and record → JSON mappers
```

## Notes on the Airtable integration

- Server code addresses every Airtable field by **field ID**, not name —
  several live field names carry relational annotations (e.g. `Author [→
  T13_Staff]`) that don't match the plain names used in early planning
  docs, and names can be renamed in the base at any time without notice.
- `Author`/`Job`/`Assigned To` etc. are Airtable linked-record fields.
  Their values resolve to the *linked record's primary field text* (not
  its ID) inside `filterByFormula`, so `/api/entries` fetches the full
  Entries table and filters by job in code rather than relying on a
  formula.
