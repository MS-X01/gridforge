/* GridForge — parse.js : CSV/TSV/JSON/Excel → sheets */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;
  const io = (GF.io = GF.io || {});

  /** Decode bytes → text. enc: 'auto' | any TextDecoder label (utf-8, windows-1256, utf-16le …) */
  io.decode = (buf, enc) => {
    const b = new Uint8Array(buf);
    if (!enc || enc === 'auto') {
      if (b[0] === 0xff && b[1] === 0xfe) enc = 'utf-16le';
      else if (b[0] === 0xfe && b[1] === 0xff) enc = 'utf-16be';
      else {
        try { return new TextDecoder('utf-8', { fatal: true }).decode(b).replace(/^\uFEFF/, ''); }
        catch (e) { enc = 'windows-1256'; } // typical for legacy Persian/Arabic CSVs
      }
    }
    return new TextDecoder(enc).decode(b).replace(/^\uFEFF/, '');
  };

  io.detectDelimiter = (text) => {
    const sample = text.slice(0, 20000).split(/\r?\n/).slice(0, 12).filter(Boolean);
    let best = ',', bestScore = -1;
    for (const d of [',', ';', '\t', '|']) {
      const counts = sample.map((l) => { let n = 0, q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === d && !q) n++; } return n; });
      if (!counts.length || !counts[0]) continue;
      const consistent = counts.filter((c) => c === counts[0]).length / counts.length;
      const score = consistent * 10 + Math.min(counts[0], 20) / 20;
      if (score > bestScore) { bestScore = score; best = d; }
    }
    return best;
  };

  /** RFC-4180 style parser with any single-char delimiter */
  io.parseDelimited = (text, delim) => {
    const rows = [];
    let row = [], f = '', q = false;
    const push = () => { row.push(f); f = ''; };
    const endRow = () => { push(); if (row.length > 1 || row[0].trim() !== '') rows.push(row); row = []; };
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"' && f === '') q = true;
      else if (c === delim) push();
      else if (c === '\r') { if (text[i + 1] === '\n') i++; endRow(); }
      else if (c === '\n') endRow();
      else f += c;
    }
    if (f !== '' || row.length) endRow();
    return rows;
  };

  io.parseJSON = (text) => {
    const data = JSON.parse(text);
    if (data && data.app === 'gridforge') return { project: data };
    let arr = Array.isArray(data) ? data : null;
    if (!arr && data && typeof data === 'object') {
      const k = Object.keys(data).find((x) => Array.isArray(data[x]));
      if (k) arr = data[k];
    }
    if (!arr) throw new Error('JSON must be an array of objects or arrays');
    if (arr.length && Array.isArray(arr[0])) return { sheets: [{ name: 'Sheet1', rows: arr.map((r) => r.map(cellStr)) }] };
    const heads = [];
    const seen = new Set();
    arr.forEach((o) => { if (o && typeof o === 'object') Object.keys(o).forEach((k) => { if (!seen.has(k)) { seen.add(k); heads.push(k); } }); });
    return { sheets: [{ name: 'Sheet1', rows: [heads, ...arr.map((o) => heads.map((k) => cellStr(o && o[k])))] }] };
  };
  function cellStr(v) {
    if (v == null) return '';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
  }

  io.parseExcel = (buf) => {
    if (typeof XLSX === 'undefined') throw new Error('Excel library missing (vendor/xlsx.full.min.js)');
    const wb = XLSX.read(buf, { type: 'array', cellDates: true });
    return {
      sheets: wb.SheetNames.map((name) => ({
        name,
        rows: XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, raw: false, dateNF: 'yyyy-mm-dd', defval: '' }).map((r) => r.map(cellStr)),
      })).filter((s) => s.rows.length),
    };
  };

  /**
   * Parse file bytes/text by extension.
   * opts: { enc, delim:'auto'|char, name }
   * returns { sheets:[{name, rows:string[][]}] } | { project }
   */
  io.parseAny = (buf, ext, opts = {}) => {
    ext = (ext || '').toLowerCase();
    if (['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext)) return io.parseExcel(buf);
    const text = typeof buf === 'string' ? buf : io.decode(buf, opts.enc);
    if (ext === 'json' || ext === 'gridforge') return io.parseJSON(text);
    if (ext === 'jsonl' || ext === 'ndjson') return io.parseJSON('[' + text.trim().split(/\r?\n/).filter(Boolean).join(',') + ']');
    let d = opts.delim && opts.delim !== 'auto' ? (opts.delim === 'tab' ? '\t' : opts.delim) : ext === 'tsv' ? '\t' : io.detectDelimiter(text);
    return { sheets: [{ name: 'Sheet1', rows: io.parseDelimited(text, d) }], delim: d };
  };

  /** rows (2D strings) → store sheet; auto-detects column types */
  io.toSheet = (name, rows, { header = true, detect = true } = {}) => {
    const S = GF.store;
    rows = rows.filter((r) => r.some((c) => String(c).trim() !== '') || r.length > 1);
    const width = rows.reduce((m, r) => Math.max(m, r.length), 0);
    let heads;
    if (header && rows.length) heads = rows.shift();
    else heads = [];
    const names = [];
    for (let i = 0; i < width; i++) {
      let n = String(heads[i] == null ? '' : heads[i]).trim() || 'Column ' + (i + 1);
      names.push(u.uniqueName(n, names));
    }
    const data = rows.map((r) => { const o = r.map((c) => String(c == null ? '' : c)); while (o.length < width) o.push(''); return o; });
    const cols = names.map((n, i) => S.mkCol({ name: n, type: detect ? u.detectType(data.map((r) => r[i])) : 'text' }));
    return S.mkSheet(name, cols, data);
  };
})(typeof window !== 'undefined' ? window : globalThis);
