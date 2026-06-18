// Thin fetch wrapper around the Express API. All calls go through Vite's /api
// proxy in dev, or are same-origin in production.
async function request(url, opts) {
  const res = await fetch(url, opts);
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error || `HTTP ${res.status} for ${url}`);
  }
  return body;
}

export const api = {
  fs(path) {
    const q = path != null ? `?path=${encodeURIComponent(path)}` : '';
    return request(`/api/fs${q}`);
  },
  fileHashes(path) {
    return request(`/api/file/hashes?path=${encodeURIComponent(path)}`);
  },
  log({ skip = 0, limit = 50, q = '', since = '', until = '' } = {}) {
    const params = new URLSearchParams({ skip: String(skip), limit: String(limit), q });
    if (since) params.set('since', since);
    if (until) params.set('until', until);
    return request(`/api/git/log?${params.toString()}`);
  },
  commitFiles(hash) {
    return request(`/api/git/commit/${hash}/files`);
  },
  diff(selections) {
    return request('/api/diff', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ selections }),
    });
  },
  packagexml(files, emitDestructive, excluded = []) {
    return request('/api/packagexml', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ files, emitDestructive, excluded }),
    });
  },
};
