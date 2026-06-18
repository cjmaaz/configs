import { useMemo, useState } from 'react';
import { api } from '../api.js';
import { useSelections, selectionList, isFileSelectedInCommit } from '../store.jsx';
import TagList from './TagList.jsx';
import TagFilter, { uniqueTags, tagMatches } from './TagFilter.jsx';
import PathLabel from './PathLabel.jsx';

function basename(p) {
  const parts = String(p).split('/');
  return parts[parts.length - 1] || p;
}

export default function SelectionTray({
  onView,
  viewLoading,
  style,
  minimized,
  fullscreen,
  onToggleMinimize,
  onToggleFullscreen,
}) {
  const { selections, removeCommit, clearAll, setFiles } = useSelections();
  const list = useMemo(() => selectionList(selections), [selections]);

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

  const availableTags = useMemo(() => uniqueTags(list.map((s) => s.tags)), [list]);
  const visibleList = filter.size ? list.filter((s) => tagMatches(s.tags, filter)) : list;

  const fileCount = list.reduce((acc, s) => acc + (s.files === 'ALL' ? 0 : s.files.length), 0);
  const allCount = list.filter((s) => s.files === 'ALL').length;

  const toggleExpand = async (s) => {
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(s.hash)) n.delete(s.hash);
      else n.add(s.hash);
      return n;
    });
    if (!filesByHash[s.hash]) {
      setFilesByHash((prev) => ({ ...prev, [s.hash]: { loading: true, files: [] } }));
      try {
        const res = await api.commitFiles(s.hash);
        setFilesByHash((prev) => ({ ...prev, [s.hash]: { loading: false, files: res.files || [] } }));
      } catch (e) {
        setFilesByHash((prev) => ({ ...prev, [s.hash]: { loading: false, files: [], error: e.message } }));
      }
    }
  };

  const toggleTrayFile = (s, path, allPaths) => {
    const cur = s.files === 'ALL' ? new Set(allPaths) : new Set(s.files);
    if (cur.has(path)) cur.delete(path);
    else cur.add(path);
    if (cur.size === 0) {
      removeCommit(s.hash);
      return;
    }
    setFiles(s, cur.size === allPaths.length ? 'ALL' : [...cur], false);
  };

  return (
    <div className={`tray${minimized ? ' minimized' : ''}${fullscreen ? ' fullscreen' : ''}`} style={style}>
      <div
        className="tray-head"
        onClick={() => { if (!fullscreen) onToggleMinimize(); }}
        style={{ cursor: fullscreen ? 'default' : 'pointer' }}
        title={fullscreen ? undefined : minimized ? 'Click to restore' : 'Click to minimize'}
      >
        <span className="title">Selected changes</span>
        <span className="tray-count">
          {list.length} commit{list.length === 1 ? '' : 's'}
          {allCount > 0 && ` · ${allCount} whole`}
          {fileCount > 0 && ` · ${fileCount} file${fileCount === 1 ? '' : 's'}`}
          {filter.size > 0 && ` · showing ${visibleList.length} of ${list.length}`}
        </span>
        <span className="spacer" />
        <span onClick={(e) => e.stopPropagation()} style={{ display: 'inline-flex' }}>
          <TagFilter available={availableTags} selected={filter} onChange={setFilter} />
        </span>
        <button className="btn btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); clearAll(); }} disabled={!list.length}>
          Clear all
        </button>
        <button className="btn btn-primary" onClick={(e) => { e.stopPropagation(); onView(); }} disabled={!list.length || viewLoading}>
          {viewLoading ? 'Loading diff…' : `View ${list.length ? `(${list.length})` : ''}`}
        </button>
        {!fullscreen && (
          <button
            className="tray-ctrl"
            onClick={(e) => { e.stopPropagation(); onToggleMinimize(); }}
            title={minimized ? 'Restore' : 'Minimize'}
            aria-label={minimized ? 'Restore' : 'Minimize'}
          >
            {minimized ? '□' : '—'}
          </button>
        )}
        <button
          className="tray-ctrl"
          onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }}
          title={fullscreen ? 'Exit full screen' : 'Full screen'}
          aria-label={fullscreen ? 'Exit full screen' : 'Full screen'}
        >
          {fullscreen ? '⤡' : '⤢'}
        </button>
      </div>

      {!minimized &&
        (list.length === 0 ? (
          <div className="tray-empty">
            Nothing selected yet. Pick commit hashes from a <code>changes/*.md</code> file on the left, or commits
            from git history on the right.
          </div>
        ) : (
          <div className="tray-list">
            {visibleList.length === 0 && (
              <div className="tray-empty">No selected changes match the tag filter.</div>
            )}
            {visibleList.map((s) => {
              const isExpanded = expanded.has(s.hash);
              const info = filesByHash[s.hash];
              return (
                <div className="tray-row-wrap" key={s.hash}>
                  <div className="tray-row">
                    <button
                      className="expander"
                      onClick={() => toggleExpand(s)}
                      aria-label={isExpanded ? 'Collapse files' : 'Expand files'}
                    >
                      {isExpanded ? '▼' : '▶'}
                    </button>
                    <span className="sha">{s.shortHash}</span>
                    <span className="subj" title={s.subject}>{s.subject}</span>
                    <span className="tray-count">
                      {s.files === 'ALL' ? 'all files' : `${s.files.length} file${s.files.length === 1 ? '' : 's'}`}
                    </span>
                    {s.tags?.length > 0 && (
                      <TagList
                        tags={s.tags}
                        interactive
                        deselected={tagFilterByHash[s.hash]}
                        onToggle={(label) => toggleHashTag(s.hash, label)}
                        onToggleAll={() => toggleAllHashTags(s.hash, s.tags)}
                      />
                    )}
                    <span className="badges">
                      {s.fromGit && <span className="badge git">GIT</span>}
                      {s.fromFiles.map((p) => (
                        <span className="badge file" key={p} title={p}>FILE: {basename(p)}</span>
                      ))}
                    </span>
                    <button className="btn btn-sm btn-ghost" onClick={() => removeCommit(s.hash)} aria-label="Remove">
                      ✕
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="commit-files">
                      {info?.loading && <div className="muted-note">Loading files…</div>}
                      {info?.error && <div className="hash-error">{info.error}</div>}
                      {info && !info.loading && info.files.length === 0 && (
                        <div className="muted-note">No file changes (merge commit?).</div>
                      )}
                      {(info?.files || [])
                        .filter((f) => !tagFilterByHash[s.hash]?.has(f.tag?.label))
                        .map((f) => {
                        const allPaths = info.files.map((x) => x.path);
                        return (
                          <label className="file-row" key={f.path}>
                            <input
                              type="checkbox"
                              checked={isFileSelectedInCommit(s, f.path)}
                              onChange={() => toggleTrayFile(s, f.path, allPaths)}
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
        ))}
    </div>
  );
}
