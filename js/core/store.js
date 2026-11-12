/* GridForge — store.js : workbook state, undo/redo, view (filter/sort/search) and persistence */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;

  /* ── tiny event bus ── */
  const L = {};
  GF.on = (ev, fn) => ((L[ev] = L[ev] || []).push(fn), fn);
  GF.emit = (ev, a) => (L[ev] || []).slice().forEach((f) => { try { f(a); } catch (e) { console.error('[GF:' + ev + ']', e); } });

  const S = (GF.store = {});
  S.VERSION = 1;

  /* ── factories ── */
  S.mkView = () => ({ q: '', scol: -1, rx: false, cs: false, filters: [], sort: [], dups: null, invalid: false });
  S.mkCol = (o = {}) => ({
    id: u.uid(), name: o.name || 'Column', type: o.type || 'text', required: !!o.required, unique: !!o.unique,
    def: o.def || '', options: o.options || '', hidden: !!o.hidden, width: o.width || 0,
  });
  S.mkSheet = (name, cols, rows) => ({ id: u.uid(), name: name || 'Sheet1', cols: cols || [], rows: rows || [], view: S.mkView() });
  S.fix = (sh) => { // make every row exactly cols.length strings
    const n = sh.cols.length;
    for (let i = 0; i < sh.rows.length; i++) {
      const r = sh.rows[i];
      if (r.length > n) r.length = n;
      while (r.length < n) r.push('');
    }
    return sh;
  };

  /* ── state ── */
  S.wb = { name: '', sheets: [S.mkSheet('Sheet1')], active: 0 };
  S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 }; // view-row / visible-col positions
  S.ver = 0;
  S.viewVer = 0;
  S.dirty = false;
  S.sheet = () => S.wb.sheets[S.wb.active];
  S.isBlank = () => S.wb.sheets.length === 1 && !S.wb.sheets[0].cols.length;
  S.visCols = (sh) => { const a = []; (sh || S.sheet()).cols.forEach((c, i) => { if (!c.hidden) a.push(i); }); return a; };

  /* ── settings ── */
  const defaults = {
    theme: 'dark', lang: (typeof navigator !== 'undefined' && /^fa/i.test(navigator.language || '')) ? 'fa' : 'en',
    density: 'normal', font: 'md', zebra: true, borders: true, freeze: true, rownums: true, bggrid: true,
    hl: true, autosave: true, panel: 'columns', panelOpen: true,
  };
  S.settings = Object.assign({}, defaults);
  S.loadSettings = () => {
    try { Object.assign(S.settings, JSON.parse(localStorage.getItem('gf-settings') || '{}')); } catch (e) { /* ignore */ }
  };
  S.setSetting = (k, v) => {
    S.settings[k] = v;
    try { localStorage.setItem('gf-settings', JSON.stringify(S.settings)); } catch (e) { /* ignore */ }
    GF.emit('settings', k);
  };
  S.resetSettings = () => {
    S.settings = Object.assign({}, defaults);
    try { localStorage.removeItem('gf-settings'); } catch (e) { /* ignore */ }
    GF.emit('settings', '*');
  };

  /* ── history ── */
  const undoS = [];
  const redoS = [];
  const cloneData = (s) => ({ ...s, cols: s.cols.map((c) => ({ ...c })), rows: s.rows.map((r) => r.slice()) });
  const cloneSheet = (s) => ({ ...cloneData(s), view: JSON.parse(JSON.stringify(s.view)) });
  const cloneWb = (w) => ({ name: w.name, active: w.active, sheets: w.sheets.map(cloneSheet) });
  const cellsOf = () => S.wb.sheets.reduce((n, s) => n + s.rows.length * s.cols.length, 0);
  const snap = (scope, idx) => scope === 'wb'
    ? { scope, wb: cloneWb(S.wb) }
    : { scope, idx: idx == null ? S.wb.active : idx, sheet: cloneData(S.wb.sheets[idx == null ? S.wb.active : idx]) };
  const cap = () => (cellsOf() > 1.5e6 ? 3 : cellsOf() > 4e5 ? 10 : 40);
  const restore = (sn) => {
    if (sn.scope === 'wb') {
      S.wb = sn.wb;
    } else {
      const cur = S.wb.sheets[sn.idx];
      if (!cur) return;
      sn.sheet.view = cur.view; // views are not part of history
      S.wb.sheets[sn.idx] = sn.sheet;
      S.wb.active = sn.idx;
    }
    S.wb.sheets.forEach(S.sanitizeView);
    S.touch(true);
  };
  S.canUndo = () => undoS.length > 0;
  S.canRedo = () => redoS.length > 0;
  S.clearHistory = () => { undoS.length = 0; redoS.length = 0; GF.emit('history'); };
  S.undo = () => {
    const sn = undoS.pop();
    if (!sn) return false;
    redoS.push(snap(sn.scope, sn.idx));
    restore(sn);
    GF.emit('history');
    return true;
  };
  S.redo = () => {
    const sn = redoS.pop();
    if (!sn) return false;
    undoS.push(snap(sn.scope, sn.idx));
    restore(sn);
    GF.emit('history');
    return true;
  };

  /** Run a mutation with an undo snapshot. scope: 'sheet' (active sheet) or 'wb' (workbook structure). */
  S.commit = (fn, scope = 'sheet', opt = {}) => {
    undoS.push(snap(scope));
    while (undoS.length > cap()) undoS.shift();
    redoS.length = 0;
    let res;
    try { res = fn(S.sheet()); } catch (e) { undoS.pop(); throw e; }
    S.wb.sheets.forEach(S.sanitizeView);
    S.touch(opt.keepView ? 'keep' : true);
    GF.emit('history');
    return res;
  };
  /** Mark data changed (no snapshot). schema=true → header must be rebuilt too */
  S.touch = (schema) => {
    S.ver++;
    if (schema !== 'keep') S.viewVer++; // 'keep' = cell edit: keep row order stable until the next view change
    S.dirty = true;
    S.clampSel();
    GF.emit('change', { schema: schema === true });
    S.scheduleSave();
  };
  S.sanitizeView = (sh) => {
    const n = sh.cols.length;
    const v = sh.view;
    v.filters = v.filters.filter((f) => f.col < n);
    v.sort = v.sort.filter((s) => s.col < n);
    if (v.scol >= n) v.scol = -1;
    if (v.dups && v.dups.cols.some((c) => c >= n)) v.dups = null;
  };
  S.setView = (patch) => { // view changes: no undo, no data dirty
    Object.assign(S.sheet().view, patch);
    S.viewVer++;
    S.clampSel();
    GF.emit('view');
    S.scheduleSave();
  };

  /* ── workbook-level operations ── */
  S.newWorkbook = (sheets, name) => {
    S.wb = { name: name || '', sheets: sheets && sheets.length ? sheets : [S.mkSheet('Sheet1')], active: 0 };
    S.clearHistory();
    S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 };
    S.touch(true);
    GF.emit('sheets');
  };
  S.addSheet = (sheet, activate = true) => {
    S.commit(() => {
      sheet.name = u.uniqueName(sheet.name || 'Sheet', S.wb.sheets.map((s) => s.name));
      S.wb.sheets.push(sheet);
      if (activate) S.wb.active = S.wb.sheets.length - 1;
    }, 'wb');
    GF.emit('sheets');
  };
  S.setActive = (i) => {
    if (i < 0 || i >= S.wb.sheets.length) return;
    S.wb.active = i;
    S.sel = { r1: 0, c1: 0, r2: 0, c2: 0 };
    S.viewVer++;
    GF.emit('sheets');
    GF.emit('change', { schema: true });
  };
  S.renameSheet = (i, name) => {
    name = String(name || '').trim();
    if (!name) return;
    S.commit(() => { S.wb.sheets[i].name = u.uniqueName(name, S.wb.sheets.filter((_, j) => j !== i).map((s) => s.name)); }, 'wb');
    GF.emit('sheets');
  };
  S.duplicateSheet = (i) => {
    const c = cloneSheet(S.wb.sheets[i]);
    c.id = u.uid();
    c.name = u.uniqueName(c.name + ' copy', S.wb.sheets.map((s) => s.name));
    S.commit(() => { S.wb.sheets.splice(i + 1, 0, c); S.wb.active = i + 1; }, 'wb');
    GF.emit('sheets');
  };
  S.deleteSheet = (i) => {
    S.commit(() => {
      S.wb.sheets.splice(i, 1);
      if (!S.wb.sheets.length) S.wb.sheets.push(S.mkSheet('Sheet1'));
      S.wb.active = Math.min(S.wb.active, S.wb.sheets.length - 1);
    }, 'wb');
    GF.emit('sheets');
  };
  S.moveSheet = (from, to) => {
    if (from === to) return;
    S.commit(() => {
      const [s] = S.wb.sheets.splice(from, 1);
      S.wb.sheets.splice(to, 0, s);
      S.wb.active = to;
    }, 'wb');
    GF.emit('sheets');
  };

  /* ── view index: filter → search → sort (cached) ── */
  let cache = null;
  S.viewIndex = () => {
    const sh = S.sheet();
    if (cache && cache.sid === sh.id && cache.vv === S.viewVer) return cache.idx;
    const idx = GF.ops.computeView(sh);
    cache = { sid: sh.id, ver: S.ver, vv: S.viewVer, idx };
    return idx;
  };
  S.invalidateView = () => { cache = null; };
  S.rowCountView = () => S.viewIndex().length;
  S.clampSel = () => {
    const sh = S.sheet();
    const nr = Math.max(0, (cache && cache.sid === sh.id ? cache.idx.length : sh.rows.length) - 1);
    const nc = Math.max(0, S.visCols(sh).length - 1);
    const s = S.sel;
    s.r1 = Math.min(s.r1, nr); s.r2 = Math.min(s.r2, nr);
    s.c1 = Math.min(s.c1, nc); s.c2 = Math.min(s.c2, nc);
  };
  S.setSel = (r1, c1, r2, c2) => {
    S.sel = { r1, c1, r2: r2 == null ? r1 : r2, c2: c2 == null ? c1 : c2 };
    GF.emit('sel');
  };
  S.selRange = () => {
    const s = S.sel;
    return { r1: Math.min(s.r1, s.r2), r2: Math.max(s.r1, s.r2), c1: Math.min(s.c1, s.c2), c2: Math.max(s.c1, s.c2) };
  };

  /* ── persistence (IndexedDB, fully local) ── */
  const DB = 'gridforge', ST = 'kv';
  const idb = () => new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('no idb'));
    const rq = indexedDB.open(DB, 1);
    rq.onupgradeneeded = () => rq.result.createObjectStore(ST);
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });
  const idbOp = (mode, fn) => idb().then((db) => new Promise((res, rej) => {
    const tx = db.transaction(ST, mode);
    const r = fn(tx.objectStore(ST));
    tx.oncomplete = () => res(r && r.result);
    tx.onerror = () => rej(tx.error);
  }));
  S.projectData = () => ({ app: 'gridforge', v: S.VERSION, name: S.wb.name, active: S.wb.active, sheets: S.wb.sheets });
  S.loadProjectData = (d) => {
    if (!d || d.app !== 'gridforge' || !Array.isArray(d.sheets) || !d.sheets.length) throw new Error('Not a GridForge project');
    const sheets = d.sheets.map((s) => {
      const sh = S.mkSheet(s.name, (s.cols || []).map((c) => ({ ...S.mkCol(c), id: c.id || u.uid() })), s.rows || []);
      sh.view = Object.assign(S.mkView(), s.view || {});
      return S.fix(sh);
    });
    S.newWorkbook(sheets, d.name);
    S.wb.active = Math.min(d.active || 0, sheets.length - 1);
    S.touch(true);
    GF.emit('sheets');
  };
  let saveT = null;
  S.scheduleSave = () => {
    if (!S.settings.autosave) return;
    clearTimeout(saveT);
    GF.emit('saving', 'pending');
    saveT = setTimeout(S.save, 1200);
  };
  S.save = () => idbOp('readwrite', (st) => st.put({ at: Date.now(), data: S.projectData() }, 'autosave'))
    .then(() => { S.dirty = false; GF.emit('saving', 'saved'); })
    .catch(() => GF.emit('saving', 'error'));
  S.restore = () => idbOp('readonly', (st) => st.get('autosave')).then((rec) => {
    if (!rec || !rec.data) return false;
    S.loadProjectData(rec.data);
    return rec.at;
  }).catch(() => false);
  S.wipeSaved = () => idbOp('readwrite', (st) => st.delete('autosave')).catch(() => {});
})(typeof window !== 'undefined' ? window : globalThis);
