export const ENGINE_VERSION = "0.1.0";

export interface FrameSample {
  frame: number;
  fps: 30 | 60;
  timeSeconds: number;
}

export function frameSample(frame: number, fps: 30 | 60): FrameSample {
  if (!Number.isInteger(frame) || frame < 0) {
    throw new RangeError("Frame must be a non-negative integer.");
  }

  return {frame, fps, timeSeconds: frame / fps};
}

export function degreesToRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
