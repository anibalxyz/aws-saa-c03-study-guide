# Apply Progress: Astro Starlight Website — PR1 + PR2 + PR3 + PR4 + PR5

**Change**: astro-starlight-website · **Mode**: Standard (Strict TDD OFF per attempt authority)
**Work unit**: PR5-verify-fixes · **Attempt**: ledger generation 7 (begin-flow, max-attempts 2, max-changed-lines 400)
**Status**: 17/17 tasks complete + PR5 live-verification fixes (PR1–PR4 preserved below).

## Completed Tasks (merged — PR1 preserved, PR2 new)

### PR1: Scaffold, Sync, CI (prior batch, 5/5 — unchanged)

- [x] 1.1 `scripts/sync-content.guard.test.mjs` — 4 node:test guards (relative path, missing dir, unpinned SHA, SHA drift), each asserting no app-repo writes
- [x] 1.2 `scripts/sync-content.js` — resolve/discover/transform/quiz-emit/assert pipeline; allowlist with 14-Practice (no DIAGRAMS.md + 4 extra notes) and 11-Analytics (ML notes) exceptions; title + sidebar order/label injection; `../DIR/FILE.md` → site-slug rewrite incl. plain-text Move-to linking; branch-A (`<details>`) + branch-B (`✓` tick) quiz parsers; asserts 283 branch-A / 15 branch-B / 217 diagrams
- [x] 1.3 `package.json` (astro 5 + starlight 0.36 + sharp, node >= 22), `astro.config.mjs` (Starlight shell), `src/content.config.ts` (`docsLoader`/`docsSchema`), minimal splash `src/content/docs/index.mdx`
- [x] 1.4 `.github/workflows/deploy.yml` — read pin from `source-sha.txt` → checkout source@SHA read-only → `npm ci` → sync → assert-quiz → build → Pages
- [x] 1.5 `.gitignore` — `src/content/docs/*` (except authored `index.mdx`) + `src/data/quiz/*.json`; verified via `git check-ignore`. New `source-sha.txt` pins `d122a76…` (source HEAD 2026-07-04).

### PR3: Quiz, Progress, Badges (this batch, 4/4)

- [x] 3.1 Sync parsers already landed in PR1 (branch-A `<details>` + branch-B `✓`, 283 + 15 = 298 Q asserted) — no parser change needed; this batch adds quiz route-shell emit: `src/content/docs/<slug>/quiz.mdx` (frontmatter order/label + `<QuizIsland module>`), 14 shells, docs 60 → 74, counts unchanged
- [x] 3.2 `src/components/QuizIsland.astro` — SSG-renders stems/options/explanations/topic-string references from eager-globbed quiz JSON; radio (single) vs checkbox (multi, "Choose N" hint); `data-answer` key arrays; IntersectionObserver-gated enhancement (200px margin, IO fallback), immediate feedback + explanation reveal, results via scores store, tally line restores persisted score on reload
- [x] 3.3 `src/stores/progress.js` (`persistentMap` `saa-progress-v1`: slug → ISO timestamp + `slugFromPath` last-two-segments normalizer + `markPageComplete` junk-guard) and `src/stores/scores.js` (`persistentMap` `saa-scores-v1`: question-id → 1/0 + `recordAnswer`/`moduleScore`); new `nanostores` + `@nanostores/persistent` deps
- [x] 3.4 `src/components/PageCompletionTrigger.client.js` (sentinel IntersectionObserver + passive-scroll fallback, no-op without sentinel) wired via `Footer.astro` override; top-bar badge via `SiteTitle.astro` override (`N/total done`, store subscription, sidebar-link total); sidebar ✓ marks via `Sidebar.astro` override (store subscription, restored on reload); overrides registered in `astro.config.mjs` `components`

### PR2: Routes, Sidebar, Style (prior batch, 3/3 — unchanged)

- [x] 2.1 `src/content/docs/**` regenerated via sync: `full/`, `ultra-fast/`, `fast-learn/`, `diagrams/` per module (60 docs) + 14 quiz JSON (298 Q). Quiz **doc** shells stay deferred to PR3 per PR1 deviation #4 (PRACTICE-QUESTIONS.md parses to JSON; the `quiz/` route shell lands with QuizIsland).
- [x] 2.2 Sidebar autogenerate (14 collapsed groups `01 · …` → `14 · …`, order/label from sync-injected frontmatter) + `customCss` in `astro.config.mjs`; new `src/styles/custom.css` (Starlight vars only: 46rem measure, 1.75 line-height, scrollable tables, wrapping prose, thumb-scroll code, 2.75rem summary tap targets, mermaid aspect box, small-phone + reduced-motion rules)
- [x] 2.3 Move-to chain verified: 38/38 page-relative links resolve to existing doc files; `npm run build` green (62 pages); 60/60 docs hold `title`; Pagefind indexed 61 pages / 9777 words; 0 eager islands (`client:` count 0)

## Work Unit Evidence (PR3)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `node scripts/sync-content.js --check` → `check ok @d122a76: 74 docs, 283 branch-A + 15 branch-B questions, 217 diagrams`; `npm run sync:assert-quiz` → `298 questions across 14 modules`; store unit script (slug/score/complete incl. junk-input guards) → `all pass`; `npm test` (guards) → pass 4, fail 0 |
| Runtime harness command/scenario and exact result | `npm run build` → `76 page(s) built` (62 + 14 quiz), Pagefind `Indexed 75 pages / 10743 words`; built HTML holds 27 `data-quiz-q` on 01-quiz (checkbox Q12 `Choose 2.`, radios elsewhere, references, tally), `data-page-sentinel` + `data-progress-badge` on content pages, bundled `saa-progress-v1` + `saa-scores-v1` keys; `client:` directives in `src/` = 0; per-page island JS ≈ 4 KB vs Starlight `ui-core` 92 KB |
| Rollback boundary | Revert `astro.config.mjs` components hunk, `package.json` nanostores deps, `scripts/sync-content.js` quiz-shell hunk; delete `src/stores/`, `src/components/{QuizIsland,PageCompletionTrigger.client,Footer,Sidebar,SiteTitle}.astro`; regenerate via `npm run sync` (shells + JSON gitignored). No other files touched. |

## Work Unit Evidence (PR2)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `node scripts/sync-content.js --check` → `check ok @d122a76: 60 docs, 283 branch-A + 15 branch-B questions, 217 diagrams`; link-target script → `move-to links checked: 38, broken: 0`; `grep -h '^title:' src/content/docs/*/*.md \| wc -l` → 60 |
| Runtime harness command/scenario and exact result | `npm run build` → `62 page(s) built`, Pagefind `Indexed 61 pages / 9777 words`; sidebar labels (`01 · AWS Fundamentals`) and all 14 groups confirmed in built HTML; dist holds per-module `full/ ultra-fast/ fast-learn/ diagrams/` dirs (14-Practice: no diagrams + 4 extra-note pages, as designed) |
| Rollback boundary | Revert `astro.config.mjs`, `src/styles/custom.css` (delete), `src/content/docs/index.mdx` hero link, `scripts/sync-content.js` rewriteLinks hunk. Regenerate docs via `npm run sync` (generated output gitignored). No other files touched. |

## PR1 Evidence (preserved from prior batch)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `node --test scripts/sync-content.guard.test.mjs` → pass 4, fail 0 (caught and fixed a real bug: `isAbsolute(resolve())` was always true, relative paths slipped through) |
| Runtime harness command/scenario and exact result | `npm run sync:check` → `check ok @d122a76: 60 docs, 283 branch-A + 15 branch-B questions, 217 diagrams`; `npm run sync` + `npm run sync:assert-quiz` → 298 questions across 14 modules; `npm run build` → 62 pages, Pagefind indexed 61 pages / 9777 words, build complete |
| Rollback boundary | Revert `scripts/`, `astro.config.mjs`, `package.json`, `source-sha.txt`, `src/content.config.ts`, `src/content/docs/index.mdx`, `.github/`, `.gitignore`; delete generated `src/content/docs/0*\|1*`, `src/data/quiz/`, `dist/`, `node_modules/`. No other files touched. |

## Deviations from Design (decision log — PR1 items 1–6, PR2 items 7–10 preserved)

11. **(PR3) QuizIsland is SSG + progressive enhancement, not a `client:visible` framework island**: no UI framework is installed and the slice budget forbids a heavy runtime; questions render as static HTML at build (Pagefind-indexable, offline-safe) and a ~4 KB inline script activates on IntersectionObserver. Zero `client:` directives — strictly lighter than the `client:visible` design while meeting every quiz-system/progress-tracking scenario.
12. **(PR3) Trigger/badges ride Starlight component overrides (Footer/SiteTitle/Sidebar), not layout edits**: overriding PageFrame would duplicate the 97-line layout; Footer (article end) hosts the sentinel, SiteTitle (inside the top bar) hosts the badge, Sidebar hosts checkmarks. Override imports MUST use the `.astro`-suffixed specifier (`@astrojs/starlight/components/Footer.astro`) — bare `./components/X` specifiers are not exported and fail the build.
13. **(PR3) Quiz shells are generated (`quiz.mdx` via sync), matching the gitignored-output rule**: authoring 14 shells by hand would bloat the slice; the sync hunk is ~14 lines. Sidebar within-group order falls out of injected order+label (Quiz sorts after Full Guide, before Ultra-Fast).
14. **(PR3) Slug keys are last-two-segments normalized**: works under the Pages `base` and at domain root without baking the base into stored data.

## Workload / PR Boundary

1. **Count semantics**: tasks/spec text "283 total including tick answers" is arithmetically inconsistent — 283 is exactly the 01–13 branch-A sum; with 14-Practice ticks the true total is 298. Assert split as branch-A == 283, branch-B == 15, diagrams == 217; `--assert-quiz` totals 298.
2. **`answer` is an array of option keys** (both branches have Choose-2/3 multi-answer: 8 total), not a scalar.
3. **`references` are topic-name strings** as written in source (`**References:**` lines hold no URLs); URL mapping deferred to render slices.
4. **`PRACTICE-QUESTIONS.md` is parsed to JSON, not copied as a doc page**; the `quiz/` route shell lands in PR3 with the island.
5. **Default source dir is absolute** (`join(APP_ROOT, '../…')`) because the required guard rejects relative paths.
6. **Move-to chain verified end-to-end**: modules 01–10 linked rewrites, 11-Analytics plain-text Move-to converted to link, 12/13/14 have no Move-to in source (chain ends).
7. **(PR2) Move-to links are page-relative (`../slug/route/`), not root-absolute**: PR1 emitted `/slug/route/`, which 404s under the site `base` (`/aws-saa-c03-study-guide`) on GitHub Pages. All generated pages sit at uniform depth 2 so `../` is uniformly correct; 38/38 targets re-verified. Splash hero link made relative for the same reason.
8. **(PR2) Style is Starlight CSS vars only — no Tailwind**: routing brief mentioned "Tailwind overrides" but session constraints require "Starlight overrides only"; zero new deps, zero client JS, Lighthouse-safe by construction (0 `client:` directives).
9. **(PR2) Sidebar groups default `collapsed: true`** with numbered labels (`01 · …`) so 14 modules stay scannable on phones; within-group order falls out of injected `order`+`label` frontmatter (Diagrams, Fast Learn, Full Guide, Ultra-Fast Learn).
10. **(PR2, known follow-ups, NOT fixed — out of Move-to scope)**: 5 files hold out-of-allowlist source links left untouched by design (`../README.md`, `../QUICK-REFERENCE.md` → non-synced repo-root files; bare `AWS-ML-SERVICES-NOTES.md` in 14-practice/fast-learn.md pointing at another module's note). Candidates for PR4 cleanup or source-side fix.

## Workload / PR Boundary

- Mode: chained-PR slice (`auto-chain`, stacked-to-main); PR3 boundary: quiz+stores+badges only.
- PR3 authored delta: **~391 lines** (QuizIsland 185 + trigger 42 + SiteTitle 44 + Sidebar 35 + stores 52 + Footer 13 + sync shell hunk ~14 + config components hunk +4 + package.json deps +2) — within the 400-line budget, no exception needed. Generated output (14 quiz shells, 14 quiz JSON) gitignored, uncounted. `package-lock.json` churn from the 2 nanostores deps is untracked dependency metadata.
- Suggested commit: `feat(quiz): add SSG quiz island, progress stores, completion badges`
- PR2 authored delta: **~90 lines** (custom.css 64 new + astro.config +17 net + sync rewriteLinks hunk + index.mdx 1 line) — within the 400-line budget, no exception needed. Generated output (60 docs, 14 quiz JSON) gitignored, uncounted.
- PR1 size:exception (587 lines) stands as previously accepted; untouched by this batch.
- Suggested commit: `feat(routes): add autogenerated sidebar, mobile-first style, base-safe Move-to links`

## Remaining (NOT this slice)

- None — all 17 tasks complete. Suggested commit: `feat(pwa-diagrams): add lazy Mermaid viewer, offline PWA, search verification`

---

## PR4: Diagrams, PWA, Search + Phase 5 Verification (this batch, 5/5)

- [x] 4.1 `src/components/MermaidIsland.astro` — lazy Mermaid renderer + fullscreen modal, mounted once per page via the Footer override. Script early-returns when no `pre[data-language="mermaid"]` exists (runtime never fetched on non-diagram pages); per-block IntersectionObserver (200px margin, no-IO fallback) gates a single dynamic `import('mermaid')` → `mermaid.render` → inline SVG + "Open fullscreen" button. Modal (`<dialog>`) supports pointer-drag pan, two-pointer pinch zoom, wheel zoom, +/−/Reset/Close buttons, Esc native. All rendering is client-side with try/catch → inline notice + `console.warn`, so malformed blocks are warn-only by construction.
- [x] 4.2 `AstroPWA` `generateSW` in `astro.config.mjs` — `globPatterns` includes `html`, `navigateFallback: '/aws-saa-c03-study-guide/index.html'`, `cleanupOutdatedCaches`. New `src/pwa.ts` (`registerSW({ immediate: true })` on `virtual:pwa-register`) + `src/components/Head.astro` override (manifest link + registration entry), registered in `components`. New `mermaid` + `@vite-pwa/astro` deps in `package.json`.
- [x] 4.3 Pagefind native verified on production build: `dist/pagefind/` emitted, 75 pages indexed (build log).
- [x] 5.1 Verification battery (see Work Unit Evidence PR4). Lighthouse could not run (no Chromium in env, npx install blocked) — Lighthouse-safe by construction, guidance recorded for verify phase.
- [x] 5.2 Docs/comments inline in new files; no fixtures exist to remove (`scripts/` holds only sync + guard test); `git check-ignore` confirms generated docs, quiz JSON, and `dist/` stay ignored.

## Work Unit Evidence (PR4)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm run build` → `76 page(s) built`, Pagefind `Indexed 75 pages / 10747 words`; `npm test` guards pass; `node scripts/sync-content.js --check` → `check ok @d122a76: 74 docs, 283 branch-A + 15 branch-B, 217 diagrams`; `npm run sync:assert-quiz` → `298 questions across 14 modules` |
| Runtime harness command/scenario and exact result | SW: `dist/sw.js` precaches 168 entries (85 pages incl. fallback target + JS/CSS/manifest), `NavigationRoute → createHandlerBoundToURL("/aws-saa-c03-study-guide/index.html")`, `cleanupOutdatedCaches`, `registerSW.js` scope `/aws-saa-c03-study-guide/`; every page carries manifest link + bundled registrar (Head chunk 0.8 KB). Mermaid: diagrams page holds 15 `pre[data-language="mermaid"]` + modal + island chunk (2.7 KB gating script, 656 KB `mermaid.core` chunk loaded only via dynamic `import(`); quiz page has 0 blocks and 0 `mermaid.core` refs. Malformed-fence build test (appended broken `graph TB --BROKEN---` block) → build still `76 page(s)`, source restored. Offline reload + Lighthouse mobile are manual/verify-phase (no browser in this env). |
| Rollback boundary | Revert `astro.config.mjs` PWA hunk + Head components hunk, `package.json` mermaid/pwa deps; delete `src/components/{MermaidIsland,Head}.astro`, `src/pwa.ts`, Footer MermaidIsland hunk; rebuild. Generated `dist/` + `sw.js` are gitignored. No other files touched. |

## Deviations from Design (appended — PR1 items 1–6, PR2 items 7–10, PR3 items 11–14 preserved above)

15. **(PR4) Mermaid island is SSG + progressive enhancement, not a `client:visible` framework island** — same rationale as PR3 deviation #11: no UI framework installed; the inline gating script (2.7 KB) + dynamic import is strictly lighter and satisfies every diagram-viewer scenario (lazy render, modal, warn-only, skip on non-diagram pages).
16. **(PR4) Modal `<dialog>` markup ships on every page (~1 KB static HTML, inert until `showModal`)** — mounting via the Footer override keeps one code path; runtime cost on non-diagram pages is zero (script returns before the dynamic import). Alternative (per-page opt-in via sync-emitted MDX) would touch the sync pipeline for no Lighthouse gain.
17. **(PR4) SW registration is manual (`src/pwa.ts` + Head override), not auto-injected** — verified that @vite-pwa/astro generates `registerSW.js` but injects nothing into Starlight-owned pages (upstream docs confirm Astro needs explicit virtual-module import); `injectRegister: false` + explicit entry. First attempt (`injectRegister: 'inline'`) silently injected nothing — caught by grepping `dist/` for the registrar.
18. **(PR4) No PWA icons in manifest** — repo has no icon assets; referencing missing files would 404 the install prompt path. Offline precache (the spec requirement) is unaffected. Icons are a verify-phase follow-up if installability is wanted.

## Workload / PR Boundary

- Mode: chained-PR slice (`auto-chain`, stacked-to-main); PR4 boundary: mermaid+pwa+search+verification only.
- PR4 authored delta: **~281 lines** (MermaidIsland 229 + Head 15 + pwa.ts 10 + Footer hunk +3 + astro.config PWA/components hunks ~22 + package.json deps +2) — within the 400-line budget, no exception needed. `package-lock.json` churn from the 2 new deps is untracked dependency metadata. Generated output (`dist/`, quiz shells/JSON) gitignored, uncounted.
- Suggested commit: `feat(pwa-diagrams): add lazy Mermaid viewer, offline PWA, search verification`

### PR5: Live-verification fixes (this batch, 3/3)

Root causes parent-proven via playwright-cli skill against `npm run preview` (build 76 pages, zero JS errors):

- [x] 5.a `astro.config.mjs` (1 line): `navigateFallback` → `'/aws-saa-c03-study-guide'` (was `…/index.html`). The precache stores the root as `/aws-saa-c03-study-guide` (cache probe: HIT on slashless key, miss on index.html form with ignoreSearch) — the old fallback key missed, so offline fetch+goto both failed ERR_INTERNET_DISCONNECTED despite 168 precached entries and an active controlled SW.
- [x] 5.b `src/components/PageCompletionTrigger.client.js` (42 → 52 lines): IO `rootMargin` → `'0px'` AND the passive near-end scroll listener is now always attached as backup (fires at innerHeight+scrollY >= scrollHeight-240, marks once, removes itself + disconnects IO). The zero-height sentinel sat inside the old `-10%` bottom dead-zone at max scroll, so completion never fired (badge stuck 0/74, no saa-progress keys).
- [x] 5.c `public/favicon.svg` (new, 8 lines): original open-book glyph in `#FF9900` on dark rounded square (no AWS logo). `public/` did not exist; no icon path referenced elsewhere. Fixes the console favicon.svg 404.

## Work Unit Evidence (PR5)

| Evidence | Value |
|---|---|
| Focused test command and exact result | `npm run build` → `76 page(s) built`, `precache 169 entries` (was 168, +favicon); `node scripts/sync-content.js --check` → `check ok @d122a76: 74 docs, 283 branch-A + 15 branch-B, 217 diagrams`; `npm run sync:assert-quiz` → `298 questions across 14 modules`; `node --test scripts/sync-content.guard.test.mjs` → `pass 4, fail 0` |
| Runtime harness command/scenario and exact result | `grep dist/sw.js` → `NavigationRoute(r.createHandlerBoundToURL("/aws-saa-c03-study-guide"))` + precache entry `{url:"/aws-saa-c03-study-guide",revision:"efef7c…"}` (fallback key now matches precached key); `dist/favicon.svg` emitted + precached. Live browser re-verification by parent (preview stays up). |
| Rollback boundary | Revert the 1-line config hunk, the trigger backup-listener hunk, delete `public/favicon.svg`; rebuild. No other files touched. |
| Authored delta | ~20 lines across 3 files — within budget, no exception. |
