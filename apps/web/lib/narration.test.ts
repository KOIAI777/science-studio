import {describe, expect, it} from "vitest";
import {
  buildNarrationSteps,
  getNarrationDuration,
  getNarrationStepStart,
  resolveNarrationFrame,
  type NarrationStepText,
} from "./narration";
import {inclinedPlaneTemplate} from "@science-studio/templates/inclined-plane";

const text: NarrationStepText = {
  setup: {title: "Setup", caption: "Set up the experiment."},
  forces: {title: "Forces", caption: "Identify the forces."},
  components: {title: "Components", caption: "Resolve gravity."},
  equation: {title: "Equation", caption: "Predict the motion."},
  result: {title: "Result", caption: "Observe the result."},
};

describe("narration timeline", () => {
  const steps = buildNarrationSteps(text, {}, {}, inclinedPlaneTemplate.narration);

  it("builds the fixed 12 second lesson sequence", () => {
    expect(steps.map((step) => step.id)).toEqual([
      "setup",
      "forces",
      "components",
      "equation",
      "result",
    ]);
    expect(getNarrationDuration(steps)).toBe(12);
    expect(getNarrationStepStart(steps, 4)).toBe(8);
  });

  it("holds simulation time during explanation steps", () => {
    const frame = resolveNarrationFrame(steps, 7.5, 3.5);

    expect(frame.step.id).toBe("equation");
    expect(frame.simulationTimeSeconds).toBe(0);
  });

  it("maps the final lesson step to the complete physical motion", () => {
    const halfway = resolveNarrationFrame(steps, 10, 3.5);
    const complete = resolveNarrationFrame(steps, 12, 3.5);

    expect(halfway.step.id).toBe("result");
    expect(halfway.simulationTimeSeconds).toBeCloseTo(1.75);
    expect(complete.simulationTimeSeconds).toBeCloseTo(3.5);
  });

  it("applies text and duration edits without changing step behavior", () => {
    const edited = buildNarrationSteps(
      text,
      {forces: {title: "Name every force"}},
      {forces: 3.5},
      inclinedPlaneTemplate.narration,
    );

    expect(edited[1]).toMatchObject({
      title: "Name every force",
      caption: "Identify the forces.",
      durationSeconds: 3.5,
      simulationMode: "hold",
    });
  });
});
