# Proposal: Astro Starlight Study Website

## Intent

100% SSG mobile-first study app compiling source-repo Markdown at build time into offline transit-readable routes with progress, quizzes, and diagrams.

## Scope

### In Scope

- `scripts/sync-content.js`: fetch allowlist to `src/content/docs/`, inject frontmatter, rewrite links, emit quiz JSON
- Routes `full/`, `ultra-fast/`, `fast-learn/`, `diagrams/`, `quiz/` per module; keep FAST-LEARN `Move to:` chain
- Quiz islands (feedback + explanations + localStorage scores); progress stores + `PageCompletionTrigger.client.js` + top-bar/sidebar badges
- Lazy Mermaid island + fullscreen pan/pinch/scroll modal (warn-only); Workbox PWA (`html` in `globPatterns`); Pagefind; Starlight/Tailwind overrides; Pages + Vercel CI

### Out of Scope

- Source copy; dumps; verbatim AWS docs; real credentials; pre-render Mermaid; custom search; auth/backend

## Capabilities

### New Capabilities

- `content-sync`: fetch, frontmatter, links, quiz JSON, allowlist
- `study-routes`: route map, sidebar, 3 reading modes, Lighthouse >95
- `quiz-system`: 2-variant parse, schema, interactive island
- `progress-tracking`: stores, scroll trigger, badges
- `diagram-viewer`: lazy Mermaid, modal, warn-only
- `offline-search-deploy`: PWA, Pagefind, CI deploy

### Modified Capabilities

- None (greenfield)

## Approach

- Sync: second checkout pinned to SHA; `CONTENT_SOURCE_DIR` fallback; allowlist for 14-Practice + 11-Analytics; CI asserts frontmatter + 283 Q / 217 diagrams.
- Map: `README`->`full/`, `ULTRA-FAST-LEARN`->`ultra-fast/`, `FAST-LEARN`->`fast-learn/`, `DIAGRAMS`->`diagrams/`, JSON->`quiz/`.
- Quiz: `{module, questions: [{id, stem, options[{key, text}], answer, explanation, references}]}`; branch A (01-13 `<details>`) + B (14 `✓`).
- Chain (generated docs gitignored, uncounted): PR1 scaffold+sync+CI; PR2 routes/sidebar/style; PR3 quiz+stores/badges; PR4 Mermaid+PWA+Lighthouse.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `scripts/sync-content.js` | New | Sync + quiz JSON |
| `src/content/docs/**` | New, gitignored | Generated output |
| `astro.config.mjs` | New | Starlight + PWA |
| `src/components/` | New | Islands + modal |
| `src/stores/` | New | Progress/scores |
| `.github/workflows/` | New | Sync-then-build |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PR overflow | High | 4 slices; gitignore output |
| Variant parser drops 14-Practice | Med | 2 branches + count 283 |
| Mermaid RED breaks build | Med | Client-only, never gate CI |
| Missing title orphans pages | Med | Inject + assert |
| Offline/Lighthouse miss | Low | `html` glob + `client:visible` |

## Rollback Plan

Revert 4->1 via `git revert`; regenerate docs; disable `AstroPWA` fallback; repin last-good SHA. Versioned keys, no migrations.

## Dependencies

- Pinned source SHA; Node 24; Astro/Starlight, `@vite-pwa/astro`, nanostores persistent, Mermaid, Pagefind

## Success Criteria

- [ ] Sync + build green: 283 Q / 217 diagrams
- [ ] Lighthouse >95 mobile; offline reload works
- [ ] Quiz feedback + scores persist; badges update on scroll
