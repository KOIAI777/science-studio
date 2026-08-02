import {describe, expect, it} from "vitest";
import {
  getThinLensConstructionProgress,
  inspectThinLens,
  solveThinLens,
  thinLensDefaults,
  thinLensParametersSchema,
} from "./index";

const closeTo = (actual: number | null, expected: number, digits = 10) => expect(actual as number).toBeCloseTo(expected, digits);

describe("thin lens model", () => {
  it("accepts the classroom defaults and forms an equal real image at 2F", () => {
    expect(thinLensParametersSchema.safeParse(thinLensDefaults).success).toBe(true);
    const state = solveThinLens(thinLensDefaults);
    closeTo(state.imageDistanceMeters, 0.3);
    closeTo(state.magnification, -1);
    closeTo(state.imageHeightMeters, -0.1);
    expect(state.regime).toBe("real");
    expect(state.orientation).toBe("inverted");
    expect(state.relativeSize).toBe("same");
  });

  it("forms a reduced real image beyond 2F", () => {
    const state = solveThinLens({...thinLensDefaults, objectDistanceMeters: 0.45});
    closeTo(state.imageDistanceMeters, 0.225);
    closeTo(state.magnification, -0.5);
    expect(state.relativeSize).toBe("reduced");
  });

  it("forms an enlarged real image between F and 2F", () => {
    const state = solveThinLens({...thinLensDefaults, objectDistanceMeters: 0.2});
    closeTo(state.imageDistanceMeters, 0.6);
    closeTo(state.magnification, -3);
    expect(state.relativeSize).toBe("enlarged");
  });

  it("forms an upright virtual magnified image inside F", () => {
    const state = solveThinLens({...thinLensDefaults, objectDistanceMeters: 0.1});
    closeTo(state.imageDistanceMeters, -0.3);
    closeTo(state.magnification, 3);
    expect(state.regime).toBe("virtual");
    expect(state.orientation).toBe("upright");
    expect(state.relativeSize).toBe("enlarged");
  });

  it("forms an upright reduced virtual image with a diverging lens", () => {
    const state = solveThinLens({...thinLensDefaults, lensType: "diverging", objectDistanceMeters: 0.3});
    closeTo(state.signedFocalLengthMeters, -0.15);
    closeTo(state.imageDistanceMeters, -0.1);
    closeTo(state.magnification, 1 / 3);
    expect(state.regime).toBe("virtual");
    expect(state.orientation).toBe("upright");
    expect(state.relativeSize).toBe("reduced");
  });

  it("reports parallel output and an image at infinity at F", () => {
    const state = solveThinLens({...thinLensDefaults, objectDistanceMeters: 0.15});
    expect(state.regime).toBe("at-focus");
    expect(state.imageDistanceMeters).toBeNull();
    expect(state.magnification).toBeNull();
    expect(state.outgoingRaysParallel).toBe(true);
    expect(inspectThinLens(state.parameters).some((issue) => issue.id === "image-at-infinity")).toBe(true);
  });

  it("rejects values outside the classroom parameter ranges", () => {
    expect(thinLensParametersSchema.safeParse({...thinLensDefaults, focalLengthMeters: 0.09}).success).toBe(false);
    expect(thinLensParametersSchema.safeParse({...thinLensDefaults, objectDistanceMeters: 0.61}).success).toBe(false);
    expect(thinLensParametersSchema.safeParse({...thinLensDefaults, objectHeightMeters: 0.17}).success).toBe(false);
  });

  it("clamps construction progress deterministically", () => {
    expect(getThinLensConstructionProgress(-1)).toBe(0);
    expect(getThinLensConstructionProgress(3)).toBe(0.5);
    expect(getThinLensConstructionProgress(9)).toBe(1);
    expect(getThinLensConstructionProgress(3, 0)).toBe(0);
  });

  it("always reports the model boundary", () => {
    const issues = inspectThinLens(thinLensDefaults);
    expect(issues).toEqual(expect.arrayContaining([expect.objectContaining({id: "thin-lens-assumptions", severity: "assumption"})]));
  });
});
