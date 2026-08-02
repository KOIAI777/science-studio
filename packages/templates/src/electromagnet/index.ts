import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {z} from "zod";

export const ELECTROMAGNET_TEMPLATE_ID = "electricity.electromagnet";
export const ELECTROMAGNET_TEMPLATE_VERSION = "0.1.0";
export const VACUUM_PERMEABILITY_HM = 4 * Math.PI * 1e-7;
export const COIL_RADIUS_M = 0.045;
export const IRON_EFFECTIVE_RELATIVE_PERMEABILITY = 80;
export const EARTH_REFERENCE_FIELD_T = 50e-6;
export const ELECTROMAGNET_DURATION_SECONDS = 12;

export const electromagnetCoreSchema = z.enum(["air", "iron"]);
export type ElectromagnetCore = z.infer<typeof electromagnetCoreSchema>;

export const electromagnetDirectionSchema = z.enum(["counterclockwise", "clockwise"]);
export type ElectromagnetDirection = z.infer<typeof electromagnetDirectionSchema>;

export const electromagnetParametersSchema = z.object({
  currentA: z.number().finite().min(0).max(3),
  turns: z.number().int().min(40).max(240),
  coilLengthM: z.number().finite().min(0.12).max(0.36),
  probeDistanceM: z.number().finite().min(0.06).max(0.35),
  core: electromagnetCoreSchema,
  currentDirection: electromagnetDirectionSchema,
  switchClosed: z.boolean(),
});

export type ElectromagnetParameters = z.infer<typeof electromagnetParametersSchema>;
export type MagneticPole = "north" | "south" | "none";

export interface ElectromagnetProfile {
  parameters: ElectromagnetParameters;
  relativePermeability: number;
  directionSign: 1 | -1;
  turnDensityPerM: number;
  ampereTurns: number;
  centerFieldT: number;
  probeFieldT: number;
  signedProbeFieldT: number;
  compassDeflectionDegrees: number;
  leftPole: MagneticPole;
  rightPole: MagneticPole;
  active: boolean;
}

export interface ElectromagnetState extends ElectromagnetProfile {
  timeSeconds: number;
  currentMarkerPhase: number;
  normalizedFieldStrength: number;
}

export const electromagnetDefaults: ElectromagnetParameters = {
  currentA: 1.5,
  turns: 120,
  coilLengthM: 0.24,
  probeDistanceM: 0.12,
  core: "air",
  currentDirection: "counterclockwise",
  switchClosed: true,
};

export const electromagnetTemplate: ExperimentTemplateContract = {
  id: ELECTROMAGNET_TEMPLATE_ID,
  version: ELECTROMAGNET_TEMPLATE_VERSION,
  catalog: {
    slug: "electromagnets",
    title: "Electromagnets: Current, Coils & Polarity",
    summary: "Change current, turns, core, and direction to predict field strength and magnetic polarity.",
    gradeLevel: "middle",
    subject: "electricity",
    lessonMinutes: 15,
    concepts: ["Electromagnets", "Magnetic Fields", "Polarity", "Right-hand Rule"],
  },
  learningObjectives: [
    "Connect electric current in a coil to the magnetic field it produces.",
    "Predict how current, turn count, and coil length affect field strength.",
    "Use the right-hand grip rule to identify the north and south ends of a solenoid.",
    "Compare an air core with an idealized linear iron core.",
    "Use a compass probe to detect the field direction outside the coil.",
  ],
  parameterDefinitions: [
    {key: "currentA", unit: "A", min: 0, max: 3, step: 0.1, requiredFor: "model"},
    {key: "turns", unit: "turns", min: 40, max: 240, step: 20, requiredFor: "model"},
    {key: "coilLengthM", unit: "m", min: 0.12, max: 0.36, step: 0.02, requiredFor: "model"},
    {key: "probeDistanceM", unit: "m", min: 0.06, max: 0.35, step: 0.01, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "ampereTurns", unit: "A·turn", digits: 0, visibleIn: ["experiment", "present"]},
    {key: "turnDensityPerM", unit: "turns/m", digits: 0, visibleIn: ["experiment", "present"]},
    {key: "centerFieldT", unit: "T", digits: 6, visibleIn: ["experiment", "present"]},
    {key: "probeFieldT", unit: "T", digits: 6, visibleIn: ["experiment", "present"]},
    {key: "compassDeflectionDegrees", unit: "deg", digits: 1, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "circuit", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 1, highlights: ["source", "current"]},
    {id: "coil", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 3, highlights: ["coil", "turns"]},
    {id: "field", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 5, highlights: ["field", "strength"]},
    {id: "polarity", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 7, highlights: ["poles", "right-hand-rule"]},
    {id: "core", durationSeconds: 2.5, simulationMode: "hold", simulationTimeSeconds: 9, highlights: ["core", "permeability"]},
    {id: "probe", durationSeconds: 2.5, simulationMode: "play", simulationTimeSeconds: 11, highlights: ["compass", "probe-field"]},
  ],
  assumptions: [
    "The coil is modeled as a finite, tightly wound solenoid with fixed 45 mm radius and uniform turns.",
    "The current is steady DC; switching transients, resistance, heating, and power-supply limits are excluded.",
    "The iron core uses a constant effective relative permeability of 80, so hysteresis, remanence, and saturation are not solved.",
    "The compass combines the calculated axial coil field with a fixed 50 microtesla perpendicular reference field.",
    "Field lines are a direction diagram; their drawn spacing is qualitative and is not a numerical field map.",
  ],
};

function assertTime(timeSeconds: number) {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }
}

function moduloOne(value: number) {
  return ((value % 1) + 1) % 1;
}

export function finiteSolenoidFieldT(
  parameters: ElectromagnetParameters,
  axialPositionM: number,
) {
  const parsed = electromagnetParametersSchema.parse(parameters);
  if (!Number.isFinite(axialPositionM)) throw new RangeError("Axial position must be finite.");
  if (!parsed.switchClosed || parsed.currentA === 0) return 0;

  const halfLength = parsed.coilLengthM / 2;
  const relativePermeability = parsed.core === "iron"
    ? IRON_EFFECTIVE_RELATIVE_PERMEABILITY
    : 1;
  const turnDensityPerM = parsed.turns / parsed.coilLengthM;
  const nearEnd = axialPositionM + halfLength;
  const farEnd = axialPositionM - halfLength;
  const geometry = nearEnd / Math.sqrt(COIL_RADIUS_M ** 2 + nearEnd ** 2)
    - farEnd / Math.sqrt(COIL_RADIUS_M ** 2 + farEnd ** 2);

  return VACUUM_PERMEABILITY_HM
    * relativePermeability
    * turnDensityPerM
    * parsed.currentA
    * geometry
    / 2;
}

export function createElectromagnetProfile(input: ElectromagnetParameters): ElectromagnetProfile {
  const parameters = electromagnetParametersSchema.parse(input);
  const active = parameters.switchClosed && parameters.currentA > 0;
  const directionSign = parameters.currentDirection === "counterclockwise" ? 1 : -1;
  const relativePermeability = parameters.core === "iron"
    ? IRON_EFFECTIVE_RELATIVE_PERMEABILITY
    : 1;
  const turnDensityPerM = parameters.turns / parameters.coilLengthM;
  const ampereTurns = active ? parameters.turns * parameters.currentA : 0;
  const centerFieldT = finiteSolenoidFieldT(parameters, 0);
  const probeAxialPositionM = parameters.coilLengthM / 2 + parameters.probeDistanceM;
  const probeFieldT = finiteSolenoidFieldT(parameters, probeAxialPositionM);
  const signedProbeFieldT = active ? directionSign * probeFieldT : 0;
  const compassDeflectionDegrees = Math.atan2(signedProbeFieldT, EARTH_REFERENCE_FIELD_T) * 180 / Math.PI;

  return {
    parameters,
    relativePermeability,
    directionSign,
    turnDensityPerM,
    ampereTurns,
    centerFieldT,
    probeFieldT,
    signedProbeFieldT,
    compassDeflectionDegrees,
    leftPole: active ? (directionSign > 0 ? "south" : "north") : "none",
    rightPole: active ? (directionSign > 0 ? "north" : "south") : "none",
    active,
  };
}

export function sampleElectromagnet(profile: ElectromagnetProfile, timeSeconds: number): ElectromagnetState {
  assertTime(timeSeconds);
  const cyclesPerSecond = 0.08 + profile.parameters.currentA * 0.035;
  return {
    ...profile,
    timeSeconds,
    currentMarkerPhase: profile.active
      ? moduloOne(timeSeconds * cyclesPerSecond * profile.directionSign)
      : 0,
    normalizedFieldStrength: Math.min(1, profile.centerFieldT / 0.5),
  };
}

export function solveElectromagnet(input: ElectromagnetParameters, timeSeconds = 0) {
  return sampleElectromagnet(createElectromagnetProfile(input), timeSeconds);
}

export function inspectElectromagnet(parameters: ElectromagnetParameters): ScienceIssue[] {
  const parsed = electromagnetParametersSchema.safeParse(parameters);
  if (!parsed.success) {
    return parsed.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "Invalid parameter",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const profile = createElectromagnetProfile(parsed.data);
  const issues: ScienceIssue[] = [];
  if (profile.parameters.core === "iron" && profile.centerFieldT >= 0.25) {
    issues.push({
      id: "linear-core-limit",
      severity: "warning",
      title: "Linear core limit",
      detail: "The idealized iron-core result is approaching a region where a real core may saturate and stop scaling linearly.",
      path: "core",
    });
  }
  issues.push({
    id: "electromagnet-assumptions",
    severity: "assumption",
    title: "Ideal finite-solenoid model",
    detail: "The calculated values use uniform turns and a constant effective core permeability; heating, hysteresis, saturation, and switching transients are excluded.",
  });
  return issues;
}
