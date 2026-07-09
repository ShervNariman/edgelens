# EdgeLens

Audit the UI details AI misses — states + accessibility for shadcn & Cursor output.

Rule-based, client-side demo. No LLM. No backend.

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Flow

1. Paste a React/shadcn component (or load a Cursor-style example)
2. Click **Analyze**
3. Review Overview · States · Accessibility · Fixes
4. Force states in the live preview (axe-core runs on the preview DOM)

## Stack

Next.js 15 · TypeScript · Tailwind v4 · shadcn/ui · `@babel/parser` · `axe-core`
