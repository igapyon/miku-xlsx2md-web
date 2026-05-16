import fs from "node:fs/promises";
import path from "node:path";

import { XLSX2MD_CORE_JS_ORDER } from "./lib/xlsx2md-core-module-order.mjs";

const ROOT = process.cwd();
const DEFAULT_UPSTREAM_ROOT = path.resolve(ROOT, "..", "miku-xlsx2md");
const upstreamRoot = path.resolve(process.env.XLSX2MD_UPSTREAM_ROOT || DEFAULT_UPSTREAM_ROOT);
const runtimePath = path.resolve(ROOT, "vendor", "miku-xlsx2md-runtime.mjs");
const metadataPath = path.resolve(ROOT, "vendor", "miku-xlsx2md-runtime.json");

async function readUpstreamText(relPath) {
  return fs.readFile(path.resolve(upstreamRoot, relPath), "utf8");
}

async function createRuntimeSource() {
  const packageJson = JSON.parse(await readUpstreamText("package.json"));
  const coreSources = [];
  for (const relPath of XLSX2MD_CORE_JS_ORDER) {
    coreSources.push({
      path: relPath,
      source: await readUpstreamText(relPath)
    });
  }

  return `/*
 * miku-xlsx2md runtime bundle
 * Source repository: https://github.com/igapyon/miku-xlsx2md
 * Version: ${packageJson.version || "0.0.0"}
 */
const XLSX2MD_RUNTIME_CORE_SOURCES = ${JSON.stringify(coreSources)};
let cachedApi = null;

export const version = ${JSON.stringify(packageJson.version || "0.0.0")};
export const embeddedCorePaths = XLSX2MD_RUNTIME_CORE_SOURCES.map((entry) => entry.path);

export function loadXlsx2mdRuntime(options = {}) {
  if (cachedApi && !options.reset) {
    return cachedApi;
  }

  if (options.reset) {
    delete globalThis.__xlsx2mdModuleRegistry;
    delete globalThis.__xlsx2mdModuleRegistryStore;
    delete globalThis.getXlsx2mdModuleRegistry;
  }

  for (const entry of XLSX2MD_RUNTIME_CORE_SOURCES) {
    new Function(entry.source)();
  }

  const api = globalThis.__xlsx2mdModuleRegistry?.getModule("xlsx2md");
  if (!api) {
    throw new Error("xlsx2md runtime API failed to initialize.");
  }

  cachedApi = api;
  return api;
}

export default loadXlsx2mdRuntime;
`;
}

async function main() {
  await fs.access(path.resolve(upstreamRoot, "package.json"));
  await fs.mkdir(path.dirname(runtimePath), { recursive: true });
  await fs.writeFile(runtimePath, await createRuntimeSource(), "utf8");
  await fs.writeFile(metadataPath, JSON.stringify({
    repository: "https://github.com/igapyon/miku-xlsx2md",
    source: "local-upstream-checkout",
    runtimeVersion: JSON.parse(await readUpstreamText("package.json")).version || "0.0.0",
    embeddedCorePaths: XLSX2MD_CORE_JS_ORDER
  }, null, 2) + "\n", "utf8");
  console.log(`[refresh:runtime] generated ${path.relative(ROOT, runtimePath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
