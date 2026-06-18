import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { useSelections, selectionList } from './store.jsx';
import FileBrowserPane from './components/FileBrowserPane.jsx';
import GitHistoryPane from './components/GitHistoryPane.jsx';
import SelectionTray from './components/SelectionTray.jsx';
import DiffView from './components/DiffView.jsx';
import Resizer from './components/Resizer.jsx';

export default function App() {
  const { selections } = useSelections();
  const [view, setView] = useState('home');
  const [diff, setDiff] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const list = useMemo(() => selectionList(selections), [selections]);

  // Resizable layout (persisted): left pane width + bottom tray height.
  const [leftWidth, setLeftWidth] = useState(() => {
    const saved = Number(localStorage.getItem('gcv.leftWidth'));
    return saved > 0 ? saved : Math.round(window.innerWidth * 0.5);
  });
  const [trayHeight, setTrayHeight] = useState(() => {
    const saved = Number(localStorage.getItem('gcv.trayHeight'));
    return saved > 0 ? saved : Math.round(window.innerHeight * 0.3);
  });
  useEffect(() => {
    localStorage.setItem('gcv.leftWidth', String(leftWidth));
  }, [leftWidth]);
  useEffect(() => {
    localStorage.setItem('gcv.trayHeight', String(trayHeight));
  }, [trayHeight]);
  const onLeftDelta = useCallback((d) => {
    setLeftWidth((w) => Math.max(280, Math.min(window.innerWidth - 320, w + d)));
  }, []);
  const onTrayDelta = useCallback((d) => {
    setTrayHeight((h) => Math.max(90, Math.min(window.innerHeight - 220, h - d)));
  }, []);

  // Tray window modes (ephemeral). trayHeight above is the remembered "maximized" size.
  const [trayMin, setTrayMin] = useState(false);
  const [trayFull, setTrayFull] = useState(false);

  // Horizontal pane mode: which pane (if any) is expanded to full width.
  const [paneMode, setPaneMode] = useState('split'); // 'split' | 'left' | 'right'

  const handleView = useCallback(async () => {
    if (!list.length) return;
    setError(null);
    setLoading(true);
    const sels = list.map((s) => ({
      hash: s.hash,
      files: s.files === 'ALL' ? undefined : s.files,
    }));
    try {
      const data = await api.diff(sels);
      const enriched = data.commits.map((c) => {
        const s = selections[c.hash];
        return { ...c, fromGit: !!s?.fromGit, fromFiles: s?.fromFiles || [] };
      });
      setDiff({ commits: enriched });
      setView('diff');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [list, selections]);

  const trayStyle = trayFull
    ? { flex: '1 1 auto', minHeight: 0 }
    : trayMin
      ? { flex: '0 0 auto' }
      : { height: `${trayHeight}px` };

  const leftPaneStyle = {
    display: paneMode === 'right' ? 'none' : 'flex',
    ...(paneMode === 'left' ? { flex: '1 1 auto' } : { flex: `0 0 ${leftWidth}px` }),
    minWidth: 0,
  };
  const rightPaneStyle = {
    display: paneMode === 'left' ? 'none' : 'flex',
    flex: '1 1 0',
    minWidth: 0,
  };

  return (
    <div className="app">
      {!trayFull && (
        <header className="app-header">
          <div className="brand">
            <span className="logo" aria-hidden>⎇</span> Git Change Viewer
          </div>
          <div className="subtitle">
            Combine changes from <code>changes/*.md</code> hashes and git history, view the diff, export <code>package.xml</code>
          </div>
        </header>
      )}

      {error && (
        <div className="banner error" role="alert">
          {error}
          <button className="banner-close" onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      <div className="panes" style={{ display: trayFull ? 'none' : 'flex' }}>
        <FileBrowserPane
          style={leftPaneStyle}
          isExpanded={paneMode === 'left'}
          onToggleExpand={() => setPaneMode((m) => (m === 'left' ? 'split' : 'left'))}
        />
        {paneMode === 'split' && <Resizer orientation="vertical" onDelta={onLeftDelta} />}
        <GitHistoryPane
          style={rightPaneStyle}
          isExpanded={paneMode === 'right'}
          onToggleExpand={() => setPaneMode((m) => (m === 'right' ? 'split' : 'right'))}
        />
      </div>

      {!trayFull && !trayMin && <Resizer orientation="horizontal" onDelta={onTrayDelta} />}

      <SelectionTray
        onView={handleView}
        viewLoading={loading}
        style={trayStyle}
        minimized={trayMin}
        fullscreen={trayFull}
        onToggleMinimize={() => setTrayMin((m) => !m)}
        onToggleFullscreen={() => setTrayFull((f) => !f)}
      />

      {view === 'diff' && diff && <DiffView data={diff} onBack={() => setView('home')} />}
    </div>
  );
}
