# AWS SAA-C03 Study Guide

A mobile-first, offline-capable study companion for the AWS Certified Solutions Architect – Associate (SAA-C03) exam. Read guides, search topics, take quizzes, track progress, and browse architecture diagrams — as a 100% static site with no backend and no accounts.

## The idea

Studying happens on the subway, on planes, and in 10-minute gaps — places with bad connectivity and small screens. So this site is:

- **Compiled at build time from pinned upstream Markdown** (reference, not copy): `scripts/sync-content.js` pulls allowlisted files from a SHA-pinned checkout of [ChathurangaVKD/AWS-Certified-Solutions-Architect-Associate-SAA-C03](https://github.com/ChathurangaVKD/AWS-Certified-Solutions-Architect-Associate-SAA-C03) into Starlight docs plus per-module quiz JSON. Reproducible: the exact source commit lives in `source-sha.txt`, and CI re-checks out that SHA read-only.
- **Static + PWA for transit reading**: Astro SSG output with a hand-built Workbox service worker precaches every page and asset, so the whole guide works offline after the first visit.
- **localStorage progress, no backend**: page completions and quiz scores persist in the browser via Nano Stores. Nothing leaves your device.
- **Warn-only Mermaid**: a broken diagram renders its source plus a notice and logs a warning — it never breaks the page.
- **Small review slices**: every change ships in review units of ≤400 lines (see Contributing).

## Features

- **14 modules** (Fundamentals → Cost Optimization → Practice), each with routes for **Full Guide**, **Ultra-Fast Learn**, and **Fast Learn** — three reading speeds for the same material.
- **Quizzes with instant feedback**: 283 questions across modules 01–13 plus 15 practice questions, with explanations, running tally, and scores that survive reload.
- **Progress tracking**: scroll-to-bottom completion, sidebar checkmarks, and a top-bar badge (e.g. `1/74`) backed by `localStorage`.
- **Fullscreen diagram viewer**: 217 Mermaid diagrams rendered lazily, with pan/zoom/reset in a closable modal.
- **Full-text search** via Starlight's built-in Pagefind index — works offline.
- **PWA offline support**: installable manifest, precached routes, `skipWaiting` + `clientsClaim` updates.
- **Practice extras**: flashcards, study notes, service-to-question mapping, and a test-results tracker in module 14.

## Getting started

Prerequisites: **Node.js >= 22.12** and npm.

```bash
npm install
npm run dev        # http://localhost:4321/aws-saa-c03-study-guide/
```

Content sync requires the pinned upstream checkout next to this repo (or set `CONTENT_SOURCE_DIR` to its absolute path). The checkout must contain `CONTENT-POLICY.md` and match the SHA in `source-sha.txt`:

```bash
npm run sync       # pull content from the pinned source checkout
npm run build      # astro build + service worker generation
npm run preview    # serve the production build locally
```

## Commands

| Command | What it does | When to run it |
|---|---|---|
| `npm run dev` | Start the Astro dev server | Daily development |
| `npm run build` | `astro build && node scripts/generate-sw.js` — build SSG output, then generate the service worker | Before preview, e2e, or deploy |
| `npm run preview` | Serve `dist/` locally | Verify a production build |
| `npm run sync` | Sync allowlisted Markdown + quiz JSON from the pinned source checkout | After cloning, or when `source-sha.txt` changes |
| `npm run sync:check` | Validate sync (SHA, counts, links) without writing files | Quick sanity check / CI-style dry run |
| `npm run sync:assert-quiz` | Assert quiz JSON counts (283 + 15 questions, 217 diagrams) | After sync, before build (also runs in CI) |
| `npm test` | `node:test` guard suite for the sync script (rejects bad source paths, unpinned SHA) | After touching `scripts/sync-content.js` |
| `npm run test:e2e` | Full rebuild + Playwright suite (`build → preview → test → teardown`) | Before opening a PR |

## Architecture in brief

**Content pipeline:** pinned source checkout → `scripts/sync-content.js` (frontmatter, link rewrite, quiz JSON, count assertions) → Starlight `docs` collection + `src/data/quiz/*.json` → Astro SSG → `dist/`.

| Path | Role |
|---|---|
| `scripts/sync-content.js` / `scripts/generate-sw.js` | Content compiler / service worker builder |
| `src/content/docs/<module>/{full,ultra-fast,fast-learn,diagrams,quiz}` | Generated study routes (14 modules) |
| `src/data/quiz/*.json` | Generated quiz data per module |
| `src/components/{QuizIsland,MermaidIsland,Sidebar,Footer,Head}.astro` | Interactive islands + Starlight overrides |
| `src/stores/{progress,scores}.js` | Nano Stores persistence (`localStorage`) |
| `src/pwa.ts` / `public/manifest.webmanifest` | SW registration / PWA manifest |
| `source-sha.txt` | Pinned upstream commit SHA |
| `openspec/specs/` | Capability specs (sync, routes, quiz, progress, diagrams, deploy) |
| `tests/` + `playwright.config.ts` | Playwright e2e suite |

**Manual PWA design** (no wrapper plugin — it capped Astro at v5): `workbox-build` `generateSW` runs over `dist/`, precaching HTML/JS/CSS/fonts/images, with the navigation fallback bound to the exact slashless precache key `/aws-saa-c03-study-guide` (appended with the homepage revision so offline reloads revalidate correctly).

**Testing layers:** fast `node:test` guards for the sync script's threat matrix (relative paths, unpinned SHA, wrong source dir), plus a Playwright matrix of **Pixel 7 / iPhone 14 / Desktop** (system Chrome) covering navigation, single-H1 routes, quiz feedback + persistence, progress badges, diagrams modal + search, and SW precache.

## Content policy

- **Original content only.** Study notes here are paraphrases and summaries — never verbatim dumps of copyrighted material. When in doubt, paraphrase and link the official AWS docs.
- **Placeholder credentials.** Any keys, account IDs, or secrets appearing in examples are fictional placeholders.
- **Reference, not copy.** Upstream study material is compiled at build time from the pinned checkout; the pin (`source-sha.txt`) makes every build reproducible. Upstream source: [ChathurangaVKD/AWS-Certified-Solutions-Architect-Associate-SAA-C03](https://github.com/ChathurangaVKD/AWS-Certified-Solutions-Architect-Associate-SAA-C03).

## Deployment

**GitHub Pages via Actions** (`.github/workflows/deploy.yml`): on push to `main`, CI checks out the app, re-checks out the upstream source at the pinned SHA (read-only), runs `sync` → `sync:assert-quiz` → `build`, and publishes `dist/` with `deploy-pages`. Live at `https://anibalxyz.github.io/aws-saa-c03-study-guide/`.

**Base path note:** the site is served under `/aws-saa-c03-study-guide` (`base` in `astro.config.mjs`). Local dev/preview URLs include that prefix; any static host works as long as it serves `dist/` under the same subpath. A Vercel deployment is possible the same way — build with `npm run build`, serve `dist/`, keep the base path — but it is not currently configured.

## Built with AI

Developed with AI assistance — and proud of it. The model did the typing; the human did the thinking:

- **Model:** `muse-spark-1.3-contributor-free`, working inside OpenCode.
- **Method:** spec-driven development (Gentle AI SDD): explore → propose → spec → design → tasks → apply → verify → archive, with specs living in `openspec/`.
- **Human-directed at every gate:** the user approved the scope, the 400-line work slices, every fix, and every PR. Nothing merged on AI authority alone.
- **Stack:** Astro 7 + Starlight, Workbox PWA, Nano Stores, Mermaid, Pagefind, Playwright e2e.
- **Ownership:** the human owns all commits, PRs, and deploys. The AI never pushed, merged, or shipped anything by itself.

## License & contributing

License: MIT — see [LICENSE](./LICENSE).

Issues and PRs are welcome. Please keep review slices **≤400 lines** (split stacked changes if needed), run `npm test` and `npm run test:e2e` before opening a PR, and respect the content policy above.
