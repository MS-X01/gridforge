// `npm test` — unit + i18n tests (no browser). Run `npm run test:e2e` for the Playwright suite.
const { spawnSync } = require('child_process');
let bad = 0;
for (const f of ['unit.test.js', 'i18n.test.js']) { const r = spawnSync(process.execPath, [__dirname + '/' + f], { stdio: 'inherit' }); if (r.status) bad++; }
process.exit(bad ? 1 : 0);
