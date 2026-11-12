/* GridForge — formula.js : safe row-level expression engine (no eval / no Function)
   Example:  =IF([Price]*[Qty] > 1000, "big", "small")    Refs: [Column Name]  or  {Column Name} */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;
  const F = (GF.formula = {});

  const isNumStr = (v) => typeof v === 'number' || (typeof v === 'string' && u.isNum(v));
  const N = (v) => { const n = u.num(v); return isNaN(n) ? (v === true ? 1 : v === false || v === '' || v == null ? 0 : NaN) : n; };
  const T = (v) => (v == null ? '' : typeof v === 'number' ? String(Math.round(v * 1e10) / 1e10) : String(v));
  const B = (v) => (typeof v === 'boolean' ? v : typeof v === 'number' ? v !== 0 : /^(true|yes|1)$/i.test(String(v).trim()));

  const FN = {
    IF: (c, a, b) => (B(c) ? a : b === undefined ? '' : b),
    AND: (...a) => a.every(B), OR: (...a) => a.some(B), NOT: (a) => !B(a),
    ROUND: (x, d = 0) => { const m = 10 ** N(d); return Math.round(N(x) * m) / m; },
    FLOOR: (x) => Math.floor(N(x)), CEIL: (x) => Math.ceil(N(x)), ABS: (x) => Math.abs(N(x)), SQRT: (x) => Math.sqrt(N(x)),
    POW: (a, b) => N(a) ** N(b), MOD: (a, b) => N(a) % N(b),
    MIN: (...a) => Math.min(...a.map(N)), MAX: (...a) => Math.max(...a.map(N)),
    SUM: (...a) => a.reduce((s, x) => s + (N(x) || 0), 0),
    AVG: (...a) => a.reduce((s, x) => s + (N(x) || 0), 0) / (a.length || 1),
    LEN: (s) => T(s).length, UPPER: (s) => T(s).toUpperCase(), LOWER: (s) => T(s).toLowerCase(), TRIM: (s) => T(s).trim().replace(/\s+/g, ' '),
    PROPER: (s) => u.titleCase(T(s)),
    LEFT: (s, n = 1) => T(s).slice(0, N(n)), RIGHT: (s, n = 1) => (N(n) ? T(s).slice(-N(n)) : ''),
    MID: (s, start, n) => T(s).substr(N(start) - 1, N(n)),
    CONCAT: (...a) => a.map(T).join(''),
    REPLACE: (s, a, b) => T(s).split(T(a)).join(T(b)),
    CONTAINS: (s, a) => T(s).toLowerCase().includes(T(a).toLowerCase()),
    ISEMPTY: (s) => T(s).trim() === '', NUMBER: (s) => N(s),
    REGEX: (s, p) => new RegExp(T(p), 'i').test(T(s)),
    EXTRACT: (s, p) => { const m = T(s).match(new RegExp(T(p), 'i')); return m ? (m[1] !== undefined ? m[1] : m[0]) : ''; },
    DIGITS: (s) => u.toEnDigits(T(s)),
    TODAY: () => new Date().toISOString().slice(0, 10),
    YEAR: (d) => Math.floor(u.dateKey(d) / 10000), MONTH: (d) => Math.floor((u.dateKey(d) % 10000) / 100), DAY: (d) => u.dateKey(d) % 100,
    DAYS: (a, b) => Math.round((Date.parse(T(b).slice(0, 10)) - Date.parse(T(a).slice(0, 10))) / 864e5),
  };
  F.functions = Object.keys(FN).concat(['ROW']);

  /* ── tokenizer ── */
  function tokenize(src) {
    const t = [];
    let i = 0;
    while (i < src.length) {
      const c = src[i];
      if (/\s/.test(c)) { i++; continue; }
      if (c === '[' || c === '{') {
        const end = src.indexOf(c === '[' ? ']' : '}', i + 1);
        if (end < 0) throw new Error('Missing closing bracket');
        t.push({ k: 'ref', v: src.slice(i + 1, end).trim() }); i = end + 1; continue;
      }
      if (c === '"' || c === "'") {
        let j = i + 1, s = '';
        while (j < src.length && src[j] !== c) { if (src[j] === '\\' && j + 1 < src.length) j++; s += src[j++]; }
        if (j >= src.length) throw new Error('Unterminated string');
        t.push({ k: 'str', v: s }); i = j + 1; continue;
      }
      const m = src.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
      if (m) { t.push({ k: 'num', v: parseFloat(m[1]) }); i += m[1].length; continue; }
      const id = src.slice(i).match(/^[A-Za-z_][A-Za-z0-9_]*/);
      if (id) { t.push({ k: 'id', v: id[0] }); i += id[0].length; continue; }
      const op = src.slice(i, i + 2);
      if (['<=', '>=', '<>', '!=', '==', '&&', '||'].includes(op)) { t.push({ k: 'op', v: op }); i += 2; continue; }
      if ('+-*/%^&=<>(),!'.includes(c)) { t.push({ k: 'op', v: c }); i++; continue; }
      throw new Error('Unexpected character: ' + c);
    }
    return t;
  }

  /* ── parser → closure tree ── */
  F.compile = (expr, colNames) => {
    const toks = tokenize(String(expr).replace(/^\s*=/, ''));
    if (!toks.length) throw new Error('Empty expression');
    const idxOf = (name) => {
      let i = colNames.indexOf(name);
      if (i < 0) i = colNames.findIndex((n) => n.toLowerCase() === name.toLowerCase());
      if (i < 0) throw new Error('Unknown column: ' + name);
      return i;
    };
    let p = 0;
    const peek = () => toks[p];
    const eat = (v) => { const t = toks[p]; if (t && t.k === 'op' && t.v === v) { p++; return true; } return false; };
    const need = (v) => { if (!eat(v)) throw new Error('Expected ' + v); };

    function parseCmp() {
      let l = parseConcat();
      for (;;) {
        const t = peek();
        if (!t || t.k !== 'op' || !['=', '==', '<>', '!=', '<', '>', '<=', '>='].includes(t.v)) return l;
        p++;
        const r = parseConcat(), a = l, op = t.v;
        l = (row, ctx) => {
          const x = a(row, ctx), y = r(row, ctx);
          const num = isNumStr(x) && isNumStr(y);
          const X = num ? N(x) : T(x).toLowerCase(), Y = num ? N(y) : T(y).toLowerCase();
          switch (op) { case '=': case '==': return X === Y; case '<>': case '!=': return X !== Y; case '<': return X < Y; case '>': return X > Y; case '<=': return X <= Y; default: return X >= Y; }
        };
      }
    }
    function parseConcat() {
      let l = parseAdd();
      while (eat('&')) { const a = l, r = parseAdd(); l = (row, c) => T(a(row, c)) + T(r(row, c)); }
      return l;
    }
    function parseAdd() {
      let l = parseMul();
      for (;;) {
        if (eat('+')) { const a = l, r = parseMul(); l = (row, c) => N(a(row, c)) + N(r(row, c)); }
        else if (eat('-')) { const a = l, r = parseMul(); l = (row, c) => N(a(row, c)) - N(r(row, c)); }
        else return l;
      }
    }
    function parseMul() {
      let l = parsePow();
      for (;;) {
        if (eat('*')) { const a = l, r = parsePow(); l = (row, c) => N(a(row, c)) * N(r(row, c)); }
        else if (eat('/')) { const a = l, r = parsePow(); l = (row, c) => { const d = N(r(row, c)); if (d === 0) throw new Error('#DIV/0!'); return N(a(row, c)) / d; }; }
        else if (eat('%')) { const a = l, r = parsePow(); l = (row, c) => N(a(row, c)) % N(r(row, c)); }
        else return l;
      }
    }
    function parsePow() {
      const l = parseUnary();
      if (eat('^')) { const r = parsePow(); return (row, c) => N(l(row, c)) ** N(r(row, c)); }
      return l;
    }
    function parseUnary() {
      if (eat('-')) { const a = parseUnary(); return (row, c) => -N(a(row, c)); }
      if (eat('+')) return parseUnary();
      if (eat('!')) { const a = parseUnary(); return (row, c) => !B(a(row, c)); }
      return parsePrimary();
    }
    function parsePrimary() {
      const t = toks[p++];
      if (!t) throw new Error('Unexpected end');
      if (t.k === 'num') return () => t.v;
      if (t.k === 'str') return () => t.v;
      if (t.k === 'ref') { const i = idxOf(t.v); return (row) => { const v = row[i]; return v === '' || v == null ? '' : isNumStr(v) ? N(v) : v; }; }
      if (t.k === 'op' && t.v === '(') { const e = parseCmpLogic(); need(')'); return e; }
      if (t.k === 'id') {
        const name = t.v.toUpperCase();
        if (name === 'TRUE') return () => true;
        if (name === 'FALSE') return () => false;
        if (eat('(')) {
          const args = [];
          if (!eat(')')) { do args.push(parseCmpLogic()); while (eat(',')); need(')'); }
          if (name === 'ROW') return (row, c) => c.row + 1;
          const fn = FN[name];
          if (!fn) throw new Error('Unknown function: ' + t.v);
          return (row, c) => fn(...args.map((a) => a(row, c)));
        }
        // bare identifier → try a column of that name
        const i = idxOf(t.v);
        return (row) => { const v = row[i]; return isNumStr(v) ? N(v) : v; };
      }
      throw new Error('Unexpected token: ' + (t.v));
    }
    function parseCmpLogic() { // && / || (lowest precedence)
      let l = parseCmp();
      for (;;) {
        if (eat('&&')) { const a = l, r = parseCmp(); l = (row, c) => B(a(row, c)) && B(r(row, c)); }
        else if (eat('||')) { const a = l, r = parseCmp(); l = (row, c) => B(a(row, c)) || B(r(row, c)); }
        else return l;
      }
    }
    const root = parseCmpLogic();
    if (p < toks.length) throw new Error('Unexpected token: ' + toks[p].v);
    return (row, rowIdx) => {
      try {
        const v = root(row, { row: rowIdx || 0 });
        if (typeof v === 'number' && !isFinite(v)) return '#NUM!';
        if (typeof v === 'number' && isNaN(v)) return '#VALUE!';
        return typeof v === 'boolean' ? (v ? 'true' : 'false') : T(v);
      } catch (e) { return String(e.message).startsWith('#') ? e.message : '#ERR'; }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
