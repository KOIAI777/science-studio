import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const OHMS_LAW_TEMPLATE_ID = "electricity.ohms-law";
export const OHMS_LAW_TEMPLATE_VERSION = "0.1.0";

const CURRENT_ANIMATION_CYCLES_PER_SECOND = 0.45;
const HIGH_IDEAL_POWER_W = 25;

export const ohmsLawParametersSchema = z.object({
  sourceVoltageV: z.number().finite().min(1).max(24),
  resistanceOhm: z.number().finite().min(1).max(100),
  switchClosed: z.boolean(),
});

export type OhmsLawParameters = z.infer<typeof ohmsLawParametersSchema>;
export type OhmsLawCircuitStatus = "open" | "closed";

export interface OhmsLawState {
  timeSeconds: number;
  circuitStatus: OhmsLawCircuitStatus;
  switchClosed: boolean;
  currentDirection: "conventional";
  sourceVoltageV: number;
  resistanceOhm: number;
  resistorVoltageV: number;
  switchVoltageV: number;
  currentA: number;
  currentMilliA: number;
  powerW: number;
  currentPhase: number;
}

export const ohmsLawDefaults: OhmsLawParameters = {
  sourceVoltageV: 9,
  resistanceOhm: 30,
  switchClosed: true,
};

export const ohmsLawTemplate: ExperimentTemplateContract = {
  id: OHMS_LAW_TEMPLATE_ID,
  version: OHMS_LAW_TEMPLATE_VERSION,
  catalog: {
    slug: "ohms-law",
    title: "Ohm's Law Lab",
    summary: "Close a single circuit, measure current, and test how voltage and resistance are related.",
    gradeLevel: "middle",
    subject: "electricity",
    lessonMinutes: 10,
    concepts: ["Voltage", "Current", "Resistance", "Ohm's Law"],
  },
  learningObjectives: [
    "Identify the source, switch, resistor, and one complete current path.",
    "Use conventional current direction consistently in a simple DC loop.",
    "Predict current with I = V / R and compare the prediction with the reading.",
    "Explain how changing voltage or resistance changes current when the other variable is fixed.",
    "Calculate the resistor power with P = V I.",
  ],
  parameterDefinitions: [
    {key: "sourceVoltageV", unit: "V", min: 1, max: 24, step: 1, requiredFor: "model"},
    {key: "resistanceOhm", unit: "Ω", min: 1, max: 100, step: 1, requiredFor: "model"},
    {key: "switchClosed", unit: "", min: 0, max: 1, step: 1, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "sourceVoltageV", unit: "V", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "resistanceOhm", unit: "Ω", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "resistorVoltageV", unit: "V", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "currentA", unit: "A", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "powerW", unit: "W", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "loop", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["loop"]},
    {id: "switch", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["current"]},
    {id: "law", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["law"]},
    {id: "variable", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["graph"]},
    {id: "power", durationSeconds: 2, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["power"]},
  ],
  assumptions: [
    "One ideal DC voltage source, one ohmic resistor, one switch, and ideal wires.",
    "The circuit reaches steady state immediately; internal resistance and transients are ignored.",
    "Animated markers indicate conventional-current direction and circuit state, not electron drift speed.",
  ],
};

export function solveOhmsLaw(
  input: OhmsLawParameters,
  timeSeconds = 0,
): OhmsLawState {
  const parameters = ohmsLawParametersSchema.parse(input);

  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const currentA = parameters.switchClosed
    ? parameters.sourceVoltageV / parameters.resistanceOhm
    : 0;
  const resistorVoltageV = parameters.switchClosed
    ? parameters.sourceVoltageV
    : 0;
  const switchVoltageV = parameters.switchClosed
    ? 0
    : parameters.sourceVoltageV;
  const powerW = resistorVoltageV * currentA;

  return {
    timeSeconds,
    circuitStatus: parameters.switchClosed ? "closed" : "open",
    switchClosed: parameters.switchClosed,
    currentDirection: "conventional",
    sourceVoltageV: parameters.sourceVoltageV,
    resistanceOhm: parameters.resistanceOhm,
    resistorVoltageV,
    switchVoltageV,
    currentA,
    currentMilliA: currentA * 1000,
    powerW,
    currentPhase: parameters.switchClosed
      ? (timeSeconds * CURRENT_ANIMATION_CYCLES_PER_SECOND) % 1
      : 0,
  };
}

export function sampleOhmsLaw(
  parameters: OhmsLawParameters,
  timeSeconds: number,
) {
  return solveOhmsLaw(parameters, timeSeconds);
}

export function inspectOhmsLaw(
  parameters: OhmsLawParameters,
): ScienceIssue[] {
  const result = ohmsLawParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const state = solveOhmsLaw(result.data);
  const issues: ScienceIssue[] = [];

  if (!result.data.switchClosed) {
    issues.push({
      id: "open-circuit",
      severity: "warning",
      title: "The circuit is open",
      detail: "There is no complete conducting path, so current and resistor power are zero.",
      path: "switchClosed",
    });
  } else if (state.powerW > HIGH_IDEAL_POWER_W) {
    issues.push({
      id: "high-ideal-power",
      severity: "warning",
      title: "High idealized power",
      detail: "This combination produces high power in the ideal model; a real resistor would need an appropriate power rating.",
      path: "resistanceOhm",
    });
  }

  issues.push({
    id: "ohms-law-assumptions",
    severity: "assumption",
    title: "Ideal single-loop model",
    detail: "The source, wires, switch, and resistor are ideal; transients, heating feedback, and measurement error are ignored.",
  });

  return issues;
}
