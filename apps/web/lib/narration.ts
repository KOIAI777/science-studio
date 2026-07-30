import type {NarrationStep} from "@science-studio/experiment-schema";

export const NARRATION_STEP_IDS = [
  "setup",
  "forces",
  "components",
  "equation",
  "result",
] as const;

export type NarrationStepId = (typeof NARRATION_STEP_IDS)[number];

export type NarrationStepText = Record<
  NarrationStepId,
  {title: string; caption: string}
>;

export type NarrationTextOverrides = Partial<
  Record<NarrationStepId, Partial<{title: string; caption: string}>>
>;

export type NarrationDurationOverrides = Partial<Record<NarrationStepId, number>>;

const stepDefinitions: Array<
  Pick<
    NarrationStep,
    "id" | "durationSeconds" | "simulationMode" | "simulationTimeSeconds" | "highlights"
  >
> = [
  {
    id: "setup",
    durationSeconds: 2,
    simulationMode: "hold",
    simulationTimeSeconds: 0,
    highlights: ["setup"],
  },
  {
    id: "forces",
    durationSeconds: 2,
    simulationMode: "hold",
    simulationTimeSeconds: 0,
    highlights: ["forces"],
  },
  {
    id: "components",
    durationSeconds: 2,
    simulationMode: "hold",
    simulationTimeSeconds: 0,
    highlights: ["components"],
  },
  {
    id: "equation",
    durationSeconds: 2,
    simulationMode: "hold",
    simulationTimeSeconds: 0,
    highlights: ["equation"],
  },
  {
    id: "result",
    durationSeconds: 4,
    simulationMode: "play",
    simulationTimeSeconds: 0,
    highlights: ["result"],
  },
];

export function buildNarrationSteps(
  text: NarrationStepText,
  textOverrides: NarrationTextOverrides,
  durationOverrides: NarrationDurationOverrides,
): NarrationStep[] {
  return stepDefinitions.map((definition) => {
    const id = definition.id as NarrationStepId;
    return {
      ...definition,
      title: textOverrides[id]?.title ?? text[id].title,
      caption: textOverrides[id]?.caption ?? text[id].caption,
      durationSeconds: durationOverrides[id] ?? definition.durationSeconds,
    };
  });
}

export function getNarrationDuration(steps: NarrationStep[]) {
  return steps.reduce((total, step) => total + step.durationSeconds, 0);
}

export function getNarrationStepStart(steps: NarrationStep[], index: number) {
  return steps
    .slice(0, Math.max(0, index))
    .reduce((total, step) => total + step.durationSeconds, 0);
}

export function resolveNarrationFrame(
  steps: NarrationStep[],
  timeSeconds: number,
  simulationEndSeconds: number | null,
) {
  const durationSeconds = getNarrationDuration(steps);
  const clampedTime = Math.min(Math.max(timeSeconds, 0), durationSeconds);
  let elapsed = 0;

  for (let index = 0; index < steps.length; index += 1) {
    const step = steps[index];
    const stepEnd = elapsed + step.durationSeconds;
    const isLast = index === steps.length - 1;

    if (clampedTime < stepEnd || isLast) {
      const localTimeSeconds = Math.min(
        Math.max(clampedTime - elapsed, 0),
        step.durationSeconds,
      );
      const simulationTimeSeconds = step.simulationMode === "play"
        ? (localTimeSeconds / step.durationSeconds) * (simulationEndSeconds ?? 0)
        : step.simulationTimeSeconds;

      return {
        step,
        index,
        localTimeSeconds,
        simulationTimeSeconds,
      };
    }

    elapsed = stepEnd;
  }

  throw new RangeError("Narration requires at least one step.");
}
