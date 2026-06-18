import { promises as fs } from 'node:fs';
import path from 'node:path';
import { resolveSafe, toRepoRel } from './repo.js';

// Directories that are never useful to browse in this tool.
const IGNORED = new Set(['.git', 'node_modules', '.DS_Store']);

// List a single directory (non-recursive). Directories first, then files,
// each sorted alphabetically. Markdown files are flagged for the UI.
export async function listDir(relPath = 'changes') {
  const absDir = resolveSafe(relPath);
  const stat = await fs.stat(absDir);
  if (!stat.isDirectory()) {
    throw new Error(`Not a directory: ${relPath}`);
  }

  const dirents = await fs.readdir(absDir, { withFileTypes: true });
  const dirs = [];
  const files = [];

  for (const d of dirents) {
    if (IGNORED.has(d.name)) continue;
    const abs = path.join(absDir, d.name);
    const rel = toRepoRel(abs);
    if (d.isDirectory()) {
      dirs.push({ name: d.name, path: rel, type: 'dir' });
    } else if (d.isFile()) {
      files.push({
        name: d.name,
        path: rel,
        type: 'file',
        isMarkdown: d.name.toLowerCase().endsWith('.md'),
      });
    }
  }

  dirs.sort((a, b) => a.name.localeCompare(b.name));
  files.sort((a, b) => a.name.localeCompare(b.name));

  const here = toRepoRel(absDir); // '' at repo root
  const parent = here === '' ? null : toRepoRel(path.dirname(absDir));

  return { path: here, parent, entries: [...dirs, ...files] };
}
