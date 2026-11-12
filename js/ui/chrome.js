/* GridForge — chrome.js : top bar, tool rail/panel, toolbar, filter bar, sheet tabs, welcome screen, status bar */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u, S = GF.store, ops = GF.ops, ui = GF.ui, G = GF.grid;
  const t = (k, v) => GF.i18n.t(k, v);
  const C = (GF.chrome = {});
  const $ = (s, e) => u.$(s, e);
  const sh = () => S.sheet();

  /* ═════════ settings → DOM ═════════ */
  C.applySettings = () => {
    const s = S.settings, b = document.body;
    document.documentElement.dataset.theme = s.theme;
    b.dataset.density = s.density; b.dataset.font = s.font;
    b.dataset.zebra = s.zebra ? 'on' : 'off'; b.dataset.borders = s.borders ? 'on' : 'off';
    b.dataset.freeze = s.freeze ? 'on' : 'off'; b.dataset.rownums = s.rownums ? 'on' : 'off'; b.dataset.bggrid = s.bggrid ? 'on' : 'off';
    if (GF.i18n.lang !== s.lang) { GF.i18n.setLang(s.lang); GF.emit('lang'); }
  };

  /* ═════════ tool panel ═════════ */
  let panelSig = '', panelT = 0;
  C.renderPanel = () => {
    const name = S.settings.panel, p = GF.panels[name], pe = $('#panel');
    pe.classList.toggle('closed', !S.settings.panelOpen);
    document.querySelectorAll('#rail button').forEach((b) => b.classList.toggle('on', S.settings.panelOpen && b.dataset.panel === name));
    if (!S.settings.panelOpen || !p) return;
    $('#panelTitle').textContent = t('p.' + name);
    const old = $('#panelBody');
    const scroll = old.scrollTop;
    const body = old.cloneNode(false); // fresh node → no stale delegated listeners from earlier renders
    old.replaceWith(body);
    p.render(body);
    body.scrollTop = scroll;
    panelSig = name + '|' + p.sig();
  };
  C.openPanel = (name) => {
    if (S.settings.panelOpen && S.settings.panel === name) S.setSetting('panelOpen', false);
    else { S.settings.panel = name; S.setSetting('panelOpen', true); }
    C.renderPanel();
  };
  const maybePanel = () => {
    clearTimeout(panelT);
    panelT = setTimeout(() => {
      const p = GF.panels[S.settings.panel];
      if (S.settings.panelOpen && p && S.settings.panel + '|' + p.sig() !== panelSig) C.renderPanel();
    }, 220);
  };

  /* ═════════ toolbar ═════════ */
  let scopeSig = '';
  const renderScope = () => {
    const s = sh(), sig = s.id + s.cols.map((c) => c.name).join('|') + s.view.scol;
    if (sig === scopeSig) return;
    scopeSig = sig;
    $('#qScope').innerHTML = ui.colOpts(s, { all: t('search.allcols'), sel: s.view.scol });
    $('#qScope').value = s.view.scol;
  };
  const renderToolbar = () => {
    const v = sh().view;
    renderScope();
    if (document.activeElement !== $('#q')) $('#q').value = v.q;
    $('#tCase').classList.toggle('on', v.cs);
    $('#tRx').classList.toggle('on', v.rx);
    $('#btnFilter').classList.toggle('on', v.filters.length > 0);
    $('#btnUndo').disabled = !S.canUndo(); $('#btnRedo').disabled = !S.canRedo();
    $('#q').style.borderColor = ops.searchRe(v) && ops.searchRe(v).bad ? 'var(--red)' : '';
  };
  const colsPopover = () => {
    const s = sh(), box = document.createElement('div');
    box.style.cssText = 'padding:6px;min-width:220px;max-height:60vh;overflow:auto;display:flex;flex-direction:column;gap:2px';
    box.innerHTML = `<div class="btn-row" style="margin-bottom:6px"><button class="btn sm" data-a="all">${u.esc(t('col.showall'))}</button><button class="btn sm" data-a="none">${u.esc(t('col.hideall'))}</button></div>` +
      s.cols.map((c, i) => `<label class="chk" style="padding:4px 6px;border-radius:6px"><input type="checkbox" data-i="${i}"${c.hidden ? '' : ' checked'}/><span class="ty-${c.type}" style="font-size:9.5px;font-weight:800;min-width:42px">${c.type}</span>${u.esc(c.name)}</label>`).join('');
    box.addEventListener('change', (e) => { const i = +e.target.dataset.i; S.commit((x) => { x.cols[i].hidden = !e.target.checked; }); });
    box.addEventListener('click', (e) => {
      const a = e.target.dataset.a; if (!a) return;
      S.commit((x) => x.cols.forEach((c) => { c.hidden = a === 'none'; }));
      box.querySelectorAll('input').forEach((c) => { c.checked = a === 'all'; });
    });
    const r = $('#btnColsVis').getBoundingClientRect();
    ui.menu(box, rtlNow() ? r.right - 230 : r.left, r.bottom + 4);
  };
  const rtlNow = () => document.documentElement.dir === 'rtl';
  const rowsMenu = () => {
    const n = G.selectedDataRows().length;
    ui.menuAt($('#btnRowMenu'), [
      { label: t('rows.add', { n: 10 }), run: () => G.addRows(10) }, { label: t('rows.add', { n: 100 }), run: () => G.addRows(100) }, { label: t('rows.add', { n: 1000 }), run: () => G.addRows(1000) },
      { sep: 1 },
      { label: t('m.duprows', { n }), run: () => S.commit((x) => ops.duplicateRows(x, G.selectedDataRows())) },
      { label: t('m.delrows', { n }), danger: 1, run: G.deleteRows },
      { sep: 1 },
      { label: t('st.erows'), run: () => { let k = 0; S.commit((x) => { k = ops.removeEmptyRows(x); }); ui.toast(t('st.erows.done', { n: k }), k ? 'ok' : 'info'); } },
    ]);
  };

  /* ═════════ filter bar ═════════ */
  const renderFilterBar = () => {
    const s = sh(), v = s.view, fb = $('#filterbar');
    let h = v.filters.map((f, i) => `<span class="chip f"><b>${u.esc(s.cols[f.col].name)}</b> ${u.esc(t('op.' + f.op))} ${ops.NO_VALUE_OPS.includes(f.op) ? '' : `<b>${u.esc(f.val)}</b>`}<span class="x" data-rm="${i}">×</span></span>`).join('');
    if (v.dups) h += `<span class="chip f" style="border-color:var(--yel)"><b style="color:var(--yel)">⧉</b> ${u.esc(t('dup.hl.chip', { c: v.dups.cols.map((c) => (s.cols[c] || {}).name).join(', ') }))}<span class="x" data-rm="dups">×</span></span>`;
    if (v.invalid) h += `<span class="chip f" style="border-color:var(--red)"><b style="color:var(--red)">⚠</b> ${u.esc(t('v.hl'))}<span class="x" data-rm="inv">×</span></span>`;
    if (h) h += `<button class="btn sm ghost" data-rm="all">${u.esc(t('f.clear'))}</button><span class="muted" style="font-size:11.5px;margin-inline-start:auto">${u.esc(t('f.showing', { a: S.viewIndex().length.toLocaleString(), b: s.rows.length.toLocaleString() }))}</span>`;
    fb.innerHTML = h;
  };

  /* ═════════ sheet tabs ═════════ */
  const renderTabs = () => {
    const bar = $('#sheetbar');
    bar.innerHTML = S.wb.sheets.map((s, i) => `<div class="tab${i === S.wb.active ? ' on' : ''}" draggable="true" data-i="${i}" tabindex="0">${u.esc(s.name)} <small>${s.rows.length.toLocaleString()}</small></div>`).join('') + `<button class="btn sm ghost tab-add" id="addSheet" title="${u.esc(t('tab.add'))}">${ui.icon('plus')}</button>`;
  };
  const tabMenu = (i, x, y) => ui.menu([
    { label: t('tab.rename'), run: async () => { const n = await ui.prompt(t('tab.rename'), S.wb.sheets[i].name); if (n) S.renameSheet(i, n); } },
    { label: t('tab.dup'), run: () => S.duplicateSheet(i) },
    { label: t('tab.left'), disabled: i === 0, run: () => S.moveSheet(i, i - 1) },
    { label: t('tab.right'), disabled: i === S.wb.sheets.length - 1, run: () => S.moveSheet(i, i + 1) },
    { sep: 1 },
    { label: t('tab.del'), danger: 1, run: async () => { if (await ui.confirm(t('tab.del.q', { n: S.wb.sheets[i].name }), { danger: true })) S.deleteSheet(i); } },
  ], x, y);

  /* ═════════ welcome ═════════ */
  C.applyToActive = (ns) => {
    if (S.isBlank()) S.newWorkbook([ns], S.wb.name);
    else S.commit((x) => { x.cols = ns.cols; x.rows = ns.rows; x.view = S.mkView(); });
    G.setCursor && S.setSel(0, 0, 0, 0);
  };
  C.blankTable = (cols = 5, rows = 25) => {
    const ns = S.mkSheet('Sheet1', Array.from({ length: cols }, (_, i) => S.mkCol({ name: t('col.new') + ' ' + (i + 1) })), []);
    ops.insertRows(ns, 0, rows);
    C.applyToActive(ns);
  };
  const renderWelcome = () => {
    const w = $('#welcome'), show = !sh().cols.length;
    w.classList.toggle('hide', !show);
    if (!show) { w.innerHTML = ''; return; }
    if (w.dataset.lang === GF.i18n.lang && w.innerHTML) return;
    w.dataset.lang = GF.i18n.lang;
    w.innerHTML = `<div class="card"><div class="hero"><img src="assets/logo.svg" width="72" height="72" alt=""/><h1>GridForge</h1><p>${u.esc(t('wl.tag'))}</p></div>
      <div class="wl-actions">
        <div class="wl-act" data-w="open"><span class="e">📂</span>${u.esc(t('wl.open'))}<small>CSV · Excel · JSON</small></div>
        <div class="wl-act" data-w="paste"><span class="e">📋</span>${u.esc(t('wl.paste'))}<small>${u.esc(t('wl.paste.s'))}</small></div>
        <div class="wl-act" data-w="blank"><span class="e">🗒️</span>${u.esc(t('wl.blank'))}<small>${u.esc(t('wl.blank.s'))}</small></div>
        <div class="wl-act" data-w="demo"><span class="e">✨</span>${u.esc(t('wl.demo'))}<small>${u.esc(t('wl.demo.s'))}</small></div></div>
      <div class="sdiv">${u.esc(t('tpl.title'))}</div>
      <div class="tpl-row">${Object.keys(GF.templates).filter((k) => GF.templates[k].cols).map((k) => `<div class="tile" data-w="tpl" data-k="${k}"><span class="e">${GF.templates[k].e}</span>${u.esc(t('tpl.' + k))}</div>`).join('')}</div>
      <p class="muted" style="text-align:center;font-size:12px">🔒 ${u.esc(t('wl.privacy'))} · <kbd>Ctrl K</kbd></p></div>`;
    w.onclick = (e) => {
      const a = e.target.closest('[data-w]'); if (!a) return;
      ({ open: () => GF.dialogs.import(), paste: () => GF.dialogs.paste(), blank: () => C.blankTable(), demo: () => C.applyToActive(GF.templates.demo()), tpl: () => C.applyToActive(GF.templates.make(a.dataset.k)) })[a.dataset.w]();
    };
  };

  /* ═════════ status bar ═════════ */
  const addr = (r, p) => { const vc = S.visCols(); return u.colLetter(vc[p] == null ? p : vc[p]) + ((S.viewIndex()[r] == null ? r : S.viewIndex()[r]) + 1); };
  const renderStatus = () => {
    const s = sh(), n = S.viewIndex().length, vcN = S.visCols().length;
    $('#sbRows').innerHTML = `${u.esc(t('sb.rows'))} <b>${n === s.rows.length ? n.toLocaleString() : n.toLocaleString() + ' / ' + s.rows.length.toLocaleString()}</b> · ${u.esc(t('sb.cols'))} <b>${vcN}${vcN !== s.cols.length ? '/' + s.cols.length : ''}</b>`;
    $('#sbFile').textContent = s.name;
    renderSel();
  };
  const renderSel = () => {
    const s = sh(), r = S.selRange(), idx = S.viewIndex(), vc = S.visCols(), el = $('#sbSel');
    if (!s.cols.length || !idx.length) { el.textContent = ''; return; }
    const cells = (r.r2 - r.r1 + 1) * (r.c2 - r.c1 + 1);
    if (cells === 1) {
      const v = String((s.rows[idx[r.r1]] || [])[vc[r.c1]] || '');
      el.innerHTML = `<b>${addr(r.r1, r.c1)}</b> ${u.esc(v.length > 60 ? v.slice(0, 60) + '…' : v)}`;
      return;
    }
    let sum = 0, k = 0, filled = 0;
    if (cells <= 200000) for (let i = r.r1; i <= r.r2; i++) for (let p = r.c1; p <= r.c2; p++) { const v = (s.rows[idx[i]] || [])[vc[p]]; if (!u.isEmpty(v)) { filled++; const x = u.num(v); if (!isNaN(x)) { sum += x; k++; } } }
    el.innerHTML = `<b>${addr(r.r1, r.c1)}:${addr(r.r2, r.c2)}</b> · ${u.esc(t('sb.cells'))} <b>${cells.toLocaleString()}</b>` + (k ? ` · Σ <b>${u.fmtNum(sum)}</b> · ${u.esc(t('a.mean'))} <b>${u.fmtNum(sum / k)}</b>` : '');
  };

  /* ═════════ init ═════════ */
  C.refreshAll = () => { renderToolbar(); renderFilterBar(); renderTabs(); renderWelcome(); renderStatus(); maybePanel(); };
  C.init = () => {
    // top bar
    $('#btnUndo').onclick = () => { if (!S.undo()) ui.toast(t('toast.nothing'), 'info', { ms: 1200 }); };
    $('#btnRedo').onclick = () => S.redo();
    $('#btnImport').onclick = () => GF.dialogs.import();
    $('#btnExport').onclick = () => (S.isBlank() ? ui.toast(t('need.data'), 'info') : GF.dialogs.export());
    $('#btnSettings').onclick = () => GF.dialogs.settings();
    $('#btnHelp').onclick = () => GF.dialogs.help();
    $('#btnPalette').onclick = () => GF.dialogs.palette();
    $('#btnTheme').onclick = () => S.setSetting('theme', ['light', 'sunset', 'ivory'].includes(S.settings.theme) ? 'dark' : 'light');
    $('#btnLang').onclick = () => S.setSetting('lang', S.settings.lang === 'fa' ? 'en' : 'fa');
    $('#logo').onclick = (e) => { e.preventDefault(); };
    const pn = $('#projName');
    pn.oninput = () => { S.wb.name = pn.value; document.title = (pn.value ? pn.value + ' — ' : '') + 'GridForge'; S.scheduleSave(); };
    GF.on('named', () => { pn.value = S.wb.name; pn.oninput(); });
    // rail + panel
    document.querySelectorAll('#rail button').forEach((b) => { b.onclick = () => C.openPanel(b.dataset.panel); });
    $('#panelClose').onclick = () => { S.setSetting('panelOpen', false); C.renderPanel(); };
    $('#btnPanelToggle').onclick = () => { S.setSetting('panelOpen', !S.settings.panelOpen); C.renderPanel(); };
    // toolbar
    const q = $('#q');
    q.addEventListener('input', u.debounce(() => S.setView({ q: q.value }), 160));
    q.addEventListener('keydown', (e) => { if (e.key === 'Escape') { q.value = ''; S.setView({ q: '' }); q.blur(); $('#gscroll').focus(); } else if (e.key === 'Enter') { $('#gscroll').focus(); } });
    $('#tCase').onclick = () => S.setView({ cs: !sh().view.cs });
    $('#tRx').onclick = () => S.setView({ rx: !sh().view.rx });
    $('#qScope').onchange = (e) => S.setView({ scol: +e.target.value });
    $('#btnFilter').onclick = () => { if (!sh().cols.length) return; const c = G.curCell(); G.filterPopover(c ? c.col : 0, $('#btnFilter')); };
    $('#btnColsVis').onclick = () => sh().cols.length && colsPopover();
    $('#btnAddRow').onclick = () => G.addRows(1);
    $('#btnRowMenu').onclick = rowsMenu;
    $('#filterbar').addEventListener('click', (e) => {
      const r = e.target.closest('[data-rm]'); if (!r) return;
      const v = sh().view, k = r.dataset.rm;
      if (k === 'all') S.setView({ filters: [], q: '', dups: null, invalid: false });
      else if (k === 'dups') S.setView({ dups: null });
      else if (k === 'inv') S.setView({ invalid: false });
      else S.setView({ filters: v.filters.filter((_, i) => i !== +k) });
    });
    // tabs
    const bar = $('#sheetbar');
    bar.addEventListener('click', (e) => {
      if (e.target.closest('#addSheet')) return S.addSheet(S.mkSheet(t('tab.sheet') + ' ' + (S.wb.sheets.length + 1)));
      const tab = e.target.closest('.tab'); if (tab) S.setActive(+tab.dataset.i);
    });
    bar.addEventListener('dblclick', async (e) => { const tab = e.target.closest('.tab'); if (!tab) return; const i = +tab.dataset.i, n = await ui.prompt(t('tab.rename'), S.wb.sheets[i].name); if (n) S.renameSheet(i, n); });
    bar.addEventListener('contextmenu', (e) => { const tab = e.target.closest('.tab'); if (tab) { e.preventDefault(); tabMenu(+tab.dataset.i, e.clientX, e.clientY - 150); } });
    let dragT = null;
    bar.addEventListener('dragstart', (e) => { const tab = e.target.closest('.tab'); if (tab) dragT = +tab.dataset.i; });
    bar.addEventListener('dragover', (e) => e.preventDefault());
    bar.addEventListener('drop', (e) => { const tab = e.target.closest('.tab'); if (tab && dragT != null) S.moveSheet(dragT, +tab.dataset.i); dragT = null; });
    // reactive updates
    GF.on('change', () => { C.refreshAll(); });
    GF.on('view', () => { renderToolbar(); renderFilterBar(); renderStatus(); });
    GF.on('sheets', () => { scopeSig = ''; C.refreshAll(); });
    GF.on('sel', renderSel);
    GF.on('history', renderToolbar);
    GF.on('settings', (k) => { C.applySettings(); if (k === 'panel' || k === 'panelOpen' || k === 'lang' || k === '*') C.renderPanel(); });
    GF.on('lang', () => { GF.i18n.apply(); scopeSig = ''; $('#welcome').dataset.lang = ''; C.refreshAll(); C.renderPanel(); G.render(); });
    GF.on('saving', (s) => {
      $('#sbDot').className = 'dot ' + (s === 'saved' ? '' : s);
      $('#sbSave').textContent = t(s === 'saved' ? 'sb.saved' : s === 'pending' ? 'sb.saving' : 'sb.saveerr');
    });
    // drag & drop files anywhere
    const veil = $('#dropVeil'); let depth = 0;
    const hasFiles = (e) => e.dataTransfer && [...e.dataTransfer.types].includes('Files');
    window.addEventListener('dragenter', (e) => { if (hasFiles(e)) { depth++; veil.classList.add('on'); } });
    window.addEventListener('dragleave', (e) => { if (hasFiles(e) && --depth <= 0) { depth = 0; veil.classList.remove('on'); } });
    window.addEventListener('dragover', (e) => { if (hasFiles(e)) e.preventDefault(); });
    window.addEventListener('drop', (e) => { depth = 0; veil.classList.remove('on'); if (hasFiles(e)) { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f && !ui.hasModal()) GF.dialogs.import(f); } });
    // paste raw data on the welcome screen
    document.addEventListener('paste', (e) => {
      if (sh().cols.length || ui.hasModal() || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
      const txt = e.clipboardData.getData('text/plain'); if (!txt.trim()) return;
      e.preventDefault();
      const ns = GF.io.toSheet('Sheet1', GF.io.parseDelimited(txt.replace(/\r\n?/g, '\n'), GF.io.detectDelimiter(txt)), { header: true });
      C.applyToActive(ns); ui.toast(t('imp.done', { r: ns.rows.length.toLocaleString(), c: ns.cols.length }), 'ok');
    });
    window.addEventListener('beforeunload', (e) => { if (S.dirty && S.settings.autosave) S.save(); });
    C.applySettings();
    C.refreshAll();
    C.renderPanel();
  };
})(typeof window !== 'undefined' ? window : globalThis);
