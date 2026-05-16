# miku-xlsx2md-web

`miku-xlsx2md-web` is the separated Web App surface for `miku-xlsx2md`.

This repository owns the browser UI, Single-file Web App generation, local browser adapters, `lht-cmn` UI components, and browser smoke tests. The product conversion semantics remain owned by the upstream `miku-xlsx2md` main application.

## Repository Role

- Main application repository: <https://github.com/igapyon/miku-xlsx2md>
- Web App repository: <https://github.com/igapyon/miku-xlsx2md-web>

The Web build uses the upstream runtime asset from the `miku-xlsx2md` GitHub Release. The vendored runtime files are:

- `vendor/miku-xlsx2md-runtime.mjs`
- `vendor/miku-xlsx2md-runtime.json`

The runtime is downloaded and committed before release builds so the generated Web App remains offline and reproducible. The Web repository does not read upstream TypeScript source files during normal builds.

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

To stage GitHub Release assets after a build:

```bash
npm run stage:web-release
```

`npm run stage:web-release` writes versioned HTML assets and metadata under `release-assets/`. The GitHub Actions workflow `.github/workflows/release-web-assets.yml` runs on `v*` tags, builds and tests the Web App, stages the release assets, and uploads them to the matching GitHub Release.

To refresh the upstream runtime from GitHub Releases:

```bash
npm run refresh:runtime
```

Set `XLSX2MD_RUNTIME_VERSION=1.0.0` to download a specific release tag, or `XLSX2MD_RUNTIME_URL=<url>` to download a specific runtime asset URL.

## Test

```bash
npm run test:unit
```

Run `npm run build` first when `src/js/` or generated HTML has not been created yet.

## Repository Operation

`workplace/` is a local scratch area for reference checkouts, extracted archives, and verification artifacts. Only `workplace/.gitkeep` is tracked.

Generated distribution files are intentionally committed during this migration so release artifacts remain reviewable. Do not hand-edit generated `index.html`, `miku-xlsx2md.html`, or `src/js/`; update source files or the vendored runtime and run `npm run build`.

`release-assets/` is a local staging directory and is ignored by Git.

## License

Apache License 2.0

See [LICENSE](./LICENSE).
