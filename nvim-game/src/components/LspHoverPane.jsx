function resultFor(lesson) {
  const id = lesson?.id || '';
  if (/rename/.test(id)) {
    return { source: 'apex_ls · workspace edit', title: 'Account → CustomerAccount', body: '3 references renamed in 2 files.' };
  }
  if (/code_action/.test(id)) {
    return { source: 'apex_ls · code actions', title: '1. Extract local variable', body: '2. Add missing null guard\\n3. Suppress warning' };
  }
  if (/definition|declaration|implementation|references/.test(id)) {
    return { source: 'Telescope · LSP locations', title: 'AccountService.findActive', body: 'AccountService.cls:5\\nAccountServiceTest.cls:12' };
  }
  if (/workspace/.test(id)) {
    return { source: 'workspace folders', title: '/workspace/force-app', body: '/workspace/shared-apex\\n2 folders attached' };
  }
  if (/inlay/.test(id)) {
    return { source: 'apex_ls · inlay hints', title: 'account: Account', body: 'active: List<Account>\\ntotal: Integer' };
  }
  if (/lint/.test(id)) {
    return { source: 'nvim-lint · eslint_d / ruff', title: 'Lint complete', body: '0 errors · 1 warning · 2 hints' };
  }
  if (/organize_imports/.test(id)) {
    return { source: 'jdtls · workspace edit', title: 'Imports organized', body: '2 unused imports removed\\n3 imports sorted' };
  }
  if (/update_config/.test(id)) {
    return { source: 'jdtls · project model', title: 'Build configuration updated', body: 'pom.xml reloaded\\nDependencies refreshed' };
  }
  if (/expand_macro/.test(id)) {
    return { source: 'rust-analyzer', title: 'Expanded macro', body: '#[derive(Debug)] → generated impl Debug for Account' };
  }
  if (/rust.code_action/.test(id)) {
    return { source: 'rustaceanvim', title: 'Rust code actions', body: '1. Fill match arms\\n2. Add missing trait import' };
  }
  return {
    source: 'apex_ls',
    title: 'List<Account> AccountService.findActive()',
    body: 'Returns active Account records ordered by Name.\\nforce-app/main/default/classes/AccountService.cls:5',
  };
}

export default function LspHoverPane({ lesson }) {
  const result = resultFor(lesson);
  return (
    <div className="overlay-pane lsp-popover" aria-label="LSP simulation">
      <div className="overlay-header">
        <span>LSP · {lesson?.label}</span>
        <span className="muted">{result.source}</span>
      </div>
      <div>
        <span className="token-function">{result.title}</span>
        <br />
        <br />
        {result.body.split('\n').map((line, index) => (
          <div className={index > 0 ? 'muted' : ''} key={`${line}-${index}`}>{line}</div>
        ))}
      </div>
    </div>
  );
}
