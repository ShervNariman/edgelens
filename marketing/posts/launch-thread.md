# Final launch thread

## 1/n

AI-generated React/shadcn UI usually nails the happy path.

It often skips the states users actually hit:

- loading / empty / error
- disabled
- focus-visible
- hover / active / selected
- icon button names
- Dialog title/description gaps

## 2/n

I built **EdgeLens** — a local deterministic pre-flight checker for those gaps.

Paste JSX/TSX → Analyze → force states → review States, Static, Preview, and Fixes.

Rule-based. Client-side. No LLM/API.

## 3/n

Demo story: the component looked done on the happy path until EdgeLens forced the states AI forgot.

Capture routes ship with seeded BLOCKED vs READY scenarios so the contrast is obvious.

## 4/n

What it is not:

- not a broad accessibility auditor
- not a WCAG checker
- not a Storybook replacement
- not an axe alternative

A fast pre-flight guardrail before ship.

## 5/n

Try it:

GitHub: `<repo link>`
Demo: `<demo link>`

```bash
npm install
npm run dev
```

Then open `/record/release-room?scenario=blocked` for the launch story.
