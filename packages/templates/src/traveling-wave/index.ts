import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const TRAVELING_WAVE_TEMPLATE_ID = "waves.traveling-wave";
export const TRAVELING_WAVE_TEMPLATE_VERSION = "0.1.0";
export const WAVE_MEDIUM_LENGTH_M = 12;

export const travelingWaveParametersSchema = z.object({
  amplitudeM: z.number().finite().min(0.1).max(1.2),
  frequencyHz: z.number().finite().min(0.5).max(2.5),
  waveSpeedMs: z.number().finite().min(2).max(8),
  comparisonFrequencyHz: z.number().finite().min(0.5).max(2.5),
  comparisonMode: z.boolean(),
  showParticles: z.boolean(),
});

export type TravelingWaveParameters = z.infer<
  typeof travelingWaveParametersSchema
>;

export interface TravelingWaveProfile {
  parameters: TravelingWaveParameters;
  periodSeconds: number;
  wavelengthM: number;
  angularFrequencyRadS: number;
  waveNumberRadM: number;
  comparisonPeriodSeconds: number;
  comparisonWavelengthM: number;
  comparisonAngularFrequencyRadS: number;
  comparisonWaveNumberRadM: number;
}

export interface TravelingWaveState extends TravelingWaveProfile {
  timeSeconds: number;
  sourceDisplacementM: number;
  comparisonSourceDisplacementM: number;
  propagationDistanceM: number;
}

export const travelingWaveDefaults: TravelingWaveParameters = {
  amplitudeM: 0.7,
  frequencyHz: 1,
  waveSpeedMs: 4,
  comparisonFrequencyHz: 2,
  comparisonMode: true,
  showParticles: true,
};

export const travelingWaveTemplate: ExperimentTemplateContract = {
  id: TRAVELING_WAVE_TEMPLATE_ID,
  version: TRAVELING_WAVE_TEMPLATE_VERSION,
  catalog: {
    slug: "waves",
    title: "Waves: Frequency, Wavelength & Speed",
    summary: "Measure a traveling wave and compare how frequency changes wavelength at a fixed speed.",
    gradeLevel: "middle",
    subject: "waves",
    lessonMinutes: 12,
    concepts: ["Amplitude", "Frequency", "Wavelength", "Wave Speed"],
  },
  learningObjectives: [
    "Distinguish transverse particle motion from the direction of wave propagation.",
    "Measure amplitude, period, frequency, and wavelength on a traveling wave.",
    "Apply the relationship between wave speed, frequency, and wavelength.",
    "Compare two waves in the same medium while holding propagation speed constant.",
  ],
  parameterDefinitions: [
    {key: "amplitudeM", unit: "m", min: 0.1, max: 1.2, step: 0.1, requiredFor: "model"},
    {key: "frequencyHz", unit: "Hz", min: 0.5, max: 2.5, step: 0.1, requiredFor: "model"},
    {key: "waveSpeedMs", unit: "m/s", min: 2, max: 8, step: 0.5, requiredFor: "model"},
    {key: "comparisonFrequencyHz", unit: "Hz", min: 0.5, max: 2.5, step: 0.1, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "periodSeconds", unit: "s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "wavelengthM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "waveSpeedMs", unit: "m/s", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "comparisonPeriodSeconds", unit: "s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "comparisonWavelengthM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "medium-motion", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["particles", "direction"]},
    {id: "amplitude", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0.25, highlights: ["amplitude"]},
    {id: "frequency-period", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["source", "period"]},
    {id: "wavelength", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["wavelength"]},
    {id: "wave-equation", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["equation"]},
    {id: "compare", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["comparison"]},
  ],
  assumptions: [
    "The display represents an ideal sinusoidal transverse wave traveling to the right in a uniform medium.",
    "Amplitude and wave speed are constant; reflection, damping, dispersion, and external boundaries are excluded.",
    "Medium markers oscillate vertically around fixed horizontal positions and do not travel with the wave.",
    "The comparison holds amplitude and wave speed constant so frequency is the only changed wave property.",
  ],
};

function waveValues(frequencyHz: number, waveSpeedMs: number) {
  const periodSeconds = 1 / frequencyHz;
  const wavelengthM = waveSpeedMs / frequencyHz;
  return {
    periodSeconds,
    wavelengthM,
    angularFrequencyRadS: 2 * Math.PI * frequencyHz,
    waveNumberRadM: (2 * Math.PI) / wavelengthM,
  };
}

export function createTravelingWaveProfile(
  input: TravelingWaveParameters,
): TravelingWaveProfile {
  const parameters = travelingWaveParametersSchema.parse(input);
  const primary = waveValues(parameters.frequencyHz, parameters.waveSpeedMs);
  const comparison = waveValues(
    parameters.comparisonFrequencyHz,
    parameters.waveSpeedMs,
  );

  return {
    parameters,
    ...primary,
    comparisonPeriodSeconds: comparison.periodSeconds,
    comparisonWavelengthM: comparison.wavelengthM,
    comparisonAngularFrequencyRadS: comparison.angularFrequencyRadS,
    comparisonWaveNumberRadM: comparison.waveNumberRadM,
  };
}

export function displacementAt(
  profile: TravelingWaveProfile,
  positionM: number,
  timeSeconds: number,
  wave: "primary" | "comparison" = "primary",
) {
  if (!Number.isFinite(positionM)) {
    throw new RangeError("Position must be finite.");
  }
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const angularFrequency = wave === "primary"
    ? profile.angularFrequencyRadS
    : profile.comparisonAngularFrequencyRadS;
  const waveNumber = wave === "primary"
    ? profile.waveNumberRadM
    : profile.comparisonWaveNumberRadM;

  return profile.parameters.amplitudeM * Math.sin(
    waveNumber * positionM - angularFrequency * timeSeconds,
  );
}

export function sampleTravelingWave(
  profile: TravelingWaveProfile,
  timeSeconds: number,
): TravelingWaveState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  return {
    ...profile,
    timeSeconds,
    sourceDisplacementM: displacementAt(profile, 0, timeSeconds),
    comparisonSourceDisplacementM: displacementAt(
      profile,
      0,
      timeSeconds,
      "comparison",
    ),
    propagationDistanceM: timeSeconds * profile.parameters.waveSpeedMs,
  };
}

export function solveTravelingWave(
  input: TravelingWaveParameters,
  timeSeconds = 0,
) {
  return sampleTravelingWave(createTravelingWaveProfile(input), timeSeconds);
}

export function inspectTravelingWave(
  parameters: TravelingWaveParameters,
): ScienceIssue[] {
  const result = travelingWaveParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createTravelingWaveProfile(result.data);
  const issues: ScienceIssue[] = [];

  if (profile.wavelengthM > WAVE_MEDIUM_LENGTH_M) {
    issues.push({
      id: "long-wavelength",
      severity: "warning",
      title: "Wavelength exceeds the visible medium",
      detail: "The calculation remains valid, but less than one complete wavelength fits on the 12 m display.",
      path: "frequencyHz",
    });
  }

  if (
    result.data.comparisonMode
    && Math.abs(result.data.frequencyHz - result.data.comparisonFrequencyHz) < 0.05
  ) {
    issues.push({
      id: "matching-comparison",
      severity: "warning",
      title: "The comparison waves match",
      detail: "Choose a different frequency for Wave B to reveal how frequency changes wavelength at fixed wave speed.",
      path: "comparisonFrequencyHz",
    });
  }

  issues.push({
    id: "traveling-wave-assumptions",
    severity: "assumption",
    title: "Ideal transverse-wave model",
    detail: "The medium is uniform and lossless; reflection, damping, dispersion, and sound-wave behavior are not included.",
  });

  return issues;
}
