import {describe, expect, it} from "vitest";
import {
  getCriticalAngleDegrees,
  inspectRayOptics,
  rayOpticsDefaults,
  rayOpticsParametersSchema,
  solveRayOptics,
} from "./index";

const closeTo = (actual: number, expected: number, digits = 10) => expect(actual).toBeCloseTo(expected, digits);

describe("ray optics model", () => {
  it("accepts the classroom defaults", () => {
    expect(rayOpticsParametersSchema.safeParse(rayOpticsDefaults).success).toBe(true);
  });

  it("obeys the law of reflection", () => {
    const state = solveRayOptics({...rayOpticsDefaults, incidentAngleDegrees: 37});
    closeTo(state.reflectionAngleDegrees, 37);
  });

  it("obeys Snell's law for air to glass", () => {
    const state = solveRayOptics({...rayOpticsDefaults, incidentAngleDegrees: 45});
    closeTo(state.refractionAngleDegrees as number, 28.125505702055708);
    closeTo(state.incidentSineTerm, state.transmittedSineTerm as number);
  });

  it("does not bend at normal incidence", () => {
    const state = solveRayOptics({...rayOpticsDefaults, incidentAngleDegrees: 0});
    expect(state.regime).toBe("normal-incidence");
    closeTo(state.refractionAngleDegrees as number, 0);
  });

  it("does not bend between index-matched media", () => {
    const state = solveRayOptics({...rayOpticsDefaults, incidentAngleDegrees: 52, refractiveIndex1: 1.33, refractiveIndex2: 1.33});
    closeTo(state.refractionAngleDegrees as number, 52);
    expect(inspectRayOptics(state.parameters).some((issue) => issue.id === "matched-indices")).toBe(true);
  });

  it("calculates the glass-to-air critical angle", () => {
    closeTo(getCriticalAngleDegrees(1.5, 1) as number, 41.810314895778596);
  });

  it("has no critical angle from a lower to a higher index", () => {
    expect(getCriticalAngleDegrees(1, 1.5)).toBeNull();
  });

  it("places the transmitted ray along the boundary at the critical angle", () => {
    const criticalAngle = getCriticalAngleDegrees(1.5, 1) as number;
    const state = solveRayOptics({...rayOpticsDefaults, refractiveIndex1: 1.5, refractiveIndex2: 1, incidentAngleDegrees: criticalAngle});
    expect(state.regime).toBe("critical");
    closeTo(state.refractionAngleDegrees as number, 90);
  });

  it("reports total internal reflection above the critical angle", () => {
    const state = solveRayOptics({...rayOpticsDefaults, refractiveIndex1: 1.5, refractiveIndex2: 1, incidentAngleDegrees: 50});
    expect(state.regime).toBe("total-internal-reflection");
    expect(state.refractionAngleDegrees).toBeNull();
    expect(state.transmittedRay).toBe(false);
  });

  it("reports relative speeds as c divided by refractive index", () => {
    const state = solveRayOptics({...rayOpticsDefaults, refractiveIndex1: 1.25, refractiveIndex2: 2});
    closeTo(state.relativeLightSpeed1, 0.8);
    closeTo(state.relativeLightSpeed2, 0.5);
  });

  it("rejects an incidence angle outside the classroom range", () => {
    expect(rayOpticsParametersSchema.safeParse({...rayOpticsDefaults, incidentAngleDegrees: 90}).success).toBe(false);
  });
});
