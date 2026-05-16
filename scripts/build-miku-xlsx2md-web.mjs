import fs from "node:fs";
import path from "node:path";

import { buildSingleHtmlFromSource } from "./lib/single-html.mjs";
import { XLSX2MD_WEB_TS_ORDER } from "./lib/xlsx2md-web-module-order.mjs";

const ROOT = process.cwd();
const BUILD_DATE_PLACEHOLDER = "{{BUILD_DATE}}";
const RUNTIME_SOURCE_PATH = path.resolve(ROOT, "vendor", "miku-xlsx2md-runtime.mjs");
const RUNTIME_METADATA_PATH = path.resolve(ROOT, "vendor", "miku-xlsx2md-runtime.json");
const RUNTIME_BROWSER_PATH = path.resolve(ROOT, "src", "js", "miku-xlsx2md-runtime.js");

const TARGETS = [
  {
    srcHtml: "index-src.html",
    outHtml: "index.html"
  },
  {
    srcHtml: "miku-xlsx2md-src.html",
    outHtml: "miku-xlsx2md.html",
    tsOrder: XLSX2MD_WEB_TS_ORDER
  }
];

const runtimeMetadata = loadRuntimeMetadata();
const tsModule = await loadTypeScriptModule();

for (const target of TARGETS) {
  prepareBrowserRuntime();
  transpileTypeScript(target.tsOrder, tsModule);
  const srcPath = path.resolve(ROOT, target.srcHtml);
  const outPath = path.resolve(ROOT, target.outHtml);
  const source = applyBuildPlaceholders(fs.readFileSync(srcPath, "utf8"), runtimeMetadata);
  const output = buildSingleHtmlFromSource(source, srcPath);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, output, "utf8");
  console.log(`[build:miku-xlsx2md-web] generated ${target.outHtml}`);
}

function loadRuntimeMetadata() {
  if (!fs.existsSync(RUNTIME_SOURCE_PATH)) {
    throw new Error("Missing vendored runtime. Run `npm run refresh:runtime` before `npm run build`.");
  }
  const runtimeSource = fs.readFileSync(RUNTIME_SOURCE_PATH, "utf8");
  const metadata = fs.existsSync(RUNTIME_METADATA_PATH)
    ? JSON.parse(fs.readFileSync(RUNTIME_METADATA_PATH, "utf8"))
    : {};
  const version = typeof metadata.runtimeVersion === "string" && metadata.runtimeVersion
    ? metadata.runtimeVersion
    : parseRuntimeVersion(runtimeSource);
  return {
    buildDate: formatBuildDate(),
    version,
    versionStamp: version
  };
}

function applyBuildPlaceholders(source, metadata) {
  return source
    .replaceAll(BUILD_DATE_PLACEHOLDER, metadata.buildDate)
    .replaceAll("__PACKAGE_VERSION__", metadata.version)
    .replaceAll("__PACKAGE_VERSION_STAMP__", metadata.versionStamp);
}

function formatBuildDate(date = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
  return formatter.format(date);
}

function parseRuntimeVersion(source) {
  const match = source.match(/export const version = "([^"]+)";/);
  return match ? match[1] : "0.0.0";
}

function prepareBrowserRuntime() {
  const runtimeSource = fs.readFileSync(RUNTIME_SOURCE_PATH, "utf8");
  const browserSource = runtimeSource
    .replace("export const version = ", "const version = ")
    .replace("export const embeddedCorePaths = ", "const embeddedCorePaths = ")
    .replace("export function loadXlsx2mdRuntime", "function loadXlsx2mdRuntime")
    .replace(/\nexport default loadXlsx2mdRuntime;\s*$/, "")
    + "\n\nglobalThis.loadXlsx2mdRuntime = loadXlsx2mdRuntime;\n"
    + "globalThis.__xlsx2mdRuntime = { version, embeddedCorePaths, loadXlsx2mdRuntime };\n"
    + "loadXlsx2mdRuntime();\n";
  fs.mkdirSync(path.dirname(RUNTIME_BROWSER_PATH), { recursive: true });
  fs.writeFileSync(RUNTIME_BROWSER_PATH, browserSource, "utf8");
}

async function loadTypeScriptModule() {
  try {
    const module = await import("typescript");
    return module.default || module;
  } catch {
    throw new Error("TypeScript is required for build. Install dependencies before running `npm run build`.");
  }
}

function transpileTypeScript(tsOrder, tsModule) {
  if (!tsOrder) {
    return;
  }

  for (const relTsPath of tsOrder) {
    const tsPath = path.resolve(ROOT, relTsPath);
    const jsPath = path.resolve(ROOT, relTsPath.replace("/ts/", "/js/").replace(/\.ts$/, ".js"));
    const source = fs.readFileSync(tsPath, "utf8");
    const result = tsModule.transpileModule(source, {
      compilerOptions: {
        target: tsModule.ScriptTarget.ES2019,
        module: tsModule.ModuleKind.None,
        lib: ["ES2020", "DOM"],
        strict: false,
        skipLibCheck: true
      },
      reportDiagnostics: true,
      fileName: tsPath
    });

    if (result.diagnostics && result.diagnostics.length > 0) {
      const errors = result.diagnostics
        .filter((diagnostic) => diagnostic.category === tsModule.DiagnosticCategory.Error)
        .map((diagnostic) => tsModule.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      if (errors.length > 0) {
        throw new Error(`TypeScript transpile error in ${relTsPath}:\n${errors.join("\n")}`);
      }
    }

    fs.mkdirSync(path.dirname(jsPath), { recursive: true });
    fs.writeFileSync(jsPath, result.outputText, "utf8");
  }
}
