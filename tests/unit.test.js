// Unit tests for the pure engine (no browser needed):  node tests/unit.test.js
const assert = require('assert');
globalThis.localStorage = undefined;
for (const f of ['core/utils', 'core/store', 'engine/parse', 'engine/formula', 'engine/ops', 'engine/generate', 'engine/analyze', 'engine/export', 'engine/templates']) require('../js/' + f + '.js');
const GF = globalThis.GF, S = GF.store, io = GF.io, ops = GF.ops, u = GF.u;
let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log('  ok  ' + name); } catch (e) { console.log('FAIL  ' + name + '\n      ' + e.message); process.exitCode = 1; } };
const mk = (csv, o) => { const p = io.parseAny(csv, 'csv', o); return io.toSheet('T', p.sheets[0].rows); };

t('delimiter detection (; , tab |)', () => { for (const [d, s] of [[';', 'a;b;c\n1;2;3'], [',', 'a,b,c\n1,2,3'], ['\t', 'a\tb\tc\n1\t2\t3'], ['|', 'a|b|c\n1|2|3']]) assert.strictEqual(io.detectDelimiter(s), d); });
t('quoted fields, escaped quotes, embedded newlines', () => { const r = io.parseDelimited('a,b\n"x,1","he said ""hi"""\n"line1\nline2",z\n', ','); assert.deepStrictEqual(r[1], ['x,1', 'he said "hi"']); assert.strictEqual(r[2][0], 'line1\nline2'); });
t('Persian digits → numbers', () => { assert.strictEqual(u.num('۱٬۲۳۴٫۵'), 1234.5); assert.ok(u.isNum('۲۰')); assert.ok(!u.isNum('abc')); });
t('type detection', () => { const s = mk('n,e,d,b,t\n1,a@b.co,2024-01-02,yes,hello\n2,c@d.io,2024-02-03,no,world\n'); assert.deepStrictEqual(s.cols.map((c) => c.type), ['number', 'email', 'date', 'boolean', 'text']); });
t('windows-1256 auto decode', () => { const bytes = Buffer.from([0xe3, 0xd1, 0xcd, 0xc8, 0xc7]); assert.strictEqual(io.decode(bytes, 'auto'), 'مرحبا'); });
t('duplicates: ignore case/space, keep first/last/none', () => {
  const mkd = () => mk('k,v\nAli,1\n ali ,2\nSara,3\nALI,4\n');
  const o = { cols: [0], ic: true, trim: true, skipEmpty: true };
  let s = mkd(); assert.strictEqual(ops.dupInfo(s, o).extra, 2);
  ops.removeDuplicates(s, { ...o, keep: 'first' }); assert.deepStrictEqual(s.rows.map((r) => r[1]), ['1', '3']);
  s = mkd(); ops.removeDuplicates(s, { ...o, keep: 'last' }); assert.deepStrictEqual(s.rows.map((r) => r[1]), ['3', '4']);
  s = mkd(); ops.removeDuplicates(s, { ...o, keep: 'none' }); assert.deepStrictEqual(s.rows.map((r) => r[1]), ['3']);
});
t('filters + search + multi-sort', () => {
  const s = mk('name,age\nb,30\na,30\nc,10\nd,\n'); S.wb.sheets = [s]; S.wb.active = 0;
  s.view.filters = [{ col: 1, op: 'gte', val: '10' }]; assert.strictEqual(ops.computeView(s).length, 3);
  s.view.filters = []; s.view.sort = [{ col: 1, dir: 'desc' }, { col: 0, dir: 'asc' }]; assert.deepStrictEqual(ops.computeView(s), [1, 0, 2, 3]);
  s.view.sort = []; s.view.q = 'A'; assert.strictEqual(ops.computeView(s).length, 1);
  s.view.q = '^[ab]$'; s.view.rx = true; assert.strictEqual(ops.computeView(s).length, 2);
});
t('text transforms (Persian chars, digits, collapse)', () => {
  const T = ops.TRANSFORMS; assert.strictEqual(T.faChars('علي كتاب'), 'علی کتاب'); assert.strictEqual(T.enDigits('۱۲۳'), '123'); assert.strictEqual(T.faDigits('45'), '۴۵'); assert.strictEqual(T.collapse('  a   b '), 'a b'); assert.strictEqual(T.title('hello WORLD'), 'Hello World');
});
t('fill empty: down / mean / mode', () => {
  let s = mk('a,z\n1,x\n,x\n,x\n3,x\n'); ops.fillEmpty(s, 0, 'down'); assert.deepStrictEqual(s.rows.map((r) => r[0]), ['1', '1', '1', '3']);
  s = mk('a,z\n1,x\n,x\n3,x\n'); ops.fillEmpty(s, 0, 'mean'); assert.strictEqual(s.rows[1][0], '2');
  s = mk('a,z\nx,1\nx,1\n,1\ny,1\n'); ops.fillEmpty(s, 0, 'mode'); assert.strictEqual(s.rows[2][0], 'x');
});
t('split / merge columns', () => {
  const s = mk('full\nJohn Smith\nAnn Lee Roe\n'); assert.strictEqual(ops.splitColumn(s, 0, { delim: ' ', trim: true, keep: true }), 3); assert.deepStrictEqual(s.rows[0].slice(1), ['John', 'Smith', '']);
  ops.mergeColumns(s, [1, 2], { sep: '-', name: 'm', skipEmpty: true }); assert.strictEqual(s.rows[1][3], 'Ann-Lee');
});
t('find & replace: plain, regex with groups, whole-cell', () => {
  let s = mk('a\nfoo.bar\nFOO\n'); assert.strictEqual(ops.findReplace(s, { find: 'foo.', rep: 'X', rx: false, cs: false }), 1); assert.strictEqual(s.rows[0][0], 'Xbar');
  s = mk('a\nab12\n'); ops.findReplace(s, { find: '([a-z]+)(\\d+)', rep: '$2$1', rx: true, cs: false }); assert.strictEqual(s.rows[0][0], '12ab');
  s = mk('a\nx\nxx\n'); assert.strictEqual(ops.findReplace(s, { find: 'x', rep: 'y', whole: true }), 1);
});
t('formulas: arithmetic, IF, text, errors, safety', () => {
  const s = mk('Price,Qty,Name\n10,3,ann\n5,0,bob\n'), names = s.cols.map((c) => c.name);
  const f = (e, r = 0) => GF.formula.compile(e, names)(s.rows[r], r);
  assert.strictEqual(f('=[Price]*[Qty]+1'), '31'); assert.strictEqual(f('=IF([Price]*[Qty]>20,"big","small")'), 'big'); assert.strictEqual(f('=UPPER([Name]) & "-" & ROW()'), 'ANN-1'); assert.strictEqual(f('=[Price]/[Qty]', 1), '#DIV/0!'); assert.strictEqual(f('=2^3^2'), '512');
  assert.throws(() => GF.formula.compile('=alert(1)', names)); assert.throws(() => GF.formula.compile('=[Nope]', names)); assert.throws(() => GF.formula.compile('=constructor.constructor("x")()', names));
});
t('validation rules', () => {
  const s = mk('e,n\na@b.co,1\nbad,x\n'); s.cols[0].type = 'email'; s.cols[1].type = 'number'; s.cols[0].required = true; const v = ops.validate(s); assert.strictEqual(v.total, 2);
  assert.strictEqual(ops.cellIssue({ type: 'select', options: 'A,B' }, 'C'), 'option');
});
t('stats + groupBy', () => {
  const s = mk('c,v\na,1\na,3\nb,10\n'); const st = ops.columnStats(s, 1); assert.strictEqual(st.mean, 14 / 3); assert.strictEqual(st.median, 3); assert.strictEqual(st.max, 10);
  assert.deepStrictEqual(ops.groupBy(s, { by: 0, val: 1, agg: 'sum' }).map((x) => [x.key, x.value]), [['b', 10], ['a', 4]]);
});
t('join / set operations / append', () => {
  const a = mk('id,x\n1,a\n2,b\n3,c\n'), b = mk('id,y\n2,B\n3,C\n4,D\n');
  assert.strictEqual(ops.join(a, b, 0, 0, 'left').rows.length, 3); assert.strictEqual(ops.join(a, b, 0, 0, 'inner').rows.length, 2); assert.strictEqual(ops.join(a, b, 0, 0, 'full').rows.length, 4);
  assert.deepStrictEqual(ops.setOp(a, b, 0, 0, 'onlyA').rows.map((r) => r[0]), ['1']); assert.deepStrictEqual(ops.setOp(a, b, 0, 0, 'onlyB').rows.map((r) => r[0]), ['4']);
  ops.appendSheets(a, b); assert.strictEqual(a.rows.length, 6); assert.ok(a.cols.some((c) => c.name === 'y'));
});
t('exports: csv quoting, json types, sql escaping, markdown, xml', () => {
  const s = mk('a,b\n"x,y",5\n"it\'s",\n'); s.cols[1].type = 'number';
  assert.ok(io.build('csv', s, { scope: 'all', bom: false }).startsWith('a,b\r\n"x,y",5')); assert.deepStrictEqual(JSON.parse(io.build('json', s, { scope: 'all' }))[1], { a: "it's", b: null });
  assert.ok(io.build('sql', s, { scope: 'all' }).includes("'it''s'")); assert.ok(io.build('md', s, { scope: 'all' }).includes('---:')); assert.ok(io.build('xml', s, { scope: 'all' }).includes('<a>x,y</a>'));
});
t('undo / redo + view stability on cell edit', () => {
  const s = mk('a\n1\n2\n'); S.wb = { name: '', sheets: [s], active: 0 }; S.clearHistory();
  S.commit((x) => { x.rows[0][0] = '9'; }); assert.strictEqual(s.rows[0][0], '9'); S.undo(); assert.strictEqual(S.sheet().rows[0][0], '1'); S.redo(); assert.strictEqual(S.sheet().rows[0][0], '9');
});
t('generators: sequence, pattern, seeded random reproducible', () => {
  const s = mk('a,z\n,1\n,1\n,1\n'); ops.generate(s, 0, 'pattern', { pattern: 'ID-{nn}' }); assert.deepStrictEqual(s.rows.map((r) => r[0]), ['ID-001', 'ID-002', 'ID-003']);
  const a = mk('a,z\n,1\n,1\n'), b = mk('a,z\n,1\n,1\n'); ops.generate(a, 0, 'ints', { seed: 5, min: 0, max: 1e6 }); ops.generate(b, 0, 'ints', { seed: 5, min: 0, max: 1e6 }); assert.deepStrictEqual(a.rows, b.rows);
});
console.log(`\n${n} tests run${process.exitCode ? ' — FAILURES above' : ' — all passed'}`);
