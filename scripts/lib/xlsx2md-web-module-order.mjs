export const XLSX2MD_WEB_TS_ORDER = [
  "src/ts/main.ts"
];

export const XLSX2MD_WEB_JS_ORDER = XLSX2MD_WEB_TS_ORDER.map((relPath) =>
  relPath.replace(/^src\/ts\//, "src/js/").replace(/\.ts$/, ".js")
);
