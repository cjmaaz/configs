import { keyLesson } from './helpers.js';

export const languageLessons = [
  keyLesson({
    id: 'java.organize_imports',
    topic: 'languages',
    keys: '<leader>co',
    label: 'Java organize imports',
    prompt: 'Ask jdtls to organize the current Java imports.',
    explains: 'Runs :JdtOrganizeImports in a Java buffer.',
    siblings: ['<leader>cu', '<leader>ca'],
    sim: 'lsp-hover',
  }),
  keyLesson({
    id: 'java.update_config',
    topic: 'languages',
    keys: '<leader>cu',
    label: 'Java update project config',
    prompt: 'Refresh the Java project configuration after build-file changes.',
    explains: 'Runs :JdtUpdateConfig for Maven/Gradle project updates.',
    siblings: ['<leader>co', '<leader>ca'],
    sim: 'lsp-hover',
  }),
  keyLesson({
    id: 'rust.code_action',
    topic: 'languages',
    keys: '<leader>cR',
    label: 'Rust code action',
    prompt: 'Open rustaceanvim’s Rust-specific code actions.',
    explains: 'Runs :RustLsp codeAction, which can expose actions beyond generic LSP.',
    siblings: ['<leader>ce', '<leader>ca'],
    sim: 'lsp-hover',
  }),
  keyLesson({
    id: 'rust.expand_macro',
    topic: 'languages',
    keys: '<leader>ce',
    label: 'Expand Rust macro',
    prompt: 'Show the expansion of the Rust macro under the cursor.',
    explains: 'Runs :RustLsp expandMacro.',
    siblings: ['<leader>cR', '<leader>ca'],
    sim: 'lsp-hover',
  }),
];
