import {describe, expect, it} from "vitest";
import {
  COIL_RADIUS_M,
  EARTH_REFERENCE_FIELD_T,
  ELECTROMAGNET_DURATION_SECONDS,
  IRON_EFFECTIVE_RELATIVE_PERMEABILITY,
  VACUUM_PERMEABILITY_HM,
  createElectromagnetProfile,
  electromagnetDefaults,
  electromagnetParametersSchema,
  electromagnetTemplate,
  finiteSolenoidFieldT,
  inspectElectromagnet,
  sampleElectromagnet,
  solveElectromagnet,
  type ElectromagnetParameters,
} from "./index";

describe("electromagnet solver", () => {
  it("publishes the paid classroom template contract", () => {
    expect(electromagnetTemplate).toMatchObject({
      id: "electricity.electromagnet",
      version: "0.1.0",
      catalog: {
        slug: "electromagnets",
        gradeLevel: "middle",
        subject: "electricity",
        lessonMinutes: 15,
      },
    });
    expect(electromagnetTemplate.narration.map((step) => step.id)).toEqual([
      "circuit",
      "coil",
      "field",
      "polarity",
      "core",
      "probe",
    ]);
    expect(electromagnetTemplate.narration.reduce((sum, step) => sum + step.durationSeconds, 0)).toBe(15);
    expect(ELECTROMAGNET_DURATION_SECONDS).toBe(12);
  });

  it("derives turn density and ampere-turns", () => {
    const profile = createElectromagnetProfile(electromagnetDefaults);
    expect(profile.turnDensityPerM).toBeCloseTo(120 / 0.24, 12);
    expect(profile.ampereTurns).toBeCloseTo(120 * 1.5, 12);
    expect(profile.relativePermeability).toBe(1);
  });

  it("uses the finite-solenoid on-axis field at the center", () => {
    const profile = createElectromagnetProfile(electromagnetDefaults);
    const halfLength = electromagnetDefaults.coilLengthM / 2;
    const geometry = electromagnetDefaults.coilLengthM
      / Math.sqrt(COIL_RADIUS_M ** 2 + halfLength ** 2);
    const expected = VACUUM_PERMEABILITY_HM
      * (electromagnetDefaults.turns / electromagnetDefaults.coilLengthM)
      * electromagnetDefaults.currentA
      * geometry
      / 2;
    expect(profile.centerFieldT).toBeCloseTo(expected, 12);
    expect(profile.centerFieldT).toBe(finiteSolenoidFieldT(electromagnetDefaults, 0));
  });

  it("scales exactly with current, turns, and the linear iron-core factor", () => {
    const baseline = createElectromagnetProfile(electromagnetDefaults);
    const doubleCurrent = createElectromagnetProfile({...electromagnetDefaults, currentA: 3});
    const doubleTurns = createElectromagnetProfile({...electromagnetDefaults, turns: 240});
    const iron = createElectromagnetProfile({...electromagnetDefaults, core: "iron"});
    expect(doubleCurrent.centerFieldT / baseline.centerFieldT).toBeCloseTo(2, 12);
    expect(doubleTurns.centerFieldT / baseline.centerFieldT).toBeCloseTo(2, 12);
    expect(iron.centerFieldT / baseline.centerFieldT).toBeCloseTo(IRON_EFFECTIVE_RELATIVE_PERMEABILITY, 10);
  });

  it("produces a weaker on-axis field as the external probe moves away", () => {
    const near = createElectromagnetProfile({...electromagnetDefaults, probeDistanceM: 0.06});
    const far = createElectromagnetProfile({...electromagnetDefaults, probeDistanceM: 0.35});
    expect(near.probeFieldT).toBeGreaterThan(far.probeFieldT);
    expect(near.centerFieldT).toBeCloseTo(far.centerFieldT, 12);
  });

  it("reverses poles and compass deflection without changing field magnitude", () => {
    const counterclockwise = createElectromagnetProfile({...electromagnetDefaults, currentDirection: "counterclockwise"});
    const clockwise = createElectromagnetProfile({...electromagnetDefaults, currentDirection: "clockwise"});
    expect(counterclockwise.rightPole).toBe("north");
    expect(clockwise.rightPole).toBe("south");
    expect(counterclockwise.leftPole).toBe("south");
    expect(clockwise.leftPole).toBe("north");
    expect(counterclockwise.centerFieldT).toBeCloseTo(clockwise.centerFieldT, 12);
    expect(counterclockwise.compassDeflectionDegrees).toBeCloseTo(-clockwise.compassDeflectionDegrees, 12);
    expect(Math.abs(counterclockwise.compassDeflectionDegrees)).toBeLessThan(90);
    expect(EARTH_REFERENCE_FIELD_T).toBeGreaterThan(0);
  });

  it("sets field and polarity to zero when the switch is open", () => {
    const profile = createElectromagnetProfile({...electromagnetDefaults, currentDirection: "clockwise", switchClosed: false});
    expect(profile.active).toBe(false);
    expect(profile.centerFieldT).toBe(0);
    expect(profile.probeFieldT).toBe(0);
    expect(profile.ampereTurns).toBe(0);
    expect(profile.compassDeflectionDegrees).toBe(0);
    expect(Object.is(profile.compassDeflectionDegrees, -0)).toBe(false);
    expect(profile.leftPole).toBe("none");
    expect(profile.rightPole).toBe("none");
  });

  it("keeps current-marker motion deterministic, bounded, and direction-aware", () => {
    const forward = sampleElectromagnet(createElectromagnetProfile(electromagnetDefaults), 4.25);
    const reverse = sampleElectromagnet(createElectromagnetProfile({...electromagnetDefaults, currentDirection: "clockwise"}), 4.25);
    expect(forward).toEqual(sampleElectromagnet(createElectromagnetProfile(electromagnetDefaults), 4.25));
    expect(forward.currentMarkerPhase).toBeGreaterThanOrEqual(0);
    expect(forward.currentMarkerPhase).toBeLessThan(1);
    expect(reverse.currentMarkerPhase).toBeCloseTo((1 - forward.currentMarkerPhase) % 1, 12);
  });

  it("accepts all documented parameter boundaries", () => {
    const cases: ElectromagnetParameters[] = [
      {...electromagnetDefaults, currentA: 0, turns: 40, coilLengthM: 0.12, probeDistanceM: 0.06, core: "air", currentDirection: "clockwise", switchClosed: false},
      {...electromagnetDefaults, currentA: 3, turns: 240, coilLengthM: 0.36, probeDistanceM: 0.35, core: "iron", currentDirection: "counterclockwise", switchClosed: true},
    ];
    for (const parameters of cases) {
      expect(electromagnetParametersSchema.safeParse(parameters).success).toBe(true);
      expect(solveElectromagnet(parameters, 12)).toEqual(solveElectromagnet(parameters, 12));
    }
  });

  it("rejects invalid parameters, positions, and time", () => {
    const invalidCases = [
      {...electromagnetDefaults, currentA: -0.1},
      {...electromagnetDefaults, turns: 40.5},
      {...electromagnetDefaults, coilLengthM: 0.5},
      {...electromagnetDefaults, probeDistanceM: 0.01},
      {...electromagnetDefaults, core: "copper"},
      {...electromagnetDefaults, currentDirection: "up"},
      {...electromagnetDefaults, switchClosed: "yes"},
    ];
    for (const parameters of invalidCases) expect(electromagnetParametersSchema.safeParse(parameters).success).toBe(false);
    expect(() => finiteSolenoidFieldT(electromagnetDefaults, Number.NaN)).toThrow(RangeError);
    expect(() => solveElectromagnet(electromagnetDefaults, -1)).toThrow(RangeError);
  });

  it("reports the linear-core warning, invalid input, and model assumptions", () => {
    const highField = {...electromagnetDefaults, currentA: 3, turns: 240, coilLengthM: 0.12, core: "iron"} as const;
    expect(inspectElectromagnet(highField).map((issue) => issue.id)).toContain("linear-core-limit");
    expect(inspectElectromagnet(electromagnetDefaults).map((issue) => issue.id)).toContain("electromagnet-assumptions");
    expect(inspectElectromagnet({...electromagnetDefaults, currentA: Number.NaN}).every((issue) => issue.severity === "blocking")).toBe(true);
  });
});
