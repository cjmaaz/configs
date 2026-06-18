import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import PathLabel from './PathLabel.jsx';

// Common metadata types offered when assigning a type to an unmapped file.
const TYPE_OPTIONS = [
  'ApexClass', 'ApexTrigger', 'ApexPage', 'ApexComponent',
  'LightningComponentBundle', 'AuraDefinitionBundle',
  'CustomObject', 'CustomField', 'RecordType', 'ValidationRule', 'ListView', 'FieldSet',
  'CompactLayout', 'Layout', 'FlexiPage', 'Flow', 'FlowDefinition',
  'PermissionSet', 'PermissionSetGroup', 'Profile', 'CustomLabels',
  'StaticResource', 'ContentAsset', 'CustomMetadata', 'CustomTab', 'CustomApplication',
  'QuickAction', 'NamedCredential', 'ConnectedApp', 'RemoteSiteSetting', 'CspTrustedSite',
  'SiteDotCom', 'CustomSite', 'Network', 'Audience', 'CleanDataService',
  'Report', 'Dashboard', 'EmailTemplate', 'Translations', 'GlobalValueSet',
  'OmniScript', 'OmniIntegrationProcedure', 'OmniDataTransform', 'OmniUiCard',
];

export default function PackageXmlModal({ files, onClose }) {
  const [excluded, setExcluded] = useState(() => new Set());
  const [overrides, setOverrides] = useState({}); // path -> assigned type
  const [emitDestructive, setEmitDestructive] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState('');
  const [showFiles, setShowFiles] = useState(false);
  const [openSections, setOpenSections] = useState(() => new Set(['Unmapped']));
  const [warnOpen, setWarnOpen] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);
  const [pickerFor, setPickerFor] = useState(null); // path showing type picker
  const [pickerCustom, setPickerCustom] = useState(false);
  const [customType, setCustomType] = useState('');
  const didInit = useRef(false);

  const filesWithTypes = useMemo(() => files.map((f) => ({ ...f, type: overrides[f.path] })), [files, overrides]);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.packagexml(filesWithTypes, emitDestructive, [...excluded]));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filesWithTypes, emitDestructive, excluded]);

  useEffect(() => {
    generate();
  }, [generate]);

  // One-time: default-exclude the initially-unmapped files (stay yellow + off).
  useEffect(() => {
    if (didInit.current || !result) return;
    didInit.current = true;
    const unmapped = (result.perFile || []).filter((p) => p.type === null).map((p) => p.path);
    if (unmapped.length) {
      setExcluded((prev) => {
        const n = new Set(prev);
        unmapped.forEach((p) => n.add(p));
        return n;
      });
    }
  }, [result]);

  const perByPath = useMemo(() => {
    const m = new Map();
    for (const p of result?.perFile || []) m.set(p.path, p);
    return m;
  }, [result]);

  // Chooser sections: group by mapped type, plus an "Unmapped" section (open first).
  const sections = useMemo(() => {
    const groups = new Map();
    for (const f of files) {
      const pf = perByPath.get(f.path);
      const key = pf && pf.type ? pf.type : 'Unmapped';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(f);
    }
    const keys = [...groups.keys()].sort((a, b) =>
      a === 'Unmapped' ? -1 : b === 'Unmapped' ? 1 : a.localeCompare(b),
    );
    return keys.map((k) => ({ type: k, files: groups.get(k) }));
  }, [files, perByPath]);

  // Structured manifest: type -> members -> source paths (for the minus button).
  const manifest = useMemo(() => {
    const groups = new Map();
    for (const x of result?.mappedPackage || []) {
      if (!groups.has(x.type)) groups.set(x.type, new Map());
      const mm = groups.get(x.type);
      if (!mm.has(x.member)) mm.set(x.member, []);
      mm.get(x.member).push(x.path);
    }
    return [...groups.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([type, mm]) => ({
        type,
        members: [...mm.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([member, paths]) => ({ member, paths })),
      }));
  }, [result]);

  const includedCount = files.filter((f) => !excluded.has(f.path)).length;

  const excludePaths = (paths) =>
    setExcluded((prev) => {
      const n = new Set(prev);
      paths.forEach((p) => n.add(p));
      return n;
    });
  const includePath = (path) =>
    setExcluded((prev) => {
      const n = new Set(prev);
      n.delete(path);
      return n;
    });

  const onToggleFile = (f) => {
    const pf = perByPath.get(f.path);
    const isUnmapped = pf ? pf.type === null : false;
    const checked = !excluded.has(f.path);
    if (checked) {
      excludePaths([f.path]);
      if (pickerFor === f.path) setPickerFor(null);
    } else if (isUnmapped && !overrides[f.path]) {
      setPickerFor(f.path);
      setPickerCustom(false);
      setCustomType('');
    } else {
      includePath(f.path);
    }
  };

  const applyType = (path, type) => {
    const t = (type || '').trim();
    if (!t) return;
    setOverrides((prev) => ({ ...prev, [path]: t }));
    includePath(path);
    setPickerFor(null);
    setPickerCustom(false);
    setCustomType('');
  };

  const toggleSection = (type) =>
    setOpenSections((prev) => {
      const n = new Set(prev);
      if (n.has(type)) n.delete(type);
      else n.add(type);
      return n;
    });

  const copy = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1500);
    } catch {
      setError('Clipboard copy was blocked by the browser.');
    }
  };
  const download = (text, name) => {
    const blob = new Blob([text], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <span className="title">Generate package.xml</span>
          <span className="spacer" />
          <button className="btn btn-sm" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <div className="pane-toolbar" style={{ marginTop: 0 }}>
            <label className="checkbox-line">
              <input type="checkbox" checked={emitDestructive} onChange={(e) => setEmitDestructive(e.target.checked)} />
              Emit <code>destructiveChanges.xml</code> for deletions
            </label>
            <span className="spacer" />
            <button className="btn btn-sm" onClick={() => setShowFiles((s) => !s)}>
              {showFiles ? 'Hide' : 'Choose'} files ({includedCount}/{files.length})
            </button>
          </div>

          {showFiles && (
            <div className="pkg-chooser">
              {sections.map((sec) => {
                const open = openSections.has(sec.type);
                return (
                  <div className="pkg-fsection" key={sec.type}>
                    <div className="section-head" onClick={() => toggleSection(sec.type)}>
                      <span className="expander">{open ? '▼' : '▶'}</span>
                      <strong>{sec.type === 'Unmapped' ? 'Unmapped' : sec.type}</strong>
                      <span className="tray-count">{sec.files.length}</span>
                    </div>
                    {open &&
                      sec.files.map((f) => {
                        const pf = perByPath.get(f.path);
                        const isUnmapped = pf ? pf.type === null : false;
                        return (
                          <div className={`file-toggle${isUnmapped ? ' unmapped' : ''}`} key={f.path}>
                            <input
                              type="checkbox"
                              checked={!excluded.has(f.path)}
                              onChange={() => onToggleFile(f)}
                            />
                            <span className={`status-chip status-${f.status}`}>{f.status}</span>
                            <PathLabel path={f.path} />
                            <span className="maptype">
                              {overrides[f.path] || (isUnmapped ? 'unmapped' : pf?.type || '—')}
                            </span>
                            {pickerFor === f.path && (
                              <span className="type-picker">
                                <select
                                  className="date-input"
                                  defaultValue=""
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    if (v === '__other') setPickerCustom(true);
                                    else if (v) applyType(f.path, v);
                                  }}
                                >
                                  <option value="" disabled>Pick type…</option>
                                  {TYPE_OPTIONS.map((t) => (
                                    <option key={t} value={t}>{t}</option>
                                  ))}
                                  <option value="__other">Other…</option>
                                </select>
                                {pickerCustom && (
                                  <>
                                    <input
                                      className="date-input"
                                      placeholder="Custom type"
                                      value={customType}
                                      onChange={(e) => setCustomType(e.target.value)}
                                    />
                                    <button className="btn btn-sm" onClick={() => applyType(f.path, customType)}>Add</button>
                                  </>
                                )}
                                <button className="btn btn-sm btn-ghost" onClick={() => setPickerFor(null)}>Cancel</button>
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                );
              })}
            </div>
          )}

          {loading && <div className="loading">Generating…</div>}
          {error && <div className="hash-error">{error}</div>}

          {result && (
            <>
              <div className="xml-section-title">package.xml</div>
              <div className="pkg-manifest">
                {manifest.length === 0 && <div className="muted-note">No mapped members selected.</div>}
                {manifest.map((g) => (
                  <div className="pkg-type" key={g.type}>
                    <div className="pkg-type-name">
                      &lt;name&gt;{g.type}&lt;/name&gt; <span className="tray-count">{g.members.length}</span>
                    </div>
                    {g.members.map((m) => (
                      <div className="pkg-member-row" key={m.member}>
                        <code>&lt;members&gt;{m.member}&lt;/members&gt;</code>
                        <button
                          className="mini-btn"
                          title="Remove from package.xml (and uncheck the file)"
                          onClick={() => excludePaths(m.paths)}
                        >
                          −
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
              <div className="pane-toolbar">
                <button className="btn btn-sm" onClick={() => copy(result.packageXml, 'package')}>
                  {copied === 'package' ? 'Copied!' : 'Copy'}
                </button>
                <button className="btn btn-sm" onClick={() => download(result.packageXml, 'package.xml')}>Download</button>
                <button className="btn btn-sm btn-ghost" onClick={() => setRawOpen((o) => !o)}>
                  {rawOpen ? 'Hide' : 'Show'} raw XML
                </button>
              </div>
              {rawOpen && <pre className="xml-pre">{result.packageXml}</pre>}

              {emitDestructive && result.destructiveXml && (
                <>
                  <div className="xml-section-title">destructiveChanges.xml</div>
                  <pre className="xml-pre">{result.destructiveXml}</pre>
                  <div className="pane-toolbar">
                    <button className="btn btn-sm" onClick={() => copy(result.destructiveXml, 'dest')}>
                      {copied === 'dest' ? 'Copied!' : 'Copy'}
                    </button>
                    <button className="btn btn-sm" onClick={() => download(result.destructiveXml, 'destructiveChanges.xml')}>
                      Download
                    </button>
                  </div>
                </>
              )}

              {result.unmapped?.length > 0 && (
                <div className="unmapped-warn">
                  <div className="warn-head" onClick={() => setWarnOpen((o) => !o)}>
                    <span className="expander">{warnOpen ? '▼' : '▶'}</span>
                    ⚠ {result.unmapped.length} file{result.unmapped.length === 1 ? '' : 's'} not mapped to a metadata type
                    (omitted) — tick one in "Choose files" to assign a type.
                  </div>
                  {warnOpen && (
                    <ul>
                      {result.unmapped.map((p) => (
                        <li key={p}><code>{p}</code></li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-foot">
          <span className="spacer" />
          <button className="btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
