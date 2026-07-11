# Marketing video

Screen-recording package for the EdgeLens launch demo.

## Folder layout

```
marketing/video/
  README.md          ← this file
  SHOT-LIST.md       ← timed shot list
  NARRATION.md       ← voiceover / captions
  raw/               ← unedited captures (gitignored)
  edited/            ← final cut exports (gitignored binaries; keep notes)
```

## Recording routes

| Purpose | URL |
| --- | --- |
| Index | http://localhost:3000/record |
| BLOCKED | http://localhost:3000/record/release-room?scenario=blocked |
| READY | http://localhost:3000/record/release-room?scenario=ready |
| Demo story | http://localhost:3000/record/release-room?scenario=demo |
| Legacy | http://localhost:3000/record/edgelens |

## Capture setup

1. `npm run dev`
2. Chrome, light theme, bookmarks bar hidden, ~1440×900.
3. Prefer OS screen recorder or OBS; 30–60 fps; no mic unless narrating live.
4. Save raw takes under `raw/` with date prefix, e.g. `2026-07-11-take-01.mp4`.
5. Export final cut to `edited/edgelens-launch-45s.mp4`.

## Privacy

- No secrets, tokens, customer repos, or personal email in frame.
- Recording routes suppress product analytics activation events.
- Use only seeded fixtures from `lib/recording-scenarios.ts`.
