import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  createDCCircuitsProfile,
  dcCircuitsDefaults,
  dcCircuitsParametersSchema,
  dcCircuitsTemplate,
  inspectDCCircuits,
  sampleDCCircuits,
  solveDCCircuits,
  type DCCircuitsParameters,
} from "./index";

describe("dc-circuits solver", () => {
  it("publishes the paid classroom template contract", () => {
    expect(dcCircuitsTemplate).toMatchObject({
      id: "electricity.dc-circuits",
      version: "0.1.0",
      catalog: {
        slug: "dc-circuits",
        gradeLevel: "middle",
        subject: "electricity",
        lessonMinutes: 15,
      },
    });
    expect(dcCircuitsTemplate.parameterDefinitions.map((item) => item.key)).toEqual([
      "sourceVoltageV",
      "resistance1Ohm",
      "resistance2Ohm",
    ]);
    expect(dcCircuitsTemplate.narration.map((step) => step.id)).toEqual([
      "topology",
      "current-path",
      "equivalent-resistance",
      "ohms-law",
      "branch-readings",
      "compare",
    ]);
    expect(dcCircuitsTemplate.narration.reduce(
      (sum, step) => sum + step.durationSeconds,
      0,
    )).toBe(15);
  });

  it("solves the single-resistor topology without using R2", () => {
    const state = solveDCCircuits({
      ...dcCircuitsDefaults,
      topology: "single",
      sourceVoltageV: 12,
      resistance1Ohm: 24,
      resistance2Ohm: 1,
    });

    expect(state.equivalentResistanceOhm).toBe(24);
    expect(state.totalCurrentA).toBe(0.5);
    expect(state.branchCurrent1A).toBe(0.5);
    expect(state.branchCurrent2A).toBe(0);
    expect(state.resistorVoltage1V).toBe(12);
    expect(state.resistorVoltage2V).toBe(0);
    expect(state.resistorPower1W).toBe(6);
    expect(state.resistorPower2W).toBe(0);
  });

  it("solves series resistance, common current, and Kirchhoff's voltage law", () => {
    const state = solveDCCircuits({
      ...dcCircuitsDefaults,
      topology: "series",
      sourceVoltageV: 12,
      resistance1Ohm: 20,
      resistance2Ohm: 40,
    });

    expect(state.equivalentResistanceOhm).toBe(60);
    expect(state.totalCurrentA).toBeCloseTo(0.2, 12);
    expect(state.branchCurrent1A).toBe(state.totalCurrentA);
    expect(state.branchCurrent2A).toBe(state.totalCurrentA);
    expect(state.resistorVoltage1V).toBeCloseTo(4, 12);
    expect(state.resistorVoltage2V).toBeCloseTo(8, 12);
    expect(
      state.resistorVoltage1V + state.resistorVoltage2V,
    ).toBeCloseTo(state.parameters.sourceVoltageV, 12);
  });

  it("solves parallel resistance, branch currents, and Kirchhoff's current law", () => {
    const state = solveDCCircuits({
      ...dcCircuitsDefaults,
      topology: "parallel",
      sourceVoltageV: 12,
      resistance1Ohm: 20,
      resistance2Ohm: 30,
    });

    expect(state.equivalentResistanceOhm).toBeCloseTo(12, 12);
    expect(state.resistorVoltage1V).toBe(12);
    expect(state.resistorVoltage2V).toBe(12);
    expect(state.branchCurrent1A).toBeCloseTo(0.6, 12);
    expect(state.branchCurrent2A).toBeCloseTo(0.4, 12);
    expect(state.totalCurrentA).toBeCloseTo(1, 12);
    expect(
      state.branchCurrent1A + state.branchCurrent2A,
    ).toBeCloseTo(state.totalCurrentA, 12);
  });

  it("keeps all power forms consistent in every closed topology", () => {
    for (const topology of ["single", "series", "parallel"] as const) {
      const state = solveDCCircuits({
        ...dcCircuitsDefaults,
        topology,
        sourceVoltageV: 10,
        resistance1Ohm: 25,
        resistance2Ohm: 50,
      });

      expect(state.resistorPower1W).toBeCloseTo(
        state.resistorVoltage1V * state.branchCurrent1A,
        12,
      );
      expect(state.resistorPower1W).toBeCloseTo(
        state.branchCurrent1A ** 2 * state.parameters.resistance1Ohm,
        12,
      );
      expect(state.resistorPower2W).toBeCloseTo(
        state.resistorVoltage2V * state.branchCurrent2A,
        12,
      );
      expect(state.resistorPower2W).toBeCloseTo(
        state.branchCurrent2A ** 2 * state.parameters.resistance2Ohm,
        12,
      );
      expect(state.totalPowerW).toBeCloseTo(
        state.resistorPower1W + state.resistorPower2W,
        12,
      );
      expect(state.totalPowerW).toBeCloseTo(
        state.parameters.sourceVoltageV * state.totalCurrentA,
        12,
      );
      expect(state.totalCurrentA).toBeCloseTo(
        state.parameters.sourceVoltageV / state.equivalentResistanceOhm,
        12,
      );
      expect(state.sourcePowerW).toBeCloseTo(state.totalPowerW, 12);
    }
  });

  it("opens every topology without leaving current or power", () => {
    for (const topology of ["single", "series", "parallel"] as const) {
      const state = solveDCCircuits({
        ...dcCircuitsDefaults,
        topology,
        switchClosed: false,
      }, 5);

      expect(state.phase).toBe("open");
      expect(state.circuitClosed).toBe(false);
      expect(state.totalCurrentA).toBe(0);
      expect(state.branchCurrent1A).toBe(0);
      expect(state.branchCurrent2A).toBe(0);
      expect(state.resistorVoltage1V).toBe(0);
      expect(state.resistorVoltage2V).toBe(0);
      expect(state.switchVoltageV).toBe(state.parameters.sourceVoltageV);
      expect(state.resistorPower1W).toBe(0);
      expect(state.resistorPower2W).toBe(0);
      expect(state.totalPowerW).toBe(0);
      expect(state.sourcePowerW).toBe(0);
      expect(state.currentMarkersActive).toBe(false);
      expect(state.currentMarkerPhase).toBe(0);
    }
  });

  it("keeps the illustrative marker independent from physical measurements", () => {
    const visible = solveDCCircuits(dcCircuitsDefaults, 1.5);
    const later = solveDCCircuits(dcCircuitsDefaults, 2.5);
    const hidden = solveDCCircuits({
      ...dcCircuitsDefaults,
      showConventionalCurrent: false,
    }, 1.5);

    expect(visible.currentMarkerPhase).toBeCloseTo(0.6, 12);
    expect(later.currentMarkerPhase).toBeCloseTo(0, 12);
    expect(hidden.currentMarkersActive).toBe(false);
    expect(hidden.currentMarkerPhase).toBe(0);
    expect(hidden.totalCurrentA).toBe(visible.totalCurrentA);
    expect(hidden.totalPowerW).toBe(visible.totalPowerW);
    expect(later.totalCurrentA).toBe(visible.totalCurrentA);
  });

  it("is deterministic for repeated and equivalent frame samples", () => {
    const profile = createDCCircuitsProfile(dcCircuitsDefaults);
    const thirtyFps = sampleDCCircuits(
      profile,
      frameSample(45, 30).timeSeconds,
    );
    const repeated = sampleDCCircuits(profile, 1.5);
    const sixtyFps = solveDCCircuits(
      dcCircuitsDefaults,
      frameSample(90, 60).timeSeconds,
    );

    expect(repeated).toEqual(thirtyFps);
    expect(sixtyFps).toEqual(thirtyFps);
  });

  it("accepts every numeric boundary and produces finite values", () => {
    const boundaryCases: DCCircuitsParameters[] = [
      {
        ...dcCircuitsDefaults,
        topology: "parallel",
        sourceVoltageV: 1,
        resistance1Ohm: 1,
        resistance2Ohm: 100,
      },
      {
        ...dcCircuitsDefaults,
        topology: "series",
        sourceVoltageV: 24,
        resistance1Ohm: 100,
        resistance2Ohm: 1,
      },
    ];

    for (const parameters of boundaryCases) {
      expect(dcCircuitsParametersSchema.safeParse(parameters).success).toBe(true);
      const state = solveDCCircuits(parameters);
      for (const value of [
        state.equivalentResistanceOhm,
        state.totalCurrentA,
        state.branchCurrent1A,
        state.branchCurrent2A,
        state.resistorVoltage1V,
        state.resistorVoltage2V,
        state.totalPowerW,
      ]) {
        expect(Number.isFinite(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("rejects invalid topology, flags, numeric parameters, and time", () => {
    const invalidCases = [
      {...dcCircuitsDefaults, topology: "mixed"},
      {...dcCircuitsDefaults, sourceVoltageV: 0},
      {...dcCircuitsDefaults, sourceVoltageV: 25},
      {...dcCircuitsDefaults, resistance1Ohm: 0},
      {...dcCircuitsDefaults, resistance2Ohm: 101},
      {...dcCircuitsDefaults, resistance1Ohm: Number.NaN},
      {...dcCircuitsDefaults, sourceVoltageV: Number.POSITIVE_INFINITY},
      {...dcCircuitsDefaults, switchClosed: 1},
      {...dcCircuitsDefaults, showConventionalCurrent: "yes"},
    ];

    for (const parameters of invalidCases) {
      expect(dcCircuitsParametersSchema.safeParse(parameters).success).toBe(false);
    }
    expect(() => solveDCCircuits(dcCircuitsDefaults, -1)).toThrow(RangeError);
    expect(() => solveDCCircuits(dcCircuitsDefaults, Number.NaN)).toThrow(RangeError);
    expect(() => solveDCCircuits(
      dcCircuitsDefaults,
      Number.POSITIVE_INFINITY,
    )).toThrow(RangeError);
  });

  it("reports open, high-power, invalid, and model-assumption issues", () => {
    const defaultIssues = inspectDCCircuits(dcCircuitsDefaults);
    const openIssues = inspectDCCircuits({
      ...dcCircuitsDefaults,
      switchClosed: false,
    });
    const highPowerIssues = inspectDCCircuits({
      ...dcCircuitsDefaults,
      topology: "parallel",
      sourceVoltageV: 24,
      resistance1Ohm: 1,
      resistance2Ohm: 1,
    });
    const invalidIssues = inspectDCCircuits({
      ...dcCircuitsDefaults,
      resistance1Ohm: 0,
    });

    expect(defaultIssues.some((issue) => issue.severity === "blocking")).toBe(false);
    expect(defaultIssues.some((issue) => issue.id === "high-ideal-power")).toBe(false);
    expect(defaultIssues.some(
      (issue) => issue.id === "dc-circuits-assumptions",
    )).toBe(true);
    expect(openIssues.some((issue) => issue.id === "open-circuit")).toBe(true);
    expect(highPowerIssues.some(
      (issue) => issue.id === "high-ideal-power",
    )).toBe(true);
    expect(invalidIssues.every((issue) => issue.severity === "blocking")).toBe(true);
  });
});
