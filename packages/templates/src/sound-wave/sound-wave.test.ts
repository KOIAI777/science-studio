import {describe, expect, it} from "vitest";
import {
  MICROPHONE_A_POSITION_M,
  REFERENCE_SOUND_PRESSURE_PA,
  SOUND_TUBE_LENGTH_M,
  createSoundWaveProfile,
  inspectSoundWave,
  particleDisplacementAt,
  sampleSoundWave,
  solveSoundWave,
  soundMedia,
  soundPressureAt,
  soundWaveDefaults,
  soundWaveParametersSchema,
  soundWaveTemplate,
  type SoundWaveParameters,
} from "./index";

describe("sound-wave solver", () => {
  it("publishes the paid classroom template contract", () => {
    expect(soundWaveTemplate).toMatchObject({
      id: "waves.sound-wave",
      version: "0.1.0",
      catalog: {
        slug: "sound-waves",
        gradeLevel: "middle",
        subject: "waves",
        lessonMinutes: 15,
      },
    });
    expect(soundWaveTemplate.narration.map((step) => step.id)).toEqual([
      "source",
      "longitudinal",
      "level",
      "microphones",
      "medium",
      "equation",
    ]);
    expect(soundWaveTemplate.narration.reduce((sum, step) => sum + step.durationSeconds, 0)).toBe(15);
  });

  it("derives period, wavelength, angular frequency, and wave number", () => {
    const profile = createSoundWaveProfile(soundWaveDefaults);
    expect(profile.periodSeconds).toBeCloseTo(1 / 400, 12);
    expect(profile.wavelengthM).toBeCloseTo(343 / 400, 12);
    expect(profile.angularFrequencyRadS).toBeCloseTo(800 * Math.PI, 12);
    expect(profile.waveNumberRadM).toBeCloseTo((2 * Math.PI) / profile.wavelengthM, 12);
    expect(profile.parameters.frequencyHz * profile.wavelengthM).toBeCloseTo(profile.medium.speedMs, 12);
  });

  it("converts sound pressure level to RMS and peak pressure", () => {
    const quiet = createSoundWaveProfile({...soundWaveDefaults, soundLevelDb: 40});
    const loud = createSoundWaveProfile({...soundWaveDefaults, soundLevelDb: 80});
    expect(quiet.pressureRmsPa).toBeCloseTo(REFERENCE_SOUND_PRESSURE_PA * 100, 12);
    expect(loud.pressureRmsPa / quiet.pressureRmsPa).toBeCloseTo(100, 12);
    expect(loud.pressurePeakPa).toBeCloseTo(Math.SQRT2 * loud.pressureRmsPa, 12);
    expect(loud.intensityWm2 / quiet.intensityWm2).toBeCloseTo(10_000, 8);
  });

  it("uses microphone separation and medium speed for arrival delay", () => {
    const profile = createSoundWaveProfile({...soundWaveDefaults, microphoneSeparationM: 4});
    expect(profile.microphoneAPositionM).toBe(MICROPHONE_A_POSITION_M);
    expect(profile.microphoneBPositionM).toBe(5);
    expect(profile.microphoneDelaySeconds).toBeCloseTo(4 / 343, 12);
    expect(profile.microphoneBArrivalSeconds - profile.microphoneAArrivalSeconds).toBeCloseTo(profile.microphoneDelaySeconds, 12);
    expect(profile.tubeArrivalSeconds).toBeCloseTo(SOUND_TUBE_LENGTH_M / 343, 12);
  });

  it("holds source frequency while medium changes speed and wavelength", () => {
    const air = createSoundWaveProfile({...soundWaveDefaults, medium: "air"});
    const water = createSoundWaveProfile({...soundWaveDefaults, medium: "water"});
    const steel = createSoundWaveProfile({...soundWaveDefaults, medium: "steel"});
    expect(water.medium.speedMs).toBe(soundMedia.water.speedMs);
    expect(steel.medium.speedMs).toBe(soundMedia.steel.speedMs);
    expect(air.parameters.frequencyHz).toBe(water.parameters.frequencyHz);
    expect(water.wavelengthM).toBeGreaterThan(air.wavelengthM);
    expect(steel.wavelengthM).toBeGreaterThan(water.wavelengthM);
    expect(steel.microphoneDelaySeconds).toBeLessThan(water.microphoneDelaySeconds);
  });

  it("keeps particles at fixed equilibrium positions with bounded displacement", () => {
    const profile = createSoundWaveProfile(soundWaveDefaults);
    const position = 0.5;
    const arrival = position / profile.medium.speedMs;
    expect(particleDisplacementAt(profile, position, arrival / 2)).toBe(0);
    for (let index = 0; index < 30; index += 1) {
      const displacement = particleDisplacementAt(profile, position, arrival + index * profile.periodSeconds / 20);
      expect(Math.abs(displacement)).toBeLessThanOrEqual(profile.particleDisplacementAmplitudeM * (1 + 1e-12));
    }
  });

  it("keeps pressure and particle displacement in quadrature for a right-going wave", () => {
    const profile = createSoundWaveProfile(soundWaveDefaults);
    const position = 0.5;
    const time = position / profile.medium.speedMs + profile.periodSeconds;
    expect(particleDisplacementAt(profile, position, time)).toBeCloseTo(0, 10);
    expect(Math.abs(soundPressureAt(profile, position, time))).toBeCloseTo(profile.pressurePeakPa, 10);
  });

  it("activates microphones only after the physical wavefront reaches them", () => {
    const profile = createSoundWaveProfile(soundWaveDefaults);
    const beforeA = sampleSoundWave(profile, profile.microphoneAArrivalSeconds / 2);
    const afterA = sampleSoundWave(profile, profile.microphoneAArrivalSeconds + 1e-8);
    const afterB = sampleSoundWave(profile, profile.microphoneBArrivalSeconds + 1e-8);
    expect(beforeA.microphoneAActive).toBe(false);
    expect(beforeA.microphoneAPressurePa).toBe(0);
    expect(afterA.microphoneAActive).toBe(true);
    expect(afterA.microphoneBActive).toBe(false);
    expect(afterB.microphoneBActive).toBe(true);
  });

  it("is deterministic and accepts parameter boundaries", () => {
    const cases: SoundWaveParameters[] = [
      {...soundWaveDefaults, frequencyHz: 200, soundLevelDb: 40, microphoneSeparationM: 1, medium: "air"},
      {...soundWaveDefaults, frequencyHz: 1000, soundLevelDb: 100, microphoneSeparationM: 6, medium: "steel"},
    ];
    for (const parameters of cases) {
      expect(soundWaveParametersSchema.safeParse(parameters).success).toBe(true);
      expect(solveSoundWave(parameters, 0.01)).toEqual(solveSoundWave(parameters, 0.01));
    }
  });

  it("rejects invalid parameters, positions, and time", () => {
    const invalidCases = [
      {...soundWaveDefaults, frequencyHz: 100},
      {...soundWaveDefaults, soundLevelDb: 110},
      {...soundWaveDefaults, microphoneSeparationM: 7},
      {...soundWaveDefaults, medium: "vacuum"},
      {...soundWaveDefaults, showParticles: "yes"},
    ];
    for (const parameters of invalidCases) expect(soundWaveParametersSchema.safeParse(parameters).success).toBe(false);
    const profile = createSoundWaveProfile(soundWaveDefaults);
    expect(() => soundPressureAt(profile, -1, 0)).toThrow(RangeError);
    expect(() => particleDisplacementAt(profile, 0, -1)).toThrow(RangeError);
  });

  it("reports long wavelength, high level, invalid input, and assumptions", () => {
    expect(inspectSoundWave(soundWaveDefaults).map((issue) => issue.id)).toContain("sound-wave-assumptions");
    expect(inspectSoundWave({...soundWaveDefaults, medium: "steel"}).map((issue) => issue.id)).toContain("wavelength-longer-than-tube");
    expect(inspectSoundWave({...soundWaveDefaults, soundLevelDb: 90}).map((issue) => issue.id)).toContain("high-sound-level");
    expect(inspectSoundWave({...soundWaveDefaults, frequencyHz: Number.NaN}).every((issue) => issue.severity === "blocking")).toBe(true);
  });
});
