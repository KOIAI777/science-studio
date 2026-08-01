import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const LEVER_BALANCE_TEMPLATE_ID = "mechanics.lever-balance";
export const LEVER_BALANCE_TEMPLATE_VERSION = "0.2.0";
export const LEVER_STOP_ANGLE_DEGREES = 12;

const TORQUE_EPSILON_NM = 1e-8;
const RELEASE_INTEGRATION_STEP_SECONDS = 1 / 240;
const LEVER_STOP_ANGLE_RADIANS = LEVER_STOP_ANGLE_DEGREES * Math.PI / 180;

export const leverBalanceParametersSchema = z.object({
  leftMassKg: z.number().finite().min(0.5).max(8),
  rightMassKg: z.number().finite().min(0.5).max(8),
  leftDistanceM: z.number().finite().min(0.2).max(2),
  rightDistanceM: z.number().finite().min(0.2).max(2),
  gravityMs2: z.number().finite().min(1).max(20),
  showForces: z.boolean(),
  showMomentArcs: z.boolean(),
});

export type LeverBalanceParameters = z.infer<typeof leverBalanceParametersSchema>;
export type LeverBalanceOutcome = "balanced" | "counterclockwise" | "clockwise";

export interface LeverBalanceState {
  parameters: LeverBalanceParameters;
  leftWeightN: number;
  rightWeightN: number;
  leftTorqueNm: number;
  rightTorqueNm: number;
  netTorqueNm: number;
  outcome: LeverBalanceOutcome;
  requiredRightMassKg: number;
  requiredRightDistanceM: number;
  centerOfMassOffsetM: number;
}

export interface LeverMotionState {
  angleRadians: number;
  angularVelocityRadiansPerSecond: number;
  angularAccelerationRadiansPerSecondSquared: number;
  leftTorqueNm: number;
  rightTorqueNm: number;
  netTorqueNm: number;
  momentOfInertiaKgM2: number;
  reachedStop: boolean;
  stopSide: "left" | "right" | null;
}

export const leverBalanceDefaults: LeverBalanceParameters = {
  leftMassKg: 3,
  rightMassKg: 2,
  leftDistanceM: 0.8,
  rightDistanceM: 1.2,
  gravityMs2: 9.81,
  showForces: true,
  showMomentArcs: true,
};

export const leverBalanceTemplate: ExperimentTemplateContract = {
  id: LEVER_BALANCE_TEMPLATE_ID,
  version: LEVER_BALANCE_TEMPLATE_VERSION,
  catalog: {
    slug: "levers-and-balance",
    title: "Levers & Balance: Moments in Equilibrium",
    summary: "Compare clockwise and counterclockwise moments, predict rotation, and solve for an unknown load or distance.",
    gradeLevel: "middle",
    subject: "mechanics",
    lessonMinutes: 15,
    concepts: ["Moments", "Torque", "Equilibrium", "Levers"],
  },
  learningObjectives: [
    "Identify the pivot, applied weights, and perpendicular lever arms.",
    "Calculate a moment using force multiplied by perpendicular distance.",
    "Compare clockwise and counterclockwise moments to predict rotation.",
    "Apply the principle of moments to a balanced lever.",
    "Solve for an unknown mass or distance required for equilibrium.",
  ],
  parameterDefinitions: [
    {key: "leftMassKg", unit: "kg", min: 0.5, max: 8, step: 0.1, requiredFor: "model"},
    {key: "rightMassKg", unit: "kg", min: 0.5, max: 8, step: 0.1, requiredFor: "model"},
    {key: "leftDistanceM", unit: "m", min: 0.2, max: 2, step: 0.1, requiredFor: "model"},
    {key: "rightDistanceM", unit: "m", min: 0.2, max: 2, step: 0.1, requiredFor: "model"},
    {key: "gravityMs2", unit: "m/s²", min: 1, max: 20, step: 0.01, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "leftWeightN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "rightWeightN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "leftTorqueNm", unit: "N·m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "rightTorqueNm", unit: "N·m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "netTorqueNm", unit: "N·m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "requiredRightMassKg", unit: "kg", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "requiredRightDistanceM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "pivot", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["pivot"]},
    {id: "forces", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["forces"]},
    {id: "arms", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["arms"]},
    {id: "moments", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["moments"]},
    {id: "compare", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["comparison"]},
    {id: "unknown", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["unknown"]},
  ],
  assumptions: [
    "The analysis phase starts with a rigid, horizontal beam supported by a frictionless central pivot.",
    "The beam's own weight acts through the pivot and therefore contributes zero moment.",
    "Each load acts vertically downward and is treated as a point load at its marked distance.",
    "After release, angular motion follows I alpha = sum(tau) for an ideal low-mass beam until a perfectly inelastic mechanical stop at plus or minus 12 degrees.",
  ],
};

export function solveLeverBalance(input: LeverBalanceParameters): LeverBalanceState {
  const parameters = leverBalanceParametersSchema.parse(input);
  const {
    leftMassKg,
    rightMassKg,
    leftDistanceM,
    rightDistanceM,
    gravityMs2,
  } = parameters;
  const leftWeightN = leftMassKg * gravityMs2;
  const rightWeightN = rightMassKg * gravityMs2;
  const leftTorqueNm = leftWeightN * leftDistanceM;
  const rightTorqueNm = rightWeightN * rightDistanceM;
  const netTorqueNm = leftTorqueNm - rightTorqueNm;
  const tolerance = TORQUE_EPSILON_NM * Math.max(1, leftTorqueNm, rightTorqueNm);
  const outcome: LeverBalanceOutcome = Math.abs(netTorqueNm) <= tolerance
    ? "balanced"
    : netTorqueNm > 0
      ? "counterclockwise"
      : "clockwise";

  return {
    parameters,
    leftWeightN,
    rightWeightN,
    leftTorqueNm,
    rightTorqueNm,
    netTorqueNm,
    outcome,
    requiredRightMassKg: leftMassKg * leftDistanceM / rightDistanceM,
    requiredRightDistanceM: leftMassKg * leftDistanceM / rightMassKg,
    centerOfMassOffsetM: (rightMassKg * rightDistanceM - leftMassKg * leftDistanceM) / (leftMassKg + rightMassKg),
  };
}

export function simulateLeverRelease(
  input: LeverBalanceParameters,
  elapsedSeconds: number,
): LeverMotionState {
  const state = solveLeverBalance(input);
  if (!Number.isFinite(elapsedSeconds) || elapsedSeconds < 0)
    throw new RangeError("elapsedSeconds must be a finite, non-negative number");

  const momentOfInertiaKgM2 =
    state.parameters.leftMassKg * state.parameters.leftDistanceM ** 2 +
    state.parameters.rightMassKg * state.parameters.rightDistanceM ** 2;
  let angleRadians = 0;
  let angularVelocityRadiansPerSecond = 0;
  let angularAccelerationRadiansPerSecondSquared = 0;
  let reachedStop = false;
  let stopSide: LeverMotionState["stopSide"] = null;
  let remainingSeconds = elapsedSeconds;

  if (state.outcome === "balanced")
    return {
      angleRadians,
      angularVelocityRadiansPerSecond,
      angularAccelerationRadiansPerSecondSquared,
      leftTorqueNm: state.leftTorqueNm,
      rightTorqueNm: state.rightTorqueNm,
      netTorqueNm: 0,
      momentOfInertiaKgM2,
      reachedStop,
      stopSide,
    };

  while (remainingSeconds > 0 && !reachedStop) {
    const stepSeconds = Math.min(RELEASE_INTEGRATION_STEP_SECONDS, remainingSeconds);
    const netTorqueNm = state.netTorqueNm * Math.cos(angleRadians);
    angularAccelerationRadiansPerSecondSquared = netTorqueNm / momentOfInertiaKgM2;
    angularVelocityRadiansPerSecond +=
      angularAccelerationRadiansPerSecondSquared * stepSeconds;
    angleRadians += angularVelocityRadiansPerSecond * stepSeconds;

    if (angleRadians >= LEVER_STOP_ANGLE_RADIANS) {
      angleRadians = LEVER_STOP_ANGLE_RADIANS;
      angularVelocityRadiansPerSecond = 0;
      angularAccelerationRadiansPerSecondSquared = 0;
      reachedStop = true;
      stopSide = "left";
    } else if (angleRadians <= -LEVER_STOP_ANGLE_RADIANS) {
      angleRadians = -LEVER_STOP_ANGLE_RADIANS;
      angularVelocityRadiansPerSecond = 0;
      angularAccelerationRadiansPerSecondSquared = 0;
      reachedStop = true;
      stopSide = "right";
    }

    remainingSeconds -= stepSeconds;
  }

  const perpendicularScale = Math.cos(angleRadians);
  const leftTorqueNm = state.leftTorqueNm * perpendicularScale;
  const rightTorqueNm = state.rightTorqueNm * perpendicularScale;

  return {
    angleRadians,
    angularVelocityRadiansPerSecond,
    angularAccelerationRadiansPerSecondSquared,
    leftTorqueNm,
    rightTorqueNm,
    netTorqueNm: leftTorqueNm - rightTorqueNm,
    momentOfInertiaKgM2,
    reachedStop,
    stopSide,
  };
}

export function inspectLeverBalance(parameters: LeverBalanceParameters): ScienceIssue[] {
  const result = leverBalanceParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const state = solveLeverBalance(result.data);
  const issues: ScienceIssue[] = [];
  const massOutsideRange = state.requiredRightMassKg < 0.5 || state.requiredRightMassKg > 8;
  const distanceOutsideRange = state.requiredRightDistanceM < 0.2 || state.requiredRightDistanceM > 2;
  if (massOutsideRange || distanceOutsideRange) {
    issues.push({
      id: "solution-outside-range",
      severity: "warning",
      title: "The balancing value is outside the controls",
      detail: "Change the known load or lever arm before using this setup as an unknown-value question.",
      path: massOutsideRange ? "rightMassKg" : "rightDistanceM",
    });
  }
  issues.push({
    id: "lever-model-assumptions",
    severity: "assumption",
    title: "Ideal lever release",
    detail: "The beam starts horizontal, then rotates as an ideal low-mass beam with point loads until a perfectly inelastic mechanical stop at plus or minus 12 degrees.",
  });
  return issues;
}
