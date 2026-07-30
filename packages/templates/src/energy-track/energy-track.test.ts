import {frameSample} from "@science-studio/simulation-core";
import {describe, expect, it} from "vitest";
import {
  createEnergyTrackTrajectory,
  energyTrackDefaults,
  energyTrackParametersSchema,
  energyTrackTemplate,
  sampleEnergyTrack,
  solveEnergyTrack,
} from "./index";

describe("energy-track solver", () => {
  it("publishes the classroom template contract", () => {
    expect(energyTrackTemplate).toMatchObject({
      id: "mechanics.energy-track",
      version: "0.1.0",
      catalog: {
        slug: "energy-track",
        gradeLevel: "middle",
        subject: "mechanics",
        lessonMinutes: 12,
      },
    });
    expect(energyTrackTemplate.parameterDefinitions.map((item) => item.key)).toEqual([
      "massKg",
      "startHeightM",
      "frictionCoefficient",
      "gravityMs2",
    ]);
    expect(energyTrackTemplate.narration.reduce(
      (sum, step) => sum + step.durationSeconds,
      0,
    )).toBe(12);
  });

  it("matches the analytical no-friction energy result", () => {
    const parameters = {...energyTrackDefaults, frictionCoefficient: 0};
    const trajectory = createEnergyTrackTrajectory(parameters);
    const complete = sampleEnergyTrack(trajectory, trajectory.endTimeSeconds);

    expect(trajectory.reachesBottom).toBe(true);
    expect(trajectory.bottomVelocityMs).toBeCloseTo(
      Math.sqrt(2 * parameters.gravityMs2 * parameters.startHeightM),
      10,
    );
    expect(complete.turningHeightM).toBeCloseTo(parameters.startHeightM, 10);
    expect(complete.thermalEnergyJ).toBeCloseTo(0, 8);
  });

  it("matches the default friction reference values", () => {
    const trajectory = createEnergyTrackTrajectory(energyTrackDefaults);
    expect(trajectory.reachesBottom).toBe(true);
    expect(trajectory.bottomVelocityMs).toBeCloseTo(11.0421806437, 8);
    expect(trajectory.turningHeightM).toBeCloseTo(4.878825842, 8);
  });

  it("keeps every energy store non-negative and the total conserved", () => {
    const trajectory = createEnergyTrackTrajectory(energyTrackDefaults);
    for (let index = 0; index <= 40; index += 1) {
      const state = sampleEnergyTrack(
        trajectory,
        (trajectory.endTimeSeconds * index) / 40,
      );
      expect(state.kineticEnergyJ).toBeGreaterThanOrEqual(0);
      expect(state.potentialEnergyJ).toBeGreaterThanOrEqual(0);
      expect(state.thermalEnergyJ).toBeGreaterThanOrEqual(0);
      expect(state.totalEnergyJ).toBeCloseTo(state.initialEnergyJ, 8);
    }
  });

  it("dissipates mechanical energy monotonically when friction is present", () => {
    const trajectory = createEnergyTrackTrajectory(energyTrackDefaults);
    let previousMechanical = Number.POSITIVE_INFINITY;
    let previousThermal = 0;
    for (let index = 0; index <= 40; index += 1) {
      const state = sampleEnergyTrack(
        trajectory,
        (trajectory.endTimeSeconds * index) / 40,
      );
      expect(state.mechanicalEnergyJ).toBeLessThanOrEqual(previousMechanical + 1e-8);
      expect(state.thermalEnergyJ).toBeGreaterThanOrEqual(previousThermal - 1e-8);
      previousMechanical = state.mechanicalEnergyJ;
      previousThermal = state.thermalEnergyJ;
    }
  });

  it("changes energy scale but not motion when mass changes", () => {
    const light = createEnergyTrackTrajectory({...energyTrackDefaults, massKg: 1});
    const heavy = createEnergyTrackTrajectory({...energyTrackDefaults, massKg: 5});
    const time = light.endTimeSeconds * 0.43;
    const lightState = sampleEnergyTrack(light, time);
    const heavyState = sampleEnergyTrack(heavy, time);

    expect(heavy.endTimeSeconds).toBe(light.endTimeSeconds);
    expect(heavyState.angleRadians).toBe(lightState.angleRadians);
    expect(heavyState.velocityMs).toBe(lightState.velocityMs);
    expect(heavyState.totalEnergyJ).toBeCloseTo(lightState.totalEnergyJ * 5, 8);
  });

  it("is deterministic at equivalent frame times", () => {
    const thirtyFps = solveEnergyTrack(
      energyTrackDefaults,
      frameSample(45, 30).timeSeconds,
    );
    const sixtyFps = solveEnergyTrack(
      energyTrackDefaults,
      frameSample(90, 60).timeSeconds,
    );
    expect(sixtyFps).toEqual(thirtyFps);
  });

  it("stops safely before the bottom under high friction", () => {
    const trajectory = createEnergyTrackTrajectory({
      ...energyTrackDefaults,
      startHeightM: 1,
      frictionCoefficient: 0.4,
    });
    const complete = sampleEnergyTrack(trajectory, trajectory.endTimeSeconds + 10);

    expect(trajectory.reachesBottom).toBe(false);
    expect(trajectory.endAngleRadians).toBeLessThan(0);
    expect(complete.motion).toBe("complete");
    expect(complete.velocityMs).toBe(0);
    expect(Number.isFinite(complete.totalEnergyJ)).toBe(true);
  });

  it("rejects invalid parameters and invalid time", () => {
    expect(energyTrackParametersSchema.safeParse({
      ...energyTrackDefaults,
      frictionCoefficient: 0.41,
    }).success).toBe(false);
    expect(() => solveEnergyTrack(energyTrackDefaults, -1)).toThrow(RangeError);
    expect(() => solveEnergyTrack(energyTrackDefaults, Number.NaN)).toThrow(RangeError);
  });
});
