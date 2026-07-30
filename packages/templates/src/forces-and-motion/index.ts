import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const FORCES_MOTION_TEMPLATE_ID = "mechanics.forces-and-motion";
export const FORCES_MOTION_TEMPLATE_VERSION = "0.1.0";

export const forcesMotionParametersSchema = z
  .object({
    massKg: z.number().min(0.5).max(20),
    appliedForceN: z.number().min(-100).max(100),
    staticFrictionCoefficient: z.number().min(0).max(1),
    kineticFrictionCoefficient: z.number().min(0).max(1),
    gravityMs2: z.number().min(1).max(20),
    forceDurationSeconds: z.number().min(0).max(5),
  })
  .superRefine((parameters, context) => {
    if (
      parameters.kineticFrictionCoefficient >
      parameters.staticFrictionCoefficient
    ) {
      context.addIssue({
        code: "custom",
        message: "动摩擦系数不能大于静摩擦系数",
        path: ["kineticFrictionCoefficient"],
      });
    }
  });

export type ForcesMotionParameters = z.infer<
  typeof forcesMotionParametersSchema
>;

export type ForcesMotionDirection = -1 | 0 | 1;
export type ForcesMotionPhase =
  | "held"
  | "driven"
  | "braking"
  | "coasting"
  | "stopped";
export type ForcesMotionFrictionRegime = "static" | "kinetic" | "none";

export interface ForcesMotionProfile {
  parameters: ForcesMotionParameters;
  direction: ForcesMotionDirection;
  exceedsStaticThreshold: boolean;
  willMove: boolean;
  normalForceN: number;
  maximumStaticFrictionN: number;
  kineticFrictionMagnitudeN: number;
  drivenAccelerationMs2: number;
  releaseVelocityMs: number;
  releaseDisplacementM: number;
  stopTimeSeconds: number | null;
  finalDisplacementM: number | null;
}

export interface ForcesMotionState {
  timeSeconds: number;
  phase: ForcesMotionPhase;
  frictionRegime: ForcesMotionFrictionRegime;
  appliedForceActive: boolean;
  appliedForceN: number;
  frictionForceN: number;
  netForceN: number;
  weightForceN: number;
  normalForceN: number;
  maximumStaticFrictionN: number;
  accelerationMs2: number;
  velocityMs: number;
  displacementM: number;
  forceReleaseTimeSeconds: number;
  stopTimeSeconds: number | null;
}

export const forcesMotionDefaults: ForcesMotionParameters = {
  massKg: 5,
  appliedForceN: 25,
  staticFrictionCoefficient: 0.35,
  kineticFrictionCoefficient: 0.25,
  gravityMs2: 9.81,
  forceDurationSeconds: 2,
};

export const forcesMotionTemplate: ExperimentTemplateContract = {
  id: FORCES_MOTION_TEMPLATE_ID,
  version: FORCES_MOTION_TEMPLATE_VERSION,
  catalog: {
    slug: "forces-and-motion",
    title: "Forces & Motion",
    summary: "Balance friction, find the net force, and follow the motion after a push ends.",
    gradeLevel: "middle",
    subject: "mechanics",
    lessonMinutes: 10,
    concepts: ["Net Force", "Friction", "Newton's Second Law"],
  },
  learningObjectives: [
    "Identify weight, normal force, applied force, and friction on a horizontal surface.",
    "Use the static-friction limit to predict whether an object begins to move.",
    "Relate net force, mass, and acceleration with Newton's second law.",
    "Explain how kinetic friction changes motion after the applied force ends.",
  ],
  parameterDefinitions: [
    {key: "massKg", unit: "kg", min: 0.5, max: 20, step: 0.1, requiredFor: "model"},
    {key: "appliedForceN", unit: "N", min: -100, max: 100, step: 1, requiredFor: "model"},
    {key: "staticFrictionCoefficient", unit: "μs", min: 0, max: 1, step: 0.01, requiredFor: "model"},
    {key: "kineticFrictionCoefficient", unit: "μk", min: 0, max: 1, step: 0.01, requiredFor: "model"},
    {key: "gravityMs2", unit: "m/s²", min: 1, max: 20, step: 0.01, requiredFor: "model"},
    {key: "forceDurationSeconds", unit: "s", min: 0, max: 5, step: 0.1, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "appliedForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "frictionForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "netForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "weightForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "normalForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "accelerationMs2", unit: "m/s²", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "velocityMs", unit: "m/s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "displacementM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "setup", durationSeconds: 1, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["setup"]},
    {id: "forces", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["forces"]},
    {id: "threshold", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["threshold"]},
    {id: "net-force", durationSeconds: 1, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["equation"]},
    {id: "motion", durationSeconds: 3, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["motion"]},
    {id: "graphs", durationSeconds: 1, simulationMode: "hold", simulationTimeSeconds: 2, highlights: ["graphs"]},
  ],
  assumptions: [
    "Rigid object on a fixed horizontal surface.",
    "Constant static and kinetic friction coefficients.",
    "No air drag, rolling, deformation, collision, or scene boundary.",
  ],
};

function directionOf(value: number): ForcesMotionDirection {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

export function createForcesMotionProfile(
  input: ForcesMotionParameters,
): ForcesMotionProfile {
  const parameters = forcesMotionParametersSchema.parse(input);
  const direction = directionOf(parameters.appliedForceN);
  const forceMagnitudeN = Math.abs(parameters.appliedForceN);
  const normalForceN = parameters.massKg * parameters.gravityMs2;
  const maximumStaticFrictionN =
    parameters.staticFrictionCoefficient * normalForceN;
  const kineticFrictionMagnitudeN =
    parameters.kineticFrictionCoefficient * normalForceN;
  const exceedsStaticThreshold = forceMagnitudeN > maximumStaticFrictionN;
  const willMove =
    exceedsStaticThreshold && parameters.forceDurationSeconds > 0;

  if (!willMove) {
    return {
      parameters,
      direction,
      exceedsStaticThreshold,
      willMove,
      normalForceN,
      maximumStaticFrictionN,
      kineticFrictionMagnitudeN,
      drivenAccelerationMs2: 0,
      releaseVelocityMs: 0,
      releaseDisplacementM: 0,
      stopTimeSeconds: 0,
      finalDisplacementM: 0,
    };
  }

  const drivenAccelerationMagnitudeMs2 =
    (forceMagnitudeN - kineticFrictionMagnitudeN) / parameters.massKg;
  const drivenAccelerationMs2 =
    direction * drivenAccelerationMagnitudeMs2;
  const releaseVelocityMs =
    drivenAccelerationMs2 * parameters.forceDurationSeconds;
  const releaseDisplacementM =
    0.5 * drivenAccelerationMs2 * parameters.forceDurationSeconds ** 2;

  if (parameters.kineticFrictionCoefficient === 0) {
    return {
      parameters,
      direction,
      exceedsStaticThreshold,
      willMove,
      normalForceN,
      maximumStaticFrictionN,
      kineticFrictionMagnitudeN,
      drivenAccelerationMs2,
      releaseVelocityMs,
      releaseDisplacementM,
      stopTimeSeconds: null,
      finalDisplacementM: null,
    };
  }

  const brakingAccelerationMagnitudeMs2 =
    parameters.kineticFrictionCoefficient * parameters.gravityMs2;
  const brakingDurationSeconds =
    Math.abs(releaseVelocityMs) / brakingAccelerationMagnitudeMs2;
  const stopTimeSeconds =
    parameters.forceDurationSeconds + brakingDurationSeconds;
  const brakingDisplacementMagnitudeM =
    releaseVelocityMs ** 2 / (2 * brakingAccelerationMagnitudeMs2);
  const finalDisplacementM = releaseDisplacementM +
    direction * brakingDisplacementMagnitudeM;

  return {
    parameters,
    direction,
    exceedsStaticThreshold,
    willMove,
    normalForceN,
    maximumStaticFrictionN,
    kineticFrictionMagnitudeN,
    drivenAccelerationMs2,
    releaseVelocityMs,
    releaseDisplacementM,
    stopTimeSeconds,
    finalDisplacementM,
  };
}

export function sampleForcesMotion(
  profile: ForcesMotionProfile,
  timeSeconds: number,
): ForcesMotionState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const parameters = profile.parameters;
  const forceReleaseTimeSeconds = parameters.forceDurationSeconds;
  const appliedForceActive = timeSeconds < forceReleaseTimeSeconds;
  const weightForceN = profile.normalForceN;
  const baseState = {
    timeSeconds,
    weightForceN,
    normalForceN: profile.normalForceN,
    maximumStaticFrictionN: profile.maximumStaticFrictionN,
    forceReleaseTimeSeconds,
    stopTimeSeconds: profile.stopTimeSeconds,
  };

  if (!profile.willMove) {
    if (appliedForceActive) {
      return {
        ...baseState,
        phase: "held",
        frictionRegime: "static",
        appliedForceActive: true,
        appliedForceN: parameters.appliedForceN,
        frictionForceN: -parameters.appliedForceN,
        netForceN: 0,
        accelerationMs2: 0,
        velocityMs: 0,
        displacementM: 0,
      };
    }

    return {
      ...baseState,
      phase: "stopped",
      frictionRegime: "none",
      appliedForceActive: false,
      appliedForceN: 0,
      frictionForceN: 0,
      netForceN: 0,
      accelerationMs2: 0,
      velocityMs: 0,
      displacementM: 0,
    };
  }

  if (appliedForceActive) {
    const frictionForceN =
      -profile.direction * profile.kineticFrictionMagnitudeN;
    return {
      ...baseState,
      phase: "driven",
      frictionRegime: "kinetic",
      appliedForceActive: true,
      appliedForceN: parameters.appliedForceN,
      frictionForceN,
      netForceN: parameters.appliedForceN + frictionForceN,
      accelerationMs2: profile.drivenAccelerationMs2,
      velocityMs: profile.drivenAccelerationMs2 * timeSeconds,
      displacementM: 0.5 * profile.drivenAccelerationMs2 * timeSeconds ** 2,
    };
  }

  const elapsedAfterReleaseSeconds =
    timeSeconds - forceReleaseTimeSeconds;

  if (parameters.kineticFrictionCoefficient === 0) {
    return {
      ...baseState,
      phase: "coasting",
      frictionRegime: "none",
      appliedForceActive: false,
      appliedForceN: 0,
      frictionForceN: 0,
      netForceN: 0,
      accelerationMs2: 0,
      velocityMs: profile.releaseVelocityMs,
      displacementM: profile.releaseDisplacementM +
        profile.releaseVelocityMs * elapsedAfterReleaseSeconds,
    };
  }

  if (
    profile.stopTimeSeconds !== null &&
    timeSeconds < profile.stopTimeSeconds
  ) {
    const brakingAccelerationMagnitudeMs2 =
      parameters.kineticFrictionCoefficient * parameters.gravityMs2;
    const releaseSpeedMs = Math.abs(profile.releaseVelocityMs);
    const speedMs = Math.max(
      releaseSpeedMs -
        brakingAccelerationMagnitudeMs2 * elapsedAfterReleaseSeconds,
      0,
    );
    const displacementAfterReleaseMagnitudeM =
      releaseSpeedMs * elapsedAfterReleaseSeconds -
      0.5 * brakingAccelerationMagnitudeMs2 *
        elapsedAfterReleaseSeconds ** 2;
    const frictionForceN =
      -profile.direction * profile.kineticFrictionMagnitudeN;

    return {
      ...baseState,
      phase: "braking",
      frictionRegime: "kinetic",
      appliedForceActive: false,
      appliedForceN: 0,
      frictionForceN,
      netForceN: frictionForceN,
      accelerationMs2:
        -profile.direction * brakingAccelerationMagnitudeMs2,
      velocityMs: profile.direction * speedMs,
      displacementM: profile.releaseDisplacementM +
        profile.direction * displacementAfterReleaseMagnitudeM,
    };
  }

  return {
    ...baseState,
    phase: "stopped",
    frictionRegime: "none",
    appliedForceActive: false,
    appliedForceN: 0,
    frictionForceN: 0,
    netForceN: 0,
    accelerationMs2: 0,
    velocityMs: 0,
    displacementM: profile.finalDisplacementM ??
      profile.releaseDisplacementM,
  };
}

export function solveForcesMotion(
  input: ForcesMotionParameters,
  timeSeconds: number,
) {
  return sampleForcesMotion(createForcesMotionProfile(input), timeSeconds);
}

export function inspectForcesMotion(
  parameters: ForcesMotionParameters,
): ScienceIssue[] {
  const result = forcesMotionParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "参数无法运行",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createForcesMotionProfile(result.data);
  const issues: ScienceIssue[] = [];

  if (result.data.forceDurationSeconds === 0) {
    issues.push({
      id: "zero-force-duration",
      severity: "warning",
      title: "外力没有作用时间",
      detail: "持续时间为零时不会产生冲量，物体保持静止。",
      path: "forceDurationSeconds",
    });
  } else if (!profile.exceedsStaticThreshold) {
    issues.push({
      id: "static-equilibrium",
      severity: "warning",
      title: "静摩擦力平衡外力",
      detail: `外力未超过最大静摩擦力 ${profile.maximumStaticFrictionN.toFixed(2)} N。`,
      path: "appliedForceN",
    });
  } else {
    const breakawayMarginN =
      Math.abs(result.data.appliedForceN) - profile.maximumStaticFrictionN;
    const nearThresholdToleranceN = Math.max(
      0.1,
      profile.maximumStaticFrictionN * 0.05,
    );
    if (breakawayMarginN <= nearThresholdToleranceN) {
      issues.push({
        id: "near-static-threshold",
        severity: "warning",
        title: "接近静摩擦阈值",
        detail: "微小的外力或摩擦系数变化可能改变物体是否开始运动。",
        path: "appliedForceN",
      });
    }
  }

  issues.push({
    id: "forces-motion-assumptions",
    severity: "assumption",
    title: "理想一维平动模型",
    detail: "忽略空气阻力、滚动、形变、碰撞和场景边界，并假设摩擦系数恒定。",
  });

  return issues;
}
