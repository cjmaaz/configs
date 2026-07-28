import { coreLessons } from './core.js';
import { defaultLessons } from './defaults.js';
import { editingLessons } from './editing.js';
import { gitLessons } from './git.js';
import { languageLessons } from './languages.js';
import { lspLessons } from './lsp.js';
import { modeLessons } from './modes.js';
import { neoTreeLessons } from './neotree.js';
import { netrwLessons } from './netrw.js';
import { optionLessons } from './options.js';
import { pluginLessons } from './plugins.js';
import { runtimeLessons } from './runtime.js';
import { salesforceLessons } from './salesforce.js';
import { telescopeLessons } from './telescope.js';

export const topics = [
  { id: 'modes', name: 'Modes', icon: '--', description: 'Normal, Insert, Visual, and Command state' },
  { id: 'core', name: 'Core', icon: 'hjkl', description: 'Navigation, buffers, diagnostics, and terminal mode' },
  { id: 'netrw', name: 'Netrw', icon: 'tree', description: 'File explorer mappings and its five settings' },
  { id: 'options', name: 'Options', icon: ':set', description: 'The behavior behind every core option' },
  { id: 'telescope', name: 'Telescope', icon: 'find', description: 'Files, text, commands, symbols, and buffers' },
  { id: 'git', name: 'Gitsigns', icon: '+/-', description: 'Hunks, blame, diffs, staging, and quickfix' },
  { id: 'lsp', name: 'LSP', icon: 'LSP', description: 'Definitions, actions, symbols, and diagnostics' },
  { id: 'editing', name: 'Editing', icon: 'edit', description: 'Formatting, linting, TODOs, text objects, completion' },
  { id: 'languages', name: 'Java & Rust', icon: '{}', description: 'jdtls and rustaceanvim actions' },
  { id: 'salesforce', name: 'Salesforce', icon: 'SF', description: 'Orgs, metadata, Apex tests, SOQL, and coverage' },
  { id: 'plugins', name: 'Plugin settings', icon: 'plug', description: 'Why each plugin option was chosen' },
  { id: 'neotree', name: 'Neo-tree', icon: 'tree+', description: 'Learn the parked explorer before enabling it' },
  { id: 'runtime', name: 'Startup', icon: 'init', description: 'init.lua, autocommands, and lazy.nvim' },
  { id: 'defaults', name: 'Defaults', icon: 'std', description: 'What this config leaves untouched' },
];

export const allLessons = [
  ...modeLessons,
  ...coreLessons,
  ...netrwLessons,
  ...optionLessons,
  ...telescopeLessons,
  ...gitLessons,
  ...lspLessons,
  ...editingLessons,
  ...languageLessons,
  ...salesforceLessons,
  ...pluginLessons,
  ...neoTreeLessons,
  ...runtimeLessons,
  ...defaultLessons,
];

export const activeLessons = allLessons.filter((lesson) => !lesson.inactive);
export const lessonById = new Map(allLessons.map((lesson) => [lesson.id, lesson]));

export function lessonsForTopics(topicIds, { includeInactive = false } = {}) {
  const source = includeInactive ? allLessons : activeLessons;
  if (!topicIds?.length) {
    return source;
  }
  const selected = new Set(topicIds);
  return source.filter((lesson) => selected.has(lesson.topic));
}

export function alternativesFor(lesson) {
  if (lesson.kind === 'setting') {
    return lesson.choices
      .filter((choice) => choice.key !== lesson.keys)
      .map((choice) => ({
        keys: choice.key,
        label: choice.label,
        explains: choice.effect,
      }));
  }

  return (lesson.siblings || []).map((keys) => {
    const sibling = allLessons.find(
      (candidate) =>
        candidate.keys === keys &&
        candidate.id !== lesson.id &&
        !candidate.inactive &&
        (candidate.mode === lesson.mode || candidate.mode === 'NORMAL'),
    );
    return {
      keys,
      label: sibling?.label || 'Related mapping',
      explains: sibling?.explains || 'A related command in the same keymap family.',
    };
  });
}

export const curriculumStats = {
  total: activeLessons.length,
  keymaps: activeLessons.filter((lesson) => lesson.kind === 'keymap').length,
  settings: activeLessons.filter((lesson) => lesson.kind === 'setting').length,
  topics: topics.filter((topic) => !topic.inactive).length,
};
