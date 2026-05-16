# miku-xlsx2md-web

`miku-xlsx2md-web` is the separated Web App surface for `miku-xlsx2md`.

This repository owns the browser UI, Single-file Web App generation, local browser adapters, `lht-cmn` UI components, and browser smoke tests. The product conversion semantics remain owned by the upstream `miku-xlsx2md` main application.

## Repository Role

- Main application repository: <https://github.com/igapyon/miku-xlsx2md>
- Web App repository: <https://github.com/igapyon/miku-xlsx2md-web>

The Web build uses a vendored upstream runtime generated from the `miku-xlsx2md` core. The vendored runtime files are:

- `vendor/miku-xlsx2md-runtime.mjs`
- `vendor/miku-xlsx2md-runtime.json`

The runtime is committed before release builds so the generated Web App remains offline and reproducible. The Web repository does not read upstream TypeScript source files during normal builds.

## Build

```bash
npm install
npm run build
```

`npm run build` generates:

- `index.html`
- `miku-xlsx2md.html`
- `src/js/`

The generated `miku-xlsx2md.html` is the Single-file Web App artifact. It embeds the vendored runtime and is intended to open directly from the local filesystem and run normal conversion without network access.

To refresh the upstream runtime from a local checkout:

```bash
npm run refresh:runtime
```

Set `XLSX2MD_UPSTREAM_ROOT=/path/to/miku-xlsx2md` when the upstream checkout is not available at `../miku-xlsx2md`.

## Test

```bash
npm run test:unit
```

Run `npm run build` first when `src/js/` or generated HTML has not been created yet.

## Repository Operation

`workplace/` is a local scratch area for reference checkouts, extracted archives, and verification artifacts. Only `workplace/.gitkeep` is tracked.

Generated distribution files are intentionally committed during this migration so release artifacts remain reviewable. Do not hand-edit generated `index.html`, `miku-xlsx2md.html`, or `src/js/`; update source files or the vendored runtime and run `npm run build`.

## License

Apache License 2.0

See [LICENSE](./LICENSE).
