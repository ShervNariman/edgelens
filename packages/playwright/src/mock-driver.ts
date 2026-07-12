import type { BoundingBox, MotionPageDriver, ReducedMotionPreference } from "./driver.js";

type MockElement = {
  id: string;
  selectorTokens: string[];
  text: string;
  box: BoundingBox;
  pressed: boolean;
};

/**
 * In-memory driver used for deterministic unit/integration tests without launching a browser.
 */
export class MockMotionPageDriver implements MotionPageDriver {
  readonly id: string;
  private closed = false;
  private reducedMotion: ReducedMotionPreference = "no-preference";
  private visibility: "visible" | "hidden" = "visible";
  private viewport = { width: 1280, height: 720 };
  private activations = 0;
  private state = "idle";
  private open = false;
  private pointer: { down: boolean; x: number; y: number } = { down: false, x: 0, y: 0 };
  private focused = "[data-mg-trigger]";
  private elements = new Map<string, MockElement>();
  private readonly screenshots: string[] = [];

  constructor(id = "mock-page") {
    this.id = id;
    this.resetDom();
  }

  private resetDom(): void {
    this.elements.clear();
    this.activations = 0;
    this.state = "closed";
    this.open = false;
    this.addElement({
      id: "target",
      selectorTokens: ["[data-mg-target]", "#target", "button[data-mg-target]"],
      text: "Target",
      box: { x: 24, y: 24, width: 160, height: 96 },
      pressed: false,
    });
    this.addElement({
      id: "trigger",
      selectorTokens: ["[data-mg-trigger]", "#toggle"],
      text: "Toggle",
      box: { x: 24, y: 260, width: 80, height: 32 },
      pressed: false,
    });
    this.addElement({
      id: "secondary",
      selectorTokens: ["[data-mg-secondary]", "#secondary"],
      text: "Secondary",
      box: { x: 200, y: 260, width: 100, height: 32 },
      pressed: false,
    });
    this.addElement({
      id: "remove",
      selectorTokens: ["[data-mg-remove]", "#remove"],
      text: "Remove target",
      box: { x: 320, y: 260, width: 120, height: 32 },
      pressed: false,
    });
    this.addElement({
      id: "replace",
      selectorTokens: ["[data-mg-replace]", "#replace"],
      text: "Replace target",
      box: { x: 460, y: 260, width: 120, height: 32 },
      pressed: false,
    });
    this.addElement({
      id: "status",
      selectorTokens: ["[data-mg-status]", "#status"],
      text: this.state,
      box: { x: 24, y: 310, width: 400, height: 24 },
      pressed: false,
    });
  }

  private addElement(element: MockElement): void {
    for (const token of element.selectorTokens) {
      this.elements.set(token, element);
    }
    this.elements.set(`#${element.id}`, element);
  }

  private requireOpen(): void {
    if (this.closed) {
      throw new Error("Mock page is closed.");
    }
  }

  private get(selector: string): MockElement | undefined {
    return this.elements.get(selector);
  }

  async goto(_url: string): Promise<void> {
    this.requireOpen();
    this.resetDom();
  }

  async setViewport(size: Readonly<{ width: number; height: number }>): Promise<void> {
    this.requireOpen();
    this.viewport = { ...size };
    const target = this.get("[data-mg-target]");
    if (target) {
      target.box = {
        ...target.box,
        x: Math.max(8, Math.round(size.width * 0.05)),
      };
    }
  }

  async setReducedMotion(value: ReducedMotionPreference): Promise<void> {
    this.requireOpen();
    this.reducedMotion = value;
  }

  async click(selector: string): Promise<void> {
    this.requireOpen();
    if (selector === "[data-mg-trigger]" || selector === "#toggle") {
      this.toggle();
      return;
    }
    if (selector === "[data-mg-remove]" || selector === "#remove") {
      this.removeTarget();
      this.state = "removed";
      return;
    }
    if (selector === "[data-mg-replace]" || selector === "#replace") {
      this.replaceTarget();
      this.state = "replaced";
      return;
    }
    if (selector === "[data-mg-secondary]" || selector === "#secondary") {
      this.state = "secondary-activated";
      return;
    }
    if (
      selector === "[data-mg-target]" ||
      selector === "#target" ||
      selector === "#target-replaced"
    ) {
      this.activations += 1;
    }
  }

  async focus(selector: string): Promise<void> {
    this.requireOpen();
    this.focused = selector;
  }

  async press(key: string): Promise<void> {
    this.requireOpen();
    if (key === "Enter" || key === " ") {
      await this.click(this.focused);
    }
  }

  async pointerDown(selector: string): Promise<void> {
    this.requireOpen();
    const box = await this.boundingBox(selector);
    this.pointer = {
      down: true,
      x: (box?.x ?? 0) + (box?.width ?? 0) / 2,
      y: (box?.y ?? 0) + (box?.height ?? 0) / 2,
    };
  }

  async pointerMove(x: number, y: number): Promise<void> {
    this.requireOpen();
    this.pointer = { ...this.pointer, x, y };
  }

  async pointerUp(): Promise<void> {
    this.requireOpen();
    this.pointer = { ...this.pointer, down: false };
  }

  async boundingBox(selector: string): Promise<BoundingBox | null> {
    this.requireOpen();
    return this.get(selector)?.box ?? null;
  }

  async exists(selector: string): Promise<boolean> {
    this.requireOpen();
    return this.elements.has(selector);
  }

  async textContent(selector: string): Promise<string | null> {
    this.requireOpen();
    return this.get(selector)?.text ?? null;
  }

  async evaluate<T>(fn: string): Promise<T> {
    this.requireOpen();
    if (fn.includes("requestAnimationFrame")) {
      // Geometry advances immediately in the mock; treat RAF as ready.
      if (this.open) {
        this.nudgeGeometry();
      }
      return 1 as T;
    }
    if (fn.includes("__mgActivations")) {
      return this.activations as T;
    }
    if (fn.includes("data-mg-status")) {
      return this.state as T;
    }
    return undefined as T;
  }

  async setVisibilityState(state: "visible" | "hidden"): Promise<void> {
    this.requireOpen();
    this.visibility = state;
  }

  async screenshot(path: string): Promise<number> {
    this.requireOpen();
    this.screenshots.push(path);
    return 128;
  }

  async close(): Promise<void> {
    this.closed = true;
    this.elements.clear();
  }

  isClosed(): boolean {
    return this.closed;
  }

  getDebug(): Readonly<{
    reducedMotion: ReducedMotionPreference;
    visibility: "visible" | "hidden";
    viewport: { width: number; height: number };
    activations: number;
    state: string;
    screenshots: readonly string[];
  }> {
    return {
      reducedMotion: this.reducedMotion,
      visibility: this.visibility,
      viewport: this.viewport,
      activations: this.activations,
      state: this.state,
      screenshots: this.screenshots,
    };
  }

  private toggle(): void {
    this.activations += 1;
    if (this.open) {
      this.open = false;
      this.state = "closed";
      this.nudgeGeometry(true);
    } else {
      this.open = true;
      this.state = "open";
      this.nudgeGeometry(false);
    }
  }

  private nudgeGeometry(reset = false): void {
    const target = this.get("[data-mg-target]") ?? this.get("#target-replaced");
    if (!target) {
      return;
    }
    if (reset) {
      target.box = { x: 24, y: 24, width: 160, height: 96 };
      return;
    }
    const reduceFactor = this.reducedMotion === "reduce" ? 0.1 : 1;
    target.box = {
      x: 24 + Math.round(280 * reduceFactor),
      y: 24,
      width: 160 + Math.round(60 * reduceFactor),
      height: 96 + Math.round(32 * reduceFactor),
    };
  }

  private removeTarget(): void {
    for (const key of [...this.elements.keys()]) {
      const element = this.elements.get(key);
      if (element?.id === "target" || element?.id === "target-replaced") {
        this.elements.delete(key);
      }
    }
  }

  private replaceTarget(): void {
    this.removeTarget();
    this.addElement({
      id: "target-replaced",
      selectorTokens: ["#target-replaced", "[data-mg-target]"],
      text: "Replaced",
      box: { x: 120, y: 40, width: 180, height: 110 },
      pressed: false,
    });
  }
}

export function createMockDriverFactory(): import("./driver.js").DriverFactory {
  return async ({ signal }) => {
    const driver = new MockMotionPageDriver();
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
