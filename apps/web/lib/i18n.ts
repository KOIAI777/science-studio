import type {ScienceIssue} from "@science-studio/experiment-schema";
import type {NarrationStepText} from "./narration";

export type Locale = "en" | "zh-CN";

export interface WorkbenchCopy {
  projectName: string;
  localDraft: string;
  modeLabel: string;
  modes: {experiment: string; narration: string; export: string};
  actions: {
    undo: string;
    redo: string;
    scienceCheck: string;
    collapseParameters: string;
    reset: string;
    previousFrame: string;
    play: string;
    pause: string;
    nextFrame: string;
    speed: string;
    switchLanguage: string;
  };
  stage: {outputCanvas: string; format: string};
  panel: {kicker: string; parameters: string; measurements: string; scienceNotes: string};
  narration: {
    kicker: string;
    steps: string;
    stepCount: (current: number, total: number) => string;
    title: string;
    caption: string;
    duration: string;
    seconds: string;
    scene: string;
    holdFrame: string;
    playMotion: string;
    restoreDefaults: string;
    timeline: string;
    stepText: NarrationStepText;
  };
  parameters: Record<string, string>;
  measurements: {
    analytical: string;
    staticEquilibrium: string;
    acceleration: string;
    velocity: string;
    bottomVelocity: string;
    displacement: string;
    normalForce: string;
  };
  canvas: {
    ariaLabel: string;
    description: string;
    title: string;
    subtitle: string;
    motionLabel: string;
    stationary: string;
    sliding: string;
    complete: string;
    analyticalResult: string;
    assumptions: string;
    invalid: string;
  };
  validation: {
    range: (min: number, max: number) => string;
    frictionOrder: string;
  };
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    stationaryTitle: string;
    stationaryDetail: (criticalAngle: number) => string;
    criticalTitle: string;
    criticalDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const english: WorkbenchCopy = {
  projectName: "Inclined Plane & Friction",
  localDraft: "Local draft",
  modeLabel: "Editor mode",
  modes: {experiment: "Experiment", narration: "Narration", export: "Export"},
  actions: {
    undo: "Undo",
    redo: "Redo",
    scienceCheck: "Science check",
    collapseParameters: "Collapse parameters",
    reset: "Reset",
    previousFrame: "Previous frame",
    play: "Play",
    pause: "Pause",
    nextFrame: "Next frame",
    speed: "Speed",
    switchLanguage: "Switch to Chinese",
  },
  stage: {outputCanvas: "Output canvas", format: "9:16 · 720 × 1280"},
  panel: {
    kicker: "EXPERIMENT",
    parameters: "Parameters",
    measurements: "Live measurements",
    scienceNotes: "Science notes",
  },
  narration: {
    kicker: "NARRATION",
    steps: "Lesson steps",
    stepCount: (current, total) => `Step ${current} of ${total}`,
    title: "Title",
    caption: "On-screen explanation",
    duration: "Duration",
    seconds: "s",
    scene: "Scene behavior",
    holdFrame: "Hold frame",
    playMotion: "Play motion",
    restoreDefaults: "Restore default steps",
    timeline: "Lesson timeline",
    stepText: {
      setup: {
        title: "Set up the experiment",
        caption: "A block rests on a 32° inclined plane.",
      },
      forces: {
        title: "Identify the forces",
        caption: "Gravity, the normal force, and friction act on the block.",
      },
      components: {
        title: "Resolve gravity",
        caption: "Resolve gravity parallel and perpendicular to the plane.",
      },
      equation: {
        title: "Predict the motion",
        caption: "The downhill component exceeds kinetic friction.",
      },
      result: {
        title: "Observe the result",
        caption: "The block accelerates down the ramp and reaches the bottom.",
      },
    },
  },
  parameters: {
    angleDegrees: "Incline angle",
    massKg: "Block mass",
    staticFrictionCoefficient: "Static friction",
    kineticFrictionCoefficient: "Kinetic friction",
    gravityMs2: "Gravity",
    rampLengthM: "Ramp length",
  },
  measurements: {
    analytical: "Analytical",
    staticEquilibrium: "Static equilibrium",
    acceleration: "Acceleration",
    velocity: "Current velocity",
    bottomVelocity: "Bottom velocity",
    displacement: "Displacement",
    normalForce: "Normal force",
  },
  canvas: {
    ariaLabel: "Inclined plane forces and friction experiment canvas",
    description: "A block on an inclined plane with gravity, normal force, friction, and resolved gravity components.",
    title: "Inclined Plane & Friction",
    subtitle: "Resolve gravity to predict sliding.",
    motionLabel: "MOTION",
    stationary: "AT REST",
    sliding: "SLIDING DOWN",
    complete: "RAMP END",
    analyticalResult: "ANALYTICAL RESULT",
    assumptions: "Rigid body · Constant friction · No air drag",
    invalid: "Fix the parameters to resume",
  },
  validation: {
    range: (min, max) => `Enter a value from ${min} to ${max}.`,
    frictionOrder: "Kinetic friction cannot exceed static friction.",
  },
  issues: {
    invalidTitle: "Invalid parameter",
    invalidDetail: "Check the highlighted input before running the experiment.",
    stationaryTitle: "The block remains at rest",
    stationaryDetail: (criticalAngle) => `The incline does not exceed the ${criticalAngle.toFixed(1)}° critical angle.`,
    criticalTitle: "Near the critical angle",
    criticalDetail: "A small change in angle or friction may change the motion state.",
    assumptionTitle: "Ideal rigid-body model",
    assumptionDetail: "Air drag, rolling, and surface deformation are ignored; friction is constant.",
  },
};

const chinese: WorkbenchCopy = {
  projectName: "斜面受力与摩擦",
  localDraft: "本地草稿",
  modeLabel: "编辑模式",
  modes: {experiment: "实验", narration: "讲解", export: "导出"},
  actions: {
    undo: "撤销",
    redo: "重做",
    scienceCheck: "科学检查",
    collapseParameters: "收起参数",
    reset: "重置",
    previousFrame: "后退一帧",
    play: "播放",
    pause: "暂停",
    nextFrame: "前进一帧",
    speed: "速度",
    switchLanguage: "切换到英文",
  },
  stage: {outputCanvas: "输出画面", format: "9:16 · 720 × 1280"},
  panel: {kicker: "EXPERIMENT", parameters: "实验参数", measurements: "实时测量", scienceNotes: "科学说明"},
  narration: {
    kicker: "NARRATION",
    steps: "讲解步骤",
    stepCount: (current, total) => `第 ${current} 步，共 ${total} 步`,
    title: "标题",
    caption: "画面讲解",
    duration: "持续时间",
    seconds: "秒",
    scene: "画面行为",
    holdFrame: "保持画面",
    playMotion: "播放运动",
    restoreDefaults: "恢复默认步骤",
    timeline: "教学时间轴",
    stepText: {
      setup: {
        title: "设置实验",
        caption: "物体静置在 32° 的斜面上。",
      },
      forces: {
        title: "识别受力",
        caption: "物体受到重力、支持力和摩擦力。",
      },
      components: {
        title: "分解重力",
        caption: "将重力分解为沿斜面和垂直斜面的分量。",
      },
      equation: {
        title: "预测运动",
        caption: "沿斜面的重力分量大于动摩擦力。",
      },
      result: {
        title: "观察结果",
        caption: "物体沿斜面加速运动并到达底端。",
      },
    },
  },
  parameters: {
    angleDegrees: "斜面角度",
    massKg: "物体质量",
    staticFrictionCoefficient: "静摩擦系数",
    kineticFrictionCoefficient: "动摩擦系数",
    gravityMs2: "重力加速度",
    rampLengthM: "斜面长度",
  },
  measurements: {
    analytical: "解析解",
    staticEquilibrium: "静力平衡",
    acceleration: "加速度",
    velocity: "当前速度",
    bottomVelocity: "底端速度",
    displacement: "位移",
    normalForce: "支持力",
  },
  canvas: {
    ariaLabel: "斜面受力与摩擦实验画布",
    description: "展示物体在斜面上的位置、重力、支持力、摩擦力和重力分量。",
    title: "斜面上的摩擦力",
    subtitle: "力的分解如何决定物体是否开始滑动",
    motionLabel: "运动状态",
    stationary: "静止",
    sliding: "沿斜面下滑",
    complete: "到达末端",
    analyticalResult: "解析结果",
    assumptions: "理想刚体 · 恒定摩擦 · 忽略空气阻力",
    invalid: "修正参数后恢复实验",
  },
  validation: {
    range: (min, max) => `请输入 ${min} 到 ${max} 之间的数值。`,
    frictionOrder: "动摩擦系数不能大于静摩擦系数。",
  },
  issues: {
    invalidTitle: "参数无法运行",
    invalidDetail: "运行实验前请检查高亮的参数。",
    stationaryTitle: "物体保持静止",
    stationaryDetail: (criticalAngle) => `当前角度未超过临界角 ${criticalAngle.toFixed(1)}°。`,
    criticalTitle: "接近临界角",
    criticalDetail: "微小的角度或摩擦系数变化可能改变运动状态。",
    assumptionTitle: "理想刚体模型",
    assumptionDetail: "忽略空气阻力、滚动、接触面形变，并假设摩擦系数恒定。",
  },
};

export const workbenchCopy: Record<Locale, WorkbenchCopy> = {
  en: english,
  "zh-CN": chinese,
};

export function localizeScienceIssue(
  issue: ScienceIssue,
  locale: Locale,
  criticalAngleDegrees?: number,
) {
  if (locale === "zh-CN") {
    return {title: issue.title, detail: issue.detail};
  }

  const copy = english.issues;
  switch (issue.id) {
    case "stationary-condition":
      return {
        title: copy.stationaryTitle,
        detail: copy.stationaryDetail(criticalAngleDegrees ?? 0),
      };
    case "near-critical-angle":
      return {title: copy.criticalTitle, detail: copy.criticalDetail};
    case "model-assumptions":
      return {title: copy.assumptionTitle, detail: copy.assumptionDetail};
    default:
      return {title: copy.invalidTitle, detail: copy.invalidDetail};
  }
}
