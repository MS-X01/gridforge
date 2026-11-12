/* GridForge — panels.js : the six tool panels (Columns, Clean, Fill, Validate, Analyze, Combine) */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u, S = GF.store, ops = GF.ops, ui = GF.ui;
  const t = (k, v) => GF.i18n.t(k, v);
  const P = (GF.panels = {});
  const sh = () => S.sheet();
  const $ = (s, e) => u.$(s, e);
  const num = (id, b, d) => { const v = parseFloat($(id, b).value); return isNaN(v) ? d : v; };
  const sec = (icon, title, inner, hint) => `<section class="sec"><h3>${ui.icon(icon)}${u.esc(title)}</h3>${hint ? `<div class="hint">${u.esc(hint)}</div>` : ''}${inner}</section>`;
  const fld = (label, inner) => `<div class="fld"><label>${u.esc(label)}</label>${inner}</div>`;
  const delegate = (body, handlers) => body.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (a && handlers[a.dataset.act]) handlers[a.dataset.act](a, e);
  });
  const cnt = (n) => n.toLocaleString(GF.i18n.lang === 'fa' ? 'fa-IR' : 'en-US');

  /* shared per-sheet UI state */
  const st = { sid: null, cols: new Set(), dup: new Set(), scope: 'all', gb: { by: 0, val: -1, agg: 'count', top: 12 } };
  const sync = () => { if (st.sid !== sh().id) { st.sid = sh().id; st.cols = new Set(); st.dup = new Set(); st.scope = 'all'; st.gb = { by: 0, val: -1, agg: 'count', top: 12 }; } };

  const chipsFor = (set, cols) => `<div class="chips">${cols.map((c, i) => `<span class="chip${set.has(i) ? ' on' : ''}" data-i="${i}" title="${u.esc(c.name)}"><span>${u.esc(c.name)}</span></span>`).join('')}</div>`;
  const bindChips = (body, sel, set, after) => body.querySelectorAll(sel + ' .chip').forEach((c) => c.addEventListener('click', () => { const i = +c.dataset.i; set.has(i) ? set.delete(i) : set.add(i); c.classList.toggle('on'); after && after(); }));
  const colsOrAll = (set) => (set.size ? [...set].sort((a, b) => a - b) : sh().cols.map((_, i) => i));
  const rowScope = () => {
    if (st.scope === 'view') return new Set(S.viewIndex());
    if (st.scope === 'sel') return new Set(GF.grid.selectedDataRows());
    return null;
  };
  const scopeSel = () => fld(t('c.scope'), `<select class="in" id="scope">${ui.opts([['all', t('c.sc.all')], ['view', t('c.sc.view')], ['sel', t('c.sc.sel')]], st.scope)}</select>`);
  const done = (msg, kind) => ui.toast(msg, kind || 'ok', { action: { label: t('act.undo'), run: S.undo } });

  /* ═════════ COLUMNS ═════════ */
  P.columns = {
    sig: () => sh().cols.map((c) => c.name + c.type + c.hidden + c.required + c.unique + c.options + c.def).join('|'),
    render(b) {
      sync();
      const s = sh();
      b.innerHTML =
        sec('cols', t('col.schema'), `<div id="colList" style="display:flex;flex-direction:column;gap:6px">${s.cols.map((c, i) => `
          <details class="acc" draggable="true" data-i="${i}"><summary><span style="cursor:grab;color:var(--text4)">⠿</span>
            <input class="in" style="padding:3px 8px;flex:1;min-width:0" data-f="name" value="${u.esc(c.name)}" onclick="event.stopPropagation()" onkeydown="event.stopPropagation()"/>
            <button class="btn sm ico ghost" data-act="vis" title="${u.esc(t('m.hide'))}" style="${c.hidden ? 'opacity:.35' : ''}">${ui.icon('eye')}</button>
            <button class="btn sm ico ghost danger" data-act="del">${ui.icon('trash')}</button></summary>
            <div class="acc-b">
              <div class="row2">${fld(t('col.type'), `<select class="in" data-f="type">${ui.opts(['text', 'number', 'date', 'boolean', 'email', 'url', 'select'].map((x) => [x, x]), c.type)}</select>`)}${fld(t('col.default'), `<input class="in" data-f="def" value="${u.esc(c.def)}"/>`)}</div>
              ${c.type === 'select' ? fld(t('col.options'), `<input class="in" data-f="options" placeholder="A, B, C" value="${u.esc(c.options)}"/>`) : ''}
              <label class="chk"><input type="checkbox" data-f="required"${c.required ? ' checked' : ''}/>${u.esc(t('col.required'))}</label>
              <label class="chk"><input type="checkbox" data-f="unique"${c.unique ? ' checked' : ''}/>${u.esc(t('col.unique'))}</label>
              <div class="btn-row"><button class="btn sm" data-act="fit">${u.esc(t('m.fit'))}</button><button class="btn sm" data-act="conv" title="${u.esc(t('col.conv.tip'))}">${u.esc(t('col.conv'))}</button></div>
            </div></details>`).join('') || `<div class="hint">${u.esc(t('col.none'))}</div>`}</div>
          <div class="btn-row"><button class="btn pri" data-act="add">${ui.icon('plus')}${u.esc(t('col.add'))}</button><button class="btn" data-act="showall">${u.esc(t('col.showall'))}</button></div>`) +
        sec('fill', t('fx.title'), `${fld(t('fx.expr'), `<input class="in mono" id="fxe" placeholder='=IF([Price]*[Qty] > 100, "big", "small")' dir="ltr"/>`)}
          <div class="row2">${fld(t('fx.name'), `<input class="in" id="fxn" value="Formula"/>`)}${fld(t('fx.target'), `<select class="in" id="fxt">${ui.colOpts(s, { all: t('fx.newcol') })}</select>`)}</div>
          <button class="btn pri block" data-act="fx">${u.esc(t('fx.apply'))}</button><div id="fxr"></div>
          <div class="hint mono" dir="ltr" style="font-size:10.5px">${GF.formula.functions.join(' · ')}</div>`, t('fx.hint')) +
        sec('table', t('tpl.title'), `<div class="tpl-row">${Object.keys(GF.templates).filter((k) => GF.templates[k].cols).map((k) => `<div class="tile" data-act="tpl" data-k="${k}"><span class="e">${GF.templates[k].e}</span>${u.esc(t('tpl.' + k))}</div>`).join('')}</div>`);

      const list = $('#colList', b);
      list.addEventListener('change', (e) => {
        const f = e.target.dataset.f, i = +e.target.closest('details').dataset.i;
        if (!f) return;
        const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        S.commit((x) => {
          if (f === 'name') x.cols[i].name = u.uniqueName(String(v).trim() || t('col.new'), x.cols.filter((_, j) => j !== i).map((c) => c.name));
          else x.cols[i][f] = v;
        });
      });
      let dragI = null;
      list.querySelectorAll('details').forEach((d) => {
        d.addEventListener('dragstart', (e) => { dragI = +d.dataset.i; e.dataTransfer.effectAllowed = 'move'; });
        d.addEventListener('dragover', (e) => e.preventDefault());
        d.addEventListener('drop', (e) => { e.preventDefault(); const to = +d.dataset.i; if (dragI != null && dragI !== to) S.commit((x) => ops.moveCol(x, dragI, to)); dragI = null; });
      });
      delegate(b, {
        add: () => S.commit((x) => ops.insertCol(x, x.cols.length, { name: t('col.new') + ' ' + (x.cols.length + 1) })),
        showall: () => S.commit((x) => x.cols.forEach((c) => { c.hidden = false; })),
        vis: (a, e) => { e.preventDefault(); const i = +a.closest('details').dataset.i; S.commit((x) => { x.cols[i].hidden = !x.cols[i].hidden; }); },
        del: (a, e) => { e.preventDefault(); const i = +a.closest('details').dataset.i; S.commit((x) => ops.deleteCols(x, [i])); },
        fit: (a) => GF.grid.fitCol(+a.closest('details').dataset.i),
        conv: (a) => { const i = +a.closest('details').dataset.i; let n = 0; S.commit((x) => { n = ops.convertColumn(x, i, x.cols[i].type); }); done(t('col.conv.done', { n })); },
        tpl: async (a) => {
          if (!S.isBlank() && !(await ui.confirm(t('tpl.new.q')))) return;
          S.addSheet(GF.templates.make(a.dataset.k)); if (S.wb.sheets.length > 1 && S.wb.sheets[0].cols.length === 0) S.deleteSheet(0);
        },
        fx: () => {
          const r = $('#fxr', b), ex = $('#fxe', b).value.trim();
          if (!ex) return;
          const target = +$('#fxt', b).value;
          try {
            GF.formula.compile(ex, sh().cols.map((c) => c.name));
            S.commit((x) => ops.applyFormula(x, ex, { name: $('#fxn', b).value || 'Formula', target: target >= 0 ? target : null }));
            r.innerHTML = ''; done(t('fx.done'));
          } catch (err) { r.innerHTML = `<div class="result err">${u.esc(err.message)}</div>`; }
        },
      });
    },
  };

  /* ═════════ CLEAN ═════════ */
  P.clean = {
    sig: () => sh().id + sh().cols.map((c) => c.name).join('|'),
    render(b) {
      sync();
      const s = sh();
      if (!s.cols.length) { b.innerHTML = `<div class="hint">${u.esc(t('need.data'))}</div>`; return; }
      const T = ops.TRANSFORMS;
      const tiles = [['collapse', '␣', 'cl.collapse'], ['trim', '✂', 'cl.trim'], ['upper', 'AA', 'cl.upper'], ['lower', 'aa', 'cl.lower'], ['title', 'Aa', 'cl.titlecase'], ['enDigits', '123', 'cl.endigits'], ['faDigits', '۱۲۳', 'cl.fadigits'], ['faChars', 'ی ک', 'cl.fachars'], ['diacritics', 'ً', 'cl.diacritics'], ['nonPrint', '⌀', 'cl.nonprint'], ['stripHtml', '</>', 'cl.html'], ['stripPunct', '!?', 'cl.punct'], ['digitsOnly', '#', 'cl.digitsonly'], ['stripSpaces', '␣␣', 'cl.nospaces']];
      b.innerHTML =
        sec('cols', t('c.target'), `${scopeSel()}<div class="lbl">${u.esc(t('c.cols'))} <span class="muted" style="text-transform:none;letter-spacing:0">(${u.esc(t('c.cols.hint'))})</span></div>${chipsFor(st.cols, s.cols)}`) +
        sec('copy', t('dup.title'), `<div class="lbl">${u.esc(t('dup.keys'))}</div><div id="dupchips">${chipsFor(st.dup, s.cols)}</div>
          <div class="row2"><label class="chk"><input type="checkbox" id="dIc" checked/>${u.esc(t('dup.ic'))}</label><label class="chk"><input type="checkbox" id="dTrim" checked/>${u.esc(t('dup.trim'))}</label></div>
          ${fld(t('dup.keep'), `<select class="in" id="dKeep">${ui.opts([['first', t('dup.first')], ['last', t('dup.last')], ['none', t('dup.none')]], 'first')}</select>`)}
          <div id="dupres" class="result" style="display:none"></div>
          <div class="btn-row"><button class="btn" data-act="dfind">${u.esc(t('dup.find'))}</button><button class="btn" data-act="dhl">${u.esc(t('dup.hl'))}</button></div>
          <div class="btn-row"><button class="btn danger" data-act="drem">${ui.icon('trash')}${u.esc(t('dup.remove'))}</button><button class="btn" data-act="dmove">${u.esc(t('dup.tosheet'))}</button></div>`, t('dup.hint')) +
        sec('clean', t('cl.title'), `<div class="grid3">${tiles.map(([k, e, l]) => `<div class="tile" data-act="tf" data-k="${k}"><span class="e mono" style="font-size:15px">${e}</span>${u.esc(t(l))}</div>`).join('')}</div>`) +
        sec('cols', t('st.title'), `<div class="btn-row"><button class="btn" data-act="erows">${u.esc(t('st.erows'))}</button><button class="btn" data-act="ecols">${u.esc(t('st.ecols'))}</button></div>
          <div class="sdiv">${u.esc(t('st.fill'))}</div>
          <div class="row2"><select class="in" id="fmode">${ui.opts([['down', t('st.f.down')], ['up', t('st.f.up')], ['value', t('st.f.value')], ['mean', t('st.f.mean')], ['median', t('st.f.median')], ['mode', t('st.f.mode')]], 'down')}</select><input class="in" id="fval" placeholder="${u.esc(t('st.f.valph'))}"/></div>
          <button class="btn block" data-act="fillempty">${u.esc(t('st.fillbtn'))}</button>
          <div class="sdiv">${u.esc(t('st.split'))}</div>
          <div class="row2">${fld(t('st.splitcol'), `<select class="in" id="spc">${ui.colOpts(s)}</select>`)}${fld(t('st.delim'), `<input class="in" id="spd" value=" " dir="ltr"/>`)}</div>
          <label class="chk"><input type="checkbox" id="spk"/>${u.esc(t('st.removeorig'))}</label><button class="btn block" data-act="split">${u.esc(t('st.splitbtn'))}</button>
          <div class="sdiv">${u.esc(t('st.merge'))}</div><div id="mgchips">${chipsFor(st.cols, s.cols)}</div>
          <div class="row2">${fld(t('st.sep'), `<input class="in" id="mgs" value=" "/>`)}${fld(t('fx.name'), `<input class="in" id="mgn"/>`)}</div>
          <button class="btn block" data-act="merge">${u.esc(t('st.mergebtn'))}</button>`) +
        sec('search', t('fr.title'), `<div class="row2">${fld(t('fr.find'), `<input class="in" id="frf"/>`)}${fld(t('fr.rep'), `<input class="in" id="frr"/>`)}</div>
          <div class="row2"><label class="chk"><input type="checkbox" id="frx"/>${u.esc(t('fr.regex'))}</label><label class="chk"><input type="checkbox" id="frc"/>${u.esc(t('fr.case'))}</label></div>
          <label class="chk"><input type="checkbox" id="frw"/>${u.esc(t('fr.whole'))}</label><div id="frres"></div>
          <div class="btn-row"><button class="btn" data-act="frcount">${u.esc(t('fr.count'))}</button><button class="btn pri" data-act="frdo">${u.esc(t('fr.do'))}</button></div>`) +
        sec('filter', t('ro.title'), `<div class="btn-row"><button class="btn" data-act="keepf">${u.esc(t('ro.keep'))}</button><button class="btn danger" data-act="delf">${u.esc(t('ro.del'))}</button></div>
          <div class="btn-row"><button class="btn" data-act="sortperm">${u.esc(t('ro.sortperm'))}</button><button class="btn" data-act="shuffle">${u.esc(t('ro.shuffle'))}</button></div>`);

      $('#scope', b).onchange = (e) => { st.scope = e.target.value; };
      const refresh = () => ['.sec:nth-of-type(1)', '#mgchips'].forEach((sel) => b.querySelectorAll(sel + ' .chip').forEach((c) => c.classList.toggle('on', st.cols.has(+c.dataset.i))));
      bindChips(b, '.sec:nth-of-type(1)', st.cols, refresh);
      bindChips(b, '#dupchips', st.dup);
      bindChips(b, '#mgchips', st.cols, refresh);
      const dupOpts = () => ({ cols: colsOrAll(st.dup), ic: $('#dIc', b).checked, trim: $('#dTrim', b).checked, skipEmpty: true, keep: $('#dKeep', b).value });
      const showDup = (msg, cls) => { const r = $('#dupres', b); r.style.display = ''; r.className = 'result ' + (cls || ''); r.textContent = msg; };
      const tf = (k) => { let n = 0; S.commit((x) => { n = ops.mapCells(x, colsOrAll(st.cols), T[k], rowScope()); }); done(t('cl.done', { n: cnt(n) }), n ? 'ok' : 'info'); };
      delegate(b, {
        dfind: () => { const i = ops.dupInfo(sh(), dupOpts()); showDup(t('dup.found', { g: cnt(i.groupCount), n: cnt(i.extra) }), i.extra ? '' : 'ok'); },
        dhl: () => { const o = dupOpts(); S.setView({ dups: sh().view.dups ? null : { cols: o.cols, ic: o.ic, trim: o.trim } }); ui.toast(sh().view.dups ? t('dup.hl.on') : t('dup.hl.off'), 'info', { ms: 1500 }); },
        drem: async () => {
          const o = dupOpts(), i = ops.dupInfo(sh(), o);
          if (!i.extra) return showDup(t('dup.none.found'), 'ok');
          if (!(await ui.confirm(t('dup.q', { n: cnt(i.extra) }), { danger: true, ok: t('dup.remove') }))) return;
          let removed = [];
          S.commit((x) => { removed = ops.removeDuplicates(x, o); });
          showDup(t('dup.removed', { n: cnt(removed.length) }), 'ok'); done(t('dup.removed', { n: cnt(removed.length) }));
        },
        dmove: () => {
          const o = dupOpts(); let removed = [];
          const cols = sh().cols.map((c) => ({ ...c, id: u.uid() })), name = sh().name + ' · dups';
          S.commit((x) => { removed = ops.removeDuplicates(x, o); }, 'wb');
          if (removed.length) { const ns = S.mkSheet(name, cols, removed); S.addSheet(ns, false); }
          showDup(t('dup.moved', { n: cnt(removed.length) }), 'ok');
        },
        tf: (a) => tf(a.dataset.k),
        erows: () => { let n = 0; S.commit((x) => { n = ops.removeEmptyRows(x); }); done(t('st.erows.done', { n: cnt(n) }), n ? 'ok' : 'info'); },
        ecols: () => { let n = 0; S.commit((x) => { n = ops.removeEmptyCols(x); }); done(t('st.ecols.done', { n }), n ? 'ok' : 'info'); },
        fillempty: () => {
          const cols = colsOrAll(st.cols), mode = $('#fmode', b).value, v = $('#fval', b).value; let n = 0;
          S.commit((x) => { cols.forEach((c) => { n += ops.fillEmpty(x, c, mode, v, rowScope()); }); });
          done(t('st.filled', { n: cnt(n) }), n ? 'ok' : 'info');
        },
        split: () => {
          const c = +$('#spc', b).value, d = $('#spd', b).value; let n = 0;
          if (!d) return ui.toast(t('st.delim.need'), 'err');
          S.commit((x) => { n = ops.splitColumn(x, c, { delim: d, trim: true, keep: !$('#spk', b).checked }); });
          done(n ? t('st.split.done', { n }) : t('st.split.none'), n ? 'ok' : 'info');
        },
        merge: () => {
          const cols = [...st.cols].sort((a, c) => a - c);
          if (cols.length < 2) return ui.toast(t('st.merge.need'), 'err');
          S.commit((x) => ops.mergeColumns(x, cols, { sep: $('#mgs', b).value, name: $('#mgn', b).value, skipEmpty: true }));
          st.cols = new Set(); done(t('st.merge.done'));
        },
        frcount: () => { const o = frOpts(); if (!o) return; try { $('#frres', b).innerHTML = `<div class="result">${u.esc(t('fr.found', { n: cnt(ops.countMatches(sh(), o)) }))}</div>`; } catch (e) { $('#frres', b).innerHTML = `<div class="result err">${u.esc(e.message)}</div>`; } },
        frdo: () => { const o = frOpts(); if (!o) return; try { let n = 0; S.commit((x) => { n = ops.findReplace(x, o); }); $('#frres', b).innerHTML = ''; done(t('fr.done', { n: cnt(n) }), n ? 'ok' : 'info'); } catch (e) { $('#frres', b).innerHTML = `<div class="result err">${u.esc(e.message)}</div>`; } },
        keepf: () => { const set = new Set(S.viewIndex()); let n = 0; S.commit((x) => { n = ops.keepRows(x, set); }); S.setView({ filters: [], q: '' }); done(t('ro.removed', { n: cnt(n) })); },
        delf: async () => { const set = new Set(S.viewIndex()); if (!sh().view.filters.length && !sh().view.q) return ui.toast(t('ro.needfilter'), 'info'); if (!(await ui.confirm(t('ro.delq', { n: cnt(set.size) }), { danger: true }))) return; S.commit((x) => ops.deleteRows(x, set)); S.setView({ filters: [], q: '' }); done(t('ro.removed', { n: cnt(set.size) })); },
        sortperm: () => { if (!sh().view.sort.length) return ui.toast(t('ro.needsort'), 'info'); S.commit((x) => ops.sortAll(x)); S.setView({ sort: [] }); done(t('ro.sorted')); },
        shuffle: () => { S.commit((x) => ops.shuffleRows(x)); S.setView({ sort: [] }); done(t('ro.shuffled')); },
      });
      function frOpts() {
        const find = $('#frf', b).value;
        if (!find) { ui.toast(t('fr.need'), 'err'); return null; }
        return { find, rep: $('#frr', b).value, rx: $('#frx', b).checked, cs: $('#frc', b).checked, whole: $('#frw', b).checked, cols: st.cols.size ? [...st.cols] : null, rows: rowScope() };
      }
    },
  };

  /* ═════════ FILL ═════════ */
  P.fill = {
    sig: () => sh().id + sh().cols.map((c) => c.name).join('|'),
    render(b) {
      sync();
      const s = sh();
      if (!s.cols.length) { b.innerHTML = `<div class="hint">${u.esc(t('need.data'))}</div>`; return; }
      const gens = [['numbers', '1 2 3', 'g.numbers'], ['letters', 'A B C', 'g.letters'], ['dates', '📅', 'g.dates'], ['randdates', '🎲📅', 'g.randdates'], ['uuid', '🆔', 'g.uuid'], ['names', '👤', 'g.names'], ['namesFa', 'فا', 'g.namesfa'], ['emails', '✉', 'g.emails'], ['phones', '☎', 'g.phones'], ['phonesIR', '📱', 'g.phonesir'], ['prices', '$', 'g.prices'], ['ints', '#', 'g.ints'], ['bools', '☑', 'g.bools'], ['cities', '🏙', 'g.cities'], ['citiesFa', 'شهر', 'g.citiesfa'], ['companies', '🏢', 'g.companies']];
      const cur = GF.grid.curCell();
      b.innerHTML =
        sec('fill', t('g.title'), `${fld(t('g.col'), `<select class="in" id="gc">${ui.colOpts(s, { sel: cur ? cur.col : 0 })}</select>`)}${scopeSel()}
          <label class="chk"><input type="checkbox" id="gempty"/>${u.esc(t('g.onlyempty'))}</label>
          <div class="grid3">${gens.map(([k, e, l]) => `<div class="tile" data-act="gen" data-k="${k}"><span class="e" style="font-size:14px">${e}</span>${u.esc(t(l))}</div>`).join('')}</div>`) +
        sec('fill', t('g.params'), `<div class="row2">${fld(t('g.start'), `<input class="in" type="number" id="gs" value="1"/>`)}${fld(t('g.step'), `<input class="in" type="number" id="gst" value="1"/>`)}</div>
          <div class="row2">${fld('min', `<input class="in" type="number" id="gmin" value="0"/>`)}${fld('max', `<input class="in" type="number" id="gmax" value="100"/>`)}</div>
          <button class="btn block" data-act="gen" data-k="numbers">${u.esc(t('g.seq'))}</button><button class="btn block" data-act="gen" data-k="ints">${u.esc(t('g.rand'))}</button>
          ${fld(t('g.list'), `<input class="in" id="glist" placeholder="A, B, C"/>`)}<button class="btn block" data-act="gen" data-k="list">${u.esc(t('g.fromlist'))}</button>
          ${fld(t('g.pattern'), `<input class="in" id="gpat" value="ID-{nn}" dir="ltr"/>`)}<div class="hint mono" dir="ltr">{n} {n0} {nn} {rand}</div>
          <button class="btn block" data-act="gen" data-k="pattern">${u.esc(t('g.applypat'))}</button>`) +
        sec('table', t('g.smart'), `${fld(t('g.smart.n'), `<input class="in" type="number" id="sn" value="50" min="1" max="100000"/>`)}
          <label class="chk"><input type="checkbox" id="sfa"${GF.i18n.lang === 'fa' ? ' checked' : ''}/>${u.esc(t('g.smart.fa'))}</label>
          <button class="btn pri block" data-act="smart">${u.esc(t('g.smart.btn'))}</button>`, t('g.smart.hint'));
      $('#scope', b).onchange = (e) => { st.scope = e.target.value; };
      delegate(b, {
        gen: (a) => {
          const c = +$('#gc', b).value, k = a.dataset.k;
          const o = { start: num('#gs', b, 1), step: num('#gst', b, 1), min: num('#gmin', b, 0), max: num('#gmax', b, 100), pattern: $('#gpat', b).value, list: $('#glist', b).value.split(',').map((x) => x.trim()), onlyEmpty: $('#gempty', b).checked, rows: rowScope() };
          if (k === 'list' && !o.list.filter(Boolean).length) return ui.toast(t('g.list.need'), 'err');
          let n = 0; S.commit((x) => { n = ops.generate(x, c, k, o); });
          done(t('g.done', { n: cnt(n), c: sh().cols[c].name }));
        },
        smart: () => { const n = Math.max(1, Math.min(100000, num('#sn', b, 50))); S.commit((x) => ops.smartRows(x, n, $('#sfa', b).checked)); done(t('g.smart.done', { n: cnt(n) })); },
      });
    },
  };

  /* ═════════ VALIDATE ═════════ */
  P.validate = {
    sig: () => sh().id + sh().cols.map((c) => c.name + c.type + c.required + c.unique).join('|'),
    render(b) {
      sync();
      const s = sh();
      if (!s.cols.length) { b.innerHTML = `<div class="hint">${u.esc(t('need.data'))}</div>`; return; }
      b.innerHTML = sec('check', t('v.title'), `<div class="hint">${u.esc(t('v.hint'))}</div>
        <label class="chk"><input type="checkbox" id="vhl"${s.view.invalid ? ' checked' : ''}/>${u.esc(t('v.hl'))}</label>
        <button class="btn pri block" data-act="run">▶ ${u.esc(t('v.run'))}</button><div id="vres" class="bars" style="gap:7px"></div>`);
      $('#vhl', b).onchange = (e) => S.setView({ invalid: e.target.checked });
      const run = () => {
        const r = ops.validate(sh()), box = $('#vres', b);
        box.innerHTML = `<div class="result ${r.total ? 'err' : 'ok'}">${u.esc(r.total ? t('v.issues', { n: cnt(r.total) }) : t('v.allok'))}</div>` + r.cols.filter((c) => c.total).map((c) => `
          <div class="sec" style="padding:.6rem .7rem;gap:.35rem"><div style="display:flex;justify-content:space-between;gap:8px"><b style="font-size:12.5px">${u.esc(c.name)}</b><span class="badge err">${cnt(c.total)}</span></div>
          <div class="chips">${Object.entries(c.kinds).map(([k, n]) => `<span class="badge warn">${u.esc(t('vk.' + k))}: ${cnt(n)}</span>`).join('')}${c.dup ? `<span class="badge warn">${u.esc(t('vk.dup'))}: ${cnt(c.dup)}</span>` : ''}</div>
          <button class="btn sm" data-act="show" data-c="${c.col}" data-d="${c.dup && !Object.keys(c.kinds).length ? 1 : 0}">${u.esc(t('v.show'))}</button></div>`).join('');
      };
      delegate(b, { run, show: (a) => { const c = +a.dataset.c; GF.grid.addFilter({ col: c, op: a.dataset.d === '1' ? 'dupes' : 'invalid' }); } });
    },
  };

  /* ═════════ ANALYZE ═════════ */
  const bars = (rows, total) => `<div class="bars">${rows.map(([k, n]) => `<div class="br"><span title="${u.esc(k)}">${u.esc(k === '' ? '∅' : k)}</span><div class="bar"><i style="width:${total ? Math.max(2, (n / total) * 100) : 0}%"></i></div><span>${cnt(n)}</span></div>`).join('')}</div>`;
  const hist = (h) => {
    const max = Math.max(...h.map((x) => x.n), 1), w = 260, ht = 54, bw = w / h.length;
    return `<svg viewBox="0 0 ${w} ${ht + 4}" width="100%" style="display:block">${h.map((x, i) => `<rect x="${i * bw + 1}" y="${ht - (x.n / max) * ht}" width="${bw - 2}" height="${(x.n / max) * ht}" rx="2" fill="var(--acc)" opacity=".8"><title>${u.fmtNum(x.lo)} – ${u.fmtNum(x.hi)}: ${x.n}</title></rect>`).join('')}</svg>`;
  };
  P.analyze = {
    sig: () => sh().id + sh().cols.map((c) => c.name).join('|'),
    render(b) {
      sync();
      const s = sh();
      if (!s.cols.length) { b.innerHTML = `<div class="hint">${u.esc(t('need.data'))}</div>`; return; }
      const inView = st.aview !== false;
      const idx = inView && (s.view.filters.length || s.view.q) ? S.viewIndex() : null;
      const sm = ops.sheetSummary(s, idx);
      const gb = st.gb;
      b.innerHTML =
        sec('chart', t('a.overview'), `<label class="chk"><input type="checkbox" id="aview"${inView ? ' checked' : ''}/>${u.esc(t('a.viewonly'))}</label>
          <div class="stat-cards"><div class="stat-card"><b>${cnt(sm.rows)}</b><span>${u.esc(t('a.rows'))}</span></div><div class="stat-card"><b>${cnt(sm.cols)}</b><span>${u.esc(t('a.cols'))}</span></div>
          <div class="stat-card"><b>${Math.round(sm.fillRate * 100)}%</b><span>${u.esc(t('a.fill'))}</span></div><div class="stat-card"><b style="color:${sm.dupRows ? 'var(--yel)' : 'var(--grn)'}">${cnt(sm.dupRows)}</b><span>${u.esc(t('a.dups'))}</span></div></div>`) +
        sec('cols', t('a.columns'), s.cols.map((c, i) => `<details class="acc" data-i="${i}"><summary><span class="ty-${c.type}" style="font-size:10px;font-weight:800">${c.type}</span> ${u.esc(c.name)}</summary><div class="acc-b" data-body></div></details>`).join('')) +
        sec('chart', t('a.group'), `<div class="row2">${fld(t('a.by'), `<select class="in" id="gby">${ui.colOpts(s, { sel: gb.by })}</select>`)}${fld(t('a.agg'), `<select class="in" id="gag">${ui.opts(ops.AGGS.map((a) => [a, t('agg.' + a)]), gb.agg)}</select>`)}</div>
          <div class="row2">${fld(t('a.val'), `<select class="in" id="gvl">${ui.colOpts(s, { all: '—', sel: gb.val })}</select>`)}${fld(t('a.top'), `<input class="in" type="number" id="gtp" value="${gb.top}" min="1" max="500"/>`)}</div>
          <div class="btn-row"><button class="btn pri" data-act="grp">${u.esc(t('a.run'))}</button><button class="btn" data-act="grpsheet">${u.esc(t('a.tosheet'))}</button></div><div id="gres"></div>`);
      $('#aview', b).onchange = (e) => { st.aview = e.target.checked; P.analyze.render(b); };
      b.querySelectorAll('details[data-i]').forEach((d) => d.addEventListener('toggle', () => {
        if (!d.open) return;
        const i = +d.dataset.i, x = ops.columnStats(sh(), i, idx), body = $('[data-body]', d);
        const kv = (k, v) => `<div class="kv"><span>${u.esc(k)}</span><b>${v}</b></div>`;
        body.innerHTML = kv(t('a.filled'), cnt(x.filled) + ' / ' + cnt(x.count)) + kv(t('a.empty'), cnt(x.empty)) + kv(t('a.unique'), cnt(x.unique)) +
          (x.numeric ? kv('min', u.fmtNum(x.min)) + kv('max', u.fmtNum(x.max)) + kv(t('a.mean'), u.fmtNum(x.mean)) + kv(t('a.median'), u.fmtNum(x.median)) + kv('σ', u.fmtNum(x.sd)) + kv('Σ', u.fmtNum(x.sum)) + kv('Q1 / Q3', u.fmtNum(x.q1) + ' / ' + u.fmtNum(x.q3)) + hist(x.hist) : (x.minLen != null ? kv(t('a.len'), x.minLen + ' – ' + x.maxLen) : '')) +
          (x.top.length ? `<div class="lbl">${u.esc(t('a.top5'))}</div>` + bars(x.top, x.filled) : '');
      }));
      const gbRead = () => { st.gb = { by: +$('#gby', b).value, val: +$('#gvl', b).value, agg: $('#gag', b).value, top: Math.max(1, num('#gtp', b, 12)) }; return st.gb; };
      const grp = () => { const g = gbRead(); return ops.groupBy(sh(), { by: g.by, val: g.val, agg: g.agg, top: g.top, rows: idx }); };
      delegate(b, {
        grp: () => { const r = grp(); $('#gres', b).innerHTML = r.length ? bars(r.map((x) => [x.key, x.value]), Math.max(...r.map((x) => x.value), 1)) : `<div class="hint">${u.esc(t('a.empty.res'))}</div>`; },
        grpsheet: () => { const g = gbRead(), r = ops.groupBy(sh(), { by: g.by, val: g.val, agg: g.agg, rows: idx }); S.addSheet(ops.groupSheet(r, sh().cols[g.by].name, g.val >= 0 ? sh().cols[g.val].name : '', g.agg, sh().name + ' · ' + t('agg.' + g.agg))); },
      });
    },
  };

  /* ═════════ COMBINE ═════════ */
  P.combine = {
    sig: () => S.wb.sheets.map((x) => x.id + x.name + x.cols.length).join('|') + S.wb.active,
    render(b) {
      sync();
      const s = sh(), others = S.wb.sheets.map((x, i) => [i, x.name]).filter(([i]) => i !== S.wb.active);
      if (!s.cols.length) { b.innerHTML = `<div class="hint">${u.esc(t('need.data'))}</div>`; return; }
      if (!others.length) { b.innerHTML = sec('merge', t('cb.title'), `<div class="hint">${u.esc(t('cb.need2'))}</div><button class="btn pri block" data-act="imp">${ui.icon('up')}${u.esc(t('act.import'))}</button>`); delegate(b, { imp: () => GF.dialogs.import() }); return; }
      b.innerHTML = sec('merge', t('cb.title'), `<div class="hint">${u.esc(t('cb.hint'))}</div>${fld(t('cb.other'), `<select class="in" id="cbo">${ui.opts(others, others[0][0])}</select>`)}
        <div class="row2">${fld(t('cb.ka'), `<select class="in" id="cka">${ui.colOpts(s)}</select>`)}${fld(t('cb.kb'), `<select class="in" id="ckb"></select>`)}</div>`) +
        sec('merge', t('cb.join'), `${fld(t('cb.kind'), `<select class="in" id="cjk">${ui.opts([['left', t('cb.left')], ['inner', t('cb.inner')], ['full', t('cb.full')]], 'left')}</select>`)}<button class="btn pri block" data-act="join">${u.esc(t('cb.join.btn'))}</button>`) +
        sec('filter', t('cb.sets'), `<div class="btn-row"><button class="btn" data-act="set" data-m="both">${u.esc(t('cb.both'))}</button></div><div class="btn-row"><button class="btn" data-act="set" data-m="onlyA">${u.esc(t('cb.onlya'))}</button><button class="btn" data-act="set" data-m="onlyB">${u.esc(t('cb.onlyb'))}</button></div>`) +
        sec('plus', t('cb.append'), `<div class="hint">${u.esc(t('cb.append.hint'))}</div><button class="btn block" data-act="append">${u.esc(t('cb.append.btn'))}</button>`);
      const other = () => S.wb.sheets[+$('#cbo', b).value];
      const fillKb = () => { const o = other(); $('#ckb', b).innerHTML = ui.colOpts(o); const m = o.cols.findIndex((c) => c.name.toLowerCase() === sh().cols[+$('#cka', b).value].name.toLowerCase()); if (m >= 0) $('#ckb', b).value = m; };
      $('#cbo', b).onchange = fillKb; $('#cka', b).onchange = fillKb; fillKb();
      const keys = () => [+$('#cka', b).value, +$('#ckb', b).value];
      delegate(b, {
        join: () => { const [a, k] = keys(), o = other(); S.addSheet(ops.join(sh(), o, a, k, $('#cjk', b).value, sh().name + ' ⋈ ' + o.name)); ui.toast(t('cb.done'), 'ok'); },
        set: (x) => { const [a, k] = keys(), o = other(); S.addSheet(ops.setOp(sh(), o, a, k, x.dataset.m, t('cb.set.' + x.dataset.m))); ui.toast(t('cb.done'), 'ok'); },
        append: () => { const o = other(); let n = 0; S.commit((x) => { n = ops.appendSheets(x, o); }); done(t('cb.appended', { n: cnt(n) })); },
      });
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
