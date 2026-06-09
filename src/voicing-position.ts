export type VoicingPositionId = "bottom" | "middle" | "top"

export const VOICING_POSITION_IDS: readonly VoicingPositionId[] = [
  "bottom",
  "middle",
  "top",
] as const

export function voicingPositionIndex(id: VoicingPositionId): 0 | 1 | 2 {
  if (id === "bottom") return 0
  if (id === "middle") return 1
  return 2
}

function voicingPositionLabel(id: VoicingPositionId): string {
  switch (id) {
    case "bottom":
      return "bottom"
    case "middle":
      return "middle"
    case "top":
      return "top"
  }
}

export function voicingPositionStatsLabel(id: VoicingPositionId): string {
  const label = voicingPositionLabel(id)
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function exercisePromptForVoicingPosition(id: VoicingPositionId): string {
  return `Sing the ${voicingPositionLabel(id)} note`
}
