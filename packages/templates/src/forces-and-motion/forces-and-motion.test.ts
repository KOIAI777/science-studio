import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  createForcesMotionProfile,
  forcesMotionDefaults,
  forcesMotionParametersSchema,
  forcesMotionTemplate,
  inspectForcesMotion,
  sampleForcesMotion,
  solveForcesMotion,
} from "./index";

describe("forces-and-motion solver", () => {
  it("publishes the classroom template contract", () => {
    expect(forcesMotionTemplate).toMatchObject({
      id: "mechanics.forces-and-motion",
      version: "0.1.0",
      catalog: {
        slug: "forces-and-motion",
        gradeLevel: "middle",
        subject: "mechanics",
        lessonMinutes: 10,
      },
    });
    expect(forcesMotionTemplate.parameterDefinitions.map((item) => item.key)).toEqual([
      "massKg",
      "appliedForceN",
      "staticFrictionCoefficient",
      "kineticFrictionCoefficient",
      "gravityMs2",
      "forceDurationSeconds",
    ]);
    expect(forcesMotionTemplate.narration.map((step) => step.id)).toEqual([
      "setup",
      "forces",
      "threshold",
      "net-force",
      "motion",
      "graphs",
    ]);
    expect(forcesMotionTemplate.narration.reduce(
      (sum, step) => sum + step.durationSeconds,
      0,
    )).toBe(10);
  });

  it("matches the default driven and release boundary values", () => {
    const profile = createForcesMotionProfile(forcesMotionDefaults);
    const driven = sampleForcesMotion(profile, 1);
    const released = sampleForcesMotion(
      profile,
      forcesMotionDefaults.forceDurationSeconds,
    );

    expect(profile.normalForceN).toBeCloseTo(49.05, 12);
    expect(profile.maximumStaticFrictionN).toBeCloseTo(17.1675, 12);
    expect(profile.kineticFrictionMagnitudeN).toBeCloseTo(12.2625, 12);
    expect(driven).toMatchObject({
      phase: "driven",
      frictionRegime: "kinetic",
      appliedForceActive: true,
      appliedForceN: 25,
    });
    expect(driven.frictionForceN).toBeCloseTo(-12.2625, 12);
    expect(driven.netForceN).toBeCloseTo(12.7375, 12);
    expect(driven.accelerationMs2).toBeCloseTo(2.5475, 12);
    expect(driven.velocityMs).toBeCloseTo(2.5475, 12);
    expect(driven.displacementM).toBeCloseTo(1.27375, 12);

    expect(released.phase).toBe("braking");
    expect(released.appliedForceActive).toBe(false);
    expect(released.appliedForceN).toBe(0);
    expect(released.accelerationMs2).toBeCloseTo(-2.4525, 12);
    expect(released.velocityMs).toBeCloseTo(5.095, 12);
    expect(released.displacementM).toBeCloseTo(5.095, 12);
  });

  it("uses only the static friction needed to hold at and below the threshold", () => {
    const threshold = forcesMotionDefaults.massKg *
      forcesMotionDefaults.gravityMs2 *
      forcesMotionDefaults.staticFrictionCoefficient;
    const exact = solveForcesMotion({
      ...forcesMotionDefaults,
      appliedForceN: threshold,
    }, 1);
    const negative = solveForcesMotion({
      ...forcesMotionDefaults,
      appliedForceN: -10,
    }, 1);

    expect(exact.phase).toBe("held");
    expect(exact.frictionRegime).toBe("static");
    expect(exact.frictionForceN).toBe(-threshold);
    expect(exact.netForceN).toBe(0);
    expect(exact.velocityMs).toBe(0);
    expect(exact.displacementM).toBe(0);

    expect(negative.phase).toBe("held");
    expect(negative.frictionForceN).toBe(10);
    expect(negative.maximumStaticFrictionN).toBeGreaterThan(10);
    expect(negative.netForceN).toBe(0);
  });

  it("switches to kinetic friction only when the threshold is exceeded", () => {
    const threshold = forcesMotionDefaults.massKg *
      forcesMotionDefaults.gravityMs2 *
      forcesMotionDefaults.staticFrictionCoefficient;
    const state = solveForcesMotion({
      ...forcesMotionDefaults,
      appliedForceN: threshold + 1e-6,
    }, 0.25);

    expect(state.phase).toBe("driven");
    expect(state.frictionRegime).toBe("kinetic");
    expect(state.netForceN).toBeGreaterThan(0);
    expect(state.velocityMs).toBeGreaterThan(0);
  });

  it("brakes to rest without crossing through zero velocity", () => {
    const profile = createForcesMotionProfile(forcesMotionDefaults);
    const stopTime = profile.stopTimeSeconds;
    expect(stopTime).not.toBeNull();
    expect(stopTime).toBeCloseTo(4.077471967380224, 12);
    expect(profile.finalDisplacementM).toBeCloseTo(10.387359836901119, 12);

    const braking = sampleForcesMotion(profile, 3);
    const beforeStop = sampleForcesMotion(profile, stopTime! - 1e-9);
    const atStop = sampleForcesMotion(profile, stopTime!);
    const afterStop = sampleForcesMotion(profile, stopTime! + 10);

    expect(braking.phase).toBe("braking");
    expect(braking.accelerationMs2).toBeCloseTo(-2.4525, 12);
    expect(braking.velocityMs).toBeCloseTo(2.6425, 12);
    expect(braking.displacementM).toBeCloseTo(8.96375, 12);
    expect(beforeStop.velocityMs).toBeGreaterThan(0);
    expect(atStop).toMatchObject({
      phase: "stopped",
      frictionRegime: "none",
      appliedForceN: 0,
      frictionForceN: 0,
      netForceN: 0,
      accelerationMs2: 0,
      velocityMs: 0,
    });
    expect(afterStop.velocityMs).toBe(0);
    expect(afterStop.displacementM).toBe(atStop.displacementM);
  });

  it("mirrors every horizontal quantity for a negative force", () => {
    const positive = createForcesMotionProfile(forcesMotionDefaults);
    const negative = createForcesMotionProfile({
      ...forcesMotionDefaults,
      appliedForceN: -forcesMotionDefaults.appliedForceN,
    });

    expect(negative.stopTimeSeconds).toBe(positive.stopTimeSeconds);
    expect(negative.normalForceN).toBe(positive.normalForceN);

    for (const time of [1, 3, positive.stopTimeSeconds! + 1]) {
      const right = sampleForcesMotion(positive, time);
      const left = sampleForcesMotion(negative, time);
      expect(left.phase).toBe(right.phase);
      expect(left.appliedForceN).toBeCloseTo(-right.appliedForceN, 12);
      expect(left.frictionForceN).toBeCloseTo(-right.frictionForceN, 12);
      expect(left.netForceN).toBeCloseTo(-right.netForceN, 12);
      expect(left.accelerationMs2).toBeCloseTo(-right.accelerationMs2, 12);
      expect(left.velocityMs).toBeCloseTo(-right.velocityMs, 12);
      expect(left.displacementM).toBeCloseTo(-right.displacementM, 12);
    }
  });

  it("coasts at constant velocity after force removal when kinetic friction is zero", () => {
    const parameters = {
      ...forcesMotionDefaults,
      kineticFrictionCoefficient: 0,
    };
    const profile = createForcesMotionProfile(parameters);
    const released = sampleForcesMotion(profile, parameters.forceDurationSeconds);
    const later = sampleForcesMotion(profile, 5);

    expect(profile.stopTimeSeconds).toBeNull();
    expect(profile.finalDisplacementM).toBeNull();
    expect(released.phase).toBe("coasting");
    expect(released.velocityMs).toBeCloseTo(10, 12);
    expect(released.displacementM).toBeCloseTo(10, 12);
    expect(later.phase).toBe("coasting");
    expect(later.velocityMs).toBe(released.velocityMs);
    expect(later.displacementM).toBeCloseTo(40, 12);
    expect(later.accelerationMs2).toBe(0);
    expect(later.netForceN).toBe(0);
  });

  it("applies no impulse when the force duration is zero", () => {
    const profile = createForcesMotionProfile({
      ...forcesMotionDefaults,
      appliedForceN: 100,
      forceDurationSeconds: 0,
    });
    const initial = sampleForcesMotion(profile, 0);
    const later = sampleForcesMotion(profile, 10);

    expect(profile.exceedsStaticThreshold).toBe(true);
    expect(profile.willMove).toBe(false);
    expect(initial.phase).toBe("stopped");
    expect(initial.appliedForceN).toBe(0);
    expect(later.velocityMs).toBe(0);
    expect(later.displacementM).toBe(0);
  });

  it("matches work and kinetic-energy changes in both moving segments", () => {
    const profile = createForcesMotionProfile(forcesMotionDefaults);
    const driven = sampleForcesMotion(profile, 1);
    const braking = sampleForcesMotion(profile, 3);
    const massKg = forcesMotionDefaults.massKg;
    const drivenKineticEnergyJ = 0.5 * massKg * driven.velocityMs ** 2;
    const releaseKineticEnergyJ = 0.5 * massKg * profile.releaseVelocityMs ** 2;
    const brakingKineticEnergyJ = 0.5 * massKg * braking.velocityMs ** 2;

    expect(drivenKineticEnergyJ).toBeCloseTo(
      driven.netForceN * driven.displacementM,
      10,
    );
    expect(releaseKineticEnergyJ - brakingKineticEnergyJ).toBeCloseTo(
      profile.kineticFrictionMagnitudeN *
        (braking.displacementM - profile.releaseDisplacementM),
      10,
    );
  });

  it("is deterministic at equivalent frame times", () => {
    const thirtyFps = solveForcesMotion(
      forcesMotionDefaults,
      frameSample(45, 30).timeSeconds,
    );
    const sixtyFps = solveForcesMotion(
      forcesMotionDefaults,
      frameSample(90, 60).timeSeconds,
    );
    expect(sixtyFps).toEqual(thirtyFps);
  });

  it("rejects invalid inputs and reports useful science issues", () => {
    expect(forcesMotionParametersSchema.safeParse({
      ...forcesMotionDefaults,
      staticFrictionCoefficient: 0.2,
      kineticFrictionCoefficient: 0.3,
    }).success).toBe(false);
    expect(() => solveForcesMotion(forcesMotionDefaults, -1)).toThrow(RangeError);
    expect(() => solveForcesMotion(forcesMotionDefaults, Number.NaN)).toThrow(RangeError);
    expect(() => solveForcesMotion(forcesMotionDefaults, Number.POSITIVE_INFINITY)).toThrow(RangeError);

    const heldIssues = inspectForcesMotion({
      ...forcesMotionDefaults,
      appliedForceN: 10,
    });
    const zeroDurationIssues = inspectForcesMotion({
      ...forcesMotionDefaults,
      forceDurationSeconds: 0,
    });
    expect(heldIssues.some((issue) => issue.id === "static-equilibrium")).toBe(true);
    expect(zeroDurationIssues.some((issue) => issue.id === "zero-force-duration")).toBe(true);
    expect(heldIssues.some((issue) => issue.severity === "assumption")).toBe(true);
  });
});
