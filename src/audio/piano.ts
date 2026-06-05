import { Soundfont } from "smplr"
import { ensureAudioReady } from "./context.ts"

type Piano = ReturnType<typeof Soundfont>

let piano: Piano | null = null

/** Load the gleitz acoustic grand piano from smplr's CDN (first Play tap). */
export async function ensurePianoReady(): Promise<Piano> {
  const ctx = await ensureAudioReady()
  if (!piano) {
    piano = Soundfont(ctx, {
      instrument: "acoustic_grand_piano",
      volume: 127,
      destination: ctx.destination,
    })
  }
  await piano.ready
  return piano
}
