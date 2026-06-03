# Ear Training

Browser-based ear training for singers. MVP: hear a **random note** (C3–C4), sing it back, get pass/fail feedback using local pitch detection (no server, login, or AI).

## Quick start

```bash
npm install
npm run dev
```

Open the URL shown (localhost). Microphone access requires **HTTPS** in production or **localhost** in development.

```bash
npm run build
npm run preview   # test production build locally
npm test          # unit tests for scoring math
```

## How it works

1. **Play note** — a sampled piano ([smplr](https://github.com/danigb/smplr) Soundfont, CDN-hosted) plays a random note in your voice range.
2. **Start singing** / **Done** — mic capture with [pitchy](https://www.npmjs.com/package/pitchy) autocorrelation.
3. **Result** — median pitch vs target; pass if within **40 cents**.

Tuning constants live in [`src/config.ts`](src/config.ts).

## Deploy

Static hosting (Vercel, Netlify, GitHub Pages). Ensure HTTPS so `getUserMedia` works on mobile.

## Exercises

| Route | Mode |
|-------|------|
| `/single-note/` | Sing one reference note |
| `/chord-middle/` | Sing the middle note of a chord |
| `/interval-melodic-sing/` | Hear two notes in sequence; sing the top note |
| `/interval-harmonic-sing/` | Hear two notes together; sing the top note |
| `/interval-melodic-id/` | Hear a melodic interval; choose the name (degree labels) |
| `/interval-harmonic-id/` | Hear a harmonic interval; choose the name |

## Extension points (post-MVP)

| Module | Extend for full test |
|--------|----------------------|
| [`src/audio/playback.ts`](src/audio/playback.ts) | `playChord([low, mid, high])` — already stubbed; add `playSequence(repeats: 2)` |
| [`src/config.ts`](src/config.ts) | `Question { id, notes: [hz, hz, hz], targetIndex: 1 }` |
| [`src/pitch/score.ts`](src/pitch/score.ts) | Same `scorePitch(detected, question.targetHz)` |
| [`src/ui/sing-test.ts`](src/ui/sing-test.ts) | Loop `questions[]`, summary screen with per-question ✓/✗ |

**3-note cluster:** playback = three piano notes via `playChord`. Scoring stays monophonic — user sings one pitch, compared to the middle note frequency.

**Piano samples:** loaded from smplr's CDN in [`src/audio/piano.ts`](src/audio/piano.ts) on first Play (after user tap unlocks audio).

## Browser notes

- First tap resumes `AudioContext` (iOS Safari).
- Use headphones to reduce bleed from the reference tone into the mic.
- Quiet environment improves pitch clarity.
