import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const MOMENTUM_COLLISION_TEMPLATE_ID = "mechanics.momentum-collision";
export const MOMENTUM_COLLISION_TEMPLATE_VERSION = "0.1.0";
export const COLLISION_CART_LENGTH_M = 1;
export const COLLISION_INITIAL_POSITION_1_M = -3.2;
export const COLLISION_INITIAL_POSITION_2_M = 3.2;
export const COLLISION_MAX_DURATION_SECONDS = 20;

const COLLISION_HIGHLIGHT_SECONDS = 0.08;

export const momentumCollisionParametersSchema = z.object({
  mass1Kg: z.number().finite().min(0.5).max(5),
  mass2Kg: z.number().finite().min(0.5).max(5),
  initialVelocity1Ms: z.number().finite().min(-3).max(4),
  initialVelocity2Ms: z.number().finite().min(-3).max(4),
  restitutionCoefficient: z.number().finite().min(0).max(1),
  showVelocityVectors: z.boolean(),
});

export type MomentumCollisionParameters = z.infer<typeof momentumCollisionParametersSchema>;
export type CollisionPhase = "approaching" | "impact" | "separating" | "joined" | "no-collision";
export type CollisionKind = "elastic" | "inelastic" | "perfectly-inelastic";

export interface MomentumCollisionProfile {
  parameters: MomentumCollisionParameters;
  collisionTimeSeconds: number | null;
  collisionPosition1M: number | null;
  collisionPosition2M: number | null;
  finalVelocity1Ms: number;
  finalVelocity2Ms: number;
  initialMomentum1KgMs: number;
  initialMomentum2KgMs: number;
  initialTotalMomentumKgMs: number;
  finalMomentum1KgMs: number;
  finalMomentum2KgMs: number;
  finalTotalMomentumKgMs: number;
  initialKineticEnergyJ: number;
  finalKineticEnergyJ: number;
  kineticEnergyChangeJ: number;
  kineticEnergyLossPercent: number;
  impulseOn1Ns: number;
  impulseOn2Ns: number;
  collisionKind: CollisionKind;
}

export interface MomentumCollisionState extends MomentumCollisionProfile {
  timeSeconds: number;
  position1M: number;
  position2M: number;
  velocity1Ms: number;
  velocity2Ms: number;
  momentum1KgMs: number;
  momentum2KgMs: number;
  totalMomentumKgMs: number;
  kineticEnergyJ: number;
  phase: CollisionPhase;
  collisionOccurred: boolean;
}

export const momentumCollisionDefaults: MomentumCollisionParameters = {
  mass1Kg: 1.2,
  mass2Kg: 0.8,
  initialVelocity1Ms: 2.2,
  initialVelocity2Ms: -0.8,
  restitutionCoefficient: 0.6,
  showVelocityVectors: true,
};

export const momentumCollisionTemplate: ExperimentTemplateContract = {
  id: MOMENTUM_COLLISION_TEMPLATE_ID,
  version: MOMENTUM_COLLISION_TEMPLATE_VERSION,
  catalog: {
    slug: "momentum-collisions",
    title: "Momentum & Collisions",
    summary: "Compare elastic and inelastic cart collisions using momentum, impulse, and kinetic energy.",
    gradeLevel: "middle",
    subject: "mechanics",
    lessonMinutes: 15,
    concepts: ["Momentum", "Impulse", "Collisions", "Energy Transfer"],
  },
  learningObjectives: [
    "Calculate the momentum of each cart and the total momentum of the two-cart system.",
    "Use momentum conservation and the coefficient of restitution to predict final velocities.",
    "Compare elastic, partially inelastic, and perfectly inelastic collisions.",
    "Relate the equal and opposite impulses to each cart's change in momentum.",
    "Distinguish momentum conservation from kinetic-energy conservation.",
  ],
  parameterDefinitions: [
    {key: "mass1Kg", unit: "kg", min: 0.5, max: 5, step: 0.1, requiredFor: "model"},
    {key: "mass2Kg", unit: "kg", min: 0.5, max: 5, step: 0.1, requiredFor: "model"},
    {key: "initialVelocity1Ms", unit: "m/s", min: -3, max: 4, step: 0.1, requiredFor: "model"},
    {key: "initialVelocity2Ms", unit: "m/s", min: -3, max: 4, step: 0.1, requiredFor: "model"},
    {key: "restitutionCoefficient", unit: "", min: 0, max: 1, step: 0.1, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "totalMomentumKgMs", unit: "kg·m/s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "kineticEnergyJ", unit: "J", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "finalVelocity1Ms", unit: "m/s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "finalVelocity2Ms", unit: "m/s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "impulseOn1Ns", unit: "N·s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "kineticEnergyChangeJ", unit: "J", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "initial-state", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["initial"]},
    {id: "system-momentum", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["momentum"]},
    {id: "collision-type", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["restitution"]},
    {id: "predict", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["prediction"]},
    {id: "impact", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["impact", "impulse"]},
    {id: "compare", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["comparison", "energy"]},
  ],
  assumptions: [
    "Both carts are rigid bodies constrained to one-dimensional translation on a horizontal frictionless track.",
    "The collision is instantaneous and represented by a coefficient of restitution between 0 and 1.",
    "External horizontal impulse, rolling resistance, air drag, rotation, deformation, and sound are excluded.",
    "System momentum is conserved; kinetic energy is conserved only when the restitution coefficient equals 1.",
  ],
};

function kineticEnergy(massKg: number, velocityMs: number) {
  return 0.5 * massKg * velocityMs ** 2;
}

function collisionKind(restitutionCoefficient: number): CollisionKind {
  if (restitutionCoefficient === 1) return "elastic";
  if (restitutionCoefficient === 0) return "perfectly-inelastic";
  return "inelastic";
}

export function createMomentumCollisionProfile(input: MomentumCollisionParameters): MomentumCollisionProfile {
  const parameters = momentumCollisionParametersSchema.parse(input);
  const {
    mass1Kg: m1,
    mass2Kg: m2,
    initialVelocity1Ms: u1,
    initialVelocity2Ms: u2,
    restitutionCoefficient: e,
  } = parameters;
  const relativeApproachSpeed = u1 - u2;
  const initialGapM = COLLISION_INITIAL_POSITION_2_M - COLLISION_INITIAL_POSITION_1_M - COLLISION_CART_LENGTH_M;
  const collisionTimeSeconds = relativeApproachSpeed > 0 ? initialGapM / relativeApproachSpeed : null;
  const collisionPosition1M = collisionTimeSeconds === null ? null : COLLISION_INITIAL_POSITION_1_M + u1 * collisionTimeSeconds;
  const collisionPosition2M = collisionTimeSeconds === null ? null : COLLISION_INITIAL_POSITION_2_M + u2 * collisionTimeSeconds;

  const initialTotalMomentumKgMs = m1 * u1 + m2 * u2;
  const finalVelocity1Ms = collisionTimeSeconds === null
    ? u1
    : (initialTotalMomentumKgMs - m2 * e * (u1 - u2)) / (m1 + m2);
  const finalVelocity2Ms = collisionTimeSeconds === null
    ? u2
    : (initialTotalMomentumKgMs + m1 * e * (u1 - u2)) / (m1 + m2);
  const initialKineticEnergyJ = kineticEnergy(m1, u1) + kineticEnergy(m2, u2);
  const finalKineticEnergyJ = kineticEnergy(m1, finalVelocity1Ms) + kineticEnergy(m2, finalVelocity2Ms);
  const kineticEnergyChangeJ = finalKineticEnergyJ - initialKineticEnergyJ;

  return {
    parameters,
    collisionTimeSeconds,
    collisionPosition1M,
    collisionPosition2M,
    finalVelocity1Ms,
    finalVelocity2Ms,
    initialMomentum1KgMs: m1 * u1,
    initialMomentum2KgMs: m2 * u2,
    initialTotalMomentumKgMs,
    finalMomentum1KgMs: m1 * finalVelocity1Ms,
    finalMomentum2KgMs: m2 * finalVelocity2Ms,
    finalTotalMomentumKgMs: m1 * finalVelocity1Ms + m2 * finalVelocity2Ms,
    initialKineticEnergyJ,
    finalKineticEnergyJ,
    kineticEnergyChangeJ,
    kineticEnergyLossPercent: initialKineticEnergyJ === 0 ? 0 : Math.max(0, -kineticEnergyChangeJ / initialKineticEnergyJ * 100),
    impulseOn1Ns: m1 * (finalVelocity1Ms - u1),
    impulseOn2Ns: m2 * (finalVelocity2Ms - u2),
    collisionKind: collisionKind(e),
  };
}

export function sampleMomentumCollision(profile: MomentumCollisionProfile, timeSeconds: number): MomentumCollisionState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const collisionTime = profile.collisionTimeSeconds;
  const collisionOccurred = collisionTime !== null && timeSeconds >= collisionTime;
  const impactVisible = collisionTime !== null && Math.abs(timeSeconds - collisionTime) <= COLLISION_HIGHLIGHT_SECONDS;
  const elapsedAfterCollision = collisionTime === null ? 0 : Math.max(0, timeSeconds - collisionTime);
  const velocity1Ms = collisionOccurred ? profile.finalVelocity1Ms : profile.parameters.initialVelocity1Ms;
  const velocity2Ms = collisionOccurred ? profile.finalVelocity2Ms : profile.parameters.initialVelocity2Ms;
  const position1M = collisionOccurred
    ? (profile.collisionPosition1M as number) + profile.finalVelocity1Ms * elapsedAfterCollision
    : COLLISION_INITIAL_POSITION_1_M + profile.parameters.initialVelocity1Ms * timeSeconds;
  const position2M = collisionOccurred
    ? (profile.collisionPosition2M as number) + profile.finalVelocity2Ms * elapsedAfterCollision
    : COLLISION_INITIAL_POSITION_2_M + profile.parameters.initialVelocity2Ms * timeSeconds;

  let phase: CollisionPhase;
  if (collisionTime === null) phase = "no-collision";
  else if (impactVisible) phase = "impact";
  else if (!collisionOccurred) phase = "approaching";
  else if (profile.parameters.restitutionCoefficient === 0) phase = "joined";
  else phase = "separating";

  return {
    ...profile,
    timeSeconds,
    position1M,
    position2M,
    velocity1Ms,
    velocity2Ms,
    momentum1KgMs: profile.parameters.mass1Kg * velocity1Ms,
    momentum2KgMs: profile.parameters.mass2Kg * velocity2Ms,
    totalMomentumKgMs: profile.initialTotalMomentumKgMs,
    kineticEnergyJ: kineticEnergy(profile.parameters.mass1Kg, velocity1Ms) + kineticEnergy(profile.parameters.mass2Kg, velocity2Ms),
    phase,
    collisionOccurred,
  };
}

export function solveMomentumCollision(input: MomentumCollisionParameters, timeSeconds = 0) {
  return sampleMomentumCollision(createMomentumCollisionProfile(input), timeSeconds);
}

export function getMomentumCollisionExperimentDuration(input: MomentumCollisionParameters) {
  const profile = createMomentumCollisionProfile(input);
  if (profile.collisionTimeSeconds === null) return 6;
  if (profile.collisionTimeSeconds >= COLLISION_MAX_DURATION_SECONDS - 1) return COLLISION_MAX_DURATION_SECONDS;
  const fastestFinalSpeed = Math.max(Math.abs(profile.finalVelocity1Ms), Math.abs(profile.finalVelocity2Ms), 0.1);
  const postCollisionSeconds = Math.max(1.8, Math.min(3.5, 4.2 / fastestFinalSpeed));
  return Math.min(COLLISION_MAX_DURATION_SECONDS, profile.collisionTimeSeconds + postCollisionSeconds);
}

export function inspectMomentumCollision(parameters: MomentumCollisionParameters): ScienceIssue[] {
  const result = momentumCollisionParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createMomentumCollisionProfile(result.data);
  const issues: ScienceIssue[] = [];
  if (profile.collisionTimeSeconds === null) {
    issues.push({
      id: "no-collision",
      severity: "warning",
      title: "The carts will not collide",
      detail: "Cart 1 must move toward Cart 2 faster than Cart 2 moves away. Increase u1 or reduce u2.",
      path: "initialVelocity1Ms",
    });
  } else if (profile.collisionTimeSeconds > COLLISION_MAX_DURATION_SECONDS) {
    issues.push({
      id: "late-collision",
      severity: "warning",
      title: "Impact is outside the visible timeline",
      detail: `At these speeds, contact occurs after ${profile.collisionTimeSeconds.toFixed(1)} s. Increase the relative approach speed to show the collision.`,
      path: "initialVelocity1Ms",
    });
  }
  issues.push({
    id: "collision-assumptions",
    severity: "assumption",
    title: "Ideal one-dimensional collision",
    detail: "The track is horizontal and frictionless, and the impact is instantaneous. Rotation, deformation, sound, and external horizontal forces are excluded.",
  });
  return issues;
}
