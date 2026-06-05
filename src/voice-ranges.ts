import type { NoteRange } from "./notes.ts";

/** Classical voice categories. */
export type VoiceType = "bass" | "tenor" | "alto" | "soprano";

export const VOICE_TYPES: readonly VoiceType[] = ["bass", "tenor", "alto", "soprano"] as const;

export interface VoiceRange extends NoteRange {
  /** e.g. "C3–G4" for display in settings UI. */
  label: string;
}

/**
 * Conservative comfortable ranges for ear training — not full professional
 * spans. A future "challenging" mode can extend each bound by a few semitones.
 */
export const VOICE_RANGES: Record<VoiceType, VoiceRange> = {
  /** G2–C4: low chest register without extreme sub-bass. */
  bass: { lowMidi: 43, highMidi: 60, label: "G2–C4" },
  /** C3–G4: typical tenor tessitura, one octave plus a fifth. */
  tenor: { lowMidi: 48, highMidi: 67, label: "C3–G4" },
  /** A3–D5: middle alto register, avoids alto 2 lows and whistle highs. */
  alto: { lowMidi: 57, highMidi: 74, label: "A3–D5" },
  /** C4–G5: standard soprano zone without top-of-range strain. */
  soprano: { lowMidi: 60, highMidi: 79, label: "C4–G5" },
};

export const VOICE_TYPE_LABELS: Record<VoiceType, string> = {
  bass: "Bass",
  tenor: "Tenor",
  alto: "Alto",
  soprano: "Soprano",
};

export const DEFAULT_VOICE_TYPE: VoiceType = "tenor";

const STORAGE_KEY = "ear-training-voice-type";

/** Used when localStorage is unavailable (e.g. unit tests). */
let memoryVoiceType: VoiceType | null = null;

function isVoiceType(value: string): value is VoiceType {
  return (VOICE_TYPES as readonly string[]).includes(value);
}

export function getVoiceType(): VoiceType {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isVoiceType(stored)) return stored;
  } catch {
    if (memoryVoiceType) return memoryVoiceType;
  }
  return memoryVoiceType ?? DEFAULT_VOICE_TYPE;
}

export function setVoiceType(voice: VoiceType): void {
  memoryVoiceType = voice;
  try {
    localStorage.setItem(STORAGE_KEY, voice);
  } catch {
    /* ignore */
  }
}

/** Clears persisted and in-memory preference (for tests). */
export function resetVoiceTypePreference(): void {
  memoryVoiceType = null;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getNoteRangeForVoice(voice: VoiceType): NoteRange {
  const { label: _label, ...range } = VOICE_RANGES[voice];
  return range;
}

export function getActiveNoteRange(): NoteRange {
  return getNoteRangeForVoice(getVoiceType());
}
