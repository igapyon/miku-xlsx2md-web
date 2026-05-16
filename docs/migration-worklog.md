# miku-xlsx2md Web Separation Worklog

## 2026-05-17

- Main application repository: `https://github.com/igapyon/miku-xlsx2md`
- Web App repository: `https://github.com/igapyon/miku-xlsx2md-web`
- Local upstream reference: `../miku-xlsx2md`
- Same-layer reference checked: `../miku-docx2md-web`
- Workflow used: `32-node-web-separation-workflow.md`
- Owning layer: `11 Web App`
- Current target: establish and verify the Web repository

## Scope

The Web repository owns browser UI source, generated Single-file Web App output, browser adapters, shared `lht-cmn` components, Web build scripts, Web tests, and Web release assets.

Product semantics remain upstream-owned by `miku-xlsx2md`: workbook parsing, table detection, rich text conversion, Markdown export, diagnostics, artifact assembly, and CLI behavior.

## Dependency Decision

`miku-xlsx2md` now provides a runtime bundle/release asset flow comparable to `miku-docx2md-runtime-<version>.mjs`.

For this Web-side checkpoint, `miku-xlsx2md-web` vendors `vendor/miku-xlsx2md-runtime.mjs`, refreshed from the upstream GitHub Release by:

```bash
npm run refresh:runtime
```

Use `XLSX2MD_RUNTIME_VERSION=<version>` for a pinned release tag, or `XLSX2MD_RUNTIME_URL=<url>` for a specific runtime asset URL. Normal Web builds use the committed vendored runtime and do not read upstream source paths.
