# Design: Astro Starlight Study Website

## Technical Approach

Greenfield 100% SSG Starlight app. `scripts/sync-content.js` compiles allowlisted source Markdown (SHA-pinned second checkout) into the `docs` collection plus per-module quiz JSON. All interactivity (quiz, progress, Mermaid, badges) lives in `client:visible` islands, keeping SSG output light for Lighthouse >95 mobile. Generated docs are gitignored; CI runs sync-then-build asserting 283 Q / 217 diagrams. Covers all 6 specs.

## Architecture Decisions

| Decision | Options (tradeoff) | Choice |
|---|---|---|
| Sync | Submodule (friction) / tarball (unpinned) / second checkout (pinned, reproducible) | Second checkout + `CONTENT_SOURCE_DIR` fallback |
| Collections | `docsLoader()`/`docsSchema()` in `src/content.config.ts`; synced `.md` → `src/content/docs/` | Sync injects `title` + `sidebar.order`/`label` (source lacks `title`) |
| Quiz parse | Runtime DOM scrape (brittle, 2 variants) vs sync-time JSON (one island) | Sync-time JSON; branch A (`<details>` answer) + B (`✓` tick) |
| Progress | Hand-rolled storage vs `@nanostores/persistent` (JSON codec, cross-tab sync) | `persistentAtom` + `persistentMap`, versioned keys |
| Mermaid | Build-time pre-render (Chromium dep, breaks on bad diagrams) vs lazy client island (warn-only by construction) | Lazy island + fullscreen modal; bad diagram fails locally only |
| Search | Custom index vs Pagefind native (ships with Starlight, offline under same SW) | Pagefind native, zero-config |
| PWA | Custom SW vs `@vite-pwa/astro` `generateSW` | `generateSW` with `html` in `globPatterns` + navigation fallback |
| Perf | Eager islands vs `client:visible` only + Tailwind overrides | Lazy islands; Mermaid runtime imported per diagrams page only |

## Data Flow

```
Source@SHA ──sync──→ docs/** + quiz JSON ──astro build──→ dist/ ──Pages/Vercel
 [fetch allowlist → frontmatter → link rewrite → quiz emit → assert]
```

Sync: `checkout(app) + checkout(source@SHA) → fetch (allowlist incl. 14/11 exceptions) → inject title/order/label → rewrite links to site slugs (keep Move-to chain) → emit quiz JSON → assert 283Q/217 + frontmatter`.

Quiz: `split '### Question N' → A (<details>: Answer/Explanation/References) | B ('**Options:**' + '✓' + '**Explanation:**') → {module, questions[]} → QuizIsland`.

Progress: `scroll-end → PageCompletionTrigger.client.js (IntersectionObserver) → progressStore → localStorage; top-bar + sidebar badges subscribe; reload restores`.

Mermaid: ` ```mermaid → MermaidIsland (client:visible) → lazy import → SVG near viewport (runtime skipped on other pages); click → modal (touch + pointer pan/pinch/scroll) → close restores`.

PWA: `generateSW globs **/*.{html,js,css,woff2,png,svg} → precache + fallback → offline route reloads from cache`.

## File Changes

| File | Action | Description |
|---|---|---|
| `scripts/sync-content.js` | Create | 5-stage sync; allowlist with 14-Practice/11-Analytics exceptions |
| `src/content.config.ts` | Create | `docsLoader()`/`docsSchema()` collection |
| `src/content/docs/**` | Generated, gitignored | `full/`, `ultra-fast/`, `fast-learn/`, `diagrams/` (no 14), `quiz/` per module |
| `src/data/quiz/*.json` | Generated | Per-module quiz JSON |
| `astro.config.mjs` | Create | Starlight + sidebar + `AstroPWA` Workbox + Pagefind default |
| `src/components/QuizIsland.*` | Create | Feedback + explanations; reads quiz JSON, writes score store |
| `src/components/MermaidIsland.*` + modal | Create | Lazy render + fullscreen pan/pinch/scroll modal |
| `PageCompletionTrigger.client.js` + badges | Create | Scroll-end detector + top-bar/sidebar badge overrides |
| `src/stores/progress.js`, `scores.js` | Create | `persistentAtom`/`persistentMap`, JSON codec |
| `.github/workflows/deploy.yml` | Create | Checkout SHA → sync → assert → build → Pages/Vercel |
| `.gitignore` | Modify | Exclude generated docs |

Routes: `README→full/`, `ULTRA-FAST-LEARN→ultra-fast/`, `FAST-LEARN→fast-learn/`, `DIAGRAMS→diagrams/`, JSON→`quiz/`; sidebar `autogenerate` per directory.

## Interfaces / Contracts

```js
{ module, questions: [{ id, stem, options: [{key, text}],
  answer, explanation, references: ["https://docs.aws.amazon.com/..."] }] }
progress = persistentAtom('saa-progress-v1', {}, {encode: JSON.stringify, decode: JSON.parse});
AstroPWA({ workbox: { globPatterns: ['**/*.{html,js,css,woff2,png,svg,ico}'],
  navigateFallback: '/index.html', cleanupOutdatedCaches: true } });
```

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit (sync) | Parser A vs B (tick-variant isolated); frontmatter; link rewrite incl. Move-to chain; exceptions | Node asserts on fixtures (no-runner fallback) |
| Integration | 283Q/217 asserts; every file has `title`; build passes with malformed Mermaid (warn-only) | CI sync-then-build checks |
| Manual | Quiz feedback + score/reload restore; scroll→badge→reload; modal gestures; offline reload; Pagefind; Lighthouse >95 | Checklist + Lighthouse CI on prod build |

## Threat Matrix

Only repo selection applies (sync reads sibling checkout or `CONTENT_SOURCE_DIR`; CI pins SHA). No shell-string construction, commit/push/PR automation, or executable classification.

| Boundary | Applicability | Response / RED test |
|---|---|---|
| Git repo selection | Applicable | Absolute path only; SHA pinned; read-only; missing dir fails loudly, never falls through to app repo |
| Doc-like paths / commit / push / PR | N/A (generated Markdown is data, never executed; no VCS automation) | — |

## Migration / Rollout

No migration (greenfield, versioned keys). Chain: PR1 scaffold+sync+CI; PR2 routes/sidebar/style; PR3 quiz+stores/badges; PR4 Mermaid+PWA+Lighthouse. Rollback: `git revert` 4→1, regenerate docs, disable `AstroPWA` fallback, repin last-good SHA. Weekly SHA-bump PR (counts as drift signal).

## Open Questions

- None blocking.
