/* GridForge — dialogs.js : import, paste, export, settings, shortcuts, command palette */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u, S = GF.store, io = GF.io, ui = GF.ui;
  const t = (k, v) => GF.i18n.t(k, v);
  const D = (GF.dialogs = {});
  const $ = (s, e) => u.$(s, e);
  const base = () => u.slug(S.wb.name || S.sheet().name);
  const rtl = () => GF.i18n.lang === 'fa';

  /* ═════════ IMPORT ═════════ */
  const preview = (sheets) => {
    const s = sheets[0], rows = s.rows.slice(0, 7);
    const w = Math.min(10, rows.reduce((m, r) => Math.max(m, r.length), 0));
    return `<div class="pv"><table>${rows.map((r, i) => `<tr>${Array.from({ length: w }, (_, c) => (i === 0 ? `<th>${u.esc(r[c] || '')}</th>` : `<td>${u.esc(r[c] || '')}</td>`)).join('')}</tr>`).join('')}</table></div>
      <div class="hint muted" style="font-size:11.5px">${u.esc(t('imp.found', { r: s.rows.length.toLocaleString(), s: sheets.length }))}</div>`;
  };
  D.import = (file) => {
    const sel = (id, list) => `<select class="in" id="${id}">${ui.opts(list)}</select>`;
    const m = ui.modal({
      title: t('imp.title'), sub: t('imp.sub'), wide: true,
      body: `<div class="dz" id="idz"><div class="e">📂</div><b>${u.esc(t('imp.drop'))}</b><div class="muted" style="font-size:11.5px;margin-top:3px">CSV · TSV · TXT · JSON · XLSX · XLS · ODS · .gridforge.json</div></div>
        <div id="iopts" class="hide"><div class="row2" id="iencrow">
          <div class="fld"><label>${u.esc(t('imp.enc'))}</label>${sel('ienc', [['auto', t('imp.auto')], ['utf-8', 'UTF-8'], ['windows-1256', 'Windows-1256 (فارسی/عربی)'], ['windows-1252', 'Windows-1252'], ['utf-16le', 'UTF-16']])}</div>
          <div class="fld"><label>${u.esc(t('imp.delim'))}</label>${sel('idel', [['auto', t('imp.auto')], [',', ', (comma)'], [';', '; (semicolon)'], ['tab', 'Tab'], ['|', '| (pipe)']])}</div></div>
          <div class="row2"><label class="chk"><input type="checkbox" id="ihead" checked/>${u.esc(t('imp.header'))}</label>
          <div class="fld"><select class="in" id="imode">${ui.opts([['replace', t('imp.replace')], ['add', t('imp.add')]], S.isBlank() ? 'replace' : 'add')}</select></div></div>
          <div id="ipv"></div><div id="ierr"></div></div>`,
      buttons: [{ label: t('dlg.cancel') }, { label: t('imp.go'), kind: 'pri', onClick: () => go() }],
    });
    m.el.querySelectorAll('.btn')[1].disabled = true;
    let st = null;
    const dz = $('#idz', m.el);
    const parse = () => {
      if (!st) return null;
      return io.parseAny(st.buf, st.ext, { enc: $('#ienc', m.el).value, delim: $('#idel', m.el).value });
    };
    const refresh = () => {
      try {
        const r = parse(); st.parsed = r;
        $('#ierr', m.el).innerHTML = '';
        if (r.project) $('#ipv', m.el).innerHTML = `<div class="result ok">${u.esc(t('imp.project', { n: r.project.sheets.length }))}</div>`;
        else if (!r.sheets.length || !r.sheets[0].rows.length) throw new Error(t('imp.empty'));
        else $('#ipv', m.el).innerHTML = preview(r.sheets);
        m.el.querySelectorAll('.btn')[1].disabled = false;
      } catch (e) { $('#ipv', m.el).innerHTML = ''; $('#ierr', m.el).innerHTML = `<div class="result err">${u.esc(e.message)}</div>`; m.el.querySelectorAll('.btn')[1].disabled = true; }
    };
    const load = (f) => {
      const ext = f.name.toLowerCase().endsWith('.gridforge.json') ? 'gridforge' : f.name.split('.').pop().toLowerCase();
      const rd = new FileReader();
      rd.onload = () => {
        st = { name: f.name.replace(/\.[^.]+$/, '').replace(/\.gridforge$/, ''), ext, buf: rd.result, size: f.size };
        dz.innerHTML = `<div class="e">📄</div><b>${u.esc(f.name)}</b><div class="muted" style="font-size:11.5px">${u.fmtBytes(f.size)}</div>`;
        $('#iopts', m.el).classList.remove('hide');
        $('#iencrow', m.el).classList.toggle('hide', ['xlsx', 'xls', 'xlsm', 'xlsb', 'ods'].includes(ext));
        refresh();
      };
      rd.onerror = () => ui.toast(t('imp.readerr'), 'err');
      rd.readAsArrayBuffer(f);
    };
    ['ienc', 'idel'].forEach((id) => $('#' + id, m.el).addEventListener('change', refresh));
    dz.onclick = () => { const fi = $('#fileInput'); fi.value = ''; fi.onchange = () => fi.files[0] && load(fi.files[0]); fi.click(); };
    ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.add('ov'); }));
    dz.addEventListener('dragleave', () => dz.classList.remove('ov'));
    dz.addEventListener('drop', (e) => { e.preventDefault(); e.stopPropagation(); dz.classList.remove('ov'); if (e.dataTransfer.files[0]) load(e.dataTransfer.files[0]); });
    async function go() {
      if (!st || !st.parsed) return false;
      const r = st.parsed, header = $('#ihead', m.el).checked, mode = $('#imode', m.el).value;
      await ui.busy(() => {
        if (r.project) { S.loadProjectData(r.project); return; }
        const sheets = r.sheets.map((s) => io.toSheet(r.sheets.length === 1 && /^Sheet\d*$/.test(s.name) ? st.name : s.name, s.rows.map((x) => x.slice()), { header }));
        if (mode === 'replace' || S.isBlank()) { S.newWorkbook(sheets, st.name); }
        else sheets.forEach((s) => S.addSheet(s, true));
      });
      GF.emit('named');
      const sh = S.sheet();
      ui.toast(t('imp.done', { r: sh.rows.length.toLocaleString(), c: sh.cols.length }), 'ok');
    }
    if (file) load(file);
    return m;
  };

  D.paste = () => {
    const m = ui.modal({
      title: t('paste.title'), sub: t('paste.sub'), wide: true,
      body: `<textarea class="in" id="ptxt" style="min-height:200px" dir="auto" placeholder="${u.esc(t('paste.ph'))}"></textarea><label class="chk"><input type="checkbox" id="phead" checked/>${u.esc(t('imp.header'))}</label>`,
      buttons: [{ label: t('dlg.cancel') }, { label: t('imp.go'), kind: 'pri', onClick: () => {
        const txt = $('#ptxt', m.el).value;
        if (!txt.trim()) return false;
        const d = io.detectDelimiter(txt);
        const sheet = io.toSheet('Pasted', io.parseDelimited(txt.replace(/\r\n?/g, '\n'), d), { header: $('#phead', m.el).checked });
        if (S.isBlank()) S.newWorkbook([sheet], S.wb.name); else S.addSheet(sheet);
        ui.toast(t('imp.done', { r: sheet.rows.length.toLocaleString(), c: sheet.cols.length }), 'ok');
      } }],
    });
    setTimeout(() => $('#ptxt', m.el).focus(), 40);
  };

  /* ═════════ EXPORT ═════════ */
  const FM = [['csv', '📄', 'CSV', 'fmt.csv'], ['xlsx', '📊', 'Excel', '.xlsx'], ['json', '📦', 'JSON', 'fmt.json'], ['jsonl', '🧾', 'JSON Lines', 'fmt.jsonl'], ['tsv', '📋', 'TSV', 'fmt.tsv'], ['md', '📝', 'Markdown', 'fmt.md'], ['sql', '🗄', 'SQL', 'INSERT'], ['html', '🌐', 'HTML', 'fmt.html'], ['xml', '🧬', 'XML', 'XML'], ['gridforge', '💾', t('exp.project'), '.gridforge.json']];
  D.export = () => {
    const sh = S.sheet();
    const hasF = sh.view.filters.length || sh.view.q;
    const m = ui.modal({
      title: t('exp.title'), sub: t('exp.sub'), wide: true,
      body: `<div class="fmt-grid">${FM.map(([k, e, n, d]) => `<div class="fmt" data-k="${k}"><div class="e">${e}</div><b>${u.esc(n)}</b><small>${u.esc(d.startsWith('fmt.') ? t(d) : d)}</small></div>`).join('')}</div>
        <div class="row2"><div class="fld"><label>${u.esc(t('exp.scope'))}</label><select class="in" id="xsc">${ui.opts([['view', t('exp.view') + (hasF ? ' ✓' : '')], ['all', t('exp.all')]], 'view')}</select></div>
          <div class="fld"><label>${u.esc(t('exp.delim'))}</label><select class="in" id="xdl">${ui.opts([[',', ', (comma)'], [';', '; (Excel EU/FA)']], ',')}</select></div></div>
        <div class="row2"><label class="chk"><input type="checkbox" id="xh"/>${u.esc(t('exp.hidden'))}</label><label class="chk"><input type="checkbox" id="xbom" checked/>${u.esc(t('exp.bom'))}</label></div>
        <div class="row2"><label class="chk"><input type="checkbox" id="xhd" checked/>${u.esc(t('exp.header'))}</label><label class="chk"><input type="checkbox" id="xall"/>${u.esc(t('exp.allsheets'))}</label></div>
        <div class="btn-row"><button class="btn" id="xcopy">${ui.icon('copy')}${u.esc(t('exp.copy'))}</button></div>`,
    });
    const opts = () => ({ scope: $('#xsc', m.el).value, idx: S.viewIndex(), hidden: $('#xh', m.el).checked, delim: $('#xdl', m.el).value, bom: $('#xbom', m.el).checked, header: $('#xhd', m.el).checked, rtl: rtl() });
    const save = async (k) => {
      await ui.busy(() => {
        const f = io.FORMATS[k], o = opts(), name = base() + '.' + f.ext;
        if (k === 'gridforge') return u.download(JSON.stringify(S.projectData()), name, f.mime);
        if (k === 'xlsx') {
          const all = $('#xall', m.el).checked;
          const sheets = all ? S.wb.sheets : [sh];
          return u.download(new Blob([io.buildXlsx(sheets, { ...o, sheetOpts: (x) => (x === sh ? o : { scope: 'all', hidden: o.hidden }) })], { type: f.mime }), name);
        }
        u.download(io.build(k, sh, { ...o, title: S.wb.name || sh.name }), name, f.mime);
      });
      m.close();
      ui.toast(t('exp.done', { n: (opts().scope === 'all' ? sh.rows.length : S.viewIndex().length).toLocaleString() }), 'ok');
    };
    m.el.querySelectorAll('.fmt').forEach((f) => f.addEventListener('click', () => save(f.dataset.k).catch((e) => ui.toast(e.message, 'err'))));
    $('#xcopy', m.el).onclick = () => navigator.clipboard.writeText(io.build('tsv', sh, { ...opts(), bom: false })).then(() => { ui.toast(t('toast.copied'), 'ok'); m.close(); }).catch(() => ui.toast(t('toast.copyfail'), 'err'));
  };

  /* ═════════ SETTINGS ═════════ */
  const THEMES = [['dark', '🌙'], ['light', '☀️'], ['midnight', '🌌'], ['forest', '🌿'], ['sunset', '🌅'], ['ivory', '🏛️'], ['ocean', '🌊']];
  const SW = { dark: '#171f38', light: '#f3f6ff', midnight: '#0e1330', forest: '#0f1f17', sunset: '#fdf6f0', ivory: '#fafaf7', ocean: '#0e2438' };
  D.settings = () => {
    const s = S.settings;
    const seg = (k, list) => `<div class="seg" data-k="${k}">${list.map(([v, l]) => `<button data-v="${v}" class="${s[k] === v ? 'on' : ''}">${u.esc(l)}</button>`).join('')}</div>`;
    const tog = (k, l, h) => `<div class="srow"><div>${u.esc(t(l))}${h ? `<small>${u.esc(t(h))}</small>` : ''}</div><label class="tog"><input type="checkbox" data-t="${k}"${s[k] ? ' checked' : ''}/><i></i></label></div>`;
    const m = ui.modal({
      title: t('set.title'), sub: 'GridForge v1.0', cls: 'set',
      body: `<div><div class="lbl" style="margin-bottom:6px">${u.esc(t('set.theme'))}</div><div class="swatches" id="sw">${THEMES.map(([k, e]) => `<div class="sw${s.theme === k ? ' on' : ''}" data-k="${k}" style="background:${SW[k]}" title="${k}">${e}</div>`).join('')}</div></div>
        <div class="row2"><div><div class="lbl" style="margin-bottom:6px">${u.esc(t('set.lang'))}</div>${seg('lang', [['en', 'English'], ['fa', 'فارسی']])}</div>
        <div><div class="lbl" style="margin-bottom:6px">${u.esc(t('set.density'))}</div>${seg('density', [['compact', t('set.d.compact')], ['normal', t('set.d.normal')], ['comfort', t('set.d.comfort')]])}</div></div>
        <div><div class="lbl" style="margin-bottom:6px">${u.esc(t('set.font'))}</div>${seg('font', [['sm', 'S'], ['md', 'M'], ['lg', 'L'], ['xl', 'XL']])}</div>
        <div>${tog('zebra', 'set.zebra')}${tog('borders', 'set.borders')}${tog('freeze', 'set.freeze', 'set.freeze.h')}${tog('rownums', 'set.rownums')}${tog('hl', 'set.hl')}${tog('bggrid', 'set.bggrid')}${tog('autosave', 'set.autosave', 'set.autosave.h')}</div>
        <div class="btn-row"><button class="btn" id="sreset">${u.esc(t('set.reset'))}</button><button class="btn danger" id="swipe">${u.esc(t('set.wipe'))}</button></div>
        <div class="hint muted" style="font-size:11.5px;line-height:1.7">🔒 ${u.esc(t('set.privacy'))}</div>`,
    });
    m.el.querySelectorAll('#sw .sw').forEach((x) => x.onclick = () => { S.setSetting('theme', x.dataset.k); m.el.querySelectorAll('#sw .sw').forEach((y) => y.classList.toggle('on', y === x)); });
    m.el.querySelectorAll('.seg').forEach((g) => g.querySelectorAll('button').forEach((bt) => bt.onclick = () => { S.setSetting(g.dataset.k, bt.dataset.v); g.querySelectorAll('button').forEach((y) => y.classList.toggle('on', y === bt)); if (g.dataset.k === 'lang') { m.close(); setTimeout(D.settings, 30); } }));
    m.el.querySelectorAll('[data-t]').forEach((c) => c.onchange = () => S.setSetting(c.dataset.t, c.checked));
    $('#sreset', m.el).onclick = () => { S.resetSettings(); m.close(); ui.toast(t('set.reset.done'), 'ok'); };
    $('#swipe', m.el).onclick = async () => { if (await ui.confirm(t('set.wipe.q'), { danger: true })) { await S.wipeSaved(); ui.toast(t('set.wipe.done'), 'ok'); } };
  };

  /* ═════════ HELP ═════════ */
  D.help = () => {
    const rows = [['Ctrl K', 'act.palette'], ['/', 'help.search'], ['Ctrl Z / Y', 'help.undo'], ['Enter · F2', 'help.edit'], ['Esc', 'help.esc'], ['Tab · Shift Tab', 'help.tab'], ['Arrows · Shift+Arrows', 'help.arrows'], ['Ctrl A', 'help.all'], ['Ctrl C / X / V', 'help.clip'], ['Delete', 'help.del'], ['Ctrl D / R', 'help.fill'], ['Ctrl Enter', 'help.newrow'], ['Shift+click header', 'help.multisort'], ['Alt+click header', 'help.selcol'], ['Ctrl O', 'act.import'], ['Ctrl S', 'help.save'], ['Ctrl E', 'act.export'], ['?', 'help.title']];
    ui.modal({ title: t('help.title'), body: `<div>${rows.map(([k, d]) => `<div class="srow"><span>${u.esc(t(d))}</span><span>${k.split(' ').map((x) => (/^[·/+]$|^(Shift|Alt|click|header)$/.test(x) ? ' ' + x + ' ' : `<kbd>${u.esc(x)}</kbd>`)).join('')}</span></div>`).join('')}</div>
      <div class="hint muted" style="font-size:12px;line-height:1.7">${u.esc(t('help.about'))} · <a href="https://github.com/" target="_blank" rel="noopener">GitHub</a> · MIT</div>` });
  };

  /* ═════════ COMMAND PALETTE ═════════ */
  D.palette = () => {
    const cmds = GF.commands.map((c) => ({ ...c, text: t(c.label) }));
    const m = ui.modal({ cls: 'pal', body: `<input id="pq" placeholder="${u.esc(t('pal.ph'))}" autocomplete="off"/><div class="pal-list" id="pl"></div>`, closable: true });
    m.body.style.padding = '0'; m.body.style.gap = '0';
    let hl = 0, list = cmds;
    const draw = () => { $('#pl', m.el).innerHTML = list.map((c, i) => `<div class="pal-it${i === hl ? ' hl' : ''}" data-i="${i}"><span>${u.esc(c.text)}</span>${c.kbd ? `<small>${u.esc(c.kbd)}</small>` : ''}</div>`).join('') || `<div class="pal-it muted">${u.esc(t('pal.none'))}</div>`; const h = $('.hl', m.el); if (h) h.scrollIntoView({ block: 'nearest' }); };
    const run = (c) => { m.close(); setTimeout(() => c.run(), 30); };
    const inp = $('#pq', m.el);
    inp.addEventListener('input', () => { const q = inp.value.toLowerCase().trim(); list = cmds.filter((c) => !q || (c.text + ' ' + (c.kw || '')).toLowerCase().includes(q)); hl = 0; draw(); });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); hl = Math.min(list.length - 1, hl + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); hl = Math.max(0, hl - 1); draw(); }
      else if (e.key === 'Enter' && list[hl]) run(list[hl]);
    });
    $('#pl', m.el).addEventListener('click', (e) => { const it = e.target.closest('.pal-it[data-i]'); if (it) run(list[+it.dataset.i]); });
    draw(); inp.focus();
  };
})(typeof window !== 'undefined' ? window : globalThis);
