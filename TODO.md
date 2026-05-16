# miku-xlsx2md Web Separation TODO

This file tracks the Web-side separation work from `miku-xlsx2md` into `miku-xlsx2md-web`.

## 2026-05-17

- [x] Identify main application repository: `https://github.com/igapyon/miku-xlsx2md`
- [x] Identify Web App repository: `https://github.com/igapyon/miku-xlsx2md-web`
- [x] Use `../miku-xlsx2md` as read-only local upstream context
- [x] Use `../miku-docx2md-web` as the same-layer Web App reference
- [x] Establish Web repository conventions: `.gitignore`, `workplace/.gitkeep`, README, TODO, docs
- [x] Move Web-owned source HTML, CSS, browser adapter source, `lht-cmn`, build scripts, and Web smoke fixture into this repository
- [x] Keep product core semantics in upstream `miku-xlsx2md`
- [x] Use a vendored upstream runtime artifact at `vendor/miku-xlsx2md-runtime.mjs`
- [ ] Replace local-checkout runtime refresh with a GitHub Release runtime asset after upstream `miku-xlsx2md` publishes one
- [ ] Clean old Web-only files from upstream `miku-xlsx2md` in a separate main-application-side pass after Web verification
- [ ] Confirm GitHub Pages and Release asset publication policy for `miku-xlsx2md-web`

## Web-Owned Files

- `index-src.html`, `miku-xlsx2md-src.html`
- `src/ts/main.ts`
- `src/css/app.css`
- `lht-cmn/`
- `vendor/miku-xlsx2md-runtime.mjs`, `vendor/miku-xlsx2md-runtime.json`
- `scripts/build-miku-xlsx2md-web.mjs`
- `scripts/refresh-miku-xlsx2md-runtime.mjs`
- `scripts/lib/`
- `tests/`

## Upstream-Owned Behavior

- XLSX parsing
- Markdown rendering
- table detection
- rich text conversion
- formula diagnostics
- workbook export assembly
- CLI behavior
- upstream runtime release asset generation

## Verification Log

- [x] `npm run refresh:runtime`
- [x] `npm run build:all`
  - Passed: 2 test files, 28 tests
- [x] `npm audit --audit-level=moderate`
  - Passed after `npm audit fix` updated the lockfile
