// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it, vi } from "vitest";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

function installCoreStubs(overrides = {}, options = {}) {
  const modules = new Map();
  const textEncoding = {
    isEncodingAvailable: (encoding) => encoding !== "shift_jis" || options.shiftJisAvailable === true
  };
  const markdownOptions = {
    resolveMarkdownOptions: (input) => ({
      treatFirstRowAsHeader: input.treatFirstRowAsHeader !== false,
      trimText: input.trimText !== false,
      removeEmptyRows: input.removeEmptyRows !== false,
      removeEmptyColumns: input.removeEmptyColumns !== false,
      includeShapeDetails: input.includeShapeDetails === true,
      outputMode: ["display", "raw", "both"].includes(input.outputMode) ? input.outputMode : "display",
      formattingMode: input.formattingMode === "plain" ? "plain" : "github",
      tableDetectionMode: ["balanced", "border", "planner-aware"].includes(input.tableDetectionMode)
        ? input.tableDetectionMode
        : "balanced"
    })
  };
  const api = {
    parseWorkbook: vi.fn(async () => ({ name: "book.xlsx", sheets: [{ name: "Sheet1", index: 1 }] })),
    convertWorkbookToMarkdownFiles: vi.fn(() => [{
      fileName: "book_001_Sheet1.md",
      sheetName: "Sheet1",
      markdown: "# Sheet1",
      summary: {
        outputMode: "display",
        formattingMode: "github",
        tableDetectionMode: "balanced",
        tables: 1,
        narrativeBlocks: 1,
        merges: 0,
        images: 0,
        cells: 2,
        tableScores: [],
        formulaDiagnostics: []
      }
    }]),
    createSummaryText: vi.fn(() => "summary"),
    createCombinedMarkdownExportFile: vi.fn(() => ({ fileName: "book.md", content: "# combined" })),
    createCombinedMarkdownExportPayload: vi.fn(() => ({
      fileName: "book.md",
      content: "# combined",
      data: new Uint8Array([35]),
      mimeType: "text/markdown;charset=utf-8"
    })),
    createWorkbookExportArchive: vi.fn(() => new Uint8Array([1, 2, 3])),
    ...overrides
  };

  modules.set("textEncoding", textEncoding);
  modules.set("markdownOptions", markdownOptions);
  modules.set("xlsx2md", api);
  globalThis.getXlsx2mdModuleRegistry = () => ({
    getModule: (name) => modules.get(name),
    requireModule: (name) => {
      const module = modules.get(name);
      if (!module) throw new Error(`${name} is not loaded`);
      return module;
    }
  });
  globalThis.__xlsx2mdNodeRequire = options.shiftJisAvailable === true ? (() => ({})) : undefined;
  globalThis.requireXlsx2mdTextEncoding = () => textEncoding;
  globalThis.requireXlsx2mdMarkdownOptions = () => markdownOptions;
  return api;
}

function installComponentStubs() {
  const markdownPreview = document.getElementById("markdownPreview");
  markdownPreview.setText = function setText(text) {
    this.dataset.rendered = text;
    this.textContent = text;
  };

  const loadingOverlay = document.getElementById("loadingOverlay");
  loadingOverlay.show = function show(text) {
    this.dataset.active = "true";
    if (text) this.dataset.text = text;
  };
  loadingOverlay.hide = function hide() {
    delete this.dataset.active;
  };

  const errorAlert = document.getElementById("errorAlert");
  errorAlert.show = function show(text) {
    this.dataset.message = text;
    this.textContent = text;
  };
  errorAlert.clear = function clear() {
    delete this.dataset.message;
    this.textContent = "";
  };

  const toast = document.getElementById("toast");
  toast.show = function show(text) {
    this.dataset.message = text;
  };
}

function createDomFixture() {
  document.body.innerHTML = `
    <input id="xlsxFileInput" type="file" />
    <button id="convertBtn" type="button">Convert</button>
    <button id="downloadBtn" type="button">Download</button>
    <button id="exportZipBtn" type="button">ZIP</button>
    <input id="headerRowEnabled" type="checkbox" checked />
    <input id="trimTextEnabled" type="checkbox" checked />
    <input id="removeEmptyRowsEnabled" type="checkbox" checked />
    <input id="removeEmptyColumnsEnabled" type="checkbox" checked />
    <input id="includeShapeDetailsEnabled" type="checkbox" />
    <select id="outputModeSelect">
      <option value="display" selected>display</option>
      <option value="raw">raw</option>
      <option value="both">both</option>
    </select>
    <select id="encodingSelect">
      <option value="utf-8" selected>utf-8</option>
      <option value="shift_jis">shift_jis</option>
      <option value="utf-16le">utf-16le</option>
    </select>
    <select id="bomSelect">
      <option value="off" selected>off</option>
      <option value="on">on</option>
    </select>
    <select id="formattingModeSelect">
      <option value="plain">plain</option>
      <option value="github" selected>github</option>
    </select>
    <select id="tableDetectionModeSelect">
      <option value="balanced" selected>balanced</option>
      <option value="border">border</option>
      <option value="planner-aware">planner-aware</option>
    </select>
    <div id="outputModeNotice"></div>
    <div id="formattingModeNotice"></div>
    <div id="tableDetectionModeNotice"></div>
    <div id="encodingNotice"></div>
    <div id="bomNotice"></div>
    <div id="previewModeBanner" hidden></div>
    <div id="analysisSummary"></div>
    <div id="scoreSummary"></div>
    <div id="formulaSummary"></div>
    <div id="markdownPreview"></div>
    <pre id="markdownOutput"></pre>
    <div id="loadingOverlay"></div>
    <div id="errorAlert"></div>
    <div id="toast"></div>
  `;
  for (const id of [
    "outputModeSelect",
    "encodingSelect",
    "bomSelect",
    "formattingModeSelect",
    "tableDetectionModeSelect"
  ]) {
    const select = document.getElementById(id);
    select.getValue = function getValue() {
      return this.value;
    };
  }
}

function bootMain(overrides = {}, options = {}) {
  createDomFixture();
  installComponentStubs();
  const api = installCoreStubs(overrides, options);
  const source = readFileSync(path.resolve(rootDir, "src/js/main.js"), "utf8");
  new Function(source)();
  document.dispatchEvent(new Event("DOMContentLoaded"));
  return api;
}

async function flushAsyncWork() {
  await Promise.resolve();
  await new Promise((resolve) => window.setTimeout(resolve, 0));
}

describe("xlsx2md browser UI", () => {
  it("initializes the screen with disabled download actions and default notices", () => {
    bootMain();

    expect(document.getElementById("downloadBtn").disabled).toBe(true);
    expect(document.getElementById("exportZipBtn").disabled).toBe(true);
    expect(document.getElementById("outputModeNotice").textContent).toContain("`display`");
    expect(document.getElementById("formattingModeNotice").textContent).toContain("`github`");
    expect(document.getElementById("tableDetectionModeNotice").textContent).toContain("`balanced`");
    expect(document.getElementById("analysisSummary").textContent).toContain("No conversion yet.");
  });

  it("loads a workbook from the file input and passes UI options to conversion", async () => {
    const api = bootMain();
    document.getElementById("includeShapeDetailsEnabled").checked = true;

    const fileInput = document.getElementById("xlsxFileInput");
    const file = {
      name: "sample.xlsx",
      arrayBuffer: async () => new ArrayBuffer(8)
    };
    Object.defineProperty(fileInput, "files", {
      configurable: true,
      get: () => [file]
    });

    fileInput.dispatchEvent(new Event("change"));
    await flushAsyncWork();

    expect(api.parseWorkbook).toHaveBeenCalledWith(expect.any(ArrayBuffer), "sample.xlsx", { includeShapeDetails: true });
    expect(api.convertWorkbookToMarkdownFiles).toHaveBeenCalledWith(
      expect.objectContaining({ name: "book.xlsx" }),
      expect.objectContaining({
        includeShapeDetails: true,
        outputMode: "display",
        formattingMode: "github",
        tableDetectionMode: "balanced"
      })
    );
    expect(document.getElementById("downloadBtn").disabled).toBe(false);
    expect(document.getElementById("exportZipBtn").disabled).toBe(false);
    expect(document.getElementById("markdownPreview").dataset.rendered).toContain("# combined");
  });

  it("disables shift_jis in browser-only runtime", () => {
    bootMain({}, { shiftJisAvailable: false });

    const shiftJisOption = Array.from(document.getElementById("encodingSelect").querySelectorAll("option"))
      .find((option) => option.value === "shift_jis");

    expect(shiftJisOption.disabled).toBe(true);
    expect(shiftJisOption.text).toContain("CLI only");
  });
});
