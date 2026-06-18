// Renders a file path with the Salesforce metadata-TYPE folder (the segment
// right after force-app/main/default/) color-coded by category and the filename
// emphasized; the prefix and any nested middle folders are dimmed/truncatable.

const SRC = 'force-app/main/default/';

// Type folder -> color group (mirrors the tag groups so a "classes" folder
// reads the same color as the "Apex" tag, "dashboards" as "Dashboard", etc.).
const FOLDER_GROUP = {
  classes: 'code', triggers: 'code', pages: 'code', components: 'code', lwc: 'code', aura: 'code',
  flows: 'auto', flowDefinitions: 'auto', omniIntegrationProcedures: 'auto', omniDataTransforms: 'auto', workflows: 'auto',
  omniScripts: 'ui', flexCards: 'ui', omniUiCard: 'ui', layouts: 'ui', flexipages: 'ui', tabs: 'ui',
  applications: 'ui', quickActions: 'ui',
  objects: 'schema', customMetadata: 'schema', labels: 'schema', globalValueSets: 'schema', standardValueSets: 'schema',
  permissionsets: 'sec', permissionsetgroups: 'sec', profiles: 'sec', namedCredentials: 'sec', connectedApps: 'sec',
  staticresources: 'data', contentassets: 'data', email: 'data', reports: 'data', dashboards: 'data',
  translations: 'data', objectTranslations: 'data', letterhead: 'data',
};

export default function PathLabel({ path }) {
  const s = String(path);
  const idx = s.indexOf(SRC);

  if (idx !== -1) {
    const prefix = s.slice(0, idx + SRC.length); // up to and including default/
    const segs = s.slice(idx + SRC.length).split('/').filter(Boolean);
    const file = segs.length ? segs[segs.length - 1] : '';
    const type = segs.length >= 2 ? segs[0] : '';
    const middle = segs.length >= 3 ? `${segs.slice(1, -1).join('/')}/` : '';
    const group = FOLDER_GROUP[type] || 'misc';
    return (
      <span className="fpath" title={s}>
        <span className="fpath-prefix">{prefix}</span>
        {type && <span className={`fpath-folder g-${group}`}>{type}/</span>}
        {middle && <span className="fpath-mid">{middle}</span>}
        <span className="fpath-file">{file}</span>
      </span>
    );
  }

  // Non-force-app paths (manifest/, scripts/, README.md, ...): dim dir, bold file.
  const slash = s.lastIndexOf('/');
  const file = slash >= 0 ? s.slice(slash + 1) : s;
  const prefix = slash >= 0 ? s.slice(0, slash + 1) : '';
  return (
    <span className="fpath" title={s}>
      {prefix && <span className="fpath-prefix">{prefix}</span>}
      <span className="fpath-file">{file}</span>
    </span>
  );
}
