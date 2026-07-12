/** Yield to the browser so Analyze does not visibly freeze the UI. */
export function yieldToMain(timeoutMs = 80): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    const idle = (
      window as Window & {
        requestIdleCallback?: (
          cb: IdleRequestCallback,
          opts?: IdleRequestOptions
        ) => number;
      }
    ).requestIdleCallback;

    if (typeof idle === "function") {
      idle(() => resolve(), { timeout: timeoutMs });
      return;
    }

    window.setTimeout(resolve, 0);
  });
}

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollIntoViewPreferReduced(
  el: HTMLElement | null,
  block: ScrollLogicalPosition = "start"
): void {
  if (!el) return;
  el.scrollIntoView({
    behavior: prefersReducedMotion() ? "auto" : "smooth",
    block,
  });
}
