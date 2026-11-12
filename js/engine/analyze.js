/* GridForge — analyze.js : validation, statistics, group-by, join/append/set operations */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;
  const ops = (GF.ops = GF.ops || {});
  const str = (v) => (v == null ? '' : String(v));

  /* ═════════ validation ═════════ */
  /** returns an issue code or null. codes: required | number | date | boolean | email | url | option */
  ops.cellIssue = (col, v) => {
    const s = str(v);
    if (u.isEmpty(s)) return col.required ? 'required' : null;
    switch (col.type) {
      case 'number': return u.isNum(s) ? null : 'number';
      case 'date': return u.isDate(s) ? null : 'date';
      case 'boolean': return u.isBool(s) ? null : 'boolean';
      case 'email': return u.isEmail(s) ? null : 'email';
      case 'url': return u.isURL(s) ? null : 'url';
      case 'select': { const o = str(col.options).split(',').map((x) => x.trim()).filter(Boolean); return !o.length || o.includes(s.trim()) ? null : 'option'; }
      default: return null;
    }
  };
  /** → [{col, name, total, kinds:{code:n}, dup:n}] for columns with issues + overall */
  ops.validate = (sh) => {
    const out = [];
    let total = 0;
    sh.cols.forEach((col, c) => {
      const kinds = {};
      let n = 0;
      for (const r of sh.rows) { const k = ops.cellIssue(col, r[c]); if (k) { kinds[k] = (kinds[k] || 0) + 1; n++; } }
      let dup = 0;
      if (col.unique) dup = ops.dupInfo(sh, { cols: [c], ic: false, trim: true, skipEmpty: true }).all.size;
      total += n + dup;
      out.push({ col: c, name: col.name, type: col.type, total: n + dup, kinds, dup });
    });
    return { cols: out, total };
  };

  /* ═════════ statistics ═════════ */
  ops.columnStats = (sh, c, rowIdx) => {
    const rows = rowIdx ? rowIdx.map((i) => sh.rows[i]) : sh.rows;
    const col = sh.cols[c];
    const vals = rows.map((r) => str(r[c]));
    const filled = vals.filter((v) => !u.isEmpty(v));
    const freq = new Map();
    filled.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
    const top = [...freq.entries()].sort((a, b) => b[1] - a[1] || u.cmpText(a[0], b[0])).slice(0, 8);
    const st = { name: col.name, type: col.type, count: vals.length, filled: filled.length, empty: vals.length - filled.length, unique: freq.size, top };
    const nums = filled.map(u.num).filter((x) => !isNaN(x));
    if (nums.length && (col.type === 'number' || nums.length / filled.length > 0.9)) {
      nums.sort((a, b) => a - b);
      const sum = nums.reduce((s, x) => s + x, 0), mean = sum / nums.length;
      const med = nums.length % 2 ? nums[(nums.length - 1) / 2] : (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2;
      const sd = Math.sqrt(nums.reduce((s, x) => s + (x - mean) ** 2, 0) / nums.length);
      const q = (p) => nums[Math.min(nums.length - 1, Math.floor(p * (nums.length - 1)))];
      Object.assign(st, { numeric: true, n: nums.length, sum, mean, median: med, min: nums[0], max: nums[nums.length - 1], sd, q1: q(0.25), q3: q(0.75), hist: ops.histogram(nums, 12) });
    } else if (filled.length) {
      const lens = filled.map((v) => v.length);
      st.minLen = Math.min(...lens); st.maxLen = Math.max(...lens);
    }
    return st;
  };
  ops.histogram = (sortedNums, bins = 10) => {
    const lo = sortedNums[0], hi = sortedNums[sortedNums.length - 1];
    if (lo === hi) return [{ lo, hi, n: sortedNums.length }];
    const w = (hi - lo) / bins, out = Array.from({ length: bins }, (_, i) => ({ lo: lo + i * w, hi: lo + (i + 1) * w, n: 0 }));
    sortedNums.forEach((x) => { out[Math.min(bins - 1, Math.floor((x - lo) / w))].n++; });
    return out;
  };
  /** summary of a sheet (optionally restricted to view rows) */
  ops.sheetSummary = (sh, rowIdx) => {
    const n = rowIdx ? rowIdx.length : sh.rows.length, w = sh.cols.length;
    let filled = 0;
    const iter = rowIdx ? rowIdx.map((i) => sh.rows[i]) : sh.rows;
    iter.forEach((r) => r.forEach((v) => { if (!u.isEmpty(v)) filled++; }));
    const dup = w ? ops.dupInfo(sh, { cols: sh.cols.map((_, i) => i), ic: false, trim: false, skipEmpty: true }).extra : 0;
    return { rows: n, cols: w, cells: n * w, filled, empty: n * w - filled, dupRows: dup, fillRate: n * w ? filled / (n * w) : 0 };
  };

  /* ═════════ group-by / pivot ═════════ */
  ops.AGGS = ['count', 'sum', 'avg', 'min', 'max', 'median', 'unique'];
  ops.groupBy = (sh, o) => {
    const rows = o.rows ? o.rows.map((i) => sh.rows[i]) : sh.rows;
    const g = new Map();
    for (const r of rows) {
      const k = u.isEmpty(r[o.by]) ? '(empty)' : str(r[o.by]).trim();
      if (!g.has(k)) g.set(k, []);
      g.get(k).push(o.val >= 0 ? r[o.val] : '');
    }
    let out = [...g.entries()].map(([key, vs]) => {
      const nums = vs.map(u.num).filter((x) => !isNaN(x));
      let v;
      switch (o.agg) {
        case 'sum': v = nums.reduce((s, x) => s + x, 0); break;
        case 'avg': v = nums.length ? nums.reduce((s, x) => s + x, 0) / nums.length : 0; break;
        case 'min': v = nums.length ? Math.min(...nums) : 0; break;
        case 'max': v = nums.length ? Math.max(...nums) : 0; break;
        case 'median': { nums.sort((a, b) => a - b); v = nums.length ? (nums.length % 2 ? nums[(nums.length - 1) / 2] : (nums[nums.length / 2 - 1] + nums[nums.length / 2]) / 2) : 0; break; }
        case 'unique': v = new Set(vs.map(str)).size; break;
        default: v = vs.length;
      }
      return { key, value: Math.round(v * 1e6) / 1e6, n: vs.length };
    });
    out.sort(o.sortBy === 'key' ? (a, b) => u.cmpText(a.key, b.key) : (a, b) => b.value - a.value);
    if (o.top) out = out.slice(0, o.top);
    return out;
  };

  /* ═════════ combine sheets ═════════ */
  const mkOut = (name, cols, rows) => { const s = GF.store.mkSheet(name, cols, rows); return GF.store.fix(s); };
  /** append rows of B under A, matching columns by name (case-insensitive); unknown columns are added */
  ops.appendSheets = (a, b) => {
    const names = a.cols.map((c) => c.name.toLowerCase());
    const map = b.cols.map((c) => {
      let i = names.indexOf(c.name.toLowerCase());
      if (i < 0) { ops.insertCol(a, a.cols.length, { name: c.name, type: c.type }); names.push(c.name.toLowerCase()); i = a.cols.length - 1; }
      return i;
    });
    b.rows.forEach((r) => { const row = a.cols.map((c) => c.def || ''); map.forEach((ai, bi) => { row[ai] = r[bi]; }); a.rows.push(row); });
    return b.rows.length;
  };
  /** SQL-like join of two sheets on key columns. kind: left | inner | full */
  ops.join = (a, b, ka, kb, kind = 'left', name = 'Joined') => {
    const norm = (v) => u.toEnDigits(str(v)).trim().toLowerCase();
    const idx = new Map();
    b.rows.forEach((r, i) => { const k = norm(r[kb]); if (!idx.has(k)) idx.set(k, []); idx.get(k).push(i); });
    const bcols = b.cols.map((c, i) => i).filter((i) => i !== kb);
    const used = new Set(a.cols.map((c) => c.name));
    const cols = [...a.cols.map((c) => ({ ...c, id: u.uid() })), ...bcols.map((i) => { const n = u.uniqueName(b.cols[i].name, [...used]); used.add(n); return GF.store.mkCol({ ...b.cols[i], name: n }); })];
    const rows = [], seenB = new Set(), blank = bcols.map(() => '');
    a.rows.forEach((r) => {
      const m = idx.get(norm(r[ka]));
      if (m) m.forEach((bi) => { seenB.add(bi); rows.push([...r, ...bcols.map((c) => b.rows[bi][c])]); });
      else if (kind !== 'inner') rows.push([...r, ...blank]);
    });
    if (kind === 'full') b.rows.forEach((r, bi) => { if (!seenB.has(bi)) { const row = a.cols.map(() => ''); row[ka] = r[kb]; rows.push([...row, ...bcols.map((c) => r[c])]); } });
    return mkOut(name, cols, rows);
  };
  /** set operations by key: 'both' | 'onlyA' | 'onlyB' */
  ops.setOp = (a, b, ka, kb, mode, name = 'Result') => {
    const norm = (v) => u.toEnDigits(str(v)).trim().toLowerCase();
    const bs = new Set(b.rows.map((r) => norm(r[kb])));
    const as = new Set(a.rows.map((r) => norm(r[ka])));
    let rows, src;
    if (mode === 'onlyB') { src = b; rows = b.rows.filter((r) => !as.has(norm(r[kb]))); }
    else { src = a; rows = a.rows.filter((r) => (mode === 'both') === bs.has(norm(r[ka]))); }
    return mkOut(name, src.cols.map((c) => ({ ...c, id: u.uid() })), rows.map((r) => r.slice()));
  };
  /** result of groupBy → sheet */
  ops.groupSheet = (rows, byName, valName, agg, name) => mkOut(name, [GF.store.mkCol({ name: byName }), GF.store.mkCol({ name: agg + (valName ? '(' + valName + ')' : ''), type: 'number' }), GF.store.mkCol({ name: 'rows', type: 'number' })], rows.map((r) => [r.key, String(r.value), String(r.n)]));
})(typeof window !== 'undefined' ? window : globalThis);
