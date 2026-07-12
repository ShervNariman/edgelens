/**
 * Client-side local component file import helpers.
 * Files are read only in the browser — never uploaded or sent to analytics.
 */

export const LOCAL_FILE_EXTENSIONS = [".tsx", ".jsx", ".ts", ".js"] as const;

export type LocalFileExtension = (typeof LOCAL_FILE_EXTENSIONS)[number];

/** Soft cap for a single component file (200 KiB). */
export const LOCAL_FILE_MAX_BYTES = 200 * 1024;

export type SourceOrigin = "example" | "pasted" | "local-file";

export type LocalFileSizeBand = "tiny" | "small" | "medium" | "large";

export type LocalFileErrorCode =
  | "unsupported-type"
  | "too-large"
  | "empty"
  | "read-failed"
  | "multiple-files";

export interface LocalFileError {
  code: LocalFileErrorCode;
  message: string;
}

export interface LocalFileSuccess {
  ok: true;
  code: string;
  /** Display name only — never send to analytics. */
  fileName: string;
  extension: LocalFileExtension;
  byteLength: number;
  sizeBand: LocalFileSizeBand;
}

export interface LocalFileFailure {
  ok: false;
  error: LocalFileError;
}

export type LocalFileResult = LocalFileSuccess | LocalFileFailure;

export function getFileExtension(fileName: string): string {
  const base = fileName.trim().toLowerCase();
  const idx = base.lastIndexOf(".");
  if (idx < 0) return "";
  return base.slice(idx);
}

export function isAllowedLocalFileExtension(
  extension: string
): extension is LocalFileExtension {
  return (LOCAL_FILE_EXTENSIONS as readonly string[]).includes(extension);
}

export function sizeBandForBytes(byteLength: number): LocalFileSizeBand {
  if (byteLength < 2 * 1024) return "tiny";
  if (byteLength < 16 * 1024) return "small";
  if (byteLength < 64 * 1024) return "medium";
  return "large";
}

export function formatByteSize(byteLength: number): string {
  if (byteLength < 1024) return `${byteLength} B`;
  const kib = byteLength / 1024;
  if (kib < 1024) return `${kib < 10 ? kib.toFixed(1) : Math.round(kib)} KB`;
  return `${(kib / 1024).toFixed(1)} MB`;
}

function validateFileMeta(file: File): LocalFileError | null {
  const extension = getFileExtension(file.name);
  if (!isAllowedLocalFileExtension(extension)) {
    return {
      code: "unsupported-type",
      message: `Unsupported file type “${extension || "unknown"}”. Use ${LOCAL_FILE_EXTENSIONS.join(", ")}.`,
    };
  }
  if (file.size > LOCAL_FILE_MAX_BYTES) {
    return {
      code: "too-large",
      message: `File is too large (${formatByteSize(file.size)}). Max is ${formatByteSize(LOCAL_FILE_MAX_BYTES)}.`,
    };
  }
  if (file.size === 0) {
    return {
      code: "empty",
      message: "That file is empty. Pick a component file with source code.",
    };
  }
  return null;
}

/**
 * Validate and read a local File in the browser.
 * Callers must never put fileName, path, or source into analytics.
 */
export async function readLocalComponentFile(
  file: File
): Promise<LocalFileResult> {
  const metaError = validateFileMeta(file);
  if (metaError) return { ok: false, error: metaError };

  const extension = getFileExtension(file.name) as LocalFileExtension;

  try {
    const code = await file.text();
    if (!code.trim()) {
      return {
        ok: false,
        error: {
          code: "empty",
          message: "That file has no readable source. Paste code or try another file.",
        },
      };
    }

    // Re-check UTF-8 byte length after decode (size was on disk metadata).
    const byteLength = new TextEncoder().encode(code).length;
    if (byteLength > LOCAL_FILE_MAX_BYTES) {
      return {
        ok: false,
        error: {
          code: "too-large",
          message: `File content is too large (${formatByteSize(byteLength)}). Max is ${formatByteSize(LOCAL_FILE_MAX_BYTES)}.`,
        },
      };
    }

    return {
      ok: true,
      code,
      fileName: file.name,
      extension,
      byteLength,
      sizeBand: sizeBandForBytes(byteLength),
    };
  } catch {
    return {
      ok: false,
      error: {
        code: "read-failed",
        message:
          "Could not read that file in the browser. Try again, or paste the source instead.",
      },
    };
  }
}

export function pickSingleLocalFile(
  files: FileList | File[] | null | undefined
): { file: File } | LocalFileFailure {
  if (!files || files.length === 0) {
    return {
      ok: false,
      error: {
        code: "empty",
        message: "No file selected. Drop or choose a .tsx / .jsx / .ts / .js file.",
      },
    };
  }
  if (files.length > 1) {
    return {
      ok: false,
      error: {
        code: "multiple-files",
        message: "One file at a time. Drop a single component file.",
      },
    };
  }
  return { file: files[0]! };
}

export function sourceOriginLabel(origin: SourceOrigin): string {
  switch (origin) {
    case "example":
      return "example";
    case "local-file":
      return "local file";
    default:
      return "pasted";
  }
}

/** Analytics-safe source_kind values (never include filenames or source). */
export function sourceKindForAnalytics(
  origin: SourceOrigin
): "example" | "pasted" | "local_file" {
  if (origin === "local-file") return "local_file";
  if (origin === "example") return "example";
  return "pasted";
}
