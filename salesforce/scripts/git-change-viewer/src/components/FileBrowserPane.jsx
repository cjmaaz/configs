import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { useSelections, isFileSelectedInCommit } from '../store.jsx';
import TagList from './TagList.jsx';
import TagFilter, { uniqueTags, tagMatches } from './TagFilter.jsx';
import PathLabel from './PathLabel.jsx';

function basename(p) {
  const parts = String(p).split('/');
  return parts[parts.length - 1] || p;
}

function Breadcrumb({ path, onNavigate }) {
  const segs = path ? path.split('/') : [];
  return (
    <div className="breadcrumb">
      <span className="crumb" onClick={() => onNavigate('')}>repo root</span>
      {segs.map((seg, i) => {
        const target = segs.slice(0, i + 1).join('/');
        return (
          <span key={target}>
            {' / '}
            <span className="crumb" onClick={() => onNavigate(target)}>{seg}</span>
          </span>
        );
      })}
    </div>
  );
}

export default function FileBrowserPane({ style, isExpanded, onToggleExpand }) {
  const { selections, addFile, removeFileSrc, setFilesFromFile, clearFiles } = useSelections();
  const [listing, setListing] = useState({ path: '', parent: null, entries: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [checked, setChecked] = useState(() => new Set()); // file paths checked
  const [hashesByFile, setHashesByFile] = useState({}); // path -> {loading, hashes, error}
  const [shake, setShake] = useState(() => new Set());

  const load = useCallback(async (path) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fs(path);
      setListing(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(undefined); // server defaults to changes/ (falls back to repo root)
  }, [load]);

  const checkFile = useCallback(
    async (file) => {
      setChecked((prev) => new Set(prev).add(file.path));
      setHashesByFile((prev) => ({ ...prev, [file.path]: { loading: true, hashes: [] } }));
      try {
        const res = await api.fileHashes(file.path);
        const hashes = res.hashes || [];
        setHashesByFile((prev) => ({ ...prev, [file.path]: { loading: false, hashes } }));
        if (hashes.length === 0) {
          setShake((prev) => new Set(prev).add(file.path));
        } else {
          // Auto-select all hashes only on the first check. If this file already
          // contributes selections, preserve them (don't re-add removed hashes).
          const already = hashes.some((h) => selections[h.hash]?.fromFiles?.includes(file.path));
          if (!already) for (const h of hashes) addFile(h, file.path);
        }
      } catch (e) {
        setHashesByFile((prev) => ({ ...prev, [file.path]: { loading: false, hashes: [], error: e.message } }));
      }
    },
    [addFile, selections],
  );

  const uncheckFile = useCallback(
    (file) => {
      setChecked((prev) => {
        const n = new Set(prev);
        n.delete(file.path);
        return n;
      });
      const entry = hashesByFile[file.path];
      if (entry?.hashes) for (const h of entry.hashes) removeFileSrc(h.hash, file.path);
      setHashesByFile((prev) => {
        const n = { ...prev };
        delete n[file.path];
        return n;
      });
      setShake((prev) => {
        const n = new Set(prev);
        n.delete(file.path);
        return n;
      });
    },
    [hashesByFile, removeFileSrc],
  );

  const toggleFile = useCallback(
    (file) => {
      if (checked.has(file.path)) uncheckFile(file);
      else checkFile(file);
    },
    [checked, checkFile, uncheckFile],
  );

  const selectAllInDir = useCallback(() => {
    for (const e of listing.entries) {
      if (e.type === 'file' && !checked.has(e.path)) checkFile(e);
    }
  }, [listing.entries, checked, checkFile]);

  const clearAllLeft = useCallback(() => {
    clearFiles();
    setChecked(new Set());
    setHashesByFile({});
    setShake(new Set());
  }, [clearFiles]);

  const fileEntries = listing.entries.filter((e) => e.type === 'file');

  return (
    <section className="pane" aria-label="File browser" style={style}>
      <div className="pane-header">
        <div className="pane-title">
          Files <span className="src-tag file">FROM FILE</span>
          <span className="spacer" />
          <button
            className="pane-expand"
            onClick={onToggleExpand}
            title={isExpanded ? 'Restore split' : 'Expand pane'}
            aria-label={isExpanded ? 'Restore split' : 'Expand pane'}
          >
            {isExpanded ? '⇤' : '⇥'}
          </button>
        </div>
        <Breadcrumb path={listing.path} onNavigate={load} />
        <div className="pane-toolbar">
          <button className="btn btn-sm" onClick={() => load('')} title="Go to repository root">⌂ Home</button>
          <button className="btn btn-sm" onClick={selectAllInDir} disabled={!fileEntries.length}>
            Select all files
          </button>
          <span className="spacer" />
          <button className="btn btn-sm btn-danger" onClick={clearAllLeft}>Clear</button>
        </div>
      </div>

      <div className="pane-body">
        {loading && <div className="loading">Loading…</div>}
        {error && <div className="hash-error">{error}</div>}
        {!loading && !error && listing.entries.length === 0 && <div className="empty">Empty directory.</div>}

        {!loading &&
          listing.entries.map((entry) =>
            entry.type === 'dir' ? (
              <div className="row dir" key={entry.path}>
                <span className="icon">📁</span>
                <span className="name clickable" onClick={() => load(entry.path)} title={entry.path}>
                  {entry.name}
                </span>
              </div>
            ) : (
              <FileEntry
                key={entry.path}
                entry={entry}
                checked={checked.has(entry.path)}
                shaking={shake.has(entry.path)}
                hashInfo={hashesByFile[entry.path]}
                onToggle={() => toggleFile(entry)}
                onShakeEnd={() =>
                  setShake((prev) => {
                    const n = new Set(prev);
                    n.delete(entry.path);
                    return n;
                  })
                }
                selections={selections}
                removeFileSrc={removeFileSrc}
                setFilesFromFile={setFilesFromFile}
              />
            ),
          )}
      </div>
    </section>
  );
}

function FileEntry({ entry, checked, shaking, hashInfo, onToggle, onShakeEnd, selections, removeFileSrc, setFilesFromFile }) {
  const noHash = hashInfo && !hashInfo.loading && !hashInfo.error && hashInfo.hashes.length === 0;
  const hashes = hashInfo?.hashes || [];
  const [collapsed, setCollapsed] = useState(false);
  const [filter, setFilter] = useState(() => new Set());
  const [expanded, setExpanded] = useState(() => new Set()); // hash -> file picker open
  const [filesByHash, setFilesByHash] = useState({}); // hash -> {loading, files, error}
  const [tagFilterByHash, setTagFilterByHash] = useState({}); // hash -> Set of hidden tag labels

  const toggleHashTag = (hash, label) =>
    setTagFilterByHash((prev) => {
      const cur = new Set(prev[hash] || []);
      if (cur.has(label)) cur.delete(label);
      else cur.add(label);
      return { ...prev, [hash]: cur };
    });

  const toggleAllHashTags = (hash, tags) =>
    setTagFilterByHash((prev) => {
      const cur = prev[hash] || new Set();
      const labels = (tags || []).map((t) => t.label);
      const allSelected = labels.every((l) => !cur.has(l));
      return { ...prev, [hash]: allSelected ? new Set(labels) : new Set() };
    });

  const availableTags = uniqueTags(hashes.map((h) => h.tags));
  const visibleHashes = filter.size ? hashes.filter((h) => tagMatches(h.tags, filter)) : hashes;

  const ensureFiles = async (hash) => {
    if (filesByHash[hash]?.files) return filesByHash[hash].files;
    setFilesByHash((prev) => ({ ...prev, [hash]: { loading: true, files: [] } }));
    try {
      const res = await api.commitFiles(hash);
      const files = res.files || [];
      setFilesByHash((prev) => ({ ...prev, [hash]: { loading: false, files } }));
      return files;
    } catch (e) {
      setFilesByHash((prev) => ({ ...prev, [hash]: { loading: false, files: [], error: e.message } }));
      return [];
    }
  };

  // Selecting a hash honors its per-hash tag filter: when some tags are
  // deselected, only files whose tag is still shown get selected (not 'ALL').
  const selectHash = async (h) => {
    const deselected = tagFilterByHash[h.hash];
    if (!deselected || deselected.size === 0) {
      setFilesFromFile(h, entry.path, 'ALL');
      return;
    }
    const files = await ensureFiles(h.hash);
    if (!files.length) {
      setFilesFromFile(h, entry.path, 'ALL');
      return;
    }
    const visible = files.filter((f) => !deselected.has(f.tag?.label)).map((f) => f.path);
    if (!visible.length) {
      removeFileSrc(h.hash, entry.path);
      return;
    }
    setFilesFromFile(h, entry.path, visible.length === files.length ? 'ALL' : visible);
  };

  // Select / Unselect act on the visible (tag-filtered) hashes.
  const selectVisible = () => {
    for (const h of visibleHashes) selectHash(h);
  };
  const unselectVisible = () => {
    for (const h of visibleHashes) removeFileSrc(h.hash, entry.path);
  };

  const toggleExpand = async (h) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(h.hash)) n.delete(h.hash);
      else n.add(h.hash);
      return n;
    });
    await ensureFiles(h.hash);
  };

  const toggleHashFile = (h, path, allPaths) => {
    const e = selections[h.hash];
    const cur = !e ? new Set() : e.files === 'ALL' ? new Set(allPaths) : new Set(e.files);
    if (cur.has(path)) cur.delete(path);
    else cur.add(path);
    if (cur.size === 0) {
      removeFileSrc(h.hash, entry.path);
      return;
    }
    setFilesFromFile(h, entry.path, cur.size === allPaths.length ? 'ALL' : [...cur]);
  };

  return (
    <>
      <div
        className={`row file${shaking ? ' shake' : ''}${noHash ? ' no-hash' : ''}`}
        onAnimationEnd={onShakeEnd}
      >
        <input type="checkbox" checked={checked} onChange={onToggle} aria-label={`Select ${entry.name}`} />
        <span className="icon">{entry.isMarkdown ? '📝' : '📄'}</span>
        <span className="name clickable" onClick={onToggle} title={entry.path}>{entry.name}</span>
        {hashInfo?.loading && <span className="meta">scanning…</span>}
        {noHash && <span className="nohash-tag">no commit hash</span>}
        {hashes.length > 0 && <span className="meta">{hashes.length} commit{hashes.length > 1 ? 's' : ''}</span>}
      </div>

      {checked && hashInfo?.error && <div className="hash-error">{hashInfo.error}</div>}

      {checked && hashes.length > 0 && (
        <div className="hash-block">
          <div className="hash-block-head">
            <button
              type="button"
              className="expander"
              onClick={() => setCollapsed((c) => !c)}
              aria-label={collapsed ? 'Expand hash list' : 'Collapse hash list'}
            >
              {collapsed ? '▶' : '▼'}
            </button>
            <strong>Commit hashes</strong>
            <span className="count">
              {visibleHashes.length}
              {filter.size ? ` / ${hashes.length}` : ''}
            </span>
            <span className="spacer" />
            <button type="button" className="btn btn-sm" onClick={selectVisible} disabled={!visibleHashes.length}>
              Select
            </button>
            <button type="button" className="btn btn-sm" onClick={unselectVisible} disabled={!visibleHashes.length}>
              Unselect
            </button>
            <TagFilter available={availableTags} selected={filter} onChange={setFilter} />
          </div>

          {!collapsed && filter.size > 0 && visibleHashes.length === 0 && (
            <div className="muted-note">No commit hashes match the tag filter.</div>
          )}

          {!collapsed &&
            visibleHashes.map((h) => {
              const sel = selections[h.hash];
              const selectedHere = !!sel?.fromFiles?.includes(entry.path);
              const whole = selectedHere && sel.files === 'ALL';
              const partial = selectedHere && sel.files !== 'ALL';
              const info = filesByHash[h.hash];
              const isExpanded = expanded.has(h.hash);
              return (
                <div className="commit" key={h.hash}>
                  <div className="hash-row">
                    <input
                      type="checkbox"
                      checked={whole}
                      ref={(el) => el && (el.indeterminate = partial)}
                      onChange={() =>
                        whole || partial ? removeFileSrc(h.hash, entry.path) : selectHash(h)
                      }
                      aria-label={`Select commit ${h.shortHash}`}
                    />
                    <button
                      className="expander"
                      onClick={() => toggleExpand(h)}
                      aria-label={isExpanded ? 'Collapse files' : 'Expand files'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className="hash-meta">
                      <span className="hash-sha">{h.shortHash}</span>{' '}
                      <span className="hash-subject">{h.subject}</span>
                      <span className="hash-sub">
                        {h.author}
                        {h.date ? ` · ${new Date(h.date).toLocaleDateString()}` : ''}
                      </span>
                      {h.tags?.length > 0 && (
                        <TagList
                          tags={h.tags}
                          interactive
                          deselected={tagFilterByHash[h.hash]}
                          onToggle={(label) => toggleHashTag(h.hash, label)}
                          onToggleAll={() => toggleAllHashTags(h.hash, h.tags)}
                        />
                      )}
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
                        .filter((f) => !tagFilterByHash[h.hash]?.has(f.tag?.label))
                        .map((f) => {
                        const allPaths = info.files.map((x) => x.path);
                        const fileChecked = isFileSelectedInCommit(sel, f.path);
                        return (
                          <label className="file-row" key={f.path}>
                            <input
                              type="checkbox"
                              checked={fileChecked}
                              onChange={() => toggleHashFile(h, f.path, allPaths)}
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
        </div>
      )}
    </>
  );
}
