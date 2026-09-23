# Archive Report: astro-starlight-website

**Change**: astro-starlight-website
**Archived to**: `openspec/changes/archive/2026-09-23-astro-starlight-website/`
**Date**: 2026-09-23
**Mode**: hybrid (openspec files + Engram topic `sdd/astro-starlight-website/archive-report`)
**Status**: archived — SDD cycle complete (planned, implemented, verified, spec-synced)

## Final-State Authority

This report is the terminal record and describes the change AT CLOSE.
`apply-progress.md` (PR1–PR5 merged) and `verify-report.md` (full-change FAIL on
env-only partials) are intermediate snapshots, valid at write time but STALE now:
work continued after them (PR5 live-verification fixes). Where this report says
fixed/done and a snapshot says pending/partial, this report governs; the fix
location is cited. Snapshot-derived claims below are attributed with source and
time, never stated as current fact.

## Engram Traceability (observations actually read)

| Topic | ID | State at read |
|---|---|---|
| `sdd/astro-starlight-website/proposal` | #128 | read full |
| `sdd/astro-starlight-website/spec` | #129 | read full |
| `sdd/astro-starlight-website/design` | #130 | read full |
| `sdd/astro-starlight-website/tasks` | #131 | read full |
| `sdd/astro-starlight-website/apply-progress` (PR5 merge) | #132 | read full |
| `sdd/astro-starlight-website/verify-report` | #133 | read full |

## Delivery Summary (all 5 PR slices)

| Slice | Scope | Tasks | Authored delta | Budget |
|---|---|---|---|---|
| PR1 | Scaffold, sync script, CI, gitignore | 5/5 | 587 lines | size:exception, maintainer-accepted |
| PR2 | Routes, sidebar, Starlight-vars style, page-relative Move-to chain | 3/3 | ~90 lines | within 400 |
| PR3 | Quiz route shells, QuizIsland (SSG + enhancement), nanostores, trigger, badges | 4/4 | ~391 lines | within 400 |
| PR4 | MermaidIsland + modal, generateSW PWA, Pagefind, Phase-5 battery | 5/5 | ~281 lines | within 400 |
| PR5 | Live-verification fixes (3 defects) | 3/3 | ~20 lines | within 400 |

**Totals**: 17/17 implementation tasks complete (archived `tasks.md`: 17 checked,
0 unchecked); total authored ~1350 lines. Delivery vehicle is a single PR;
commit/PR creation is a separate human decision — at archive time the whole
tree is untracked (nothing committed).

Final build evidence (per archived `apply-progress.md` PR5 section): 76 pages,
Pagefind 75 pages / 10747 words, precache 169 entries (168 + favicon),
`sync:check` → 74 docs / 298Q / 217 diagrams, guards 4/4 pass.

## Final Live Verification (PR5 — outranks stale verify-report partials)

`verify-report.md` (2026-09-18) returned FAIL with 0 blockers, 0 CRITICAL
findings, 12/12 requirements, 6/14 scenarios COMPLIANT and 8/14 PARTIAL — all
partials were browser-live checks the verify env could not run (Lighthouse,
offline reload, click-through, gestures). After that snapshot, PR5 fixed 3 live
defects, parent-verified live via playwright-cli against a rebuilt preview with
zero JS errors:

1. **Offline fallback key** — `astro.config.mjs` `navigateFallback`:
   `/aws-saa-c03-study-guide/index.html` → `/aws-saa-c03-study-guide` (the exact
   precache key; cache-probe proven). Offline goto/fetch now succeed via
   fallback (previously ERR_INTERNET_DISCONNECTED). Archive worker confirmed
   in-tree: `grep` shows `navigateFallback: '/aws-saa-c03-study-guide'`.
2. **Progress dead-zone** — `PageCompletionTrigger.client.js`: IO `rootMargin`
   `'0px'` plus an always-on passive scroll backup listener (fires at
   innerHeight+scrollY >= scrollHeight-240, marks once, self-removes,
   disconnects IO). Badge went 0/74 → live `1/74 done`; `saa-progress` keys
   written. Archive worker confirmed in-tree: `rootMargin: '0px'` and
   `window.addEventListener('scroll', onScroll, { passive: true })` present.
3. **Favicon 404** — new `public/favicon.svg` (original open-book glyph);
   console now 0 errors. Archive worker confirmed in-tree: `public/favicon.svg`
   exists.

Note on evidence rank: the live browser re-verification itself is
parent-asserted via the orchestrator launch prompt (rank 2 in the Final-State
Authority hierarchy); the archive worker independently confirmed the three
code facts in the working tree but did not re-run a browser session.

## Specs Synced (Step 2)

`openspec/specs/` did not exist — all 6 delta specs were copied mechanically
(`cp` + `diff -r`, empty diffs) as new full main specs. No `sdd-archive-compose`
run was needed (nothing to merge into); `rules.archive` ("warn before merging
destructive deltas") noted — this sync is purely additive, non-destructive.

| Domain | Action | Details |
|---|---|---|
| content-sync | Created | 2 requirements (Pinned Sync, Transform Assert) + count correction |
| study-routes | Created | 2 requirements (Route Sidebar, Modes Budget) |
| quiz-system | Created | 2 requirements (Variant Parse, Island Scores) + count correction |
| progress-tracking | Created | 2 requirements (Trigger Stores, Badges Reload) + backup-listener clause |
| diagram-viewer | Created | 2 requirements (Lazy Render, Modal Warn-Only) |
| offline-search-deploy | Created | 2 requirements (Precache, Search Deploy) + fallback-key + favicon clauses |

Source of truth now: `openspec/specs/{content-sync,study-routes,quiz-system,progress-tracking,diagram-viewer,offline-search-deploy}/spec.md`.

## Archive-Time Spec Corrections (explicitly instructed, applied to new mains)

1. **Quiz total 298 (S1 / deviation D1)**: spec text saying 283 total was
   arithmetically inconsistent with the shipped assert (283 branch-A + 15
   branch-B = 298). Fixed in `content-sync` (Transform Assert) and
   `quiz-system` (Variant Parse requirement + Parsed scenario). Historical
   proposal/design text still says 283 — preserved untouched as audit trail.
2. **navigateFallback key form**: `offline-search-deploy` Precache now requires
   the fallback bound to the exact precache key (slashless base root, no
   `index.html` suffix).
3. **Trigger backup listener**: `progress-tracking` Trigger Stores now requires
   IO (`rootMargin` 0px) paired with an always-on scroll backup listener.
4. **Favicon**: `offline-search-deploy` Precache now requires
   `public/favicon.svg` served so pages load with zero console errors.

## Known Limitation (recorded, NOT fixed)

Offline deep-link navigations serve the home fallback (precache keys are
slashless; navigations carry a trailing slash) — standard fallback behavior per
design. A runtime pages-cache is a follow-up change, not part of this archive.

## Residual Follow-ups (for future changes, not blockers)

- W1 open: Lighthouse mobile >95 never ran (no Chromium in either env) —
  safe-by-construction claim (0 eager islands) is unverified; run
  `npx lighthouse <prod-url> --form-factor=mobile` before claiming the budget.
- W3 partial: quiz click-through, modal pinch gestures, reload-restore beyond
  the badge spot-check still want one manual browser pass (design Manual layer).
- W4: CI deploy workflow never executed remotely; proven at deploy time.
- W5/S2: no PWA icons (installability prompt) and no node-runnable
  store/interaction test (happy-dom) — both backlog candidates.
- 5 files hold out-of-allowlist source links left untouched by design
  (apply-progress PR2 deviation #10) — source-side or follow-up fix.

## Step 4 Verification Checklist

- [x] Main specs created correctly (6/6, corrections applied, no unrelated
      requirements to preserve — greenfield)
- [x] Change folder moved to `openspec/changes/archive/2026-09-23-astro-starlight-website/`
- [x] Archive contains all artifacts: proposal.md, design.md, exploration.md,
      tasks.md (17/17 checked), specs/ (6 domains), apply-progress.md,
      verify-report.md + this archive-report.md (additive, post-move)
- [x] Active `openspec/changes/` no longer holds the change (only `archive/`)
- [x] Verbatim `diff -r` readbacks: Step 2 per-file diffs empty; Step 3 final
      `diff -r snapshot destination` empty (DIFF_EXIT:0). `git mv` refused
      (untracked tree — expected, nothing committed); sanctioned plain-`mv`
      fallback engaged with snapshot + readback passing.
- [x] No CRITICAL findings in verify-report (0); FAIL verdict was env-only
      partials, superseded for the 3 fixed defects by PR5 live verification.
- [x] No commit/push/PR performed (per instructions; human decision pending).

## SDD Cycle Complete

The change has been fully planned, implemented, verified, and archived.
Ready for the next change.
