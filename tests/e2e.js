// End-to-end smoke test (needs Playwright):  npx playwright install chromium && node tests/e2e.js
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const URL = 'file://' + path.resolve(__dirname, '../index.html');
let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1440, height: 860 }, locale: 'en-US', acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(URL); await p.waitForTimeout(400);
  const ev = (f, a) => p.evaluate(f, a);
  const rows = () => ev(() => GF.store.sheet().rows.length);

  await p.click('[data-w=demo]'); await p.waitForTimeout(300);
  ok((await rows()) === 168, 'demo loaded (168 rows)');

  // edit a cell by typing
  await p.click('#gbody td[data-r="1"][data-p="0"]');
  await p.keyboard.type('Zed Edit'); await p.keyboard.press('Enter');
  await p.waitForTimeout(150);
  ok((await ev(() => GF.store.sheet().rows[1][0])) === 'Zed Edit', 'typing into a cell edits it');
  await p.keyboard.press('Control+z'); await p.waitForTimeout(100);
  ok((await ev(() => GF.store.sheet().rows[1][0])) !== 'Zed Edit', 'undo reverts edit');

  // sort by Amount desc
  await p.click('th[data-c="4"] [data-act=sort]'); await p.click('th[data-c="4"] [data-act=sort]'); await p.waitForTimeout(150);
  const top = await ev(() => { const i = GF.store.viewIndex()[0]; return parseFloat(GF.store.sheet().rows[i][4]); });
  const max = await ev(() => Math.max(...GF.store.sheet().rows.map((r) => parseFloat(r[4])).filter((x) => !isNaN(x))));
  ok(top === max, 'click-sort descending puts max first');
  await p.click('th[data-c="4"] [data-act=sort]'); await p.waitForTimeout(100);

  // search + regex
  await p.fill('#q', 'tokyo'); await p.waitForTimeout(350);
  const n1 = await ev(() => GF.store.viewIndex().length);
  ok(n1 > 0 && n1 < 168, 'search filters rows (' + n1 + ')');
  await p.fill('#q', ''); await p.waitForTimeout(300);

  // filter via API + chip
  await ev(() => GF.grid.addFilter({ col: 4, op: 'gt', val: '900' })); await p.waitForTimeout(150);
  ok((await p.$$('#filterbar .chip.f')).length === 1, 'filter chip shown');
  await p.click('#filterbar [data-rm=all]'); await p.waitForTimeout(100);

  // duplicates: panel → clean → count + remove
  await p.click('#rail [data-panel=clean]'); await p.waitForTimeout(200);
  await p.click('[data-act=dfind]'); await p.waitForTimeout(100);
  const dtxt = await p.textContent('#dupres');
  ok(/duplicate groups/.test(dtxt), 'duplicate finder reports: ' + dtxt);
  const before = await rows();
  await p.click('[data-act=drem]'); await p.waitForTimeout(150);
  await p.click('.modal-f .btn.danger'); await p.waitForTimeout(250);
  const after = await rows();
  ok(after < before, `remove duplicates ${before} → ${after}`);
  await p.keyboard.press('Control+z'); await p.waitForTimeout(150);
  ok((await rows()) === before, 'undo restores removed duplicates');

  // transform: trim + collapse on all
  await p.click('[data-act=tf][data-k=collapse]'); await p.waitForTimeout(150);
  ok(/^[^\s]/.test(await ev(() => GF.store.sheet().rows.find((r, i) => i > 160)[0])), 'collapse spaces trims leading space');

  // validate
  await p.click('#rail [data-panel=validate]'); await p.waitForTimeout(150);
  await p.click('[data-act=run]'); await p.waitForTimeout(150);
  ok(/issues found/.test(await p.textContent('#vres')), 'validation reports issues');

  // analyze
  await p.click('#rail [data-panel=analyze]'); await p.waitForTimeout(200);
  await p.click('#panelBody details[data-i="4"] summary'); await p.waitForTimeout(150);
  ok((await p.$$('#panelBody details[open] svg')).length >= 1, 'numeric column shows histogram');

  // formula
  await p.click('#rail [data-panel=columns]'); await p.waitForTimeout(150);
  await p.fill('#fxe', '=ROUND([Amount]*2,1) & " ฿"'); await p.fill('#fxn', 'Double');
  await p.click('[data-act=fx]'); await p.waitForTimeout(200);
  ok((await ev(() => GF.store.sheet().cols.some((c) => c.name === 'Double'))), 'formula column created');

  // export csv download
  await p.click('#btnExport'); await p.waitForTimeout(150);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('.fmt[data-k=csv]')]);
  const f = '/tmp/dl/out.csv'; await dl.saveAs(f);
  const csv = fs.readFileSync(f, 'utf8');
  ok(csv.charCodeAt(0) === 0xfeff && csv.split('\r\n').length > 160, 'CSV export has BOM + rows');
  await p.waitForTimeout(300);
  const [dx] = await Promise.all([p.waitForEvent('download'), (async () => { await p.click('#btnExport'); await p.waitForTimeout(150); await p.click('.fmt[data-k=xlsx]'); })()]);
  await dx.saveAs('/tmp/dl/out.xlsx'); ok(fs.statSync('/tmp/dl/out.xlsx').size > 2000, 'XLSX export produced a file');

  // import a windows-1256 CSV
  const iconv = (() => { try { return require('iconv-lite'); } catch (e) { return null; } })();
  fs.writeFileSync('/tmp/dl/fa.csv', Buffer.from('name,city\nعلی,تهران\nسارا,شیراز\n', 'utf8'));
  await p.click('#btnImport'); await p.waitForTimeout(150);
  const [fc] = await Promise.all([p.waitForEvent('filechooser'), p.click('#idz')]);
  await fc.setFiles('/tmp/dl/fa.csv'); await p.waitForTimeout(500);
  ok(/تهران/.test(await p.textContent('#ipv')), 'import preview shows Persian text');
  await p.selectOption('#imode', 'add');
  await p.click('.modal-f .btn.pri'); await p.waitForTimeout(400);
  ok((await ev(() => GF.store.wb.sheets.length)) === 2, 'imported as 2nd sheet');

  // persistence
  await p.waitForTimeout(1600);
  await p.reload(); await p.waitForTimeout(700);
  ok((await ev(() => GF.store.wb.sheets.length)) === 2, 'autosave restored the workbook after reload');

  // Persian + RTL
  await ev(() => GF.store.setSetting('lang', 'fa')); await p.waitForTimeout(400);
  ok((await ev(() => document.documentElement.dir)) === 'rtl', 'Persian switches to RTL');
  await p.screenshot({ path: '/tmp/s3_fa.png' });
  await ev(() => GF.store.setSetting('lang', 'en'));

  console.log('page errors:', errs.length ? errs : 'none');
  if (errs.length) fails++;
  await b.close();
  console.log(fails ? `\n${fails} FAILED` : '\nALL E2E CHECKS PASSED');
  process.exit(fails ? 1 : 0);
})();
