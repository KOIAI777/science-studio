import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const BUOYANCY_TEMPLATE_ID = "fluids.density-buoyancy";
export const BUOYANCY_TEMPLATE_VERSION = "0.1.0";
export const BUOYANCY_TANK_DEPTH_M = 0.9;
export const BUOYANCY_MAX_DURATION_SECONDS = 60;

const INITIAL_CENTER_POSITION_M = -0.55;
const INTEGRATION_STEP_SECONDS = 1 / 240;
const CUBE_DRAG_COEFFICIENT = 1.05;
const DENSITY_MATCH_RELATIVE_TOLERANCE = 0.002;
// Stop sub-pixel classroom motion once the cube is visibly at equilibrium.
const FLOATING_SLEEP_POSITION_TOLERANCE_M = 0.003;
const FLOATING_SLEEP_VELOCITY_TOLERANCE_MS = 0.03;
const FLOATING_SLEEP_FORCE_RATIO = 0.035;

export const buoyancyParametersSchema = z.object({
  massKg: z.number().finite().min(0.2).max(8),
  volumeLiters: z.number().finite().min(0.5).max(6),
  gravityMs2: z.number().finite().min(1).max(12),
  fluidDensityKgM3: z.number().finite().min(700).max(1300),
  comparisonFluidDensityKgM3: z.number().finite().min(700).max(1300),
  comparisonMode: z.boolean(),
  showForces: z.boolean(),
});

export type BuoyancyParameters = z.infer<typeof buoyancyParametersSchema>;
export type BuoyancyOutcome = "float" | "suspend" | "sink";
export type BuoyancyPhase = "rising" | "sinking" | "suspended" | "bobbing" | "floating" | "bottom";
export type BuoyancyTank = "primary" | "comparison";

export interface BuoyancyFluidProfile {
  fluidDensityKgM3: number;
  fullBuoyantForceN: number;
  densityRatio: number;
  equilibriumSubmergedFraction: number;
  predictedOutcome: BuoyancyOutcome;
  equilibriumCenterPositionM: number | null;
}

export interface BuoyancyProfile {
  parameters: BuoyancyParameters;
  objectVolumeM3: number;
  objectDensityKgM3: number;
  objectSideM: number;
  objectCrossSectionM2: number;
  weightN: number;
  primary: BuoyancyFluidProfile;
  comparison: BuoyancyFluidProfile;
}

export interface BuoyancyTankState extends BuoyancyFluidProfile {
  timeSeconds: number;
  centerPositionM: number;
  velocityMs: number;
  accelerationMs2: number;
  submergedFraction: number;
  displacedVolumeM3: number;
  buoyantForceN: number;
  dragForceN: number;
  normalForceN: number;
  netForceN: number;
  phase: BuoyancyPhase;
}

export interface BuoyancyState extends BuoyancyProfile {
  timeSeconds: number;
  primaryState: BuoyancyTankState;
  comparisonState: BuoyancyTankState;
}

export const buoyancyDefaults: BuoyancyParameters = {
  massKg: 0.9,
  volumeLiters: 1,
  gravityMs2: 9.81,
  fluidDensityKgM3: 1000,
  comparisonFluidDensityKgM3: 850,
  comparisonMode: true,
  showForces: true,
};

export const buoyancyTemplate: ExperimentTemplateContract = {
  id: BUOYANCY_TEMPLATE_ID,
  version: BUOYANCY_TEMPLATE_VERSION,
  catalog: {
    slug: "density-buoyancy",
    title: "Density & Buoyancy: Float, Sink or Suspend",
    summary: "Compare one object in two fluids and connect displaced volume to buoyant force.",
    gradeLevel: "middle",
    subject: "fluids",
    lessonMinutes: 15,
    concepts: ["Density", "Buoyant Force", "Displacement", "Archimedes' Principle"],
  },
  learningObjectives: [
    "Calculate object density from mass and volume.",
    "Use displaced volume to calculate buoyant force.",
    "Predict whether an immersed object rises, remains suspended, or sinks.",
    "Relate the equilibrium submerged fraction to the object-to-fluid density ratio.",
    "Compare the same object in two fluids without changing its mass or volume.",
  ],
  parameterDefinitions: [
    {key: "massKg", unit: "kg", min: 0.2, max: 8, step: 0.1, requiredFor: "model"},
    {key: "volumeLiters", unit: "L", min: 0.5, max: 6, step: 0.1, requiredFor: "model"},
    {key: "fluidDensityKgM3", unit: "kg/m³", min: 700, max: 1300, step: 10, requiredFor: "model"},
    {key: "comparisonFluidDensityKgM3", unit: "kg/m³", min: 700, max: 1300, step: 10, requiredFor: "model"},
    {key: "gravityMs2", unit: "m/s²", min: 1, max: 12, step: 0.01, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "objectDensityKgM3", unit: "kg/m³", digits: 0, visibleIn: ["experiment", "present"]},
    {key: "submergedFraction", unit: "%", digits: 0, visibleIn: ["experiment", "present"]},
    {key: "displacedVolumeLiters", unit: "L", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "buoyantForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "weightN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "netForceN", unit: "N", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "object-density", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["density"]},
    {id: "displaced-volume", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["displacement"]},
    {id: "forces", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["forces"]},
    {id: "predict", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["outcome"]},
    {id: "release", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["motion"]},
    {id: "compare", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["comparison"]},
  ],
  assumptions: [
    "The object is a rigid cube with uniform density and no trapped air.",
    "Each fluid is incompressible, uniform, still, and has a constant density.",
    "Buoyant force equals fluid density times displaced volume times gravity.",
    "A quadratic drag force opposes vertical motion; its coefficient is fixed for the cube.",
    "Surface tension, waves, splashing, rotation, and horizontal motion are excluded.",
  ],
};

function createFluidProfile(
  fluidDensityKgM3: number,
  objectDensityKgM3: number,
  objectVolumeM3: number,
  objectSideM: number,
  gravityMs2: number,
): BuoyancyFluidProfile {
  const densityRatio = objectDensityKgM3 / fluidDensityKgM3;
  const relativeDifference = Math.abs(objectDensityKgM3 - fluidDensityKgM3) / fluidDensityKgM3;
  const predictedOutcome: BuoyancyOutcome = relativeDifference <= DENSITY_MATCH_RELATIVE_TOLERANCE
    ? "suspend"
    : objectDensityKgM3 < fluidDensityKgM3 ? "float" : "sink";
  const equilibriumSubmergedFraction = Math.min(1, densityRatio);
  const equilibriumCenterPositionM = predictedOutcome === "float"
    ? objectSideM / 2 - equilibriumSubmergedFraction * objectSideM
    : predictedOutcome === "suspend" ? INITIAL_CENTER_POSITION_M : null;

  return {
    fluidDensityKgM3,
    fullBuoyantForceN: fluidDensityKgM3 * objectVolumeM3 * gravityMs2,
    densityRatio,
    equilibriumSubmergedFraction,
    predictedOutcome,
    equilibriumCenterPositionM,
  };
}

export function createBuoyancyProfile(input: BuoyancyParameters): BuoyancyProfile {
  const parameters = buoyancyParametersSchema.parse(input);
  const objectVolumeM3 = parameters.volumeLiters / 1000;
  const objectDensityKgM3 = parameters.massKg / objectVolumeM3;
  const objectSideM = Math.cbrt(objectVolumeM3);
  const objectCrossSectionM2 = objectSideM ** 2;
  const weightN = parameters.massKg * parameters.gravityMs2;

  return {
    parameters,
    objectVolumeM3,
    objectDensityKgM3,
    objectSideM,
    objectCrossSectionM2,
    weightN,
    primary: createFluidProfile(parameters.fluidDensityKgM3, objectDensityKgM3, objectVolumeM3, objectSideM, parameters.gravityMs2),
    comparison: createFluidProfile(parameters.comparisonFluidDensityKgM3, objectDensityKgM3, objectVolumeM3, objectSideM, parameters.gravityMs2),
  };
}

function submergedFraction(centerPositionM: number, objectSideM: number) {
  return Math.min(1, Math.max(0, (objectSideM / 2 - centerPositionM) / objectSideM));
}

function instantaneousForces(
  profile: BuoyancyProfile,
  fluid: BuoyancyFluidProfile,
  centerPositionM: number,
  velocityMs: number,
) {
  const fraction = submergedFraction(centerPositionM, profile.objectSideM);
  const displacedVolumeM3 = profile.objectVolumeM3 * fraction;
  const buoyantForceN = fluid.fluidDensityKgM3 * displacedVolumeM3 * profile.parameters.gravityMs2;
  const dragForceN = fraction > 0 && velocityMs !== 0
    ? -0.5 * fluid.fluidDensityKgM3 * CUBE_DRAG_COEFFICIENT * profile.objectCrossSectionM2 * fraction * velocityMs * Math.abs(velocityMs)
    : 0;
  return {fraction, displacedVolumeM3, buoyantForceN, dragForceN};
}

export function sampleBuoyancyTank(
  profile: BuoyancyProfile,
  tank: BuoyancyTank,
  timeSeconds: number,
): BuoyancyTankState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const fluid = profile[tank];
  const bottomCenterM = -BUOYANCY_TANK_DEPTH_M + profile.objectSideM / 2;
  let centerPositionM = INITIAL_CENTER_POSITION_M;
  let velocityMs = 0;
  let elapsed = 0;
  let onBottom = false;
  let sleepingAtSurface = false;

  while (elapsed < timeSeconds && !onBottom && !sleepingAtSurface) {
    const step = Math.min(INTEGRATION_STEP_SECONDS, timeSeconds - elapsed);
    const forces = instantaneousForces(profile, fluid, centerPositionM, velocityMs);
    const netForceN = forces.buoyantForceN - profile.weightN + forces.dragForceN;
    const accelerationMs2 = netForceN / profile.parameters.massKg;
    velocityMs += accelerationMs2 * step;
    centerPositionM += velocityMs * step;
    if (centerPositionM <= bottomCenterM) {
      centerPositionM = bottomCenterM;
      velocityMs = 0;
      onBottom = true;
    }
    if (fluid.predictedOutcome === "float" && fluid.equilibriumCenterPositionM !== null) {
      const nextForces = instantaneousForces(profile, fluid, centerPositionM, velocityMs);
      const nextNetForceN = nextForces.buoyantForceN - profile.weightN + nextForces.dragForceN;
      if (
        Math.abs(centerPositionM - fluid.equilibriumCenterPositionM) <= FLOATING_SLEEP_POSITION_TOLERANCE_M
        && Math.abs(velocityMs) <= FLOATING_SLEEP_VELOCITY_TOLERANCE_MS
        && Math.abs(nextNetForceN) <= profile.weightN * FLOATING_SLEEP_FORCE_RATIO
      ) {
        centerPositionM = fluid.equilibriumCenterPositionM;
        velocityMs = 0;
        sleepingAtSurface = true;
      }
    }
    elapsed += step;
  }

  const forces = instantaneousForces(profile, fluid, centerPositionM, velocityMs);
  let normalForceN = 0;
  let netForceN = forces.buoyantForceN - profile.weightN + forces.dragForceN;
  let accelerationMs2 = netForceN / profile.parameters.massKg;
  let phase: BuoyancyPhase;

  if (onBottom || centerPositionM <= bottomCenterM + 1e-9) {
    normalForceN = Math.max(0, profile.weightN - forces.buoyantForceN);
    netForceN = forces.buoyantForceN + normalForceN - profile.weightN;
    accelerationMs2 = 0;
    phase = "bottom";
  } else if (fluid.predictedOutcome === "suspend" && Math.abs(velocityMs) < 1e-6) {
    phase = "suspended";
  } else if (sleepingAtSurface) {
    phase = "floating";
  } else if (
    fluid.predictedOutcome === "float"
    && forces.fraction > 0
    && forces.fraction < 1
    && fluid.equilibriumCenterPositionM !== null
    && Math.abs(centerPositionM - fluid.equilibriumCenterPositionM) <= profile.objectSideM * 0.45
    && Math.abs(velocityMs) < 0.25
  ) {
    phase = "bobbing";
  } else if (velocityMs > 0.01 || (Math.abs(velocityMs) <= 0.01 && netForceN > 0)) {
    phase = "rising";
  } else {
    phase = "sinking";
  }

  return {
    ...fluid,
    timeSeconds,
    centerPositionM,
    velocityMs,
    accelerationMs2,
    submergedFraction: forces.fraction,
    displacedVolumeM3: forces.displacedVolumeM3,
    buoyantForceN: forces.buoyantForceN,
    dragForceN: forces.dragForceN,
    normalForceN,
    netForceN,
    phase,
  };
}

export function sampleBuoyancy(profile: BuoyancyProfile, timeSeconds: number): BuoyancyState {
  return {
    ...profile,
    timeSeconds,
    primaryState: sampleBuoyancyTank(profile, "primary", timeSeconds),
    comparisonState: sampleBuoyancyTank(profile, "comparison", timeSeconds),
  };
}

export function solveBuoyancy(input: BuoyancyParameters, timeSeconds = 0) {
  return sampleBuoyancy(createBuoyancyProfile(input), timeSeconds);
}

export function isBuoyancyTankAtRest(state: BuoyancyTankState) {
  if (Math.abs(state.velocityMs) > 1e-9 || Math.abs(state.netForceN) > 1e-7) return false;
  return state.phase === "bottom" || state.phase === "suspended" || state.phase === "floating";
}

export function getBuoyancyExperimentDuration(input: BuoyancyParameters) {
  const profile = createBuoyancyProfile(input);
  const sampleIntervalSeconds = 0.5;
  const endHoldSeconds = 0.5;

  for (let timeSeconds = sampleIntervalSeconds; timeSeconds <= BUOYANCY_MAX_DURATION_SECONDS; timeSeconds += sampleIntervalSeconds) {
    const state = sampleBuoyancy(profile, timeSeconds);
    const primaryAtRest = isBuoyancyTankAtRest(state.primaryState);
    const comparisonAtRest = !input.comparisonMode || isBuoyancyTankAtRest(state.comparisonState);
    if (primaryAtRest && comparisonAtRest) return timeSeconds + endHoldSeconds;
  }

  return BUOYANCY_MAX_DURATION_SECONDS;
}

export function inspectBuoyancy(parameters: BuoyancyParameters): ScienceIssue[] {
  const result = buoyancyParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createBuoyancyProfile(result.data);
  const issues: ScienceIssue[] = [];
  if (profile.objectDensityKgM3 > 5000) {
    issues.push({
      id: "high-object-density",
      severity: "warning",
      title: "Very dense object",
      detail: "The mass-to-volume ratio exceeds 5,000 kg/m³. Check that the classroom object is intended to represent a dense solid.",
      path: "massKg",
    });
  }
  if (result.data.comparisonMode && Math.abs(result.data.fluidDensityKgM3 - result.data.comparisonFluidDensityKgM3) < 5) {
    issues.push({
      id: "matching-fluids",
      severity: "warning",
      title: "The comparison fluids match",
      detail: "Choose different fluid densities to make the side-by-side comparison useful.",
      path: "comparisonFluidDensityKgM3",
    });
  }
  issues.push({
    id: "buoyancy-assumptions",
    severity: "assumption",
    title: "Idealized vertical buoyancy model",
    detail: "The cube stays upright in still, uniform fluid; surface tension, splashing, waves, rotation, and horizontal motion are ignored.",
  });
  return issues;
}
