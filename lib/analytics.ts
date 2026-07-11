export type AnalyticsEventName =
  | "demo_interacted"
  | "analysis_started"
  | "analysis_completed"
  | "analysis_failed"
  | "example_selected"
  | "state_forced"
  | "install_copied"
  | "github_clicked"
  | "documentation_opened"
  | "feedback_submitted";

type PostHogBrowserClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

const environment =
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

export function captureEvent(
  event: AnalyticsEventName,
  properties: Record<string, unknown> = {}
): void {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_POSTHOG_ENABLED === "false") return;
  if (!process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) return;
  if (
    window.location.pathname === "/record" ||
    window.location.pathname.startsWith("/record/")
  ) {
    return;
  }

  try {
    const posthog = (window as Window & { posthog?: PostHogBrowserClient }).posthog;
    posthog?.capture(event, {
      product: "edgelens",
      surface: "web",
      environment,
      route: window.location.pathname,
      ...properties,
    });
  } catch {
    // Analytics must never interrupt product behavior.
  }
}
