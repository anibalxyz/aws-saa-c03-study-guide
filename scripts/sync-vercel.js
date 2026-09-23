#!/usr/bin/env node
// Fetches the SHA-pinned upstream study-guide source as a tarball so hosted
// builders (Vercel) that only receive this repo can still run the sync.
//
// Pipeline: read pinned SHA -> download codeload tarball -> extract to a
// temp dir -> verify top-level dirname + marker -> run sync-content.js with
// CONTENT_SOURCE_DIR -> clean up the temp dir (always).
//
// The tarball has no `.git` metadata, so sync-content.js cannot `rev-parse`
// its HEAD: the fetcher proves the commit instead (the tarball URL embeds
// the full SHA, and codeload names the top-level dir `<repo>-<sha>`), then
// passes it via CONTENT_SOURCE_TARBALL_SHA, which the sync only accepts
// when it exactly equals the pinned SHA. Local checkouts keep the strict
// git-HEAD path untouched.
//
// Vercel build command: `npm run sync:vercel && npm run build`.

import { spawnSync } from 'node:child_process';
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';

const APP_ROOT = process.cwd();
const UPSTREAM_REPO =
  'ChathurangaVKD/AWS-Certified-Solutions-Architect-Associate-SAA-C03';
const SOURCE_MARKER = 'CONTENT-POLICY.md';

const die = (message) => {
  console.error(`sync-vercel: ERROR: ${message}`);
  process.exit(1);
};

function pinnedSha() {
  const file = join(APP_ROOT, 'source-sha.txt');
  const sha = existsSync(file) ? readFileSync(file, 'utf8').trim().toLowerCase() : '';
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    die('unpinned source: source-sha.txt must hold the 40-char source HEAD');
  }
  return sha;
}

async function fetchTarball(sha, dest) {
  const url = `https://github.com/${UPSTREAM_REPO}/archive/${sha}.tar.gz`;
  let res;
  try {
    res = await fetch(url, { redirect: 'follow' });
  } catch (error) {
    die(`tarball download failed: ${error.message} (${url})`);
  }
  if (!res.ok || !res.body) die(`tarball download failed: HTTP ${res.status} (${url})`);
  await pipeline(res.body, createWriteStream(dest));
}

function extractTarball(tarball, dir) {
  const result = spawnSync('tar', ['-xzf', tarball, '-C', dir], { encoding: 'utf8' });
  if (result.status !== 0) die(`tar extract failed: ${(result.stderr ?? '').trim()}`);
  const tops = readdirSync(dir, { withFileTypes: true }).filter((d) => d.isDirectory());
  if (tops.length !== 1) die(`expected one top-level dir in tarball, saw ${tops.length}`);
  return join(dir, tops[0].name);
}

function verifySource(sourceDir, sha) {
  const top = sourceDir.split('/').pop() ?? '';
  if (!top.toLowerCase().endsWith(`-${sha}`)) {
    die(`tarball top-level dir '${top}' does not carry pinned SHA ${sha}`);
  }
  if (!existsSync(join(sourceDir, SOURCE_MARKER))) {
    die(`extracted source lacks ${SOURCE_MARKER}; refusing to sync`);
  }
}

function runSync(sourceDir, sha) {
  const result = spawnSync(process.execPath, [join(APP_ROOT, 'scripts/sync-content.js')], {
    cwd: APP_ROOT,
    stdio: 'inherit',
    env: {
      ...process.env,
      CONTENT_SOURCE_DIR: sourceDir,
      CONTENT_SOURCE_TARBALL_SHA: sha,
    },
  });
  if (result.status !== 0) die('sync-content.js failed (see output above)');
}

async function main() {
  const sha = pinnedSha();
  const workdir = mkdtempSync(join(tmpdir(), 'saa-source-'));
  try {
    const tarball = join(workdir, 'source.tar.gz');
    const stage = join(workdir, 'extract');
    await fetchTarball(sha, tarball);
    mkdirSync(stage, { recursive: true });
    const sourceDir = extractTarball(tarball, stage);
    verifySource(sourceDir, sha);
    runSync(sourceDir, sha);
    console.log(`sync-vercel: source ready from tarball @${sha.slice(0, 7)}`);
  } finally {
    rmSync(workdir, { recursive: true, force: true });
  }
}

await main();
