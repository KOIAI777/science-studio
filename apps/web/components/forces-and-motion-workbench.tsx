"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  createForcesMotionProfile,
  forcesMotionDefaults,
  forcesMotionParametersSchema,
  forcesMotionTemplate,
  inspectForcesMotion,
  sampleForcesMotion,
  type ForcesMotionParameters,
  type ForcesMotionProfile,
  type ForcesMotionState,
} from "@science-studio/templates/forces-and-motion";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  FlaskConical,
  Info,
  Languages,
  ListRestart,
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
import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {workbenchCopy, type Locale} from "../lib/i18n";
import {
  getNarrationDuration,
  getNarrationStepStart,
  resolveNarrationFrame,
} from "../lib/narration";
import {CanvasTextSizeControls} from "./canvas-text-size-controls";

const FPS = 30;

type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type ParameterKey = keyof ForcesMotionParameters;
type ForcesStepId = "setup" | "forces" | "threshold" | "net-force" | "motion" | "graphs";
type ForcesStepText = Record<ForcesStepId, {title: string; caption: string}>;
type ForcesTextOverrides = Partial<Record<ForcesStepId, Partial<{title: string; caption: string}>>>;
type ForcesDurationOverrides = Partial<Record<ForcesStepId, number>>;

interface ForcesCopy {
  projectName: string;
  parameters: Record<ParameterKey, string>;
  measurements: {
    title: string;
    model: string;
    applied: string;
    friction: string;
    net: string;
    acceleration: string;
    velocity: string;
    displacement: string;
  };
  canvas: {
    ariaLabel: string;
    description: string;
    title: string;
    subtitle: string;
    stateLabel: string;
    held: string;
    driven: string;
    braking: string;
    coasting: string;
    stopped: string;
    threshold: string;
    appliedMarker: string;
    belowThreshold: string;
    aboveThreshold: string;
    forceAnalysis: string;
    forceScaleNote: string;
    appliedForce: string;
    staticFriction: string;
    kineticFriction: string;
    noFriction: string;
    netForce: string;
    forcePlot: string;
    velocityPlot: string;
    appliedLegend: string;
    frictionLegend: string;
    netLegend: string;
    release: string;
    assumptions: string;
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
  narration: ForcesStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    zeroTitle: string;
    zeroDetail: string;
    staticTitle: string;
    staticDetail: (threshold: string) => string;
    nearTitle: string;
    nearDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const forcesCopy: Record<Locale, ForcesCopy> = {
  en: {
    projectName: "Forces & Motion",
    parameters: {
      massKg: "Block mass",
      appliedForceN: "Applied force",
      staticFrictionCoefficient: "Static friction",
      kineticFrictionCoefficient: "Kinetic friction",
      gravityMs2: "Gravity",
      forceDurationSeconds: "Force duration",
    },
    measurements: {
      title: "Live force and motion",
      model: "1D rigid-body model",
      applied: "Applied force",
      friction: "Friction force",
      net: "Net force",
      acceleration: "Acceleration",
      velocity: "Velocity",
      displacement: "Displacement",
    },
    canvas: {
      ariaLabel: "Forces, friction, and motion experiment canvas",
      description: "A block on a horizontal surface with a live free-body diagram, static-friction threshold, net-force equation, and time plots.",
      title: "Forces & Motion",
      subtitle: "Cross the friction threshold, then follow the motion.",
      stateLabel: "MOTION STATE",
      held: "STATIC BALANCE",
      driven: "DRIVEN: SPEEDING UP",
      braking: "BRAKING BY FRICTION",
      coasting: "COASTING AT CONSTANT v",
      stopped: "STOPPED",
      threshold: "STATIC-FRICTION THRESHOLD",
      appliedMarker: "applied",
      belowThreshold: "HELD BY STATIC FRICTION",
      aboveThreshold: "BREAKAWAY",
      forceAnalysis: "FREE-BODY DIAGRAM",
      forceScaleNote: "signed horizontal forces",
      appliedForce: "applied force",
      staticFriction: "static friction matches the push",
      kineticFriction: "kinetic friction opposes motion",
      noFriction: "no horizontal friction",
      netForce: "NEWTON'S SECOND LAW",
      forcePlot: "FORCE vs TIME",
      velocityPlot: "VELOCITY vs TIME",
      appliedLegend: "applied",
      frictionLegend: "friction",
      netLegend: "net",
      release: "force released",
      assumptions: "Rigid block · Constant friction · 1D motion",
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
      setup: {title: "Set up the push", caption: "A block starts at rest on a horizontal rough surface."},
      forces: {title: "Identify all four forces", caption: "Weight and normal force balance vertically; the push and friction act horizontally."},
      threshold: {title: "Test the static-friction limit", caption: "The block moves only when the push exceeds the maximum static friction."},
      "net-force": {title: "Find the net force", caption: "Add the signed horizontal forces, then divide by mass to predict acceleration."},
      motion: {title: "Follow the motion", caption: "The block accelerates during the push and friction slows it after release."},
      graphs: {title: "Read the time plots", caption: "Connect changes in net force to the slope of the velocity graph."},
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail: "Check the highlighted input before running the experiment.",
      zeroTitle: "The push has no duration",
      zeroDetail: "A zero-duration force supplies no impulse, so the block remains at rest.",
      staticTitle: "Static friction balances the push",
      staticDetail: (threshold) => `The applied force does not exceed the ${threshold} N static-friction limit.`,
      nearTitle: "Close to breakaway",
      nearDetail: "A small change in force or friction may change whether the block starts moving.",
      assumptionTitle: "Ideal one-dimensional model",
      assumptionDetail: "Air drag, rolling, deformation, collisions, and scene boundaries are ignored; friction coefficients stay constant.",
    },
  },
  "zh-CN": {
    projectName: "力与运动",
    parameters: {
      massKg: "滑块质量",
      appliedForceN: "外力",
      staticFrictionCoefficient: "静摩擦系数",
      kineticFrictionCoefficient: "动摩擦系数",
      gravityMs2: "重力加速度",
      forceDurationSeconds: "外力持续时间",
    },
    measurements: {
      title: "实时力与运动",
      model: "一维刚体模型",
      applied: "外力",
      friction: "摩擦力",
      net: "合力",
      acceleration: "加速度",
      velocity: "速度",
      displacement: "位移",
    },
    canvas: {
      ariaLabel: "力、摩擦与运动实验画布",
      description: "水平面上的滑块，同时展示受力图、静摩擦阈值、合力方程和时间图像。",
      title: "力与运动",
      subtitle: "越过摩擦阈值，再追踪物体的运动",
      stateLabel: "运动状态",
      held: "静摩擦平衡",
      driven: "外力驱动：加速",
      braking: "摩擦制动",
      coasting: "匀速滑行",
      stopped: "已经停止",
      threshold: "静摩擦阈值",
      appliedMarker: "当前外力",
      belowThreshold: "静摩擦保持静止",
      aboveThreshold: "开始运动",
      forceAnalysis: "受力分析",
      forceScaleNote: "水平方向按正负号显示",
      appliedForce: "外力",
      staticFriction: "静摩擦力与外力等大反向",
      kineticFriction: "动摩擦力与运动方向相反",
      noFriction: "水平方向无摩擦力",
      netForce: "牛顿第二定律",
      forcePlot: "力 - 时间图",
      velocityPlot: "速度 - 时间图",
      appliedLegend: "外力",
      frictionLegend: "摩擦力",
      netLegend: "合力",
      release: "撤去外力",
      assumptions: "刚性滑块 · 摩擦系数恒定 · 一维运动",
      invalid: "修正参数后恢复实验",
    },
    viewport: {
      ratio: "画布比例",
      portrait: "竖屏 9:16",
      landscape: "宽屏 16:9",
      zoomOut: "缩小",
      zoomIn: "放大",
      move: "移动画布",
      fit: "适应窗口",
      enterFullscreen: "进入全屏",
      exitFullscreen: "退出全屏",
      canvasNavigation: "画布导航",
    },
    narration: {
      setup: {title: "设置外力", caption: "滑块从静止开始，放在粗糙的水平面上。"},
      forces: {title: "识别四种力", caption: "重力与支持力在竖直方向平衡，外力与摩擦力作用在水平方向。"},
      threshold: {title: "判断静摩擦阈值", caption: "只有外力超过最大静摩擦力，滑块才会开始运动。"},
      "net-force": {title: "计算合力", caption: "先按方向相加水平力，再用质量计算加速度。"},
      motion: {title: "追踪运动", caption: "外力作用时滑块加速；撤去外力后，摩擦力使其减速。"},
      graphs: {title: "读取时间图像", caption: "把合力的变化与速度图像斜率的变化对应起来。"},
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      zeroTitle: "外力没有作用时间",
      zeroDetail: "持续时间为零时不会产生冲量，滑块保持静止。",
      staticTitle: "静摩擦力平衡外力",
      staticDetail: (threshold) => `外力没有超过 ${threshold} N 的最大静摩擦力。`,
      nearTitle: "接近开始运动的临界点",
      nearDetail: "外力或摩擦系数的微小变化，都可能改变滑块是否开始运动。",
      assumptionTitle: "理想一维平动模型",
      assumptionDetail: "忽略空气阻力、滚动、形变、碰撞和场景边界，并假设摩擦系数恒定。",
    },
  },
};

const parameterDefinitions = forcesMotionTemplate.parameterDefinitions as Array<{
  key: ParameterKey;
  unit: string;
  min: number;
  max: number;
  step: number;
}>;

function formatNumber(value: number, locale: Locale, digits = 2) {
  const normalizedValue = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(normalizedValue);
}

function wrapCaption(caption: string) {
  const trimmed = caption.trim();
  if (trimmed.length <= 52) return [trimmed];
  if (!trimmed.includes(" ")) return [trimmed.slice(0, 26), trimmed.slice(26, 52)];

  const words = trimmed.split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    const lineIndex = lines.length - 1;
    const candidate = `${lines[lineIndex]} ${word}`.trim();
    if (candidate.length <= 52 || lines[lineIndex] === "") lines[lineIndex] = candidate;
    else if (lines.length === 1) lines.push(word);
    else lines[1] = `${lines[1]} ${word}`;
  }
  return lines.slice(0, 2);
}

function localizeIssue(issue: ScienceIssue, locale: Locale, profile: ForcesMotionProfile | null) {
  const copy = forcesCopy[locale].issues;
  if (issue.id === "zero-force-duration") return {...issue, title: copy.zeroTitle, detail: copy.zeroDetail};
  if (issue.id === "static-equilibrium") {
    return {
      ...issue,
      title: copy.staticTitle,
      detail: copy.staticDetail(formatNumber(profile?.maximumStaticFrictionN ?? 0, locale, 2)),
    };
  }
  if (issue.id === "near-static-threshold") return {...issue, title: copy.nearTitle, detail: copy.nearDetail};
  if (issue.id === "forces-motion-assumptions") return {...issue, title: copy.assumptionTitle, detail: copy.assumptionDetail};
  return {...issue, title: copy.invalidTitle, detail: copy.invalidDetail};
}

function buildPlotPath(
  profile: ForcesMotionProfile,
  durationSeconds: number,
  valueAt: (state: ForcesMotionState) => number,
  x: number,
  y: number,
  width: number,
  height: number,
  maxMagnitude: number,
) {
  return Array.from({length: 65}, (_, index) => {
    const time = (durationSeconds * index) / 64;
    const value = valueAt(sampleForcesMotion(profile, time));
    const plotX = x + (time / durationSeconds) * width;
    const plotY = y + height / 2 - (value / maxMagnitude) * (height / 2 - 8);
    return `${index === 0 ? "M" : "L"} ${plotX.toFixed(2)} ${plotY.toFixed(2)}`;
  }).join(" ");
}

function PlotAxes({
  x,
  y,
  width,
  height,
  durationSeconds,
  maxMagnitude,
  unit,
  locale,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  durationSeconds: number;
  maxMagnitude: number;
  unit: string;
  locale: Locale;
}) {
  return (
    <g className="forces-plot-axes">
      <line x1={x} y1={y} x2={x} y2={y + height} />
      <line x1={x} y1={y + height / 2} x2={x + width} y2={y + height / 2} />
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} className="forces-plot-gridline" />
      <line x1={x + width} y1={y} x2={x + width} y2={y + height} className="forces-plot-gridline" />
      <text x={x - 10} y={y + 5} textAnchor="end">+{formatNumber(maxMagnitude, locale, 1)}</text>
      <text x={x - 10} y={y + height / 2 + 5} textAnchor="end">0</text>
      <text x={x - 10} y={y + height + 5} textAnchor="end">-{formatNumber(maxMagnitude, locale, 1)}</text>
      <text x={x} y={y + height + 22}>0</text>
      <text x={x + width / 2} y={y + height + 22} textAnchor="middle">{formatNumber(durationSeconds / 2, locale, 1)}</text>
      <text x={x + width} y={y + height + 22} textAnchor="end">{formatNumber(durationSeconds, locale, 1)} s</text>
      <text x={x - 10} y={y - 9} textAnchor="end">{unit}</text>
    </g>
  );
}

interface ForcesCanvasContentProps {
  parameters: ForcesMotionParameters;
  profile: ForcesMotionProfile | null;
  state: ForcesMotionState | null;
  durationSeconds: number;
  locale: Locale;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}

function ForcesMotionPortraitCanvas({
  parameters,
  profile,
  state,
  durationSeconds,
  locale,
  narrationStep,
  narrationStepIndex,
  narrationStepCount,
}: ForcesCanvasContentProps) {
  const copy = forcesCopy[locale].canvas;
  const captionLines = narrationStep ? wrapCaption(narrationStep.caption) : [];
  const focus = narrationStep?.highlights[0];
  const opacityFor = (section: string) => !focus || focus === section || (focus === "setup" && section === "motion") ? 1 : 0.28;
  const phaseText = !state
    ? copy.stopped
    : state.phase === "held"
      ? copy.held
      : state.phase === "driven"
        ? copy.driven
        : state.phase === "braking"
          ? copy.braking
          : state.phase === "coasting"
            ? copy.coasting
            : copy.stopped;

  const blockX = state
    ? Math.min(566, Math.max(154, 360 + state.displacementM * 18))
    : 360;
  const forceMagnitudeMax = Math.max(
    Math.abs(state?.appliedForceN ?? parameters.appliedForceN),
    Math.abs(state?.frictionForceN ?? 0),
    state?.weightForceN ?? parameters.massKg * parameters.gravityMs2,
    1,
  );
  const arrowLength = (value: number, max = 116) => value === 0
    ? 0
    : Math.max(42, Math.min(max, (Math.abs(value) / forceMagnitudeMax) * max));
  const appliedDirection = Math.sign(state?.appliedForceN ?? 0);
  const frictionDirection = Math.sign(state?.frictionForceN ?? 0);
  const horizontalRoom = (direction: number) => direction > 0
    ? Math.max(0, 630 - (blockX + 48))
    : Math.max(0, blockX - 48 - 90);
  const appliedLength = Math.min(
    arrowLength(state?.appliedForceN ?? 0),
    horizontalRoom(appliedDirection),
  );
  const frictionLength = Math.min(
    arrowLength(state?.frictionForceN ?? 0),
    horizontalRoom(frictionDirection),
  );
  const verticalLength = arrowLength(state?.weightForceN ?? 0, 80);

  const thresholdN = profile?.maximumStaticFrictionN ?? 0;
  const appliedMagnitudeN = Math.abs(parameters.appliedForceN);
  const rulerMaximumN = Math.max(1, thresholdN, appliedMagnitudeN) * 1.18;
  const rulerX = 90;
  const rulerWidth = 540;
  const thresholdX = rulerX + (thresholdN / rulerMaximumN) * rulerWidth;
  const appliedX = rulerX + (appliedMagnitudeN / rulerMaximumN) * rulerWidth;
  const exceedsThreshold = profile?.exceedsStaticThreshold ?? false;

  const graphX = 118;
  const graphWidth = 510;
  const graphHeight = 76;
  const forceGraphY = 898;
  const velocityGraphY = 1037;
  const releaseX = graphX + (parameters.forceDurationSeconds / durationSeconds) * graphWidth;
  const forcePlotMax = Math.max(
    1,
    Math.abs(parameters.appliedForceN),
    profile?.maximumStaticFrictionN ?? 0,
    profile?.kineticFrictionMagnitudeN ?? 0,
  );
  const velocityPlotMax = Math.max(
    1,
    Math.abs(profile?.releaseVelocityMs ?? 0),
    profile && profile.stopTimeSeconds === null
      ? Math.abs(sampleForcesMotion(profile, durationSeconds).velocityMs)
      : 0,
  );
  const frictionDescription = state?.frictionRegime === "static"
    ? copy.staticFriction
    : state?.frictionRegime === "kinetic"
      ? copy.kineticFriction
      : copy.noFriction;

  return (
    <svg className="experiment-svg" viewBox="0 0 720 1280" role="img" aria-labelledby="forces-canvas-title forces-canvas-description">
        <title id="forces-canvas-title">{copy.title}</title>
        <desc id="forces-canvas-description">{copy.description}</desc>
        <defs>
          <pattern id="forces-minor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dfe1da" strokeWidth="1" />
          </pattern>
          <marker id="forces-arrow-applied" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#e85d42" />
          </marker>
          <marker id="forces-arrow-friction" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#b7791f" />
          </marker>
          <marker id="forces-arrow-normal" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#2659a8" />
          </marker>
          <marker id="forces-arrow-weight" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#147f75" />
          </marker>
        </defs>

        <rect width="720" height="1280" fill="#f6f7f2" />
        <rect x="44" y="44" width="632" height="1192" fill="url(#forces-minor-grid)" stroke="#c9ccc3" strokeDasharray="8 8" />
        <text x="72" y="104" className="canvas-kicker">MECHANICS / 03</text>
        <text x="72" y="152" className={`canvas-title ${locale === "en" ? "canvas-title-en" : ""}`}>{copy.title}</text>
        <text x="72" y="188" className="canvas-subtitle">{copy.subtitle}</text>

        {narrationStep ? (
          <g className="narration-chapter" transform="translate(72 216)">
            <text className="narration-step-number">{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text>
            <text y="45" className="narration-step-title">{narrationStep.title}</text>
            <text y="79" className="narration-step-caption">
              {captionLines.map((line, index) => <tspan x="0" dy={index === 0 ? 0 : 25} key={`${line}-${index}`}>{line}</tspan>)}
            </text>
            <line x1="0" y1="118" x2="576" y2="118" stroke="#b9bdb3" />
          </g>
        ) : (
          <g transform="translate(72 238)">
            <text className="measure-label">{copy.stateLabel}</text>
            <text y="42" className="motion-value forces-motion-value">{phaseText}</text>
            <line x1="0" y1="64" x2="576" y2="64" stroke="#b9bdb3" />
          </g>
        )}

        <g className="forces-canvas-section forces-threshold" opacity={opacityFor("threshold")}>
          <text x="72" y="356" className="forces-section-heading">{copy.threshold}</text>
          <text x="648" y="356" textAnchor="end" className={exceedsThreshold ? "forces-breakaway" : "forces-held"}>
            {exceedsThreshold ? copy.aboveThreshold : copy.belowThreshold}
          </text>
          <line x1={rulerX} y1="402" x2={rulerX + rulerWidth} y2="402" className="forces-threshold-line" />
          <line x1={rulerX} y1="394" x2={rulerX} y2="410" className="forces-threshold-tick" />
          <text x={rulerX} y="430" textAnchor="middle" className="forces-ruler-number">0</text>
          <line x1={thresholdX} y1="383" x2={thresholdX} y2="421" className="forces-threshold-marker" />
          <text x={thresholdX} y="376" textAnchor="middle" className="forces-threshold-value">fₛ,max {formatNumber(thresholdN, locale, 1)} N</text>
          <circle cx={appliedX} cy="402" r="8" className={exceedsThreshold ? "forces-applied-dot breakaway" : "forces-applied-dot"} />
          <text x={appliedX} y="451" textAnchor="middle" className="forces-applied-value">|F| {formatNumber(appliedMagnitudeN, locale, 1)} N · {copy.appliedMarker}</text>
        </g>

        <g className="forces-canvas-section forces-motion-scene" opacity={opacityFor(focus === "forces" ? "forces" : "motion")}>
          <text x="72" y="493" className="forces-section-heading">{copy.forceAnalysis}</text>
          <text x="648" y="493" textAnchor="end" className="forces-section-note">{copy.forceScaleNote}</text>
          <line x1="72" y1="505" x2="648" y2="505" className="forces-section-rule" />

          <line x1="84" y1="665" x2="636" y2="665" className="forces-surface" />
          <line x1="360" y1="651" x2="360" y2="686" className="forces-origin-mark" />
          <line x1="360" y1="676" x2={blockX} y2="676" className="forces-displacement-trail" />
          <text x="360" y="704" textAnchor="middle" className="forces-origin-label">x₀</text>
          <text x={blockX} y="704" textAnchor="middle" className="forces-position-label">x = {state ? formatNumber(state.displacementM, locale, 2) : "--"} m</text>

          <g transform={`translate(${blockX} 625)`} className="forces-block">
            <rect x="-44" y="-54" width="88" height="54" rx="4" />
            <path d="M -31 -41 L 31 -41 M -31 -29 L 31 -29" />
            <text x="0" y="-9" textAnchor="middle">m</text>
          </g>

          {state ? (
            <g className="forces-vectors" opacity={opacityFor("forces")}>
              <line x1={blockX} y1="598" x2={blockX} y2={598 - verticalLength} className="forces-vector forces-vector-normal" markerEnd="url(#forces-arrow-normal)" />
              <text x={blockX + 13} y={598 - verticalLength + 5} className="forces-force-label forces-label-normal">N</text>
              <line x1={blockX} y1="598" x2={blockX} y2={598 + verticalLength} className="forces-vector forces-vector-weight" markerEnd="url(#forces-arrow-weight)" />
              <text x={blockX + 13} y={598 + verticalLength - 3} className="forces-force-label forces-label-weight">mg</text>
              {appliedLength > 0 ? (
                <>
                  <line x1={blockX + appliedDirection * 48} y1="579" x2={blockX + appliedDirection * (48 + appliedLength)} y2="579" className="forces-vector forces-vector-applied" markerEnd="url(#forces-arrow-applied)" />
                  <text x={blockX + appliedDirection * (57 + appliedLength)} y="568" textAnchor={appliedDirection > 0 ? "start" : "end"} className="forces-force-label forces-label-applied">F<tspan baselineShift="sub" fontSize="14">app</tspan></text>
                </>
              ) : null}
              {frictionLength > 0 ? (
                <>
                  <line x1={blockX + frictionDirection * 48} y1="642" x2={blockX + frictionDirection * (48 + frictionLength)} y2="642" className="forces-vector forces-vector-friction" markerEnd="url(#forces-arrow-friction)" />
                  <text x={blockX + frictionDirection * (57 + frictionLength)} y="633" textAnchor={frictionDirection > 0 ? "start" : "end"} className="forces-force-label forces-label-friction">f<tspan baselineShift="sub" fontSize="14">{state.frictionRegime === "static" ? "s" : "k"}</tspan></text>
                </>
              ) : null}
              <circle cx={blockX} cy="598" r="5" className="forces-vector-origin" />
            </g>
          ) : null}

          <text x="72" y="741" className="forces-force-readout forces-label-applied">Fapp = {state ? formatNumber(state.appliedForceN, locale, 1) : "--"} N</text>
          <text x="288" y="741" className="forces-force-readout forces-label-friction">f = {state ? formatNumber(state.frictionForceN, locale, 1) : "--"} N</text>
          <text x="648" y="741" textAnchor="end" className="forces-friction-guide">{frictionDescription}</text>
        </g>

        <g className="forces-canvas-section forces-equation" transform="translate(72 775)" opacity={opacityFor("equation")}>
          <text className="forces-section-heading">{copy.netForce}</text>
          <text x="576" textAnchor="end" className="forces-equation-result">ΣFₓ = {state ? formatNumber(state.netForceN, locale, 1) : "--"} N</text>
          <line y1="15" x2="576" y2="15" className="forces-section-rule" />
          <text y="52" className="forces-equation-formula">ΣFₓ = F<tspan baselineShift="sub" fontSize="17">app</tspan> + f = ma</text>
          <text x="576" y="52" textAnchor="end" className="forces-acceleration-result">a = {state ? formatNumber(state.accelerationMs2, locale, 2) : "--"} m/s²</text>
        </g>

        {profile ? (
          <g className="forces-canvas-section forces-graphs" opacity={opacityFor("graphs")}>
            <text x="72" y="874" className="forces-section-heading">{copy.forcePlot}</text>
            <PlotAxes x={graphX} y={forceGraphY} width={graphWidth} height={graphHeight} durationSeconds={durationSeconds} maxMagnitude={forcePlotMax} unit="N" locale={locale} />
            <line x1={releaseX} y1={forceGraphY} x2={releaseX} y2={forceGraphY + graphHeight} className="forces-release-line" />
            <path d={buildPlotPath(profile, durationSeconds, (item) => item.appliedForceN, graphX, forceGraphY, graphWidth, graphHeight, forcePlotMax)} className="forces-series forces-series-applied" />
            <path d={buildPlotPath(profile, durationSeconds, (item) => item.frictionForceN, graphX, forceGraphY, graphWidth, graphHeight, forcePlotMax)} className="forces-series forces-series-friction" />
            <path d={buildPlotPath(profile, durationSeconds, (item) => item.netForceN, graphX, forceGraphY, graphWidth, graphHeight, forcePlotMax)} className="forces-series forces-series-net" />
            <g transform="translate(310 873)" className="forces-plot-legend">
              <line x2="20" className="forces-series-applied" /><text x="27" y="4">{copy.appliedLegend}</text>
              <line x1="112" x2="132" className="forces-series-friction" /><text x="139" y="4">{copy.frictionLegend}</text>
              <line x1="223" x2="243" className="forces-series-net" /><text x="250" y="4">{copy.netLegend}</text>
            </g>

            <text x="72" y="1013" className="forces-section-heading">{copy.velocityPlot}</text>
            <text x="648" y="1013" textAnchor="end" className="forces-release-label">{copy.release}: {formatNumber(parameters.forceDurationSeconds, locale, 1)} s</text>
            <PlotAxes x={graphX} y={velocityGraphY} width={graphWidth} height={graphHeight} durationSeconds={durationSeconds} maxMagnitude={velocityPlotMax} unit="m/s" locale={locale} />
            <line x1={releaseX} y1={velocityGraphY} x2={releaseX} y2={velocityGraphY + graphHeight} className="forces-release-line" />
            <path d={buildPlotPath(profile, durationSeconds, (item) => item.velocityMs, graphX, velocityGraphY, graphWidth, graphHeight, velocityPlotMax)} className="forces-series forces-series-velocity" />
            <circle
              cx={graphX + (Math.min(state?.timeSeconds ?? 0, durationSeconds) / durationSeconds) * graphWidth}
              cy={velocityGraphY + graphHeight / 2 - ((state?.velocityMs ?? 0) / velocityPlotMax) * (graphHeight / 2 - 8)}
              r="5"
              className="forces-live-dot"
            />
          </g>
        ) : null}

        <g transform="translate(72 1188)">
          <text className="canvas-footnote">{copy.assumptions}</text>
          <text x="576" textAnchor="end" className="canvas-footnote">SCIENCE STUDIO</text>
        </g>
    </svg>
  );
}

function ForcesMotionLandscapeCanvas({
  parameters,
  profile,
  state,
  durationSeconds,
  locale,
  narrationStep,
  narrationStepIndex,
  narrationStepCount,
}: ForcesCanvasContentProps) {
  const copy = forcesCopy[locale].canvas;
  const captionLines = narrationStep ? wrapCaption(narrationStep.caption) : [];
  const focus = narrationStep?.highlights[0];
  const opacityFor = (section: string) => !focus || focus === section || (focus === "setup" && section === "motion") ? 1 : 0.28;
  const phaseText = !state
    ? copy.stopped
    : state.phase === "held"
      ? copy.held
      : state.phase === "driven"
        ? copy.driven
        : state.phase === "braking"
          ? copy.braking
          : state.phase === "coasting"
            ? copy.coasting
            : copy.stopped;

  const blockX = state
    ? Math.min(548, Math.max(180, 360 + state.displacementM * 13))
    : 360;
  const forceMagnitudeMax = Math.max(
    Math.abs(state?.appliedForceN ?? parameters.appliedForceN),
    Math.abs(state?.frictionForceN ?? 0),
    state?.weightForceN ?? parameters.massKg * parameters.gravityMs2,
    1,
  );
  const arrowLength = (value: number, max = 92) => value === 0
    ? 0
    : Math.max(36, Math.min(max, (Math.abs(value) / forceMagnitudeMax) * max));
  const appliedDirection = Math.sign(state?.appliedForceN ?? 0);
  const frictionDirection = Math.sign(state?.frictionForceN ?? 0);
  const horizontalRoom = (direction: number) => direction > 0
    ? Math.max(0, 616 - (blockX + 48))
    : Math.max(0, blockX - 48 - 72);
  const appliedLength = Math.min(arrowLength(state?.appliedForceN ?? 0), horizontalRoom(appliedDirection));
  const frictionLength = Math.min(arrowLength(state?.frictionForceN ?? 0), horizontalRoom(frictionDirection));
  const verticalLength = arrowLength(state?.weightForceN ?? 0, 68);

  const thresholdN = profile?.maximumStaticFrictionN ?? 0;
  const appliedMagnitudeN = Math.abs(parameters.appliedForceN);
  const rulerMaximumN = Math.max(1, thresholdN, appliedMagnitudeN) * 1.18;
  const rulerX = 74;
  const rulerWidth = 520;
  const thresholdX = rulerX + (thresholdN / rulerMaximumN) * rulerWidth;
  const appliedX = rulerX + (appliedMagnitudeN / rulerMaximumN) * rulerWidth;
  const exceedsThreshold = profile?.exceedsStaticThreshold ?? false;

  const graphX = 742;
  const graphWidth = 456;
  const graphHeight = 104;
  const forceGraphY = 245;
  const velocityGraphY = 474;
  const releaseX = graphX + (parameters.forceDurationSeconds / durationSeconds) * graphWidth;
  const forcePlotMax = Math.max(
    1,
    Math.abs(parameters.appliedForceN),
    profile?.maximumStaticFrictionN ?? 0,
    profile?.kineticFrictionMagnitudeN ?? 0,
  );
  const velocityPlotMax = Math.max(
    1,
    Math.abs(profile?.releaseVelocityMs ?? 0),
    profile && profile.stopTimeSeconds === null
      ? Math.abs(sampleForcesMotion(profile, durationSeconds).velocityMs)
      : 0,
  );
  const frictionDescription = state?.frictionRegime === "static"
    ? copy.staticFriction
    : state?.frictionRegime === "kinetic"
      ? copy.kineticFriction
      : copy.noFriction;

  return (
    <svg className="experiment-svg forces-landscape-svg" viewBox="0 0 1280 720" role="img" aria-labelledby="forces-landscape-title forces-landscape-description">
      <title id="forces-landscape-title">{copy.title}</title>
      <desc id="forces-landscape-description">{copy.description}</desc>
      <defs>
        <pattern id="forces-landscape-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dfe1da" strokeWidth="1" />
        </pattern>
        <marker id="forces-landscape-applied" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#e85d42" />
        </marker>
        <marker id="forces-landscape-friction" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#b7791f" />
        </marker>
        <marker id="forces-landscape-normal" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#2659a8" />
        </marker>
        <marker id="forces-landscape-weight" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
          <path d="M0,0 L7,3.5 L0,7 Z" fill="#147f75" />
        </marker>
      </defs>

      <rect width="1280" height="720" fill="#f6f7f2" />
      <rect x="24" y="24" width="1232" height="672" fill="url(#forces-landscape-grid)" stroke="#c9ccc3" strokeDasharray="8 8" />
      <line x1="656" y1="150" x2="656" y2="650" className="forces-section-rule" />
      <text x="52" y="56" className="canvas-kicker">MECHANICS / 03</text>
      <text x="52" y="93" className={`canvas-title ${locale === "en" ? "canvas-title-en" : ""}`}>{copy.title}</text>
      <text x="52" y="121" className="canvas-subtitle">{copy.subtitle}</text>

      {narrationStep ? (
        <g className="narration-chapter forces-landscape-narration" transform="translate(52 150)">
          <text className="narration-step-number">{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text>
          <text x="78" className="narration-step-title">{narrationStep.title}</text>
          <text x="650" className="narration-step-caption">
            {captionLines.map((line, index) => <tspan x="650" dy={index === 0 ? 0 : 23} key={`${line}-${index}`}>{line}</tspan>)}
          </text>
        </g>
      ) : (
        <g transform="translate(932 54)">
          <text className="measure-label">{copy.stateLabel}</text>
          <text y="37" className="motion-value forces-landscape-motion-value" textAnchor="start">{phaseText}</text>
        </g>
      )}

      <g className="forces-canvas-section forces-threshold" opacity={opacityFor("threshold")}>
        <text x="52" y="188" className="forces-section-heading">{copy.threshold}</text>
        <text x="620" y="188" textAnchor="end" className={exceedsThreshold ? "forces-breakaway" : "forces-held"}>
          {exceedsThreshold ? copy.aboveThreshold : copy.belowThreshold}
        </text>
        <line x1={rulerX} y1="230" x2={rulerX + rulerWidth} y2="230" className="forces-threshold-line" />
        <line x1={rulerX} y1="222" x2={rulerX} y2="238" className="forces-threshold-tick" />
        <text x={rulerX} y="255" textAnchor="middle" className="forces-ruler-number">0</text>
        <line x1={thresholdX} y1="211" x2={thresholdX} y2="249" className="forces-threshold-marker" />
        <text x={thresholdX} y="205" textAnchor="middle" className="forces-threshold-value">fₛ,max {formatNumber(thresholdN, locale, 1)} N</text>
        <circle cx={appliedX} cy="230" r="8" className={exceedsThreshold ? "forces-applied-dot breakaway" : "forces-applied-dot"} />
        <text x={appliedX} y="278" textAnchor="middle" className="forces-applied-value">|F| {formatNumber(appliedMagnitudeN, locale, 1)} N · {copy.appliedMarker}</text>
      </g>

      <g className="forces-canvas-section forces-motion-scene" opacity={opacityFor(focus === "forces" ? "forces" : "motion")}>
        <text x="52" y="320" className="forces-section-heading">{copy.forceAnalysis}</text>
        <text x="620" y="320" textAnchor="end" className="forces-section-note">{copy.forceScaleNote}</text>
        <line x1="52" y1="332" x2="620" y2="332" className="forces-section-rule" />
        <line x1="64" y1="476" x2="620" y2="476" className="forces-surface" />
        <line x1="360" y1="462" x2="360" y2="496" className="forces-origin-mark" />
        <line x1="360" y1="487" x2={blockX} y2="487" className="forces-displacement-trail" />
        <text x="360" y="514" textAnchor="middle" className="forces-origin-label">x₀</text>
        <text x={blockX} y="514" textAnchor="middle" className="forces-position-label">x = {state ? formatNumber(state.displacementM, locale, 2) : "--"} m</text>

        <g transform={`translate(${blockX} 436)`} className="forces-block">
          <rect x="-44" y="-54" width="88" height="54" rx="4" />
          <path d="M -31 -41 L 31 -41 M -31 -29 L 31 -29" />
          <text x="0" y="-9" textAnchor="middle">m</text>
        </g>

        {state ? (
          <g className="forces-vectors" opacity={opacityFor("forces")}>
            <line x1={blockX} y1="409" x2={blockX} y2={409 - verticalLength} className="forces-vector forces-vector-normal" markerEnd="url(#forces-landscape-normal)" />
            <text x={blockX + 13} y={409 - verticalLength + 5} className="forces-force-label forces-label-normal">N</text>
            <line x1={blockX} y1="409" x2={blockX} y2={409 + verticalLength} className="forces-vector forces-vector-weight" markerEnd="url(#forces-landscape-weight)" />
            <text x={blockX + 13} y={409 + verticalLength - 3} className="forces-force-label forces-label-weight">mg</text>
            {appliedLength > 0 ? (
              <>
                <line x1={blockX + appliedDirection * 48} y1="390" x2={blockX + appliedDirection * (48 + appliedLength)} y2="390" className="forces-vector forces-vector-applied" markerEnd="url(#forces-landscape-applied)" />
                <text x={blockX + appliedDirection * (57 + appliedLength)} y="379" textAnchor={appliedDirection > 0 ? "start" : "end"} className="forces-force-label forces-label-applied">F<tspan baselineShift="sub" fontSize="14">app</tspan></text>
              </>
            ) : null}
            {frictionLength > 0 ? (
              <>
                <line x1={blockX + frictionDirection * 48} y1="453" x2={blockX + frictionDirection * (48 + frictionLength)} y2="453" className="forces-vector forces-vector-friction" markerEnd="url(#forces-landscape-friction)" />
                <text x={blockX + frictionDirection * (57 + frictionLength)} y="444" textAnchor={frictionDirection > 0 ? "start" : "end"} className="forces-force-label forces-label-friction">f<tspan baselineShift="sub" fontSize="14">{state.frictionRegime === "static" ? "s" : "k"}</tspan></text>
              </>
            ) : null}
            <circle cx={blockX} cy="409" r="5" className="forces-vector-origin" />
          </g>
        ) : null}

        <text x="52" y="548" className="forces-force-readout forces-label-applied">Fapp = {state ? formatNumber(state.appliedForceN, locale, 1) : "--"} N</text>
        <text x="265" y="548" className="forces-force-readout forces-label-friction">f = {state ? formatNumber(state.frictionForceN, locale, 1) : "--"} N</text>
        <text x="620" y="548" textAnchor="end" className="forces-friction-guide">{frictionDescription}</text>
      </g>

      <g className="forces-canvas-section forces-equation" transform="translate(52 584)" opacity={opacityFor("equation")}>
        <text className="forces-section-heading">{copy.netForce}</text>
        <text x="568" textAnchor="end" className="forces-equation-result">ΣFₓ = {state ? formatNumber(state.netForceN, locale, 1) : "--"} N</text>
        <line y1="15" x2="568" y2="15" className="forces-section-rule" />
        <text y="56" className="forces-equation-formula">ΣFₓ = F<tspan baselineShift="sub" fontSize="17">app</tspan> + f = ma</text>
        <text x="568" y="56" textAnchor="end" className="forces-acceleration-result">a = {state ? formatNumber(state.accelerationMs2, locale, 2) : "--"} m/s²</text>
      </g>

      {profile ? (
        <g className="forces-canvas-section forces-graphs" opacity={opacityFor("graphs")}>
          <text x="692" y="205" className="forces-section-heading">{copy.forcePlot}</text>
          <g transform="translate(910 204)" className="forces-plot-legend">
            <line x2="20" className="forces-series-applied" /><text x="27" y="4">{copy.appliedLegend}</text>
            <line x1="96" x2="116" className="forces-series-friction" /><text x="123" y="4">{copy.frictionLegend}</text>
            <line x1="203" x2="223" className="forces-series-net" /><text x="230" y="4">{copy.netLegend}</text>
          </g>
          <PlotAxes x={graphX} y={forceGraphY} width={graphWidth} height={graphHeight} durationSeconds={durationSeconds} maxMagnitude={forcePlotMax} unit="N" locale={locale} />
          <line x1={releaseX} y1={forceGraphY} x2={releaseX} y2={forceGraphY + graphHeight} className="forces-release-line" />
          <path d={buildPlotPath(profile, durationSeconds, (item) => item.appliedForceN, graphX, forceGraphY, graphWidth, graphHeight, forcePlotMax)} className="forces-series forces-series-applied" />
          <path d={buildPlotPath(profile, durationSeconds, (item) => item.frictionForceN, graphX, forceGraphY, graphWidth, graphHeight, forcePlotMax)} className="forces-series forces-series-friction" />
          <path d={buildPlotPath(profile, durationSeconds, (item) => item.netForceN, graphX, forceGraphY, graphWidth, graphHeight, forcePlotMax)} className="forces-series forces-series-net" />

          <text x="692" y="430" className="forces-section-heading">{copy.velocityPlot}</text>
          <text x="1212" y="430" textAnchor="end" className="forces-release-label">{copy.release}: {formatNumber(parameters.forceDurationSeconds, locale, 1)} s</text>
          <PlotAxes x={graphX} y={velocityGraphY} width={graphWidth} height={graphHeight} durationSeconds={durationSeconds} maxMagnitude={velocityPlotMax} unit="m/s" locale={locale} />
          <line x1={releaseX} y1={velocityGraphY} x2={releaseX} y2={velocityGraphY + graphHeight} className="forces-release-line" />
          <path d={buildPlotPath(profile, durationSeconds, (item) => item.velocityMs, graphX, velocityGraphY, graphWidth, graphHeight, velocityPlotMax)} className="forces-series forces-series-velocity" />
          <circle
            cx={graphX + (Math.min(state?.timeSeconds ?? 0, durationSeconds) / durationSeconds) * graphWidth}
            cy={velocityGraphY + graphHeight / 2 - ((state?.velocityMs ?? 0) / velocityPlotMax) * (graphHeight / 2 - 8)}
            r="5"
            className="forces-live-dot"
          />
        </g>
      ) : null}

      <g transform="translate(52 674)">
        <text className="canvas-footnote">{copy.assumptions}</text>
        <text x="1160" textAnchor="end" className="canvas-footnote">SCIENCE STUDIO</text>
      </g>
    </svg>
  );
}

function ForcesMotionCanvas(props: ForcesCanvasContentProps & {aspectRatio: CanvasAspectRatio}) {
  const copy = forcesCopy[props.locale].canvas;
  return (
    <div className={`output-frame forces-output-frame ${props.aspectRatio === "16:9" ? "is-landscape" : "is-portrait"}`} aria-label={copy.ariaLabel}>
      {props.aspectRatio === "16:9"
        ? <ForcesMotionLandscapeCanvas {...props} />
        : <ForcesMotionPortraitCanvas {...props} />}
      {!props.state ? <div className="canvas-error">{copy.invalid}</div> : null}
    </div>
  );
}

export function ForcesAndMotionWorkbench() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [parameters, setParameters] = useState(forcesMotionDefaults);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [narrationTextOverrides, setNarrationTextOverrides] = useState<Record<Locale, ForcesTextOverrides>>({en: {}, "zh-CN": {}});
  const [narrationDurationOverrides, setNarrationDurationOverrides] = useState<ForcesDurationOverrides>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("9:16");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [panMode, setPanMode] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastFrame = useRef<number | null>(null);
  const workbenchRef = useRef<HTMLElement | null>(null);
  const stageAreaRef = useRef<HTMLDivElement | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);
  const commonCopy = workbenchCopy[locale];
  const copy = forcesCopy[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("science-studio-locale");
    if (storedLocale === "en" || storedLocale === "zh-CN") {
      setLocale(storedLocale);
      document.documentElement.lang = storedLocale;
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === workbenchRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const parsedParameters = useMemo(() => forcesMotionParametersSchema.safeParse(parameters), [parameters]);
  const profile = useMemo(
    () => parsedParameters.success ? createForcesMotionProfile(parsedParameters.data) : null,
    [parsedParameters],
  );
  const experimentDurationSeconds = profile
    ? Math.max(5, Number(((profile.stopTimeSeconds ?? parameters.forceDurationSeconds + 3) + 0.5).toFixed(6)))
    : 5;
  const narrationText = useMemo(() => {
    const text = structuredClone(copy.narration);
    if (profile) {
      text.setup.caption = locale === "en"
        ? `A ${formatNumber(parameters.massKg, locale, 1)} kg block receives a ${formatNumber(parameters.appliedForceN, locale, 1)} N signed push.`
        : `质量为 ${formatNumber(parameters.massKg, locale, 1)} kg 的滑块受到 ${formatNumber(parameters.appliedForceN, locale, 1)} N 的有向外力。`;
      text.threshold.caption = locale === "en"
        ? `Compare |F| with fₛ,max = ${formatNumber(profile.maximumStaticFrictionN, locale, 1)} N: the block ${profile.willMove ? "breaks away" : "remains held"}.`
        : `比较 |F| 与 fₛ,max = ${formatNumber(profile.maximumStaticFrictionN, locale, 1)} N：滑块${profile.willMove ? "开始运动" : "保持静止"}。`;
      text["net-force"].caption = locale === "en"
        ? profile.willMove
          ? `While pushed, the signed net force gives a = ${formatNumber(profile.drivenAccelerationMs2, locale, 2)} m/s².`
          : "Static friction adjusts to cancel the push, so the net force and acceleration are zero."
        : profile.willMove
          ? `外力作用时，有向合力产生 ${formatNumber(profile.drivenAccelerationMs2, locale, 2)} m/s² 的加速度。`
          : "静摩擦力自动匹配外力，因此合力与加速度均为零。";
      text.motion.caption = locale === "en"
        ? !profile.willMove
          ? "The block stays at rest because static friction is sufficient."
          : profile.stopTimeSeconds === null
            ? "After release, no kinetic friction acts and the block coasts at constant velocity."
            : `After release, kinetic friction stops the block at ${formatNumber(profile.stopTimeSeconds, locale, 2)} s.`
        : !profile.willMove
          ? "静摩擦力足以平衡外力，滑块保持静止。"
          : profile.stopTimeSeconds === null
            ? "撤去外力后没有动摩擦力，滑块保持匀速运动。"
            : `撤去外力后，动摩擦力使滑块在 ${formatNumber(profile.stopTimeSeconds, locale, 2)} s 时停止。`;
    }
    return text;
  }, [copy.narration, locale, parameters.appliedForceN, parameters.massKg, profile]);
  const narrationSteps = useMemo<NarrationStep[]>(() => forcesMotionTemplate.narration.map((definition) => {
    const id = definition.id as ForcesStepId;
    return {
      ...definition,
      title: narrationTextOverrides[locale][id]?.title ?? narrationText[id].title,
      caption: narrationTextOverrides[locale][id]?.caption ?? narrationText[id].caption,
      durationSeconds: narrationDurationOverrides[id] ?? definition.durationSeconds,
    };
  }), [locale, narrationDurationOverrides, narrationText, narrationTextOverrides]);
  const narrationDurationSeconds = useMemo(() => getNarrationDuration(narrationSteps), [narrationSteps]);
  const narrationFrame = useMemo(
    () => resolveNarrationFrame(narrationSteps, narrationTimeSeconds, experimentDurationSeconds),
    [experimentDurationSeconds, narrationSteps, narrationTimeSeconds],
  );
  const simulationTimeSeconds = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const state = useMemo(
    () => profile ? sampleForcesMotion(profile, simulationTimeSeconds) : null,
    [profile, simulationTimeSeconds],
  );
  const durationSeconds = mode === "narration" ? narrationDurationSeconds : experimentDurationSeconds;
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const issues = useMemo(() => inspectForcesMotion(parameters), [parameters]);
  const localizedIssues = useMemo(
    () => issues.map((issue) => localizeIssue(issue, locale, profile)),
    [issues, locale, profile],
  );

  useEffect(() => {
    if (!isPlaying || !state) {
      lastFrame.current = null;
      return;
    }
    let animationFrame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      const deltaSeconds = ((now - previous) / 1000) * speed;
      const updateTime = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
      updateTime((current) => {
        const next = current + deltaSeconds;
        if (next >= durationSeconds) {
          setIsPlaying(false);
          return durationSeconds;
        }
        return next;
      });
      animationFrame = requestAnimationFrame(tick);
    };
    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [durationSeconds, isPlaying, mode, speed, state]);

  const updateParameter = useCallback((key: ParameterKey, value: number) => {
    setParameters((current) => ({...current, [key]: value}));
    setTimeSeconds(0);
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, []);
  const reset = useCallback(() => {
    setTimeSeconds(0);
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, []);
  const step = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    const updateTime = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
    updateTime((current) => Math.min(Math.max(current + direction / FPS, 0), durationSeconds));
  }, [durationSeconds, mode]);
  const selectNarrationStep = useCallback((index: number) => {
    setIsPlaying(false);
    setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));
  }, [narrationSteps]);
  const updateNarrationText = useCallback((id: ForcesStepId, field: "title" | "caption", value: string) => {
    setNarrationTextOverrides((current) => ({
      ...current,
      [locale]: {...current[locale], [id]: {...current[locale][id], [field]: value}},
    }));
  }, [locale]);
  const updateNarrationDuration = useCallback((id: ForcesStepId, value: number) => {
    if (!Number.isFinite(value)) return;
    const duration = Math.min(Math.max(value, 1), 10);
    setNarrationDurationOverrides((current) => ({...current, [id]: duration}));
    const activeId = narrationFrame.step.id as ForcesStepId;
    if (id === activeId) {
      const activeIndex = narrationSteps.findIndex((item) => item.id === id);
      setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, activeIndex));
    }
    setIsPlaying(false);
  }, [narrationFrame.step.id, narrationSteps]);
  const restoreNarrationDefaults = useCallback(() => {
    setNarrationTextOverrides((current) => ({...current, [locale]: {}}));
    setNarrationDurationOverrides({});
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, [locale]);
  const toggleLocale = useCallback(() => {
    setLocale((current) => {
      const next = current === "en" ? "zh-CN" : "en";
      window.localStorage.setItem("science-studio-locale", next);
      document.documentElement.lang = next;
      return next;
    });
  }, []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {
    if (atZoom <= 1) return {x: 0, y: 0};
    const stage = stageAreaRef.current;
    const width = stage?.clientWidth ?? 900;
    const height = stage?.clientHeight ?? 600;
    const zoomOverflow = atZoom - 1;
    const limitX = width * Math.min(0.48, zoomOverflow * 0.35);
    const limitY = height * Math.min(0.48, zoomOverflow * 0.35);
    return {
      x: Math.min(limitX, Math.max(-limitX, nextPan.x)),
      y: Math.min(limitY, Math.max(-limitY, nextPan.y)),
    };
  }, []);
  const resetCanvasView = useCallback(() => {
    setZoom(1);
    setPan({x: 0, y: 0});
    setPanMode(false);
    setIsDraggingCanvas(false);
    panDragRef.current = null;
  }, []);
  const changeZoom = useCallback((delta: number) => {
    setZoom((current) => {
      const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2))));
      setPan((currentPan) => clampPan(currentPan, next));
      if (next <= 1) setPanMode(false);
      return next;
    });
  }, [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {
    setAspectRatio(next);
    resetCanvasView();
  }, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement === workbenchRef.current) {
      await document.exitFullscreen();
      return;
    }
    await workbenchRef.current?.requestFullscreen();
  }, []);

  return (
    <main className={`workbench-shell forces-motion-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
      <header className="topbar">
        <div className="project-identity">
          <Link className="back-to-library" href="/experiments" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"} title={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></Link>
          <span className="brand-mark"><FlaskConical size={17} /></span>
          <span className="brand-name">Science Studio</span>
          <span className="topbar-divider" />
          <span className="project-name">{copy.projectName}</span>
          <span className="save-state"><Check size={12} /> {commonCopy.localDraft}</span>
        </div>
        <nav className="mode-switch" aria-label={commonCopy.modeLabel}>
          <button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button>
          <button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button>
          <button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button>
        </nav>
        <div className="topbar-actions">
          <button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage} title={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button>
          <button className="icon-button" type="button" aria-label={commonCopy.actions.undo} title={commonCopy.actions.undo} disabled><Undo2 /></button>
          <button className="icon-button" type="button" aria-label={commonCopy.actions.redo} title={commonCopy.actions.redo} disabled><Redo2 /></button>
        </div>
      </header>

      <section className="workspace">
        <div className="stage-area forces-stage-area" ref={stageAreaRef}>
          <div className="stage-meta forces-stage-meta">
            <span>{commonCopy.stage.outputCanvas}</span>
            <div className="forces-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}>
              <div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>
                {(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => (
                  <button
                    className={aspectRatio === ratio ? "active" : ""}
                    type="button"
                    aria-pressed={aspectRatio === ratio}
                    title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape}
                    onClick={() => changeAspectRatio(ratio)}
                    key={ratio}
                  >{ratio}</button>
                ))}
              </div>
              <CanvasTextSizeControls locale={locale} />
              <button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut} title={copy.viewport.zoomOut}><ZoomOut /></button>
              <output className="canvas-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</output>
              <button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn} title={copy.viewport.zoomIn}><ZoomIn /></button>
              <button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move} title={copy.viewport.move}><Move /></button>
              <button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit} title={copy.viewport.fit}><Scan /></button>
              <button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen} title={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
            </div>
          </div>
          <div
            className={`forces-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`}
            style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}}
            tabIndex={0}
            aria-label={copy.viewport.canvasNavigation}
            aria-keyshortcuts="ArrowUp ArrowDown ArrowLeft ArrowRight"
            title={panMode && zoom > 1 ? copy.viewport.move : undefined}
            onWheel={(event) => {
              if (!event.ctrlKey && !event.metaKey) return;
              event.preventDefault();
              changeZoom(event.deltaY < 0 ? 0.25 : -0.25);
            }}
            onPointerDown={(event) => {
              if (!panMode || zoom <= 1 || event.button !== 0) return;
              event.preventDefault();
              event.currentTarget.setPointerCapture(event.pointerId);
              panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y};
              setIsDraggingCanvas(true);
            }}
            onPointerMove={(event) => {
              const drag = panDragRef.current;
              if (!drag || drag.pointerId !== event.pointerId) return;
              setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));
            }}
            onPointerUp={(event) => {
              if (panDragRef.current?.pointerId !== event.pointerId) return;
              if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
              panDragRef.current = null;
              setIsDraggingCanvas(false);
            }}
            onPointerCancel={() => {
              panDragRef.current = null;
              setIsDraggingCanvas(false);
            }}
            onKeyDown={(event) => {
              if (!panMode || zoom <= 1) return;
              const movement: Record<string, {x: number; y: number}> = {
                ArrowUp: {x: 0, y: 24},
                ArrowDown: {x: 0, y: -24},
                ArrowLeft: {x: 24, y: 0},
                ArrowRight: {x: -24, y: 0},
              };
              const delta = movement[event.key];
              if (!delta) return;
              event.preventDefault();
              setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));
            }}
          >
            <ForcesMotionCanvas
              parameters={parameters}
              profile={profile}
              state={state}
              durationSeconds={experimentDurationSeconds}
              locale={locale}
              aspectRatio={aspectRatio}
              narrationStep={mode === "narration" ? narrationFrame.step : undefined}
              narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined}
              narrationStepCount={mode === "narration" ? narrationSteps.length : undefined}
            />
          </div>
        </div>

        <aside className="parameter-panel">
          {mode === "experiment" ? (
            <>
              <div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters} title={commonCopy.actions.collapseParameters}><ChevronDown /></button></div>
              <div className="parameter-list">
                {parameterDefinitions.map((definition) => {
                  const errorIssue = !parsedParameters.success
                    ? parsedParameters.error.issues.find((issue) => issue.path[0] === definition.key)
                    : undefined;
                  const label = copy.parameters[definition.key];
                  return (
                    <div className="parameter-control" key={definition.key}>
                      <div className="parameter-row">
                        <label htmlFor={`forces-${definition.key}-number`}>{label}</label>
                        <div className="number-field"><input id={`forces-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateParameter(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(errorIssue)} /><span>{definition.unit}</span></div>
                      </div>
                      <input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateParameter(definition.key, event.currentTarget.valueAsNumber)} />
                      {errorIssue ? <p className="field-error">{locale === "en" ? `Enter a value from ${definition.min} to ${definition.max}.` : `请输入 ${definition.min} 到 ${definition.max} 之间的数值。`}</p> : null}
                    </div>
                  );
                })}
              </div>

              <section className="measurement-section">
                <div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div>
                <dl className="measurements forces-measurements">
                  <div className="forces-applied-measurement"><dt>{copy.measurements.applied}</dt><dd>{state ? formatNumber(state.appliedForceN, locale, 1) : "--"}<small>N</small></dd></div>
                  <div className="forces-friction-measurement"><dt>{copy.measurements.friction}</dt><dd>{state ? formatNumber(state.frictionForceN, locale, 1) : "--"}<small>N</small></dd></div>
                  <div className="forces-net-measurement"><dt>{copy.measurements.net}</dt><dd>{state ? formatNumber(state.netForceN, locale, 1) : "--"}<small>N</small></dd></div>
                  <div><dt>{copy.measurements.acceleration}</dt><dd>{state ? formatNumber(state.accelerationMs2, locale, 2) : "--"}<small>m/s²</small></dd></div>
                  <div><dt>{copy.measurements.velocity}</dt><dd>{state ? formatNumber(state.velocityMs, locale, 2) : "--"}<small>m/s</small></dd></div>
                  <div><dt>{copy.measurements.displacement}</dt><dd>{state ? formatNumber(state.displacementM, locale, 2) : "--"}<small>m</small></dd></div>
                </dl>
              </section>

              <section className="science-section">
                <div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>
                {localizedIssues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}
              </section>
            </>
          ) : (
            <>
              <div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div>
              <div className="narration-step-list" aria-label={commonCopy.narration.steps}>
                {narrationSteps.map((stepItem, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={stepItem.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{stepItem.title}</strong><small>{stepItem.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${stepItem.simulationMode}`}>{stepItem.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}
              </div>
              <section className="narration-editor">
                <label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as ForcesStepId, "title", event.currentTarget.value)} /></label>
                <label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as ForcesStepId, "caption", event.currentTarget.value)} /></label>
                <div className="narration-editor-row">
                  <label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as ForcesStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label>
                  <div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div>
                </div>
                <button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button>
              </section>
            </>
          )}
        </aside>
      </section>

      <footer className="playback-bar">
        <div className="playback-controls">
          <button className="icon-button" type="button" onClick={reset} aria-label={commonCopy.actions.reset} title={commonCopy.actions.reset}><RotateCcw /></button>
          <button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame} title={commonCopy.actions.previousFrame}><SkipBack /></button>
          <button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) {if (mode === "narration") setNarrationTimeSeconds(0); else setTimeSeconds(0);} setIsPlaying((current) => !current);}} disabled={!state} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play} title={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button>
          <button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame} title={commonCopy.actions.nextFrame}><SkipForward /></button>
        </div>
        <span className="timecode">{formatNumber(playbackTimeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>
        {mode === "narration" ? (
          <div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div>
        ) : (
          <input className="timeline" aria-label={locale === "en" ? "Experiment time" : "实验时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />
        )}
        <label className="speed-control"><span>{commonCopy.actions.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label>
      </footer>
    </main>
  );
}
