import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  createElectricalPowerProfile,
  electricalPowerDefaults,
  electricalPowerParametersSchema,
  electricalPowerTemplate,
  inspectElectricalPower,
  sampleElectricalPower,
  solveElectricalPower,
  type ElectricalPowerParameters,
} from "./index";

describe("electrical-power solver", () => {
  it("publishes the eighth paid classroom template contract", () => {
    expect(electricalPowerTemplate).toMatchObject({
      id: "electricity.power-energy",
      version: "0.1.0",
      catalog: {
        slug: "electrical-power-energy",
        gradeLevel: "middle",
        subject: "electricity",
        lessonMinutes: 15,
      },
    });
    expect(electricalPowerTemplate.narration.map((step) => step.id)).toEqual([
      "set-runs",
      "current",
      "power",
      "energy",
      "compare",
      "equations",
    ]);
    expect(electricalPowerTemplate.narration.reduce((sum, step) => sum + step.durationSeconds, 0)).toBe(15);
  });

  it("solves current and all equivalent power forms", () => {
    const profile = createElectricalPowerProfile(electricalPowerDefaults);
    for (const channel of [profile.channelA, profile.channelB]) {
      expect(channel.currentA).toBeCloseTo(channel.voltageV / channel.resistanceOhm, 12);
      expect(channel.powerW).toBeCloseTo(channel.voltageV * channel.currentA, 12);
      expect(channel.powerW).toBeCloseTo(channel.currentA ** 2 * channel.resistanceOhm, 12);
      expect(channel.powerW).toBeCloseTo(channel.voltageV ** 2 / channel.resistanceOhm, 12);
    }
    expect(profile.currentAA).toBe(profile.channelA.currentA);
    expect(profile.currentBA).toBe(profile.channelB.currentA);
    expect(profile.powerAW).toBe(profile.channelA.powerW);
    expect(profile.powerBW).toBe(profile.channelB.powerW);
  });

  it("accumulates energy and charge linearly with physical time", () => {
    const atTen = solveElectricalPower(electricalPowerDefaults, 10);
    const atForty = solveElectricalPower(electricalPowerDefaults, 40);
    expect(atForty.energyAJ).toBeCloseTo(atTen.energyAJ * 4, 12);
    expect(atForty.energyBJ).toBeCloseTo(atTen.energyBJ * 4, 12);
    expect(atForty.chargeAC).toBeCloseTo(atTen.chargeAC * 4, 12);
    expect(atForty.energyAWh).toBeCloseTo(atForty.energyAJ / 3600, 12);
    expect(atForty.energyBWh).toBeCloseTo(atForty.energyBJ / 3600, 12);
  });

  it("shows that doubling voltage at fixed resistance doubles current and quadruples power", () => {
    const state = solveElectricalPower({
      ...electricalPowerDefaults,
      voltageAV: 6,
      resistanceAOhm: 24,
      voltageBV: 12,
      resistanceBOhm: 24,
    }, 30);
    expect(state.channelB.currentA).toBeCloseTo(state.channelA.currentA * 2, 12);
    expect(state.channelB.powerW).toBeCloseTo(state.channelA.powerW * 4, 12);
    expect(state.energyBJ).toBeCloseTo(state.energyAJ * 4, 12);
  });

  it("shows that doubling resistance at fixed voltage halves current and power", () => {
    const state = solveElectricalPower({
      ...electricalPowerDefaults,
      voltageAV: 12,
      resistanceAOhm: 20,
      voltageBV: 12,
      resistanceBOhm: 40,
    }, 30);
    expect(state.channelB.currentA).toBeCloseTo(state.channelA.currentA / 2, 12);
    expect(state.channelB.powerW).toBeCloseTo(state.channelA.powerW / 2, 12);
    expect(state.energyBJ).toBeCloseTo(state.energyAJ / 2, 12);
  });

  it("recognizes equal-power runs with equal energy slopes", () => {
    const state = solveElectricalPower({
      ...electricalPowerDefaults,
      voltageAV: 12,
      resistanceAOhm: 24,
      voltageBV: 6,
      resistanceBOhm: 6,
    }, 45);
    expect(state.channelA.powerW).toBeCloseTo(6, 12);
    expect(state.channelB.powerW).toBeCloseTo(6, 12);
    expect(state.energyLeader).toBe("equal");
    expect(state.energyRatioBToA).toBeCloseTo(1, 12);
  });

  it("uses power to predict the energy leader before energy has accumulated", () => {
    const state = solveElectricalPower(electricalPowerDefaults, 0);
    expect(state.energyAJ).toBe(0);
    expect(state.energyBJ).toBe(0);
    expect(state.channelB.powerW).toBeGreaterThan(state.channelA.powerW);
    expect(state.energyLeader).toBe("b");
    expect(state.energyRatioBToA).toBeCloseTo(state.powerRatioBToA, 12);
  });

  it("caps sampled energy at the configured run duration", () => {
    const parameters = {...electricalPowerDefaults, runDurationSeconds: 30};
    const atEnd = solveElectricalPower(parameters, 30);
    const afterEnd = solveElectricalPower(parameters, 90);
    expect(afterEnd.timeSeconds).toBe(30);
    expect(afterEnd.energyAJ).toBe(atEnd.energyAJ);
    expect(afterEnd.energyBJ).toBe(atEnd.energyBJ);
  });

  it("keeps current markers illustrative and independent from measurements", () => {
    const visible = solveElectricalPower(electricalPowerDefaults, 1.5);
    const hidden = solveElectricalPower({...electricalPowerDefaults, showConventionalCurrent: false}, 1.5);
    expect(visible.currentMarkersActive).toBe(true);
    expect(hidden.currentMarkersActive).toBe(false);
    expect(hidden.currentMarkerPhase).toBe(0);
    expect(hidden.channelA).toEqual(visible.channelA);
    expect(hidden.channelB).toEqual(visible.channelB);
    expect(hidden.energyAJ).toBe(visible.energyAJ);
  });

  it("is deterministic for repeated and equivalent frame samples", () => {
    const profile = createElectricalPowerProfile(electricalPowerDefaults);
    const thirtyFps = sampleElectricalPower(profile, frameSample(45, 30).timeSeconds);
    const repeated = sampleElectricalPower(profile, 1.5);
    const sixtyFps = solveElectricalPower(electricalPowerDefaults, frameSample(90, 60).timeSeconds);
    expect(repeated).toEqual(thirtyFps);
    expect(sixtyFps).toEqual(thirtyFps);
  });

  it("accepts numeric boundaries and produces finite non-negative values", () => {
    const cases: ElectricalPowerParameters[] = [
      {...electricalPowerDefaults, voltageAV: 1, resistanceAOhm: 5, voltageBV: 24, resistanceBOhm: 100, runDurationSeconds: 10},
      {...electricalPowerDefaults, voltageAV: 24, resistanceAOhm: 100, voltageBV: 1, resistanceBOhm: 5, runDurationSeconds: 120},
    ];
    for (const parameters of cases) {
      expect(electricalPowerParametersSchema.safeParse(parameters).success).toBe(true);
      const state = solveElectricalPower(parameters, parameters.runDurationSeconds);
      for (const value of [state.channelA.currentA, state.channelA.powerW, state.channelB.currentA, state.channelB.powerW, state.energyAJ, state.energyBJ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("rejects invalid inputs and reports science issues", () => {
    const invalidCases = [
      {...electricalPowerDefaults, voltageAV: 0},
      {...electricalPowerDefaults, voltageBV: 25},
      {...electricalPowerDefaults, resistanceAOhm: 4},
      {...electricalPowerDefaults, resistanceBOhm: 101},
      {...electricalPowerDefaults, runDurationSeconds: 9},
      {...electricalPowerDefaults, runDurationSeconds: 121},
      {...electricalPowerDefaults, showConventionalCurrent: "yes"},
      {...electricalPowerDefaults, voltageAV: Number.NaN},
    ];
    for (const parameters of invalidCases) expect(electricalPowerParametersSchema.safeParse(parameters).success).toBe(false);
    expect(() => solveElectricalPower(electricalPowerDefaults, -1)).toThrow(RangeError);
    expect(() => solveElectricalPower(electricalPowerDefaults, Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(inspectElectricalPower(electricalPowerDefaults).map((issue) => issue.id)).toContain("electrical-power-assumptions");
    expect(inspectElectricalPower({...electricalPowerDefaults, voltageAV: 24, resistanceAOhm: 5}).map((issue) => issue.id)).toContain("high-ideal-power");
    expect(inspectElectricalPower({...electricalPowerDefaults, voltageAV: 0}).every((issue) => issue.severity === "blocking")).toBe(true);
  });
});
