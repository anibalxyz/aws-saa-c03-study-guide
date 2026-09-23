#!/usr/bin/env node
// Syncs allowlisted Markdown from the SHA-pinned study-guide source checkout
// into this site's Starlight `docs` collection plus per-module quiz JSON.
//
// Pipeline: resolve source -> discover allowlist -> transform (frontmatter,
// link rewrite) -> emit quiz JSON (branch A `<details>` + branch B ticks)
// -> assert counts (283 branch-A Q / 15 branch-B Q / 217 diagrams).
//
// Run from the repo root: `node scripts/sync-content.js [--check]`
// `--check` validates everything without writing any files.

import { execFileSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { isAbsolute, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const APP_ROOT = process.cwd();
const DEFAULT_SOURCE_DIR = join(
  APP_ROOT,
  '../AWS-Certified-Solutions-Architect-Associate-SAA-C03',
);
// Marker proving the resolved dir is the study-guide source checkout,
// never this app repo (this repo has no CONTENT-POLICY.md).
const SOURCE_MARKER = 'CONTENT-POLICY.md';

// Spec-locked counts at the pinned SHA (see source-sha.txt).
const EXPECTED_BRANCH_A_QUESTIONS = 283; // modules 01-13, `<details>` variant
const EXPECTED_BRANCH_B_QUESTIONS = 15; // 14-Practice, tick variant
const EXPECTED_DIAGRAMS = 217; // ```mermaid blocks across DIAGRAMS.md

const STANDARD_FILES = [
  'README.md',
  'ULTRA-FAST-LEARN.md',
  'FAST-LEARN.md',
  'PRACTICE-QUESTIONS.md',
  'DIAGRAMS.md',
];
// 14-Practice ships no DIAGRAMS.md; both exception dirs ship extra notes.
const EXTRA_FILES = {
  '11-Analytics': ['AWS-ML-SERVICES-NOTES.md'],
  '14-Practice': [
    'FLASHCARDS.md',
    'STUDY-NOTES.md',
    'SERVICE-QUESTION-MAPPING.md',
    'TEST-RESULTS-TRACKER.md',
  ],
};

const ROUTES = {
  README: 'full',
  'ULTRA-FAST-LEARN': 'ultra-fast',
  'FAST-LEARN': 'fast-learn',
  DIAGRAMS: 'diagrams',
  'PRACTICE-QUESTIONS': 'quiz',
};
const KIND_LABELS = {
  full: 'Full Guide',
  'ultra-fast': 'Ultra-Fast Learn',
  'fast-learn': 'Fast Learn',
  diagrams: 'Diagrams',
  quiz: 'Quiz',
};
// Generated-content route segments derive from ROUTES (single source of
// truth): the quiz shell filename and the diagrams counter below follow a
// rename here with no second place to update.
const QUIZ_ROUTE = ROUTES['PRACTICE-QUESTIONS']; // 'quiz'
const DIAGRAMS_ROUTE = ROUTES.DIAGRAMS; // 'diagrams'

const die = (message) => {
  console.error(`sync-content: ERROR: ${message}`);
  process.exit(1);
};

function resolveSourceDir() {
  const raw = process.env.CONTENT_SOURCE_DIR ?? DEFAULT_SOURCE_DIR;
  if (!isAbsolute(raw)) die(`source path must be absolute, got: ${raw}`);
  const dir = resolve(raw);
  if (resolve(dir) === APP_ROOT) die('source dir must not be the app repo itself');
  if (!existsSync(dir) || !statSync(dir).isDirectory()) {
    die(`source dir not found: ${dir} (set CONTENT_SOURCE_DIR to the pinned checkout)`);
  }
  if (!existsSync(join(dir, SOURCE_MARKER))) {
    die(`source dir lacks ${SOURCE_MARKER}; refusing to sync from ${dir}`);
  }
  return dir;
}

function expectedSha() {
  const fromEnv = (process.env.CONTENT_SOURCE_SHA ?? '').trim();
  const fromFile = existsSync(join(APP_ROOT, 'source-sha.txt'))
    ? readFileSync(join(APP_ROOT, 'source-sha.txt'), 'utf8').trim()
    : '';
  const sha = fromEnv || fromFile;
  if (!/^[0-9a-f]{40}$/i.test(sha)) {
    die('unpinned source: set CONTENT_SOURCE_SHA or source-sha.txt to the 40-char source HEAD');
  }
  return sha.toLowerCase();
}

function assertPinnedSha(sourceDir) {
  const want = expectedSha();
  let have = '';
  try {
    have = execFileSync('git', ['-C', sourceDir, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      // Pipe stderr: a non-git source (tarball) fails this probe on the way
      // to the CONTENT_SOURCE_TARBALL_SHA fallback below, and git's own
      // "fatal: not a git repository" would only pollute build logs.
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim().toLowerCase();
  } catch {
    // No git metadata: the hosted-builder path (scripts/sync-vercel.js)
    // fetches the pinned commit as a tarball, which has no `.git` dir.
    // Accept it only when the fetcher verified the commit itself and passes
    // its SHA via CONTENT_SOURCE_TARBALL_SHA. Anything else still dies.
    const tarballSha = (process.env.CONTENT_SOURCE_TARBALL_SHA ?? '').trim().toLowerCase();
    if (tarballSha === want) {
      console.log(`source verified as tarball @${want.slice(0, 7)} (no git HEAD to compare)`);
      return want;
    }
    if (tarballSha) die(`source SHA mismatch: tarball is ${tarballSha}, pinned to ${want}`);
    die(`cannot read git HEAD of source checkout at ${sourceDir}`);
  }
  if (have !== want) {
    die(`source SHA mismatch: checkout is ${have}, pinned to ${want}`);
  }
  return want;
}

const slugOf = (dir) => dir.toLowerCase();
const orderOf = (dir) => Number.parseInt(dir.slice(0, 2), 10);
const labelOf = (dir) => dir.replace(/^\d+-/, '').replace(/-/g, ' ');
const kebabOf = (name) => name.replace(/\.md$/i, '').toLowerCase();

function discoverModules(sourceDir) {
  return readdirSync(sourceDir)
    .filter((e) => /^\d{2}-/.test(e) && statSync(join(sourceDir, e)).isDirectory())
    .sort()
    .map((dir) => {
      const files = [...STANDARD_FILES, ...(EXTRA_FILES[dir] ?? [])].filter((f) =>
        existsSync(join(sourceDir, dir, f)),
      );
      for (const f of STANDARD_FILES) {
        if (f === 'DIAGRAMS.md' && dir === '14-Practice') continue; // known exception
        if (f === 'PRACTICE-QUESTIONS.md') continue; // parsed to JSON, not copied
        if (!files.includes(f)) die(`allowlisted file missing: ${dir}/${f}`);
      }
      return { dir, files };
    });
}

function titleOf(body, fallback) {
  const m = body.match(/^#\s+(.+)$/m);
  return (m ? m[1] : fallback).replace(/"/g, "'").trim();
}

const normalizeHeading = (s) => s.replace(/"/g, "'").trim().toLowerCase();

// Drop the body's first top-level `# H1` when it only repeats the
// frontmatter title: Starlight already renders `title` as the page H1, so
// keeping both prints the title twice (user-reported, screenshot-proven).
// Anything else — no H1, a differing H1 (e.g. fallback titles) — leaves
// the body untouched.
function stripDuplicateH1(body, title) {
  const m = body.match(/^#\s+(.+?)\s*$/m);
  if (!m) return body;
  if (normalizeHeading(m[1]) !== normalizeHeading(title)) return body;
  const rest = body.slice(m.index + m[0].length);
  return body.slice(0, m.index) + rest.replace(/^\r?\n/, '');
}

// Rewrite `../<Module-Dir>/<FILE>.md(#frag)` to site slugs, e.g.
// `../02-IAM/FAST-LEARN.md` -> `../../02-iam/fast-learn/`.
// Links are page-relative (not root-absolute) so content links resolve
// identically in dev, preview, and production with no base-path coupling.
// TWO levels up: content routes render as `<module>/<page>/` (trailing
// slash adds a URL level), so a single `../` would stay inside the
// current module.
// Plain `Move to: Module NN - Name` lines (no link) become links so the
// Move-to chain survives the move off GitHub.
function rewriteLinks(body, modulesByDir, moduleNumberToSlug) {
  const linked = body.replace(
    /\]\(\.\.\/([A-Za-z0-9-]+)\/([A-Za-z0-9.-]+)\.md(#[^)]*)?\)/g,
    (match, dir, file, frag = '') => {
      const slug = modulesByDir.get(dir);
      const route = ROUTES[file] ?? kebabOf(`${file}.md`);
      if (!slug) return match; // unknown dir: leave untouched, never break
      return `](../../${slug}/${route}/${frag})`;
    },
  );
  return linked.replace(
    /^(-\s*Move to:\s*Module\s+(\d+)\s*-\s*.+)$/gm,
    (line, _full, num) => {
      if (line.includes('](')) return line; // already handled above
      const slug = moduleNumberToSlug.get(num);
      if (!slug) return line;
      return line.replace(/Module\s+(\d+)\s*-\s*(.+)$/, `[$&](../../${slug}/fast-learn/)`);
    },
  );
}

// One frontmatter builder for every generated page (synced docs and quiz
// shells alike) so the `title`/`sidebar` shape Starlight requires can only
// drift in one place.
function frontmatterBlock({ title, order, label }) {
  return `---\ntitle: "${title}"\nsidebar:\n  order: ${order}\n  label: "${label}"\n---\n`;
}

function withFrontmatter(body, fm) {
  const stripped = body.replace(/^---\n[\s\S]*?\n---\n/, '');
  return `${frontmatterBlock(fm)}\n${stripped}`;
}

// --- Quiz parsing (two source variants) ---------------------------------

function splitQuestions(content) {
  const parts = content.split(/^### Question (\d+)\s*$/m);
  const out = [];
  for (let i = 1; i < parts.length; i += 2) {
    out.push({ n: Number.parseInt(parts[i], 10), body: parts[i + 1] ?? '' });
  }
  return out;
}

const optionLines = (body) =>
  [...body.matchAll(/^([A-E])\.\s+(.+)$/gm)].map((m) => ({
    key: m[1],
    text: m[2].replace(/✓/g, '').trim(),
  }));

function stemOf(body) {
  const idx = body.search(/^[A-E]\.\s+/m);
  const head = (idx === -1 ? body : body.slice(0, idx))
    .replace(/^\*\*Options:\*\*\s*/m, '')
    .replace(/^---\s*$/gm, '')
    .trim();
  return head;
}

// Shared question skeleton: id, stem, and cleaned options are identical in
// both source variants. Only the answer/explanation/reference markup truly
// differs, so only that stays in the branch parsers below.
function baseQuestion(module, n, body) {
  return { id: `${module}-q${n}`, stem: stemOf(body), options: optionLines(body) };
}

// Branch A (modules 01-13): answer hidden in `<details>` with
// `**Answer: X**`, `**Explanation:**`, `**References:**` fields.
function parseBranchA(module, content) {
  return splitQuestions(content).map(({ n, body }) => {
    const details = body.slice(body.indexOf('<details>'));
    const answerRaw = details.match(/\*\*Answer:\s*([^*]+)\*\*/)?.[1] ?? '';
    const answer = [...new Set(answerRaw.match(/[A-E]/g) ?? [])];
    const explanation = (details.split('**Explanation:**')[1] ?? '')
      .split('**References:**')[0]
      .split('</details>')[0]
      .trim();
    const refsRaw = (details.split('**References:**')[1] ?? '').split('</details>')[0].trim();
    const references = refsRaw
      .split(/[,;]/)
      .map((r) => r.replace(/^\*\*|\*\*$/g, '').trim())
      .filter(Boolean);
    return { ...baseQuestion(module, n, body), answer, explanation, references };
  });
}

// Branch B (14-Practice): `**Options:**` list with `✓` marking every
// correct option (supports "Choose 2/3"), `**Explanation:**`, no references.
function parseBranchB(module, content) {
  return splitQuestions(content).map(({ n, body }) => {
    const answer = [...body.matchAll(/^([A-E])\.\s+.*✓.*$/gm)].map((m) => m[1]);
    const explanation = (body.split('**Explanation:**')[1] ?? '')
      .split(/^---\s*$/m)[0]
      .split(/^### Question /m)[0]
      .trim();
    return { ...baseQuestion(module, n, body), answer, explanation, references: [] };
  });
}

function validateQuestions(questions, where) {
  const bad = questions.filter(
    (q) =>
      !q.stem ||
      q.options.length < 2 ||
      q.answer.length === 0 ||
      q.answer.some((a) => !q.options.some((o) => o.key === a)),
  );
  if (bad.length > 0) {
    die(`${where}: ${bad.length} unparseable questions, e.g. ${bad[0].id}`);
  }
}

// --- Main ----------------------------------------------------------------

function assertQuizJson() {
  const files = existsSync(join(APP_ROOT, 'src/data/quiz'))
    ? readdirSync(join(APP_ROOT, 'src/data/quiz')).filter((f) => f.endsWith('.json'))
    : [];
  const total = files.reduce(
    (sum, f) =>
      sum + JSON.parse(readFileSync(join(APP_ROOT, 'src/data/quiz', f), 'utf8')).questions.length,
    0,
  );
  const want = EXPECTED_BRANCH_A_QUESTIONS + EXPECTED_BRANCH_B_QUESTIONS;
  if (total !== want) die(`quiz JSON holds ${total} questions, expected ${want}`);
  console.log(`quiz assert ok: ${total} questions across ${files.length} modules`);
}

function collectSiteInputs(sourceDir, modules, modulesByDir, moduleNumberToSlug) {
  const docs = [];
  const quizzes = [];
  for (const { dir, files } of modules) {
    const slug = slugOf(dir);
    const order = orderOf(dir);
    const label = labelOf(dir);
    for (const file of files) {
      const raw = readFileSync(join(sourceDir, dir, file), 'utf8');
      if (file === 'PRACTICE-QUESTIONS.md') {
        const questions =
          dir === '14-Practice' ? parseBranchB(slug, raw) : parseBranchA(slug, raw);
        validateQuestions(questions, `${dir}/${file}`);
        quizzes.push({ module: slug, file: `src/data/quiz/${slug}.json`, questions });
        continue;
      }
      const base = file.replace(/\.md$/i, '');
      const route = ROUTES[base] ?? kebabOf(file);
      const kindLabel = KIND_LABELS[route] ?? labelOf(base);
      const title = titleOf(raw, `${label} — ${kindLabel}`);
      const body = stripDuplicateH1(
        rewriteLinks(raw, modulesByDir, moduleNumberToSlug),
        title,
      );
      docs.push({
        file: `src/content/docs/${slug}/${route}.md`,
        content: withFrontmatter(body, { title, order, label: `${label} — ${kindLabel}` }),
      });
    }
  }

  // PR3: one quiz route shell per module. The shell is generated (gitignored)
  // so the sidebar picks up `quiz/` routes; QuizIsland renders the synced
  // JSON at build time. Shells carry no counts and never affect asserts.
  const metaBySlug = new Map(
    modules.map((m) => [slugOf(m.dir), { order: orderOf(m.dir), label: labelOf(m.dir) }]),
  );
  for (const q of quizzes) {
    const meta = metaBySlug.get(q.module);
    const quizTitle = `${meta.label} — Quiz`;
    docs.push({
      file: `src/content/docs/${q.module}/${QUIZ_ROUTE}.mdx`,
      content:
        `${frontmatterBlock({ title: quizTitle, order: meta.order, label: quizTitle })}\n` +
        `import QuizIsland from '../../../components/QuizIsland.astro';\n\n<QuizIsland module="${q.module}" />\n`,
    });
  }
  return { docs, quizzes };
}

function assertSiteInputs(docs, quizzes) {
  const branchA = quizzes
    .filter((q) => q.module !== '14-practice')
    .reduce((s, q) => s + q.questions.length, 0);
  const branchB = quizzes
    .filter((q) => q.module === '14-practice')
    .reduce((s, q) => s + q.questions.length, 0);
  const diagrams = docs
    .filter((d) => d.file.endsWith(`/${DIAGRAMS_ROUTE}.md`))
    .reduce((s, d) => s + (d.content.match(/^```mermaid/gm) ?? []).length, 0);
  const missingTitle = docs.filter((d) => !/^---\ntitle: ".+"/m.test(d.content));

  const failures = [];
  if (branchA !== EXPECTED_BRANCH_A_QUESTIONS) {
    failures.push(`branch-A questions: ${branchA}, expected ${EXPECTED_BRANCH_A_QUESTIONS}`);
  }
  if (branchB !== EXPECTED_BRANCH_B_QUESTIONS) {
    failures.push(`branch-B questions: ${branchB}, expected ${EXPECTED_BRANCH_B_QUESTIONS}`);
  }
  if (diagrams !== EXPECTED_DIAGRAMS) {
    failures.push(`mermaid diagrams: ${diagrams}, expected ${EXPECTED_DIAGRAMS}`);
  }
  if (missingTitle.length > 0) {
    failures.push(`${missingTitle.length} docs without title frontmatter`);
  }
  if (failures.length > 0) die(`assert failed:\n- ${failures.join('\n- ')}`);
  return { branchA, branchB, diagrams };
}

function writeOutputs(docs, quizzes) {
  for (const d of docs) {
    mkdirSync(join(APP_ROOT, d.file.split('/').slice(0, -1).join('/')), { recursive: true });
    writeFileSync(join(APP_ROOT, d.file), d.content);
  }
  mkdirSync(join(APP_ROOT, 'src/data/quiz'), { recursive: true });
  for (const q of quizzes) {
    writeFileSync(
      join(APP_ROOT, q.file),
      `${JSON.stringify({ module: q.module, questions: q.questions }, null, 2)}\n`,
    );
  }
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const assertQuizOnly = process.argv.includes('--assert-quiz');

  if (assertQuizOnly) {
    assertQuizJson();
    return;
  }

  const sourceDir = resolveSourceDir();
  const sha = assertPinnedSha(sourceDir);
  const modules = discoverModules(sourceDir);
  const modulesByDir = new Map(modules.map((m) => [m.dir, slugOf(m.dir)]));
  const moduleNumberToSlug = new Map(modules.map((m) => [m.dir.slice(0, 2), slugOf(m.dir)]));

  const { docs, quizzes } = collectSiteInputs(sourceDir, modules, modulesByDir, moduleNumberToSlug);
  const { branchA, branchB, diagrams } = assertSiteInputs(docs, quizzes);

  if (checkOnly) {
    console.log(
      `check ok @${sha.slice(0, 7)}: ${docs.length} docs, ` +
        `${branchA} branch-A + ${branchB} branch-B questions, ${diagrams} diagrams`,
    );
    return;
  }

  writeOutputs(docs, quizzes);
  console.log(
    `synced @${sha.slice(0, 7)}: ${docs.length} docs, ` +
      `${branchA} branch-A + ${branchB} branch-B questions, ${diagrams} diagrams`,
  );
}

// Import-safe entry: spawning the script runs the sync, importing it
// exposes the pure transform helpers for the guard tests below.
const invokedAsScript =
  process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedAsScript) main();

export { normalizeHeading, stripDuplicateH1, titleOf };
