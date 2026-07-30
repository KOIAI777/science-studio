import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  inspectOhmsLaw,
  ohmsLawDefaults,
  ohmsLawParametersSchema,
  ohmsLawTemplate,
  sampleOhmsLaw,
  solveOhmsLaw,
} from "./index";

describe("ohms-law solver", () => {
  it("publishes the constrained classroom template contract", () => {
    expect(ohmsLawTemplate).toMatchObject({
      id: "electricity.ohms-law",
      version: "0.1.0",
      catalog: {
        slug: "ohms-law",
        gradeLevel: "middle",
        subject: "electricity",
        lessonMinutes: 10,
      },
    });
    expect(ohmsLawTemplate.parameterDefinitions.map((item) => item.key)).toEqual([
      "sourceVoltageV",
      "resistanceOhm",
      "switchClosed",
    ]);
    expect(ohmsLawTemplate.narration.map((step) => step.id)).toEqual([
      "loop",
      "switch",
      "law",
      "variable",
      "power",
    ]);
    expect(ohmsLawTemplate.narration.reduce(
      (sum, step) => sum + step.durationSeconds,
      0,
    )).toBe(10);
  });

  it("solves the default closed loop with I = V/R and P = VI", () => {
    const state = solveOhmsLaw(ohmsLawDefaults);

    expect(state).toMatchObject({
      circuitStatus: "closed",
      switchClosed: true,
      currentDirection: "conventional",
      sourceVoltageV: 9,
      resistanceOhm: 30,
      resistorVoltageV: 9,
    });
    expect(state.currentA).toBeCloseTo(0.3, 12);
    expect(state.currentMilliA).toBeCloseTo(300, 12);
    expect(state.powerW).toBeCloseTo(2.7, 12);
    expect(state.powerW).toBeCloseTo(state.sourceVoltageV * state.currentA, 12);
  });

  it("sets current, resistor drop, and power to zero when the switch is open", () => {
    const state = solveOhmsLaw({...ohmsLawDefaults, switchClosed: false}, 3);

    expect(state).toMatchObject({
      circuitStatus: "open",
      switchClosed: false,
      resistorVoltageV: 0,
      switchVoltageV: 9,
      currentA: 0,
      currentMilliA: 0,
      powerW: 0,
      currentPhase: 0,
    });
  });

  it("doubles current and quadruples power when voltage doubles", () => {
    const baseline = solveOhmsLaw(ohmsLawDefaults);
    const doubled = solveOhmsLaw({
      ...ohmsLawDefaults,
      sourceVoltageV: ohmsLawDefaults.sourceVoltageV * 2,
    });

    expect(doubled.currentA).toBeCloseTo(baseline.currentA * 2, 12);
    expect(doubled.powerW).toBeCloseTo(baseline.powerW * 4, 12);
  });

  it("halves current and power when resistance doubles", () => {
    const baseline = solveOhmsLaw(ohmsLawDefaults);
    const doubled = solveOhmsLaw({
      ...ohmsLawDefaults,
      resistanceOhm: ohmsLawDefaults.resistanceOhm * 2,
    });

    expect(doubled.currentA).toBeCloseTo(baseline.currentA / 2, 12);
    expect(doubled.powerW).toBeCloseTo(baseline.powerW / 2, 12);
  });

  it("rejects out-of-range and non-finite parameters", () => {
    for (const parameters of [
      {...ohmsLawDefaults, sourceVoltageV: 0},
      {...ohmsLawDefaults, sourceVoltageV: 25},
      {...ohmsLawDefaults, resistanceOhm: 0},
      {...ohmsLawDefaults, resistanceOhm: 101},
      {...ohmsLawDefaults, sourceVoltageV: Number.NaN},
      {...ohmsLawDefaults, resistanceOhm: Number.POSITIVE_INFINITY},
    ]) {
      expect(ohmsLawParametersSchema.safeParse(parameters).success).toBe(false);
    }
  });

  it("rejects invalid sample times", () => {
    expect(() => sampleOhmsLaw(ohmsLawDefaults, -1)).toThrow(RangeError);
    expect(() => sampleOhmsLaw(ohmsLawDefaults, Number.NaN)).toThrow(RangeError);
    expect(() => sampleOhmsLaw(ohmsLawDefaults, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });

  it("is deterministic at equivalent frame times without changing measurements", () => {
    const thirtyFps = sampleOhmsLaw(
      ohmsLawDefaults,
      frameSample(45, 30).timeSeconds,
    );
    const sixtyFps = sampleOhmsLaw(
      ohmsLawDefaults,
      frameSample(90, 60).timeSeconds,
    );

    expect(sixtyFps).toEqual(thirtyFps);
    expect(sampleOhmsLaw(ohmsLawDefaults, 8)).toMatchObject({
      currentA: thirtyFps.currentA,
      powerW: thirtyFps.powerW,
      resistorVoltageV: thirtyFps.resistorVoltageV,
    });
  });

  it("reports open-circuit, high-power, and model-assumption guidance", () => {
    const openIssues = inspectOhmsLaw({...ohmsLawDefaults, switchClosed: false});
    const highPowerIssues = inspectOhmsLaw({
      sourceVoltageV: 24,
      resistanceOhm: 1,
      switchClosed: true,
    });

    expect(openIssues.some((issue) => issue.id === "open-circuit")).toBe(true);
    expect(highPowerIssues.some((issue) => issue.id === "high-ideal-power")).toBe(true);
    expect(openIssues.some((issue) => issue.severity === "assumption")).toBe(true);
  });
});
