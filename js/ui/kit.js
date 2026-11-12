/* GridForge — kit.js : toasts, modals, menus, popovers and small UI helpers */
(function (root) {
  'use strict';
  const GF = (root.GF = root.GF || {});
  const u = GF.u;
  const t = (k, v) => GF.i18n.t(k, v);
  const ui = (GF.ui = {});

  ui.icon = (n, cls) => `<svg class="${cls || ''}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><use href="#i-${n}"/></svg>`;
  ui.opts = (list, sel) => list.map(([v, l]) => `<option value="${u.esc(v)}"${String(v) === String(sel) ? ' selected' : ''}>${u.esc(l)}</option>`).join('');
  /** <option>s for the active sheet's columns */
  ui.colOpts = (sh, { all, sel } = {}) => (all ? `<option value="-1">${u.esc(all)}</option>` : '') + sh.cols.map((c, i) => `<option value="${i}"${i === sel ? ' selected' : ''}>${u.esc(c.name)}</option>`).join('');

  /* ── progress + toast ── */
  ui.prog = (p) => { const b = u.$('#prog'); if (!b) return; b.style.width = p + '%'; b.style.opacity = p < 100 ? '1' : '0'; if (p >= 100) setTimeout(() => { b.style.width = '0'; }, 450); };
  ui.toast = (msg, kind, opt = {}) => {
    const w = u.$('#toasts');
    const d = document.createElement('div');
    d.className = 'toast ' + (kind || '');
    const ic = { ok: '✓', err: '⚠', info: 'ℹ' }[kind] || '•';
    d.innerHTML = `<span class="ti">${ic}</span><span>${u.esc(msg)}</span>`;
    if (opt.action) {
      const b = document.createElement('button');
      b.textContent = opt.action.label;
      b.onclick = () => { opt.action.run(); d.remove(); };
      d.appendChild(b);
    }
    w.appendChild(d);
    while (w.children.length > 4) w.firstChild.remove();
    setTimeout(() => { d.style.opacity = '0'; setTimeout(() => d.remove(), 320); }, opt.ms || (kind === 'err' ? 5200 : 3200));
  };

  /* ── modal ── */
  const stack = [];
  ui.modal = ({ title, sub, body, buttons = [], wide, cls, onClose, closable = true }) => {
    const bg = document.createElement('div');
    bg.className = 'mbg on ' + (cls || '');
    bg.innerHTML = `<div class="modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true">
      ${title ? `<div class="modal-h"><div><h2>${u.esc(title)}</h2>${sub ? `<p>${u.esc(sub)}</p>` : ''}</div>${closable ? `<button class="x-btn" data-x>${ui.icon('x')}</button>` : ''}</div>` : ''}
      <div class="modal-b"></div>${buttons.length ? '<div class="modal-f"></div>' : ''}</div>`;
    const bodyEl = u.$('.modal-b', bg);
    if (typeof body === 'string') bodyEl.innerHTML = body; else if (body) bodyEl.appendChild(body);
    const api = { el: bg, body: bodyEl, close: (v) => { const i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1); bg.remove(); onClose && onClose(v); } };
    const foot = u.$('.modal-f', bg);
    buttons.forEach((b) => {
      const el = document.createElement('button');
      el.className = 'btn ' + (b.kind || '');
      el.textContent = b.label;
      el.onclick = async () => { const r = b.onClick ? await b.onClick(api) : undefined; if (b.close !== false && r !== false) api.close(b.value); };
      foot.appendChild(el);
    });
    bg.addEventListener('mousedown', (e) => { if (e.target === bg && closable) api.close(); });
    const x = u.$('[data-x]', bg); if (x) x.onclick = () => api.close();
    api.closable = closable;
    u.$('#modals').appendChild(bg);
    stack.push(api);
    const f = u.$('input:not([type=checkbox]):not([type=file]),select,textarea', bodyEl); if (f && !cls) setTimeout(() => f.focus(), 30);
    return api;
  };
  ui.closeTop = () => { const m = stack[stack.length - 1]; if (m && m.closable) { m.close(); return true; } return false; };
  ui.hasModal = () => stack.length > 0;
  ui.confirm = (msg, { ok, danger, title } = {}) => new Promise((res) => {
    ui.modal({ title: title || t('dlg.confirm'), body: `<p style="white-space:pre-line;line-height:1.7">${u.esc(msg)}</p>`, onClose: (v) => res(v === true),
      buttons: [{ label: t('dlg.cancel'), value: false }, { label: ok || t('dlg.ok'), kind: danger ? 'danger' : 'pri', value: true }] });
  });
  ui.prompt = (title, value = '', { label } = {}) => new Promise((res) => {
    const m = ui.modal({ title, body: `<div class="fld">${label ? `<label>${u.esc(label)}</label>` : ''}<input class="in" id="__p" value="${u.esc(value)}"/></div>`,
      onClose: (v) => res(v === undefined ? null : v),
      buttons: [{ label: t('dlg.cancel'), value: null }, { label: t('dlg.ok'), kind: 'pri', onClick: () => { m.close(u.$('#__p', m.el).value); return false; } }] });
    const i = u.$('#__p', m.el); i.select(); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') m.close(i.value); });
  });

  /* ── menus / popovers ── */
  let openMenu = null;
  ui.closeMenu = () => { if (openMenu) { openMenu.remove(); openMenu = null; return true; } return false; };
  const place = (el, x, y) => {
    const r = el.getBoundingClientRect();
    el.style.left = Math.max(6, Math.min(x, innerWidth - r.width - 6)) + 'px';
    el.style.top = Math.max(6, Math.min(y, innerHeight - r.height - 6)) + 'px';
  };
  /** items: [{label, icon, kbd, run, danger, sep, header, disabled}] or a DOM node (popover) */
  ui.menu = (items, x, y) => {
    ui.closeMenu();
    const el = document.createElement('div');
    el.className = 'menu';
    el.addEventListener('mousedown', (e) => e.stopPropagation());
    if (items instanceof Node) el.appendChild(items);
    else items.forEach((it) => {
      if (it.sep) return el.insertAdjacentHTML('beforeend', '<div class="ms"></div>');
      if (it.header) return el.insertAdjacentHTML('beforeend', `<div class="ml">${u.esc(it.header)}</div>`);
      const d = document.createElement('div');
      d.className = 'mi' + (it.danger ? ' danger' : '');
      if (it.disabled) d.style.opacity = '.4', d.style.pointerEvents = 'none';
      d.innerHTML = `<i>${it.icon || ''}</i><span>${u.esc(it.label)}</span>${it.kbd ? `<kbd>${u.esc(it.kbd)}</kbd>` : ''}`;
      d.onclick = () => { ui.closeMenu(); it.run && it.run(); };
      el.appendChild(d);
    });
    u.$('#menus').appendChild(el);
    place(el, x, y);
    openMenu = el;
    return el;
  };
  ui.menuAt = (anchor, items) => {
    const r = anchor.getBoundingClientRect();
    const rtl = document.documentElement.dir === 'rtl';
    const m = ui.menu(items, rtl ? r.right - 220 : r.left, r.bottom + 4);
    return m;
  };
  document.addEventListener('mousedown', () => ui.closeMenu());
  window.addEventListener('blur', () => ui.closeMenu());
  document.addEventListener('scroll', (e) => { if (!(e.target instanceof Element && e.target.closest && e.target.closest('.menu'))) ui.closeMenu(); }, true);

  /** run a long task with a progress bar + yielding so the UI can paint */
  ui.busy = async (fn) => {
    ui.prog(30);
    await new Promise((r) => setTimeout(r, 16));
    try { return await fn(); } finally { ui.prog(100); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
