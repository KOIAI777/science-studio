import type {
  ExperimentTemplateContract,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {clamp} from "@science-studio/simulation-core";
import {z} from "zod";

export const ENERGY_TRACK_TEMPLATE_ID = "mechanics.energy-track";
export const ENERGY_TRACK_TEMPLATE_VERSION = "0.1.0";
export const ENERGY_TRACK_RADIUS_M = 12;

const ROOT_SCAN_STEPS = 4096;
const ROOT_REFINEMENT_STEPS = 80;
const TRAJECTORY_STEPS = 4096;
const EPSILON = 1e-10;

export const energyTrackParametersSchema = z.object({
  massKg: z.number().min(0.5).max(10),
  startHeightM: z.number().min(1).max(ENERGY_TRACK_RADIUS_M),
  frictionCoefficient: z.number().min(0).max(0.4),
  gravityMs2: z.number().min(1).max(20),
});

export type EnergyTrackParameters = z.infer<
  typeof energyTrackParametersSchema
>;

export type EnergyTrackMotion = "ready" | "moving" | "complete";
export type EnergyTrackPhase =
  | "descending"
  | "ascending"
  | "stalled"
  | "turning";

export interface EnergyTrackState {
  timeSeconds: number;
  motion: EnergyTrackMotion;
  phase: EnergyTrackPhase;
  angleRadians: number;
  positionXM: number;
  heightM: number;
  arcLengthM: number;
  velocityMs: number;
  normalForceN: number;
  frictionForceN: number;
  kineticEnergyJ: number;
  potentialEnergyJ: number;
  mechanicalEnergyJ: number;
  thermalEnergyJ: number;
  totalEnergyJ: number;
  initialEnergyJ: number;
  bottomVelocityMs: number | null;
  bottomTimeSeconds: number | null;
  endTimeSeconds: number;
  turningHeightM: number;
  reachesBottom: boolean;
}

interface EnergyTrackLookupSample {
  q: number;
  theta: number;
  timeSeconds: number;
}

export interface EnergyTrackTrajectory {
  parameters: EnergyTrackParameters;
  startAngleRadians: number;
  endAngleRadians: number;
  endTimeSeconds: number;
  bottomTimeSeconds: number | null;
  bottomVelocityMs: number | null;
  turningHeightM: number;
  reachesBottom: boolean;
  lookup: EnergyTrackLookupSample[];
}

export const energyTrackDefaults: EnergyTrackParameters = {
  massKg: 2,
  startHeightM: 8,
  frictionCoefficient: 0.08,
  gravityMs2: 9.81,
};

export const energyTrackTemplate: ExperimentTemplateContract = {
  id: ENERGY_TRACK_TEMPLATE_ID,
  version: ENERGY_TRACK_TEMPLATE_VERSION,
  catalog: {
    slug: "energy-track",
    title: "Energy Track",
    summary: "Follow potential, kinetic, and thermal energy through one complete run.",
    gradeLevel: "middle",
    subject: "mechanics",
    lessonMinutes: 12,
    concepts: ["Energy", "Conservation", "Friction"],
  },
  learningObjectives: [
    "Distinguish gravitational potential, kinetic, and thermal energy.",
    "Use an energy budget to track transformations during motion.",
    "Predict the speed at the lowest point of the track.",
    "Explain why friction lowers the return height without destroying energy.",
  ],
  parameterDefinitions: [
    {key: "massKg", unit: "kg", min: 0.5, max: 10, step: 0.1, requiredFor: "model"},
    {key: "startHeightM", unit: "m", min: 1, max: ENERGY_TRACK_RADIUS_M, step: 0.5, requiredFor: "scene"},
    {key: "frictionCoefficient", unit: "μ", min: 0, max: 0.4, step: 0.01, requiredFor: "model"},
    {key: "gravityMs2", unit: "m/s²", min: 1, max: 20, step: 0.01, requiredFor: "model"},
  ],
  measurementDefinitions: [
    {key: "velocityMs", unit: "m/s", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "heightM", unit: "m", digits: 2, visibleIn: ["experiment", "present"]},
    {key: "kineticEnergyJ", unit: "J", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "potentialEnergyJ", unit: "J", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "thermalEnergyJ", unit: "J", digits: 1, visibleIn: ["experiment", "present"]},
    {key: "totalEnergyJ", unit: "J", digits: 1, visibleIn: ["experiment", "present"]},
  ],
  narration: [
    {id: "setup", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["setup"]},
    {id: "stores", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["energy"]},
    {id: "conservation", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["equation"]},
    {id: "prediction", durationSeconds: 2, simulationMode: "hold", simulationTimeSeconds: 0, highlights: ["prediction"]},
    {id: "result", durationSeconds: 4, simulationMode: "play", simulationTimeSeconds: 0, highlights: ["result"]},
  ],
  assumptions: [
    "Point-mass cart constrained to a fixed circular track.",
    "Constant kinetic friction coefficient and no rolling energy.",
    "No air drag, track deformation, or motion after the first turning point.",
  ],
};

function heightAtAngle(angleRadians: number) {
  return ENERGY_TRACK_RADIUS_M * (1 - Math.cos(angleRadians));
}

function particularVelocitySquared(
  angleRadians: number,
  parameters: EnergyTrackParameters,
) {
  const mu = parameters.frictionCoefficient;
  const denominator = 1 + 4 * mu ** 2;
  return (
    (2 * parameters.gravityMs2 * ENERGY_TRACK_RADIUS_M) /
    denominator
  ) * (
    (1 - 2 * mu ** 2) * Math.cos(angleRadians) -
    3 * mu * Math.sin(angleRadians)
  );
}

function velocitySquaredAtAngle(
  angleRadians: number,
  startAngleRadians: number,
  parameters: EnergyTrackParameters,
) {
  const particular = particularVelocitySquared(angleRadians, parameters);
  const initialParticular = particularVelocitySquared(
    startAngleRadians,
    parameters,
  );
  return particular - initialParticular * Math.exp(
    -2 * parameters.frictionCoefficient *
      (angleRadians - startAngleRadians),
  );
}

function findEndAngle(
  startAngleRadians: number,
  parameters: EnergyTrackParameters,
) {
  const symmetricEnd = -startAngleRadians;
  let previousAngle = startAngleRadians;
  let previousVelocitySquared = 0;
  let foundPositiveMotion = false;

  for (let index = 1; index <= ROOT_SCAN_STEPS; index += 1) {
    const angle = startAngleRadians +
      ((symmetricEnd - startAngleRadians) * index) / ROOT_SCAN_STEPS;
    const velocitySquared = velocitySquaredAtAngle(
      angle,
      startAngleRadians,
      parameters,
    );

    if (velocitySquared > EPSILON) foundPositiveMotion = true;

    if (
      foundPositiveMotion &&
      velocitySquared <= 0 &&
      previousVelocitySquared > 0
    ) {
      let lower = previousAngle;
      let upper = angle;
      for (let refinement = 0; refinement < ROOT_REFINEMENT_STEPS; refinement += 1) {
        const midpoint = (lower + upper) / 2;
        const midpointVelocitySquared = velocitySquaredAtAngle(
          midpoint,
          startAngleRadians,
          parameters,
        );
        if (midpointVelocitySquared > 0) lower = midpoint;
        else upper = midpoint;
      }
      return (lower + upper) / 2;
    }

    previousAngle = angle;
    previousVelocitySquared = velocitySquared;
  }

  return foundPositiveMotion ? symmetricEnd : startAngleRadians;
}

function thetaForQ(q: number, startAngle: number, endAngle: number) {
  return startAngle +
    (endAngle - startAngle) * Math.sin((Math.PI * q) / 2) ** 2;
}

function timeAtQ(lookup: EnergyTrackLookupSample[], q: number) {
  const clampedQ = clamp(q, 0, 1);
  const scaledIndex = clampedQ * (lookup.length - 1);
  const lowerIndex = Math.floor(scaledIndex);
  const upperIndex = Math.min(lowerIndex + 1, lookup.length - 1);
  const fraction = scaledIndex - lowerIndex;
  return lookup[lowerIndex].timeSeconds +
    (lookup[upperIndex].timeSeconds - lookup[lowerIndex].timeSeconds) *
      fraction;
}

export function createEnergyTrackTrajectory(
  input: EnergyTrackParameters,
): EnergyTrackTrajectory {
  const parameters = energyTrackParametersSchema.parse(input);
  const startAngleRadians = -Math.acos(
    1 - parameters.startHeightM / ENERGY_TRACK_RADIUS_M,
  );
  const endAngleRadians = findEndAngle(startAngleRadians, parameters);
  const angleRange = endAngleRadians - startAngleRadians;

  if (angleRange <= EPSILON) {
    return {
      parameters,
      startAngleRadians,
      endAngleRadians: startAngleRadians,
      endTimeSeconds: 0,
      bottomTimeSeconds: null,
      bottomVelocityMs: null,
      turningHeightM: parameters.startHeightM,
      reachesBottom: false,
      lookup: [{q: 0, theta: startAngleRadians, timeSeconds: 0}],
    };
  }

  const lookup: EnergyTrackLookupSample[] = [
    {q: 0, theta: startAngleRadians, timeSeconds: 0},
  ];
  let elapsedSeconds = 0;

  for (let index = 1; index <= TRAJECTORY_STEPS; index += 1) {
    const previousQ = (index - 1) / TRAJECTORY_STEPS;
    const q = index / TRAJECTORY_STEPS;
    const midpointQ = (previousQ + q) / 2;
    const midpointTheta = thetaForQ(
      midpointQ,
      startAngleRadians,
      endAngleRadians,
    );
    const derivative = angleRange * (Math.PI / 2) *
      Math.sin(Math.PI * midpointQ);
    const midpointVelocity = Math.sqrt(Math.max(
      velocitySquaredAtAngle(
        midpointTheta,
        startAngleRadians,
        parameters,
      ),
      EPSILON,
    ));
    elapsedSeconds += (
      ENERGY_TRACK_RADIUS_M * derivative * (q - previousQ)
    ) / midpointVelocity;
    lookup.push({
      q,
      theta: thetaForQ(q, startAngleRadians, endAngleRadians),
      timeSeconds: elapsedSeconds,
    });
  }

  const reachesBottom = endAngleRadians >= -EPSILON;
  const bottomQ = reachesBottom
    ? (2 / Math.PI) * Math.asin(Math.sqrt(
      (0 - startAngleRadians) / angleRange,
    ))
    : null;
  const bottomVelocitySquared = reachesBottom
    ? velocitySquaredAtAngle(0, startAngleRadians, parameters)
    : null;

  return {
    parameters,
    startAngleRadians,
    endAngleRadians,
    endTimeSeconds: elapsedSeconds,
    bottomTimeSeconds: bottomQ === null ? null : timeAtQ(lookup, bottomQ),
    bottomVelocityMs: bottomVelocitySquared === null
      ? null
      : Math.sqrt(Math.max(bottomVelocitySquared, 0)),
    turningHeightM: heightAtAngle(endAngleRadians),
    reachesBottom,
    lookup,
  };
}

function sampleLookup(trajectory: EnergyTrackTrajectory, timeSeconds: number) {
  if (trajectory.lookup.length === 1 || timeSeconds <= 0) {
    return trajectory.lookup[0];
  }
  if (timeSeconds >= trajectory.endTimeSeconds) {
    return trajectory.lookup[trajectory.lookup.length - 1];
  }

  let lower = 0;
  let upper = trajectory.lookup.length - 1;
  while (upper - lower > 1) {
    const midpoint = Math.floor((lower + upper) / 2);
    if (trajectory.lookup[midpoint].timeSeconds <= timeSeconds) lower = midpoint;
    else upper = midpoint;
  }

  const lowerSample = trajectory.lookup[lower];
  const upperSample = trajectory.lookup[upper];
  const duration = upperSample.timeSeconds - lowerSample.timeSeconds;
  const fraction = duration <= 0
    ? 0
    : (timeSeconds - lowerSample.timeSeconds) / duration;
  const q = lowerSample.q + (upperSample.q - lowerSample.q) * fraction;
  return {
    q,
    theta: thetaForQ(
      q,
      trajectory.startAngleRadians,
      trajectory.endAngleRadians,
    ),
    timeSeconds,
  };
}

export function sampleEnergyTrack(
  trajectory: EnergyTrackTrajectory,
  timeSeconds: number,
): EnergyTrackState {
  if (!Number.isFinite(timeSeconds) || timeSeconds < 0) {
    throw new RangeError("Time must be a finite, non-negative number.");
  }

  const sampledTime = clamp(timeSeconds, 0, trajectory.endTimeSeconds);
  const sample = sampleLookup(trajectory, sampledTime);
  const complete = timeSeconds >= trajectory.endTimeSeconds;
  const angleRadians = sample.theta;
  const velocitySquared = complete
    ? 0
    : Math.max(velocitySquaredAtAngle(
      angleRadians,
      trajectory.startAngleRadians,
      trajectory.parameters,
    ), 0);
  const velocityMs = Math.sqrt(velocitySquared);
  const heightM = heightAtAngle(angleRadians);
  const positionXM = ENERGY_TRACK_RADIUS_M * Math.sin(angleRadians);
  const arcLengthM = ENERGY_TRACK_RADIUS_M *
    (angleRadians - trajectory.startAngleRadians);
  const initialEnergyJ = trajectory.parameters.massKg *
    trajectory.parameters.gravityMs2 * trajectory.parameters.startHeightM;
  const kineticEnergyJ = 0.5 * trajectory.parameters.massKg * velocitySquared;
  const potentialEnergyJ = trajectory.parameters.massKg *
    trajectory.parameters.gravityMs2 * heightM;
  const thermalEnergyJ = Math.max(
    initialEnergyJ - kineticEnergyJ - potentialEnergyJ,
    0,
  );
  const mechanicalEnergyJ = kineticEnergyJ + potentialEnergyJ;
  const normalForceN = trajectory.parameters.massKg * (
    trajectory.parameters.gravityMs2 * Math.cos(angleRadians) +
    velocitySquared / ENERGY_TRACK_RADIUS_M
  );
  const phase: EnergyTrackPhase = complete
    ? trajectory.reachesBottom ? "turning" : "stalled"
    : angleRadians < 0 ? "descending" : "ascending";

  return {
    timeSeconds,
    motion: sampledTime === 0 ? "ready" : complete ? "complete" : "moving",
    phase,
    angleRadians,
    positionXM,
    heightM,
    arcLengthM,
    velocityMs,
    normalForceN: Math.max(normalForceN, 0),
    frictionForceN: Math.max(
      trajectory.parameters.frictionCoefficient * normalForceN,
      0,
    ),
    kineticEnergyJ,
    potentialEnergyJ,
    mechanicalEnergyJ,
    thermalEnergyJ,
    totalEnergyJ: kineticEnergyJ + potentialEnergyJ + thermalEnergyJ,
    initialEnergyJ,
    bottomVelocityMs: trajectory.bottomVelocityMs,
    bottomTimeSeconds: trajectory.bottomTimeSeconds,
    endTimeSeconds: trajectory.endTimeSeconds,
    turningHeightM: trajectory.turningHeightM,
    reachesBottom: trajectory.reachesBottom,
  };
}

export function solveEnergyTrack(
  input: EnergyTrackParameters,
  timeSeconds: number,
) {
  return sampleEnergyTrack(createEnergyTrackTrajectory(input), timeSeconds);
}

export function inspectEnergyTrack(
  parameters: EnergyTrackParameters,
): ScienceIssue[] {
  const result = energyTrackParametersSchema.safeParse(parameters);
  if (!result.success) {
    return result.error.issues.map((issue, index) => ({
      id: `invalid-parameter-${index}`,
      severity: "blocking",
      title: "参数无法运行",
      detail: issue.message,
      path: issue.path.join("."),
    }));
  }

  const trajectory = createEnergyTrackTrajectory(result.data);
  const issues: ScienceIssue[] = [];
  if (!trajectory.reachesBottom) {
    issues.push({
      id: "stops-before-bottom",
      severity: "warning",
      title: "小车无法到达最低点",
      detail: "当前摩擦会在小车到达轨道最低点前耗尽机械能。",
      path: "frictionCoefficient",
    });
  }
  issues.push({
    id: "energy-track-assumptions",
    severity: "assumption",
    title: "受约束质点模型",
    detail: "忽略车轮转动、空气阻力和轨道形变；播放在第一次转向时结束。",
  });
  return issues;
}
