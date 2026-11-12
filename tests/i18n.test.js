// Verifies every translation key used in the source exists in both languages (and both dictionaries match).
const fs = require('fs'), path = require('path');
global.GF = {}; require('../js/core/i18n.js');
const { en, fa } = GF.i18n.dict;
const root = path.join(__dirname, '..');
const files = [];
(function walk(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (!/node_modules|vendor|\.git/.test(p)) walk(p); } else if (/\.(js|html)$/.test(f) && !/i18n\.js$/.test(f)) files.push(p); } })(root);
const used = new Set();
const prefixes = 'act p tb search sb proj drop grid m f op col fx tpl c dup cl st fr ro g v vk a agg cb imp paste exp fmt set help pal toast dlg tab wl need cmd theme rows'.split(' ');
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  for (const m of src.matchAll(/['"]([a-z]{1,6}(?:\.[A-Za-z0-9]+)+)['"]/g)) if (prefixes.includes(m[1].split('.')[0]) && !/\.(js|css|svg|json|html|csv|min)$/.test(m[1])) used.add(m[1]);
  for (const m of src.matchAll(/data-i18n(?:-ph|-title)?="([^"]+)"/g)) used.add(m[1]);
}
for (const o of ['contains', 'notcontains', 'equals', 'notequals', 'starts', 'ends', 'gt', 'gte', 'lt', 'lte', 'empty', 'notempty', 'regex', 'dupes', 'unique', 'invalid']) used.add('op.' + o);
for (const k of ['required', 'number', 'date', 'boolean', 'email', 'url', 'option', 'dup']) used.add('vk.' + k);
for (const k of ['count', 'sum', 'avg', 'min', 'max', 'median', 'unique']) used.add('agg.' + k);
for (const k of ['contacts', 'products', 'tasks', 'inventory', 'finance', 'employees']) used.add('tpl.' + k);
for (const k of ['both', 'onlyA', 'onlyB']) used.add('cb.set.' + k);
for (const k of ['columns', 'clean', 'fill', 'validate', 'analyze', 'combine']) used.add('p.' + k);
for (const k of ['dark', 'light', 'midnight', 'forest', 'sunset', 'ivory', 'ocean']) used.add('theme.' + k);
let bad = 0;
for (const k of [...used].filter((k) => !k.endsWith('.')).sort()) {
  if (!(k in en)) { console.log('missing EN:', k); bad++; }
  if (!(k in fa)) { console.log('missing FA:', k); bad++; }
}
for (const k of Object.keys(en)) if (!(k in fa)) { console.log('FA lacks:', k); bad++; }
for (const k of Object.keys(fa)) if (!(k in en)) { console.log('EN lacks:', k); bad++; }
console.log(bad ? `i18n: ${bad} problem(s)` : `i18n OK — ${Object.keys(en).length} keys, ${used.size} referenced`);
process.exit(bad ? 1 : 0);
