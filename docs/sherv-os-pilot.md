# EdgeLens × Sherv OS pilot

EdgeLens keeps deterministic, client-side analysis as the product source of truth. Sherv OS is an optional explanation layer that helps users understand and prioritize the report.

## Privacy boundary

The optional request sends only:

- component type and optional component name
- deterministic score and issue counts
- missing required state names
- normalized rule-authored finding titles, descriptions, and suggestions
- whether preview checks completed and the count of preview violations

It does not send:

- pasted or uploaded source code
- filenames
- code locations or snippets
- raw DOM or accessibility trees
- parser diagnostics
- analytics identifiers

Nothing is sent until the user clicks **Explain findings**.

## Local configuration

The Dockerized Sherv OS API must be healthy at `http://127.0.0.1:3000`.

Add these server-only values to EdgeLens `.env.local`:

```env
SHERV_OS_URL=http://127.0.0.1:3000
SHERV_OS_PROJECT_ID=edgelens
SHERV_OS_PROJECT_KEY=<matching key from Sherv OS projects.json>
```

Never prefix the project key with `NEXT_PUBLIC_`.

Restart the EdgeLens development server after changing environment variables.

## Local acceptance flow

1. Start Dockerized Sherv OS.
2. Start EdgeLens with `npm run dev`.
3. Analyze a built-in example or locally supplied component.
4. Confirm the deterministic report renders first.
5. Click **Explain findings**.
6. Confirm the explanation appears and explicitly says it did not inspect source code.
7. Confirm changing the report clears the previous explanation.
8. Confirm removing Sherv OS configuration produces a clear unavailable message without breaking deterministic analysis.

## Production gate

A Vercel deployment cannot reach a Sherv OS instance bound to the developer machine's localhost. Production activation requires:

- a private HTTPS Sherv OS deployment
- server-side Vercel values for `SHERV_OS_URL`, `SHERV_OS_PROJECT_ID`, and `SHERV_OS_PROJECT_KEY`
- rate limits, logs, credential rotation, and cost controls appropriate for public traffic

Until that gate is met, the deterministic EdgeLens analyzer remains fully functional and the optional explanation route fails closed.
