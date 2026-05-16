import fs from "node:fs/promises";
import path from "node:path";

const ROOT = process.cwd();
const RELEASE_ASSETS_DIR = path.resolve(ROOT, "release-assets");
const PRODUCT_HTML = "miku-xlsx2md.html";
const INDEX_HTML = "index.html";

async function readPackageJson() {
  return JSON.parse(await fs.readFile(path.resolve(ROOT, "package.json"), "utf8"));
}

function getPackageVersion(packageJson) {
  if (!packageJson.version) {
    throw new Error("package.json version is required to stage Web release assets.");
  }
  return packageJson.version;
}

function resolveReleaseVersion(packageVersion) {
  const tagName = process.env.TAG_NAME || "";
  if (!tagName) {
    return packageVersion;
  }
  if (!tagName.startsWith("v")) {
    throw new Error(`Release tag must start with "v": ${tagName}`);
  }
  const version = tagName.slice(1);
  if (version !== packageVersion && !version.startsWith(`${packageVersion}.`)) {
    throw new Error(
      `Release tag version (${version}) must match package.json version (${packageVersion}) or add a dot suffix.`
    );
  }
  return version;
}

async function copyAsset(sourceName, targetName) {
  const sourcePath = path.resolve(ROOT, sourceName);
  const targetPath = path.resolve(RELEASE_ASSETS_DIR, targetName);
  await fs.copyFile(sourcePath, targetPath);
  console.log(`[stage:web-release] staged ${path.relative(ROOT, targetPath)}`);
}

async function main() {
  const packageJson = await readPackageJson();
  const packageVersion = getPackageVersion(packageJson);
  const releaseVersion = resolveReleaseVersion(packageVersion);

  await fs.mkdir(RELEASE_ASSETS_DIR, { recursive: true });
  await copyAsset(PRODUCT_HTML, `miku-xlsx2md-web-${releaseVersion}.html`);
  await copyAsset(INDEX_HTML, `miku-xlsx2md-web-index-${releaseVersion}.html`);

  const metadata = {
    repository: "igapyon/miku-xlsx2md-web",
    releaseVersion,
    productHtmlAsset: `miku-xlsx2md-web-${releaseVersion}.html`,
    indexHtmlAsset: `miku-xlsx2md-web-index-${releaseVersion}.html`,
    sourceFiles: [PRODUCT_HTML, INDEX_HTML]
  };
  const metadataPath = path.resolve(RELEASE_ASSETS_DIR, `miku-xlsx2md-web-${releaseVersion}.json`);
  await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2) + "\n", "utf8");
  console.log(`[stage:web-release] staged ${path.relative(ROOT, metadataPath)}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
