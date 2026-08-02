"use client";

import type {
  NarrationStep,
  ScienceIssue,
} from "@science-studio/experiment-schema";
import {
  inspectLeverBalance,
  LEVER_STOP_ANGLE_DEGREES,
  leverBalanceDefaults,
  leverBalanceParametersSchema,
  leverBalanceTemplate,
  simulateLeverRelease,
  solveLeverBalance,
  type LeverBalanceOutcome,
  type LeverBalanceParameters,
  type LeverBalanceState,
  type LeverMotionState,
} from "@science-studio/templates/lever-balance";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  FlaskConical,
  Info,
  Languages,
  ListRestart,
  LockKeyhole,
  Maximize2,
  Minimize2,
  Move,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  Scan,
  SkipBack,
  SkipForward,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {ExperimentLibraryBackLink} from "./experiment-library-back-link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { workbenchCopy, type Locale } from "../lib/i18n";
import {
  getNarrationDuration,
  getNarrationStepStart,
  resolveNarrationFrame,
} from "../lib/narration";
import { CanvasTextSizeControls } from "./canvas-text-size-controls";

const FPS = 30;
const CONSTRUCTION_DURATION_SECONDS = 4;
const RELEASE_DURATION_SECONDS = 2;
const EXPERIMENT_DURATION_SECONDS =
  CONSTRUCTION_DURATION_SECONDS + RELEASE_DURATION_SECONDS;
type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type UnknownMode = "none" | "right-mass" | "right-distance";
type LeverPhase =
  | "analyze"
  | "ready"
  | "rotating"
  | "left-stop"
  | "right-stop"
  | "balanced";
type NumericParameterKey =
  | "leftMassKg"
  | "rightMassKg"
  | "leftDistanceM"
  | "rightDistanceM"
  | "gravityMs2";
type LeverStepId =
  | "pivot"
  | "forces"
  | "arms"
  | "moments"
  | "compare"
  | "unknown";
type LeverStepText = Record<LeverStepId, { title: string; caption: string }>;
type LeverTextOverrides = Partial<
  Record<LeverStepId, Partial<{ title: string; caption: string }>>
>;
type LeverDurationOverrides = Partial<Record<LeverStepId, number>>;

interface LeverCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {
    showForces: string;
    showMomentArcs: string;
  };
  presets: { balanced: string; leftWins: string; rightWins: string };
  question: {
    title: string;
    none: string;
    mass: string;
    distance: string;
    reveal: string;
    hide: string;
    unavailable: string;
  };
  toggles: { shown: string; hidden: string };
  outcome: Record<LeverBalanceOutcome, string>;
  measurements: {
    title: string;
    model: string;
    outcome: string;
    leftWeight: string;
    rightWeight: string;
    leftMoment: string;
    rightMoment: string;
    netMoment: string;
    balanceMass: string;
    balanceDistance: string;
    angle: string;
    angularSpeed: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    leftLoad: string;
    rightLoad: string;
    pivot: string;
    beam: string;
    horizontalRelease: string;
    beamWeightNote: string;
    releaseModel: string;
    phase: Record<LeverPhase, string>;
    angle: string;
    mechanicalStops: string;
    leftArm: string;
    rightArm: string;
    counterclockwise: string;
    clockwise: string;
    momentRule: string;
    comparison: string;
    balanceQuestion: string;
    constructionNote: string;
    timelineAnalyze: string;
    timelineRelease: string;
    invalid: string;
  };
  viewport: {
    ratio: string;
    portrait: string;
    landscape: string;
    zoomOut: string;
    zoomIn: string;
    move: string;
    fit: string;
    enterFullscreen: string;
    exitFullscreen: string;
    canvasNavigation: string;
  };
  narration: LeverStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    rangeTitle: string;
    rangeDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const leverCopy: Record<Locale, LeverCopy> = {
  en: {
    projectName: "Levers & Balance",
    packName: "Middle School Pack",
    parameters: {
      leftMassKg: "Left mass",
      rightMassKg: "Right mass",
      leftDistanceM: "Left distance",
      rightDistanceM: "Right distance",
      gravityMs2: "Gravity",
      showForces: "Weight arrows",
      showMomentArcs: "Moment arrows",
    },
    presets: {
      balanced: "Balanced",
      leftWins: "Left side down",
      rightWins: "Right side down",
    },
    question: {
      title: "Question mode",
      none: "Show all",
      mass: "Hide right mass",
      distance: "Hide right distance",
      reveal: "Reveal answer",
      hide: "Hide answer",
      unavailable: "Change the known values to bring this answer into range.",
    },
    toggles: { shown: "Shown", hidden: "Hidden" },
    outcome: {
      balanced: "Balanced · no rotation",
      counterclockwise: "Counterclockwise · left side down",
      clockwise: "Clockwise · right side down",
    },
    measurements: {
      title: "Moment measurements",
      model: "Live release state",
      outcome: "Motion state",
      leftWeight: "Left weight",
      rightWeight: "Right weight",
      leftMoment: "Counterclockwise moment",
      rightMoment: "Clockwise moment",
      netMoment: "Net moment",
      balanceMass: "Right mass for balance",
      balanceDistance: "Right distance for balance",
      angle: "Beam angle",
      angularSpeed: "Angular speed",
    },
    canvas: {
      ariaLabel:
        "Lever balance diagram with pivot, two loads, lever arms, and clockwise and counterclockwise moments",
      title: "Levers & Balance",
      subtitle:
        "Compare moments about one pivot, then solve the condition for equilibrium.",
      leftLoad: "LEFT LOAD",
      rightLoad: "RIGHT LOAD",
      pivot: "PIVOT",
      beam: "RIGID BEAM",
      horizontalRelease: "ANALYZE & RELEASE",
      beamWeightNote: "Ideal low-mass beam · point loads",
      releaseModel: "Iα = Στ · perfectly inelastic stops",
      phase: {
        analyze: "ANALYZE",
        ready: "READY TO RELEASE",
        rotating: "ROTATING",
        "left-stop": "LEFT STOP",
        "right-stop": "RIGHT STOP",
        balanced: "BALANCED",
      },
      angle: "ANGLE",
      mechanicalStops: `MECHANICAL STOPS ±${LEVER_STOP_ANGLE_DEGREES}°`,
      leftArm: "LEFT ARM",
      rightArm: "RIGHT ARM",
      counterclockwise: "COUNTERCLOCKWISE",
      clockwise: "CLOCKWISE",
      momentRule: "PRINCIPLE OF MOMENTS",
      comparison: "MOMENT COMPARISON",
      balanceQuestion: "BALANCE THE LEVER",
      constructionNote: "ANALYZE 0–4 s · RELEASE 4–6 s",
      timelineAnalyze: "Analyze",
      timelineRelease: "Release",
      invalid: "Fix the parameters to resume",
    },
    viewport: {
      ratio: "Canvas ratio",
      portrait: "Portrait 9:16",
      landscape: "Widescreen 16:9",
      zoomOut: "Zoom out",
      zoomIn: "Zoom in",
      move: "Move canvas",
      fit: "Fit canvas",
      enterFullscreen: "Enter fullscreen",
      exitFullscreen: "Exit fullscreen",
      canvasNavigation: "Canvas navigation",
    },
    narration: {
      pivot: {
        title: "Locate the pivot",
        caption:
          "All moments are calculated about the triangular support at the center of the beam.",
      },
      forces: {
        title: "Mark the two weights",
        caption:
          "Each mass produces a vertical force W = mg at its attachment point.",
      },
      arms: {
        title: "Measure perpendicular distance",
        caption:
          "For a horizontal beam, each marked distance is perpendicular to the vertical weight.",
      },
      moments: {
        title: "Calculate both moments",
        caption:
          "Multiply each weight by its perpendicular distance from the pivot.",
      },
      compare: {
        title: "Predict the direction",
        caption:
          "The larger moment determines the initial direction; equal opposing moments give equilibrium.",
      },
      unknown: {
        title: "Solve the missing value",
        caption:
          "Set clockwise moment equal to counterclockwise moment and isolate the hidden mass or distance.",
      },
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail:
        "Check the highlighted input before running the experiment.",
      rangeTitle: "Answer outside the controls",
      rangeDetail:
        "Change the known load or distance before using question mode.",
      assumptionTitle: "Ideal lever release",
      assumptionDetail:
        "The beam starts horizontal, then follows Iα = Στ until a perfectly inelastic stop at ±12°.",
    },
  },
  "zh-CN": {
    projectName: "杠杆、力矩与平衡",
    packName: "初中物理实验包",
    parameters: {
      leftMassKg: "左侧质量",
      rightMassKg: "右侧质量",
      leftDistanceM: "左侧力臂",
      rightDistanceM: "右侧力臂",
      gravityMs2: "重力加速度",
      showForces: "重力箭头",
      showMomentArcs: "力矩箭头",
    },
    presets: {
      balanced: "保持平衡",
      leftWins: "左侧下沉",
      rightWins: "右侧下沉",
    },
    question: {
      title: "课堂问题模式",
      none: "显示全部",
      mass: "隐藏右侧质量",
      distance: "隐藏右侧距离",
      reveal: "揭晓答案",
      hide: "隐藏答案",
      unavailable: "调整已知量，使答案进入参数范围。",
    },
    toggles: { shown: "显示", hidden: "隐藏" },
    outcome: {
      balanced: "保持平衡 · 不转动",
      counterclockwise: "逆时针 · 左侧下沉",
      clockwise: "顺时针 · 右侧下沉",
    },
    measurements: {
      title: "力矩测量",
      model: "实时释放状态",
      outcome: "运动状态",
      leftWeight: "左侧重力",
      rightWeight: "右侧重力",
      leftMoment: "逆时针力矩",
      rightMoment: "顺时针力矩",
      netMoment: "合力矩",
      balanceMass: "平衡所需右侧质量",
      balanceDistance: "平衡所需右侧距离",
      angle: "横梁角度",
      angularSpeed: "角速度",
    },
    canvas: {
      ariaLabel: "包含支点、两侧载荷、力臂和顺逆时针力矩的杠杆平衡图",
      title: "杠杆、力矩与平衡",
      subtitle: "比较绕同一支点的力矩，并求解平衡条件。",
      leftLoad: "左侧载荷",
      rightLoad: "右侧载荷",
      pivot: "支点",
      beam: "刚性横梁",
      horizontalRelease: "分析与释放",
      beamWeightNote: "理想轻质横梁 · 点载荷",
      releaseModel: "Iα = Στ · 完全非弹性限位",
      phase: {
        analyze: "受力分析",
        ready: "准备释放",
        rotating: "正在转动",
        "left-stop": "左侧限位",
        "right-stop": "右侧限位",
        balanced: "保持平衡",
      },
      angle: "角度",
      mechanicalStops: `机械限位 ±${LEVER_STOP_ANGLE_DEGREES}°`,
      leftArm: "左侧力臂",
      rightArm: "右侧力臂",
      counterclockwise: "逆时针",
      clockwise: "顺时针",
      momentRule: "力矩平衡原理",
      comparison: "力矩比较",
      balanceQuestion: "使杠杆平衡",
      constructionNote: "0–4 秒受力分析 · 4–6 秒释放",
      timelineAnalyze: "受力分析",
      timelineRelease: "释放",
      invalid: "修正参数后恢复实验",
    },
    viewport: {
      ratio: "画布比例",
      portrait: "竖屏 9:16",
      landscape: "宽屏 16:9",
      zoomOut: "缩小",
      zoomIn: "放大",
      move: "移动画布",
      fit: "适应画布",
      enterFullscreen: "进入全屏",
      exitFullscreen: "退出全屏",
      canvasNavigation: "画布导航",
    },
    narration: {
      pivot: {
        title: "确定支点",
        caption: "所有力矩都以横梁中央的三角支点为转轴计算。",
      },
      forces: {
        title: "标出两侧重力",
        caption: "每个质量都在悬挂点产生竖直向下的重力 W = mg。",
      },
      arms: {
        title: "测量垂直距离",
        caption: "横梁水平时，标出的水平距离就是重力到支点的垂直力臂。",
      },
      moments: {
        title: "计算两侧力矩",
        caption: "分别用重力乘以到支点的垂直距离。",
      },
      compare: {
        title: "预测转动方向",
        caption: "较大的力矩决定初始转向；大小相等、方向相反时保持平衡。",
      },
      unknown: {
        title: "求解未知量",
        caption: "令顺时针力矩等于逆时针力矩，再求隐藏的质量或距离。",
      },
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      rangeTitle: "答案超出参数范围",
      rangeDetail: "使用问题模式前请调整已知质量或距离。",
      assumptionTitle: "理想杠杆释放模型",
      assumptionDetail:
        "横梁从水平位置释放，按 Iα = Στ 转动，并在 ±12° 的完全非弹性限位处停止。",
    },
  },
};

const leverPresets = [
  {
    key: "balanced",
    values: {
      leftMassKg: 3,
      rightMassKg: 2,
      leftDistanceM: 0.8,
      rightDistanceM: 1.2,
    },
  },
  {
    key: "leftWins",
    values: {
      leftMassKg: 3.5,
      rightMassKg: 2,
      leftDistanceM: 1.2,
      rightDistanceM: 1,
    },
  },
  {
    key: "rightWins",
    values: {
      leftMassKg: 1.5,
      rightMassKg: 3,
      leftDistanceM: 1,
      rightDistanceM: 1.2,
    },
  },
] as const;

function formatNumber(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatSigned(value: number, locale: Locale, digits = 1) {
  if (Math.abs(value) < 10 ** -digits / 2)
    return formatNumber(0, locale, digits);
  return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value), locale, digits)}`;
}

function buildNarration(
  copy: LeverStepText,
  textOverrides: LeverTextOverrides,
  durationOverrides: LeverDurationOverrides,
): NarrationStep[] {
  return leverBalanceTemplate.narration.map((definition) => {
    const id = definition.id as LeverStepId;
    return {
      ...definition,
      title: textOverrides[id]?.title ?? copy[id].title,
      caption: textOverrides[id]?.caption ?? copy[id].caption,
      durationSeconds: durationOverrides[id] ?? definition.durationSeconds,
    };
  });
}

function localizeIssue(issue: ScienceIssue, copy: LeverCopy): ScienceIssue {
  if (issue.id.startsWith("invalid-parameter"))
    return {
      ...issue,
      title: copy.issues.invalidTitle,
      detail: copy.issues.invalidDetail,
    };
  if (issue.id === "solution-outside-range")
    return {
      ...issue,
      title: copy.issues.rangeTitle,
      detail: copy.issues.rangeDetail,
    };
  return {
    ...issue,
    title: copy.issues.assumptionTitle,
    detail: copy.issues.assumptionDetail,
  };
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number) {
  const radians = (degrees * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startDegrees: number,
  endDegrees: number,
) {
  const start = polarPoint(cx, cy, radius, startDegrees);
  const end = polarPoint(cx, cy, radius, endDegrees);
  const sweep = endDegrees >= startDegrees ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

function wrapCaption(text: string, locale: Locale, maxCharacters: number) {
  if (locale === "zh-CN")
    return [text.slice(0, maxCharacters), text.slice(maxCharacters)]
      .filter(Boolean)
      .slice(0, 2);
  const lines: string[] = [];
  for (const word of text.split(/\s+/)) {
    const current = lines.at(-1);
    if (!current || current.length + word.length + 1 > maxCharacters)
      lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  return lines.slice(0, 2);
}

function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      markerWidth="10"
      markerHeight="10"
      refX="8"
      refY="4"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path d="M0,0 L0,8 L9,4 z" fill={color} />
    </marker>
  );
}

function LeverCanvas({
  state,
  motionState,
  phase,
  locale,
  aspectRatio,
  constructionProgress,
  unknownMode,
  showAnswer,
  narrationStep,
  narrationStepIndex,
  narrationStepCount,
}: {
  state: LeverBalanceState | null;
  motionState: LeverMotionState | null;
  phase: LeverPhase;
  locale: Locale;
  aspectRatio: CanvasAspectRatio;
  constructionProgress: number;
  unknownMode: UnknownMode;
  showAnswer: boolean;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const copy = leverCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const margin = landscape ? 58 : 54;
  const pivotX = landscape ? 430 : 360;
  const beamY = landscape ? 350 : 500;
  const beamHalfWidth = landscape ? 340 : 290;
  const meterScale = beamHalfWidth / 2;
  const formulaX = landscape ? 820 : 54;
  const formulaY = landscape ? 154 : 825;
  const formulaWidth = landscape ? 402 : 612;
  const formulaHeight = landscape ? 408 : 330;
  const comparisonBarX = formulaX + (landscape ? 220 : 230);
  const formulaRows = landscape
    ? {
        kicker: 30,
        rule: 76,
        left: 122,
        right: 162,
        divider: 190,
        net: 232,
        outcome: 270,
        bars: 306,
        question: 353,
        note: 386,
      }
    : {
        kicker: 28,
        rule: 66,
        left: 103,
        right: 137,
        divider: 158,
        net: 194,
        outcome: 226,
        bars: 255,
        question: 292,
        note: 314,
      };
  const opacityAt = (start: number) =>
    0.28 +
    Math.max(0, Math.min(1, (constructionProgress - start) / 0.2)) * 0.72;
  const highlights = narrationStep?.highlights ?? [];
  const focusOpacity = (names: string[]) =>
    !narrationStep || names.some((name) => highlights.includes(name))
      ? 1
      : 0.28;
  const narrationBaseY = landscape ? 612 : 735;

  if (!state || !motionState)
    return (
      <svg
        className="lever-canvas"
        viewBox={`0 0 ${viewWidth} ${viewHeight}`}
        role="img"
        aria-label={copy.canvas.ariaLabel}
      >
        <rect width={viewWidth} height={viewHeight} fill="#f5f8f7" />
        <text
          className="lever-invalid"
          x={viewWidth / 2}
          y={viewHeight / 2}
          textAnchor="middle"
        >
          {copy.canvas.invalid}
        </text>
      </svg>
    );

  const angleRadians = motionState.angleRadians;
  const angleDegrees = angleRadians * 180 / Math.PI;
  const screenAngleDegrees = -angleDegrees;
  const perpendicularScale = Math.cos(angleRadians);
  const leftRadius = state.parameters.leftDistanceM * meterScale;
  const rightRadius = state.parameters.rightDistanceM * meterScale;
  const leftX = pivotX - leftRadius * perpendicularScale;
  const rightX = pivotX + rightRadius * perpendicularScale;
  const leftAttachmentY = beamY + leftRadius * Math.sin(angleRadians);
  const rightAttachmentY = beamY - rightRadius * Math.sin(angleRadians);
  const leftLoadY = leftAttachmentY + 55;
  const rightLoadY = rightAttachmentY + 55;
  const leftPerpendicularDistanceM =
    state.parameters.leftDistanceM * perpendicularScale;
  const rightPerpendicularDistanceM =
    state.parameters.rightDistanceM * perpendicularScale;
  const leftMassLabel = `${formatNumber(state.parameters.leftMassKg, locale, 1)} kg`;
  const rightMassLabel =
    unknownMode === "right-mass" && !showAnswer
      ? "? kg"
      : `${formatNumber(state.parameters.rightMassKg, locale, 2)} kg`;
  const outcomeColor =
    state.outcome === "balanced"
      ? "#168d8b"
      : state.outcome === "counterclockwise"
        ? "#d8892d"
        : "#d85f45";
  const maxMoment = Math.max(
    motionState.leftTorqueNm,
    motionState.rightTorqueNm,
    1,
  );
  const leftBarWidth = (142 * motionState.leftTorqueNm) / maxMoment;
  const rightBarWidth =
    unknownMode !== "none" && !showAnswer
      ? 0
      : (142 * motionState.rightTorqueNm) / maxMoment;
  const unknownAnswer =
    unknownMode === "right-mass"
      ? `${formatNumber(state.parameters.rightMassKg, locale, 2)} kg`
      : unknownMode === "right-distance"
        ? `${formatNumber(state.parameters.rightDistanceM, locale, 2)} m`
        : "";

  return (
    <svg
      className="lever-canvas"
      viewBox={`0 0 ${viewWidth} ${viewHeight}`}
      role="img"
      aria-label={copy.canvas.ariaLabel}
    >
      <defs>
        <pattern
          id="lever-grid"
          width="32"
          height="32"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 32 0 L 0 0 0 32"
            fill="none"
            stroke="#cad8d5"
            strokeWidth="1"
            opacity="0.45"
          />
        </pattern>
        <ArrowMarker id="lever-left-force-arrow" color="#d8892d" />
        <ArrowMarker id="lever-right-force-arrow" color="#d85f45" />
        <ArrowMarker id="lever-left-moment-arrow" color="#d8892d" />
        <ArrowMarker id="lever-right-moment-arrow" color="#d85f45" />
      </defs>
      <rect width={viewWidth} height={viewHeight} fill="#f7f8f4" />
      <rect
        y={beamY + 4}
        width={viewWidth}
        height={viewHeight - beamY - 4}
        fill="#e5f1ef"
      />
      <rect width={viewWidth} height={viewHeight} fill="url(#lever-grid)" />
      <g className="lever-canvas-heading">
        <text className="lever-eyebrow" x={margin} y={landscape ? 50 : 62}>
          SCIENCE STUDIO · MECHANICS
        </text>
        <text className="lever-title" x={margin} y={landscape ? 91 : 105}>
          {copy.canvas.title}
        </text>
        <text className="lever-subtitle" x={margin} y={landscape ? 120 : 137}>
          {copy.canvas.subtitle}
        </text>
      </g>
      <g
        className={`lever-release-card phase-${phase}`}
        transform={`translate(${landscape ? 900 : 54} ${landscape ? 45 : 166})`}
      >
        <rect width={landscape ? 320 : 612} height="94" rx="7" />
        <text className="lever-release-heading" x="18" y="25">
          {copy.canvas.horizontalRelease}
        </text>
        <text className="lever-release-status" x="18" y="53">
          {copy.canvas.phase[phase]}
        </text>
        <text
          className="lever-release-angle"
          x={(landscape ? 320 : 612) - 18}
          y="53"
          textAnchor="end"
        >
          {copy.canvas.angle} θ = {formatSigned(angleDegrees, locale, 1)}°
        </text>
        <text className="lever-release-note" x="18" y="79">
          {copy.canvas.releaseModel}
        </text>
      </g>

      <g
        className="lever-beam-group"
        opacity={
          opacityAt(0) *
          focusOpacity(["pivot", "arms", "moments", "comparison"])
        }
      >
        <g
          className="lever-rotating-beam"
          transform={`rotate(${screenAngleDegrees} ${pivotX} ${beamY})`}
        >
          <line
            className="lever-beam"
            x1={pivotX - beamHalfWidth}
            x2={pivotX + beamHalfWidth}
            y1={beamY}
            y2={beamY}
          />
          {Array.from({ length: 21 }, (_, index) => index - 10).map((tick) => {
            const x = pivotX + (tick * beamHalfWidth) / 10;
            const major = tick % 5 === 0;
            return (
              <line
                className="lever-beam-tick"
                x1={x}
                x2={x}
                y1={beamY - (major ? 12 : 7)}
                y2={beamY + (major ? 12 : 7)}
                key={tick}
              />
            );
          })}
          <text
            className="lever-beam-label"
            x={pivotX - beamHalfWidth}
            y={beamY - 20}
          >
            {copy.canvas.beam}
          </text>
        </g>
        <g className="lever-stop-layer">
          <line
            className={`lever-stop-pad left ${motionState.stopSide === "left" ? "active" : ""}`}
            x1={pivotX - 166}
            x2={pivotX - 116}
            y1={beamY + 32}
            y2={beamY + 32}
          />
          <line
            className={`lever-stop-pad right ${motionState.stopSide === "right" ? "active" : ""}`}
            x1={pivotX + 116}
            x2={pivotX + 166}
            y1={beamY + 32}
            y2={beamY + 32}
          />
          <text
            className="lever-stop-label"
            x={pivotX}
            y={beamY + 142}
            textAnchor="middle"
          >
            {copy.canvas.mechanicalStops}
          </text>
        </g>
        <path
          className="lever-pivot"
          d={`M ${pivotX} ${beamY + 2} L ${pivotX - 38} ${beamY + 76} L ${pivotX + 38} ${beamY + 76} Z`}
        />
        <line
          className="lever-ground"
          x1={pivotX - 70}
          x2={pivotX + 70}
          y1={beamY + 76}
          y2={beamY + 76}
        />
        <circle className="lever-pivot-pin" cx={pivotX} cy={beamY} r="10" />
        <text
          className="lever-pivot-label"
          x={pivotX}
          y={beamY + 50}
          textAnchor="middle"
        >
          {copy.canvas.pivot}
        </text>
      </g>

      <g
        className="lever-load lever-load-left"
        opacity={opacityAt(0.12) * focusOpacity(["forces", "arms", "moments"])}
      >
        <line
          className="lever-hanger"
          x1={leftX}
          x2={leftX}
          y1={leftAttachmentY}
          y2={leftLoadY}
        />
        <rect x={leftX - 45} y={leftLoadY} width="90" height="62" rx="5" />
        <text
          className="lever-load-kicker"
          x={leftX}
          y={leftLoadY + 22}
          textAnchor="middle"
        >
          {copy.canvas.leftLoad}
        </text>
        <text
          className="lever-load-value"
          x={leftX}
          y={leftLoadY + 47}
          textAnchor="middle"
        >
          {leftMassLabel}
        </text>
      </g>
      <g
        className="lever-load lever-load-right"
        opacity={
          opacityAt(0.12) *
          focusOpacity(["forces", "arms", "moments", "unknown"])
        }
      >
        <line
          className="lever-hanger"
          x1={rightX}
          x2={rightX}
          y1={rightAttachmentY}
          y2={rightLoadY}
        />
        <rect x={rightX - 45} y={rightLoadY} width="90" height="62" rx="5" />
        <text
          className="lever-load-kicker"
          x={rightX}
          y={rightLoadY + 22}
          textAnchor="middle"
        >
          {copy.canvas.rightLoad}
        </text>
        <text
          className="lever-load-value"
          x={rightX}
          y={rightLoadY + 47}
          textAnchor="middle"
        >
          {rightMassLabel}
        </text>
      </g>

      {state.parameters.showForces ? (
        <g
          className="lever-forces"
          opacity={opacityAt(0.25) * focusOpacity(["forces"])}
        >
          <g className="lever-force left">
            <line
              x1={leftX}
              x2={leftX}
              y1={leftLoadY + 68}
              y2={leftLoadY + 138}
              markerEnd="url(#lever-left-force-arrow)"
            />
            <text x={leftX + 13} y={leftLoadY + 118}>
              Wₗ = {formatNumber(state.leftWeightN, locale, 1)} N
            </text>
          </g>
          <g className="lever-force right">
            <line
              x1={rightX}
              x2={rightX}
              y1={rightLoadY + 68}
              y2={rightLoadY + 138}
              markerEnd="url(#lever-right-force-arrow)"
            />
            <text x={rightX - 13} y={rightLoadY + 118} textAnchor="end">
              Wᵣ ={" "}
              {unknownMode === "right-mass" && !showAnswer
                ? "?"
                : formatNumber(state.rightWeightN, locale, 1)}{" "}
              N
            </text>
          </g>
        </g>
      ) : null}

      <g
        className="lever-arm-layer"
        opacity={opacityAt(0.38) * focusOpacity(["arms", "unknown"])}
      >
        <line
          className="lever-arm-line left"
          x1={leftX}
          x2={pivotX}
          y1={beamY - 45}
          y2={beamY - 45}
        />
        <line
          className="lever-arm-cap left"
          x1={leftX}
          x2={leftX}
          y1={beamY - 55}
          y2={beamY - 35}
        />
        <line
          className="lever-arm-cap left"
          x1={pivotX}
          x2={pivotX}
          y1={beamY - 55}
          y2={beamY - 35}
        />
        <text
          className="lever-arm-value left"
          x={(leftX + pivotX) / 2}
          y={beamY - 61}
          textAnchor="middle"
        >
          d⊥ₗ = {formatNumber(leftPerpendicularDistanceM, locale, 2)} m
        </text>
        <line
          className="lever-arm-line right"
          x1={pivotX}
          x2={rightX}
          y1={beamY - 45}
          y2={beamY - 45}
        />
        <line
          className="lever-arm-cap right"
          x1={pivotX}
          x2={pivotX}
          y1={beamY - 55}
          y2={beamY - 35}
        />
        <line
          className="lever-arm-cap right"
          x1={rightX}
          x2={rightX}
          y1={beamY - 55}
          y2={beamY - 35}
        />
        <text
          className="lever-arm-value right"
          x={(pivotX + rightX) / 2}
          y={beamY - 61}
          textAnchor="middle"
        >
          {unknownMode === "right-distance" && !showAnswer
            ? "d⊥ᵣ = ? m"
            : `d⊥ᵣ = ${formatNumber(rightPerpendicularDistanceM, locale, 2)} m`}
        </text>
      </g>

      {state.parameters.showMomentArcs ? (
        <g
          className="lever-moment-layer"
          opacity={opacityAt(0.5) * focusOpacity(["moments", "comparison"])}
        >
          <path
            className="lever-moment-arc left"
            d={arcPath(pivotX, beamY, landscape ? 112 : 102, 205, 126)}
            markerEnd="url(#lever-left-moment-arrow)"
          />
          <text
            className="lever-moment-label left"
            x={pivotX - 146}
            y={beamY - 126}
            textAnchor="middle"
          >
            {copy.canvas.counterclockwise}
          </text>
          <path
            className="lever-moment-arc right"
            d={arcPath(pivotX, beamY, landscape ? 112 : 102, -25, 54)}
            markerEnd="url(#lever-right-moment-arrow)"
          />
          <text
            className="lever-moment-label right"
            x={pivotX + 146}
            y={beamY - 126}
            textAnchor="middle"
          >
            {copy.canvas.clockwise}
          </text>
        </g>
      ) : null}

      <g
        className={`lever-formula-panel outcome-${state.outcome}`}
        opacity={
          opacityAt(0.64) * focusOpacity(["moments", "comparison", "unknown"])
        }
      >
        <rect
          x={formulaX}
          y={formulaY}
          width={formulaWidth}
          height={formulaHeight}
          rx="9"
        />
        <text
          className="lever-panel-kicker"
          x={formulaX + 22}
          y={formulaY + formulaRows.kicker}
        >
          {copy.canvas.momentRule}
        </text>
        <text
          className="lever-outcome-label"
          x={formulaX + formulaWidth - 22}
          y={formulaY + formulaRows.kicker}
          textAnchor="end"
        >
          {copy.canvas.phase[phase]}
        </text>
        <text
          className="lever-rule"
          x={formulaX + 22}
          y={formulaY + formulaRows.rule}
        >
          τ = F × d⊥
        </text>
        <text
          className="lever-calculation left"
          x={formulaX + 22}
          y={formulaY + formulaRows.left}
        >
          τₗ = {formatNumber(state.leftWeightN, locale, 1)} ×{" "}
          {formatNumber(leftPerpendicularDistanceM, locale, 2)} ={" "}
          {formatNumber(motionState.leftTorqueNm, locale, 2)} N·m
        </text>
        <text
          className="lever-calculation right"
          x={formulaX + 22}
          y={formulaY + formulaRows.right}
        >
          τᵣ ={" "}
          {unknownMode !== "none" && !showAnswer
            ? "?"
            : `${formatNumber(state.rightWeightN, locale, 1)} × ${formatNumber(rightPerpendicularDistanceM, locale, 2)} = ${formatNumber(motionState.rightTorqueNm, locale, 2)}`}{" "}
          N·m
        </text>
        <line
          x1={formulaX + 22}
          x2={formulaX + formulaWidth - 22}
          y1={formulaY + formulaRows.divider}
          y2={formulaY + formulaRows.divider}
        />
        <text
          className="lever-net-result"
          x={formulaX + 22}
          y={formulaY + formulaRows.net}
        >
          Στ ={" "}
          {unknownMode !== "none" && !showAnswer
            ? "?"
            : `${formatSigned(motionState.netTorqueNm, locale, 2)} N·m`}
        </text>
        <text
          className="lever-direction-result"
          x={formulaX + 22}
          y={formulaY + formulaRows.outcome}
          fill={outcomeColor}
        >
          {unknownMode !== "none" && !showAnswer
            ? copy.canvas.balanceQuestion
            : copy.outcome[state.outcome]}
        </text>
        <text
          className="lever-comparison-label"
          x={formulaX + 22}
          y={formulaY + formulaRows.bars}
        >
          {copy.canvas.comparison}
        </text>
        <rect
          className="lever-moment-bar-track"
          x={comparisonBarX}
          y={formulaY + formulaRows.bars - 11}
          width="142"
          height="8"
          rx="4"
        />
        <rect
          className="lever-moment-bar left"
          x={comparisonBarX}
          y={formulaY + formulaRows.bars - 11}
          width={leftBarWidth}
          height="8"
          rx="4"
        />
        <rect
          className="lever-moment-bar-track"
          x={comparisonBarX}
          y={formulaY + formulaRows.bars + 4}
          width="142"
          height="8"
          rx="4"
        />
        <rect
          className="lever-moment-bar right"
          x={comparisonBarX}
          y={formulaY + formulaRows.bars + 4}
          width={rightBarWidth}
          height="8"
          rx="4"
        />
        {unknownMode !== "none" ? (
          <text
            className="lever-question-result"
            x={formulaX + 22}
            y={formulaY + formulaRows.question}
          >
            {copy.canvas.balanceQuestion}: {showAnswer ? unknownAnswer : "?"}
          </text>
        ) : null}
        <text
          className="lever-formula-note"
          x={formulaX + 22}
          y={formulaY + formulaRows.note}
        >
          {copy.canvas.mechanicalStops} · {copy.canvas.beamWeightNote}
        </text>
      </g>

      <text className="lever-construction-note" x={margin} y={viewHeight - 30}>
        {copy.canvas.constructionNote}
      </text>
      {narrationStep ? (
        <g className="narration-overlay lever-narration-overlay">
          <text className="narration-step-number" x={margin} y={narrationBaseY}>
            {String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} /{" "}
            {String(narrationStepCount ?? 0).padStart(2, "0")}
          </text>
          <text
            className="narration-step-title"
            x={margin + 90}
            y={narrationBaseY - 2}
          >
            {narrationStep.title}
          </text>
          <text className="narration-step-caption">
            {wrapCaption(
              narrationStep.caption,
              locale,
              landscape ? 82 : 52,
            ).map((line, index) => (
              <tspan
                x={margin + 90}
                y={narrationBaseY + 30 + index * 23}
                key={`${line}-${index}`}
              >
                {line}
              </tspan>
            ))}
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export function LeverBalanceWorkbench() {
  const [parameters, setParameters] =
    useState<LeverBalanceParameters>(leverBalanceDefaults);
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [unknownMode, setUnknownMode] = useState<UnknownMode>("none");
  const [showAnswer, setShowAnswer] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("16:9");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textOverrides, setTextOverrides] = useState<LeverTextOverrides>({});
  const [durationOverrides, setDurationOverrides] =
    useState<LeverDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const copy = leverCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(
    () => leverBalanceParametersSchema.safeParse(parameters),
    [parameters],
  );
  const baseState = useMemo(
    () =>
      parsedParameters.success
        ? solveLeverBalance(parsedParameters.data)
        : null,
    [parsedParameters],
  );
  const canSolveMass = Boolean(
    baseState &&
      baseState.requiredRightMassKg >= 0.5 &&
      baseState.requiredRightMassKg <= 8,
  );
  const canSolveDistance = Boolean(
    baseState &&
      baseState.requiredRightDistanceM >= 0.2 &&
      baseState.requiredRightDistanceM <= 2,
  );
  const renderedState = useMemo(() => {
    if (!baseState) return null;
    if (unknownMode === "right-mass" && canSolveMass)
      return solveLeverBalance({
        ...baseState.parameters,
        rightMassKg: baseState.requiredRightMassKg,
      });
    if (unknownMode === "right-distance" && canSolveDistance)
      return solveLeverBalance({
        ...baseState.parameters,
        rightDistanceM: baseState.requiredRightDistanceM,
      });
    return baseState;
  }, [baseState, canSolveDistance, canSolveMass, unknownMode]);
  const releaseElapsedSeconds =
    mode === "experiment"
      ? Math.max(0, timeSeconds - CONSTRUCTION_DURATION_SECONDS)
      : 0;
  const motionState = useMemo(
    () =>
      renderedState
        ? simulateLeverRelease(
            renderedState.parameters,
            releaseElapsedSeconds,
          )
        : null,
    [releaseElapsedSeconds, renderedState],
  );
  const phase: LeverPhase =
    mode === "narration" || timeSeconds < CONSTRUCTION_DURATION_SECONDS
      ? "analyze"
      : renderedState?.outcome === "balanced"
        ? "balanced"
        : releaseElapsedSeconds <= 0
          ? "ready"
          : motionState?.stopSide === "left"
            ? "left-stop"
            : motionState?.stopSide === "right"
              ? "right-stop"
              : "rotating";
  const narrationSteps = useMemo(
    () => buildNarration(copy.narration, textOverrides, durationOverrides),
    [copy.narration, durationOverrides, textOverrides],
  );
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(
    narrationSteps,
    narrationTimeSeconds,
    EXPERIMENT_DURATION_SECONDS,
  );
  const playbackTimeSeconds =
    mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds =
    mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
  const constructionProgress =
    mode === "narration"
      ? (narrationFrame.index + 1) / narrationSteps.length
      : Math.min(1, timeSeconds / CONSTRUCTION_DURATION_SECONDS);
  const issues = useMemo(
    () =>
      inspectLeverBalance(parameters).map((issue) =>
        localizeIssue(issue, copy),
      ),
    [copy, parameters],
  );
  const numericDefinitions =
    leverBalanceTemplate.parameterDefinitions as Array<{
      key: NumericParameterKey;
      unit: string;
      min: number;
      max: number;
      step: number;
    }>;

  useEffect(() => {
    const stored = window.localStorage.getItem("science-studio-locale");
    if (stored === "en" || stored === "zh-CN") setLocale(stored);
  }, []);
  useEffect(() => {
    const onFullscreen = () =>
      setIsFullscreen(document.fullscreenElement === workbenchRef.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);
  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      if (animationRef.current !== null)
        cancelAnimationFrame(animationRef.current);
      return;
    }
    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current ?? timestamp;
      lastTimestampRef.current = timestamp;
      const delta = ((timestamp - previous) / 1000) * speed;
      const setter =
        mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
      setter((current) => {
        const limit =
          mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
        const next = Math.min(limit, current + delta);
        if (next >= limit) setIsPlaying(false);
        return next;
      });
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null)
        cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, mode, narrationDuration, speed]);

  const updateNumeric = useCallback(
    (key: NumericParameterKey, value: number) => {
      setParameters((current) => ({ ...current, [key]: value }));
      setTimeSeconds(CONSTRUCTION_DURATION_SECONDS);
      setShowAnswer(false);
      setIsPlaying(false);
    },
    [],
  );
  const setPreset = useCallback((values: Partial<LeverBalanceParameters>) => {
    setParameters((current) => ({ ...current, ...values }));
    setUnknownMode("none");
    setShowAnswer(false);
    setTimeSeconds(CONSTRUCTION_DURATION_SECONDS);
    setIsPlaying(false);
  }, []);
  const selectUnknownMode = useCallback((next: UnknownMode) => {
    setUnknownMode(next);
    setShowAnswer(false);
    setTimeSeconds(CONSTRUCTION_DURATION_SECONDS);
    setIsPlaying(false);
  }, []);
  const toggleBoolean = useCallback(
    (key: "showForces" | "showMomentArcs") =>
      setParameters((current) => ({ ...current, [key]: !current[key] })),
    [],
  );
  const stopAndResetTime = useCallback(() => {
    setIsPlaying(false);
    if (mode === "narration") setNarrationTimeSeconds(0);
    else setTimeSeconds(0);
  }, [mode]);
  const step = useCallback(
    (direction: -1 | 1) => {
      setIsPlaying(false);
      const setter =
        mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
      const limit =
        mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
      setter((current) =>
        Math.min(limit, Math.max(0, current + direction / FPS)),
      );
    },
    [mode, narrationDuration],
  );
  const selectNarrationStep = useCallback(
    (index: number) => {
      setIsPlaying(false);
      setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));
    },
    [narrationSteps],
  );
  const updateNarrationText = useCallback(
    (id: LeverStepId, field: "title" | "caption", value: string) =>
      setTextOverrides((current) => ({
        ...current,
        [id]: { ...current[id], [field]: value },
      })),
    [],
  );
  const updateNarrationDuration = useCallback(
    (id: LeverStepId, value: number) => {
      if (Number.isFinite(value))
        setDurationOverrides((current) => ({
          ...current,
          [id]: Math.min(10, Math.max(1, value)),
        }));
    },
    [],
  );
  const restoreNarrationDefaults = useCallback(() => {
    setTextOverrides({});
    setDurationOverrides({});
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, []);
  const toggleLocale = useCallback(
    () =>
      setLocale((current) => {
        const next = current === "en" ? "zh-CN" : "en";
        window.localStorage.setItem("science-studio-locale", next);
        document.documentElement.lang = next;
        return next;
      }),
    [],
  );
  const clampPan = useCallback(
    (nextPan: { x: number; y: number }, atZoom: number) => {
      if (atZoom <= 1) return { x: 0, y: 0 };
      const width = stageAreaRef.current?.clientWidth ?? 900;
      const height = stageAreaRef.current?.clientHeight ?? 600;
      const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35);
      const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35);
      return {
        x: Math.min(maxX, Math.max(-maxX, nextPan.x)),
        y: Math.min(maxY, Math.max(-maxY, nextPan.y)),
      };
    },
    [],
  );
  const resetCanvasView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPanMode(false);
    setIsDraggingCanvas(false);
    panDragRef.current = null;
  }, []);
  const changeZoom = useCallback(
    (delta: number) =>
      setZoom((current) => {
        const next = Math.min(
          2.5,
          Math.max(0.5, Number((current + delta).toFixed(2))),
        );
        setPan((currentPan) => clampPan(currentPan, next));
        if (next <= 1) setPanMode(false);
        return next;
      }),
    [clampPan],
  );
  const changeAspectRatio = useCallback(
    (next: CanvasAspectRatio) => {
      setAspectRatio(next);
      resetCanvasView();
    },
    [resetCanvasView],
  );
  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement === workbenchRef.current)
      await document.exitFullscreen();
    else await workbenchRef.current?.requestFullscreen();
  }, []);

  const lockedRightMass = unknownMode === "right-mass";
  const lockedRightDistance = unknownMode === "right-distance";
  const maskedRightMass = lockedRightMass && !showAnswer;
  const maskedRightDistance = lockedRightDistance && !showAnswer;

  return (
    <main
      className={`workbench-shell lever-balance-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`}
      ref={workbenchRef}
    >
      <header className="topbar">
        <div className="project-identity">
          <ExperimentLibraryBackLink
            className="back-to-library"
            aria-label={
              locale === "en" ? "Back to experiment library" : "返回实验目录"
            }
          >
            <ArrowLeft size={16} />
          </ExperimentLibraryBackLink>
          <span className="brand-mark">
            <FlaskConical size={17} />
          </span>
          <span className="brand-name">Science Studio</span>
          <span className="topbar-divider" />
          <span className="project-name">{copy.projectName}</span>
          <span className="lever-pack-badge">
            <LockKeyhole size={11} />
            {copy.packName}
          </span>
        </div>
        <nav className="mode-switch" aria-label={commonCopy.modeLabel}>
          <button
            className={`mode-button ${mode === "experiment" ? "active" : ""}`}
            type="button"
            aria-pressed={mode === "experiment"}
            onClick={() => {
              setMode("experiment");
              setIsPlaying(false);
            }}
          >
            {commonCopy.modes.experiment}
          </button>
          <button
            className={`mode-button ${mode === "narration" ? "active" : ""}`}
            type="button"
            aria-pressed={mode === "narration"}
            onClick={() => {
              setMode("narration");
              setIsPlaying(false);
            }}
          >
            {commonCopy.modes.narration}
          </button>
          <button className="mode-button" type="button" disabled>
            {commonCopy.modes.export}
          </button>
        </nav>
        <div className="topbar-actions">
          <button
            className="locale-button"
            type="button"
            onClick={toggleLocale}
            aria-label={commonCopy.actions.switchLanguage}
          >
            <Languages size={15} />
            <span>{locale === "en" ? "EN" : "中文"}</span>
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={commonCopy.actions.undo}
            disabled
          >
            <Undo2 />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={commonCopy.actions.redo}
            disabled
          >
            <Redo2 />
          </button>
        </div>
      </header>
      <section className="workspace">
        <div className="stage-area lever-stage-area" ref={stageAreaRef}>
          <div className="stage-meta lever-stage-meta">
            <span>{commonCopy.stage.outputCanvas}</span>
            <div
              className="lever-canvas-toolbar"
              role="toolbar"
              aria-label={copy.viewport.canvasNavigation}
            >
              <div
                className="canvas-ratio-switch"
                role="group"
                aria-label={copy.viewport.ratio}
              >
                {(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => (
                  <button
                    className={aspectRatio === ratio ? "active" : ""}
                    type="button"
                    aria-pressed={aspectRatio === ratio}
                    title={
                      ratio === "9:16"
                        ? copy.viewport.portrait
                        : copy.viewport.landscape
                    }
                    onClick={() => changeAspectRatio(ratio)}
                    key={ratio}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
              <CanvasTextSizeControls locale={locale} />
              <button
                className="canvas-tool-button"
                type="button"
                onClick={() => changeZoom(-0.25)}
                disabled={zoom <= 0.5}
                aria-label={copy.viewport.zoomOut}
              >
                <ZoomOut />
              </button>
              <output className="canvas-zoom-value">
                {Math.round(zoom * 100)}%
              </output>
              <button
                className="canvas-tool-button"
                type="button"
                onClick={() => changeZoom(0.25)}
                disabled={zoom >= 2.5}
                aria-label={copy.viewport.zoomIn}
              >
                <ZoomIn />
              </button>
              <button
                className={`canvas-tool-button ${panMode ? "active" : ""}`}
                type="button"
                onClick={() => setPanMode((current) => !current)}
                disabled={zoom <= 1}
                aria-pressed={panMode}
                aria-label={copy.viewport.move}
              >
                <Move />
              </button>
              <button
                className="canvas-tool-button"
                type="button"
                onClick={resetCanvasView}
                disabled={zoom === 1 && pan.x === 0 && pan.y === 0}
                aria-label={copy.viewport.fit}
              >
                <Scan />
              </button>
              <button
                className="canvas-tool-button"
                type="button"
                onClick={() => void toggleFullscreen()}
                aria-label={
                  isFullscreen
                    ? copy.viewport.exitFullscreen
                    : copy.viewport.enterFullscreen
                }
              >
                {isFullscreen ? <Minimize2 /> : <Maximize2 />}
              </button>
            </div>
          </div>
          <div
            className={`lever-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
            tabIndex={0}
            aria-label={copy.viewport.canvasNavigation}
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              event.preventDefault();
              changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
            }}
            onPointerDown={(event) => {
              if (!panMode || zoom <= 1 || event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              panDragRef.current = {
                pointerId: event.pointerId,
                startX: event.clientX,
                startY: event.clientY,
                originX: pan.x,
                originY: pan.y,
              };
              setIsDraggingCanvas(true);
            }}
            onPointerMove={(event) => {
              const drag = panDragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              setPan(
                clampPan(
                  {
                    x: drag.originX + event.clientX - drag.startX,
                    y: drag.originY + event.clientY - drag.startY,
                  },
                  zoom,
                ),
              );
            }}
            onPointerUp={(event) => {
              if (panDragRef.current?.pointerId !== event.pointerId) return;
              if (event.currentTarget.hasPointerCapture(event.pointerId))
                event.currentTarget.releasePointerCapture(event.pointerId);
              panDragRef.current = null;
              setIsDraggingCanvas(false);
            }}
            onPointerCancel={() => {
              panDragRef.current = null;
              setIsDraggingCanvas(false);
            }}
            onKeyDown={(event) => {
              if (!panMode || zoom <= 1) return;
              const movement: Record<string, { x: number; y: number }> = {
                ArrowUp: { x: 0, y: 24 },
                ArrowDown: { x: 0, y: -24 },
                ArrowLeft: { x: 24, y: 0 },
                ArrowRight: { x: -24, y: 0 },
              };
              const delta = movement[event.key];
              if (!delta) return;
              event.preventDefault();
              setPan((current) =>
                clampPan(
                  { x: current.x + delta.x, y: current.y + delta.y },
                  zoom,
                ),
              );
            }}
          >
            <LeverCanvas
              state={renderedState}
              motionState={motionState}
              phase={phase}
              locale={locale}
              aspectRatio={aspectRatio}
              constructionProgress={constructionProgress}
              unknownMode={unknownMode}
              showAnswer={showAnswer}
              narrationStep={
                mode === "narration" ? narrationFrame.step : undefined
              }
              narrationStepIndex={
                mode === "narration" ? narrationFrame.index : undefined
              }
              narrationStepCount={
                mode === "narration" ? narrationSteps.length : undefined
              }
            />
          </div>
        </div>
        <aside className="parameter-panel">
          {mode === "experiment" ? (
            <>
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">
                    {commonCopy.panel.kicker}
                  </span>
                  <h1>{commonCopy.panel.parameters}</h1>
                </div>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={commonCopy.actions.collapseParameters}
                >
                  <ChevronDown />
                </button>
              </div>
              <div className="parameter-list">
                <div className="parameter-control lever-preset-parameter">
                  <span className="lever-control-label">
                    {locale === "en" ? "Classroom presets" : "课堂预设"}
                  </span>
                  <div className="lever-presets">
                    {leverPresets.map((preset) => (
                      <button
                        type="button"
                        onClick={() => setPreset(preset.values)}
                        key={preset.key}
                      >
                        {copy.presets[preset.key]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="parameter-control lever-question-parameter">
                  <span className="lever-control-label">
                    {copy.question.title}
                  </span>
                  <div className="lever-question-modes">
                    {(
                      ["none", "right-mass", "right-distance"] as UnknownMode[]
                    ).map((item) => (
                      <button
                        className={unknownMode === item ? "active" : ""}
                        type="button"
                        disabled={
                          item === "right-mass"
                            ? !canSolveMass
                            : item === "right-distance"
                              ? !canSolveDistance
                              : false
                        }
                        onClick={() => selectUnknownMode(item)}
                        key={item}
                      >
                        {item === "none"
                          ? copy.question.none
                          : item === "right-mass"
                            ? copy.question.mass
                            : copy.question.distance}
                      </button>
                    ))}
                  </div>
                  {unknownMode !== "none" ? (
                    <button
                      className={`lever-answer-toggle ${showAnswer ? "revealed" : ""}`}
                      type="button"
                      onClick={() => setShowAnswer((current) => !current)}
                    >
                      {showAnswer ? <EyeOff size={14} /> : <Eye size={14} />}
                      {showAnswer ? copy.question.hide : copy.question.reveal}
                    </button>
                  ) : !canSolveMass || !canSolveDistance ? (
                    <small className="lever-question-help">
                      {copy.question.unavailable}
                    </small>
                  ) : null}
                </div>
                {numericDefinitions.map((definition) => {
                  const issue = !parsedParameters.success
                    ? parsedParameters.error.issues.find(
                        (item) => item.path[0] === definition.key,
                      )
                    : undefined;
                  const label = copy.parameters[definition.key];
                  const locked =
                    definition.key === "rightMassKg"
                      ? lockedRightMass
                      : definition.key === "rightDistanceM"
                        ? lockedRightDistance
                        : false;
                  const masked = locked && !showAnswer;
                  const displayedValue =
                    locked && renderedState
                      ? showAnswer
                        ? renderedState.parameters[definition.key]
                        : ""
                      : parameters[definition.key];
                  const rangeValue =
                    locked && showAnswer && renderedState
                      ? renderedState.parameters[definition.key]
                      : parameters[definition.key];
                  return (
                    <div
                      className={`parameter-control ${masked ? "lever-masked-parameter" : ""}`}
                      key={definition.key}
                    >
                      <div className="parameter-row">
                        <label htmlFor={`lever-${definition.key}`}>
                          {label}
                        </label>
                        <div className="number-field">
                          <input
                            id={`lever-${definition.key}`}
                            type="number"
                            min={definition.min}
                            max={definition.max}
                            step={definition.step}
                            value={displayedValue}
                            placeholder={masked ? "?" : undefined}
                            disabled={locked}
                            onInput={(event) =>
                              updateNumeric(
                                definition.key,
                                event.currentTarget.value === ""
                                  ? Number.NaN
                                  : Number(event.currentTarget.value),
                              )
                            }
                            aria-invalid={Boolean(issue)}
                          />
                          <span>{definition.unit}</span>
                        </div>
                      </div>
                      <input
                        className="parameter-range"
                        aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`}
                        type="range"
                        min={definition.min}
                        max={definition.max}
                        step={definition.step}
                        value={
                          Number.isFinite(rangeValue)
                            ? rangeValue
                            : definition.min
                        }
                        disabled={locked}
                        onChange={(event) =>
                          updateNumeric(
                            definition.key,
                            event.currentTarget.valueAsNumber,
                          )
                        }
                      />
                      {issue ? (
                        <p className="field-error">
                          {locale === "en"
                            ? `Enter ${definition.min}-${definition.max}.`
                            : `请输入 ${definition.min}-${definition.max}。`}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
                {(["showForces", "showMomentArcs"] as const).map((key) => (
                  <div
                    className="parameter-control lever-toggle-parameter"
                    key={key}
                  >
                    <span className="lever-control-label">
                      {copy.parameters[key]}
                    </span>
                    <button
                      className={`lever-switch-control ${parameters[key] ? "enabled" : ""}`}
                      type="button"
                      role="switch"
                      aria-checked={parameters[key]}
                      onClick={() => toggleBoolean(key)}
                    >
                      <Check size={15} />
                      <span>
                        {parameters[key]
                          ? copy.toggles.shown
                          : copy.toggles.hidden}
                      </span>
                      <span className="lever-switch-track">
                        <span />
                      </span>
                    </button>
                  </div>
                ))}
              </div>
              <section className="measurement-section">
                <div className="section-title">
                  <h2>{copy.measurements.title}</h2>
                  <span>{copy.measurements.model}</span>
                </div>
                <dl className="measurements lever-measurements">
                  <div
                    className={`lever-measurement-heading outcome-${renderedState?.outcome ?? "invalid"}`}
                  >
                    <dt>{copy.measurements.outcome}</dt>
                    <dd>
                      {renderedState ? copy.canvas.phase[phase] : "--"}
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.leftWeight}</dt>
                    <dd>
                      {renderedState
                        ? formatNumber(renderedState.leftWeightN, locale, 1)
                        : "--"}
                      <small>N</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.rightWeight}</dt>
                    <dd>
                      {renderedState && !maskedRightMass
                        ? formatNumber(renderedState.rightWeightN, locale, 1)
                        : "--"}
                      <small>N</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.leftMoment}</dt>
                    <dd>
                      {motionState
                        ? formatNumber(motionState.leftTorqueNm, locale, 2)
                        : "--"}
                      <small>N·m</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.rightMoment}</dt>
                    <dd>
                      {motionState && (unknownMode === "none" || showAnswer)
                        ? formatNumber(motionState.rightTorqueNm, locale, 2)
                        : "--"}
                      <small>N·m</small>
                    </dd>
                  </div>
                  <div className="lever-net-measurement">
                    <dt>{copy.measurements.netMoment}</dt>
                    <dd>
                      {motionState && (unknownMode === "none" || showAnswer)
                        ? formatSigned(motionState.netTorqueNm, locale, 2)
                        : "--"}
                      <small>N·m</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.angle}</dt>
                    <dd>
                      {motionState
                        ? formatSigned(
                            motionState.angleRadians * 180 / Math.PI,
                            locale,
                            1,
                          )
                        : "--"}
                      <small>°</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.angularSpeed}</dt>
                    <dd>
                      {motionState
                        ? formatNumber(
                            Math.abs(
                              motionState.angularVelocityRadiansPerSecond,
                            ),
                            locale,
                            2,
                          )
                        : "--"}
                      <small>rad/s</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.balanceMass}</dt>
                    <dd>
                      {baseState && (unknownMode !== "right-mass" || showAnswer)
                        ? formatNumber(baseState.requiredRightMassKg, locale, 2)
                        : "--"}
                      <small>kg</small>
                    </dd>
                  </div>
                  <div>
                    <dt>{copy.measurements.balanceDistance}</dt>
                    <dd>
                      {baseState &&
                      (unknownMode !== "right-distance" || showAnswer)
                        ? formatNumber(
                            baseState.requiredRightDistanceM,
                            locale,
                            2,
                          )
                        : "--"}
                      <small>m</small>
                    </dd>
                  </div>
                </dl>
              </section>
              <section className="science-section">
                <div className="section-title">
                  <h2>{commonCopy.panel.scienceNotes}</h2>
                </div>
                {issues.map((issue) => (
                  <div
                    className={`science-issue ${issue.severity}`}
                    key={issue.id}
                  >
                    {issue.severity === "assumption" ? (
                      <Info size={15} />
                    ) : (
                      <AlertTriangle size={15} />
                    )}
                    <div>
                      <strong>{issue.title}</strong>
                      <p>{issue.detail}</p>
                    </div>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <>
              <div className="panel-heading narration-panel-heading">
                <div>
                  <span className="panel-kicker">
                    {commonCopy.narration.kicker}
                  </span>
                  <h1>{commonCopy.narration.steps}</h1>
                </div>
                <span className="narration-step-count">
                  {commonCopy.narration.stepCount(
                    narrationFrame.index + 1,
                    narrationSteps.length,
                  )}
                </span>
              </div>
              <div className="narration-step-list">
                {narrationSteps.map((item, index) => (
                  <button
                    className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`}
                    type="button"
                    onClick={() => selectNarrationStep(index)}
                    key={item.id}
                  >
                    <span className="narration-step-index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="narration-step-summary">
                      <strong>{item.title}</strong>
                      <small>
                        {item.durationSeconds.toFixed(1)}{" "}
                        {commonCopy.narration.seconds}
                      </small>
                    </span>
                    <span className={`scene-mode ${item.simulationMode}`}>
                      {item.simulationMode === "play" ? (
                        <Play size={12} />
                      ) : (
                        <Pause size={12} />
                      )}
                    </span>
                  </button>
                ))}
              </div>
              <section className="narration-editor">
                <label>
                  <span>{commonCopy.narration.title}</span>
                  <input
                    type="text"
                    maxLength={80}
                    value={narrationFrame.step.title}
                    onChange={(event) =>
                      updateNarrationText(
                        narrationFrame.step.id as LeverStepId,
                        "title",
                        event.currentTarget.value,
                      )
                    }
                  />
                </label>
                <label>
                  <span>{commonCopy.narration.caption}</span>
                  <textarea
                    maxLength={240}
                    rows={3}
                    value={narrationFrame.step.caption}
                    onChange={(event) =>
                      updateNarrationText(
                        narrationFrame.step.id as LeverStepId,
                        "caption",
                        event.currentTarget.value,
                      )
                    }
                  />
                </label>
                <div className="narration-editor-row">
                  <label>
                    <span>{commonCopy.narration.duration}</span>
                    <div className="duration-field">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={narrationFrame.step.durationSeconds}
                        onChange={(event) =>
                          updateNarrationDuration(
                            narrationFrame.step.id as LeverStepId,
                            event.currentTarget.valueAsNumber,
                          )
                        }
                      />
                      <span>{commonCopy.narration.seconds}</span>
                    </div>
                  </label>
                  <div className="scene-behavior">
                    <span>{commonCopy.narration.scene}</span>
                    <strong>
                      <Pause size={13} />
                      {commonCopy.narration.holdFrame}
                    </strong>
                  </div>
                </div>
                <button
                  className="restore-steps-button"
                  type="button"
                  onClick={restoreNarrationDefaults}
                >
                  <ListRestart size={15} />
                  {commonCopy.narration.restoreDefaults}
                </button>
              </section>
            </>
          )}
        </aside>
      </section>
      <footer className="playback-bar">
        <div className="playback-controls">
          <button
            className="icon-button"
            type="button"
            onClick={stopAndResetTime}
            aria-label={commonCopy.actions.reset}
          >
            <RotateCcw />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => step(-1)}
            aria-label={commonCopy.actions.previousFrame}
          >
            <SkipBack />
          </button>
          <button
            className="play-button"
            type="button"
            onClick={() => {
              if (playbackTimeSeconds >= durationSeconds) stopAndResetTime();
              setIsPlaying((current) => !current);
            }}
            disabled={!renderedState}
            aria-label={
              isPlaying ? commonCopy.actions.pause : commonCopy.actions.play
            }
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={() => step(1)}
            aria-label={commonCopy.actions.nextFrame}
          >
            <SkipForward />
          </button>
        </div>
        <span className="timecode">
          {formatNumber(playbackTimeSeconds, locale, 2)}{" "}
          <small>/ {formatNumber(durationSeconds, locale, 2)} s</small>
        </span>
        {mode === "narration" ? (
          <div className="lesson-timeline-wrap">
            <div className="lesson-segments">
              {narrationSteps.map((item, index) => (
                <span
                  className={index === narrationFrame.index ? "active" : ""}
                  style={{ flex: item.durationSeconds }}
                  key={item.id}
                >
                  <small>{String(index + 1).padStart(2, "0")}</small>
                </span>
              ))}
            </div>
            <input
              className="timeline lesson-timeline"
              aria-label={commonCopy.narration.timeline}
              type="range"
              min="0"
              max={durationSeconds}
              step={1 / FPS}
              value={narrationTimeSeconds}
              onInput={(event) => {
                setIsPlaying(false);
                setNarrationTimeSeconds(event.currentTarget.valueAsNumber);
              }}
            />
          </div>
        ) : (
          <div className="lever-timeline-wrap">
            <div className="lever-timeline-phases" aria-hidden="true">
              <span>{copy.canvas.timelineAnalyze}</span>
              <span>{copy.canvas.timelineRelease}</span>
            </div>
            <input
              className="timeline lever-timeline"
              aria-label={
                locale === "en" ? "Analyze and release" : "受力分析与释放"
              }
              type="range"
              min="0"
              max={durationSeconds}
              step={1 / FPS}
              value={timeSeconds}
              onInput={(event) => {
                setIsPlaying(false);
                setTimeSeconds(event.currentTarget.valueAsNumber);
              }}
            />
          </div>
        )}
        <label className="speed-control">
          <span>{commonCopy.actions.speed}</span>
          <select
            value={speed}
            onChange={(event) => setSpeed(Number(event.currentTarget.value))}
          >
            <option value="0.25">0.25×</option>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </footer>
    </main>
  );
}
