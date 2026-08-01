import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const RAY_OPTICS_TEMPLATE_ID = "optics.refraction-tir";
export const RAY_OPTICS_TEMPLATE_VERSION = "0.1.0";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const ANGLE_EPSILON_DEGREES = 1e-9;

export const rayOpticsParametersSchema = z.object({
  incidentAngleDegrees: z.number().finite().min(0).max(89),
  refractiveIndex1: z.number().finite().min(1).max(2.5),
  refractiveIndex2: z.number().finite().min(1).max(2.5),
  showNormal: z.boolean(),
  showAngles: z.boolean(),
});

export type RayOpticsParameters = z.infer<typeof rayOpticsParametersSchema>;
export type RayOpticsRegime = "normal-incidence" | "refraction" | "critical" | "total-internal-reflection";

export interface RayOpticsState {
  parameters: RayOpticsParameters;
  regime: RayOpticsRegime;
  reflectionAngleDegrees: number;
  refractionAngleDegrees: number | null;
  criticalAngleDegrees: number | null;
  transmittedRay: boolean;
  bendsTowardNormal: boolean;
  bendsAwayFromNormal: boolean;
  incidentSineTerm: number;
  transmittedSineTerm: number | null;
  relativeLightSpeed1: number;
  relativeLightSpeed2: number;
}

export const rayOpticsDefaults: RayOpticsParameters = {
  incidentAngleDegrees: 45,
  refractiveIndex1: 1,
  refractiveIndex2: 1.5,
  showNormal: true,
  showAngles: true,
};

export const rayOpticsTemplate: ExperimentTemplateContract = {
  id: RAY_OPTICS_TEMPLATE_ID,
  version: RAY_OPTICS_TEMPLATE_VERSION,
  catalog: {
    slug: "refraction-total-internal-reflection",
    title: "Refraction & Total Internal Reflection",
    summary: "Trace reflection and refraction across an interface, then find the critical angle for total internal reflection.",
    gradeLevel: "middle",
    subject: "optics",
    lessonMinutes: 15,
    concepts: ["Reflection", "Refraction", "Snell's Law", "Critical Angle"],
  },
  learningObjectives: [
    "Measure incidence, reflection, and refraction angles from the normal.",
    "Apply the law of reflection and Snell's law to predict ray directions.",
    "Explain why light bends toward the normal in a higher-index medium and away from it in a lower-index medium.",
    "Calculate the critical angle when light travels from a higher-index medium to a lower-index medium.",
    "Distinguish the critical-angle condition from total internal reflection beyond that angle.",
  ],
  parameterDefinitions: [
    {key: "incidentAngleDegrees", unit: "deg", min: 0, max: 89, step: 1, requiredFor: "model"},
    {key: "refractiveIndex1", unit: "", min: 1, max: 2.5, step: 0.01, requiredFor: "model"},
    {key: "refractiveIndex2", unit: "", min: 1, max: 2.5, step: 0.01, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "reflectionAngleDegrees", unit: "deg", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "refractionAngleDegrees", unit: "deg", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "criticalAngleDegrees", unit: "deg", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "relativeLightSpeed1", unit: "c", digits: 3, visibleIn: ["experiment", "present"]},
    {key: "relativeLightSpeed2", unit: "c", digits: 3, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "interface", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["interface"]},
    {id: "angles", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["normal", "angles"]},
    {id: "reflection", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["reflection"]},
    {id: "snell", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["refraction", "snell"]},
    {id: "critical-angle", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["critical"]},
    {id: "tir", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["tir"]},
  ],
  assumptions: [
    "Both media are transparent, homogeneous, isotropic, and separated by a flat boundary.",
    "Angles are measured from the normal, not from the interface.",
    "The diagram models ray direction only; wavelength, polarization, absorption, dispersion, and Fresnel intensity coefficients are excluded.",
    "The drawing sequence is for instruction and is not a light-travel-time simulation.",
  ],
};

function toDegrees(radians: number) {
  return radians * RAD_TO_DEG;
}

export function getCriticalAngleDegrees(refractiveIndex1: number, refractiveIndex2: number) {
  if (refractiveIndex1 <= refractiveIndex2) return null;
  return toDegrees(Math.asin(refractiveIndex2 / refractiveIndex1));
}

export function solveRayOptics(input: RayOpticsParameters): RayOpticsState {
  const parameters = rayOpticsParametersSchema.parse(input);
  const {incidentAngleDegrees, refractiveIndex1: n1, refractiveIndex2: n2} = parameters;
  const incidentRadians = incidentAngleDegrees * DEG_TO_RAD;
  const criticalAngleDegrees = getCriticalAngleDegrees(n1, n2);
  const transmittedSine = n1 / n2 * Math.sin(incidentRadians);
  const atCriticalAngle = criticalAngleDegrees !== null
    && Math.abs(incidentAngleDegrees - criticalAngleDegrees) <= ANGLE_EPSILON_DEGREES;
  const totalInternalReflection = criticalAngleDegrees !== null
    && incidentAngleDegrees > criticalAngleDegrees + ANGLE_EPSILON_DEGREES;

  let refractionAngleDegrees: number | null;
  let regime: RayOpticsRegime;
  if (totalInternalReflection || transmittedSine > 1 + Number.EPSILON) {
    refractionAngleDegrees = null;
    regime = "total-internal-reflection";
  } else if (atCriticalAngle || Math.abs(transmittedSine - 1) <= Number.EPSILON * 8) {
    refractionAngleDegrees = 90;
    regime = "critical";
  } else {
    refractionAngleDegrees = toDegrees(Math.asin(Math.max(-1, Math.min(1, transmittedSine))));
    regime = incidentAngleDegrees === 0 ? "normal-incidence" : "refraction";
  }

  return {
    parameters,
    regime,
    reflectionAngleDegrees: incidentAngleDegrees,
    refractionAngleDegrees,
    criticalAngleDegrees,
    transmittedRay: refractionAngleDegrees !== null,
    bendsTowardNormal: refractionAngleDegrees !== null && refractionAngleDegrees < incidentAngleDegrees - ANGLE_EPSILON_DEGREES,
    bendsAwayFromNormal: refractionAngleDegrees !== null && refractionAngleDegrees > incidentAngleDegrees + ANGLE_EPSILON_DEGREES,
    incidentSineTerm: n1 * Math.sin(incidentRadians),
    transmittedSineTerm: refractionAngleDegrees === null ? null : n2 * Math.sin(refractionAngleDegrees * DEG_TO_RAD),
    relativeLightSpeed1: 1 / n1,
    relativeLightSpeed2: 1 / n2,
  };
}

export function inspectRayOptics(parameters: RayOpticsParameters): ScienceIssue[] {
  const result = rayOpticsParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const state = solveRayOptics(result.data);
  const issues: ScienceIssue[] = [];
  if (Math.abs(result.data.refractiveIndex1 - result.data.refractiveIndex2) < 1e-12) {
    issues.push({
      id: "matched-indices",
      severity: "warning",
      title: "The ray will not bend",
      detail: "Both media have the same refractive index, so the transmitted angle equals the incident angle.",
      path: "refractiveIndex2",
    });
  }
  if (state.regime === "total-internal-reflection") {
    issues.push({
      id: "total-internal-reflection",
      severity: "warning",
      title: "No transmitted ray",
      detail: "The incident angle is greater than the critical angle, so the ideal ray is totally internally reflected.",
      path: "incidentAngleDegrees",
    });
  }
  issues.push({
    id: "ray-model-assumptions",
    severity: "assumption",
    title: "Ideal geometric-optics model",
    detail: "The boundary is flat and both media are uniform. Ray brightness is qualitative because Fresnel intensity coefficients are not modeled.",
  });
  return issues;
}
