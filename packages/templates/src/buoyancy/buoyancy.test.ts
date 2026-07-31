import {describe, expect, it} from "vitest";
import {
  BUOYANCY_TANK_DEPTH_M,
  buoyancyDefaults,
  buoyancyParametersSchema,
  buoyancyTemplate,
  createBuoyancyProfile,
  getBuoyancyExperimentDuration,
  inspectBuoyancy,
  isBuoyancyTankAtRest,
  sampleBuoyancy,
  solveBuoyancy,
  type BuoyancyParameters,
} from "./index";

describe("density and buoyancy solver", () => {
  it("publishes the paid fluids template contract", () => {
    expect(buoyancyTemplate).toMatchObject({
      id: "fluids.density-buoyancy",
      version: "0.1.0",
      catalog: {slug: "density-buoyancy", gradeLevel: "middle", subject: "fluids", lessonMinutes: 15},
    });
    expect(buoyancyTemplate.narration.map((step) => step.id)).toEqual([
      "object-density", "displaced-volume", "forces", "predict", "release", "compare",
    ]);
    expect(buoyancyTemplate.narration.reduce((sum, step) => sum + step.durationSeconds, 0)).toBe(15);
  });

  it("converts liters to cubic metres and calculates object density", () => {
    const profile = createBuoyancyProfile({...buoyancyDefaults, massKg: 1.2, volumeLiters: 1.5});
    expect(profile.objectVolumeM3).toBeCloseTo(0.0015, 12);
    expect(profile.objectDensityKgM3).toBeCloseTo(800, 12);
    expect(profile.objectSideM ** 3).toBeCloseTo(profile.objectVolumeM3, 12);
  });

  it("applies Archimedes' principle at full submersion", () => {
    const state = solveBuoyancy({...buoyancyDefaults, massKg: 0.9, volumeLiters: 1, fluidDensityKgM3: 1000}, 0);
    expect(state.primaryState.submergedFraction).toBe(1);
    expect(state.primaryState.displacedVolumeM3).toBeCloseTo(0.001, 12);
    expect(state.primaryState.buoyantForceN).toBeCloseTo(1000 * 0.001 * 9.81, 10);
    expect(state.weightN).toBeCloseTo(0.9 * 9.81, 10);
    expect(state.primaryState.netForceN).toBeCloseTo(state.primaryState.buoyantForceN - state.weightN, 10);
  });

  it("predicts floating fraction from the density ratio", () => {
    const profile = createBuoyancyProfile({...buoyancyDefaults, massKg: 0.8, volumeLiters: 1, fluidDensityKgM3: 1000});
    expect(profile.primary.predictedOutcome).toBe("float");
    expect(profile.primary.equilibriumSubmergedFraction).toBeCloseTo(0.8, 12);
    expect(profile.primary.equilibriumCenterPositionM).toBeCloseTo(-0.03, 12);
  });

  it("labels a partly submerged moving object near equilibrium as bobbing", () => {
    const profile = createBuoyancyProfile(buoyancyDefaults);
    const states = Array.from({length: 81}, (_, index) => sampleBuoyancy(profile, 2 + index * 0.1).primaryState);
    const bobbing = states.find((state) => state.phase === "bobbing");
    expect(bobbing).toBeDefined();
    expect(bobbing?.predictedOutcome).toBe("float");
    expect(bobbing?.submergedFraction).toBeGreaterThan(0);
    expect(bobbing?.submergedFraction).toBeLessThan(1);
  });

  it("runs the timeline until every visible tank is at rest", () => {
    const duration = getBuoyancyExperimentDuration(buoyancyDefaults);
    const state = solveBuoyancy(buoyancyDefaults, duration);
    expect(duration).toBeGreaterThan(10);
    expect(duration).toBeLessThanOrEqual(14);
    expect(isBuoyancyTankAtRest(state.primaryState)).toBe(true);
    expect(isBuoyancyTankAtRest(state.comparisonState)).toBe(true);
    expect(state.primaryState.submergedFraction).toBeCloseTo(0.9, 10);
    expect(state.primaryState.phase).toBe("floating");
    expect(state.primaryState.buoyantForceN).toBeCloseTo(state.weightN, 10);
    expect(state.primaryState.netForceN).toBeCloseTo(0, 10);
    expect(state.comparisonState.phase).toBe("bottom");
  });

  it("ignores the hidden comparison tank when choosing the timeline duration", () => {
    const parameters = {...buoyancyDefaults, comparisonMode: false, comparisonFluidDensityKgM3: 899};
    const duration = getBuoyancyExperimentDuration(parameters);
    const state = solveBuoyancy(parameters, duration);
    expect(isBuoyancyTankAtRest(state.primaryState)).toBe(true);
  });

  it("keeps a density-matched object suspended", () => {
    const state = solveBuoyancy({...buoyancyDefaults, massKg: 1, volumeLiters: 1, fluidDensityKgM3: 1000}, 8);
    expect(state.primary.predictedOutcome).toBe("suspend");
    expect(state.primaryState.phase).toBe("suspended");
    expect(state.primaryState.centerPositionM).toBeCloseTo(-0.55, 10);
    expect(state.primaryState.velocityMs).toBeCloseTo(0, 10);
    expect(state.primaryState.netForceN).toBeCloseTo(0, 10);
  });

  it("makes a less-dense object rise and a denser object sink", () => {
    const rising = solveBuoyancy({...buoyancyDefaults, massKg: 0.8, volumeLiters: 1, fluidDensityKgM3: 1000}, 0.5).primaryState;
    const sinking = solveBuoyancy({...buoyancyDefaults, massKg: 1.2, volumeLiters: 1, fluidDensityKgM3: 1000}, 0.5).primaryState;
    expect(rising.centerPositionM).toBeGreaterThan(-0.55);
    expect(rising.velocityMs).toBeGreaterThan(0);
    expect(sinking.centerPositionM).toBeLessThan(-0.55);
    expect(sinking.velocityMs).toBeLessThan(0);
  });

  it("balances a sunk object with a bottom normal force", () => {
    const state = solveBuoyancy({...buoyancyDefaults, massKg: 2, volumeLiters: 1, fluidDensityKgM3: 800}, 8).primaryState;
    expect(state.phase).toBe("bottom");
    expect(state.centerPositionM).toBeCloseTo(-BUOYANCY_TANK_DEPTH_M + 0.05, 10);
    expect(state.normalForceN).toBeGreaterThan(0);
    expect(state.netForceN).toBeCloseTo(0, 10);
    expect(state.accelerationMs2).toBe(0);
  });

  it("holds the same object constant across the comparison tanks", () => {
    const state = solveBuoyancy({...buoyancyDefaults, fluidDensityKgM3: 1000, comparisonFluidDensityKgM3: 800}, 0);
    expect(state.primaryState.buoyantForceN).toBeCloseTo(9.81, 10);
    expect(state.comparisonState.buoyantForceN).toBeCloseTo(7.848, 10);
    expect(state.objectDensityKgM3).toBe(900);
    expect(state.primary.predictedOutcome).toBe("float");
    expect(state.comparison.predictedOutcome).toBe("sink");
  });

  it("always applies drag opposite the direction of motion", () => {
    const rising = solveBuoyancy({...buoyancyDefaults, massKg: 0.5, volumeLiters: 1}, 0.4).primaryState;
    const sinking = solveBuoyancy({...buoyancyDefaults, massKg: 1.5, volumeLiters: 1}, 0.4).primaryState;
    expect(rising.velocityMs).toBeGreaterThan(0);
    expect(rising.dragForceN).toBeLessThan(0);
    expect(sinking.velocityMs).toBeLessThan(0);
    expect(sinking.dragForceN).toBeGreaterThan(0);
  });

  it("is deterministic and remains within the physical tank", () => {
    const profile = createBuoyancyProfile(buoyancyDefaults);
    const first = sampleBuoyancy(profile, 4.25);
    const repeated = sampleBuoyancy(profile, 4.25);
    expect(repeated).toEqual(first);
    for (const tank of [first.primaryState, first.comparisonState]) {
      expect(tank.centerPositionM).toBeGreaterThanOrEqual(-BUOYANCY_TANK_DEPTH_M + profile.objectSideM / 2);
      expect(tank.submergedFraction).toBeGreaterThanOrEqual(0);
      expect(tank.submergedFraction).toBeLessThanOrEqual(1);
      expect(Math.sign(tank.dragForceN)).toBe(tank.velocityMs === 0 ? 0 : -Math.sign(tank.velocityMs));
    }
  });

  it("accepts boundaries and rejects invalid parameters or time", () => {
    const boundaries: BuoyancyParameters[] = [
      {...buoyancyDefaults, massKg: 0.2, volumeLiters: 0.5, gravityMs2: 1, fluidDensityKgM3: 700, comparisonFluidDensityKgM3: 1300},
      {...buoyancyDefaults, massKg: 8, volumeLiters: 6, gravityMs2: 12, fluidDensityKgM3: 1300, comparisonFluidDensityKgM3: 700},
    ];
    for (const parameters of boundaries) {
      expect(buoyancyParametersSchema.safeParse(parameters).success).toBe(true);
      const state = solveBuoyancy(parameters, 2);
      expect(Number.isFinite(state.primaryState.buoyantForceN)).toBe(true);
      expect(Number.isFinite(state.comparisonState.centerPositionM)).toBe(true);
    }
    for (const parameters of [
      {...buoyancyDefaults, massKg: 0},
      {...buoyancyDefaults, volumeLiters: 10},
      {...buoyancyDefaults, gravityMs2: Number.NaN},
      {...buoyancyDefaults, fluidDensityKgM3: 600},
      {...buoyancyDefaults, comparisonMode: "yes"},
    ]) expect(buoyancyParametersSchema.safeParse(parameters).success).toBe(false);
    expect(() => solveBuoyancy(buoyancyDefaults, -1)).toThrow(RangeError);
  });

  it("reports invalid, dense, matching-fluid, and assumption issues", () => {
    expect(inspectBuoyancy(buoyancyDefaults).map((issue) => issue.id)).toContain("buoyancy-assumptions");
    expect(inspectBuoyancy({...buoyancyDefaults, massKg: 5.5, volumeLiters: 1}).map((issue) => issue.id)).toContain("high-object-density");
    expect(inspectBuoyancy({...buoyancyDefaults, comparisonFluidDensityKgM3: 1000}).map((issue) => issue.id)).toContain("matching-fluids");
    expect(inspectBuoyancy({...buoyancyDefaults, massKg: 20}).every((issue) => issue.severity === "blocking")).toBe(true);
  });
});
