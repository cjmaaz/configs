import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useSelections, isFileSelectedInCommit } from '../store.jsx';
import TagList from './TagList.jsx';
import TagFilter, { uniqueTags, tagMatches } from './TagFilter.jsx';
import PathLabel from './PathLabel.jsx';

const LIMIT = 50;

export default function GitHistoryPane({ style, isExpanded, onToggleExpand }) {
  const { selections, addGit, removeGit, setFiles, clearGit } = useSelections();
  const [commits, setCommits] = useState([]);
  const [skip, setSkip] = useState(0);
  const [qInput, setQInput] = useState(''); // typed search box
  const [q, setQ] = useState(''); // applied search (server)
  const [since, setSince] = useState(''); // applied date range (server)
  const [until, setUntil] = useState('');
  const [tagFilter, setTagFilter] = useState(() => new Set()); // client-side
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [filesByCommit, setFilesByCommit] = useState({});
  const [tagFilterByHash, setTagFilterByHash] = useState({}); // hash -> Set of hidden tag labels

  const toggleHashTag = useCallback((hash, label) => {
    setTagFilterByHash((prev) => {
      const cur = new Set(prev[hash] || []);
      if (cur.has(label)) cur.delete(label);
      else cur.add(label);
      return { ...prev, [hash]: cur };
    });
  }, []);

  const toggleAllHashTags = useCallback((hash, tags) => {
    setTagFilterByHash((prev) => {
      const cur = prev[hash] || new Set();
      const labels = (tags || []).map((t) => t.label);
      const allSelected = labels.every((l) => !cur.has(l));
      return { ...prev, [hash]: allSelected ? new Set(labels) : new Set() };
    });
  }, []);

  // Reload page 0 whenever an applied server filter (search / dates) changes.
  const loadFirst = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.log({ skip: 0, limit: LIMIT, q, since, until });
      setCommits(res.commits);
      setSkip(0);
      setHasMore(res.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [q, since, until]);

  useEffect(() => {
    loadFirst();
  }, [loadFirst]);

  const loadMore = useCallback(async () => {
    setLoadingMore(true);
    try {
      const nextSkip = skip + LIMIT;
      const res = await api.log({ skip: nextSkip, limit: LIMIT, q, since, until });
      setCommits((prev) => [...prev, ...res.commits]);
      setSkip(nextSkip);
      setHasMore(res.hasMore);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingMore(false);
    }
  }, [skip, q, since, until]);

  const onSearch = useCallback(
    (e) => {
      e.preventDefault();
      setQ(qInput);
    },
    [qInput],
  );

  const goHome = useCallback(() => {
    setQInput('');
    setQ('');
    setSince('');
    setUntil('');
    setTagFilter(new Set());
    setExpanded(new Set());
  }, []);

  const ensureFiles = useCallback(
    async (hash) => {
      if (filesByCommit[hash]?.files) return filesByCommit[hash].files;
      setFilesByCommit((prev) => ({ ...prev, [hash]: { loading: true, files: [] } }));
      try {
        const res = await api.commitFiles(hash);
        const files = res.files || [];
        setFilesByCommit((prev) => ({ ...prev, [hash]: { loading: false, files } }));
        return files;
      } catch (e) {
        setFilesByCommit((prev) => ({ ...prev, [hash]: { loading: false, files: [], error: e.message } }));
        return [];
      }
    },
    [filesByCommit],
  );

  const toggleExpand = useCallback(
    async (commit) => {
      setExpanded((prev) => {
        const n = new Set(prev);
        if (n.has(commit.hash)) n.delete(commit.hash);
        else n.add(commit.hash);
        return n;
      });
      await ensureFiles(commit.hash);
    },
    [ensureFiles],
  );

  // Selecting a commit honors its per-hash tag filter: when some tags are
  // deselected, only files whose tag is still shown get selected (not the whole commit).
  const selectCommit = useCallback(
    async (commit) => {
      const deselected = tagFilterByHash[commit.hash];
      if (!deselected || deselected.size === 0) {
        addGit(commit);
        return;
      }
      const files = await ensureFiles(commit.hash);
      if (!files.length) {
        addGit(commit);
        return;
      }
      const visible = files.filter((f) => !deselected.has(f.tag?.label)).map((f) => f.path);
      if (!visible.length) {
        removeGit(commit.hash);
        return;
      }
      setFiles(commit, visible.length === files.length ? 'ALL' : visible, true);
    },
    [tagFilterByHash, ensureFiles, addGit, removeGit, setFiles],
  );

  const toggleFile = useCallback(
    (commit, path, allPaths) => {
      const e = selections[commit.hash];
      let current;
      if (!e) current = new Set();
      else if (e.files === 'ALL') current = new Set(allPaths);
      else current = new Set(e.files);
      if (current.has(path)) current.delete(path);
      else current.add(path);
      if (current.size === 0) {
        removeGit(commit.hash);
        return;
      }
      const files = current.size === allPaths.length ? 'ALL' : [...current];
      setFiles(commit, files, true);
    },
    [selections, removeGit, setFiles],
  );

  const availableTags = useMemo(() => uniqueTags(commits.map((c) => c.tags)), [commits]);
  const visibleCommits = tagFilter.size ? commits.filter((c) => tagMatches(c.tags, tagFilter)) : commits;

  return (
    <section className="pane" aria-label="Git history" style={style}>
      <div className="pane-header">
        <div className="pane-title">
          Git History <span className="src-tag git">FROM GIT</span>
          <span className="spacer" />
          <button
            className="pane-expand"
            onClick={onToggleExpand}
            title={isExpanded ? 'Restore split' : 'Expand pane'}
            aria-label={isExpanded ? 'Restore split' : 'Expand pane'}
          >
            {isExpanded ? '⇥' : '⇤'}
          </button>
        </div>
        <form className="pane-toolbar" onSubmit={onSearch}>
          <button type="button" className="btn btn-sm" onClick={goHome} title="Reset to latest commits">⌂ Home</button>
          <input
            className="search-input"
            placeholder="Search commit messages…"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
          />
          <button type="submit" className="btn btn-sm">Search</button>
          <TagFilter available={availableTags} selected={tagFilter} onChange={setTagFilter} />
          <span className="spacer" />
          <button type="button" className="btn btn-sm btn-danger" onClick={clearGit}>Clear</button>
        </form>
        <div className="pane-subtoolbar">
          <span>Dates:</span>
          <input
            type="date"
            className="date-input"
            value={since}
            max={until || undefined}
            onChange={(e) => setSince(e.target.value)}
            aria-label="From date"
          />
          <span>&rarr;</span>
          <input
            type="date"
            className="date-input"
            value={until}
            min={since || undefined}
            onChange={(e) => setUntil(e.target.value)}
            aria-label="Till date"
          />
          {(since || until) && (
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => {
                setSince('');
                setUntil('');
              }}
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      <div className="pane-body">
        {loading && <div className="loading">Loading commits…</div>}
        {error && <div className="hash-error">{error}</div>}
        {!loading && commits.length === 0 && <div className="empty">No commits found.</div>}
        {!loading && commits.length > 0 && visibleCommits.length === 0 && (
          <div className="empty">No commits match the tag filter.</div>
        )}

        {!loading &&
          visibleCommits.map((commit) => {
            const e = selections[commit.hash];
            const whole = !!e && e.fromGit && e.files === 'ALL';
            const partial = !!e && e.fromGit && e.files !== 'ALL';
            const info = filesByCommit[commit.hash];
            const isExpanded = expanded.has(commit.hash);
            return (
              <div className="commit" key={commit.hash}>
                <div className="commit-row">
                  <input
                    type="checkbox"
                    checked={whole}
                    ref={(el) => el && (el.indeterminate = partial)}
                    onChange={() => (whole || partial ? removeGit(commit.hash) : selectCommit(commit))}
                    aria-label={`Select commit ${commit.shortHash}`}
                  />
                  <button
                    className="expander"
                    onClick={() => toggleExpand(commit)}
                    aria-label={isExpanded ? 'Collapse files' : 'Expand files'}
                  >
                    {isExpanded ? '▼' : '▶'}
                  </button>
                  <div className="commit-main">
                    <span className="commit-subject" title={commit.subject}>{commit.subject}</span>
                    <span className="commit-sub">
                      <span className="sha">{commit.shortHash}</span> · {commit.author}
                      {commit.date ? ` · ${new Date(commit.date).toLocaleDateString()}` : ''}
                      {commit.fileCount != null ? ` · ${commit.fileCount} file${commit.fileCount === 1 ? '' : 's'}` : ''}
                    </span>
                    {commit.tags?.length > 0 && (
                      <TagList
                        tags={commit.tags}
                        interactive
                        deselected={tagFilterByHash[commit.hash]}
                        onToggle={(label) => toggleHashTag(commit.hash, label)}
                        onToggleAll={() => toggleAllHashTags(commit.hash, commit.tags)}
                      />
                    )}
                  </div>
                  <span className="badges">
                    {e?.fromGit && <span className="badge git">GIT</span>}
                    {e?.fromFiles?.length > 0 && <span className="badge file">FILE</span>}
                  </span>
                </div>

                {isExpanded && (
                  <div className="commit-files">
                    {info?.loading && <div className="muted-note">Loading files…</div>}
                    {info?.error && <div className="hash-error">{info.error}</div>}
                    {info && !info.loading && info.files.length === 0 && (
                      <div className="muted-note">No file changes (merge commit?).</div>
                    )}
                    {(info?.files || [])
                      .filter((f) => !tagFilterByHash[commit.hash]?.has(f.tag?.label))
                      .map((f) => {
                      const allPaths = info.files.map((x) => x.path);
                      const fileChecked = isFileSelectedInCommit(e, f.path);
                      return (
                        <label className="file-row" key={f.path}>
                          <input
                            type="checkbox"
                            checked={fileChecked}
                            onChange={() => toggleFile(commit, f.path, allPaths)}
                          />
                          <span className={`status-chip status-${f.status}`}>{f.status}</span>
                          <PathLabel path={f.path} />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

        {!loading && hasMore && (
          <div style={{ padding: '8px 12px' }}>
            <button className="btn btn-sm" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
