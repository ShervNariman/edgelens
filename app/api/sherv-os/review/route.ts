import { NextResponse } from "next/server";
import {
  requestShervOSReview,
  ShervOSNotConfiguredError,
  ShervOSRequestError,
  type ShervOSReviewSummary,
} from "@/lib/sherv-os-review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FINDINGS = 12;
const MAX_TEXT_LENGTH = 1_200;
const ALLOWED_SEVERITIES = new Set(["critical", "warning", "info"]);
const ALLOWED_CATEGORIES = new Set([
  "missing-state",
  "accessibility",
  "pattern",
  "interaction",
]);
const ALLOWED_SOURCES = new Set([
  "static",
  "preview",
  "state-rule",
  "a11y-rule",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function boundedString(value: unknown, max = MAX_TEXT_LENGTH): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < minimum || value > maximum) return null;
  return value;
}

function parseSummary(value: unknown): ShervOSReviewSummary | null {
  if (!isRecord(value)) return null;

  const primaryType = boundedString(value.primaryType, 80);
  const score = boundedNumber(value.score, 0, 100);
  const totalIssues = boundedNumber(value.totalIssues, 0, 10_000);
  const criticalCount = boundedNumber(value.criticalCount, 0, 10_000);
  const warningCount = boundedNumber(value.warningCount, 0, 10_000);
  const infoCount = boundedNumber(value.infoCount, 0, 10_000);
  const statesCovered = boundedNumber(value.statesCovered, 0, 100);
  const statesTotal = boundedNumber(value.statesTotal, 0, 100);
  const previewViolationCount = boundedNumber(
    value.previewViolationCount,
    0,
    10_000,
  );

  if (
    !primaryType ||
    score === null ||
    totalIssues === null ||
    criticalCount === null ||
    warningCount === null ||
    infoCount === null ||
    statesCovered === null ||
    statesTotal === null ||
    previewViolationCount === null ||
    typeof value.previewDomChecked !== "boolean"
  ) {
    return null;
  }

  const componentName =
    value.componentName === null
      ? null
      : boundedString(value.componentName, 120);
  if (value.componentName !== null && componentName === null) return null;

  if (!Array.isArray(value.missingRequiredStates)) return null;
  const missingRequiredStates = value.missingRequiredStates
    .slice(0, 20)
    .map((state) => boundedString(state, 40))
    .filter((state): state is string => Boolean(state));

  if (!Array.isArray(value.findings) || value.findings.length > MAX_FINDINGS) {
    return null;
  }

  const findings: ShervOSReviewSummary["findings"] = [];
  for (const finding of value.findings) {
    if (!isRecord(finding)) return null;

    const title = boundedString(finding.title);
    const description = boundedString(finding.description);
    const suggestion = boundedString(finding.suggestion);
    const severity = boundedString(finding.severity, 40);
    const category = boundedString(finding.category, 40);
    const source = boundedString(finding.source, 40);

    if (
      !title ||
      !description ||
      !suggestion ||
      !severity ||
      !category ||
      !source ||
      !ALLOWED_SEVERITIES.has(severity) ||
      !ALLOWED_CATEGORIES.has(category) ||
      !ALLOWED_SOURCES.has(source)
    ) {
      return null;
    }

    findings.push({
      title,
      description,
      suggestion,
      severity,
      category,
      source,
    });
  }

  return {
    componentName,
    primaryType,
    score,
    totalIssues,
    criticalCount,
    warningCount,
    infoCount,
    statesCovered,
    statesTotal,
    missingRequiredStates,
    findings,
    previewDomChecked: value.previewDomChecked,
    previewViolationCount,
  };
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request." },
      { status: 400 },
    );
  }

  if (!isRecord(body)) {
    return NextResponse.json(
      { error: "Invalid review request." },
      { status: 400 },
    );
  }

  const summary = parseSummary(body.report);
  if (!summary) {
    return NextResponse.json(
      { error: "Invalid or oversized review summary." },
      { status: 400 },
    );
  }

  try {
    const result = await requestShervOSReview(summary);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof ShervOSNotConfiguredError) {
      return NextResponse.json(
        { error: "Optional AI explanation is not configured." },
        { status: 503 },
      );
    }

    const message =
      error instanceof ShervOSRequestError
        ? error.message
        : "Optional AI explanation is temporarily unavailable.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
