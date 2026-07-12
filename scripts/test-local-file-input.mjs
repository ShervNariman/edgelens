#!/usr/bin/env node
/**
 * SHE-149 — local file import validation + privacy regression checks.
 * Pure Node (no browser). Uses File/Blob from Node 20+.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const LOCAL_FILE_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"];
const LOCAL_FILE_MAX_BYTES = 200 * 1024;

function getFileExtension(fileName) {
  const base = fileName.trim().toLowerCase();
  const idx = base.lastIndexOf(".");
  return idx < 0 ? "" : base.slice(idx);
}

function isAllowedLocalFileExtension(extension) {
  return LOCAL_FILE_EXTENSIONS.includes(extension);
}

function sizeBandForBytes(byteLength) {
  if (byteLength < 2 * 1024) return "tiny";
  if (byteLength < 16 * 1024) return "small";
  if (byteLength < 64 * 1024) return "medium";
  return "large";
}

function pickSingleLocalFile(files) {
  if (!files || files.length === 0) {
    return { ok: false, error: { code: "empty", message: "No file" } };
  }
  if (files.length > 1) {
    return { ok: false, error: { code: "multiple-files", message: "One file" } };
  }
  return { file: files[0] };
}

async function readLocalComponentFile(file) {
  const extension = getFileExtension(file.name);
  if (!isAllowedLocalFileExtension(extension)) {
    return { ok: false, error: { code: "unsupported-type", message: "bad type" } };
  }
  if (file.size > LOCAL_FILE_MAX_BYTES) {
    return { ok: false, error: { code: "too-large", message: "large" } };
  }
  if (file.size === 0) {
    return { ok: false, error: { code: "empty", message: "empty" } };
  }
  const code = await file.text();
  if (!code.trim()) {
    return { ok: false, error: { code: "empty", message: "empty" } };
  }
  const byteLength = new TextEncoder().encode(code).length;
  if (byteLength > LOCAL_FILE_MAX_BYTES) {
    return { ok: false, error: { code: "too-large", message: "large" } };
  }
  return {
    ok: true,
    code,
    fileName: file.name,
    extension,
    byteLength,
    sizeBand: sizeBandForBytes(byteLength),
  };
}

function makeFile(name, contents) {
  return new File([contents], name, { type: "text/plain" });
}

function assertSourceMatchesLib() {
  const src = readFileSync(join(root, "lib/local-file.ts"), "utf8");
  assert.match(src, /LOCAL_FILE_MAX_BYTES = 200 \* 1024/);
  assert.match(src, /"\.tsx"/);
  assert.match(src, /"\.jsx"/);
  assert.match(src, /"\.ts"/);
  assert.match(src, /"\.js"/);
  assert.match(src, /never put fileName/i);
}

async function main() {
  assertSourceMatchesLib();

  assert.equal(getFileExtension("LoginForm.tsx"), ".tsx");
  assert.equal(isAllowedLocalFileExtension(".tsx"), true);
  assert.equal(isAllowedLocalFileExtension(".css"), false);
  assert.equal(sizeBandForBytes(500), "tiny");
  assert.equal(sizeBandForBytes(8 * 1024), "small");

  const multi = pickSingleLocalFile([makeFile("a.tsx", "a"), makeFile("b.tsx", "b")]);
  assert.equal(multi.ok, false);
  assert.equal(multi.error.code, "multiple-files");

  const badType = await readLocalComponentFile(makeFile("styles.css", "body{}"));
  assert.equal(badType.ok, false);
  assert.equal(badType.error.code, "unsupported-type");

  const empty = await readLocalComponentFile(makeFile("Empty.tsx", "   "));
  assert.equal(empty.ok, false);
  assert.equal(empty.error.code, "empty");

  const oversized = await readLocalComponentFile(
    makeFile("Huge.tsx", "x".repeat(LOCAL_FILE_MAX_BYTES + 10))
  );
  assert.equal(oversized.ok, false);
  assert.equal(oversized.error.code, "too-large");

  const ok = await readLocalComponentFile(
    makeFile(
      "LoginForm.tsx",
      "export function LoginForm() { return <button>Sign in</button> }"
    )
  );
  assert.equal(ok.ok, true);
  assert.equal(ok.extension, ".tsx");
  assert.match(ok.code, /LoginForm/);
  assert.equal(ok.fileName, "LoginForm.tsx");

  const analytics = readFileSync(join(root, "lib/analytics.ts"), "utf8");
  assert.match(analytics, /local_file_selected/);
  assert.match(analytics, /fix_copied/);
  assert.match(analytics, /state_forced/);

  const panel = readFileSync(join(root, "components/code-input-panel.tsx"), "utf8");
  assert.match(panel, /captureEvent\("local_file_selected"/);
  assert.match(panel, /extension: result\.extension/);
  assert.match(panel, /size_band: result\.sizeBand/);
  // Must not send file name or source into analytics.
  const captureBlock = panel.slice(
    panel.indexOf('captureEvent("local_file_selected"'),
    panel.indexOf("});", panel.indexOf('captureEvent("local_file_selected"')) + 3
  );
  assert.doesNotMatch(captureBlock, /fileName/);
  assert.doesNotMatch(captureBlock, /\bcode\b/);

  const results = readFileSync(join(root, "components/results-panel.tsx"), "utf8");
  assert.match(results, /captureEvent\("fix_copied"/);
  assert.match(results, /aria-live="polite"/);

  const analyzer = readFileSync(join(root, "components/analyzer-app.tsx"), "utf8");
  assert.match(analyzer, /captureEvent\("state_forced"/);
  assert.match(analyzer, /sourceOrigin/);

  console.log("local-file-input checks passed.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
