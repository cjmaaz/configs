// Map Salesforce source-format file paths to MDAPI {type, member} and build
// package.xml / destructiveChanges.xml. Mapping follows the repo's documented
// path -> metadata table (.cursor/rules/retrieve-before-edit.mdc).

const API_VERSION = '66.0';
const SRC_MARKER = 'force-app/main/default/';

// Single-file-per-component folders: member = filename minus the suffix.
// Longer suffixes first so `.cls-meta.xml` wins over `.cls`.
const SIMPLE = {
  classes: { type: 'ApexClass', suffixes: ['.cls-meta.xml', '.cls'] },
  triggers: { type: 'ApexTrigger', suffixes: ['.trigger-meta.xml', '.trigger'] },
  pages: { type: 'ApexPage', suffixes: ['.page-meta.xml', '.page'] },
  components: { type: 'ApexComponent', suffixes: ['.component-meta.xml', '.component'] },
  flexipages: { type: 'FlexiPage', suffixes: ['.flexipage-meta.xml'] },
  flows: { type: 'Flow', suffixes: ['.flow-meta.xml'] },
  flowDefinitions: { type: 'FlowDefinition', suffixes: ['.flowDefinition-meta.xml'] },
  layouts: { type: 'Layout', suffixes: ['.layout-meta.xml'] },
  permissionsets: { type: 'PermissionSet', suffixes: ['.permissionset-meta.xml'] },
  permissionsetgroups: { type: 'PermissionSetGroup', suffixes: ['.permissionsetgroup-meta.xml'] },
  profiles: { type: 'Profile', suffixes: ['.profile-meta.xml'] },
  tabs: { type: 'CustomTab', suffixes: ['.tab-meta.xml'] },
  applications: { type: 'CustomApplication', suffixes: ['.app-meta.xml'] },
  quickActions: { type: 'QuickAction', suffixes: ['.quickAction-meta.xml'] },
  globalValueSets: { type: 'GlobalValueSet', suffixes: ['.globalValueSet-meta.xml'] },
  globalValueSetTranslations: { type: 'GlobalValueSetTranslation', suffixes: ['.globalValueSetTranslation-meta.xml'] },
  standardValueSets: { type: 'StandardValueSet', suffixes: ['.standardValueSet-meta.xml'] },
  groups: { type: 'Group', suffixes: ['.group-meta.xml'] },
  queues: { type: 'Queue', suffixes: ['.queue-meta.xml'] },
  roles: { type: 'Role', suffixes: ['.role-meta.xml'] },
  namedCredentials: { type: 'NamedCredential', suffixes: ['.namedCredential-meta.xml'] },
  connectedApps: { type: 'ConnectedApp', suffixes: ['.connectedApp-meta.xml'] },
  contentassets: { type: 'ContentAsset', suffixes: ['.asset-meta.xml', '.asset'] },
  translations: { type: 'Translations', suffixes: ['.translation-meta.xml'] },
  customMetadata: { type: 'CustomMetadata', suffixes: ['.md-meta.xml'] },
  labels: { type: 'CustomLabels', suffixes: ['.labels-meta.xml'] },
  letterhead: { type: 'Letterhead', suffixes: ['.letter-meta.xml'] },
  approvalProcesses: { type: 'ApprovalProcess', suffixes: ['.approvalProcess-meta.xml'] },
  duplicateRules: { type: 'DuplicateRule', suffixes: ['.duplicateRule-meta.xml'] },
  matchingRules: { type: 'MatchingRules', suffixes: ['.matchingRule-meta.xml'] },
  staticresources: { type: 'StaticResource', suffixes: [] }, // handled specially (no dots in name)
};

// Bundle folders: member = the bundle directory name (segment after the folder).
const BUNDLE = { lwc: 'LightningComponentBundle', aura: 'AuraDefinitionBundle' };

// OmniStudio: component name is the directory/file right under the folder.
const OMNI = {
  omniScripts: { type: 'OmniScript', suffixes: ['.os-meta.xml'] },
  omniIntegrationProcedures: { type: 'OmniIntegrationProcedure', suffixes: ['.oip-meta.xml'] },
  omniDataTransforms: { type: 'OmniDataTransform', suffixes: ['.dr-meta.xml', '.rpt-meta.xml'] },
  omniUiCard: { type: 'OmniUiCard', suffixes: ['.ouc-meta.xml'] },
  flexCards: { type: 'FlexCard', suffixes: ['.flexCard-meta.xml'] },
  omniInteractionConfigs: { type: 'OmniInteractionConfig', suffixes: ['.oic-meta.xml'] },
};

// objects/<Object>/<subfolder>/<Name>.<suffix> -> Object.Name child components.
const OBJECT_CHILD = {
  fields: { type: 'CustomField', suffix: '.field-meta.xml' },
  recordTypes: { type: 'RecordType', suffix: '.recordType-meta.xml' },
  validationRules: { type: 'ValidationRule', suffix: '.validationRule-meta.xml' },
  webLinks: { type: 'WebLink', suffix: '.webLink-meta.xml' },
  listViews: { type: 'ListView', suffix: '.listView-meta.xml' },
  fieldSets: { type: 'FieldSet', suffix: '.fieldSet-meta.xml' },
  compactLayouts: { type: 'CompactLayout', suffix: '.compactLayout-meta.xml' },
  businessProcesses: { type: 'BusinessProcess', suffix: '.businessProcess-meta.xml' },
  sharingReasons: { type: 'SharingReason', suffix: '.sharingReason-meta.xml' },
  indexes: { type: 'Index', suffix: '.index-meta.xml' },
};

// Foldered components: member keeps the folder path, e.g. unfiled$public/My_Email.
const FOLDERED = {
  reports: { type: 'Report', suffix: '.report-meta.xml' },
  dashboards: { type: 'Dashboard', suffix: '.dashboard-meta.xml' },
  email: { type: 'EmailTemplate', suffix: '.email-meta.xml' },
  documents: { type: 'Document', suffix: null }, // member keeps the file extension
};

// Decomposed workflow children.
const WORKFLOW_CHILD = {
  rules: { type: 'WorkflowRule', suffix: '.workflowRule-meta.xml' },
  alerts: { type: 'WorkflowAlert', suffix: '.workflowAlert-meta.xml' },
  fieldUpdates: { type: 'WorkflowFieldUpdate', suffix: '.workflowFieldUpdate-meta.xml' },
  tasks: { type: 'WorkflowTask', suffix: '.workflowTask-meta.xml' },
  outboundMessages: { type: 'WorkflowOutboundMessage', suffix: '.workflowOutboundMessage-meta.xml' },
};

function stripFirstMatching(name, suffixes) {
  for (const s of suffixes) {
    if (name.endsWith(s)) return name.slice(0, -s.length);
  }
  return null;
}

// Map one repo-relative path to { type, member } or null when unrecognized.
export function mapPath(repoPath) {
  const norm = String(repoPath).split('\\').join('/');
  const idx = norm.indexOf(SRC_MARKER);
  if (idx === -1) return null;

  const rel = norm.slice(idx + SRC_MARKER.length);
  const segs = rel.split('/').filter(Boolean);
  if (segs.length < 2) return null;

  const top = segs[0];
  const file = segs[segs.length - 1];

  // objects/* (object definition + child components)
  if (top === 'objects') {
    const object = segs[1].replace(/\.object-meta\.xml$/, '');
    if (file.endsWith('.object-meta.xml')) return { type: 'CustomObject', member: object };
    if (segs.length >= 4) {
      const child = OBJECT_CHILD[segs[2]];
      if (child) {
        const m = file.endsWith(child.suffix) ? file.slice(0, -child.suffix.length) : file.replace(/-meta\.xml$/, '');
        return { type: child.type, member: `${object}.${m}` };
      }
    }
    return null;
  }

  // bundles (lwc / aura): the directory under the folder is the member
  if (BUNDLE[top]) {
    if (segs.length < 2) return null;
    return { type: BUNDLE[top], member: segs[1] };
  }

  // OmniStudio components: member is the first segment (folder or single file)
  if (OMNI[top]) {
    const { type, suffixes } = OMNI[top];
    const member = stripFirstMatching(segs[1], suffixes) ?? segs[1];
    return { type, member };
  }

  // staticresources: resource names contain no dots
  if (top === 'staticresources') {
    return { type: 'StaticResource', member: segs[1].split('.')[0] };
  }

  // workflows: object-level file or decomposed children
  if (top === 'workflows') {
    const object = segs[1].replace(/\.workflow-meta\.xml$/, '');
    if (file.endsWith('.workflow-meta.xml')) return { type: 'Workflow', member: object };
    if (segs.length >= 4) {
      const wf = WORKFLOW_CHILD[segs[2]];
      if (wf) {
        const m = file.endsWith(wf.suffix) ? file.slice(0, -wf.suffix.length) : file.replace(/-meta\.xml$/, '');
        return { type: wf.type, member: `${object}.${m}` };
      }
    }
    return null;
  }

  // objectTranslations: member is <Object>-<locale>
  if (top === 'objectTranslations') {
    const member = segs[1].replace(/\.objectTranslation-meta\.xml$/, '');
    return { type: 'CustomObjectTranslation', member };
  }

  // foldered components (reports / dashboards / email / documents)
  if (FOLDERED[top]) {
    const { type, suffix } = FOLDERED[top];
    let member = segs.slice(1).join('/');
    // folder definition files are not deployable members
    if (/\.(reportFolder|dashboardFolder|emailFolder|documentFolder)-meta\.xml$/.test(file)) return null;
    if (suffix && member.endsWith(suffix)) member = member.slice(0, -suffix.length);
    else member = member.replace(/-meta\.xml$/, '');
    return { type, member };
  }

  // simple single-file components
  if (SIMPLE[top]) {
    const { type, suffixes } = SIMPLE[top];
    const member = stripFirstMatching(segs[1], suffixes) ?? segs[1].replace(/-meta\.xml$/, '');
    return { type, member };
  }

  return null;
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderXml(groups) {
  const types = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Package xmlns="http://soap.sforce.com/2006/04/metadata">',
  ];
  for (const type of types) {
    const members = [...groups.get(type)].sort((a, b) => a.localeCompare(b));
    lines.push('    <types>');
    for (const m of members) lines.push(`        <members>${escapeXml(m)}</members>`);
    lines.push(`        <name>${type}</name>`);
    lines.push('    </types>');
  }
  lines.push(`    <version>${API_VERSION}</version>`);
  lines.push('</Package>');
  return lines.join('\n') + '\n';
}

// Derive a member name from a path when the user supplies an explicit type
// override for an otherwise-unmapped file (e.g. ProviderIE1.site -> ProviderIE1,
// DataCloudGeoLocation.cleanDataService-meta.xml -> DataCloudGeoLocation).
function deriveMember(path) {
  let base = String(path).split('/').pop() || '';
  base = base.replace(/-meta\.xml$/, '');
  base = base.replace(/\.[^.]+$/, '');
  return base;
}

// Build manifests from a list of { path, status, type? } entries.
// - type (override) -> use it + deriveMember; else mapPath
// - non-deleted -> package.xml
// - deleted ('D') -> destructiveChanges.xml when emitDestructive, else dropped
export function buildManifests(files = [], { emitDestructive = false, excluded = [] } = {}) {
  const excl = new Set(excluded);
  const pkg = new Map();
  const dest = new Map();
  const unmapped = [];
  const mappedPackage = [];
  const mappedDestructive = [];
  const perFile = []; // mapping for EVERY file (incl. excluded), for the UI

  for (const f of files) {
    const path = typeof f === 'string' ? f : f.path;
    const status = typeof f === 'string' ? 'M' : f.status || 'M';
    const override = f && typeof f === 'object' && f.type ? String(f.type) : null;
    const mapped = override ? { type: override, member: deriveMember(path) } : mapPath(path);
    perFile.push({ path, status, type: mapped ? mapped.type : null, member: mapped ? mapped.member : null });
    if (!mapped) {
      unmapped.push(path);
      continue;
    }
    if (excl.has(path)) continue; // user-excluded from the manifest
    const isDelete = status === 'D';
    if (isDelete && !emitDestructive) continue; // deletions excluded from package.xml
    const target = isDelete ? dest : pkg;
    if (!target.has(mapped.type)) target.set(mapped.type, new Set());
    target.get(mapped.type).add(mapped.member);
    (isDelete ? mappedDestructive : mappedPackage).push({ path, ...mapped });
  }

  return {
    packageXml: renderXml(pkg),
    destructiveXml: emitDestructive ? renderXml(dest) : null,
    unmapped,
    mappedPackage,
    mappedDestructive,
    perFile,
    apiVersion: API_VERSION,
  };
}
