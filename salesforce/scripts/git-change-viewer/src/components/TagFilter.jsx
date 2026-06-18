import { useEffect, useRef, useState } from 'react';

const GROUP_ORDER = ['code', 'auto', 'ui', 'schema', 'sec', 'data', 'doc', 'misc'];

// Dedupe a list of tag arrays into unique [{label, group}], sorted by group then label.
export function uniqueTags(tagArrays) {
  const seen = new Map();
  for (const arr of tagArrays || []) {
    for (const t of arr || []) {
      if (t && !seen.has(t.label)) seen.set(t.label, t.group || 'misc');
    }
  }
  return [...seen.entries()]
    .map(([label, group]) => ({ label, group }))
    .sort((a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.label.localeCompare(b.label));
}

// An item (tags = [{label,...}]) matches when no filter is set or it has any selected label.
export function tagMatches(itemTags, selected) {
  if (!selected || selected.size === 0) return true;
  return (itemTags || []).some((t) => selected.has(t.label));
}

const MENU_MAX_H = 320;

export default function TagFilter({ available = [], selected, onChange, label = 'Tags' }) {
  const sel = selected || new Set();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  // Anchor the popover with fixed positioning so it can never be clipped by an
  // ancestor's overflow (e.g. a collapsed hash block). Opens upward when there
  // isn't enough room below (e.g. the bottom tray).
  const place = () => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const right = Math.max(8, window.innerWidth - r.right);
    if (window.innerHeight - r.bottom < MENU_MAX_H && r.top > MENU_MAX_H) {
      setPos({ bottom: window.innerHeight - r.top + 4, right });
    } else {
      setPos({ top: r.bottom + 4, right });
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    document.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  const count = sel.size;

  const toggle = (lbl) => {
    const next = new Set(sel);
    if (next.has(lbl)) next.delete(lbl);
    else next.add(lbl);
    onChange(next);
  };

  const onButton = () => {
    if (!open) place();
    setOpen((o) => !o);
  };

  const style = pos
    ? { position: 'fixed', right: pos.right, ...(pos.top != null ? { top: pos.top } : { bottom: pos.bottom }) }
    : undefined;

  return (
    <span className="tag-filter" ref={wrapRef}>
      <button
        ref={btnRef}
        type="button"
        className={`btn btn-sm${count > 0 ? ' active' : ''}`}
        onClick={onButton}
        disabled={available.length === 0}
        aria-haspopup="true"
        aria-expanded={open}
        title="Filter by tag"
      >
        {label}
        {count > 0 ? ` (${count})` : ''} ▾
      </button>
      {open && (
        <div className="tag-filter-pop" style={style}>
          <div className="tag-filter-head">
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => onChange(new Set(available.map((t) => t.label)))}
              disabled={available.length === 0}
            >
              Select all
            </button>
            <button
              type="button"
              className="btn btn-sm btn-ghost"
              onClick={() => onChange(new Set())}
              disabled={count === 0}
            >
              Clear
            </button>
          </div>
          <div className="tag-filter-list">
            {available.length === 0 ? (
              <div className="tag-filter-empty">No tags</div>
            ) : (
              available.map((t) => (
                <label key={t.label}>
                  <input type="checkbox" checked={sel.has(t.label)} onChange={() => toggle(t.label)} />
                  <span className={`tag tag-${t.group || 'misc'}`}>{t.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      )}
    </span>
  );
}
