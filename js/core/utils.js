/* GridForge — utils.js : small dependency-free helpers (browser + Node) */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = (GF.u = {});

  /* ── DOM ── */
  u.$ = (sel, el) => (el || document).querySelector(sel);
  u.$$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));
  u.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  u.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  u.debounce = (fn, ms = 150) => {
    let t;
    return (...a) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...a), ms);
    };
  };
  let _uid = 0;
  u.uid = () => 'i' + (++_uid).toString(36) + Math.random().toString(36).slice(2, 6);

  /* ── numbers / digits ── */
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const AR = '٠١٢٣٤٥٦٧٨٩';
  u.toEnDigits = (s) => String(s).replace(/[۰-۹]/g, (d) => FA.indexOf(d)).replace(/[٠-٩]/g, (d) => AR.indexOf(d));
  u.toFaDigits = (s) => String(s).replace(/\d/g, (d) => FA[d]);
  const NUM_RE = /^[-+]?(\d{1,3}(,\d{3})+|\d+)?(\.\d+)?([eE][-+]?\d+)?$/;
  /** Parse a number from messy text (Persian digits, thousands separators). NaN if not numeric. */
  u.num = (v) => {
    if (typeof v === 'number') return v;
    if (v == null) return NaN;
    let s = u.toEnDigits(String(v)).trim().replace(/٬/g, ',').replace(/٫/g, '.');
    if (s === '' || s === '.' || s === '-' || s === '+') return NaN;
    if (!NUM_RE.test(s)) return NaN;
    return Number(s.replace(/,/g, ''));
  };
  u.isNum = (v) => !isNaN(u.num(v));
  u.isEmpty = (v) => v == null || String(v).trim() === '';
  u.isBool = (v) => /^(true|false|yes|no|بله|خیر)$/i.test(String(v).trim());
  u.boolVal = (v) => /^(true|yes|بله)$/i.test(String(v).trim());
  u.isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  u.isURL = (v) => {
    try {
      const x = new URL(String(v).trim());
      return x.protocol === 'http:' || x.protocol === 'https:';
    } catch (e) {
      return false;
    }
  };
  const DATE_RES = [/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})(?:[T\s].*)?$/, /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/];
  /** sortable numeric key for dates (y*10000+m*100+d). Works for Gregorian & Jalali text. NaN otherwise. */
  u.dateKey = (v) => {
    const s = u.toEnDigits(String(v)).trim();
    let m = s.match(DATE_RES[0]);
    if (m) return +m[1] * 10000 + +m[2] * 100 + +m[3];
    m = s.match(DATE_RES[1]);
    if (m) return +m[3] * 10000 + +m[2] * 100 + +m[1];
    return NaN;
  };
  u.isDate = (v) => !isNaN(u.dateKey(v));

  /** Guess a column type from sample values */
  u.detectType = (values) => {
    const vs = [];
    for (let i = 0; i < values.length && vs.length < 600; i++) if (!u.isEmpty(values[i])) vs.push(String(values[i]));
    if (!vs.length) return 'text';
    const frac = (fn) => vs.filter(fn).length / vs.length;
    if (frac(u.isBool) >= 0.97) return 'boolean';
    if (frac(u.isNum) >= 0.97) return 'number';
    if (frac(u.isDate) >= 0.95) return 'date';
    if (frac(u.isEmail) >= 0.95) return 'email';
    if (frac(u.isURL) >= 0.95) return 'url';
    return 'text';
  };

  /* ── text ── */
  u.colLetter = (i) => {
    let s = '';
    let n = i + 1;
    while (n > 0) {
      s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  u.titleCase = (s) => String(s).toLowerCase().replace(/(^|[\s\-_/(])(\S)/g, (m, a, b) => a + b.toUpperCase());
  u.fmtBytes = (b) => (b < 1024 ? b + ' B' : b < 1048576 ? (b / 1024).toFixed(1) + ' KB' : (b / 1048576).toFixed(2) + ' MB');
  u.fmtNum = (n, d = 2) => (isFinite(n) ? (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('en-US') : '—');
  u.escRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  u.slug = (s) => String(s || '').trim().replace(/[^\p{L}\p{N}_-]+/gu, '-').replace(/^-+|-+$/g, '') || 'gridforge';
  u.uniqueName = (name, existing) => {
    const set = new Set(existing);
    if (!set.has(name)) return name;
    let i = 2;
    while (set.has(name + ' ' + i)) i++;
    return name + ' ' + i;
  };
  const collator = typeof Intl !== 'undefined' ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }) : null;
  u.cmpText = (a, b) => (collator ? collator.compare(a, b) : a < b ? -1 : a > b ? 1 : 0);

  /* ── files ── */
  u.download = (content, name, mime) => {
    const blob = content instanceof Blob ? content : new Blob([content], { type: mime || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };

  /* ── seeded random (for reproducible sample data) ── */
  u.rng = (seed) => {
    let a = (seed == null ? Math.random() * 2 ** 32 : seed) >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
