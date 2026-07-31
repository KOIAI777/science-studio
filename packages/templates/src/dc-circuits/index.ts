import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const DC_CIRCUITS_TEMPLATE_ID = "electricity.dc-circuits";
export const DC_CIRCUITS_TEMPLATE_VERSION = "0.1.0";

const CURRENT_MARKER_CYCLES_PER_SECOND = 0.4;
const HIGH_IDEAL_POWER_W = 50;

export const dcCircuitsParametersSchema = z.object({
  topology: z.enum(["single", "series", "parallel"]),
  sourceVoltageV: z.number().finite().min(1).max(24),
  resistance1Ohm: z.number().finite().min(1).max(100),
  resistance2Ohm: z.number().finite().min(1).max(100),
  switchClosed: z.boolean(),
  showConventionalCurrent: z.boolean(),
});

export type DCCircuitsParameters = z.infer<
  typeof dcCircuitsParametersSchema
>;
export type DCCircuitsTopology = DCCircuitsParameters["topology"];
export type DCCircuitsPhase = "open" | "steady";

export interface DCCircuitsProfile {
  parameters: DCCircuitsParameters;
  topology: DCCircuitsTopology;
  circuitClosed: boolean;
  equivalentResistanceOhm: number;
  totalCurrentA: number;
  branchCurrent1A: number;
  branchCurrent2A: number;
  resistorVoltage1V: number;
  resistorVoltage2V: number;
  switchVoltageV: number;
  resistorPower1W: number;
  resistorPower2W: number;
  totalPowerW: number;
  sourcePowerW: number;
}

export interface DCCircuitsState extends DCCircuitsProfile {
  timeSeconds: number;
  phase: DCCircuitsPhase;
  currentDirection: "conventional";
  currentMarkersActive: boolean;
  currentMarkerPhase: number;
}

export const dcCircuitsDefaults: DCCircuitsParameters = {
  topology: "series",
  sourceVoltageV: 12,
  resistance1Ohm: 30,
  resistance2Ohm: 60,
  switchClosed: true,
  showConventionalCurrent: true,
};

export const dcCircuitsTemplate: ExperimentTemplateContract = {
  id: DC_CIRCUITS_TEMPLATE_ID,
  version: DC_CIRCUITS_TEMPLATE_VERSION,
  catalog: {
    slug: "dc-circuits",
    title: "DC Circuits: Series & Parallel",
    summary: "Compare current, voltage, and power in three fixed DC circuit topologies.",
    gradeLevel: "middle",
    subject: "electricity",
    lessonMinutes: 15,
    concepts: [
      "Series Circuits",
      "Parallel Circuits",
      "Equivalent Resistance",
      "Kirchhoff's Laws",
    ],
  },
  learningObjectives: [
    "Distinguish single-resistor, series, and parallel circuit topologies.",
    "Calculate equivalent resistance for two resistors in series and parallel.",
    "Apply Ohm's law to total and branch currents.",
    "Use voltage and current measurements to check Kirchhoff's laws.",
    "Compare power dissipation across the selected resistor network.",
  ],
  parameterDefinitions: [
    {key: "sourceVoltageV", unit: "V", min: 1, max: 24, step: 1, requiredFor: "model"},
    {key: "resistance1Ohm", unit: "Ω", min: 1, max: 100, step: 1, requiredFor: "model"},
    {key: "resistance2Ohm", unit: "Ω", min: 1, max: 100, step: 1, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "equivalentResistanceOhm", unit: "Ω", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "totalCurrentA", unit: "A", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "branchCurrent1A", unit: "A", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "branchCurrent2A", unit: "A", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "resistorVoltage1V", unit: "V", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "resistorVoltage2V", unit: "V", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "switchVoltageV", unit: "V", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "resistorPower1W", unit: "W", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "resistorPower2W", unit: "W", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "totalPowerW", unit: "W", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "topology", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["topology"]},
    {id: "current-path", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["current"]},
    {id: "equivalent-resistance", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["resistance"]},
    {id: "ohms-law", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["equation"]},
    {id: "branch-readings", durationSeconds: 3, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["measurements"]},
    {id: "compare", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["comparison"]},
  ],
  assumptions: [
    "Only the single-resistor, two-resistor series, and two-resistor parallel topologies are available.",
    "The DC source, wires, switch, and ohmic resistors are ideal and reach steady state immediately.",
    "Equivalent resistance describes the resistor network; an open switch disconnects that network from the source.",
    "Current markers show conventional-current direction, not electron drift speed or current magnitude.",
  ],
};

function equivalentResistance(
  topology: DCCircuitsTopology,
  resistance1Ohm: number,
  resistance2Ohm: number,
) {
  if (topology === "single") return resistance1Ohm;
  if (topology === "series") return resistance1Ohm + resistance2Ohm;
  return (
    (resistance1Ohm * resistance2Ohm) /
    (resistance1Ohm + resistance2Ohm)
  );
}

export function createDCCircuitsProfile(
  input: DCCircuitsParameters,
): DCCircuitsProfile {
  const parameters = dcCircuitsParametersSchema.parse(input);
  const equivalentResistanceOhm = equivalentResistance(
    parameters.topology,
    parameters.resistance1Ohm,
    parameters.resistance2Ohm,
  );

  if (!parameters.switchClosed) {
    return {
      parameters,
      topology: parameters.topology,
      circuitClosed: false,
      equivalentResistanceOhm,
      totalCurrentA: 0,
      branchCurrent1A: 0,
      branchCurrent2A: 0,
      resistorVoltage1V: 0,
      resistorVoltage2V: 0,
      switchVoltageV: parameters.sourceVoltageV,
      resistorPower1W: 0,
      resistorPower2W: 0,
      totalPowerW: 0,
      sourcePowerW: 0,
    };
  }

  let totalCurrentA: number;
  let branchCurrent1A: number;
  let branchCurrent2A: number;
  let resistorVoltage1V: number;
  let resistorVoltage2V: number;

  if (parameters.topology === "single") {
    totalCurrentA = parameters.sourceVoltageV / parameters.resistance1Ohm;
    branchCurrent1A = totalCurrentA;
    branchCurrent2A = 0;
    resistorVoltage1V = parameters.sourceVoltageV;
    resistorVoltage2V = 0;
  } else if (parameters.topology === "series") {
    totalCurrentA = parameters.sourceVoltageV / equivalentResistanceOhm;
    branchCurrent1A = totalCurrentA;
    branchCurrent2A = totalCurrentA;
    resistorVoltage1V = branchCurrent1A * parameters.resistance1Ohm;
    resistorVoltage2V = branchCurrent2A * parameters.resistance2Ohm;
  } else {
    branchCurrent1A = parameters.sourceVoltageV / parameters.resistance1Ohm;
    branchCurrent2A = parameters.sourceVoltageV / parameters.resistance2Ohm;
    totalCurrentA = branchCurrent1A + branchCurrent2A;
    resistorVoltage1V = parameters.sourceVoltageV;
    resistorVoltage2V = parameters.sourceVoltageV;
  }

  const resistorPower1W = resistorVoltage1V * branchCurrent1A;
  const resistorPower2W = resistorVoltage2V * branchCurrent2A;
  const totalPowerW = resistorPower1W + resistorPower2W;

  return {
    parameters,
    topology: parameters.topology,
    circuitClosed: true,
    equivalentResistanceOhm,
    totalCurrentA,
    branchCurrent1A,
    branchCurrent2A,
    resistorVoltage1V,
    resistorVoltage2V,
    switchVoltageV: 0,
    resistorPower1W,
    resistorPower2W,
    totalPowerW,
    sourcePowerW: parameters.sourceVoltageV * totalCurrentA,
  };
}

export function sampleDCCircuits(
  profile: DCCircuitsProfile,
  timeSeconds: number,
): DCCircuitsState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const currentMarkersActive =
    profile.circuitClosed && profile.parameters.showConventionalCurrent;

  return {
    ...profile,
    timeSeconds,
    phase: profile.circuitClosed ? "steady" : "open",
    currentDirection: "conventional",
    currentMarkersActive,
    currentMarkerPhase: currentMarkersActive
      ? (timeSeconds * CURRENT_MARKER_CYCLES_PER_SECOND) % 1
      : 0,
  };
}

export function solveDCCircuits(
  input: DCCircuitsParameters,
  timeSeconds = 0,
) {
  return sampleDCCircuits(createDCCircuitsProfile(input), timeSeconds);
}

export function inspectDCCircuits(
  parameters: DCCircuitsParameters,
): ScienceIssue[] {
  const result = dcCircuitsParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createDCCircuitsProfile(result.data);
  const issues: ScienceIssue[] = [];

  if (!result.data.switchClosed) {
    issues.push({
      id: "open-circuit",
      severity: "warning",
      title: "The circuit is open",
      detail: "All resistor currents and powers are zero because the source is disconnected from the resistor network.",
      path: "switchClosed",
    });
  } else if (profile.totalPowerW > HIGH_IDEAL_POWER_W) {
    issues.push({
      id: "high-ideal-power",
      severity: "warning",
      title: "High idealized power",
      detail: "This ideal result exceeds 50 W. Real components require suitable power ratings, current limits, and thermal protection.",
      path: "resistance1Ohm",
    });
  }

  if (result.data.topology === "single") {
    issues.push({
      id: "unused-second-resistor",
      severity: "assumption",
      title: "Single-resistor topology",
      detail: "R2 is excluded from the selected circuit, so it does not affect equivalent resistance or any reading.",
      path: "resistance2Ohm",
    });
  }

  issues.push({
    id: "dc-circuits-assumptions",
    severity: "assumption",
    title: "Ideal steady-state DC model",
    detail: "The source, wires, switch, and resistors are ideal; internal resistance, transients, heating feedback, and measurement error are ignored.",
  });

  return issues;
}
