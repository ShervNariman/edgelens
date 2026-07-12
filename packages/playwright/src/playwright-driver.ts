import type {
  BoundingBox,
  DriverFactory,
  MotionPageDriver,
  ReducedMotionPreference,
} from "./driver.js";

type PlaywrightModule = {
  chromium: {
    launch: (options: { headless: boolean }) => Promise<PlaywrightBrowser>;
  };
};

type PlaywrightBrowser = {
  newContext: () => Promise<PlaywrightContext>;
  close: () => Promise<void>;
};

type PlaywrightContext = {
  newPage: () => Promise<PlaywrightPage>;
  close: () => Promise<void>;
};

type PlaywrightPage = {
  url: () => string;
  goto: (url: string, options: { waitUntil: "domcontentloaded" }) => Promise<unknown>;
  setViewportSize: (size: { width: number; height: number }) => Promise<void>;
  emulateMedia: (options: { reducedMotion: ReducedMotionPreference }) => Promise<void>;
  locator: (selector: string) => PlaywrightLocator;
  keyboard: { press: (key: string) => Promise<void> };
  mouse: {
    move: (x: number, y: number) => Promise<void>;
    down: () => Promise<void>;
    up: () => Promise<void>;
  };
  evaluate: <T>(fn: string | ((arg: never) => unknown), arg?: unknown) => Promise<T>;
  screenshot: (options: { path: string; type: "png" }) => Promise<Uint8Array>;
  close: () => Promise<void>;
  isClosed: () => boolean;
};

type PlaywrightLocator = {
  click: (options: { timeout: number }) => Promise<void>;
  focus: (options: { timeout: number }) => Promise<void>;
  boundingBox: () => Promise<BoundingBox | null>;
  count: () => Promise<number>;
  textContent: (options: { timeout: number }) => Promise<string | null>;
};

async function importPlaywright(): Promise<PlaywrightModule> {
  try {
    // Avoid static module resolution so TypeScript 6 does not load Playwright's incompatible .d.ts.
    const dynamicImport = new Function("specifier", "return import(specifier)") as (
      specifier: string,
    ) => Promise<unknown>;
    return (await dynamicImport("playwright")) as PlaywrightModule;
  } catch {
    throw new Error(
      "Playwright is not installed. Add the playwright package to run live browser scenarios.",
    );
  }
}

class PlaywrightMotionPageDriver implements MotionPageDriver {
  readonly id: string;
  private reducedMotion: ReducedMotionPreference = "no-preference";

  constructor(
    private readonly browser: PlaywrightBrowser,
    private readonly context: PlaywrightContext,
    private readonly page: PlaywrightPage,
  ) {
    this.id = `pw-${String(page.url() || "page")}`;
  }

  async goto(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: "domcontentloaded" });
  }

  async setViewport(size: Readonly<{ width: number; height: number }>): Promise<void> {
    await this.page.setViewportSize({ ...size });
  }

  async setReducedMotion(value: ReducedMotionPreference): Promise<void> {
    this.reducedMotion = value;
    await this.page.emulateMedia({ reducedMotion: value });
  }

  async click(selector: string): Promise<void> {
    await this.page.locator(selector).click({ timeout: 2_000 });
  }

  async focus(selector: string): Promise<void> {
    await this.page.locator(selector).focus({ timeout: 2_000 });
  }

  async press(key: string): Promise<void> {
    await this.page.keyboard.press(key);
  }

  async pointerDown(selector: string): Promise<void> {
    const box = await this.boundingBox(selector);
    if (!box) {
      throw new Error(`Cannot pointerDown missing selector: ${selector}`);
    }
    await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await this.page.mouse.down();
  }

  async pointerMove(x: number, y: number): Promise<void> {
    await this.page.mouse.move(x, y);
  }

  async pointerUp(): Promise<void> {
    await this.page.mouse.up();
  }

  async boundingBox(selector: string): Promise<BoundingBox | null> {
    return this.page.locator(selector).boundingBox();
  }

  async exists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  async textContent(selector: string): Promise<string | null> {
    return this.page.locator(selector).textContent({ timeout: 2_000 });
  }

  async evaluate<T>(fn: string): Promise<T> {
    return this.page.evaluate<T>(fn);
  }

  async setVisibilityState(state: "visible" | "hidden"): Promise<void> {
    await this.page.evaluate((next) => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => next,
      });
      Object.defineProperty(document, "hidden", {
        configurable: true,
        get: () => next === "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    }, state as never);
  }

  async screenshot(filePath: string): Promise<number> {
    const buffer = await this.page.screenshot({ path: filePath, type: "png" });
    return buffer.byteLength;
  }

  async close(): Promise<void> {
    if (!this.page.isClosed()) {
      await this.page.close();
    }
    await this.context.close();
    await this.browser.close();
  }

  isClosed(): boolean {
    return this.page.isClosed();
  }

  getReducedMotion(): ReducedMotionPreference {
    return this.reducedMotion;
  }
}

export function createPlaywrightDriverFactory(): DriverFactory {
  return async ({ headless, signal }) => {
    const playwright = await importPlaywright();
    const browser = await playwright.chromium.launch({ headless });
    const context = await browser.newContext();
    const page = await context.newPage();
    const driver = new PlaywrightMotionPageDriver(browser, context, page);
    const onAbort = () => {
      void driver.close();
    };
    if (signal.aborted) {
      await driver.close();
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
    return driver;
  };
}
