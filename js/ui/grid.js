/* GridForge — grid.js : virtualised, editable data grid (selection, copy/paste, sort, filter, resize) */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u, S = GF.store, ops = GF.ops;
  const t = (k, v) => GF.i18n.t(k, v);
  const G = (GF.grid = {});
  const TYPES = ['text', 'number', 'date', 'boolean', 'email', 'url', 'select'];
  const OVER = 10;

  let el = {}, vc = [], rh = 32, hh = 40, ed = null, drag = null, raf = 0, lastSig = '';
  const dupSetCache = {};

  const colW = (c) => c.width || ({ date: 130, boolean: 100, number: 120, email: 210, url: 210 }[c.type] || 170);
  const measure = () => {
    rh = parseFloat(getComputedStyle(document.body).getPropertyValue('--rh')) || 32;
    hh = rh + 8;
  };

  /* ═════════ rendering ═════════ */
  G.init = () => {
    el = { scroll: u.$('#gscroll'), table: u.$('#grid'), head: u.$('#ghead'), body: u.$('#gbody'), wrap: u.$('#gridwrap') };
    el.table.insertAdjacentHTML('afterbegin', '<colgroup id="gcols"></colgroup>');
    el.empty = document.createElement('div');
    el.empty.className = 'empty-note hide';
    el.wrap.appendChild(el.empty);
    el.scroll.addEventListener('scroll', () => { if (ed) G.commitEdit(); schedule(false); }, { passive: true });
    new ResizeObserver(() => schedule(false)).observe(el.scroll);
    GF.on('change', (e) => schedule(true));
    GF.on('view', () => schedule(true));
    GF.on('sheets', () => schedule(true));
    GF.on('settings', (k) => { if (['density', 'font', 'rownums', 'freeze', 'hl', '*'].includes(k)) schedule(true); });
    GF.on('sel', () => schedule(false));
    bind();
    schedule(true);
  };
  const schedule = (full) => {
    G._full = G._full || full;
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; const f = G._full; G._full = false; f ? G.render() : G.renderBody(); });
  };
  G.render = () => { measure(); renderHead(); G.renderBody(); };

  function renderHead() {
    const sh = S.sheet(), v = sh.view;
    vc = S.visCols(sh);
    const frzOn = true;
    const sorts = new Map(v.sort.map((s, i) => [s.col, { dir: s.dir, n: i + 1 }]));
    const filt = new Set(v.filters.map((f) => f.col));
    const r = S.selRange();
    let total = parseFloat(getComputedStyle(document.body).getPropertyValue('--rn-w')) || 56;
    if (document.body.dataset.rownums === 'off') total = 14;
    let cg = `<col style="width:${total}px">`;
    let th = `<th class="rn" data-act="all" title="${u.esc(t('grid.selectall'))}">#</th>`;
    vc.forEach((ci, p) => {
      const c = sh.cols[ci], w = colW(c), so = sorts.get(ci);
      total += w;
      cg += `<col style="width:${w}px">`;
      th += `<th class="${p === 0 ? 'frz ' : ''}${filt.has(ci) ? 'hasfilter ' : ''}${p >= r.c1 && p <= r.c2 && r.r1 === 0 && r.r2 >= S.rowCountView() - 1 && S.rowCountView() > 0 ? 'colsel' : ''}" data-p="${p}" data-c="${ci}">
        <div class="ch"><div class="nm" data-act="sort" title="${u.esc(c.name)}"><b>${u.esc(c.name)}</b><small class="ty-${c.type}">${c.type}${c.required ? ' *' : ''}${c.unique ? ' ◆' : ''}${so ? `<span class="sortb">${so.dir === 'asc' ? '▲' : '▼'}${v.sort.length > 1 ? so.n : ''}</span>` : ''}</small></div>
        <button class="more" data-act="menu" tabindex="-1">${GF.ui.icon('more')}</button><span class="rz" data-act="rz"></span></div></th>`;
    });
    el.head.innerHTML = '<tr>' + th + '</tr>';
    u.$('#gcols').innerHTML = cg;
    el.table.style.width = total + 'px';
    el.scroll.style.setProperty('--tw', total + 'px');
  }

  const hlText = (s, re) => {
    if (!re) return u.esc(s);
    let out = '', last = 0, m, n = 0;
    re.lastIndex = 0;
    while ((m = re.exec(s)) && n++ < 50) {
      if (!m[0]) { re.lastIndex++; continue; }
      out += u.esc(s.slice(last, m.index)) + '<mark>' + u.esc(m[0]) + '</mark>';
      last = m.index + m[0].length;
    }
    return out + u.esc(s.slice(last));
  };

  G.renderBody = () => {
    if (ed) return;
    const sh = S.sheet(), v = sh.view;
    if (!sh.cols.length) { el.body.innerHTML = ''; el.empty.classList.add('hide'); return; }
    const idx = S.viewIndex(), n = idx.length;
    const sigCols = vc.join(',') + '|' + sh.cols.length;
    if (sigCols !== lastSig) { lastSig = sigCols; vc = S.visCols(sh); }
    const st = el.scroll.scrollTop, ch = el.scroll.clientHeight || 600;
    const first = Math.max(0, Math.floor(st / rh) - OVER), last = Math.min(n, Math.ceil((st + ch) / rh) + OVER);
    const r = S.selRange(), cur = S.sel;
    const sr = ops.searchRe(v);
    const re = S.settings.hl && sr && !sr.bad ? sr.hl : null;
    const dups = ops.dupHighlightSet(sh);
    const bad = v.invalid;
    let html = first > 0 ? `<tr class="spacer"><td colspan="${vc.length + 1}" style="height:${first * rh}px"></td></tr>` : '';
    for (let i = first; i < last; i++) {
      const di = idx[i], row = sh.rows[di];
      const rs = i >= r.r1 && i <= r.r2;
      html += `<tr data-r="${i}"><td class="rn${rs ? ' rsel' : ''}" data-act="row">${di + 1}</td>`;
      for (let p = 0; p < vc.length; p++) {
        const ci = vc[p], col = sh.cols[ci], val = row[ci] == null ? '' : String(row[ci]);
        let cls = 't-' + col.type;
        if (p === 0) cls += ' frz';
        if (rs && p >= r.c1 && p <= r.c2) cls += (r.r1 === r.r2 && r.c1 === r.c2) ? '' : ' sel';
        if (i === cur.r1 && p === cur.c1) cls += ' cur';
        if (dups && dups.has(di) && v.dups.cols.includes(ci)) cls += ' dup';
        if (bad && ops.cellIssue(col, val)) cls += ' bad';
        if (col.type === 'boolean' && val) cls += u.boolVal(val) ? ' yes' : ' no';
        const showHl = re && (v.scol < 0 || v.scol === ci);
        html += `<td class="${cls}" data-r="${i}" data-p="${p}">${showHl ? hlText(val, re) : u.esc(val)}</td>`;
      }
      html += '</tr>';
    }
    if (last < n) html += `<tr class="spacer"><td colspan="${vc.length + 1}" style="height:${(n - last) * rh}px"></td></tr>`;
    el.body.innerHTML = html;
    el.empty.classList.toggle('hide', n > 0);
    if (!n) el.empty.innerHTML = `<div class="e">${sh.rows.length ? '🔍' : '🗒️'}</div><b>${u.esc(sh.rows.length ? t('grid.nomatch') : t('grid.norows'))}</b>`;
  };

  const cellEl = (r, p) => el.body.querySelector(`td[data-r="${r}"][data-p="${p}"]`);
  G.ensureVisible = (r, p) => {
    const st = el.scroll.scrollTop, ch = el.scroll.clientHeight;
    const top = r * rh, bot = (r + 1) * rh + hh;
    if (top < st) el.scroll.scrollTop = top;
    else if (bot > st + ch) el.scroll.scrollTop = bot - ch;
    G.renderBody();
    const td = cellEl(r, p);
    if (td) td.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  };

  /* ═════════ selection helpers ═════════ */
  const nRows = () => S.rowCountView();
  const nCols = () => vc.length;
  G.setCursor = (r, p, extend) => {
    r = Math.max(0, Math.min(r, nRows() - 1)); p = Math.max(0, Math.min(p, nCols() - 1));
    if (extend) S.setSel(S.sel.r1, S.sel.c1, r, p); else S.setSel(r, p, r, p);
    G.ensureVisible(r, p);
  };
  G.selectAll = () => { S.setSel(0, 0, nRows() - 1, nCols() - 1); };
  G.selectCol = (p) => { S.setSel(0, p, nRows() - 1, p); };
  G.selectedDataRows = () => { const idx = S.viewIndex(), r = S.selRange(), a = []; for (let i = r.r1; i <= r.r2 && i < idx.length; i++) a.push(idx[i]); return a; };
  G.selectedColIdx = () => { const r = S.selRange(), a = []; for (let p = r.c1; p <= r.c2 && p < vc.length; p++) a.push(vc[p]); return a; };
  G.curCell = () => { const idx = S.viewIndex(), r = S.sel.r1, p = S.sel.c1; return idx[r] == null ? null : { row: idx[r], col: vc[p], r, p }; };

  /* ═════════ editing ═════════ */
  G.startEdit = (r, p, init) => {
    if (ed) G.commitEdit();
    const sh = S.sheet(), idx = S.viewIndex();
    if (idx[r] == null || vc[p] == null) return;
    G.ensureVisible(r, p);
    const td = cellEl(r, p);
    if (!td) return;
    const col = sh.cols[vc[p]], val = sh.rows[idx[r]][vc[p]] || '';
    let inp;
    const opts = col.type === 'boolean' ? ['', 'true', 'false'] : col.type === 'select' && col.options ? [''].concat(col.options.split(',').map((x) => x.trim()).filter(Boolean)) : null;
    if (opts) {
      inp = document.createElement('select');
      if (val && !opts.includes(val)) opts.push(val);
      inp.innerHTML = opts.map((o) => `<option value="${u.esc(o)}"${o === val ? ' selected' : ''}>${u.esc(o)}</option>`).join('');
    } else {
      inp = document.createElement('input');
      inp.value = init != null ? init : val;
      inp.spellcheck = false;
      inp.setAttribute('dir', 'auto');
    }
    ed = { r, p, td, inp, orig: val, row: idx[r], col: vc[p] };
    td.className = td.className.replace(/\b(cur|sel)\b/g, '') + ' editing';
    td.textContent = '';
    td.appendChild(inp);
    inp.focus();
    if (inp.setSelectionRange && init == null) { const l = inp.value.length; inp.setSelectionRange(l, l); }
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); G.commitEdit(); G.setCursor(r + (e.shiftKey ? -1 : 1), p); el.scroll.focus(); }
      else if (e.key === 'Tab') { e.preventDefault(); G.commitEdit(); G.setCursor(r, p + (e.shiftKey ? -1 : 1)); el.scroll.focus(); }
      else if (e.key === 'Escape') { e.preventDefault(); G.cancelEdit(); }
      e.stopPropagation();
    });
    inp.addEventListener('blur', () => { if (ed && ed.inp === inp) G.commitEdit(); });
    if (opts) inp.addEventListener('change', () => { G.commitEdit(); el.scroll.focus(); });
  };
  G.cancelEdit = () => { if (!ed) return; ed = null; el.scroll.focus(); G.renderBody(); };
  G.commitEdit = () => {
    if (!ed) return;
    const e = ed; ed = null;
    const v = e.inp.value;
    if (v !== e.orig) S.commit((sh) => { sh.rows[e.row][e.col] = v; }, 'sheet', { keepView: true });
    else G.renderBody();
  };

  /* ═════════ clipboard ═════════ */
  const tsvCell = (s) => (/[\t\r\n"]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s);
  G.selectionText = () => {
    const sh = S.sheet(), idx = S.viewIndex(), r = S.selRange(), out = [];
    for (let i = r.r1; i <= r.r2 && i < idx.length; i++) {
      const row = [];
      for (let p = r.c1; p <= r.c2 && p < vc.length; p++) row.push(tsvCell(String(sh.rows[idx[i]][vc[p]] || '')));
      out.push(row.join('\t'));
    }
    return out.join('\n');
  };
  G.clearSel = () => {
    const rows = G.selectedDataRows(), cols = G.selectedColIdx();
    if (!rows.length) return;
    S.commit((sh) => { rows.forEach((ri) => cols.forEach((c) => { sh.rows[ri][c] = ''; })); }, 'sheet', { keepView: true });
  };
  G.pasteText = (text) => {
    if (!text) return;
    const grid = /[\t\n\r]/.test(text) ? GF.io.parseDelimited(text.replace(/\r\n?/g, '\n').replace(/\n$/, ''), '\t') : [[text]];
    if (!grid.length) return;
    const idx = S.viewIndex(), r = S.selRange();
    const single = grid.length === 1 && grid[0].length === 1;
    const multi = single && (r.r2 > r.r1 || r.c2 > r.c1);
    let appended = false, clipped = false;
    S.commit((sh) => {
      const R = multi ? r.r2 - r.r1 + 1 : grid.length;
      for (let i = 0; i < R; i++) {
        let di = idx[r.r1 + i];
        if (di == null) { sh.rows.push(sh.cols.map((c) => c.def || '')); di = sh.rows.length - 1; appended = true; }
        const W = multi ? r.c2 - r.c1 + 1 : grid[i].length;
        for (let j = 0; j < W; j++) {
          const ci = vc[r.c1 + j];
          if (ci == null) { clipped = true; continue; }
          sh.rows[di][ci] = multi ? grid[0][0] : grid[i][j] == null ? '' : grid[i][j];
        }
      }
    }, 'sheet', { keepView: !appended });
    if (clipped) GF.ui.toast(t('grid.clipped'), 'info');
    else GF.ui.toast(t('grid.pasted', { n: grid.length * (grid[0] || []).length }), 'ok', { ms: 1600 });
  };
  G.fill = (dir) => {
    const idx = S.viewIndex(), r = S.selRange();
    S.commit((sh) => {
      if (dir === 'down') for (let p = r.c1; p <= r.c2; p++) { const src = sh.rows[idx[r.r1]][vc[p]]; for (let i = r.r1 + 1; i <= r.r2; i++) sh.rows[idx[i]][vc[p]] = src; }
      else for (let i = r.r1; i <= r.r2; i++) { const src = sh.rows[idx[i]][vc[r.c1]]; for (let p = r.c1 + 1; p <= r.c2; p++) sh.rows[idx[i]][vc[p]] = src; }
    }, 'sheet', { keepView: true });
  };

  /* ═════════ rows & columns ═════════ */
  G.addRows = (n, at) => {
    if (!S.sheet().cols.length) { GF.ui.toast(t('grid.needcols'), 'info'); return; }
    const sh = S.sheet();
    const pos = at == null ? sh.rows.length : at;
    S.commit((s) => ops.insertRows(s, pos, n));
    const i = S.viewIndex().indexOf(pos);
    if (i >= 0) G.setCursor(i, Math.min(S.sel.c1, nCols() - 1));
  };
  G.deleteRows = async () => {
    const rows = G.selectedDataRows();
    if (!rows.length) return;
    if (rows.length > 20 && !(await GF.ui.confirm(t('grid.delrows.q', { n: rows.length }), { danger: true }))) return;
    S.commit((sh) => ops.deleteRows(sh, new Set(rows)));
    GF.ui.toast(t('grid.deleted', { n: rows.length }), 'ok', { action: { label: t('act.undo'), run: S.undo } });
  };
  G.fitCol = (ci) => {
    const sh = S.sheet(), c = sh.cols[ci];
    let m = c.name.length + 4;
    for (let i = 0; i < Math.min(sh.rows.length, 300); i++) m = Math.max(m, String(sh.rows[i][ci] || '').length);
    c.width = Math.max(70, Math.min(480, Math.round(m * 7.4 + 26)));
    S.scheduleSave(); G.render();
  };
  G.toggleSort = (ci, multi) => {
    const v = S.sheet().view, cur = v.sort.find((s) => s.col === ci);
    const next = !cur ? 'asc' : cur.dir === 'asc' ? 'desc' : null;
    const sort = multi ? v.sort.filter((s) => s.col !== ci) : [];
    if (next) { if (multi && cur) sort.splice(v.sort.indexOf(cur), 0, { col: ci, dir: next }); else sort.push({ col: ci, dir: next }); }
    S.setView({ sort });
  };
  G.setSort = (ci, dir) => S.setView({ sort: dir ? [{ col: ci, dir }] : S.sheet().view.sort.filter((s) => s.col !== ci) });
  G.addFilter = (f) => { const v = S.sheet().view; S.setView({ filters: [...v.filters, f] }); };
  G.setType = (ci, type) => S.commit((sh) => { sh.cols[ci].type = type; });

  G.filterPopover = (ci, anchor, preset) => {
    const sh = S.sheet();
    const box = document.createElement('div');
    box.style.cssText = 'display:flex;flex-direction:column;gap:8px;padding:8px;width:260px';
    const opLbl = (o) => [o, t('op.' + o)];
    box.innerHTML = `<div class="fld"><label>${u.esc(t('f.column'))}</label><select class="in" id="fc">${GF.ui.colOpts(sh, { sel: ci })}</select></div>
      <div class="fld"><label>${u.esc(t('f.cond'))}</label><select class="in" id="fo">${GF.ui.opts(ops.FILTER_OPS.map(opLbl), (preset && preset.op) || 'contains')}</select></div>
      <div class="fld" id="fvw"><label>${u.esc(t('f.value'))}</label><input class="in" id="fv" value="${u.esc((preset && preset.val) || '')}"/></div>
      <button class="btn pri block" id="fadd">${u.esc(t('f.add'))}</button>`;
    const sync = () => { u.$('#fvw', box).style.display = ops.NO_VALUE_OPS.includes(u.$('#fo', box).value) ? 'none' : ''; };
    u.$('#fo', box).onchange = sync; sync();
    const go = () => { G.addFilter({ col: +u.$('#fc', box).value, op: u.$('#fo', box).value, val: u.$('#fv', box).value }); GF.ui.closeMenu(); };
    u.$('#fadd', box).onclick = go;
    u.$('#fv', box).addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    const r = anchor.getBoundingClientRect();
    GF.ui.menu(box, document.documentElement.dir === 'rtl' ? r.right - 260 : r.left, r.bottom + 4);
    setTimeout(() => u.$('#fv', box).focus(), 20);
  };

  G.headerMenu = (ci, p, anchor) => {
    const sh = S.sheet(), c = sh.cols[ci], v = sh.view;
    const items = [
      { label: t('m.sortasc'), icon: '▲', run: () => G.setSort(ci, 'asc') },
      { label: t('m.sortdesc'), icon: '▼', run: () => G.setSort(ci, 'desc') },
      { label: t('m.sortclear'), icon: '↺', run: () => G.setSort(ci, null), disabled: !v.sort.some((s) => s.col === ci) },
      { sep: 1 },
      { label: t('m.filter'), icon: '⏷', run: () => G.filterPopover(ci, anchor) },
      { label: t('m.onlyempty'), icon: '∅', run: () => G.addFilter({ col: ci, op: 'empty' }) },
      { label: t('m.onlyfilled'), icon: '●', run: () => G.addFilter({ col: ci, op: 'notempty' }) },
      { label: t('m.showdups'), icon: '⧉', run: () => G.addFilter({ col: ci, op: 'dupes' }) },
      { label: t('m.showinvalid'), icon: '⚠', run: () => G.addFilter({ col: ci, op: 'invalid' }) },
      { label: v.dups && v.dups.cols.length === 1 && v.dups.cols[0] === ci ? t('m.hidedups') : t('m.hldups'), icon: '🖍', run: () => S.setView({ dups: v.dups && v.dups.cols[0] === ci ? null : { cols: [ci], ic: true, trim: true } }) },
      { sep: 1 },
      { header: t('m.type') },
      ...TYPES.map((ty) => ({ label: ty + (ty === c.type ? ' ✓' : ''), icon: '', run: () => G.setType(ci, ty) })),
      { sep: 1 },
      { label: t('m.rename'), icon: '✎', run: async () => { const n = await GF.ui.prompt(t('m.rename'), c.name); if (n && n.trim()) S.commit((s) => { s.cols[ci].name = u.uniqueName(n.trim(), s.cols.filter((_, i) => i !== ci).map((x) => x.name)); }); } },
      { label: t('m.fit'), icon: '↔', run: () => G.fitCol(ci) },
      { label: t('m.selcol'), icon: '▮', run: () => G.selectCol(p) },
      { label: t('m.hide'), icon: '🙈', run: () => S.commit((s) => { s.cols[ci].hidden = true; }) },
      { label: t('m.insl'), icon: '⇤', run: () => S.commit((s) => ops.insertCol(s, ci, { name: t('col.new') })) },
      { label: t('m.insr'), icon: '⇥', run: () => S.commit((s) => ops.insertCol(s, ci + 1, { name: t('col.new') })) },
      { label: t('m.dupcol'), icon: '⧉', run: () => S.commit((s) => ops.duplicateCol(s, ci)) },
      { label: t('m.delcol'), icon: '✕', danger: 1, run: () => S.commit((s) => ops.deleteCols(s, [ci])) },
    ];
    GF.ui.menuAt(anchor, items);
  };

  G.cellMenu = (e, r, p) => {
    const sh = S.sheet(), idx = S.viewIndex(), ci = vc[p], di = idx[r];
    const rr = S.selRange();
    if (!(r >= rr.r1 && r <= rr.r2 && p >= rr.c1 && p <= rr.c2)) S.setSel(r, p, r, p);
    const val = String(sh.rows[di][ci] || '');
    const n = G.selectedDataRows().length;
    GF.ui.menu([
      { label: t('m.copy'), icon: '⧉', kbd: 'Ctrl C', run: () => navigator.clipboard && navigator.clipboard.writeText(G.selectionText()).then(() => GF.ui.toast(t('toast.copied'), 'ok', { ms: 1200 })) },
      { label: t('m.paste'), icon: '⎘', kbd: 'Ctrl V', run: () => (navigator.clipboard && navigator.clipboard.readText ? navigator.clipboard.readText().then(G.pasteText).catch(() => GF.ui.toast(t('toast.pastehint'), 'info')) : GF.ui.toast(t('toast.pastehint'), 'info')) },
      { label: t('m.clear'), icon: '⌫', kbd: 'Del', run: G.clearSel },
      { sep: 1 },
      { label: t('m.fval', { v: val.length > 22 ? val.slice(0, 22) + '…' : val || '∅' }), icon: '=', run: () => G.addFilter(val ? { col: ci, op: 'equals', val } : { col: ci, op: 'empty' }) },
      { label: t('m.fnval'), icon: '≠', run: () => G.addFilter(val ? { col: ci, op: 'notequals', val } : { col: ci, op: 'notempty' }) },
      { sep: 1 },
      { label: t('m.insabove'), icon: '↑', run: () => G.addRows(1, di) },
      { label: t('m.insbelow'), icon: '↓', run: () => G.addRows(1, di + 1) },
      { label: t('m.duprows', { n }), icon: '⧉', run: () => S.commit((s) => ops.duplicateRows(s, G.selectedDataRows())) },
      { label: t('m.delrows', { n }), icon: '✕', danger: 1, run: G.deleteRows },
    ], e.clientX, e.clientY);
  };

  /* ═════════ events ═════════ */
  function bind() {
    const sc = el.scroll;
    sc.addEventListener('mousedown', (e) => {
      const rz = e.target.closest('[data-act=rz]');
      if (rz) return startResize(e, rz);
      if (e.target.closest('.editing')) return;
      const td = e.target.closest('td[data-r]');
      if (!td || e.button === 2) return;
      sc.focus();
      const r = +td.dataset.r;
      if (td.classList.contains('rn')) {
        if (e.shiftKey) S.setSel(S.sel.r1, 0, r, nCols() - 1); else S.setSel(r, 0, r, nCols() - 1);
        drag = { rowMode: true };
      } else {
        const p = +td.dataset.p;
        if (e.shiftKey) S.setSel(S.sel.r1, S.sel.c1, r, p); else S.setSel(r, p, r, p);
        drag = {};
      }
      e.preventDefault();
    });
    sc.addEventListener('mousemove', (e) => {
      if (!drag || e.buttons !== 1) return;
      const td = e.target.closest('td[data-r]');
      if (!td) return;
      const r = +td.dataset.r;
      const p = drag.rowMode ? nCols() - 1 : +td.dataset.p;
      if (r !== S.sel.r2 || p !== S.sel.c2) S.setSel(S.sel.r1, S.sel.c1, r, p);
    });
    window.addEventListener('mouseup', () => { drag = null; });
    sc.addEventListener('dblclick', (e) => {
      const td = e.target.closest('td[data-p]');
      if (td) G.startEdit(+td.dataset.r, +td.dataset.p);
      const rz = e.target.closest('[data-act=rz]');
      if (rz) G.fitCol(+rz.closest('th').dataset.c);
    });
    sc.addEventListener('click', (e) => {
      const th = e.target.closest('th');
      if (!th) return;
      if (th.classList.contains('rn')) return G.selectAll();
      const ci = +th.dataset.c, p = +th.dataset.p;
      if (e.target.closest('[data-act=menu]')) return G.headerMenu(ci, p, e.target.closest('[data-act=menu]'));
      if (e.target.closest('[data-act=rz]')) return;
      if (e.altKey) return G.selectCol(p);
      if (e.target.closest('[data-act=sort]')) G.toggleSort(ci, e.shiftKey);
      else G.selectCol(p);
    });
    sc.addEventListener('contextmenu', (e) => {
      const th = e.target.closest('th[data-c]');
      if (th) { e.preventDefault(); return G.headerMenu(+th.dataset.c, +th.dataset.p, th); }
      const td = e.target.closest('td[data-p]');
      if (td) { e.preventDefault(); G.cellMenu(e, +td.dataset.r, +td.dataset.p); }
    });
    sc.addEventListener('keydown', onKey);
    document.addEventListener('copy', (e) => { if (!inGrid(e)) return; e.preventDefault(); e.clipboardData.setData('text/plain', G.selectionText()); GF.ui.toast(t('toast.copied'), 'ok', { ms: 1200 }); });
    document.addEventListener('cut', (e) => { if (!inGrid(e)) return; e.preventDefault(); e.clipboardData.setData('text/plain', G.selectionText()); G.clearSel(); });
    document.addEventListener('paste', (e) => {
      if (!inGrid(e) || S.isBlank()) return;
      e.preventDefault();
      G.pasteText(e.clipboardData.getData('text/plain'));
    });
  }
  const inGrid = (e) => !ed && !GF.ui.hasModal() && (document.activeElement === el.scroll || el.scroll.contains(document.activeElement)) && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);

  function onKey(e) {
    if (ed) return;
    const k = e.key, ctrl = e.ctrlKey || e.metaKey, sh = e.shiftKey;
    const { r2, c2, r1, c1 } = S.sel;
    const mv = (dr, dp) => { e.preventDefault(); G.setCursor((sh ? r2 : r1) + dr, (sh ? c2 : c1) + dp, sh); };
    const page = Math.max(1, Math.floor(el.scroll.clientHeight / rh) - 2);
    const rtl = document.documentElement.dir === 'rtl';
    if (k === 'ArrowDown') mv(1, 0);
    else if (k === 'ArrowUp') mv(-1, 0);
    else if (k === 'ArrowRight') mv(0, rtl ? -1 : 1);
    else if (k === 'ArrowLeft') mv(0, rtl ? 1 : -1);
    else if (k === 'PageDown') mv(page, 0);
    else if (k === 'PageUp') mv(-page, 0);
    else if (k === 'Home') { e.preventDefault(); G.setCursor(ctrl ? 0 : r1, 0, sh); }
    else if (k === 'End') { e.preventDefault(); G.setCursor(ctrl ? nRows() - 1 : r1, nCols() - 1, sh); }
    else if (k === 'Tab') { e.preventDefault(); const np = c1 + (sh ? -1 : 1); if (np >= nCols()) G.setCursor(r1 + 1, 0); else if (np < 0) G.setCursor(r1 - 1, nCols() - 1); else G.setCursor(r1, np); }
    else if (k === 'Enter' || k === 'F2') { e.preventDefault(); G.startEdit(r1, c1); }
    else if (k === 'Delete' || k === 'Backspace') { e.preventDefault(); G.clearSel(); }
    else if (k === 'Escape') { S.setSel(r1, c1, r1, c1); }
    else if (ctrl && (k === 'a' || k === 'A')) { e.preventDefault(); G.selectAll(); }
    else if (ctrl && (k === 'd' || k === 'D')) { e.preventDefault(); G.fill('down'); }
    else if (ctrl && (k === 'r' || k === 'R')) { e.preventDefault(); G.fill('right'); }
    else if (ctrl && k === 'Enter') { e.preventDefault(); G.addRows(1, (G.curCell() || { row: S.sheet().rows.length - 1 }).row + 1); }
    else if (!ctrl && !e.altKey && k.length === 1) { e.preventDefault(); G.startEdit(r1, c1, k); }
  }

  function startResize(e, rz) {
    e.preventDefault(); e.stopPropagation();
    const th = rz.closest('th'), ci = +th.dataset.c, col = S.sheet().cols[ci];
    const rtl = document.documentElement.dir === 'rtl';
    const x0 = e.clientX, w0 = th.getBoundingClientRect().width;
    rz.classList.add('on');
    const mv = (ev) => { const dx = (rtl ? -1 : 1) * (ev.clientX - x0); col.width = Math.max(50, Math.round(w0 + dx)); renderHeadOnly(); };
    const up = () => { rz.classList.remove('on'); window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up); S.scheduleSave(); G.render(); };
    window.addEventListener('mousemove', mv); window.addEventListener('mouseup', up);
  }
  function renderHeadOnly() { // lightweight width update while dragging
    const sh = S.sheet();
    let total = document.body.dataset.rownums === 'off' ? 14 : 56, cg = `<col style="width:${total}px">`;
    vc.forEach((ci) => { const w = colW(sh.cols[ci]); total += w; cg += `<col style="width:${w}px">`; });
    u.$('#gcols').innerHTML = cg; el.table.style.width = total + 'px';
  }
})(typeof window !== 'undefined' ? window : globalThis);
