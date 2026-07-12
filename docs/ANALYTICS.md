# EdgeLens analytics

## Activation

The initial activation event is `analysis_completed` on the first deterministic analysis pass. The subsequent axe-core merge reuses the analyzer but does not emit a second activation event.

## Events

| Event | When | Safe properties |
|---|---|---|
| `product_viewed` | A non-recording route is viewed | product, route, environment |
| `example_selected` | A built-in example is selected | example ID |
| `analysis_started` | Analyze is clicked | example ID or `custom`; never source code |
| `analysis_completed` | The first report is produced | score, counts, primary type, parse-error count |

## Privacy

- Pasted component source is never included in event properties.
- Component names, parse errors, selectors, issue text, and rendered report content are never included in analytics.
- Autocapture and session recording are disabled. Only the explicitly typed events above are sent.
- Pageview URLs contain only origin and pathname; query strings and fragments are discarded.
- Recording routes under `/record` emit neither pageviews nor custom activation events.
- Anonymous visitors are not identified; person profiles are created only for explicitly identified users.

## Environment variables

```bash
NEXT_PUBLIC_POSTHOG_ENABLED=true
NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

These are `NEXT_PUBLIC_*` browser values, not secrets. Never put a private key, admin token, or server credential in a `NEXT_PUBLIC_*` variable.

The integration fails closed: without a token, or when `NEXT_PUBLIC_POSTHOG_ENABLED=false`, EdgeLens behaves normally and does not load PostHog.

## Verification

1. Deploy a preview with analytics disabled and verify the analyzer still works.
2. Add the three public analytics variables to the Vercel preview environment.
3. Open a normal route and confirm `$pageview` and `product_viewed` in PostHog Live Events.
4. Select an example and analyze it.
5. Confirm `example_selected`, `analysis_started`, and one `analysis_completed` event.
6. Verify event properties contain no component source, component name, parse error text, selectors, or report content.
7. Add a harmless query parameter and confirm `$current_url` does not contain it.
8. Open `/record/edgelens` and verify it does not generate product activation events.
9. Confirm no session recordings or autocaptured DOM events are created.

## Recommended insight

Create a funnel:

`product_viewed` → `analysis_started` → `analysis_completed`

Break it down by acquisition source and `primary_type`.
