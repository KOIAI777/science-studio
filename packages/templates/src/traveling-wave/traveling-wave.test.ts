import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  createTravelingWaveProfile,
  displacementAt,
  inspectTravelingWave,
  sampleTravelingWave,
  solveTravelingWave,
  travelingWaveDefaults,
  travelingWaveParametersSchema,
  travelingWaveTemplate,
  type TravelingWaveParameters,
} from "./index";

describe("traveling-wave solver", () => {
  it("publishes the paid classroom template contract", () => {
    expect(travelingWaveTemplate).toMatchObject({
      id: "waves.traveling-wave",
      version: "0.1.0",
      catalog: {
        slug: "waves",
        gradeLevel: "middle",
        subject: "waves",
        lessonMinutes: 12,
      },
    });
    expect(travelingWaveTemplate.narration.map((step) => step.id)).toEqual([
      "medium-motion",
      "amplitude",
      "frequency-period",
      "wavelength",
      "wave-equation",
      "compare",
    ]);
    expect(travelingWaveTemplate.narration.reduce(
      (sum, step) => sum + step.durationSeconds,
      0,
    )).toBe(12);
  });

  it("derives period, wavelength, angular frequency, and wave number", () => {
    const state = solveTravelingWave({
      ...travelingWaveDefaults,
      frequencyHz: 2,
      waveSpeedMs: 6,
    });

    expect(state.periodSeconds).toBeCloseTo(0.5, 12);
    expect(state.wavelengthM).toBeCloseTo(3, 12);
    expect(state.angularFrequencyRadS).toBeCloseTo(4 * Math.PI, 12);
    expect(state.waveNumberRadM).toBeCloseTo((2 * Math.PI) / 3, 12);
    expect(state.parameters.waveSpeedMs).toBeCloseTo(
      state.parameters.frequencyHz * state.wavelengthM,
      12,
    );
  });

  it("holds wave speed and amplitude constant in comparison mode", () => {
    const state = solveTravelingWave({
      ...travelingWaveDefaults,
      amplitudeM: 0.8,
      frequencyHz: 1,
      comparisonFrequencyHz: 2,
      waveSpeedMs: 4,
    });

    expect(state.wavelengthM).toBe(4);
    expect(state.comparisonWavelengthM).toBe(2);
    expect(state.comparisonPeriodSeconds).toBe(0.5);
    expect(state.parameters.amplitudeM).toBe(0.8);
    expect(state.parameters.waveSpeedMs).toBe(4);
  });

  it("moves to the right and repeats after one period", () => {
    const profile = createTravelingWaveProfile(travelingWaveDefaults);
    const x = 1.25;
    const initial = displacementAt(profile, x, 0);
    const repeated = displacementAt(profile, x, profile.periodSeconds);
    const translated = displacementAt(
      profile,
      x + profile.wavelengthM / 4,
      profile.periodSeconds / 4,
    );

    expect(repeated).toBeCloseTo(initial, 12);
    expect(translated).toBeCloseTo(initial, 12);
  });

  it("keeps particles at fixed horizontal coordinates", () => {
    const profile = createTravelingWaveProfile(travelingWaveDefaults);
    const first = displacementAt(profile, 3, 0);
    const later = displacementAt(profile, 3, 0.25);

    expect(first).not.toBeCloseTo(later, 6);
    expect(Math.abs(first)).toBeLessThanOrEqual(profile.parameters.amplitudeM);
    expect(Math.abs(later)).toBeLessThanOrEqual(profile.parameters.amplitudeM);
  });

  it("is deterministic for equivalent frame samples", () => {
    const profile = createTravelingWaveProfile(travelingWaveDefaults);
    const thirtyFps = sampleTravelingWave(profile, frameSample(45, 30).timeSeconds);
    const sixtyFps = solveTravelingWave(
      travelingWaveDefaults,
      frameSample(90, 60).timeSeconds,
    );

    expect(sixtyFps).toEqual(thirtyFps);
  });

  it("accepts numeric boundaries and produces finite values", () => {
    const boundaryCases: TravelingWaveParameters[] = [
      {...travelingWaveDefaults, amplitudeM: 0.1, frequencyHz: 0.5, waveSpeedMs: 2, comparisonFrequencyHz: 2.5},
      {...travelingWaveDefaults, amplitudeM: 1.2, frequencyHz: 2.5, waveSpeedMs: 8, comparisonFrequencyHz: 0.5},
    ];

    for (const parameters of boundaryCases) {
      expect(travelingWaveParametersSchema.safeParse(parameters).success).toBe(true);
      const state = solveTravelingWave(parameters, 4);
      for (const value of [
        state.periodSeconds,
        state.wavelengthM,
        state.angularFrequencyRadS,
        state.waveNumberRadM,
        state.comparisonPeriodSeconds,
        state.comparisonWavelengthM,
        state.sourceDisplacementM,
      ]) expect(Number.isFinite(value)).toBe(true);
    }
  });

  it("rejects invalid parameters, time, and position", () => {
    const invalidCases = [
      {...travelingWaveDefaults, amplitudeM: 0},
      {...travelingWaveDefaults, frequencyHz: 3},
      {...travelingWaveDefaults, waveSpeedMs: 1},
      {...travelingWaveDefaults, comparisonFrequencyHz: Number.NaN},
      {...travelingWaveDefaults, comparisonMode: "yes"},
      {...travelingWaveDefaults, showParticles: 1},
    ];

    for (const parameters of invalidCases) {
      expect(travelingWaveParametersSchema.safeParse(parameters).success).toBe(false);
    }
    expect(() => solveTravelingWave(travelingWaveDefaults, -1)).toThrow(RangeError);
    const profile = createTravelingWaveProfile(travelingWaveDefaults);
    expect(() => displacementAt(profile, Number.NaN, 0)).toThrow(RangeError);
  });

  it("reports long, matching, invalid, and assumption issues", () => {
    expect(inspectTravelingWave(travelingWaveDefaults).map((issue) => issue.id)).toContain("traveling-wave-assumptions");
    expect(inspectTravelingWave({
      ...travelingWaveDefaults,
      frequencyHz: 0.5,
      waveSpeedMs: 8,
    }).map((issue) => issue.id)).toContain("long-wavelength");
    expect(inspectTravelingWave({
      ...travelingWaveDefaults,
      frequencyHz: 1.5,
      comparisonFrequencyHz: 1.5,
    }).map((issue) => issue.id)).toContain("matching-comparison");
    expect(inspectTravelingWave({
      ...travelingWaveDefaults,
      amplitudeM: 4,
    }).every((issue) => issue.severity === "blocking")).toBe(true);
  });
});
