// Self-contained API smoke test. Mounts the Express app on an ephemeral port,
// exercises every endpoint with the global fetch, prints PASS/FAIL, and exits.
// No long-lived server / no process to kill. Run: node smoke.mjs
import { createApp } from './server/index.js';

const app = createApp();
const server = app.listen(0);
await new Promise((r) => server.once('listening', r));
const { port } = server.address();
const base = `http://127.0.0.1:${port}`;

let passed = 0;
let failed = 0;
function check(name, cond, detail = '') {
  if (cond) {
    passed++;
    console.log(`  PASS  ${name}`);
  } else {
    failed++;
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}
const getJson = async (path) => {
  const r = await fetch(base + path);
  return { status: r.status, body: await r.json().catch(() => null) };
};
const postJson = async (path, payload) => {
  const r = await fetch(base + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return { status: r.status, body: await r.json().catch(() => null) };
};

try {
  console.log('\n# /api/health');
  {
    const { status, body } = await getJson('/api/health');
    check('health 200 + repoRoot', status === 200 && !!body?.repoRoot, JSON.stringify(body));
  }

  console.log('\n# /api/fs');
  let firstMd = null;
  {
    const { status, body } = await getJson('/api/fs');
    const md = (body?.entries || []).find((e) => e.isMarkdown);
    firstMd = md?.path;
    check('fs default -> changes/', status === 200 && body?.path === 'changes');
    check('fs default has a .md file', !!md, firstMd || 'none');
  }
  {
    const { status, body } = await getJson('/api/fs?path=changes/git');
    check('fs subdir changes/git', status === 200 && body?.path === 'changes/git');
    check('fs reports parent', body?.parent === 'changes');
  }
  {
    const { status } = await getJson('/api/fs?path=' + encodeURIComponent('../../etc'));
    check('fs blocks path escape (400)', status === 400);
  }

  console.log('\n# /api/file/hashes');
  {
    const target = 'changes/existing-npi-update-primary-taxonomy.md';
    const { status, body } = await getJson('/api/file/hashes?path=' + encodeURIComponent(target));
    const hashes = body?.hashes || [];
    check('hashes 200', status === 200);
    check('hashes found (>=3)', hashes.length >= 3, `got ${hashes.length}`);
    check('hash has subject+shortHash', hashes[0] && !!hashes[0].subject && !!hashes[0].shortHash);
    check('hash has tags array', Array.isArray(hashes[0]?.tags));
  }
  {
    const tmpl = 'changes/_templates/_TEMPLATE_bugfix.md';
    const { body } = await getJson('/api/file/hashes?path=' + encodeURIComponent(tmpl));
    check('template yields 0 real hashes (shake case)', (body?.hashes || []).length === 0, `got ${(body?.hashes || []).length}`);
  }

  console.log('\n# /api/git/log + commit files');
  let logHash = null;
  {
    const { status, body } = await getJson('/api/git/log?limit=3');
    check('git log 200 + 3 commits', status === 200 && (body?.commits || []).length === 3);
    logHash = body?.commits?.[0]?.hash;
    check('commit has shortHash+subject', !!body?.commits?.[0]?.shortHash && !!body?.commits?.[0]?.subject);
    check('commit has tags array + fileCount', Array.isArray(body?.commits?.[0]?.tags) && typeof body?.commits?.[0]?.fileCount === 'number');
  }
  {
    const { status, body } = await getJson('/api/git/log?limit=3&q=' + encodeURIComponent('retrieve'));
    check('git log search (q=retrieve)', status === 200 && Array.isArray(body?.commits));
  }
  {
    const { status, body } = await getJson('/api/git/log?limit=5&since=2027-01-01');
    check('git log future since -> 0 commits', status === 200 && (body?.commits || []).length === 0);
  }
  {
    const { status, body } = await getJson('/api/git/log?limit=50&since=2020-01-01&until=2027-01-01');
    check('git log date window -> commits', status === 200 && (body?.commits || []).length > 0);
  }
  {
    const { status, body } = await getJson(`/api/git/commit/${logHash}/files`);
    check('commit files 200 + list', status === 200 && Array.isArray(body?.files));
    check('commit files have status+path', !body.files.length || (!!body.files[0].status && !!body.files[0].path));
    check('commit files have tag', !body.files.length || (body.files[0].tag && typeof body.files[0].tag.label === 'string'));
  }

  console.log('\n# /api/diff');
  {
    const { status, body } = await postJson('/api/diff', { selections: [{ hash: logHash }] });
    check('diff 200 + commit entry', status === 200 && (body?.commits || []).length === 1);
    check('diff returns unifiedDiff string', typeof body?.commits?.[0]?.unifiedDiff === 'string');
    check('diff commit has tags array', Array.isArray(body?.commits?.[0]?.tags));
  }
  {
    const { status } = await postJson('/api/diff', { selections: [] });
    check('diff empty -> 400', status === 400);
  }

  console.log('\n# /api/packagexml');
  {
    const files = [
      { path: 'force-app/main/default/classes/PRM_Foo.cls', status: 'M' },
      { path: 'force-app/main/default/classes/PRM_Foo.cls-meta.xml', status: 'M' },
      { path: 'force-app/main/default/objects/Account/fields/Bar__c.field-meta.xml', status: 'A' },
      { path: 'force-app/main/default/lwc/myCmp/myCmp.js', status: 'M' },
      { path: 'force-app/main/default/flexipages/My_Page.flexipage-meta.xml', status: 'M' },
      { path: 'force-app/main/default/layouts/Account-Account Layout.layout-meta.xml', status: 'M' },
      { path: 'force-app/main/default/omniScripts/PRM_A_B_English_1/PRM_A_B_English_1.os-meta.xml', status: 'M' },
      { path: 'force-app/main/default/triggers/OldTrigger.trigger', status: 'D' },
      { path: 'README.md', status: 'M' },
    ];
    const { status, body } = await postJson('/api/packagexml', { files, emitDestructive: true });
    const pkg = body?.packageXml || '';
    const dest = body?.destructiveXml || '';
    check('packagexml 200', status === 200);
    check('pkg has ApexClass:PRM_Foo (meta collapses)', pkg.includes('<name>ApexClass</name>') && pkg.includes('<members>PRM_Foo</members>'));
    check('pkg has CustomField Account.Bar__c', pkg.includes('<members>Account.Bar__c</members>') && pkg.includes('<name>CustomField</name>'));
    check('pkg has LightningComponentBundle:myCmp', pkg.includes('<members>myCmp</members>') && pkg.includes('<name>LightningComponentBundle</name>'));
    check('pkg has Layout with space preserved', pkg.includes('<members>Account-Account Layout</members>'));
    check('pkg has OmniScript:PRM_A_B_English_1', pkg.includes('<members>PRM_A_B_English_1</members>') && pkg.includes('<name>OmniScript</name>'));
    check('pkg version 66.0', pkg.includes('<version>66.0</version>'));
    check('deletion -> destructiveChanges (ApexTrigger:OldTrigger)', dest.includes('<members>OldTrigger</members>') && dest.includes('<name>ApexTrigger</name>'));
    check('deletion NOT in package.xml', !pkg.includes('OldTrigger'));
    check('README.md reported unmapped', (body?.unmapped || []).includes('README.md'));
    check('packagexml returns perFile', Array.isArray(body?.perFile) && body.perFile.length === files.length);
  }
  {
    const files = [{ path: 'force-app/main/default/siteDotComSites/ProviderIE1.site', status: 'M', type: 'SiteDotCom' }];
    const { status, body } = await postJson('/api/packagexml', { files, emitDestructive: false });
    const pkg = body?.packageXml || '';
    check('packagexml honors type override', status === 200 && pkg.includes('<name>SiteDotCom</name>') && pkg.includes('<members>ProviderIE1</members>'));
  }
  {
    const files = [
      { path: 'force-app/main/default/classes/PRM_Foo.cls', status: 'M' },
      { path: 'force-app/main/default/classes/PRM_Bar.cls', status: 'M' },
    ];
    const { status, body } = await postJson('/api/packagexml', { files, emitDestructive: false, excluded: ['force-app/main/default/classes/PRM_Bar.cls'] });
    const pkg = body?.packageXml || '';
    check('packagexml honors excluded', status === 200 && pkg.includes('<members>PRM_Foo</members>') && !pkg.includes('<members>PRM_Bar</members>'));
  }
} catch (e) {
  failed++;
  console.log('  FATAL ', e?.stack || e);
} finally {
  server.close();
  console.log(`\n==== smoke: ${passed} passed, ${failed} failed ====\n`);
  process.exit(failed ? 1 : 0);
}
