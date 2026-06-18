import { readFile } from 'node:fs/promises';
import { resolveSafe, git } from './repo.js';
import { deriveTags } from './tags.js';

// changes/*.md files always wrap commit hashes in backticks, e.g. `006ce5895`,
// often inside markdown links like [`006ce5895`](#...). Match 7-40 hex chars
// inside backticks. Deploy IDs / org IDs contain uppercase + non-hex chars and
// therefore never match, which keeps false positives low; git validation then
// filters whatever slips through.
const HASH_RE = /`([0-9a-f]{7,40})`/gi;

const FIELD_SEP = '\x1f'; // unit separator — safe inside %s subjects

// Read a markdown file, pull out candidate commit hashes (deduped in document
// order), validate each against git, and return rich metadata for the valid
// ones. Different short forms that resolve to the same commit collapse to one.
export async function extractHashesFromFile(relPath) {
  const abs = resolveSafe(relPath);
  const content = await readFile(abs, 'utf8');

  const seenToken = new Set();
  const tokens = [];
  let m;
  while ((m = HASH_RE.exec(content)) !== null) {
    const tok = m[1].toLowerCase();
    if (!seenToken.has(tok)) {
      seenToken.add(tok);
      tokens.push(tok);
    }
  }

  const results = [];
  const seenFull = new Set();
  for (const tok of tokens) {
    try {
      // Peeling with ^{commit} both validates the object is a commit and
      // resolves the short form to a full hash + metadata; --name-only also
      // yields the changed files so we can derive tags in the same call.
      const out = await git.raw([
        'show',
        '--no-color',
        '--name-only',
        `--format=%H${FIELD_SEP}%h${FIELD_SEP}%an${FIELD_SEP}%aI${FIELD_SEP}%s`,
        `${tok}^{commit}`,
      ]);
      const lines = out.split('\n');
      const [hash, shortHash, author, date, subject] = (lines[0] || '').split(FIELD_SEP);
      if (!hash || seenFull.has(hash)) continue;
      seenFull.add(hash);
      const files = lines.slice(1).map((l) => l.trim()).filter(Boolean);
      results.push({ token: tok, hash, shortHash, author, date, subject, tags: deriveTags(files) });
    } catch {
      // Not a resolvable/unambiguous commit — skip it.
    }
  }

  return results;
}
