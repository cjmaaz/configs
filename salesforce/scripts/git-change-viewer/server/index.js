import express from 'express';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { REPO_ROOT } from './repo.js';
import { listDir } from './fsbrowse.js';
import { extractHashesFromFile } from './hashes.js';
import { getLog, getCommitFiles, getCommitMeta, buildDiff } from './git.js';
import { buildManifests } from './packagexml.js';

// Build the Express app without listening. Exported so tests can mount it on an
// ephemeral port. `npm start` / `npm run dev:server` call startServer() below.
export function createApp() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // -------------------------------------------------------------------------
  // API: filesystem browse (left pane)
  // -------------------------------------------------------------------------
  app.get('/api/fs', async (req, res) => {
    const hasPath = req.query.path !== undefined && req.query.path !== null;
    const rel = hasPath ? String(req.query.path) : 'changes';
    try {
      res.json(await listDir(rel));
    } catch (e) {
      // When no explicit path was requested and the default changes/ dir is
      // missing, fall back to the repository root.
      if (!hasPath) {
        try {
          return res.json(await listDir(''));
        } catch (e2) {
          return res.status(400).json({ error: e2.message });
        }
      }
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/health', (req, res) => res.json({ ok: true, repoRoot: REPO_ROOT }));

  // -------------------------------------------------------------------------
  // API: extract + validate commit hashes referenced inside a changes/*.md file
  // -------------------------------------------------------------------------
  app.get('/api/file/hashes', async (req, res) => {
    const rel = req.query.path;
    if (!rel) return res.status(400).json({ error: 'path query param required' });
    try {
      const hashes = await extractHashesFromFile(String(rel));
      res.json({ path: String(rel), hashes });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // -------------------------------------------------------------------------
  // API: git history (right pane)
  // -------------------------------------------------------------------------
  app.get('/api/git/log', async (req, res) => {
    try {
      const skip = Number(req.query.skip) || 0;
      const limit = Math.min(Number(req.query.limit) || 50, 200);
      const q = req.query.q ? String(req.query.q) : '';
      const since = req.query.since ? String(req.query.since) : '';
      const until = req.query.until ? String(req.query.until) : '';
      const commits = await getLog({ skip, limit, q, since, until });
      res.json({ skip, limit, q, since, until, commits, hasMore: commits.length === limit });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.get('/api/git/commit/:hash/files', async (req, res) => {
    try {
      const meta = await getCommitMeta(req.params.hash);
      const files = await getCommitFiles(req.params.hash);
      res.json({ ...meta, files });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // -------------------------------------------------------------------------
  // API: combined diff for a working set of {hash, files?} selections
  // -------------------------------------------------------------------------
  app.post('/api/diff', async (req, res) => {
    try {
      const selections = Array.isArray(req.body) ? req.body : req.body?.selections || [];
      if (!Array.isArray(selections) || selections.length === 0) {
        return res.status(400).json({ error: 'No selections provided' });
      }
      const commits = await buildDiff(selections);
      res.json({ commits });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // -------------------------------------------------------------------------
  // API: build package.xml (+ optional destructiveChanges.xml) from a file set
  // body: { files: [{path, status}], emitDestructive: bool }
  // -------------------------------------------------------------------------
  app.post('/api/packagexml', async (req, res) => {
    try {
      const files = Array.isArray(req.body?.files) ? req.body.files : [];
      const emitDestructive = !!req.body?.emitDestructive;
      const excluded = Array.isArray(req.body?.excluded) ? req.body.excluded : [];
      if (files.length === 0) return res.status(400).json({ error: 'No files provided' });
      res.json(buildManifests(files, { emitDestructive, excluded }));
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  // === ADDITIONAL API ROUTES REGISTERED ABOVE THIS LINE ===

  // -------------------------------------------------------------------------
  // Static serving of the built frontend (production: `npm run build` + `npm start`).
  // In dev, Vite serves the UI on :5173 and proxies /api here.
  // -------------------------------------------------------------------------
  const distDir = path.resolve(import.meta.dirname, '..', 'dist');
  if (existsSync(distDir)) {
    app.use(express.static(distDir));
    // SPA fallback. Express 5 / path-to-regexp v8 rejects a bare '*' route,
    // so use a terminal middleware instead of app.get('*').
    app.use((req, res, next) => {
      if (req.method === 'GET' && !req.path.startsWith('/api/')) {
        return res.sendFile(path.join(distDir, 'index.html'));
      }
      next();
    });
  }

  return app;
}

export function startServer(port = Number(process.env.PORT) || 3001) {
  const app = createApp();
  return app.listen(port, () => {
    console.log(`[git-change-viewer] API listening on http://localhost:${port}`);
    console.log(`[git-change-viewer] repo root: ${REPO_ROOT}`);
  });
}

// Auto-start only when executed directly (node server/index.js), not on import.
const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  startServer();
}
