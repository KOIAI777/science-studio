import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const SOUND_WAVE_TEMPLATE_ID = "waves.sound-wave";
export const SOUND_WAVE_TEMPLATE_VERSION = "0.1.0";
export const SOUND_TUBE_LENGTH_M = 8;
export const MICROPHONE_A_POSITION_M = 1;
export const REFERENCE_SOUND_PRESSURE_PA = 20e-6;

export const soundMediumSchema = z.enum(["air", "water", "steel"]);
export type SoundMedium = z.infer<typeof soundMediumSchema>;

export interface SoundMediumDefinition {
  speedMs: number;
  densityKgM3: number;
  reference: string;
}

export const soundMedia: Record<SoundMedium, SoundMediumDefinition> = {
  air: {speedMs: 343, densityKgM3: 1.204, reference: "Air at 20 C"},
  water: {speedMs: 1482, densityKgM3: 998, reference: "Fresh water at 20 C"},
  steel: {speedMs: 5960, densityKgM3: 7850, reference: "Longitudinal wave in steel"},
};

export const soundWaveParametersSchema = z.object({
  frequencyHz: z.number().finite().min(200).max(1000),
  soundLevelDb: z.number().finite().min(40).max(100),
  microphoneSeparationM: z.number().finite().min(1).max(6),
  medium: soundMediumSchema,
  showParticles: z.boolean(),
});

export type SoundWaveParameters = z.infer<typeof soundWaveParametersSchema>;

export interface SoundWaveProfile {
  parameters: SoundWaveParameters;
  medium: SoundMediumDefinition;
  periodSeconds: number;
  wavelengthM: number;
  angularFrequencyRadS: number;
  waveNumberRadM: number;
  pressureRmsPa: number;
  pressurePeakPa: number;
  intensityWm2: number;
  particleDisplacementAmplitudeM: number;
  microphoneAPositionM: number;
  microphoneBPositionM: number;
  microphoneAArrivalSeconds: number;
  microphoneBArrivalSeconds: number;
  microphoneDelaySeconds: number;
  tubeArrivalSeconds: number;
}

export interface SoundWaveState extends SoundWaveProfile {
  timeSeconds: number;
  wavefrontPositionM: number;
  sourceDisplacementM: number;
  microphoneAPressurePa: number;
  microphoneBPressurePa: number;
  microphoneAActive: boolean;
  microphoneBActive: boolean;
}

export const soundWaveDefaults: SoundWaveParameters = {
  frequencyHz: 400,
  soundLevelDb: 80,
  microphoneSeparationM: 4,
  medium: "air",
  showParticles: true,
};

export const soundWaveTemplate: ExperimentTemplateContract = {
  id: SOUND_WAVE_TEMPLATE_ID,
  version: SOUND_WAVE_TEMPLATE_VERSION,
  catalog: {
    slug: "sound-waves",
    title: "Sound: Pitch, Loudness & Speed",
    summary: "Watch a longitudinal sound wave move through matter and measure its arrival at two microphones.",
    gradeLevel: "middle",
    subject: "waves",
    lessonMinutes: 15,
    concepts: ["Sound", "Pitch", "Sound Level", "Propagation Speed"],
  },
  learningObjectives: [
    "Distinguish longitudinal particle vibration from the direction of sound propagation.",
    "Relate source frequency to pitch and sound pressure level to perceived loudness.",
    "Measure sound speed from microphone separation and arrival-time delay.",
    "Apply the wave relationship between sound speed, frequency, and wavelength.",
    "Compare sound propagation in air, water, and steel without changing source frequency.",
  ],
  parameterDefinitions: [
    {key: "frequencyHz", unit: "Hz", min: 200, max: 1000, step: 50, requiredFor: "model"},
    {key: "soundLevelDb", unit: "dB", min: 40, max: 100, step: 5, requiredFor: "model"},
    {key: "microphoneSeparationM", unit: "m", min: 1, max: 6, step: 0.5, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "periodSeconds", unit: "s", digits: 6, visibleIn: ["experiment", "present"]},
    {key: "wavelengthM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "soundSpeedMs", unit: "m/s", digits: 0, visibleIn: ["experiment", "present"]},
    {key: "microphoneDelaySeconds", unit: "s", digits: 6, visibleIn: ["experiment", "present"]},
    {key: "pressureRmsPa", unit: "Pa", digits: 4, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "source", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["speaker", "frequency"]},
    {id: "longitudinal", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["particles", "compression"]},
    {id: "level", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0.006, highlights: ["level", "pressure"]},
    {id: "microphones", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["microphones", "delay"]},
    {id: "medium", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0.012, highlights: ["medium", "speed"]},
    {id: "equation", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0.012, highlights: ["equation", "wavelength"]},
  ],
  assumptions: [
    "The source produces a plane sinusoidal longitudinal wave that starts at t = 0 and travels to the right.",
    "Each medium is uniform, lossless, non-dispersive, and represented by a fixed reference speed and density.",
    "Particles oscillate about fixed equilibrium positions; the visible displacement is greatly magnified.",
    "Boundaries absorb the wave, so reflection, standing waves, attenuation, and diffraction are excluded.",
    "Sound level uses a stated 20 micropa reference for consistent classroom comparison; perceived loudness is not calculated.",
  ],
};

function assertPosition(positionM: number) {
  if (!Number.isFinite(positionM) || positionM < 0 || positionM > SOUND_TUBE_LENGTH_M) {
    throw new RangeError(`Position must be within 0-${SOUND_TUBE_LENGTH_M} m.`);
  }
}

function assertTime(timeSeconds: number) {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }
}

export function createSoundWaveProfile(input: SoundWaveParameters): SoundWaveProfile {
  const parameters = soundWaveParametersSchema.parse(input);
  const medium = soundMedia[parameters.medium];
  const periodSeconds = 1 / parameters.frequencyHz;
  const wavelengthM = medium.speedMs / parameters.frequencyHz;
  const angularFrequencyRadS = 2 * Math.PI * parameters.frequencyHz;
  const waveNumberRadM = (2 * Math.PI) / wavelengthM;
  const pressureRmsPa = REFERENCE_SOUND_PRESSURE_PA * 10 ** (parameters.soundLevelDb / 20);
  const pressurePeakPa = Math.SQRT2 * pressureRmsPa;
  const intensityWm2 = pressureRmsPa ** 2 / (medium.densityKgM3 * medium.speedMs);
  const particleDisplacementAmplitudeM = pressurePeakPa
    / (medium.densityKgM3 * medium.speedMs * angularFrequencyRadS);
  const microphoneBPositionM = MICROPHONE_A_POSITION_M + parameters.microphoneSeparationM;

  return {
    parameters,
    medium,
    periodSeconds,
    wavelengthM,
    angularFrequencyRadS,
    waveNumberRadM,
    pressureRmsPa,
    pressurePeakPa,
    intensityWm2,
    particleDisplacementAmplitudeM,
    microphoneAPositionM: MICROPHONE_A_POSITION_M,
    microphoneBPositionM,
    microphoneAArrivalSeconds: MICROPHONE_A_POSITION_M / medium.speedMs,
    microphoneBArrivalSeconds: microphoneBPositionM / medium.speedMs,
    microphoneDelaySeconds: parameters.microphoneSeparationM / medium.speedMs,
    tubeArrivalSeconds: SOUND_TUBE_LENGTH_M / medium.speedMs,
  };
}

export function soundPressureAt(profile: SoundWaveProfile, positionM: number, timeSeconds: number) {
  assertPosition(positionM);
  assertTime(timeSeconds);
  if (timeSeconds < positionM / profile.medium.speedMs) return 0;
  const phase = profile.angularFrequencyRadS * timeSeconds - profile.waveNumberRadM * positionM;
  return profile.pressurePeakPa * Math.cos(phase);
}

export function particleDisplacementAt(profile: SoundWaveProfile, positionM: number, timeSeconds: number) {
  assertPosition(positionM);
  assertTime(timeSeconds);
  if (timeSeconds < positionM / profile.medium.speedMs) return 0;
  const phase = profile.angularFrequencyRadS * timeSeconds - profile.waveNumberRadM * positionM;
  return profile.particleDisplacementAmplitudeM * Math.sin(phase);
}

export function sampleSoundWave(profile: SoundWaveProfile, timeSeconds: number): SoundWaveState {
  assertTime(timeSeconds);
  const wavefrontPositionM = Math.min(SOUND_TUBE_LENGTH_M, timeSeconds * profile.medium.speedMs);
  return {
    ...profile,
    timeSeconds,
    wavefrontPositionM,
    sourceDisplacementM: particleDisplacementAt(profile, 0, timeSeconds),
    microphoneAPressurePa: soundPressureAt(profile, profile.microphoneAPositionM, timeSeconds),
    microphoneBPressurePa: soundPressureAt(profile, profile.microphoneBPositionM, timeSeconds),
    microphoneAActive: timeSeconds >= profile.microphoneAArrivalSeconds,
    microphoneBActive: timeSeconds >= profile.microphoneBArrivalSeconds,
  };
}

export function solveSoundWave(input: SoundWaveParameters, timeSeconds = 0) {
  return sampleSoundWave(createSoundWaveProfile(input), timeSeconds);
}

export function inspectSoundWave(parameters: SoundWaveParameters): ScienceIssue[] {
  const parsed = soundWaveParametersSchema.safeParse(parameters);
  if (!parsed.success) {
    return parsed.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createSoundWaveProfile(parsed.data);
  const issues: ScienceIssue[] = [];
  if (profile.wavelengthM > SOUND_TUBE_LENGTH_M) {
    issues.push({
      id: "wavelength-longer-than-tube",
      severity: "warning",
      title: "Wavelength exceeds the visible tube",
      detail: "The calculation remains valid, but the 8 m display cannot show one complete wavelength.",
      path: "medium",
    });
  }
  if (parsed.data.soundLevelDb >= 85) {
    issues.push({
      id: "high-sound-level",
      severity: "warning",
      title: "High sound level",
      detail: "The simulation is silent, but sustained real-world exposure at this level can require hearing protection.",
      path: "soundLevelDb",
    });
  }
  issues.push({
    id: "sound-wave-assumptions",
    severity: "assumption",
    title: "Ideal longitudinal-wave model",
    detail: "Reference media are uniform and lossless; particle motion is magnified and no reflection, attenuation, or diffraction is modeled.",
  });
  return issues;
}
