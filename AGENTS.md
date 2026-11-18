# Minjok Herald

The independent public newspaper at `news.kmla.online`: a React Router 8 framework app with
server rendering, plus the Pages CMS content it publishes. The community site `kmla.online`
lives in `kmlaswtech/kmla-online` and shares no runtime, accounts or database with this app.
Product rules and technical design are in [docs/DESIGN.md](docs/DESIGN.md).

## Layout

- `app/routes.ts` owns every URL: `/`, `/articles/:slug`, `/editions`, `/editions/:issue`. Ask
  before adding a URL. `app/root.tsx` is the document.
- Dependencies flow `routes → features → shared` (ESLint enforces the outer boundaries). Routes
  stay thin; server I/O lives in feature `data/*.server.ts`. The front page composes the polls
  panel in the route; publication does not import polls.
- `content/` is the Pages CMS database: stories (`articles/*.md`), editions (`editions/*.yml`),
  polls (`polls/*.yml`) and uploads (`media/`). `.pages.yml` at the root defines the editor
  forms. Parsers in `app/features/*/model/` re-validate every file; invalid files are logged and
  skipped, never fatal. Drafts never render. Change `.pages.yml` and the parsers together.
- Editors' saves are commits to `content/`. Do not hand-edit published content in code changes;
  CI skips `content/`-only pushes.
- `public/herald/` is the permanent archive (24 edition PDFs, covers, artwork). A Pages CMS
  edition never replaces an archived issue. Never invent missing editions. Add archived issues
  as described in docs/DESIGN.md.

## Behavior to preserve

- Public reading and voting work without JavaScript or sign-in. Article and edition HTML has
  canonical/Open Graph metadata. No prototype badges or implementation notices in the reader UI.
- Seasons: Blossom (spring), Summer, Autumn, Winter own the palette and fonts. Auto follows
  Korea-time months; a manual choice is a host-only cookie, never an account setting. Season and
  Classic/Magazine controls live in the masthead Display disclosure; layout is a `?layout=` link
  shown only on the front page. SSR reads the preference cookie, so HTML stays private/no-store.
- The edition reader fills the viewport without the masthead and keeps native PDF open/download
  fallbacks, especially on mobile.
- Uploads are `/media/...` paths. `scripts/run.mjs` stages `content/media/` into ignored
  `public/media/`; `HERALD_MEDIA_BASE_URL` (the R2 public origin) replaces that origin once set.
  R2 credentials belong only to the sync workflow's secrets, never the server or `VITE_*`.
- Polls: anonymous, one vote per browser via the HttpOnly `herald-voter` cookie (`__Host-` over
  HTTPS); only the token's SHA-256 is stored. Votes may change until closing; `closes_at` is KST
  and checked by the vote handler; closed polls never reopen. Totals leave the server only after
  this browser voted or the poll closed. Every form goes through `requireSameSiteForm`.
- `polls/data/votes.server.ts` keeps votes in one JSON file (`HERALD_VOTES_FILE`, default ignored
  `.data/votes.json`). It suits a single server; hosting needs shared storage behind the same
  functions.

## Commands and checks

- `npm run dev` (port 5174), `npm run build`, `npm start` (built server, port 4174).
- Settings go in `.env.local` (template `.env.example`); all are optional locally.
- `npm run check`: typegen, TypeScript, ESLint, Prettier and Vitest. `npm run e2e`: builds and
  serves the real output against `test/fixtures/content/`.
- Bug fixes and new logic in `model/` or `data/` go test-first: watch the new Vitest test fail for
  the expected reason before the fix.
- Unit tests live in `test/`, mirroring `app/features/`; Playwright tests in `e2e/`.
- No deployment is configured. Never deploy production as an agent.
