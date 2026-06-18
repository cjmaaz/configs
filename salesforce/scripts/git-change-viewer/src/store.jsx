import { createContext, useContext, useMemo, useReducer } from 'react';

// Shared working set: a map of full commit hash -> selection entry.
//   fromGit:   selected directly in the right (git history) pane
//   fromFiles: list of changes/*.md paths (left pane) that referenced this hash
//   files:     'ALL' (whole commit) or an array of selected file paths
//
// Both panes mutate this same set; the View action diffs it.

const SelectionContext = createContext(null);

const META_KEYS = ['shortHash', 'subject', 'author', 'date', 'tags'];

function withMeta(entry, meta) {
  const next = { ...entry };
  for (const k of META_KEYS) {
    if (meta?.[k] != null) next[k] = meta[k];
  }
  return next;
}

function blank(meta) {
  return {
    hash: meta.hash,
    shortHash: meta.shortHash,
    subject: meta.subject,
    author: meta.author,
    date: meta.date,
    tags: meta.tags || [],
    fromGit: false,
    fromFiles: [],
    files: 'ALL',
  };
}

function reducer(state, action) {
  const selections = { ...state.selections };
  const get = (hash) => selections[hash];

  switch (action.type) {
    case 'ADD_GIT': {
      const { meta } = action;
      const existing = get(meta.hash);
      selections[meta.hash] = existing
        ? { ...withMeta(existing, meta), fromGit: true }
        : { ...blank(meta), fromGit: true };
      return { selections };
    }
    case 'REMOVE_GIT': {
      const e = get(action.hash);
      if (!e) return state;
      if (e.fromFiles.length) selections[action.hash] = { ...e, fromGit: false };
      else delete selections[action.hash];
      return { selections };
    }
    case 'ADD_FILE': {
      const { meta, mdPath } = action;
      const existing = get(meta.hash);
      const base = existing ? withMeta(existing, meta) : blank(meta);
      const fromFiles = base.fromFiles.includes(mdPath)
        ? base.fromFiles
        : [...base.fromFiles, mdPath];
      selections[meta.hash] = { ...base, fromFiles };
      return { selections };
    }
    case 'REMOVE_FILE_SRC': {
      const e = get(action.hash);
      if (!e) return state;
      const fromFiles = e.fromFiles.filter((p) => p !== action.mdPath);
      if (!fromFiles.length && !e.fromGit) delete selections[action.hash];
      else selections[action.hash] = { ...e, fromFiles };
      return { selections };
    }
    case 'SET_FILES': {
      const { meta, files, markGit } = action;
      const existing = get(meta.hash);
      const base = existing ? withMeta(existing, meta) : blank(meta);
      selections[meta.hash] = { ...base, files, fromGit: markGit ? true : base.fromGit };
      return { selections };
    }
    case 'SET_FILES_FROM_FILE': {
      // Left pane: set a file subset while tagging the commit as a FILE source.
      const { meta, mdPath, files } = action;
      const existing = get(meta.hash);
      const base = existing ? withMeta(existing, meta) : blank(meta);
      const fromFiles = base.fromFiles.includes(mdPath) ? base.fromFiles : [...base.fromFiles, mdPath];
      selections[meta.hash] = { ...base, fromFiles, files };
      return { selections };
    }
    case 'REMOVE_COMMIT': {
      delete selections[action.hash];
      return { selections };
    }
    case 'CLEAR_GIT': {
      for (const h of Object.keys(selections)) {
        const e = selections[h];
        if (!e.fromGit) continue;
        if (e.fromFiles.length) selections[h] = { ...e, fromGit: false, files: 'ALL' };
        else delete selections[h];
      }
      return { selections };
    }
    case 'CLEAR_FILES': {
      for (const h of Object.keys(selections)) {
        const e = selections[h];
        if (!e.fromFiles.length) continue;
        if (e.fromGit) selections[h] = { ...e, fromFiles: [] };
        else delete selections[h];
      }
      return { selections };
    }
    case 'CLEAR_ALL':
      return { selections: {} };
    default:
      return state;
  }
}

export function SelectionProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { selections: {} });

  const value = useMemo(() => {
    const actions = {
      addGit: (meta) => dispatch({ type: 'ADD_GIT', meta }),
      removeGit: (hash) => dispatch({ type: 'REMOVE_GIT', hash }),
      toggleGit: (meta, on) => dispatch(on ? { type: 'ADD_GIT', meta } : { type: 'REMOVE_GIT', hash: meta.hash }),
      addFile: (meta, mdPath) => dispatch({ type: 'ADD_FILE', meta, mdPath }),
      removeFileSrc: (hash, mdPath) => dispatch({ type: 'REMOVE_FILE_SRC', hash, mdPath }),
      setFiles: (meta, files, markGit = true) => dispatch({ type: 'SET_FILES', meta, files, markGit }),
      setFilesFromFile: (meta, mdPath, files) => dispatch({ type: 'SET_FILES_FROM_FILE', meta, mdPath, files }),
      removeCommit: (hash) => dispatch({ type: 'REMOVE_COMMIT', hash }),
      clearGit: () => dispatch({ type: 'CLEAR_GIT' }),
      clearFiles: () => dispatch({ type: 'CLEAR_FILES' }),
      clearAll: () => dispatch({ type: 'CLEAR_ALL' }),
    };
    return { selections: state.selections, ...actions };
  }, [state.selections]);

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}

export function useSelections() {
  const ctx = useContext(SelectionContext);
  if (!ctx) throw new Error('useSelections must be used within SelectionProvider');
  return ctx;
}

// Derived helpers shared by panes.
export function selectionList(selections) {
  return Object.values(selections).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

export function isFileSelectedInCommit(entry, path) {
  if (!entry) return false;
  return entry.files === 'ALL' || (Array.isArray(entry.files) && entry.files.includes(path));
}
