import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  inclinedPlaneDefaults,
  inclinedPlaneParametersSchema,
  inclinedPlaneTemplate,
  solveInclinedPlane,
} from "./index";

describe("inclined-plane solver", () => {
  it("publishes a complete template contract for the classroom runtime", () => {
    expect(inclinedPlaneTemplate).toMatchObject({
      id: "mechanics.inclined-plane",
      version: "0.1.0",
      catalog: {
        slug: "inclined-plane",
        gradeLevel: "middle",
        subject: "mechanics",
        lessonMinutes: 12,
      },
    });
    expect(inclinedPlaneTemplate.parameterDefinitions.map((item) => item.key)).toEqual([
      "angleDegrees",
      "massKg",
      "staticFrictionCoefficient",
      "kineticFrictionCoefficient",
      "gravityMs2",
      "rampLengthM",
    ]);
    expect(inclinedPlaneTemplate.narration.map((step) => step.id)).toEqual([
      "setup",
      "forces",
      "components",
      "equation",
      "result",
    ]);
    expect(inclinedPlaneTemplate.narration.reduce((sum, step) => sum + step.durationSeconds, 0)).toBe(12);
  });

  it("matches the analytical acceleration for the default sliding case", () => {
    const state = solveInclinedPlane(inclinedPlaneDefaults, 1);
    const angle = (inclinedPlaneDefaults.angleDegrees * Math.PI) / 180;
    const expectedAcceleration =
      inclinedPlaneDefaults.gravityMs2 *
      (Math.sin(angle) -
        inclinedPlaneDefaults.kineticFrictionCoefficient * Math.cos(angle));

    expect(state.motion).toBe("sliding");
    expect(state.accelerationMs2).toBeCloseTo(expectedAcceleration, 12);
    expect(state.velocityMs).toBeCloseTo(expectedAcceleration, 12);
    expect(state.bottomVelocityMs).toBeCloseTo(
      Math.sqrt(
        2 * expectedAcceleration * inclinedPlaneDefaults.rampLengthM,
      ),
      12,
    );
    expect(state.displacementM).toBeCloseTo(expectedAcceleration / 2, 12);
  });

  it("balances static friction when the block does not move", () => {
    const state = solveInclinedPlane(
      {
        ...inclinedPlaneDefaults,
        angleDegrees: 10,
        staticFrictionCoefficient: 0.4,
        kineticFrictionCoefficient: 0.2,
      },
      5,
    );

    expect(state.motion).toBe("stationary");
    expect(state.accelerationMs2).toBe(0);
    expect(state.frictionForceN).toBeCloseTo(state.parallelForceN, 12);
    expect(state.displacementM).toBe(0);
    expect(state.bottomVelocityMs).toBe(0);
  });

  it("samples the bottom boundary without overshooting or zeroing velocity", () => {
    const state = solveInclinedPlane(inclinedPlaneDefaults, 100);

    expect(state.motion).toBe("complete");
    expect(state.displacementM).toBe(inclinedPlaneDefaults.rampLengthM);
    expect(state.bottomVelocityMs).toBeGreaterThan(0);
    expect(state.velocityMs).toBeCloseTo(state.bottomVelocityMs, 12);
  });

  it("rejects kinetic friction above static friction", () => {
    const result = inclinedPlaneParametersSchema.safeParse({
      ...inclinedPlaneDefaults,
      staticFrictionCoefficient: 0.2,
      kineticFrictionCoefficient: 0.3,
    });

    expect(result.success).toBe(false);
  });

  it("is identical for repeated samples and equivalent frame times", () => {
    const time = frameSample(45, 30).timeSeconds;
    const first = solveInclinedPlane(inclinedPlaneDefaults, time);
    const second = solveInclinedPlane(inclinedPlaneDefaults, time);
    const sixtyFps = solveInclinedPlane(
      inclinedPlaneDefaults,
      frameSample(90, 60).timeSeconds,
    );

    expect(second).toEqual(first);
    expect(sixtyFps).toEqual(first);
  });
});
