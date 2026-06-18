import { git } from './repo.js';
import { deriveTags, tagForPath } from './tags.js';

const FS = '\x1f'; // field separator inside a formatted line
const RS = '\x1e'; // record separator between commits in a multi-commit log
const PRETTY = `%H${FS}%h${FS}%an${FS}%aI${FS}%s`;

// Guard against argument injection: a hash must be plain hex. Paths are always
// passed after `--` so git treats them as pathspecs, never options.
function assertHash(h) {
  const s = String(h);
  if (!/^[0-9a-f]{4,40}$/i.test(s)) {
    throw new Error(`Invalid commit hash: ${s}`);
  }
  return s;
}

function parseCommitLine(line) {
  const [hash, shortHash, author, date, subject] = line.split(FS);
  return { hash, shortHash, author, date, subject };
}

// Parse `git ... --name-status` output into [{status, path}] entries.
// Rename/copy lines look like `R100\told\tnew` — keep the destination path.
function parseNameStatus(out) {
  const files = [];
  for (const raw of out.split('\n')) {
    const line = raw.replace(/\r$/, '');
    if (!line.trim()) continue;
    const parts = line.split('\t');
    if (parts.length < 2) continue;
    const status = parts[0][0]; // A | M | D | R | C | T
    const path = parts[parts.length - 1];
    if (!path) continue;
    files.push({ status, path });
  }
  return files;
}

// Recent commits, newest first, with optional message search + pagination.
// One `git log --name-only` call returns metadata + changed files per commit so
// we can derive tags without N extra git calls. Only tags + a file count are
// returned (not the raw file list) to keep the payload small for big commits.
export async function getLog({ skip = 0, limit = 50, q = '', since = '', until = '' } = {}) {
  const args = [
    'log',
    `--skip=${Math.max(0, skip)}`,
    `--max-count=${Math.max(1, limit)}`,
    '--no-color',
    '--name-only',
    `--format=${RS}${PRETTY}`,
  ];
  const query = String(q || '').trim();
  if (query) {
    // Case-insensitive search of the commit message (subject + body).
    args.push('-i', `--grep=${query}`);
  }
  // Date range. Validate to YYYY-MM-DD so the value can't be an injected flag.
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (DATE_RE.test(String(since))) args.push(`--since=${since} 00:00:00`);
  if (DATE_RE.test(String(until))) args.push(`--until=${until} 23:59:59`);
  const out = await git.raw(args);
  const commits = [];
  for (const chunk of out.split(RS)) {
    if (!chunk.trim()) continue;
    const lines = chunk.split('\n');
    const meta = parseCommitLine(lines[0]);
    if (!meta.hash) continue;
    const files = [];
    for (let i = 1; i < lines.length; i++) {
      const f = lines[i].trim();
      if (f) files.push(f);
    }
    commits.push({ ...meta, tags: deriveTags(files), fileCount: files.length });
  }
  return commits;
}

// Metadata for a single commit (also validates the hash resolves to a commit).
export async function getCommitMeta(hash) {
  const h = assertHash(hash);
  const out = await git.raw(['show', '-s', `--format=${PRETTY}`, `${h}^{commit}`]);
  return parseCommitLine(out.trim().split('\n')[0] || '');
}

// File list (with status) changed by a commit. Root commits show every file as
// added; merge commits show nothing (combined diff suppressed) — acceptable.
export async function getCommitFiles(hash) {
  const h = assertHash(hash);
  const out = await git.raw(['show', '--no-color', '--name-status', '--format=', h]);
  return parseNameStatus(out).map((f) => ({ ...f, tag: tagForPath(f.path) }));
}

const MAX_DIFF_BYTES = 2_000_000; // guard the browser against a giant single diff

// Build per-commit unified diffs for a working set. Each selection is
// { hash, files? } — omit/empty files to diff the whole commit.
export async function buildDiff(selections = []) {
  const commits = [];
  for (const sel of selections) {
    const h = assertHash(sel.hash);
    const meta = await getCommitMeta(h);
    const allFiles = await getCommitFiles(h);

    const selected = Array.isArray(sel.files) && sel.files.length ? sel.files : null;
    const pathspec = selected ? ['--', ...selected] : [];

    let unifiedDiff = '';
    try {
      unifiedDiff = await git.raw(['show', '--no-color', '--format=', h, ...pathspec]);
    } catch {
      unifiedDiff = '';
    }

    let truncated = false;
    if (unifiedDiff.length > MAX_DIFF_BYTES) {
      unifiedDiff = unifiedDiff.slice(0, MAX_DIFF_BYTES);
      truncated = true;
    }

    const files = (selected ? allFiles.filter((f) => selected.includes(f.path)) : allFiles).map((f) => ({
      ...f,
      tag: tagForPath(f.path),
    }));

    commits.push({ ...meta, files, unifiedDiff, truncated, tags: deriveTags(files.map((f) => f.path)) });
  }
  return commits;
}
