import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {clamp, degreesToRadians} from "@science-studio/simulation-core";
import {z} from "zod";

export const INCLINED_PLANE_TEMPLATE_ID = "mechanics.inclined-plane";
export const INCLINED_PLANE_TEMPLATE_VERSION = "0.1.0";

export const inclinedPlaneParametersSchema = z
  .object({
    angleDegrees: z.number().min(5).max(60),
    massKg: z.number().min(0).max(20),
    staticFrictionCoefficient: z.number().min(0).max(1.5),
    kineticFrictionCoefficient: z.number().min(0).max(1.5),
    gravityMs2: z.number().min(1).max(20),
    rampLengthM: z.number().min(2).max(20),
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

export type InclinedPlaneParameters = z.infer<
  typeof inclinedPlaneParametersSchema
>;

export type InclinedPlaneMotion = "stationary" | "sliding" | "complete";

export interface InclinedPlaneState {
  timeSeconds: number;
  motion: InclinedPlaneMotion;
  normalForceN: number;
  parallelForceN: number;
  frictionForceN: number;
  accelerationMs2: number;
  velocityMs: number;
  bottomVelocityMs: number;
  displacementM: number;
  criticalAngleDegrees: number;
  endTimeSeconds: number | null;
}

export const inclinedPlaneDefaults: InclinedPlaneParameters = {
  angleDegrees: 32,
  massKg: 2,
  staticFrictionCoefficient: 0.28,
  kineticFrictionCoefficient: 0.18,
  gravityMs2: 9.81,
  rampLengthM: 7,
};

export const inclinedPlaneTemplate: ExperimentTemplateContract = {
  id: INCLINED_PLANE_TEMPLATE_ID,
  version: INCLINED_PLANE_TEMPLATE_VERSION,
  catalog: {
    slug: "inclined-plane",
    title: "Inclined Plane & Friction",
    summary: "Resolve gravity and predict when a block begins to slide.",
    gradeLevel: "middle",
    subject: "mechanics",
    lessonMinutes: 12,
    concepts: ["Forces", "Friction", "Acceleration"],
  },
  learningObjectives: [
    "Identify gravity, normal force, and friction on a block on an incline.",
    "Resolve gravity into components parallel and perpendicular to the plane.",
    "Use static friction to predict whether the block moves.",
    "Relate net force, acceleration, ramp length, and final velocity.",
  ],
  parameterDefinitions: [
    {key: "angleDegrees", unit: "°", min: 5, max: 60, step: 1, requiredFor: "scene"},
    {key: "massKg", unit: "kg", min: 0, max: 20, step: 0.1, requiredFor: "model"},
    {key: "staticFrictionCoefficient", unit: "μs", min: 0, max: 1.5, step: 0.01, requiredFor: "model"},
    {key: "kineticFrictionCoefficient", unit: "μk", min: 0, max: 1.5, step: 0.01, requiredFor: "model"},
    {key: "gravityMs2", unit: "m/s²", min: 1, max: 20, step: 0.01, requiredFor: "model"},
    {key: "rampLengthM", unit: "m", min: 2, max: 20, step: 0.1, requiredFor: "scene"},
  ],
  measurementDefinitions: [
    {key: "accelerationMs2", unit: "m/s²", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "velocityMs", unit: "m/s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "displacementM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "normalForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "bottomVelocityMs", unit: "m/s", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "setup", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["setup"]},
    {id: "forces", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["forces"]},
    {id: "components", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["components"]},
    {id: "equation", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["equation"]},
    {id: "result", durationSeconds: 4, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["result"]},
  ],
  assumptions: [
    "Rigid block and fixed incline.",
    "Constant static and kinetic friction coefficients.",
    "No air drag, rolling, deformation, or motion beyond the ramp end.",
  ],
};

export function solveInclinedPlane(
  input: InclinedPlaneParameters,
  timeSeconds: number,
): InclinedPlaneState {
  const parameters = inclinedPlaneParametersSchema.parse(input);

  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const angleRadians = degreesToRadians(parameters.angleDegrees);
  const normalForceN =
    parameters.massKg * parameters.gravityMs2 * Math.cos(angleRadians);
  const parallelForceN =
    parameters.massKg * parameters.gravityMs2 * Math.sin(angleRadians);
  const maximumStaticFrictionN =
    parameters.staticFrictionCoefficient * normalForceN;
  const criticalAngleDegrees =
    (Math.atan(parameters.staticFrictionCoefficient) * 180) / Math.PI;
  const beginsSliding = parallelForceN > maximumStaticFrictionN;

  if (!beginsSliding || parameters.massKg === 0) {
    return {
      timeSeconds,
      motion: "stationary",
      normalForceN,
      parallelForceN,
      frictionForceN: parallelForceN,
      accelerationMs2: 0,
      velocityMs: 0,
      bottomVelocityMs: 0,
      displacementM: 0,
      criticalAngleDegrees,
      endTimeSeconds: null,
    };
  }

  const frictionForceN =
    parameters.kineticFrictionCoefficient * normalForceN;
  const accelerationMs2 =
    parameters.gravityMs2 *
    (Math.sin(angleRadians) -
      parameters.kineticFrictionCoefficient * Math.cos(angleRadians));
  const endTimeSeconds = Math.sqrt(
    (2 * parameters.rampLengthM) / accelerationMs2,
  );
  const bottomVelocityMs = Math.sqrt(
    2 * accelerationMs2 * parameters.rampLengthM,
  );
  const sampledTime = clamp(timeSeconds, 0, endTimeSeconds);
  const calculatedDisplacementM = clamp(
    0.5 * accelerationMs2 * sampledTime ** 2,
    0,
    parameters.rampLengthM,
  );
  const reachedEnd = timeSeconds >= endTimeSeconds;

  return {
    timeSeconds,
    motion: reachedEnd ? "complete" : "sliding",
    normalForceN,
    parallelForceN,
    frictionForceN,
    accelerationMs2,
    velocityMs: accelerationMs2 * sampledTime,
    bottomVelocityMs,
    displacementM: reachedEnd
      ? parameters.rampLengthM
      : calculatedDisplacementM,
    criticalAngleDegrees,
    endTimeSeconds,
  };
}

export function inspectInclinedPlane(
  parameters: InclinedPlaneParameters,
): ScienceIssue[] {
  const result = inclinedPlaneParametersSchema.safeParse(parameters);

  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "参数无法运行",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const state = solveInclinedPlane(result.data, 0);
  const issues: ScienceIssue[] = [];

  if (state.motion === "stationary") {
    issues.push({
      id: "stationary-condition",
      severity: "warning",
      title: "物体保持静止",
      detail: `当前角度未超过临界角 ${state.criticalAngleDegrees.toFixed(1)}°。`,
      path: "angleDegrees",
    });
  } else if (
    Math.abs(parameters.angleDegrees - state.criticalAngleDegrees) < 2
  ) {
    issues.push({
      id: "near-critical-angle",
      severity: "warning",
      title: "接近临界角",
      detail: "微小的角度或摩擦系数变化可能改变运动状态。",
      path: "angleDegrees",
    });
  }

  issues.push({
    id: "model-assumptions",
    severity: "assumption",
    title: "理想刚体模型",
    detail: "忽略空气阻力、滚动、接触面形变，并假设摩擦系数恒定。",
  });

  return issues;
}
