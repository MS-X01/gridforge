/* GridForge — generate.js : sequences, random data generators and "smart" sample rows */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;
  const ops = (GF.ops = GF.ops || {});

  const P = {
    first: ['Alice', 'Bob', 'Carol', 'David', 'Emma', 'Frank', 'Grace', 'Henry', 'Isabella', 'James', 'Kate', 'Liam', 'Maya', 'Noah', 'Olivia', 'Paul', 'Quinn', 'Rita', 'Sam', 'Tina'],
    last: ['Johnson', 'Smith', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Taylor', 'Anderson', 'Thomas', 'Moore', 'Clark', 'Lewis', 'Walker', 'Hall'],
    firstFa: ['علی', 'محمد', 'سارا', 'مریم', 'رضا', 'نگار', 'امیر', 'زهرا', 'حسین', 'فاطمه', 'مهدی', 'نیلوفر', 'کامران', 'ساناز', 'پوریا', 'الهام', 'آرش', 'یاسمن', 'بهرام', 'مینا'],
    lastFa: ['احمدی', 'محمدی', 'حسینی', 'رضایی', 'کریمی', 'موسوی', 'جعفری', 'صادقی', 'نوری', 'قاسمی', 'رحیمی', 'اکبری', 'فرهادی', 'کاظمی', 'شریفی'],
    cities: ['Tehran', 'Istanbul', 'Berlin', 'London', 'Paris', 'Tokyo', 'New York', 'Toronto', 'Dubai', 'Madrid'],
    citiesFa: ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز', 'کرج', 'اهواز', 'قم', 'رشت', 'یزد'],
    domains: ['gmail.com', 'outlook.com', 'proton.me', 'example.com', 'mail.io'],
    companies: ['Acme', 'Globex', 'Initech', 'Umbrella', 'Hooli', 'Stark', 'Wayne', 'Wonka', 'Cyberdyne', 'Soylent'],
    words: ['alpha', 'bravo', 'delta', 'echo', 'nova', 'orbit', 'pixel', 'quartz', 'raven', 'sigma', 'terra', 'vector'],
  };
  ops.POOLS = P;
  const pick = (a, r) => a[Math.floor(r() * a.length)];
  const pad = (n, w = 2) => String(n).padStart(w, '0');

  /** value for row i of generator `kind` */
  ops.genValue = (kind, i, r, o = {}) => {
    switch (kind) {
      case 'numbers': return String((o.start == null ? 1 : o.start) + i * (o.step || 1));
      case 'letters': return u.colLetter(i);
      case 'dates': { const d = new Date(Date.UTC(2024, 0, 1)); d.setUTCDate(d.getUTCDate() + i); return d.toISOString().slice(0, 10); }
      case 'randdates': { const d = new Date(Date.UTC(2023, 0, 1) + Math.floor(r() * 3 * 365) * 864e5); return d.toISOString().slice(0, 10); }
      case 'uuid': return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => { const x = (r() * 16) | 0; return (c === 'x' ? x : (x & 3) | 8).toString(16); });
      case 'names': return pick(P.first, r) + ' ' + pick(P.last, r);
      case 'namesFa': return pick(P.firstFa, r) + ' ' + pick(P.lastFa, r);
      case 'emails': return (pick(P.first, r) + '.' + pick(P.last, r)).toLowerCase() + Math.floor(r() * 90 + 10) + '@' + pick(P.domains, r);
      case 'phones': return `+1 (${Math.floor(200 + r() * 700)}) ${Math.floor(200 + r() * 700)}-${Math.floor(1000 + r() * 9000)}`;
      case 'phonesIR': return '09' + pick(['12', '13', '15', '19', '21', '35'], r) + String(Math.floor(r() * 1e7)).padStart(7, '0');
      case 'prices': return (r() * 990 + 10).toFixed(2);
      case 'ints': { const lo = o.min == null ? 0 : o.min, hi = o.max == null ? 100 : o.max; return String(Math.floor(lo + r() * (hi - lo + 1))); }
      case 'bools': return r() < 0.5 ? 'true' : 'false';
      case 'cities': return pick(P.cities, r);
      case 'citiesFa': return pick(P.citiesFa, r);
      case 'companies': return pick(P.companies, r) + ' ' + pick(['Ltd', 'Inc', 'Co', 'Group'], r);
      case 'words': return pick(P.words, r);
      case 'list': { const l = (o.list || []).filter((x) => x !== ''); return l.length ? pick(l, r) : ''; }
      case 'pattern': return String(o.pattern || '')
        .replace(/\{n\}/g, i + 1).replace(/\{n0\}/g, i).replace(/\{nn\}/g, pad(i + 1, 3)).replace(/\{rand\}/g, Math.floor(r() * 1000)).replace(/\{col\}/g, u.colLetter(i));
      default: return '';
    }
  };

  /** fill column c. o.rows: Set of row idx or null (all); o.onlyEmpty */
  ops.generate = (sh, c, kind, o = {}) => {
    const r = u.rng(o.seed);
    let n = 0, seq = 0;
    for (let i = 0; i < sh.rows.length; i++) {
      if (o.rows && !o.rows.has(i)) continue;
      if (o.onlyEmpty && !u.isEmpty(sh.rows[i][c])) continue;
      sh.rows[i][c] = ops.genValue(kind, o.rows || o.onlyEmpty ? seq : i, r, o);
      seq++; n++;
    }
    return n;
  };

  /** choose a generator for a column from its name/type */
  ops.guessKind = (col, fa) => {
    const n = col.name.toLowerCase();
    const has = (...w) => w.some((x) => n.includes(x));
    if (col.type === 'select' && col.options) return 'list';
    if (col.type === 'email' || has('email', 'ایمیل')) return 'emails';
    if (col.type === 'boolean') return 'bools';
    if (col.type === 'url') return 'pattern';
    if (col.type === 'date') return 'randdates';
    if (has('phone', 'tel', 'mobile', 'تلفن', 'موبایل', 'همراه')) return fa ? 'phonesIR' : 'phones';
    if (has('uuid', 'guid')) return 'uuid';
    if (has('name', 'نام', 'employee', 'assignee')) return fa ? 'namesFa' : 'names';
    if (has('city', 'شهر')) return fa ? 'citiesFa' : 'cities';
    if (has('company', 'شرکت')) return 'companies';
    if (has('price', 'amount', 'salary', 'cost', 'قیمت', 'مبلغ', 'حقوق')) return 'prices';
    if (col.type === 'number') return 'ints';
    if (has('id', 'code', 'sku', 'شناسه', 'کد')) return 'pattern';
    return 'words';
  };
  /** append n rows of plausible sample data */
  ops.smartRows = (sh, n, fa, seed) => {
    const r = u.rng(seed);
    const start = sh.rows.length;
    for (let i = 0; i < n; i++) {
      sh.rows.push(sh.cols.map((col, ci) => {
        const kind = ops.guessKind(col, fa);
        const idx = start + i;
        if (kind === 'list') return pick(col.options.split(',').map((x) => x.trim()).filter(Boolean), r);
        if (kind === 'pattern') return col.type === 'url' ? 'https://example.com/item/' + (idx + 1) : (col.name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'ID') + '-' + pad(idx + 1, 4);
        return ops.genValue(kind, idx, r, { min: 1, max: 500 });
      }));
    }
    return n;
  };
})(typeof window !== 'undefined' ? window : globalThis);
