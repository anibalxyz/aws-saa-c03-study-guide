// Guard tests for scripts/sync-content.js (threat-matrix: git repo selection).
// The sync MUST reject a relative source path, an unpinned SHA, and a
// missing source dir without falling through to the app repo (no writes).
// Run: `node --test scripts/sync-content.guard.test.mjs`

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeHeading, stripDuplicateH1, titleOf } from './sync-content.js';

const APP_ROOT = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const SCRIPT = join(APP_ROOT, 'scripts/sync-content.js');
const REAL_SOURCE =
  process.env.SYNC_TEST_SOURCE ??
  '/home/anibalxyz/repos/AWS-Certified-Solutions-Architect-Associate-SAA-C03';

const docsSnapshot = () => {
  const dir = join(APP_ROOT, 'src/content/docs');
  return existsSync(dir) ? JSON.stringify(readdirSync(dir).sort()) : '[]';
};

function runSync({ cwd = APP_ROOT, env = {} }) {
  return spawnSync(process.execPath, [SCRIPT, '--check'], {
    cwd,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
      CONTENT_SOURCE_DIR: REAL_SOURCE,
      ...env,
    },
  });
}

test('rejects a relative source path', () => {
  const before = docsSnapshot();
  const r = runSync({ env: { CONTENT_SOURCE_DIR: 'relative/path' } });
  assert.notEqual(r.status, 0, 'must exit non-zero');
  assert.match(r.stderr, /absolute/i);
  assert.equal(docsSnapshot(), before, 'app repo must stay untouched');
});

test('rejects a missing source dir without falling through', () => {
  const before = docsSnapshot();
  const r = runSync({ env: { CONTENT_SOURCE_DIR: '/nonexistent/source-checkout-xyz' } });
  assert.notEqual(r.status, 0, 'must exit non-zero');
  assert.match(r.stderr, /not found|missing/i);
  assert.equal(docsSnapshot(), before, 'app repo must stay untouched');
});

test('rejects an unpinned SHA without writing anywhere', () => {
  const before = docsSnapshot();
  const empty = mkdtempSync(join(tmpdir(), 'sync-guard-'));
  const r = runSync({ cwd: empty, env: { CONTENT_SOURCE_SHA: '' } });
  assert.notEqual(r.status, 0, 'must exit non-zero');
  assert.match(r.stderr, /unpinned/i);
  assert.deepEqual(readdirSync(empty), [], 'must write nothing, not even to cwd');
  assert.equal(docsSnapshot(), before, 'app repo must stay untouched');
});

test('rejects a source checkout that drifted from the pinned SHA', () => {
  const r = runSync({ env: { CONTENT_SOURCE_SHA: '0'.repeat(40) } });
  assert.notEqual(r.status, 0, 'must exit non-zero');
  assert.match(r.stderr, /mismatch/i);
});

test('stripDuplicateH1 removes a body H1 that repeats the title', () => {
  const raw = '# Module 01: AWS Fundamentals\n\n## Overview\n';
  const out = stripDuplicateH1(raw, titleOf(raw, 'fallback'));
  assert.ok(!/^#\s/m.test(out), 'no top-level H1 must remain');
  assert.match(out, /## Overview/);
});

test('stripDuplicateH1 matches case-insensitively and trims', () => {
  const out = stripDuplicateH1('#   hello world  \n\ntext\n', 'Hello World');
  assert.ok(!/^#\s/m.test(out), 'no top-level H1 must remain');
  assert.equal(out.trim(), 'text');
});

test('stripDuplicateH1 keeps a differing H1 and bodies without one', () => {
  const different = '# Something Else\n\nbody\n';
  assert.equal(stripDuplicateH1(different, 'Fallback Title'), different);
  const noH1 = 'Just body text\n\n## Sub\n';
  assert.equal(stripDuplicateH1(noH1, 'Fallback Title'), noH1);
});

test('synced output never starts (post-frontmatter) with a title-duplicating H1', () => {
  // Full deterministic sync first, so this guards the transform itself —
  // reading stale on-disk files would pass even with the bug back.
  const r = spawnSync(process.execPath, [SCRIPT], {
    cwd: APP_ROOT,
    encoding: 'utf8',
    env: {
      PATH: process.env.PATH ?? '/usr/bin:/bin',
      CONTENT_SOURCE_DIR: REAL_SOURCE,
    },
  });
  assert.equal(r.status, 0, `sync must succeed: ${r.stderr}`);
  const docsDir = join(APP_ROOT, 'src/content/docs');
  const files = readdirSync(docsDir, { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(docsDir, f));
  assert.ok(files.length > 50, `expected dozens of synced pages, saw ${files.length}`);
  const dupes = [];
  for (const f of files) {
    const content = readFileSync(f, 'utf8');
    const title = content.match(/^---\ntitle: "(.+)"\n/m)?.[1] ?? '';
    const firstLine =
      content
        .replace(/^---\n[\s\S]*?\n---\n/, '')
        .split('\n')
        .map((line) => line.trim())
        .find((line) => line.length > 0) ?? '';
    const h1 = firstLine.match(/^#\s+(.+?)\s*$/)?.[1];
    if (h1 && title && normalizeHeading(h1) === normalizeHeading(title)) {
      dupes.push(f);
    }
  }
  assert.deepEqual(dupes, [], 'post-frontmatter body must not repeat the title as H1');
});
