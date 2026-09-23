# Tasks: Astro Starlight Study Website

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 1200-1800 (generated docs gitignored, uncounted) |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR1 scaffold+sync+CI → PR2 routes/sidebar/style → PR3 quiz+stores/badges → PR4 Mermaid+PWA+Lighthouse |
| Delivery strategy | auto-chain |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Scaffold, sync script, CI, gitignore | PR1 | `node scripts/sync-content.js --check` | N/A (no browser; sync-only slice) | Revert `scripts/`, `astro.config.mjs`, `.github/`, `.gitignore` |
| 2 | Routes, sidebar, style, Move-to chain | PR2 | `npm run build` | Open `full/` + `fast-learn/` pages, click Move-to | Revert `src/content.config.ts`, `src/styles/`, sidebar config |
| 3 | Quiz JSON, island, stores, badges | PR3 | `node scripts/sync-content.js --assert-quiz` | Answer quiz, reload, check score + badge persist | Revert `src/data/quiz/`, `src/components/QuizIsland.*`, `src/stores/`, trigger |
| 4 | Mermaid modal, PWA, Pagefind, Lighthouse | PR4 | `npm run build && npx pagefind --check` | Offline reload, modal pan/pinch, Lighthouse mobile run | Revert `src/components/MermaidIsland.*`, PWA config; disable fallback |

## Phase 1: Scaffold, Sync, CI (PR1)

- [x] 1.1 RED: add `scripts/sync-content.guard.test.mjs` asserting sync rejects relative source path, unpinned SHA, and missing dir without falling through to app repo
- [x] 1.2 Create `scripts/sync-content.js` with allowlist (incl. 14/11 exceptions), title injection, link rewrite, quiz emit, 283Q/217 assert; reads `../AWS-Certified-Solutions-Architect-Associate-SAA-C03` (read-only)
- [x] 1.3 Create `package.json`, `astro.config.mjs` (Starlight shell), `src/content.config.ts` (`docsLoader`/`docsSchema`)
- [x] 1.4 Create `.github/workflows/deploy.yml` running checkout SHA, sync, assert, build
- [x] 1.5 Modify `.gitignore` to exclude `src/content/docs/**` and `src/data/quiz/*.json`

## Phase 2: Routes, Sidebar, Style (PR2)

- [x] 2.1 Generate `src/content/docs/**` via sync with `full/`, `ultra-fast/`, `fast-learn/`, `diagrams/`, `quiz/` routes
- [x] 2.2 Set sidebar autogenerate plus order/label in `astro.config.mjs`; add `src/styles/custom.css` overrides
- [x] 2.3 Verify Move-to chain links resolve and `npm run build` passes with every file holding `title`

## Phase 3: Quiz, Progress, Badges (PR3)

- [x] 3.1 Extend `scripts/sync-content.js` with branch-A `<details>` and branch-B tick parsers emitting `src/data/quiz/*.json` (assert 283)
- [x] 3.2 Create `src/components/QuizIsland.*` (`client:visible`): feedback, explanations, references, localStorage scores
- [x] 3.3 Create `src/stores/progress.js` and `src/stores/scores.js` (`persistentAtom`/`persistentMap`, versioned keys)
- [x] 3.4 Create `src/components/PageCompletionTrigger.client.js` (IntersectionObserver) plus top-bar and sidebar badges subscribed to store

## Phase 4: Diagrams, PWA, Search (PR4)

- [x] 4.1 Create `src/components/MermaidIsland.*` plus fullscreen modal (pan/pinch/scroll); lazy import on diagrams pages only, warn-only on malformed blocks
- [x] 4.2 Wire `AstroPWA` `generateSW` in `astro.config.mjs` (`html` glob, navigation fallback)
- [x] 4.3 Verify Pagefind native search returns results on production build

## Phase 5: Verification, Cleanup

- [x] 5.1 Run `npm run build`, Pagefind check, Lighthouse mobile (>95), offline reload check, malformed-Mermaid warn-only check
- [x] 5.2 Update docs/comments, remove fixtures, confirm generated output stays gitignored
