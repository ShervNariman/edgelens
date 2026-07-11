"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

interface PostHogAnalyticsProps {
  product: string;
  surface?: string;
  excludeRoutes?: string[];
}

type PostHogBrowserClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
};

const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const apiHost = (process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com").replace(
  /\/$/,
  ""
);
const enabled =
  Boolean(projectToken) && process.env.NEXT_PUBLIC_POSTHOG_ENABLED !== "false";
const environment =
  process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown";

function getPostHog(): PostHogBrowserClient | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as Window & { posthog?: PostHogBrowserClient }).posthog;
}

function routeIsExcluded(pathname: string, excludeRoutes: string[]): boolean {
  return excludeRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function RouteTracker({
  product,
  surface,
  excludeRoutes,
}: Required<PostHogAnalyticsProps>) {
  const pathname = usePathname();

  useEffect(() => {
    if (!enabled || !pathname || routeIsExcluded(pathname, excludeRoutes)) return;

    const properties = {
      product,
      surface,
      environment,
      route: pathname,
    };

    const capturePage = () => {
      const posthog = getPostHog();
      if (!posthog) return false;

      posthog.capture("$pageview", {
        ...properties,
        $current_url: window.location.href,
      });
      posthog.capture("product_viewed", properties);
      return true;
    };

    if (capturePage()) return;

    const handleReady = () => capturePage();
    window.addEventListener("posthog:ready", handleReady, { once: true });
    const fallback = window.setTimeout(capturePage, 2_000);

    return () => {
      window.removeEventListener("posthog:ready", handleReady);
      window.clearTimeout(fallback);
    };
  }, [excludeRoutes, pathname, product, surface]);

  return null;
}

export function PostHogAnalytics({
  product,
  surface = "web",
  excludeRoutes = [],
}: PostHogAnalyticsProps) {
  if (!enabled || !projectToken) return null;

  const bootstrap = `
    !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister getFeatureFlag isFeatureEnabled onFeatureFlags identify group reset opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing startSessionRecording stopSessionRecording captureException".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
    posthog.init(${JSON.stringify(projectToken)}, {
      api_host: ${JSON.stringify(apiHost)},
      defaults: "2026-05-30",
      autocapture: true,
      capture_pageview: false,
      capture_pageleave: true,
      person_profiles: "identified_only",
      session_recording: {
        maskAllInputs: true,
        maskTextSelector: "[data-ph-sensitive], .ph-sensitive"
      },
      loaded: function() {
        window.dispatchEvent(new Event("posthog:ready"));
      }
    });
  `;

  return (
    <>
      <Script
        id="posthog-bootstrap"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: bootstrap }}
      />
      <RouteTracker
        product={product}
        surface={surface}
        excludeRoutes={excludeRoutes}
      />
    </>
  );
}
