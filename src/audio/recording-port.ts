import {
  type RecordingCallbacks,
  type RecordingSession,
  startRecording,
  stopMediaStream,
} from "./capture.ts";

export interface RecordingPort {
  start(callbacks: RecordingCallbacks): Promise<RecordingSession>;
  stopStream(): void;
}

export function createDefaultRecordingPort(): RecordingPort {
  return {
    start: startRecording,
    stopStream: stopMediaStream,
  };
}

export interface TestRecordingPortOptions {
  /** Hz samples passed to onComplete when the session stop() runs. */
  samplesHz: number[];
  /** Optional single onPitch callback when recording starts. */
  emitPitch?: { hz: number; clarity: number };
}

/** Fake mic for browser tests — no getUserMedia. */
export function createTestRecordingPort(options: TestRecordingPortOptions): RecordingPort {
  return {
    async start(callbacks) {
      if (options.emitPitch) {
        callbacks.onPitch?.(options.emitPitch.hz, options.emitPitch.clarity);
      }
      return {
        stop: () => {
          callbacks.onComplete(options.samplesHz);
        },
      };
    },
    stopStream() {},
  };
}
