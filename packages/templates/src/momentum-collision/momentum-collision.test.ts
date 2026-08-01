import {describe, expect, it} from "vitest";
import {
  COLLISION_CART_LENGTH_M,
  createMomentumCollisionProfile,
  getMomentumCollisionExperimentDuration,
  inspectMomentumCollision,
  momentumCollisionDefaults,
  momentumCollisionParametersSchema,
  sampleMomentumCollision,
  solveMomentumCollision,
} from "./index";

const closeTo = (actual: number, expected: number, digits = 10) => expect(actual).toBeCloseTo(expected, digits);

describe("momentum collision model", () => {
  it("accepts the classroom defaults", () => {
    expect(momentumCollisionParametersSchema.safeParse(momentumCollisionDefaults).success).toBe(true);
  });

  it("places the carts in contact at the analytical collision time", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    expect(profile.collisionTimeSeconds).not.toBeNull();
    closeTo((profile.collisionPosition2M as number) - (profile.collisionPosition1M as number), COLLISION_CART_LENGTH_M);
  });

  it("conserves total momentum for a partially inelastic collision", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    closeTo(profile.finalTotalMomentumKgMs, profile.initialTotalMomentumKgMs);
  });

  it("uses the coefficient of restitution for relative separation speed", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    const approach = momentumCollisionDefaults.initialVelocity1Ms - momentumCollisionDefaults.initialVelocity2Ms;
    const separation = profile.finalVelocity2Ms - profile.finalVelocity1Ms;
    closeTo(separation, momentumCollisionDefaults.restitutionCoefficient * approach);
  });

  it("conserves kinetic energy in a perfectly elastic collision", () => {
    const profile = createMomentumCollisionProfile({...momentumCollisionDefaults, restitutionCoefficient: 1});
    closeTo(profile.finalKineticEnergyJ, profile.initialKineticEnergyJ);
    closeTo(profile.kineticEnergyChangeJ, 0);
  });

  it("joins the carts in a perfectly inelastic collision", () => {
    const profile = createMomentumCollisionProfile({...momentumCollisionDefaults, restitutionCoefficient: 0});
    closeTo(profile.finalVelocity1Ms, profile.finalVelocity2Ms);
    const state = sampleMomentumCollision(profile, (profile.collisionTimeSeconds as number) + 1);
    expect(state.phase).toBe("joined");
    closeTo(state.position2M - state.position1M, COLLISION_CART_LENGTH_M);
  });

  it("reports equal and opposite impulses", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    closeTo(profile.impulseOn1Ns, -profile.impulseOn2Ns);
  });

  it("does not change velocities before impact", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    const state = sampleMomentumCollision(profile, (profile.collisionTimeSeconds as number) / 2);
    closeTo(state.velocity1Ms, momentumCollisionDefaults.initialVelocity1Ms);
    closeTo(state.velocity2Ms, momentumCollisionDefaults.initialVelocity2Ms);
    expect(state.collisionOccurred).toBe(false);
  });

  it("handles carts that never approach each other", () => {
    const parameters = {...momentumCollisionDefaults, initialVelocity1Ms: -1, initialVelocity2Ms: 1};
    const state = solveMomentumCollision(parameters, 2);
    expect(state.collisionTimeSeconds).toBeNull();
    expect(state.phase).toBe("no-collision");
    expect(inspectMomentumCollision(parameters).some((issue) => issue.id === "no-collision")).toBe(true);
  });

  it("provides enough timeline after the default impact", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    const duration = getMomentumCollisionExperimentDuration(momentumCollisionDefaults);
    expect(duration).toBeGreaterThan((profile.collisionTimeSeconds as number) + 1.5);
    expect(duration).toBeLessThanOrEqual(20);
  });

  it("rejects invalid time samples", () => {
    const profile = createMomentumCollisionProfile(momentumCollisionDefaults);
    expect(() => sampleMomentumCollision(profile, -0.01)).toThrow(RangeError);
  });
});
