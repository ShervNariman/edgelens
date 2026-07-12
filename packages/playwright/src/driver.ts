export type BoundingBox = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
}>;

export type ReducedMotionPreference = "reduce" | "no-preference";

/**
 * Minimal page driver used by scenarios. Playwright or mocks can implement this.
 */
export type MotionPageDriver = {
  readonly id: string;
  goto(url: string): Promise<void>;
  setViewport(size: Readonly<{ width: number; height: number }>): Promise<void>;
  setReducedMotion(value: ReducedMotionPreference): Promise<void>;
  click(selector: string): Promise<void>;
  focus(selector: string): Promise<void>;
  press(key: string): Promise<void>;
  pointerDown(selector: string): Promise<void>;
  pointerMove(x: number, y: number): Promise<void>;
  pointerUp(): Promise<void>;
  boundingBox(selector: string): Promise<BoundingBox | null>;
  exists(selector: string): Promise<boolean>;
  textContent(selector: string): Promise<string | null>;
  evaluate<T>(fn: string): Promise<T>;
  setVisibilityState(state: "visible" | "hidden"): Promise<void>;
  screenshot(path: string): Promise<number>;
  close(): Promise<void>;
  isClosed(): boolean;
};

export type DriverFactory = (
  options: Readonly<{
    signal: AbortSignal;
    headless: boolean;
  }>,
) => Promise<MotionPageDriver>;
