"use client";

import { useCallback, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CODE_EXAMPLES, type CodeExample } from "@/examples";
import { captureEvent } from "@/lib/analytics";
import {
  LOCAL_FILE_EXTENSIONS,
  LOCAL_FILE_MAX_BYTES,
  formatByteSize,
  pickSingleLocalFile,
  readLocalComponentFile,
  sourceKindForAnalytics,
  sourceOriginLabel,
  type LocalFileError,
  type SourceOrigin,
} from "@/lib/local-file";
import {
  ONBOARDING_STEPS,
  PRIVACY_LOCAL_ONLY,
} from "@/lib/product-copy";
import { cn } from "@/lib/utils";
import {
  FileCode2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";

export interface LocalFileMeta {
  fileName: string;
  extension: string;
  byteLength: number;
  sizeBand: string;
}

interface CodeInputPanelProps {
  code: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedExample: CodeExample | null;
  onSelectExample: (example: CodeExample) => void;
  sourceOrigin: SourceOrigin;
  localFile: LocalFileMeta | null;
  onLocalFileLoaded: (payload: {
    code: string;
    fileName: string;
    extension: string;
    byteLength: number;
    sizeBand: string;
  }) => void;
  fileError: LocalFileError | null;
  onFileError: (error: LocalFileError | null) => void;
  /** Tighter layout for /record/edgelens capture frames. */
  compact?: boolean;
}

export function CodeInputPanel({
  code,
  onChange,
  onAnalyze,
  isAnalyzing,
  selectedExample,
  onSelectExample,
  sourceOrigin,
  localFile,
  onLocalFileLoaded,
  fileError,
  onFileError,
  compact = false,
}: CodeInputPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputId = useId();
  const [isDragging, setIsDragging] = useState(false);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const showOnboarding = !code.trim() && !isAnalyzing;

  const acceptAttr = LOCAL_FILE_EXTENSIONS.join(",");

  const ingestFile = useCallback(
    async (raw: FileList | File[] | null | undefined) => {
      const picked = pickSingleLocalFile(raw);
      if ("error" in picked) {
        onFileError(picked.error);
        return;
      }
      const { file } = picked;
      setIsReadingFile(true);
      onFileError(null);
      try {
        const result = await readLocalComponentFile(file);
        if (!result.ok) {
          onFileError(result.error);
          return;
        }
        captureEvent("local_file_selected", {
          extension: result.extension,
          size_band: result.sizeBand,
        });
        onLocalFileLoaded({
          code: result.code,
          fileName: result.fileName,
          extension: result.extension,
          byteLength: result.byteLength,
          sizeBand: result.sizeBand,
        });
      } finally {
        setIsReadingFile(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    },
    [onFileError, onLocalFileLoaded]
  );

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <div className={cn("flex h-full flex-col", compact ? "gap-2.5" : "gap-3")}>
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-medium tracking-wide text-foreground">
            Component source
          </h2>
          <span
            className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
            title="Where this source came from"
          >
            origin: {sourceOriginLabel(sourceOrigin)}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {compact
            ? "Preloaded launch demo — swap examples or import a local file."
            : "Import a local file, paste source, or load an example — then Analyze."}
        </p>
      </div>

      {!compact && (
        <div
          className={cn(
            "rounded-lg border border-dashed px-3 py-3 transition-colors",
            isDragging
              ? "border-emerald-500/50 bg-emerald-500/10"
              : "border-border/80 bg-background/40",
            fileError && "border-destructive/40 bg-destructive/5"
          )}
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            void ingestFile(e.dataTransfer.files);
          }}
        >
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <Upload
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  isDragging ? "text-emerald-600" : "text-muted-foreground"
                )}
                aria-hidden
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {isDragging
                    ? "Drop to load locally"
                    : "Open a local component file"}
                </p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">
                  Drag & drop or choose{" "}
                  <span className="font-mono">
                    {LOCAL_FILE_EXTENSIONS.join(" / ")}
                  </span>
                  . Max {formatByteSize(LOCAL_FILE_MAX_BYTES)}. Read only in
                  this browser.
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0 gap-1.5"
              onClick={openFilePicker}
              disabled={isReadingFile || isAnalyzing}
            >
              {isReadingFile ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FileCode2 className="h-3.5 w-3.5" />
              )}
              {isReadingFile ? "Reading…" : "Choose file"}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept={acceptAttr}
            className="sr-only"
            aria-label="Choose a local React component file"
            onChange={(e) => {
              void ingestFile(e.target.files);
            }}
          />
        </div>
      )}

      {compact && (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={openFilePicker}
            disabled={isReadingFile || isAnalyzing}
          >
            {isReadingFile ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Local file
          </Button>
          <input
            ref={fileInputRef}
            id={fileInputId}
            type="file"
            accept={acceptAttr}
            className="sr-only"
            aria-label="Choose a local React component file"
            onChange={(e) => {
              void ingestFile(e.target.files);
            }}
          />
        </div>
      )}

      <div
        className={cn(
          "flex gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground",
          compact && "py-1.5"
        )}
        role="note"
      >
        <ShieldCheck
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400"
          aria-hidden
        />
        <p>{PRIVACY_LOCAL_ONLY}</p>
      </div>

      {fileError && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive"
        >
          <p className="font-medium">Couldn’t load file</p>
          <p className="mt-0.5">{fileError.message}</p>
        </div>
      )}

      {localFile && sourceOrigin === "local-file" && (
        <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-[11px] text-muted-foreground">
          <p className="font-medium text-foreground/90">
            Loaded from local file
          </p>
          <p className="mt-0.5 truncate font-mono" title={localFile.fileName}>
            {localFile.fileName}
            <span className="text-muted-foreground/80">
              {" "}
              · {formatByteSize(localFile.byteLength)}
            </span>
          </p>
        </div>
      )}

      {showOnboarding && !compact && (
        <div className="rounded-lg border border-border/70 bg-card/40 px-3 py-3">
          <p className="text-xs font-medium text-foreground">
            First run — three steps
          </p>
          <ol className="mt-2 space-y-1.5">
            {ONBOARDING_STEPS.map((item) => (
              <li key={item.step} className="flex gap-2 text-[11px] leading-snug">
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  {item.step}.
                </span>
                <span>
                  <span className="font-medium text-foreground/90">
                    {item.title}
                  </span>
                  <span className="text-muted-foreground">
                    {" — "}
                    {item.detail}
                  </span>
                </span>
              </li>
            ))}
          </ol>
          <Button
            type="button"
            size="sm"
            className="mt-3 w-full gap-1.5"
            onClick={openFilePicker}
            disabled={isReadingFile}
          >
            <Upload className="h-3.5 w-3.5" />
            Open local file
          </Button>
        </div>
      )}

      <div
        className={cn(
          "grid gap-1.5",
          compact ? "sm:grid-cols-1" : "sm:grid-cols-1"
        )}
      >
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Built-in examples
        </p>
        {CODE_EXAMPLES.map((example) => {
          const active = selectedExample?.id === example.id;
          return (
            <button
              key={example.id}
              type="button"
              onClick={() => {
                captureEvent("example_selected", { example_id: example.id });
                onFileError(null);
                onSelectExample(example);
              }}
              className={cn(
                "rounded-lg border text-left transition-all duration-200",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                compact ? "px-2.5 py-1.5" : "px-3 py-2",
                active
                  ? "border-foreground/25 bg-foreground/[0.06] shadow-sm"
                  : "border-border/80 bg-background/40"
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles
                  className={cn(
                    "h-3 w-3 shrink-0",
                    active ? "text-emerald-400" : "text-muted-foreground"
                  )}
                />
                {example.label}
              </span>
              {!compact && (
                <span className="mt-0.5 block pl-[18px] text-[10px] leading-snug text-muted-foreground">
                  {example.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedExample && (
        <div
          className={cn(
            "rounded-lg border border-emerald-500/25 bg-emerald-500/8 text-xs leading-relaxed",
            compact ? "px-2.5 py-1.5" : "px-3 py-2"
          )}
        >
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            This example should reveal…
          </p>
          <p className="mt-0.5 text-muted-foreground">{selectedExample.reveals}</p>
          {!compact && (
            <p className="mt-1.5 font-mono text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
              Click Analyze to generate the report
            </p>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <Label htmlFor="component-source" className="sr-only">
          Component source code
        </Label>
        <Textarea
          id="component-source"
          value={code}
          onChange={(e) => {
            onFileError(null);
            onChange(e.target.value);
          }}
          spellCheck={false}
          placeholder={`// Paste a React / shadcn component, or drop a local .tsx file…\nexport function Example() {\n  return <Button>Click</Button>\n}`}
          className={cn(
            "ph-no-capture flex-1 resize-y font-mono text-xs leading-relaxed",
            compact
              ? "min-h-[160px] lg:min-h-[min(28vh,260px)]"
              : "min-h-[220px] lg:min-h-[min(42vh,380px)]"
          )}
        />
      </div>

      <Button
        size={compact ? "default" : "lg"}
        className="w-full gap-2"
        onClick={() => {
          if (!code.trim()) {
            onFileError({
              code: "empty",
              message:
                "Source is empty. Open a local file, paste a component, or load an example.",
            });
            return;
          }
          captureEvent("analysis_started", {
            source_kind: sourceKindForAnalytics(sourceOrigin),
            example_id: selectedExample?.id ?? null,
          });
          onAnalyze();
        }}
        disabled={isAnalyzing || isReadingFile || !code.trim()}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze
          </>
        )}
      </Button>
    </div>
  );
}
