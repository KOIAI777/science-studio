import {describe, expect, it} from "vitest";
import {
  inspectLeverBalance,
  LEVER_STOP_ANGLE_DEGREES,
  leverBalanceDefaults,
  leverBalanceParametersSchema,
  simulateLeverRelease,
  solveLeverBalance,
} from "./index";

const closeTo = (actual: number, expected: number, digits = 10) => expect(actual).toBeCloseTo(expected, digits);

describe("lever balance model", () => {
  it("accepts the classroom defaults", () => {
    expect(leverBalanceParametersSchema.safeParse(leverBalanceDefaults).success).toBe(true);
  });

  it("balances unequal masses at inverse lever-arm distances", () => {
    const state = solveLeverBalance(leverBalanceDefaults);
    expect(state.outcome).toBe("balanced");
    closeTo(state.leftTorqueNm, state.rightTorqueNm);
    closeTo(state.netTorqueNm, 0);
  });

  it("predicts counterclockwise rotation when the left moment is larger", () => {
    const state = solveLeverBalance({...leverBalanceDefaults, leftDistanceM: 1.4});
    expect(state.outcome).toBe("counterclockwise");
    expect(state.netTorqueNm).toBeGreaterThan(0);
    expect(state.centerOfMassOffsetM).toBeLessThan(0);
  });

  it("predicts clockwise rotation when the right moment is larger", () => {
    const state = solveLeverBalance({...leverBalanceDefaults, rightMassKg: 4});
    expect(state.outcome).toBe("clockwise");
    expect(state.netTorqueNm).toBeLessThan(0);
    expect(state.centerOfMassOffsetM).toBeGreaterThan(0);
  });

  it("scales weights and moments with gravity without changing equilibrium", () => {
    const earth = solveLeverBalance(leverBalanceDefaults);
    const lowGravity = solveLeverBalance({...leverBalanceDefaults, gravityMs2: 3.71});
    closeTo(lowGravity.leftTorqueNm / earth.leftTorqueNm, 3.71 / 9.81);
    expect(lowGravity.outcome).toBe("balanced");
    closeTo(lowGravity.requiredRightMassKg, earth.requiredRightMassKg);
    closeTo(lowGravity.requiredRightDistanceM, earth.requiredRightDistanceM);
  });

  it("solves the right-side mass required for balance", () => {
    const state = solveLeverBalance({...leverBalanceDefaults, rightDistanceM: 1.5});
    closeTo(state.requiredRightMassKg, 1.6);
    const balanced = solveLeverBalance({...state.parameters, rightMassKg: state.requiredRightMassKg});
    expect(balanced.outcome).toBe("balanced");
  });

  it("solves the right-side distance required for balance", () => {
    const state = solveLeverBalance({...leverBalanceDefaults, rightMassKg: 1.5});
    closeTo(state.requiredRightDistanceM, 1.6);
    const balanced = solveLeverBalance({...state.parameters, rightDistanceM: state.requiredRightDistanceM});
    expect(balanced.outcome).toBe("balanced");
  });

  it("reports when an unknown solution lies outside the control range", () => {
    const parameters = {...leverBalanceDefaults, leftMassKg: 8, leftDistanceM: 2, rightDistanceM: 0.2};
    expect(inspectLeverBalance(parameters).some((issue) => issue.id === "solution-outside-range")).toBe(true);
  });

  it("rejects invalid mass and distance values", () => {
    expect(leverBalanceParametersSchema.safeParse({...leverBalanceDefaults, leftMassKg: 0}).success).toBe(false);
    expect(leverBalanceParametersSchema.safeParse({...leverBalanceDefaults, rightDistanceM: 2.1}).success).toBe(false);
  });

  it("always documents the horizontal-release assumption", () => {
    expect(inspectLeverBalance(leverBalanceDefaults).some((issue) => issue.id === "lever-model-assumptions")).toBe(true);
  });

  it("keeps a balanced lever horizontal throughout the release phase", () => {
    const motion = simulateLeverRelease(leverBalanceDefaults, 10);
    closeTo(motion.angleRadians, 0);
    closeTo(motion.angularVelocityRadiansPerSecond, 0);
    closeTo(motion.angularAccelerationRadiansPerSecondSquared, 0);
    expect(motion.reachedStop).toBe(false);
    expect(motion.stopSide).toBeNull();
  });

  it("rotates the left side down and settles at the left stop", () => {
    const parameters = {...leverBalanceDefaults, leftMassKg: 3.5, leftDistanceM: 1.2, rightDistanceM: 1};
    expect(simulateLeverRelease(parameters, 0.1).angleRadians).toBeGreaterThan(0);

    const motion = simulateLeverRelease(parameters, 2);
    closeTo(motion.angleRadians * 180 / Math.PI, LEVER_STOP_ANGLE_DEGREES);
    closeTo(motion.angularVelocityRadiansPerSecond, 0);
    closeTo(motion.angularAccelerationRadiansPerSecondSquared, 0);
    expect(motion.reachedStop).toBe(true);
    expect(motion.stopSide).toBe("left");
  });

  it("rotates the right side down and settles at the right stop", () => {
    const parameters = {...leverBalanceDefaults, leftMassKg: 1.5, leftDistanceM: 1, rightMassKg: 3, rightDistanceM: 1.2};
    expect(simulateLeverRelease(parameters, 0.1).angleRadians).toBeLessThan(0);

    const motion = simulateLeverRelease(parameters, 2);
    closeTo(motion.angleRadians * 180 / Math.PI, -LEVER_STOP_ANGLE_DEGREES);
    closeTo(motion.angularVelocityRadiansPerSecond, 0);
    expect(motion.reachedStop).toBe(true);
    expect(motion.stopSide).toBe("right");
  });

  it("uses the current perpendicular arm for torque after rotation", () => {
    const parameters = {...leverBalanceDefaults, leftMassKg: 3.5, leftDistanceM: 1.2, rightDistanceM: 1};
    const staticState = solveLeverBalance(parameters);
    const motion = simulateLeverRelease(parameters, 0.2);
    const perpendicularScale = Math.cos(motion.angleRadians);
    closeTo(motion.leftTorqueNm, staticState.leftTorqueNm * perpendicularScale);
    closeTo(motion.rightTorqueNm, staticState.rightTorqueNm * perpendicularScale);
    closeTo(motion.netTorqueNm, motion.leftTorqueNm - motion.rightTorqueNm);
  });

  it("returns the same release state for the same parameters and time", () => {
    const parameters = {...leverBalanceDefaults, rightMassKg: 4};
    expect(simulateLeverRelease(parameters, 0.275)).toEqual(simulateLeverRelease(parameters, 0.275));
  });

  it("rejects invalid release time", () => {
    expect(() => simulateLeverRelease(leverBalanceDefaults, -0.1)).toThrow(RangeError);
    expect(() => simulateLeverRelease(leverBalanceDefaults, Number.NaN)).toThrow(RangeError);
    expect(() => simulateLeverRelease(leverBalanceDefaults, Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
