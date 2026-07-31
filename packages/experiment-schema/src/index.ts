import {z} from "zod";

export const narrationStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  caption: z.string().min(1).max(240),
  durationSeconds: z.number().positive().max(30),
  simulationMode: z.enum(["hold", "play"]),
  simulationTimeSeconds: z.number().nonnegative(),
  highlights: z.array(z.string().min(1)),
});

export const experimentProjectSchema = z.object({
  schemaVersion: z.literal(1),
  locale: z.enum(["en", "zh-CN"]),
  templateId: z.string().min(1),
  templateVersion: z.string().min(1),
  engineVersion: z.string().min(1),
  parameters: z.record(z.string(), z.union([z.number(), z.boolean(), z.string()])),
  narration: z.array(narrationStepSchema).min(1),
  output: z.object({
    aspectRatio: z.literal("9:16"),
    resolution: z.literal("720p"),
    fps: z.literal(30),
  }),
});

export type NarrationStep = z.infer<typeof narrationStepSchema>;
export type ExperimentProject = z.infer<typeof experimentProjectSchema>;

export type ScienceIssueSeverity = "blocking" | "warning" | "assumption";

export interface ScienceIssue {
  id: string;
  severity: ScienceIssueSeverity;
  title: string;
  detail: string;
  path?: string;
}

export interface ExperimentParameterDefinition {
  key: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  requiredFor: "model" | "scene";
}

export interface ExperimentMeasurementDefinition {
  key: string;
  unit: string;
  digits: number;
  visibleIn: Array<"experiment" | "present">;
}

export interface ExperimentNarrationBlueprint {
  id: string;
  durationSeconds: number;
  simulationMode: "hold" | "play";
  simulationTimeSeconds: number;
  highlights: string[];
}

export interface ExperimentTemplateContract {
  id: string;
  version: string;
  catalog: {
    slug: string;
    title: string;
    summary: string;
    gradeLevel: "elementary" | "middle" | "high";
    subject: "mechanics" | "electricity" | "waves" | "fluids";
    lessonMinutes: number;
    concepts: string[];
  };
  learningObjectives: string[];
  parameterDefinitions: ExperimentParameterDefinition[];
  measurementDefinitions: ExperimentMeasurementDefinition[];
  narration: ExperimentNarrationBlueprint[];
  assumptions: string[];
}
