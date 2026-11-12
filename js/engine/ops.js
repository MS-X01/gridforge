/* GridForge — ops.js : filtering, searching, sorting, duplicates and cleaning primitives.
   Everything here works on plain sheet objects ({cols, rows, view}) and mutates them in place,
   so it can be unit-tested in Node and wrapped by the UI in an undo-able commit. */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;
  const ops = (GF.ops = GF.ops || {});
  const S = () => GF.store;
  const str = (v) => (v == null ? '' : String(v));

  /* ═════════ filters ═════════ */
  ops.FILTER_OPS = ['contains', 'notcontains', 'equals', 'notequals', 'starts', 'ends', 'gt', 'gte', 'lt', 'lte', 'empty', 'notempty', 'regex', 'dupes', 'unique', 'invalid'];
  ops.NO_VALUE_OPS = ['empty', 'notempty', 'dupes', 'unique', 'invalid'];

  ops.makePred = (sh, f) => {
    const c = f.col, col = sh.cols[c], val = str(f.val), lv = val.toLowerCase();
    const useNum = ['gt', 'gte', 'lt', 'lte', 'equals', 'notequals'].includes(f.op) && u.isNum(val);
    const useDate = col && col.type === 'date' && u.isDate(val) && ['gt', 'gte', 'lt', 'lte'].includes(f.op);
    const nv = u.num(val), dv = u.dateKey(val);
    let re = null, set = null;
    if (f.op === 'regex') { try { re = new RegExp(val, 'i'); } catch (e) { re = null; } }
    if (f.op === 'dupes' || f.op === 'unique') set = ops.dupInfo(sh, { cols: [c], ic: true, trim: true, skipEmpty: false }).all;
    return (row, i) => {
      const raw = str(row[c]), s = raw.toLowerCase();
      switch (f.op) {
        case 'contains': return s.includes(lv);
        case 'notcontains': return !s.includes(lv);
        case 'equals': return useNum && u.isNum(raw) ? u.num(raw) === nv : s.trim() === lv.trim();
        case 'notequals': return useNum && u.isNum(raw) ? u.num(raw) !== nv : s.trim() !== lv.trim();
        case 'starts': return s.startsWith(lv);
        case 'ends': return s.endsWith(lv);
        case 'empty': return raw.trim() === '';
        case 'notempty': return raw.trim() !== '';
        case 'regex': return !!re && re.test(raw);
        case 'dupes': return set.has(i);
        case 'unique': return !set.has(i);
        case 'invalid': return !!ops.cellIssue(col, raw);
        default: {
          let a, b;
          if (useDate) { a = u.dateKey(raw); b = dv; } else if (useNum) { a = u.num(raw); b = nv; } else return false;
          if (isNaN(a)) return false;
          return f.op === 'gt' ? a > b : f.op === 'gte' ? a >= b : f.op === 'lt' ? a < b : a <= b;
        }
      }
    };
  };

  /** search → {test, hl} regexes (hl is global, for highlighting) or null / {bad:true} */
  ops.searchRe = (v) => {
    if (!v || !v.q) return null;
    try {
      const src = v.rx ? v.q : u.escRe(v.q);
      return { test: new RegExp(src, v.cs ? '' : 'i'), hl: new RegExp(src, v.cs ? 'g' : 'gi') };
    } catch (e) { return { bad: true }; }
  };

  /* ═════════ sorting ═════════ */
  const keyFn = (col) => {
    if (col.type === 'number') return (v) => { const n = u.num(v); return isNaN(n) ? null : n; };
    if (col.type === 'date') return (v) => { const n = u.dateKey(v); return isNaN(n) ? null : n; };
    if (col.type === 'boolean') return (v) => (u.isEmpty(v) ? null : u.boolVal(v) ? 1 : 0);
    return (v) => (u.isEmpty(v) ? null : str(v).trim());
  };
  ops.sortIdx = (sh, idx, spec) => {
    if (!spec || !spec.length) return idx;
    const keys = spec.map((s) => { const f = keyFn(sh.cols[s.col]), k = new Array(sh.rows.length); for (const i of idx) k[i] = f(sh.rows[i][s.col]); return k; });
    idx.sort((a, b) => {
      for (let j = 0; j < spec.length; j++) {
        const x = keys[j][a], y = keys[j][b];
        if (x === y) continue;
        if (x === null) return 1;
        if (y === null) return -1;
        const c = typeof x === 'number' ? x - y : u.cmpText(x, y);
        if (c) return spec[j].dir === 'desc' ? -c : c;
      }
      return a - b;
    });
    return idx;
  };

  ops.computeView = (sh) => {
    const v = sh.view, rows = sh.rows;
    const preds = v.filters.map((f) => ops.makePred(sh, f));
    const sr = ops.searchRe(v);
    const scan = v.scol >= 0 ? [v.scol] : sh.cols.map((_, i) => i).filter((i) => !sh.cols[i].hidden);
    const idx = [];
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      let ok = true;
      for (let p = 0; p < preds.length; p++) if (!preds[p](r, i)) { ok = false; break; }
      if (ok && sr) {
        if (sr.bad) ok = false;
        else { ok = false; for (let k = 0; k < scan.length; k++) if (sr.test.test(str(r[scan[k]]))) { ok = true; break; } }
      }
      if (ok) idx.push(i);
    }
    return ops.sortIdx(sh, idx, v.sort);
  };

  /* ═════════ duplicates ═════════ */
  ops.keyOf = (row, cols, o) => cols.map((c) => {
    let s = str(row[c]);
    if (o.trim) s = s.trim().replace(/\s+/g, ' ');
    if (o.ic) s = s.toLowerCase();
    return u.toEnDigits(s);
  }).join('\u0001');

  /** returns {all:Set(every row in a dup group), later:Set(all but first), groups, groupCount, extra} */
  ops.dupInfo = (sh, o) => {
    const groups = new Map();
    for (let i = 0; i < sh.rows.length; i++) {
      const row = sh.rows[i];
      if (o.skipEmpty && o.cols.every((c) => u.isEmpty(row[c]))) continue;
      const k = ops.keyOf(row, o.cols, o);
      const g = groups.get(k);
      if (g) g.push(i); else groups.set(k, [i]);
    }
    const all = new Set(), later = new Set();
    let groupCount = 0;
    groups.forEach((g) => { if (g.length > 1) { groupCount++; g.forEach((i) => all.add(i)); for (let j = 1; j < g.length; j++) later.add(g[j]); } });
    return { all, later, groups, groupCount, extra: later.size };
  };
  let dupCache = null;
  ops.dupHighlightSet = (sh) => {
    const d = sh.view.dups;
    if (!d) return null;
    const key = sh.id + '|' + S().ver + '|' + JSON.stringify(d);
    if (dupCache && dupCache.key === key) return dupCache.set;
    const set = ops.dupInfo(sh, { cols: d.cols, ic: d.ic, trim: d.trim, skipEmpty: true }).all;
    dupCache = { key, set };
    return set;
  };
  /** remove duplicates; keep 'first' | 'last' | 'none' (remove every member of a dup group). returns removed rows */
  ops.removeDuplicates = (sh, o) => {
    const info = ops.dupInfo(sh, o);
    const rm = new Set();
    info.groups.forEach((g) => {
      if (g.length < 2) return;
      if (o.keep === 'last') g.slice(0, -1).forEach((i) => rm.add(i));
      else if (o.keep === 'none') g.forEach((i) => rm.add(i));
      else g.slice(1).forEach((i) => rm.add(i));
    });
    const removed = [];
    sh.rows = sh.rows.filter((r, i) => (rm.has(i) ? (removed.push(r), false) : true));
    return removed;
  };

  /* ═════════ row / column primitives ═════════ */
  ops.deleteRows = (sh, set) => { const n = sh.rows.length; sh.rows = sh.rows.filter((_, i) => !set.has(i)); return n - sh.rows.length; };
  ops.keepRows = (sh, set) => { const n = sh.rows.length; sh.rows = sh.rows.filter((_, i) => set.has(i)); return n - sh.rows.length; };
  ops.insertRows = (sh, at, n = 1) => {
    const mk = () => sh.cols.map((c) => c.def || '');
    const add = Array.from({ length: n }, mk);
    sh.rows.splice(Math.max(0, Math.min(at, sh.rows.length)), 0, ...add);
  };
  ops.duplicateRows = (sh, idxs) => { [...idxs].sort((a, b) => b - a).forEach((i) => sh.rows.splice(i + 1, 0, sh.rows[i].slice())); };
  ops.insertCol = (sh, at, o = {}) => {
    const col = S().mkCol(o);
    col.name = u.uniqueName(col.name, sh.cols.map((c) => c.name));
    at = Math.max(0, Math.min(at, sh.cols.length));
    sh.cols.splice(at, 0, col);
    sh.rows.forEach((r) => r.splice(at, 0, o.fill ? o.fill(r) : col.def || ''));
    return col;
  };
  ops.deleteCols = (sh, idxs) => {
    const set = new Set(idxs);
    sh.cols = sh.cols.filter((_, i) => !set.has(i));
    sh.rows.forEach((r, k) => { sh.rows[k] = r.filter((_, i) => !set.has(i)); });
  };
  ops.moveCol = (sh, from, to) => {
    if (from === to) return;
    const [c] = sh.cols.splice(from, 1); sh.cols.splice(to, 0, c);
    sh.rows.forEach((r) => { const [v] = r.splice(from, 1); r.splice(to, 0, v); });
  };
  ops.duplicateCol = (sh, i) => ops.insertCol(sh, i + 1, { ...sh.cols[i], name: sh.cols[i].name + ' copy', fill: (r) => r[i] });
  ops.removeEmptyRows = (sh) => { const n = sh.rows.length; sh.rows = sh.rows.filter((r) => r.some((v) => !u.isEmpty(v))); return n - sh.rows.length; };
  ops.removeEmptyCols = (sh) => {
    const drop = sh.cols.map((_, i) => i).filter((i) => sh.rows.every((r) => u.isEmpty(r[i])));
    if (drop.length && drop.length < sh.cols.length) ops.deleteCols(sh, drop);
    return drop.length < sh.cols.length ? drop.length : 0;
  };
  ops.shuffleRows = (sh, rnd = Math.random) => { for (let i = sh.rows.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [sh.rows[i], sh.rows[j]] = [sh.rows[j], sh.rows[i]]; } };
  /** make the current sort permanent (all rows, filters ignored) */
  ops.sortAll = (sh) => {
    const idx = ops.sortIdx(sh, sh.rows.map((_, i) => i), sh.view.sort);
    sh.rows = idx.map((i) => sh.rows[i]);
  };

  /* ═════════ cell transforms ═════════ */
  const NONPRINT = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B\u200E\u200F\u202A-\u202E\u2060\uFEFF]/g;
  ops.TRANSFORMS = {
    trim: (s) => s.trim(),
    collapse: (s) => s.trim().replace(/\s+/g, ' '),
    upper: (s) => s.toUpperCase(),
    lower: (s) => s.toLowerCase(),
    title: (s) => u.titleCase(s),
    enDigits: (s) => u.toEnDigits(s).replace(/٫/g, '.').replace(/٬/g, ','),
    faDigits: (s) => u.toFaDigits(s),
    faChars: (s) => s.replace(/[يى]/g, 'ی').replace(/ك/g, 'ک'),
    diacritics: (s) => s.replace(/[\u064B-\u065F\u0670\u0640]/g, ''),
    nonPrint: (s) => s.replace(NONPRINT, ''),
    stripHtml: (s) => s.replace(/<[^>]*>/g, ''),
    stripPunct: (s) => s.replace(/[\p{P}\p{S}]/gu, ''),
    digitsOnly: (s) => u.toEnDigits(s).replace(/\D/g, ''),
    stripSpaces: (s) => s.replace(/\s+/g, ''),
  };
  /** apply fn(string)→string to cols (indices) on rows (Set of row idx, or null = all). returns changed count */
  ops.mapCells = (sh, cols, fn, rowSet) => {
    let n = 0;
    for (let i = 0; i < sh.rows.length; i++) {
      if (rowSet && !rowSet.has(i)) continue;
      const r = sh.rows[i];
      for (const c of cols) { const o = str(r[c]), v = fn(o); if (v !== o) { r[c] = v; n++; } }
    }
    return n;
  };

  ops.fillEmpty = (sh, c, mode, value, rowSet) => {
    const rows = sh.rows;
    let n = 0;
    const setv = (i, v) => { rows[i][c] = v; n++; };
    if (mode === 'down' || mode === 'up') {
      let last = null;
      const it = mode === 'down' ? (f) => { for (let i = 0; i < rows.length; i++) f(i); } : (f) => { for (let i = rows.length - 1; i >= 0; i--) f(i); };
      it((i) => { if (u.isEmpty(rows[i][c])) { if (last !== null && (!rowSet || rowSet.has(i))) setv(i, last); } else last = rows[i][c]; });
      return n;
    }
    let fillV = value;
    if (mode === 'mean' || mode === 'median') {
      const nums = rows.map((r) => u.num(r[c])).filter((x) => !isNaN(x)).sort((a, b) => a - b);
      if (!nums.length) return 0;
      fillV = String(mode === 'mean' ? Math.round((nums.reduce((s, x) => s + x, 0) / nums.length) * 1e6) / 1e6 : nums.length % 2 ? nums[(nums.length - 1) / 2] : (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2);
    } else if (mode === 'mode') {
      const cnt = new Map();
      rows.forEach((r) => { if (!u.isEmpty(r[c])) cnt.set(r[c], (cnt.get(r[c]) || 0) + 1); });
      let best = null, bc = 0;
      cnt.forEach((k, v) => { if (k > bc) { bc = k; best = v; } });
      if (best === null) return 0;
      fillV = best;
    }
    for (let i = 0; i < rows.length; i++) if (u.isEmpty(rows[i][c]) && (!rowSet || rowSet.has(i))) setv(i, str(fillV));
    return n;
  };

  ops.splitColumn = (sh, c, o) => {
    const parts = sh.rows.map((r) => {
      const s = str(r[c]);
      let p = o.regex ? s.split(new RegExp(o.delim)) : s.split(o.delim);
      if (o.max && p.length > o.max) p = [...p.slice(0, o.max - 1), p.slice(o.max - 1).join(o.regex ? ' ' : o.delim)];
      return o.trim ? p.map((x) => x.trim()) : p;
    });
    const w = parts.reduce((m, p) => Math.max(m, p.length), 0);
    if (w < 2) return 0;
    const base = sh.cols[c].name;
    for (let k = 0; k < w; k++) {
      ops.insertCol(sh, c + 1 + k, { name: base + ' ' + (k + 1), type: 'text', fill: null });
    }
    sh.rows.forEach((r, i) => { for (let k = 0; k < w; k++) r[c + 1 + k] = parts[i][k] || ''; });
    if (!o.keep) ops.deleteCols(sh, [c]);
    return w;
  };
  ops.mergeColumns = (sh, cols, o) => {
    const last = Math.max(...cols);
    const col = ops.insertCol(sh, last + 1, { name: o.name || cols.map((c) => sh.cols[c].name).join(' + '), type: 'text', fill: null });
    const pos = sh.cols.indexOf(col);
    sh.rows.forEach((r) => {
      const vals = cols.map((c) => str(r[c])).filter((v) => !o.skipEmpty || v.trim() !== '');
      r[pos] = vals.join(o.sep);
    });
    if (o.remove) ops.deleteCols(sh, cols);
    return col;
  };

  ops.buildFinder = (o) => {
    const src = o.rx ? o.find : u.escRe(o.find);
    return new RegExp(o.whole ? '^\\s*(?:' + src + ')\\s*$' : src, o.cs ? 'g' : 'gi');
  };
  ops.findReplace = (sh, o) => {
    const re = ops.buildFinder(o);
    const cols = o.cols && o.cols.length ? o.cols : sh.cols.map((_, i) => i);
    const rep = o.rx ? o.rep : o.rep.replace(/\$/g, '$$$$');
    let n = 0;
    for (let i = 0; i < sh.rows.length; i++) {
      if (o.rows && !o.rows.has(i)) continue;
      for (const c of cols) {
        const old = str(sh.rows[i][c]);
        re.lastIndex = 0;
        if (!re.test(old)) continue;
        re.lastIndex = 0;
        const nv = old.replace(re, rep);
        if (nv !== old) { sh.rows[i][c] = nv; n++; }
      }
    }
    return n;
  };
  ops.countMatches = (sh, o) => {
    const re = ops.buildFinder(o);
    const cols = o.cols && o.cols.length ? o.cols : sh.cols.map((_, i) => i);
    let n = 0;
    for (const r of sh.rows) for (const c of cols) { re.lastIndex = 0; if (re.test(str(r[c]))) n++; }
    return n;
  };

  /** normalise a column's values to its declared type and set the type */
  ops.convertColumn = (sh, c, type) => {
    let n = 0;
    const fn = {
      number: (s) => { const x = u.num(s); return isNaN(x) ? s : String(x); },
      boolean: (s) => (u.isBool(s) ? (u.boolVal(s) ? 'true' : 'false') : s),
      date: (s) => { const t = u.toEnDigits(s).trim(), m = t.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/); return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : s; },
    }[type];
    if (fn) n = ops.mapCells(sh, [c], fn);
    sh.cols[c].type = type;
    return n;
  };

  /** computed column from a formula. mode: 'new' (insert after `after`) | 'overwrite' (column `target`) */
  ops.applyFormula = (sh, expr, o) => {
    const fx = GF.formula.compile(expr, sh.cols.map((c) => c.name));
    const out = sh.rows.map((r, i) => fx(r, i));
    if (o.target != null && o.target >= 0) { out.forEach((v, i) => { sh.rows[i][o.target] = v; }); return o.target; }
    const col = ops.insertCol(sh, o.after == null ? sh.cols.length : o.after + 1, { name: o.name || 'Formula', type: 'text' });
    const pos = sh.cols.indexOf(col);
    out.forEach((v, i) => { sh.rows[i][pos] = v; });
    col.type = u.detectType(out);
    return pos;
  };
})(typeof window !== 'undefined' ? window : globalThis);
