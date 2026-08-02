import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const THIN_LENS_TEMPLATE_ID = "optics.thin-lens";
export const THIN_LENS_TEMPLATE_VERSION = "0.1.0";

const FOCUS_EPSILON_METERS = 1e-9;

export const thinLensParametersSchema = z.object({
  lensType: z.enum(["converging", "diverging"]),
  focalLengthMeters: z.number().finite().min(0.1).max(0.3),
  objectDistanceMeters: z.number().finite().min(0.08).max(0.6),
  objectHeightMeters: z.number().finite().min(0.06).max(0.16),
  showLabels: z.boolean(),
  showPrincipalRays: z.boolean(),
});

export type ThinLensParameters = z.infer<typeof thinLensParametersSchema>;
export type ThinLensRegime = "real" | "virtual" | "at-focus";
export type ThinLensOrientation = "upright" | "inverted" | "at-infinity";
export type ThinLensRelativeSize = "reduced" | "same" | "enlarged" | "at-infinity";

export interface ThinLensState {
  parameters: ThinLensParameters;
  signedFocalLengthMeters: number;
  imageDistanceMeters: number | null;
  magnification: number | null;
  imageHeightMeters: number | null;
  regime: ThinLensRegime;
  orientation: ThinLensOrientation;
  relativeSize: ThinLensRelativeSize;
  imageIsReal: boolean;
  imageIsVirtual: boolean;
  outgoingRaysParallel: boolean;
}

export const thinLensDefaults: ThinLensParameters = {
  lensType: "converging",
  focalLengthMeters: 0.15,
  objectDistanceMeters: 0.3,
  objectHeightMeters: 0.1,
  showLabels: true,
  showPrincipalRays: true,
};

export const thinLensTemplate: ExperimentTemplateContract = {
  id: THIN_LENS_TEMPLATE_ID,
  version: THIN_LENS_TEMPLATE_VERSION,
  catalog: {
    slug: "lenses-image-formation",
    title: "Lenses & Image Formation",
    summary: "Construct principal rays and predict where a converging or diverging lens forms its image.",
    gradeLevel: "middle",
    subject: "optics",
    lessonMinutes: 15,
    concepts: ["Thin Lenses", "Principal Rays", "Focal Length", "Magnification"],
  },
  learningObjectives: [
    "Use three principal rays to locate the image formed by a thin lens.",
    "Apply the thin-lens equation to calculate image distance.",
    "Use magnification to predict image orientation and height.",
    "Distinguish real images from virtual images using ray convergence and backward extensions.",
    "Compare image formation beyond 2F, at 2F, inside F, and with a diverging lens.",
  ],
  parameterDefinitions: [
    {key: "focalLengthMeters", unit: "m", min: 0.1, max: 0.3, step: 0.01, requiredFor: "model"},
    {key: "objectDistanceMeters", unit: "m", min: 0.08, max: 0.6, step: 0.01, requiredFor: "model"},
    {key: "objectHeightMeters", unit: "m", min: 0.06, max: 0.16, step: 0.01, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "signedFocalLengthMeters", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "imageDistanceMeters", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "magnification", unit: "x", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "imageHeightMeters", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "bench", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["bench", "object"]},
    {id: "parallel-ray", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["parallel-ray", "focus"]},
    {id: "center-ray", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["center-ray"]},
    {id: "focal-ray", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["focal-ray", "focus"]},
    {id: "image", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["image", "extensions"]},
    {id: "equation", durationSeconds: 3, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["equation", "measurements"]},
  ],
  assumptions: [
    "The lens is thin, centered on the optical axis, and represented by one focal length.",
    "The object is real and perpendicular to the optical axis; distances follow the Cartesian sign convention.",
    "Geometric optics is used. Aberration, diffraction, dispersion, lens thickness, and intensity are excluded.",
    "Guided narration orders the ray-construction explanation; experiment mode has no physical time axis.",
  ],
};

export function solveThinLens(input: ThinLensParameters): ThinLensState {
  const parameters = thinLensParametersSchema.parse(input);
  const {lensType, focalLengthMeters: focalMagnitude, objectDistanceMeters: u, objectHeightMeters: objectHeight} = parameters;
  const f = lensType === "converging" ? focalMagnitude : -focalMagnitude;
  const atFocus = lensType === "converging" && Math.abs(u - f) <= FOCUS_EPSILON_METERS;

  if (atFocus) {
    return {
      parameters,
      signedFocalLengthMeters: f,
      imageDistanceMeters: null,
      magnification: null,
      imageHeightMeters: null,
      regime: "at-focus",
      orientation: "at-infinity",
      relativeSize: "at-infinity",
      imageIsReal: false,
      imageIsVirtual: false,
      outgoingRaysParallel: true,
    };
  }

  const v = f * u / (u - f);
  const magnification = -v / u;
  const imageHeight = magnification * objectHeight;
  const absoluteMagnification = Math.abs(magnification);
  const relativeSize: ThinLensRelativeSize = Math.abs(absoluteMagnification - 1) <= 1e-9
    ? "same"
    : absoluteMagnification < 1 ? "reduced" : "enlarged";

  return {
    parameters,
    signedFocalLengthMeters: f,
    imageDistanceMeters: v,
    magnification,
    imageHeightMeters: imageHeight,
    regime: v > 0 ? "real" : "virtual",
    orientation: magnification >= 0 ? "upright" : "inverted",
    relativeSize,
    imageIsReal: v > 0,
    imageIsVirtual: v < 0,
    outgoingRaysParallel: false,
  };
}

export function getThinLensConstructionProgress(elapsedSeconds: number, durationSeconds = 6) {
  if (!Number.isFinite(elapsedSeconds) || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return 0;
  return Math.max(0, Math.min(1, elapsedSeconds / durationSeconds));
}

export function inspectThinLens(parameters: ThinLensParameters): ScienceIssue[] {
  const result = thinLensParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const state = solveThinLens(result.data);
  const issues: ScienceIssue[] = [];
  if (state.regime === "at-focus") {
    issues.push({
      id: "image-at-infinity",
      severity: "warning",
      title: "Image at infinity",
      detail: "The object is at the focal point, so the ideal outgoing rays are parallel and no finite image is formed.",
      path: "objectDistanceMeters",
    });
  }
  issues.push({
    id: "thin-lens-assumptions",
    severity: "assumption",
    title: "Ideal thin-lens model",
    detail: "The lens is thin and paraxial. Aberration, diffraction, dispersion, thickness, and brightness are not modeled.",
  });
  return issues;
}
