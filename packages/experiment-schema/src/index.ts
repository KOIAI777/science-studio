import {z} from "zod";

export const narrationStepSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(80),
  durationSeconds: z.number().positive().max(30),
  showForces: z.boolean(),
  showFormula: z.boolean(),
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
