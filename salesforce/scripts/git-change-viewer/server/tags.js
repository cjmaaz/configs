// Derive human-friendly "tags" describing what a commit touches (Apex, Flow,
// LWC, Page Layout, Field, Doc, PDF, ...) from its changed file paths.
// force-app paths reuse the package.xml path->type mapper; everything else
// falls back to extension/name heuristics.
import { mapPath } from './packagexml.js';

// Metadata type -> [label, group]. Group drives the chip color in the UI.
const TYPE_TAG = {
  ApexClass: ['Apex', 'code'],
  ApexTrigger: ['Apex Trigger', 'code'],
  ApexPage: ['Visualforce', 'code'],
  ApexComponent: ['VF Component', 'code'],
  LightningComponentBundle: ['LWC', 'code'],
  AuraDefinitionBundle: ['Aura', 'code'],

  Flow: ['Flow', 'auto'],
  FlowDefinition: ['Flow', 'auto'],
  OmniIntegrationProcedure: ['Integration Proc', 'auto'],
  OmniDataTransform: ['DataRaptor', 'auto'],
  Workflow: ['Workflow', 'auto'],
  WorkflowRule: ['Workflow', 'auto'],
  WorkflowAlert: ['Workflow', 'auto'],
  WorkflowFieldUpdate: ['Workflow', 'auto'],
  WorkflowTask: ['Workflow', 'auto'],
  WorkflowOutboundMessage: ['Workflow', 'auto'],
  ApprovalProcess: ['Approval', 'auto'],
  DuplicateRule: ['Dedupe', 'auto'],
  MatchingRules: ['Dedupe', 'auto'],

  OmniScript: ['OmniScript', 'ui'],
  OmniUiCard: ['FlexCard', 'ui'],
  FlexCard: ['FlexCard', 'ui'],
  OmniInteractionConfig: ['Omni Config', 'ui'],
  Layout: ['Page Layout', 'ui'],
  FlexiPage: ['FlexiPage', 'ui'],
  CustomTab: ['Tab', 'ui'],
  CustomApplication: ['App', 'ui'],
  QuickAction: ['Quick Action', 'ui'],
  WebLink: ['Web Link', 'ui'],

  CustomField: ['Field', 'schema'],
  CustomObject: ['Object', 'schema'],
  RecordType: ['Record Type', 'schema'],
  ValidationRule: ['Validation Rule', 'schema'],
  ListView: ['List View', 'schema'],
  FieldSet: ['Field Set', 'schema'],
  CompactLayout: ['Compact Layout', 'schema'],
  BusinessProcess: ['Business Process', 'schema'],
  SharingReason: ['Sharing Reason', 'schema'],
  Index: ['Index', 'schema'],
  CustomMetadata: ['Custom Metadata', 'schema'],
  CustomLabels: ['Labels', 'schema'],
  GlobalValueSet: ['Value Set', 'schema'],
  GlobalValueSetTranslation: ['Value Set Tx', 'schema'],
  StandardValueSet: ['Value Set', 'schema'],

  PermissionSet: ['Permission Set', 'sec'],
  PermissionSetGroup: ['Perm Set Group', 'sec'],
  Profile: ['Profile', 'sec'],
  ConnectedApp: ['Connected App', 'sec'],
  Group: ['Group', 'sec'],
  Queue: ['Queue', 'sec'],
  Role: ['Role', 'sec'],

  NamedCredential: ['Named Credential', 'data'],
  StaticResource: ['Static Resource', 'data'],
  ContentAsset: ['Content Asset', 'data'],
  EmailTemplate: ['Email', 'data'],
  Report: ['Report', 'data'],
  Dashboard: ['Dashboard', 'data'],
  Document: ['Document', 'data'],
  Translations: ['Translation', 'data'],
  CustomObjectTranslation: ['Translation', 'data'],
  Letterhead: ['Letterhead', 'data'],
};

// File extension -> [label, group] for non-force-app / unmapped files.
const EXT_TAG = {
  md: ['Doc', 'doc'],
  markdown: ['Doc', 'doc'],
  pdf: ['PDF', 'doc'],
  txt: ['Text', 'doc'],
  json: ['JSON', 'data'],
  xml: ['XML', 'data'],
  csv: ['CSV', 'data'],
  yml: ['YAML', 'data'],
  yaml: ['YAML', 'data'],
  toml: ['TOML', 'data'],
  toon: ['TOON', 'data'],
  py: ['Python', 'code'],
  js: ['Script', 'code'],
  mjs: ['Script', 'code'],
  cjs: ['Script', 'code'],
  ts: ['Script', 'code'],
  jsx: ['Script', 'code'],
  tsx: ['Script', 'code'],
  sh: ['Shell', 'code'],
  css: ['CSS', 'code'],
  html: ['HTML', 'code'],
  png: ['Image', 'data'],
  jpg: ['Image', 'data'],
  jpeg: ['Image', 'data'],
  gif: ['Image', 'data'],
  svg: ['Image', 'data'],
  webp: ['Image', 'data'],
};

const GROUP_ORDER = ['code', 'auto', 'ui', 'schema', 'sec', 'data', 'doc', 'misc'];
const MAX_PATHS = 1000; // guard against huge mirror commits

export function tagForPath(p) {
  const path = String(p);
  if (/\/classes\/[^/]*Test\.cls(-meta\.xml)?$/i.test(path)) {
    return { label: 'Apex Test', group: 'code' };
  }
  const mapped = mapPath(path);
  if (mapped) {
    const t = TYPE_TAG[mapped.type];
    return t ? { label: t[0], group: t[1] } : { label: mapped.type, group: 'misc' };
  }
  const base = path.split('/').pop() || path;
  const dot = base.lastIndexOf('.');
  if (dot <= 0) return { label: 'Other', group: 'misc' };
  const ext = base.slice(dot + 1).toLowerCase();
  const e = EXT_TAG[ext];
  return e ? { label: e[0], group: e[1] } : { label: ext.toUpperCase(), group: 'misc' };
}

// Returns an ordered, deduped list of { label, group } for a set of paths.
export function deriveTags(paths = []) {
  const seen = new Map(); // label -> group
  const cap = Math.min(paths.length, MAX_PATHS);
  for (let i = 0; i < cap; i++) {
    const t = tagForPath(paths[i]);
    if (t && !seen.has(t.label)) seen.set(t.label, t.group);
  }
  const arr = [...seen.entries()].map(([label, group]) => ({ label, group }));
  arr.sort(
    (a, b) => GROUP_ORDER.indexOf(a.group) - GROUP_ORDER.indexOf(b.group) || a.label.localeCompare(b.label),
  );
  return arr;
}
