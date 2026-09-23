#!/usr/bin/env node
// Builds the service worker (dist/sw.js) with workbox-build `generateSW`.
//
// Replaces the @vite-pwa/astro wrapper (pinned Astro at v5): same Workbox
// runtime, owned directly. Runs after `astro build` via `npm run build`
// (`astro build && node scripts/generate-sw.js`), so no deploy-workflow
// change is needed.
//
// Proven invariants (root-caused live against the old wrapper):
// - every built page + asset precached with content revisions (`html` kept
//   in the glob — offline route reloads depend on it);
// - navigation fallback bound to the EXACT slashless precache key
//   `/aws-saa-c03-study-guide` (the wrapper bound `/index.html`, which
//   missed and broke offline). That key is not a file on disk, so it is
//   appended below with index.html's revision — it revalidates exactly
//   when the homepage changes;
// - `skipWaiting` + `clientsClaim` so updates apply without waiting;
// - outdated precache caches cleaned on activate.
import { generateSW } from 'workbox-build';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// Served under GitHub Pages at <origin>/aws-saa-c03-study-guide.
const BASE_URL_PATH = '/aws-saa-c03-study-guide';

async function main() {
  const { count, size, warnings } = await generateSW({
    globDirectory: join(APP_ROOT, 'dist'),
    // Same proven set as the old wrapper config.
    globPatterns: ['**/*.{html,js,css,woff2,png,svg,ico}'],
    swDest: join(APP_ROOT, 'dist', 'sw.js'),
    navigateFallback: BASE_URL_PATH,
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
    mode: 'production',
    sourcemap: false,
    manifestTransforms: [addSlashlessFallback],
  });
  for (const warning of warnings) console.warn(`[generate-sw] ${warning}`);
  console.log(`[generate-sw] precached ${count} entries (${size} bytes)`);
}

function addSlashlessFallback(entries) {
  const index = entries.find((entry) => entry.url === 'index.html');
  if (!index) {
    throw new Error('[generate-sw] index.html missing from precache manifest');
  }
  return {
    manifest: [
      ...entries,
      { url: BASE_URL_PATH, revision: index.revision },
    ],
    warnings: [],
  };
}

await main();
