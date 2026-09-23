# Exploration: astro-starlight-website

## Topic

Standalone Astro + Starlight study web app in this repo that compiles Markdown
from the source repo (`ChathurangaVKD/AWS-Certified-Solutions-Architect-Associate-SAA-C03`)
at build time. Requirements: 100% SSG, Lighthouse >95 mobile, offline PWA
(`@vite-pwa/astro` + Workbox), local progress (Nano Stores + localStorage),
touch-friendly fullscreen Mermaid viewer, interactive quizzes parsed from
practice questions, Pagefind search, Tailwind/Starlight styling, deploy to
GitHub Pages / Vercel.

## Current State

### This repo (app repo — empty)

- Only `LICENSE`, `README.md`, `SESSION-CONTEXT.md`, `openspec/config.yaml`
  (`strict_tdd: false`, no-runner fallback, zero discovered projects).
- No `package.json`, no stack, no tests, no CI. Node v24.16.0 / npm 11.13.0
  available in the environment.
- `openspec/changes/` contains only `archive/` — this is the first change.
- Content constraints inherited from source: original content only, placeholder
  credentials only, paraphrase AWS docs + link (`docs.aws.amazon.com`).

### Content source repo (read-only reference, verified on disk)

- 14 modules `01-*`..`14-*`. Modules 01–13 each have exactly 5 files:
  `README.md` (full), `ULTRA-FAST-LEARN.md` (~15-min bullets),
  `FAST-LEARN.md` (~60-min, ends with a `- Move to: [Module N+1](...)`
  relative chain link), `PRACTICE-QUESTIONS.md`, `DIAGRAMS.md`.
- `14-Practice` breaks the convention (verified): empty `README.md` (0 bytes),
  NO `DIAGRAMS.md`, plus extras — `FLASHCARDS.md` (`**Q:**`/`A:` pairs grouped
  by `##` headings), `STUDY-NOTES.md`, `SERVICE-QUESTION-MAPPING.md`,
  `TEST-RESULTS-TRACKER.md` (fill-in template, NOT quiz source),
  plus its own `FAST-LEARN.md` / `ULTRA-FAST-LEARN.md` / `PRACTICE-QUESTIONS.md`.
- `11-Analytics` has one extra file: `AWS-ML-SERVICES-NOTES.md` — the sync
  script MUST allowlist, not assume exactly 5 files per module.
- Scale (via `scripts/count_stats.py`): 283 practice questions, 217 diagrams.
- Practice-question markup has TWO variants (both verified):
  - Modules 01–13: `### Question N` + stem + `A./B./C./D.` lines + `<details>`
    block containing `**Answer: X**`, `**Explanation:**` bullets,
    `**References:**`. Regex-parseable: split on `### Question N`, options from
    `^[A-D]\.` lines, answer letter + explanation from the `<details>` body.
  - `14-Practice/PRACTICE-QUESTIONS.md`: `### Question N` + `**Options:**`
    `A. ... ✓` (correct option marked with a `✓` suffix, no `<details>`),
    `**Explanation:**` single line. Needs a second parser branch.
- `DIAGRAMS.md` files: `##`/`###` section headings + ` ```mermaid ` fenced
  blocks (14–23 diagrams per module). Node labels already use ID-based
  subgraphs and `classDef` (post-autofix style). The Mermaid validator is RED
  repo-wide on floating-node warnings (exit 1, warnings only) — the site
  build MUST be warn-only for diagrams and never fail on them.
- Cross-module indexes in `docs/`: `study-guides/ULTRA-FAST-LEARN-GUIDE`,
  `FAST-LEARN-GUIDE.md`, `reference/DIAGRAMS-INDEX.md`, `QUICK-START.md`.
  These give the ULTRA-FAST (3–4h) / FAST (11–14h) reading-mode order for free;
  the sync script can rewrite their relative links to site routes.
- `index.html` (1317 lines): standalone dark-theme landing page (header,
  search input, sidebar, module cards). It hardcodes
  `.../blob/main/<module>/...` GitHub URLs — it is a link hub, not a content
  renderer. Reuse its information architecture (module cards × 5 tiers) as the
  Starlight landing-page design input; do not port its CSS.
- `.github/workflows/pages.yml` deploys `main` to Pages (Jekyll,
  `_config.yml` with kramdown GFM). The new repo needs its own Actions
  workflow for Astro (`npm run build` → `./dist/`).

### Stack facts verified against current docs (Context7)

- Starlight: `docs` collection via `docsLoader()`/`docsSchema()` in
  `src/content.config.ts`; sidebar supports
  `items: [{ autogenerate: { directory } }]` + per-file `sidebar: { label,
  order, badge }` frontmatter. Externally synced `.md` files dropped into
  `src/content/docs/` participate like hand-written ones — but every file
  NEEDS `title` frontmatter, which source files lack (they start with `# H1`).
  The sync script MUST inject `title` (+ `sidebar.order`/`label`) frontmatter.
- `@vite-pwa/astro`: `AstroPWA({ workbox: {...} })` integration; for a fully
  static site, `generateSW` with `globPatterns` including `html` precaches all
  routes (the documented `non-precached-url index.html` failure occurs when
  `html` is omitted). No custom service-worker code needed.
- `@nanostores/persistent`: `persistentAtom(key, default, {encode, decode })`
  with `JSON.stringify/parse` for objects; `persistentMap('prefix:', defaults)`
  splits keys across localStorage entries and syncs across tabs. Progress
  (`{ slug: true }`) and quiz scores fit one `persistentAtom`/`persistentMap`
  each — zero custom storage code.
- Pagefind ships natively with Starlight (zero-config search UI); no custom
  index pipeline is needed.

## Affected Areas

- This repo is empty, so all paths below are NEW (nothing to modify):
  - `scripts/sync-content.js` — build-time fetch + transform + quiz-JSON emit
  - `src/content/docs/**` — generated (gitignored), never hand-edited
  - `astro.config.mjs` — starlight + PWA + sidebar wiring
  - `src/components/` — `PageCompletionTrigger`, progress badge, quiz island,
    Mermaid viewer/modal (small `.client.js`/`client:visible` islands)
  - `src/stores/` — Nano Stores progress/score stores
  - `.github/workflows/` — Pages/Vercel deploy running sync before build
- Source repo: read-only. No changes there. Its only contract surface is file
  layout + the two question-markup variants + Mermaid warning baseline.

## Approaches

### 1. Content sync: Actions second-checkout vs submodule vs tarball fetch

1. **Second checkout in GitHub Actions + Node sync script** — workflow checks
   out the source repo to a sibling path, `scripts/sync-content.js` copies the
   allowlisted files, injects frontmatter, rewrites relative links, parses
   quizzes to JSON.
   - Pros: pinned by commit SHA (reproducible); works with private source;
     full history available; no bloat in the app repo.
   - Cons: slightly longer workflow YAML; local dev needs a local source path
     (env var fallback to the read-only reference path).
   - Effort: Low.
2. **Git submodule** — source repo embedded at e.g. `content-source/`.
   - Pros: version-pinned; local dev trivial.
   - Cons: submodule UX friction (forgotten `--recursive`, detached HEAD);
     Pages build needs extra checkout config; contributors must not commit
     inside it.
   - Effort: Low (but ongoing friction tax).
3. **Tarball fetch (`codeload.github.com/.../main`) at build start.**
   - Pros: no checkout config at all; always latest.
   - Cons: unpinned (unreproducible builds); rate-limit/failure flakiness;
     no offline local dev; breaks "reference, don't copy" auditability.
   - Effort: Low.

### 2. Mermaid: client-render vs build-time pre-render

1. **Client-side Mermaid (`client:visible` island rendering ` ```mermaid `
   blocks to SVG on demand)** — diagrams stay as code in Markdown; the island
   lazily renders blocks in/near the viewport; click opens the fullscreen
   pan/pinch/scroll modal.
   - Pros: zero build-time diagram pipeline; warn-only behavior is automatic
     (a bad diagram fails locally, never breaks the build); smallest build;
     modal viewer reuses the same rendered SVG.
   - Cons: Mermaid runtime (~hundreds of KB) — MUST be lazy-loaded per page
     to protect the >95 mobile Lighthouse budget.
   - Effort: Medium.
2. **Build-time pre-render (Mermaid CLI → SVG files committed/generated).**
   - Pros: zero diagram JS on the client; fastest runtime.
   - Cons: heavy build dependency (headless Chromium); build breaks on
     malformed diagrams unless wrapped in warn-only handling (re-implements
     what client rendering gives for free); SVGs bloat the repo/output.
   - Effort: High.

### 3. Search, quiz, and progress wiring

1. **Pagefind native (Starlight default) vs custom index** — Pagefind is
   built into Starlight, indexes generated HTML at build end, offline-capable
   under the same service worker. A custom index duplicates this for no gain.
   - Recommendation: Pagefind native. Effort: Low (config only).
2. **Quiz parsing at sync time (JSON) vs runtime DOM transform of
   `<details>` blocks** — sync-time parsing converts both question variants
   into uniform JSON consumed by one interactive island (immediate feedback +
   explanations + score store). Runtime DOM scraping is brittle across the two
   variants and ships unparsed markup weight.
   - Recommendation: sync-time JSON. Effort: Medium (two parser branches +
     one island component, easily sliced across chained PRs).
3. **`@nanostores/persistent` vs hand-rolled localStorage helpers** —
   persistent needs JSON encode/decode and cross-tab sync out of the box;
   hand-rolled code re-implements it worse.
   - Recommendation: `@nanostores/persistent`. Effort: Low.

## Recommendation

- Sync: **Approach 1 (second checkout + `scripts/sync-content.js`)** pinned
  to a source SHA, with `CONTENT_SOURCE_DIR` env fallback for local dev.
  Frontmatter injection (`title`, `sidebar.order`/`label`) and relative-link
  rewriting are non-negotiable steps in that script; quiz parsing emits
  per-module JSON alongside the copied Markdown.
- Diagrams: **client-render with lazy `client:visible` island + fullscreen
  modal** (pan/pinch/scroll via CSS touch + pointer events, no heavy viewer
  dependency). Warn-only by construction.
- Search/progress/quiz state: **Pagefind native + `@nanostores/persistent` +
  sync-time quiz JSON**. `PageCompletionTrigger` as a tiny scroll-detector
  island writing to the progress store; badges read the same store in the top
  bar and sidebar override.
- Route preservation: map `README → full/`, `ULTRA-FAST-LEARN → ultra-fast/`,
  `FAST-LEARN → fast-learn/`, plus `diagrams/` and `quiz/` routes per module;
  keep the FAST-LEARN `Move to:` chain by rewriting to site slugs during sync.
- Slice by 400-line budget: (PR1) scaffold + sync script + CI,
  (PR2) sidebar/routes/styling, (PR3) quiz pipeline + stores/badges,
  (PR4) Mermaid viewer + PWA + Lighthouse pass.

## Risks

- **400-line budget overflow**: scaffold + sync + 60+ generated routes +
  islands + PWA easily exceeds one PR. Mitigation: auto-chain of 3–4 slices
  above; generated `src/content/docs/**` MUST be gitignored (never counted).
- **Two question-markup variants**: a single-regex parser silently drops
  `14-Practice` questions (wrong `✓`-suffix branch). Mitigation: two parser
  branches with per-module question-count assertions (expect 283 total).
- **Mermaid validator RED baseline**: any build-time diagram step that fails
  hard breaks every build. Mitigation: client-only rendering (warn-only by
  construction); never gate CI on the source validator.
- **Missing `title` frontmatter**: Starlight rejects/orphans pages without
  it and sidebar autogenerate mis-sorts. Mitigation: sync script injects
  `title` + `sidebar.order` from module/file mapping; CI asserts every synced
  file has frontmatter.
- **`14-Practice` + `11-Analytics` exceptions**: hardcoded "5 files × 14
  modules" assumptions break sync. Mitigation: explicit per-module allowlist
  with the two exceptions encoded and asserted.
- **PWA precache misses**: omitting `html` from Workbox `globPatterns`
  produces the documented `non-precached-url` failure and breaks offline
  transit reading. Mitigation: include `html` + navigation fallback in config;
  verify offline in the Lighthouse pass.
- **Lighthouse >95 with Mermaid/quiz islands**: eager-loading diagram or quiz
  JS tanks mobile scores. Mitigation: `client:visible` islands only, no
  framework heavier than Preact/none, Tailwind purged via Starlight overrides.
- **Content drift**: source repo evolves; pinned SHA goes stale silently.
  Mitigation: scheduled weekly sync PR (Dependabot-style) bumping the SHA,
  with question/diagram counts in the PR body as a diff signal.

## Ready for Proposal

Yes. Scope is bounded (greenfield app repo + stable read-only source with two
known markup variants), stack is mandated and doc-verified, and the slicing
plan fits the 400-line chained-PR budget. The proposal should lock: sync
mechanism (second checkout), route map, quiz JSON schema, and the 4-slice
delivery chain.
