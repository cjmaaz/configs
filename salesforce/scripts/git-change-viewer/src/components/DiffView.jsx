import { useMemo, useState } from 'react';
import { html as diff2htmlHtml } from 'diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import PackageXmlModal from './PackageXmlModal.jsx';
import TagList from './TagList.jsx';

// Split a combined `git show` diff into per-file chunks, each a valid single-file
// diff that diff2html can render on its own. Paths are read from the +++/--- lines
// (unambiguous even when a path contains spaces, e.g. layout files).
function splitDiffByFile(diff, files = []) {
  if (!diff || !diff.trim()) return [];
  const statusByPath = new Map(files.map((f) => [f.path, f.status]));
  const tagByPath = new Map(files.map((f) => [f.path, f.tag]));
  const parts = diff.split(/(?=^diff --git )/m).filter((p) => p.trim());
  return parts.map((chunk, idx) => {
    const giT = chunk.match(/^diff --git a\/(.*) b\/(.*?)\r?$/m);
    const plus = chunk.match(/^\+\+\+ (.+?)\r?$/m);
    const minus = chunk.match(/^--- (.+?)\r?$/m);
    let plusPath = plus ? plus[1].replace(/^b\//, '') : null;
    let minusPath = minus ? minus[1].replace(/^a\//, '') : null;
    if (plusPath === '/dev/null') plusPath = null;
    if (minusPath === '/dev/null') minusPath = null;
    const isNew = /^new file mode/m.test(chunk);
    const isDeleted = /^deleted file mode/m.test(chunk);
    const isRename = /^rename (from|to) /m.test(chunk);
    let path = plusPath || minusPath || (giT ? giT[2] : null) || `file-${idx}`;
    const oldPath = isRename ? minusPath || (giT ? giT[1] : null) : null;

    let add = 0;
    let del = 0;
    for (const line of chunk.split('\n')) {
      if (line[0] === '+' && !line.startsWith('+++')) add++;
      else if (line[0] === '-' && !line.startsWith('---')) del++;
    }
    const status = statusByPath.get(path) || (isNew ? 'A' : isDeleted ? 'D' : isRename ? 'R' : 'M');
    return { path, oldPath, idx, status, add, del, tag: tagByPath.get(path) || null, chunk };
  });
}

function FileBlock({ file, outputFormat }) {
  const [copied, setCopied] = useState('');
  const [collapsed, setCollapsed] = useState(false);
  const html = useMemo(
    () => diff2htmlHtml(file.chunk, { drawFileList: false, matching: 'lines', outputFormat }),
    [file.chunk, outputFormat],
  );
  const filename = file.path.split('/').pop();

  const copy = (text, key) => {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key);
        setTimeout(() => setCopied((c) => (c === key ? '' : c)), 1200);
      },
      () => {},
    );
  };

  return (
    <div className="diff-file">
      <div
        className="diff-file-head"
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? 'Click to expand file' : 'Click to collapse file'}
      >
        <button
          type="button"
          className="expander"
          aria-label={collapsed ? 'Expand file' : 'Collapse file'}
          onClick={(e) => { e.stopPropagation(); setCollapsed((c) => !c); }}
        >
          {collapsed ? '▶' : '▼'}
        </button>
        <button
          type="button"
          className="diff-file-name"
          title="Click to copy filename"
          onClick={(e) => { e.stopPropagation(); copy(filename, 'name'); }}
        >
          {filename}
        </button>
        <button
          type="button"
          className="diff-file-path"
          title={`Click to copy path: ${file.path}`}
          onClick={(e) => { e.stopPropagation(); copy(file.path, 'path'); }}
        >
          {file.oldPath ? `${file.oldPath} → ${file.path}` : file.path}
        </button>
        {copied && <span className="copied-flash">Copied {copied}!</span>}
        <span className="spacer" />
        <span className="diff-file-stats">
          {file.status && <span className={`status-chip status-${file.status}`}>{file.status}</span>}
          {file.add > 0 && <span className="diff-add">+{file.add}</span>}
          {file.del > 0 && <span className="diff-del">&minus;{file.del}</span>}
        </span>
      </div>
      {!collapsed && <div className="d2h" dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}

function CommitSection({ commit, outputFormat, open, onToggle }) {
  const [deselectedTags, setDeselectedTags] = useState(() => new Set());
  const toggleTag = (label) =>
    setDeselectedTags((prev) => {
      const n = new Set(prev);
      if (n.has(label)) n.delete(label);
      else n.add(label);
      return n;
    });
  const toggleAllTags = () =>
    setDeselectedTags((prev) => {
      const labels = (commit.tags || []).map((t) => t.label);
      const allSelected = labels.every((l) => !prev.has(l));
      return allSelected ? new Set(labels) : new Set();
    });

  const content = useMemo(() => {
    if (!open) return { blocks: [], fallback: '' };
    const blocks = splitDiffByFile(commit.unifiedDiff, commit.files);
    if (blocks.length) return { blocks, fallback: '' };
    const d = commit.unifiedDiff;
    if (d && d.trim()) {
      return { blocks: [], fallback: diff2htmlHtml(d, { drawFileList: false, matching: 'lines', outputFormat }) };
    }
    return { blocks: [], fallback: '' };
  }, [open, commit.unifiedDiff, commit.files, outputFormat]);

  const visibleBlocks = content.blocks.filter((b) => !deselectedTags.has(b.tag?.label));

  return (
    <div className="commit-section">
      <div className="commit-section-head" onClick={onToggle}>
        <span className="expander">{open ? '▼' : '▶'}</span>
        <span className="sha">{commit.shortHash}</span>
        <span className="subj" title={commit.subject}>{commit.subject}</span>
        <span className="tray-count">{commit.files.length} file{commit.files.length === 1 ? '' : 's'}</span>
        {commit.tags?.length > 0 && (
          <TagList tags={commit.tags} interactive deselected={deselectedTags} onToggle={toggleTag} onToggleAll={toggleAllTags} />
        )}
        <span className="badges">
          {commit.fromGit && <span className="badge git">GIT</span>}
          {commit.fromFiles?.length > 0 && (
            <span className="badge file" title={commit.fromFiles.join(', ')}>FILE</span>
          )}
        </span>
      </div>
      {open && (
        <div className="commit-section-body">
          {commit.truncated && (
            <div className="truncated-note">Diff truncated (very large) — showing the first ~2 MB.</div>
          )}
          {content.blocks.length > 0 ? (
            visibleBlocks.length > 0 ? (
              visibleBlocks.map((f) => <FileBlock key={`${f.path}-${f.idx}`} file={f} outputFormat={outputFormat} />)
            ) : (
              <div className="muted-note" style={{ padding: '12px' }}>All files hidden by the tag filter.</div>
            )
          ) : content.fallback ? (
            <div className="d2h" dangerouslySetInnerHTML={{ __html: content.fallback }} />
          ) : (
            <div className="muted-note" style={{ padding: '12px' }}>
              No textual diff for the selected files (binary or empty).
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function DiffView({ data, onBack }) {
  const commits = data.commits;
  const [outputFormat, setOutputFormat] = useState('line-by-line');
  const [open, setOpen] = useState(
    () => new Set(commits.length <= 4 ? commits.map((c) => c.hash) : commits.slice(0, 1).map((c) => c.hash)),
  );
  const [showPkg, setShowPkg] = useState(false);

  // Union of changed files across all selected commits (newest status wins).
  const allFiles = useMemo(() => {
    const map = new Map();
    for (const c of commits) {
      for (const f of c.files) if (!map.has(f.path)) map.set(f.path, f.status);
    }
    return [...map.entries()].map(([path, status]) => ({ path, status }));
  }, [commits]);

  const toggle = (h) =>
    setOpen((prev) => {
      const n = new Set(prev);
      if (n.has(h)) n.delete(h);
      else n.add(h);
      return n;
    });

  return (
    <div className="diff-view">
      <div className="diff-toolbar">
        <button className="btn" onClick={onBack}>← Back</button>
        <span className="title">
          Combined diff · {commits.length} commit{commits.length === 1 ? '' : 's'} · {allFiles.length} file
          {allFiles.length === 1 ? '' : 's'}
        </span>
        <span className="spacer" />
        <button className="btn btn-sm" onClick={() => setOpen(new Set(commits.map((c) => c.hash)))}>Expand all</button>
        <button className="btn btn-sm" onClick={() => setOpen(new Set())}>Collapse all</button>
        <div className="toggle-group">
          <button className={outputFormat === 'line-by-line' ? 'active' : ''} onClick={() => setOutputFormat('line-by-line')}>
            Unified
          </button>
          <button className={outputFormat === 'side-by-side' ? 'active' : ''} onClick={() => setOutputFormat('side-by-side')}>
            Side-by-side
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => setShowPkg(true)} disabled={!allFiles.length}>
          Generate package.xml
        </button>
      </div>

      <div className="diff-body">
        {commits.map((c) => (
          <CommitSection
            key={c.hash}
            commit={c}
            outputFormat={outputFormat}
            open={open.has(c.hash)}
            onToggle={() => toggle(c.hash)}
          />
        ))}
      </div>

      {showPkg && <PackageXmlModal files={allFiles} onClose={() => setShowPkg(false)} />}
    </div>
  );
}
