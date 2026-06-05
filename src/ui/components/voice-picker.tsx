import { VOICE_RANGES, VOICE_TYPE_LABELS, VOICE_TYPES, type VoiceType } from "../../voice-ranges.ts"

export function VoicePicker(props: {
  selectedVoice: VoiceType
  rangeHint: string
  disabled: boolean
  onVoiceChange: (voice: VoiceType) => void
}) {
  return (
    <fieldset class="voice-picker" disabled={props.disabled}>
      <legend class="voice-picker-legend">Voice type</legend>
      <div class="voice-options">
        {VOICE_TYPES.map((voice) => (
          <label class="voice-option">
            <input
              type="radio"
              name="voice"
              class="voice-option-input"
              value={voice}
              checked={props.selectedVoice === voice}
              disabled={props.disabled}
              onChange={() => props.onVoiceChange(voice)}
            />
            <span class="voice-option-label">{VOICE_TYPE_LABELS[voice]}</span>
          </label>
        ))}
      </div>
      <p class="voice-range-hint">{props.rangeHint}</p>
    </fieldset>
  )
}

export function voiceRangeHint(voice: VoiceType): string {
  return `Notes drawn from ${VOICE_RANGES[voice].label}`
}
