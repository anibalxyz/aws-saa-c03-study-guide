// Persistent study-progress store: page slug -> completion timestamp.
// Tiny nanostores runtime, bundled per page.
import { persistentMap } from '@nanostores/persistent';
import { PROGRESS_STORAGE_KEY } from './storage-keys.js';

export const progressStore = persistentMap(PROGRESS_STORAGE_KEY, {}, {
  encode: JSON.stringify,
  decode: JSON.parse,
});

// Normalize any site path to the two-segment page slug used as store key,
// e.g. "/aws-saa-c03-study-guide/01-aws-fundamentals/full/" -> "01-aws-fundamentals/full".
// Works both under the Pages `base` and at domain root (last two segments).
export function slugFromPath(pathname) {
  const parts = pathname
    .replace(/\/index\.html$/, '')
    .split('/')
    .filter(Boolean);
  if (parts.length < 2) return '';
  return parts.slice(-2).join('/');
}

export function markPageComplete(slug) {
  if (!slug || slug.split('/').length < 2) return;
  if (!progressStore.get()[slug]) {
    progressStore.setKey(slug, new Date().toISOString());
  }
}
