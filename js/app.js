/* GridForge — app.js : boot sequence, command registry and global keyboard shortcuts */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u, S = GF.store, ui = GF.ui, D = GF.dialogs, C = GF.chrome;
  const t = (k, v) => GF.i18n.t(k, v);
  GF.version = '1.0.0';

  const panel = (n) => () => { S.settings.panel = n; S.setSetting('panelOpen', true); C.renderPanel(); };
  GF.commands = [
    { label: 'act.import', kbd: 'Ctrl O', run: () => D.import(), kw: 'open file csv excel' },
    { label: 'act.export', kbd: 'Ctrl E', run: () => (S.isBlank() ? ui.toast(t('need.data'), 'info') : D.export()), kw: 'save download csv xlsx json sql' },
    { label: 'cmd.saveproj', kbd: 'Ctrl S', run: () => u.download(JSON.stringify(S.projectData()), u.slug(S.wb.name || S.sheet().name) + '.gridforge.json', 'application/json'), kw: 'project backup' },
    { label: 'cmd.paste', run: () => D.paste(), kw: 'clipboard' },
    { label: 'cmd.new', run: async () => { if (S.isBlank() || await ui.confirm(t('cmd.new.q'), { danger: true })) { S.newWorkbook(); GF.emit('named'); } } },
    { label: 'cmd.demo', run: () => C.applyToActive(GF.templates.demo()), kw: 'sample example' },
    { label: 'act.undo', kbd: 'Ctrl Z', run: () => S.undo() },
    { label: 'act.redo', kbd: 'Ctrl Y', run: () => S.redo() },
    { label: 'p.columns', run: panel('columns'), kw: 'schema formula template' },
    { label: 'cmd.dedupe', run: panel('clean'), kw: 'dedupe dedup duplicate unique remove' },
    { label: 'p.clean', run: panel('clean'), kw: 'trim case digits persian replace split merge' },
    { label: 'p.fill', run: panel('fill'), kw: 'generate sample random sequence' },
    { label: 'p.validate', run: panel('validate'), kw: 'check errors email' },
    { label: 'p.analyze', run: panel('analyze'), kw: 'stats group pivot chart' },
    { label: 'p.combine', run: panel('combine'), kw: 'join merge append vlookup compare' },
    { label: 'cmd.addrow', kbd: 'Ctrl Enter', run: () => GF.grid.addRows(1) },
    { label: 'cmd.addcol', run: () => S.commit((x) => GF.ops.insertCol(x, x.cols.length, { name: t('col.new') })) },
    { label: 'cmd.selectall', kbd: 'Ctrl A', run: () => GF.grid.selectAll() },
    { label: 'cmd.clearfilters', run: () => S.setView({ filters: [], q: '', dups: null, invalid: false, sort: [] }) },
    { label: 'cmd.togglepanel', run: () => { S.setSetting('panelOpen', !S.settings.panelOpen); C.renderPanel(); } },
    ...['dark', 'light', 'midnight', 'forest', 'sunset', 'ivory', 'ocean'].map((th) => ({ label: 'theme.' + th, run: () => S.setSetting('theme', th), kw: 'theme color' })),
    { label: 'cmd.lang', run: () => S.setSetting('lang', S.settings.lang === 'fa' ? 'en' : 'fa'), kw: 'language persian farsi english' },
    { label: 'act.settings', run: () => D.settings() },
    { label: 'act.help', kbd: '?', run: () => D.help() },
  ];

  const typing = () => /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
  document.addEventListener('keydown', (e) => {
    const ctrl = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
    if (e.key === 'Escape') { if (ui.closeMenu()) return; if (ui.closeTop()) return; }
    if (ctrl && k === 'k') { e.preventDefault(); return ui.hasModal() ? ui.closeTop() : D.palette(); }
    if (ui.hasModal()) return;
    if (ctrl && k === 'o') { e.preventDefault(); return D.import(); }
    if (ctrl && k === 'e') { e.preventDefault(); return GF.commands[1].run(); }
    if (ctrl && k === 's') { e.preventDefault(); return GF.commands[2].run(); }
    if (typing()) return;
    if (ctrl && k === 'z' && !e.shiftKey) { e.preventDefault(); S.undo(); }
    else if (ctrl && (k === 'y' || (k === 'z' && e.shiftKey))) { e.preventDefault(); S.redo(); }
    else if (e.key === '/' && !ctrl) { e.preventDefault(); u.$('#q').focus(); u.$('#q').select(); }
    else if (e.key === '?' && !ctrl) { e.preventDefault(); D.help(); }
  });

  document.addEventListener('DOMContentLoaded', async () => {
    S.loadSettings();
    GF.i18n.setLang(S.settings.lang);
    GF.i18n.apply();
    GF.grid.init();
    C.init();
    const at = await S.restore();
    if (at && !S.isBlank()) {
      GF.emit('named');
      ui.toast(t('toast.restored', { d: new Date(at).toLocaleString(GF.i18n.lang === 'fa' ? 'fa-IR' : undefined) }), 'info', { ms: 4500 });
    }
    S.dirty = false;
    GF.emit('saving', 'saved');
  });
})(typeof window !== 'undefined' ? window : globalThis);
