# Architecture

GridForge is plain HTML/CSS/JS with **no build step**. Scripts are classic (non-module) files that attach to a single global `GF` namespace, which is why `index.html` works straight from `file://` (browsers block ES modules there).

## Layers
```
                 ┌────────────── js/app.js (boot, commands, shortcuts) ──────────────┐
UI   js/ui/      │ chrome (top bar, panel host, tabs, status) · grid · panels · dialogs · kit │
                 └─────────────┬───────────────────────────────┬───────────────────┘
                               │ GF.on / GF.emit                │ GF.store.commit()
CORE js/core/    utils · i18n · store (workbook, history, view cache, IndexedDB)
                               │
ENGINE js/engine/ parse · export · ops · generate · analyze · formula · templates   ← pure functions, DOM-free
```
The engine never touches the DOM or the store's UI events, so `tests/unit.test.js` runs it in plain Node.

## Data model
```js
workbook = { name, active, sheets: [sheet] }
sheet    = { id, name, cols: [col], rows: string[][], view }
col      = { id, name, type, required, unique, def, options, hidden, width }
view     = { q, rx, cs, scol, filters: [{col,op,val}], sort: [{col,dir}], dups, invalid }
```
Cells are always strings; `type` only affects sorting, alignment, validation and exports. Rows are plain arrays (cheap for 100 k+ rows).

## Store
- `S.commit(fn, scope?, {keepView?})` snapshots (active sheet or whole workbook) → runs `fn(sheet)` → emits `change`. History is capped by total cell count.
- **View index**: `S.viewIndex()` returns data-row indices after filter → search → sort, cached on `S.viewVer`. A cell edit passes `keepView` so rows don't jump while you type in a sorted/filtered grid.
- Autosave: debounced `IndexedDB` write of the project object; restored on boot.
- Events: `change {schema}`, `view`, `sel`, `sheets`, `settings`, `history`, `saving`, `lang`.

## Grid
A single `<table>` with spacer rows: only rows in `[scrollTop/rowH ± 10]` exist in the DOM (~45 rows for 200 k). Row height is fixed (set by density) which keeps the maths trivial. Selection is stored in *view-row × visible-column* coordinates; mouse/keyboard/clipboard handlers are delegated on the scroll container.

## i18n
`GF.i18n.t(key, vars)` with `en`/`fa` dictionaries; static markup uses `data-i18n*`. `tests/i18n.test.js` fails the build when a key is missing in either language.

## Security notes
- No `eval` / `Function`; formulas use a hand-written parser (`js/engine/formula.js`).
- All user text is escaped with `u.esc` before `innerHTML`.
- CSP meta tag: `connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'`.
