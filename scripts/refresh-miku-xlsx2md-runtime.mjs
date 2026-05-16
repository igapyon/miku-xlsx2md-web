import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";

const ROOT = process.cwd();
const REPOSITORY = "igapyon/miku-xlsx2md";
const RUNTIME_PATH = path.resolve(ROOT, "vendor", "miku-xlsx2md-runtime.mjs");
const METADATA_PATH = path.resolve(ROOT, "vendor", "miku-xlsx2md-runtime.json");

const requestedVersion = process.env.XLSX2MD_RUNTIME_VERSION || "latest";
const directRuntimeUrl = process.env.XLSX2MD_RUNTIME_URL || "";

async function main() {
  const release = directRuntimeUrl
    ? createDirectRelease(directRuntimeUrl)
    : await fetchRelease(requestedVersion);
  const asset = directRuntimeUrl ? release.asset : findRuntimeAsset(release);
  const runtimeSource = await getText(asset.browser_download_url);
  validateRuntimeSource(runtimeSource, asset.name);

  await fs.mkdir(path.dirname(RUNTIME_PATH), { recursive: true });
  await fs.writeFile(RUNTIME_PATH, runtimeSource, "utf8");
  await fs.writeFile(METADATA_PATH, JSON.stringify({
    repository: REPOSITORY,
    releaseTag: release.tag_name,
    runtimeVersion: parseRuntimeVersion(runtimeSource),
    assetName: asset.name,
    assetDigest: asset.digest || "",
    browserDownloadUrl: asset.browser_download_url
  }, null, 2) + "\n", "utf8");

  console.log(`[refresh:runtime] ${asset.name} -> ${path.relative(ROOT, RUNTIME_PATH)}`);
}

function createDirectRelease(url) {
  const assetName = path.basename(new URL(url).pathname);
  return {
    tag_name: requestedVersion === "latest" ? "" : normalizeTag(requestedVersion),
    asset: {
      name: assetName,
      digest: "",
      browser_download_url: url
    }
  };
}

async function fetchRelease(version) {
  const tagPath = version === "latest" ? "latest" : `tags/${normalizeTag(version)}`;
  const url = `https://api.github.com/repos/${REPOSITORY}/releases/${tagPath}`;
  return JSON.parse(await getText(url, { accept: "application/vnd.github+json" }));
}

function normalizeTag(version) {
  return version.startsWith("v") ? version : `v${version}`;
}

function findRuntimeAsset(release) {
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const asset = assets.find((candidate) => /^miku-xlsx2md-runtime-.+\.mjs$/.test(candidate.name));
  if (!asset) {
    throw new Error(`Runtime asset was not found in release ${release.tag_name || requestedVersion}.`);
  }
  return asset;
}

function getText(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, {
      headers: {
        "User-Agent": "miku-xlsx2md-web-runtime-downloader",
        ...headers
      }
    }, (response) => {
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        response.resume();
        resolve(getText(new URL(response.headers.location, url).href, headers));
        return;
      }
      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`GET ${url} failed with HTTP ${response.statusCode}`));
        return;
      }
      response.setEncoding("utf8");
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => resolve(body));
    });
    request.on("error", reject);
  });
}

function validateRuntimeSource(source, assetName) {
  if (!source.includes("export function loadXlsx2mdRuntime")) {
    throw new Error(`${assetName} does not look like a miku-xlsx2md runtime bundle.`);
  }
  if (!source.includes("export const version")) {
    throw new Error(`${assetName} does not expose a runtime version.`);
  }
}

function parseRuntimeVersion(source) {
  const match = source.match(/export const version = "([^"]+)";/);
  return match ? match[1] : "";
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
