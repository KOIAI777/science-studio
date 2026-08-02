import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const ELECTRICAL_POWER_TEMPLATE_ID = "electricity.power-energy";
export const ELECTRICAL_POWER_TEMPLATE_VERSION = "0.1.0";

const CURRENT_MARKER_CYCLES_PER_SECOND = 0.08;
const HIGH_IDEAL_POWER_W = 50;

export const electricalPowerParametersSchema = z.object({
  voltageAV: z.number().finite().min(1).max(24),
  resistanceAOhm: z.number().finite().min(5).max(100),
  voltageBV: z.number().finite().min(1).max(24),
  resistanceBOhm: z.number().finite().min(5).max(100),
  runDurationSeconds: z.number().finite().min(10).max(120),
  showConventionalCurrent: z.boolean(),
});

export type ElectricalPowerParameters = z.infer<
  typeof electricalPowerParametersSchema
>;

export interface ElectricalPowerChannelProfile {
  voltageV: number;
  resistanceOhm: number;
  currentA: number;
  powerW: number;
}

export interface ElectricalPowerProfile {
  parameters: ElectricalPowerParameters;
  channelA: ElectricalPowerChannelProfile;
  channelB: ElectricalPowerChannelProfile;
  currentAA: number;
  currentBA: number;
  powerAW: number;
  powerBW: number;
  powerRatioBToA: number;
}

export type ElectricalPowerLeader = "a" | "b" | "equal";

export interface ElectricalPowerState extends ElectricalPowerProfile {
  timeSeconds: number;
  energyAJ: number;
  energyBJ: number;
  energyAWh: number;
  energyBWh: number;
  chargeAC: number;
  chargeBC: number;
  energyRatioBToA: number;
  energyLeader: ElectricalPowerLeader;
  currentMarkersActive: boolean;
  currentMarkerPhase: number;
}

export const electricalPowerDefaults: ElectricalPowerParameters = {
  voltageAV: 12,
  resistanceAOhm: 24,
  voltageBV: 12,
  resistanceBOhm: 12,
  runDurationSeconds: 60,
  showConventionalCurrent: true,
};

export const electricalPowerTemplate: ExperimentTemplateContract = {
  id: ELECTRICAL_POWER_TEMPLATE_ID,
  version: ELECTRICAL_POWER_TEMPLATE_VERSION,
  catalog: {
    slug: "electrical-power-energy",
    title: "Electrical Power & Energy",
    summary: "Compare two resistive loads and see how power sets the rate at which electrical energy is transferred.",
    gradeLevel: "middle",
    subject: "electricity",
    lessonMinutes: 15,
    concepts: ["Electrical Power", "Electrical Energy", "Ohm's Law", "Energy Transfer"],
  },
  learningObjectives: [
    "Distinguish electrical power from cumulative electrical energy.",
    "Calculate current and power for an ideal resistive load.",
    "Verify the equivalent power expressions P = VI, P = I squared R, and P = V squared divided by R.",
    "Use E = Pt to connect power, elapsed time, and transferred energy.",
    "Compare two controlled runs while changing only voltage, resistance, or duration.",
  ],
  parameterDefinitions: [
    {key: "voltageAV", unit: "V", min: 1, max: 24, step: 1, requiredFor: "model"},
    {key: "resistanceAOhm", unit: "Ω", min: 5, max: 100, step: 1, requiredFor: "model"},
    {key: "voltageBV", unit: "V", min: 1, max: 24, step: 1, requiredFor: "model"},
    {key: "resistanceBOhm", unit: "Ω", min: 5, max: 100, step: 1, requiredFor: "model"},
    {key: "runDurationSeconds", unit: "s", min: 10, max: 120, step: 10, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "currentAA", unit: "A", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "currentBA", unit: "A", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "powerAW", unit: "W", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "powerBW", unit: "W", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "energyAJ", unit: "J", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "energyBJ", unit: "J", digits: 1, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "set-runs", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["channels"]},
    {id: "current", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["current"]},
    {id: "power", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 12, highlights: ["power"]},
    {id: "energy", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["energy-chart"]},
    {id: "compare", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 60, highlights: ["comparison"]},
    {id: "equations", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 60, highlights: ["equations"]},
  ],
  assumptions: [
    "Each channel is an independent ideal DC source connected to one ohmic resistor.",
    "Voltage and resistance stay constant during a run, so current and power are constant.",
    "All electrical energy delivered to the resistor is counted as thermal energy transfer; resistor temperature is not modeled.",
    "The source, wires, and resistor reach steady state immediately; internal resistance, transients, and measurement error are excluded.",
    "Moving current markers indicate conventional-current direction only, not electron drift speed or current magnitude.",
  ],
};

function solveChannel(voltageV: number, resistanceOhm: number): ElectricalPowerChannelProfile {
  const currentA = voltageV / resistanceOhm;
  return {
    voltageV,
    resistanceOhm,
    currentA,
    powerW: voltageV * currentA,
  };
}

export function createElectricalPowerProfile(
  input: ElectricalPowerParameters,
): ElectricalPowerProfile {
  const parameters = electricalPowerParametersSchema.parse(input);
  const channelA = solveChannel(parameters.voltageAV, parameters.resistanceAOhm);
  const channelB = solveChannel(parameters.voltageBV, parameters.resistanceBOhm);
  return {
    parameters,
    channelA,
    channelB,
    currentAA: channelA.currentA,
    currentBA: channelB.currentA,
    powerAW: channelA.powerW,
    powerBW: channelB.powerW,
    powerRatioBToA: channelB.powerW / channelA.powerW,
  };
}

export function sampleElectricalPower(
  profile: ElectricalPowerProfile,
  timeSeconds: number,
): ElectricalPowerState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const elapsedSeconds = Math.min(timeSeconds, profile.parameters.runDurationSeconds);
  const energyAJ = profile.channelA.powerW * elapsedSeconds;
  const energyBJ = profile.channelB.powerW * elapsedSeconds;
  const powerDifference = profile.channelB.powerW - profile.channelA.powerW;
  const tolerance = Math.max(profile.channelA.powerW, profile.channelB.powerW, 1) * 1e-10;

  return {
    ...profile,
    timeSeconds: elapsedSeconds,
    energyAJ,
    energyBJ,
    energyAWh: energyAJ / 3600,
    energyBWh: energyBJ / 3600,
    chargeAC: profile.channelA.currentA * elapsedSeconds,
    chargeBC: profile.channelB.currentA * elapsedSeconds,
    energyRatioBToA: energyAJ === 0 ? profile.powerRatioBToA : energyBJ / energyAJ,
    energyLeader: Math.abs(powerDifference) <= tolerance ? "equal" : powerDifference > 0 ? "b" : "a",
    currentMarkersActive: profile.parameters.showConventionalCurrent,
    currentMarkerPhase: profile.parameters.showConventionalCurrent
      ? (elapsedSeconds * CURRENT_MARKER_CYCLES_PER_SECOND) % 1
      : 0,
  };
}

export function solveElectricalPower(
  input: ElectricalPowerParameters,
  timeSeconds = 0,
) {
  return sampleElectricalPower(createElectricalPowerProfile(input), timeSeconds);
}

export function inspectElectricalPower(
  parameters: ElectricalPowerParameters,
): ScienceIssue[] {
  const parsed = electricalPowerParametersSchema.safeParse(parameters);
  if (!parsed.success) {
    return parsed.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createElectricalPowerProfile(parsed.data);
  const issues: ScienceIssue[] = [];
  if (Math.max(profile.channelA.powerW, profile.channelB.powerW) > HIGH_IDEAL_POWER_W) {
    issues.push({
      id: "high-ideal-power",
      severity: "warning",
      title: "High idealized power",
      detail: "At least one channel exceeds 50 W. Real components require suitable voltage, current, power, and thermal ratings.",
      path: profile.channelA.powerW >= profile.channelB.powerW ? "resistanceAOhm" : "resistanceBOhm",
    });
  }
  issues.push({
    id: "electrical-power-assumptions",
    severity: "assumption",
    title: "Ideal resistive-load model",
    detail: "Both channels use ideal steady DC and constant ohmic resistance; temperature rise, thermal loss, source limits, and transients are not modeled.",
  });
  return issues;
}
