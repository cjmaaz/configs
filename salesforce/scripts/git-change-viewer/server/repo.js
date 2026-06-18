import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { simpleGit } from 'simple-git';

// Resolve the git repository root once at startup by asking git itself.
function resolveRepoRoot() {
  const start = path.resolve(import.meta.dirname, '..'); // scripts/git-change-viewer
  try {
    return execFileSync('git', ['rev-parse', '--show-toplevel'], {
      cwd: start,
      encoding: 'utf8',
    }).trim();
  } catch {
    // Fallback: scripts/git-change-viewer -> scripts -> repo root
    return path.resolve(start, '..', '..');
  }
}

export const REPO_ROOT = resolveRepoRoot();

// Shared simple-git instance bound to the repo root. simple-git uses spawn
// (streaming), so large diff/log output is not subject to exec's maxBuffer.
export const git = simpleGit({ baseDir: REPO_ROOT, maxConcurrentProcesses: 6 });

// Resolve a caller-supplied relative path against REPO_ROOT and guarantee it
// cannot escape the repository (no `..` traversal, no absolute paths).
export function resolveSafe(relPath = '') {
  const clean = String(relPath).replace(/^[\\/]+/, ''); // drop leading slashes
  const abs = path.resolve(REPO_ROOT, clean);
  const rel = path.relative(REPO_ROOT, abs);
  if (rel === '..' || rel.startsWith(`..${path.sep}`) || path.isAbsolute(rel)) {
    throw new Error('Path escapes repository root');
  }
  return abs;
}

// Convert an absolute path back to a repo-relative POSIX path ('' = repo root).
export function toRepoRel(abs) {
  return path.relative(REPO_ROOT, abs).split(path.sep).join('/');
}
