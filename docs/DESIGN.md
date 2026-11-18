# Minjok Herald design

The independent newspaper at `news.kmla.online`. This repository holds both the server-rendered
site and its Pages CMS content. It moved here from `news/` in `kmlaswtech/kmla-online` on
2026-11-19 so editor saves and newspaper code stay out of the community site's history and CI.
Nothing is deployed yet.

## Product rules

Decided with the user on 2026-11-17: Pages CMS is the newspaper's database, Cloudflare R2 its file
storage, and the newspaper uses no Supabase. There is no login, account, editor unlock, editor
password or editor screen on the site.

### Editing and publishing

- Editors write, edit and delete stories, term editions and polls in Pages CMS
  (app.pagescms.org). An admin or editor-in-chief invites editors one by one by email.
- Every save is a commit; Git history is the activity log, and deleted content can be recovered
  from it.
- A story has a title, category (Feature/News/Editorial/misc), short deck, publication date,
  cover photo, optional credit and a plain-text body (blank lines separate paragraphs). Stories
  marked draft never appear.
- The 24 archived editions are permanent and are not edited in Pages CMS. A new term edition is
  registered with its number, title, season, PDF and cover and listed with the archive in issue
  order. An existing issue number is never overwritten.
- Content starts empty; with no published stories the front page shows an empty state.
- A malformed file never stops the site; only that item is hidden.

### Polls

- One vote per browser without sign-in. The first vote sets an anonymous cookie; clearing cookies
  allows another vote (accepted). No voter identity is stored.
- One choice per poll, changeable until closing. Totals are shown only after this browser voted
  or after the poll closed.
- Editors set the question, date, 2–6 choices and an optional closing time (Korea time, 24-hour).
  They can close a poll early; a closed poll never reopens. Rewording a choice after voting
  starts drops that choice's votes.
- The sidebar shows up to two open and four closed polls; **View all polls** lists every poll in a
  scrolling archive. Voting works without JavaScript.

## Appearance

The supplied `B · Blossom Press · After (hanji)-html.zip` is a visual reference, not executable
code. Its paper, lilac/coral watercolor and blossom images are in `public/herald/brand/`; its
export runtime, vendor React and simulated votes are not shipped. The supplied banner is kept.
Newsreader, Figtree and Caveat Brush are self-hosted through pinned font packages (no Google
Fonts request); their notices and OFL terms ship at `public/herald/brand/font-licenses.txt`.
Cream, rose and green torn-paper button textures are nine-slice border images that keep their
deckled edges at any width. Hover adds a subtle lift; reduced motion suppresses it and keyboard
focus stays visible.

Classic and Magazine layouts both use the seasonal palette. Section and layout are query-string
links that work without JavaScript. Story pages render readable text and canonical/Open Graph
metadata on the server. The sidebar features the latest edition and four compact past links;
`/editions` lists every issue; the PDF route drops the masthead, gives the viewer most of the
viewport and keeps new-tab/download fallbacks.

### Seasons

The Summer, Autumn and Winter HTML ZIPs contribute static artwork only, in
`public/herald/themes/{season}/`; the Blossom assets are spring. The native range control has
Auto plus four season stops, clickable labels and arrow/Home/End keys. Auto uses Asia/Seoul
meteorological months (March–May spring, June–August summer, September–November autumn,
December–February winter), re-checks at Korea midnight and on tab focus/visibility, and never
uses geolocation. A manual choice applies immediately and persists in the host-only
`herald-season-v1` cookie (400-day browser limit, renewed when used); Auto deletes it. Without
cookies the choice lasts for the visit. The cookie holds only a validated season. The root loader
renders the chosen season on the first response, so HTML and root loader data are private/no-store.
Without JavaScript the server-chosen theme still applies and the slider is hidden. PDFs keep
their original artwork.

The masthead's top-right **Display** button is a native `<details>` disclosure holding the season
slider and, on the front page only, the Classic/Magazine choice. Layout stays a `?layout=` link
that keeps the current section. Scripting adds closing on Escape (focus returns to the button),
outside click or navigation. Without JavaScript the disclosure appears only on the front page.

## Code layout and request flow

```text
app/root.tsx                      document, masthead, fonts and styles
app/routes.ts                     every URL
app/routes/                       thin loaders/actions, metadata and screen wiring
app/shared/content.server.ts      content folder reads; invalid files are logged and skipped
app/shared/fields.ts              YAML/frontmatter field checks shared by parsers
app/features/publication/
  components/                     front page, stories, editions, full-window reader
  content/editions.ts             permanent archive catalog
  data/queries.server.ts          stories + new editions from content, merged with the archive
  model/content.ts                story/edition parsing, ordering and media addresses
  model/front-page.ts             ?section= / ?layout= view
  model/metadata.ts               canonical and social card metadata
  model/season.ts                 Korea-time seasonal calendar
  model/types.ts                  story, edition and category types
  data/theme.server.ts            initial server theme and private response policy
  data/theme-preference.ts        host-only display preference
  components/season-*.tsx         theme state, rollover and accessible slider
  components/display-menu.tsx     Display disclosure
app/features/polls/
  model/poll.ts                   poll parsing, KST deadlines, visibility of totals, sidebar order
  data/votes.server.ts            local vote file with serialized writes
  data/voter.server.ts            anonymous per-browser voter cookie
  data/request.server.ts          same-site form check, form fields, voter tokens
  components/poll-panel.tsx       current/past polls, archive, vote and results
app/styles/                       palette, layouts and poll styles
content/                          Pages CMS content (see below)
public/herald/                    permanent archive and artwork
scripts/run.mjs                   dev/build/preview with .env.local and staged uploads
test/                             Vitest unit tests and content fixtures
e2e/newspaper.spec.ts             public HTML, PDF, mobile, layout, voting and 404 flows
```

Request → SSR route → content folder read (plus the vote file for polls) → HTML + metadata →
optional hydration. PDFs are static files (later R2), never streamed through server code.

## Content

| Collection        | File                             | Fields                                                                                |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| Stories           | `content/articles/<id>.md`       | title, category (Feature/News/Editorial/misc), deck, date, image, credit, draft, body |
| Semester editions | `content/editions/edition-N.yml` | number, title, season, cover, pdf, pages                                              |
| Polls             | `content/polls/<id>.yml`         | question, date, options (2–6), closes_at (KST `YYYY-MM-DD HH:mm`), closed, draft      |

The file name is the story or poll URL id; an edition's id is `edition-<number>`, matching the
archive, and an archived issue is never replaced. The server re-validates every file on read and
logs and skips an invalid one. Story bodies are plain text; no HTML is rendered from content.

Content is read from disk on each request. Pages CMS commits to this repository, so a deployment
rebuilds on each save (about two minutes) rather than reading GitHub live. CI ignores pushes that
change only `content/`.

## Media

Pages CMS uploads into `content/media/` and writes `/media/...` paths. Its documentation describes
no direct R2 upload, so `.github/workflows/sync-media-to-r2.yml` copies `content/media/` to the
bucket under `media/`. Until `HERALD_MEDIA_BASE_URL` is set the site serves uploads itself;
once set, `/media/...` paths point at R2. R2 credentials live only in that workflow's secrets
(not yet set), never in the server or `VITE_*`. Uploads also stay in Git history, so each 50 MB
edition grows this repository; whether Pages CMS accepts 50 MB uploads is unverified. If it does
not, PDFs need another upload path.

## Polls

The first vote sets an HttpOnly, SameSite=Lax `herald-voter` cookie (`__Host-` prefixed over HTTPS)
holding 256 random bits; only its SHA-256 is stored. Totals reach the browser only after that
browser voted or the poll closed. A poll closes at `closes_at` (stored as UTC) or when an editor
sets `closed`. The vote handler checks the deadline itself, so no timer or job is the boundary.
Choice text identifies stored votes, which `.pages.yml` warns editors about.

Votes post to the front page's own action, so voting works without JavaScript and adds no URL.
Every vote form passes the same-site check. Votes are kept in one JSON file (`HERALD_VOTES_FILE`,
default ignored `.data/votes.json`) with writes serialized in the server process. This only suits a
single server; hosting needs shared storage behind `votes.server.ts` (for example Cloudflare D1).

## Local commands

- `npm run dev`: development server on `http://127.0.0.1:5174`.
- `npm run build`: `build/client` and `build/server`. `npm start`: the React Router server on
  port 4174 (`HOST`/`PORT` override).
- `npm run check`: types, lint, formatting and unit tests. `npm run e2e`: builds and serves the
  real output against `test/fixtures/content/`; `E2E_BASE_URL` targets a running server instead.
- Settings go in `.env.local` (template `.env.example`): `HERALD_CONTENT_DIR`,
  `HERALD_MEDIA_BASE_URL`, `HERALD_VOTES_FILE`. None is required locally.
- `scripts/run.mjs` copies `content/media/` into ignored `public/media/` before dev/build; restart
  dev after pulling new uploads. The archive and staged uploads are excluded from Vite's watcher.
- `@react-router/serve` is pinned to the router version; upgrade them together.

## Remaining work before launch

- Connect this repository to Pages CMS (install its GitHub app on this repository only) and
  invite editors by email.
- Create the R2 bucket and its public custom domain (the Cloudflare account that owns
  `kmla.online` connects the domain), add the sync workflow's secrets and variables, and set
  `HERALD_MEDIA_BASE_URL`. Check whether Pages CMS accepts 50 MB PDFs.
- Choose hosting (Cloudflare Workers is the leading option: same account as R2, SSR support, D1
  for votes). Hosting decides how content is bundled at build time and where votes are stored.
- Replace the local vote file with shared storage before running more than one server process.
- Add the rebuild-on-save trigger and the domain. Exclude preview deployments from indexing.
  Agents do not deploy production.

## Permanent archive

`app/features/publication/content/editions.ts` is the archive catalog, newest issue first. Each
entry records the source filename in a comment plus the stable ID, issue, title, display date,
PDF URL, cover URL and page count. Missing issue numbers are gaps in the supplied collection; do
not add placeholders. It holds issues 72, 71, 70, 69, 68, 67, 65, 60, 59, 57, 56, 55, 54, 53, 52,
50, 49, 48, 47, 46, 44, 43, 2 and 1, about 365 MiB of PDFs; the largest is 48,718,029 bytes.
`70th-edition.pdf` is the supplied `Minjok Herald_70th Edition_PDF Version.pdf`; the other PDFs
are in `public/herald/editions/` and the covers in `public/herald/covers/` are first-page renders.
`banner.png` is the supplied cherry-blossom artwork, unmodified.

New term editions normally come through Pages CMS. To add an older issue to the archive:

1. Copy only the final PDF into `public/herald/editions/` with a stable issue filename. Do not
   overwrite an existing issue without checking it.
2. Render its first page to a small JPEG in `public/herald/covers/`, check the issue, title, date
   and page count against the cover, and add a catalog entry in newest-first order.
3. Check the archive, PDF open/download links, layout and the production build, then commit the
   files and catalog together.

GitHub warns above 50 MiB and blocks files above 100 MiB; every supplied PDF fits.

Source reconciliation: `MH Final Version for real.pdf` identifies itself on the cover as the 68th
edition, September 2023. The file labeled 56th has a cover printed "57th"; its supplied sequence is
kept as 56th. Some filename month codes differ from printed cover dates (46th, 59th, 60th, 67th);
display labels follow the printed cover. Issues with no verified cover date use a neutral label.
No print content was corrected or rewritten.
