import { keyLesson, settingLesson } from './helpers.js';

const topic = 'languages';
const setting = (config) => settingLesson({ topic, sim: 'settings', ...config });

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

  // nvim-jdtls
  setting({
    id: 'java.workspace_dir',
    setting: 'jdtls workspace_dir',
    value: 'per-project',
    label: 'One workspace per project',
    prompt: 'Where does jdtls keep its workspace data?',
    explains:
      'Under stdpath("data")/jdtls-workspaces, named after the project directory. Each project gets an isolated index, which is why the first open of a new Java project is slow.',
    choices: [
      {
        value: 'per-project',
        label: 'A separate directory per project',
        effect: 'Isolated index; first open of a project rebuilds it.',
      },
      { value: 'shared', label: 'One shared workspace', effect: 'Would let projects corrupt each other index.' },
      { value: 'project', label: 'Inside the project itself', effect: 'Would pollute the repository.' },
    ],
  }),
  setting({
    id: 'java.root_markers',
    setting: 'jdtls root_dir',
    value: 'markers',
    label: 'Detecting the Java project root',
    prompt: 'How is the Java project root located?',
    explains:
      'By searching upward for markers such as pom.xml, build.gradle, gradlew, mvnw or .git. The chosen directory then names the workspace.',
    choices: [
      {
        value: 'markers',
        label: 'Build files and .git, searched upward',
        effect: 'Handles both Maven and Gradle layouts.',
      },
      { value: 'cwd', label: 'The working directory', effect: 'Would break when editing from a parent directory.' },
      { value: 'buffer', label: 'The buffer directory', effect: 'Would treat each package as its own project.' },
    ],
  }),
  setting({
    id: 'java.update_build',
    setting: 'updateBuildConfiguration',
    value: 'interactive',
    label: 'Reacting to build-file edits',
    prompt: 'What happens after you edit pom.xml?',
    explains:
      '"interactive" means jdtls waits to be asked, which is exactly why the <leader>cu mapping exists. Setting it to "automatic" would reload the project on every save.',
    choices: [
      {
        value: 'interactive',
        label: '"interactive" — you trigger it',
        effect: 'Run <leader>cu to pick up dependency changes.',
      },
      { value: 'automatic', label: '"automatic"', effect: 'Would reindex on every build-file save.' },
      { value: 'disabled', label: '"disabled"', effect: 'Changes would never be picked up.' },
    ],
  }),
  setting({
    id: 'java.download_sources',
    setting: 'downloadSources',
    value: true,
    label: 'Fetching dependency sources',
    prompt: 'Does jdtls download sources for third-party dependencies?',
    explains:
      'Yes, for both Eclipse and Maven, so hover and go-to-definition land in real source rather than decompiled stubs. It costs bandwidth on first index.',
    choices: [
      { value: true, label: 'true', effect: 'Go-to-definition reaches actual library source.' },
      { value: false, label: 'false', effect: 'Would show decompiled signatures only.' },
    ],
  }),
  setting({
    id: 'java.static_members',
    setting: 'favoriteStaticMembers',
    value: 'test',
    label: 'Favoured static imports',
    prompt: 'Which libraries are configured as favourite static imports?',
    explains:
      'Test assertion helpers: AssertJ Assertions plus JUnit 5 Assertions, Assumptions, DynamicContainer and DynamicTest. Completion offers these as static imports without typing the class first.',
    choices: [
      {
        value: 'test',
        label: 'AssertJ and JUnit 5 assertion helpers',
        effect: 'assertThat completes directly in test files.',
      },
      { value: 'collections', label: 'Java collections utilities', effect: 'Not configured here.' },
      { value: 'none', label: 'None', effect: 'Five entries are configured.' },
    ],
  }),
  setting({
    id: 'java.bundles',
    setting: 'init_options.bundles',
    value: 'empty',
    label: 'No debug or test bundles',
    prompt: 'What does an empty init_options.bundles table mean?',
    explains:
      'No java-debug or vscode-java-test extensions are loaded, so there is no debugging or test-runner integration. Adding those JARs here is how you would enable them.',
    choices: [
      {
        value: 'empty',
        label: 'No debugger or test-runner integration',
        effect: 'jdtls provides language features only.',
      },
      { value: 'auto', label: 'They are auto-detected', effect: 'Bundles must be listed explicitly.' },
      { value: 'all', label: 'Everything Mason installed', effect: 'Mason installs jdtls but no bundles.' },
    ],
  }),

  // rustaceanvim
  setting({
    id: 'rust.init_pattern',
    setting: 'vim.g.rustaceanvim',
    value: 'init',
    label: 'Configured through a global',
    prompt: 'Why is rustaceanvim configured in init rather than opts or config?',
    explains:
      'It reads vim.g.rustaceanvim when it loads, so the global has to exist beforehand. init runs before load; config runs after, which would be too late. It is the only plugin here using this pattern.',
    choices: [
      {
        value: 'init',
        label: 'The global must exist before the plugin loads',
        effect: 'config would run too late to be read.',
      },
      { value: 'style', label: 'Purely a style preference', effect: 'It is a functional requirement.' },
      { value: 'lazy', label: 'To make it lazy', effect: 'This spec sets lazy = false.' },
    ],
  }),
  setting({
    id: 'rust.check_command',
    setting: 'check.command',
    value: 'clippy',
    label: 'Clippy instead of check',
    prompt: 'Which command does rust-analyzer run for on-save diagnostics?',
    explains:
      'clippy, replacing the default cargo check. Clippy is a superset, so you get lint suggestions alongside compiler errors.',
    choices: [
      { value: 'clippy', label: '"clippy"', effect: 'Compiler errors plus lint suggestions.' },
      { value: 'check', label: '"check"', effect: 'The rust-analyzer default.' },
      { value: 'build', label: '"build"', effect: 'Would produce artifacts unnecessarily.' },
    ],
  }),
  setting({
    id: 'rust.all_features',
    setting: 'cargo.allFeatures',
    value: true,
    label: 'Analysing every feature',
    prompt: 'Which cargo features does rust-analyzer analyse?',
    explains:
      'allFeatures=true analyses them all, so feature-gated code is not reported as dead. The default is false, which only covers the default feature set.',
    choices: [
      { value: true, label: 'true — all features', effect: 'Feature-gated code is fully analysed.' },
      { value: false, label: 'false — default features', effect: 'The rust-analyzer default.' },
    ],
  }),
  setting({
    id: 'rust.exclude_dirs',
    setting: 'files.excludeDirs',
    value: 'seven',
    label: 'Directories excluded from indexing',
    prompt: 'Which directories does rust-analyzer skip?',
    explains:
      'target, node_modules, venv, .venv, .direnv, .git and .jj. The default excludes nothing, so a Rust project with a JavaScript frontend would otherwise index node_modules.',
    choices: [
      {
        value: 'seven',
        label: 'Build output, dependencies and VCS directories',
        effect: 'Keeps indexing off target and node_modules.',
      },
      { value: 'target', label: 'Only target', effect: 'Six more are listed.' },
      { value: 'none', label: 'None', effect: 'That is the rust-analyzer default.' },
    ],
  }),
  setting({
    id: 'rust.proc_macro',
    setting: 'procMacro.enable',
    value: true,
    label: 'Procedural macro expansion',
    prompt: 'Are proc macros expanded for analysis?',
    explains:
      'Yes, which is required for derive-heavy code such as serde to resolve. This matches the rust-analyzer default rather than changing it.',
    choices: [
      { value: true, label: 'true', effect: 'Derived implementations resolve correctly.' },
      { value: false, label: 'false', effect: 'serde derives would appear unresolved.' },
    ],
  }),
  setting({
    id: 'rust.ft_keys',
    setting: 'per-keymap ft filter',
    value: 'ft',
    label: 'Filetype-scoped lazy keys',
    prompt: 'How are the Rust keymaps kept from firing in other filetypes?',
    explains:
      'Each keys entry carries ft = "rust", a lazy.nvim feature used only here. So <leader>cR does nothing in a Lua buffer instead of erroring.',
    choices: [
      {
        value: 'ft',
        label: 'An ft field on each keys entry',
        effect: 'The mapping only exists in Rust buffers.',
      },
      { value: 'buffer', label: 'Buffer-local mappings in on_attach', effect: 'That is how jdtls does it.' },
      { value: 'global', label: 'They are global', effect: 'They are deliberately scoped.' },
    ],
  }),
  setting({
    id: 'rust.rustfmt_source',
    setting: 'rustfmt install',
    value: 'toolchain',
    label: 'Where rustfmt comes from',
    prompt: 'Why is rustfmt absent from the mason-tool-installer list?',
    explains:
      'It ships with the Rust toolchain via rustup, so Mason has nothing to install. It is the only formatter in this config not managed by Mason.',
    choices: [
      {
        value: 'toolchain',
        label: 'It comes with the Rust toolchain',
        effect: 'Installed by rustup, not Mason.',
      },
      { value: 'missing', label: 'It is an oversight', effect: 'It is deliberate.' },
      { value: 'lsp', label: 'rust-analyzer provides it', effect: 'Conform calls the rustfmt binary.' },
    ],
  }),
];
