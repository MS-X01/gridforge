# Contributing

GridForge is intentionally **dependency-free vanilla JS** — no bundler, no framework — so anyone can read and hack it.

```bash
git clone https://github.com/MS-X01/gridforge.git && cd gridforge
python3 -m http.server 8080      # or just double-click index.html
npm test                         # unit + i18n tests, no install needed
npm i && npx playwright install chromium && npm run test:e2e
```

Guidelines
- Engine code (`js/engine/*`, `js/core/*`) must stay DOM-free so it is unit-testable in Node.
- Every user-visible string goes through `GF.i18n.t()` and needs **both** `en` and `fa` entries (`npm test` enforces it).
- Mutations to data go through `GF.store.commit(fn)` so they are undoable.
- Keep the app 100 % offline: no CDN, no fetch. The CSP `connect-src 'none'` will block it anyway.
- Add a test for new engine behaviour in `tests/unit.test.js`.

Adding a language: copy the `en` dictionary in `js/core/i18n.js`, translate it, and add the language to the switcher in `js/ui/dialogs.js` (settings) — RTL is handled by `setLang`.
