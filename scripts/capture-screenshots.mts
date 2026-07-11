/**
 * Playwright screenshot capture for EdgeLens marketing stills (SHE-64).
 *
 * Prerequisites:
 *   npm run dev          # http://localhost:3000
 *   npx playwright install chromium
 *   npm run capture:screenshots
 *
 * Writes PNGs to marketing/screenshots/exported/.
 * Uses seeded fixtures only — no secrets or customer data.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium, type Page } from "playwright";

const BASE = process.env.EDGELENS_BASE_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(
  process.cwd(),
  "marketing/screenshots/exported"
);

const VIEWPORT = { width: 1440, height: 900 } as const;

type Shot = {
  id: string;
  filename: string;
  path: string;
  waitFor?: "analysis" | "hero";
};

const SHOTS: Shot[] = [
  {
    id: "S1",
    filename: "01-hero-landing.png",
    path: "/",
    waitFor: "hero",
  },
  {
    id: "S2",
    filename: "02-analyzer-default.png",
    path: "/analyzer",
    waitFor: "hero",
  },
  {
    id: "S3",
    filename: "03-blocked-overview.png",
    path: "/record/release-room?scenario=blocked",
    waitFor: "analysis",
  },
  {
    id: "S4",
    filename: "04-blocked-forced-loading.png",
    path: "/record/release-room?scenario=blocked",
    waitFor: "analysis",
  },
  {
    id: "S5",
    filename: "05-ready-overview.png",
    path: "/record/release-room?scenario=ready",
    waitFor: "analysis",
  },
  {
    id: "S6",
    filename: "06-states-tab.png",
    path: "/record/release-room?scenario=blocked",
    waitFor: "analysis",
  },
  {
    id: "S7",
    filename: "07-fixes-panel.png",
    path: "/record/release-room?scenario=blocked",
    waitFor: "analysis",
  },
  {
    id: "S8",
    filename: "08-demo-story.png",
    path: "/record/release-room?scenario=demo",
    waitFor: "analysis",
  },
];

async function waitForAnalysis(page: Page): Promise<void> {
  const score = page.locator('[data-capture-badge="score"]');
  try {
    await score.waitFor({ state: "visible", timeout: 8_000 });
  } catch {
    // Auto-analyze may still be pending — click Analyze as a fallback.
    const analyze = page.getByRole("button", { name: /analyze/i });
    if (await analyze.count()) {
      await analyze.first().click();
    }
    await score.waitFor({ state: "visible", timeout: 20_000 });
  }
  // Allow preview / axe merge to settle.
  await page.waitForTimeout(800);
}

async function waitForHero(page: Page): Promise<void> {
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(400);
}

async function openFixesTab(page: Page): Promise<void> {
  const fixes = page.getByRole("tab", { name: /fixes/i });
  if (await fixes.count()) {
    await fixes.first().click();
    await page.waitForTimeout(300);
  }
}

async function openStatesTab(page: Page): Promise<void> {
  const states = page.getByRole("tab", { name: /states|state completeness/i });
  if (await states.count()) {
    await states.first().click();
    await page.waitForTimeout(300);
  }
}

async function forcePreviewState(page: Page, state: string): Promise<void> {
  const btn = page.getByRole("button", { name: new RegExp(`^${state}$`, "i") });
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForTimeout(400);
  }
}

async function runAnalyzer(page: Page): Promise<void> {
  const analyze = page.getByRole("button", { name: /analyze/i });
  if (await analyze.count()) {
    await analyze.first().click();
    await page.waitForTimeout(1200);
  }
}

async function main(): Promise<void> {
  await mkdir(OUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    colorScheme: "light",
  });
  const page = await context.newPage();

  const manifest: { id: string; file: string; url: string }[] = [];

  for (const shot of SHOTS) {
    const url = `${BASE}${shot.path}`;
    console.log(`[capture] ${shot.id} → ${shot.filename}`);
    await page.goto(url, { waitUntil: "networkidle" });

    if (shot.waitFor === "analysis") {
      await waitForAnalysis(page);
    } else {
      await waitForHero(page);
    }

    if (shot.id === "S2") {
      await runAnalyzer(page);
    }
    if (shot.id === "S4") {
      await forcePreviewState(page, "loading");
    }
    if (shot.id === "S6") {
      await openStatesTab(page);
    }
    if (shot.id === "S7") {
      await openFixesTab(page);
    }

    const outPath = path.join(OUT_DIR, shot.filename);
    await page.screenshot({ path: outPath, fullPage: false });
    manifest.push({ id: shot.id, file: shot.filename, url });
  }

  await writeFile(
    path.join(OUT_DIR, "manifest.json"),
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        baseUrl: BASE,
        viewport: VIEWPORT,
        shots: manifest,
        note: "Seeded fixtures only. No secrets or customer data.",
      },
      null,
      2
    )
  );

  await browser.close();
  console.log(`[capture] wrote ${SHOTS.length} stills to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error("[capture] failed:", err);
  process.exitCode = 1;
});
