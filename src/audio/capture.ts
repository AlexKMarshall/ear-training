import { ANALYSER_FFT_SIZE, MAX_RECORD_MS, SILENCE_AUTO_STOP_MS } from "../config.ts"
import { detectPitchFromAnalyser } from "../pitch/detect.ts"
import { correctHarmonicPitch } from "../pitch/harmonics.ts"
import { ensureAudioReady } from "./context.ts"

export interface RecordingSession {
  stop: () => void
}

export interface RecordingCallbacks {
  /** Reference pitch (Hz); used to fold spurious harmonic detections. */
  targetHz?: number
  onPitch?: (frequencyHz: number, clarity: number) => void
  onComplete: (samplesHz: number[]) => void
  onError: (message: string) => void
}

let mediaStream: MediaStream | null = null
let sourceNode: MediaStreamAudioSourceNode | null = null
let analyserNode: AnalyserNode | null = null
let animationFrameId: number | null = null

async function ensureMicStream(): Promise<MediaStream> {
  if (mediaStream?.active) {
    return mediaStream
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error(
      "Microphone access is not available. Use HTTPS or localhost in a supported browser.",
    )
  }

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true })
    return mediaStream
  } catch (err) {
    if (err instanceof DOMException) {
      if (err.name === "NotAllowedError") {
        throw new Error(
          "Microphone permission denied. Allow microphone access in your browser settings and try again.",
        )
      }
      if (err.name === "NotFoundError") {
        throw new Error("No microphone found. Connect a mic and try again.")
      }
    }
    throw new Error("Could not access the microphone. Please try again.")
  }
}

function teardownGraph(): void {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
  sourceNode?.disconnect()
  sourceNode = null
  analyserNode = null
}

export function stopMediaStream(): void {
  teardownGraph()
  if (mediaStream) {
    for (const track of mediaStream.getTracks()) {
      track.stop()
    }
    mediaStream = null
  }
}

export async function startRecording(callbacks: RecordingCallbacks): Promise<RecordingSession> {
  const ctx = await ensureAudioReady()
  const stream = await ensureMicStream()

  sourceNode = ctx.createMediaStreamSource(stream)
  const lowpass = ctx.createBiquadFilter()
  lowpass.type = "lowpass"
  lowpass.frequency.value = 500
  lowpass.Q.value = 0.7

  analyserNode = ctx.createAnalyser()
  analyserNode.fftSize = ANALYSER_FFT_SIZE
  analyserNode.smoothingTimeConstant = 0.3
  sourceNode.connect(lowpass)
  lowpass.connect(analyserNode)

  const samplesHz: number[] = []
  const startedAt = performance.now()
  let stopped = false
  let lastPitchAt: number | null = null
  let hasDetectedPitch = false

  const tick = (): void => {
    if (stopped || !analyserNode) return

    const now = performance.now()
    const elapsed = now - startedAt
    if (elapsed >= MAX_RECORD_MS) {
      finish()
      return
    }

    const sample = detectPitchFromAnalyser(analyserNode, ctx.sampleRate)
    if (sample) {
      hasDetectedPitch = true
      lastPitchAt = now
      const hz = callbacks.targetHz
        ? correctHarmonicPitch(sample.frequencyHz, callbacks.targetHz)
        : sample.frequencyHz
      samplesHz.push(hz)
      callbacks.onPitch?.(hz, sample.clarity)
    } else if (
      hasDetectedPitch &&
      lastPitchAt !== null &&
      now - lastPitchAt >= SILENCE_AUTO_STOP_MS
    ) {
      finish()
      return
    }

    animationFrameId = requestAnimationFrame(tick)
  }

  const finish = (): void => {
    if (stopped) return
    stopped = true
    teardownGraph()
    callbacks.onComplete(samplesHz)
  }

  animationFrameId = requestAnimationFrame(tick)

  return {
    stop: finish,
  }
}
