"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  createEnergyTrackTrajectory,
  energyTrackDefaults,
  energyTrackParametersSchema,
  energyTrackTemplate,
  inspectEnergyTrack,
  sampleEnergyTrack,
  type EnergyTrackParameters,
  type EnergyTrackState,
} from "@science-studio/templates/energy-track";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  FlaskConical,
  Info,
  Languages,
  ListRestart,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  SkipBack,
  SkipForward,
  Undo2,
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
type ParameterKey = keyof EnergyTrackParameters;
type EnergyStepId = "setup" | "stores" | "conservation" | "prediction" | "result";
type EnergyStepText = Record<EnergyStepId, {title: string; caption: string}>;
type EnergyTextOverrides = Partial<Record<EnergyStepId, Partial<{title: string; caption: string}>>>;
type EnergyDurationOverrides = Partial<Record<EnergyStepId, number>>;

interface EnergyCopy {
  projectName: string;
  parameters: Record<ParameterKey, string>;
  measurements: {
    title: string;
    model: string;
    speed: string;
    height: string;
    kinetic: string;
    potential: string;
    thermal: string;
    total: string;
  };
  canvas: {
    ariaLabel: string;
    description: string;
    title: string;
    subtitle: string;
    stateLabel: string;
    ready: string;
    descending: string;
    ascending: string;
    stalled: string;
    turning: string;
    startHeight: string;
    returnHeight: string;
    forceAnalysis: string;
    forceScaleNote: string;
    gravityGuide: string;
    normalGuide: string;
    frictionGuide: string;
    energyBudget: string;
    kinetic: string;
    potential: string;
    thermal: string;
    conservation: string;
    prediction: string;
    assumptions: string;
    invalid: string;
  };
  narration: EnergyStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    stoppedTitle: string;
    stoppedDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const energyCopy: Record<Locale, EnergyCopy> = {
  en: {
    projectName: "Energy Track",
    parameters: {
      massKg: "Cart mass",
      startHeightM: "Start height",
      frictionCoefficient: "Track friction",
      gravityMs2: "Gravity",
    },
    measurements: {
      title: "Live energy budget",
      model: "Circular track model",
      speed: "Speed",
      height: "Height",
      kinetic: "Kinetic energy",
      potential: "Potential energy",
      thermal: "Thermal energy",
      total: "Total energy",
    },
    canvas: {
      ariaLabel: "Energy track conservation experiment canvas",
      description: "A cart moves along a circular valley while potential, kinetic, and thermal energy are tracked.",
      title: "Energy Track",
      subtitle: "Follow every joule through the motion.",
      stateLabel: "MOTION",
      ready: "READY TO RELEASE",
      descending: "SPEEDING UP",
      ascending: "CLIMBING BACK",
      stalled: "STOPPED BY FRICTION",
      turning: "FIRST TURNING POINT",
      startHeight: "start",
      returnHeight: "return",
      forceAnalysis: "FORCE ANALYSIS",
      forceScaleNote: "vectors not to scale",
      gravityGuide: "vertical downward",
      normalGuide: "normal to track",
      frictionGuide: "opposes motion → Eₜₕ",
      energyBudget: "ENERGY BUDGET",
      kinetic: "Kinetic",
      potential: "Potential",
      thermal: "Thermal",
      conservation: "Etotal = Ek + Eg + Eth",
      prediction: "Predicted return height",
      assumptions: "Point mass · Fixed circular track · First turn only",
      invalid: "Fix the parameters to resume",
    },
    narration: {
      setup: {
        title: "Set the starting height",
        caption: "The cart begins at rest with energy stored by its height.",
      },
      stores: {
        title: "Name the energy stores",
        caption: "Potential, kinetic, and thermal energy share one fixed budget.",
      },
      conservation: {
        title: "Track every joule",
        caption: "The colored budget always adds to the same total energy.",
      },
      prediction: {
        title: "Predict the return height",
        caption: "Friction transfers mechanical energy into thermal energy.",
      },
      result: {
        title: "Observe the full run",
        caption: "The cart speeds up, passes the bottom, and reaches its first turning point.",
      },
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail: "Check the highlighted input before running the experiment.",
      stoppedTitle: "The cart stops before the bottom",
      stoppedDetail: "At this setting, friction dissipates the available mechanical energy before the lowest point.",
      assumptionTitle: "Constrained point-mass model",
      assumptionDetail: "Wheel rotation, air drag, and track deformation are ignored; playback ends at the first turning point.",
    },
  },
  "zh-CN": {
    projectName: "能量轨道",
    parameters: {
      massKg: "小车质量",
      startHeightM: "起始高度",
      frictionCoefficient: "轨道摩擦",
      gravityMs2: "重力加速度",
    },
    measurements: {
      title: "实时能量账本",
      model: "圆弧轨道模型",
      speed: "速度",
      height: "高度",
      kinetic: "动能",
      potential: "重力势能",
      thermal: "热能",
      total: "总能量",
    },
    canvas: {
      ariaLabel: "能量轨道守恒实验画布",
      description: "小车沿圆弧谷形轨道运动，同时展示重力势能、动能和热能。",
      title: "能量轨道",
      subtitle: "追踪运动过程中的每一焦耳能量",
      stateLabel: "运动状态",
      ready: "等待释放",
      descending: "加速下滑",
      ascending: "减速爬升",
      stalled: "因摩擦停止",
      turning: "第一次转折点",
      startHeight: "起始",
      returnHeight: "返回",
      forceAnalysis: "受力分析",
      forceScaleNote: "箭头长度不按比例",
      gravityGuide: "竖直向下",
      normalGuide: "垂直轨道",
      frictionGuide: "反向做功 → E热",
      energyBudget: "能量账本",
      kinetic: "动能",
      potential: "势能",
      thermal: "热能",
      conservation: "E总 = E动 + E势 + E热",
      prediction: "预测返回高度",
      assumptions: "质点小车 · 固定圆弧轨道 · 只播放至第一次转折",
      invalid: "修正参数后恢复实验",
    },
    narration: {
      setup: {
        title: "设置起始高度",
        caption: "小车从静止开始，高度储存了最初的重力势能。",
      },
      stores: {
        title: "识别能量形式",
        caption: "重力势能、动能和热能共同组成固定的总能量。",
      },
      conservation: {
        title: "追踪每一焦耳",
        caption: "彩色能量账本始终加总为相同的总能量。",
      },
      prediction: {
        title: "预测返回高度",
        caption: "摩擦将一部分机械能转化为热能。",
      },
      result: {
        title: "观察完整运动",
        caption: "小车加速经过最低点，再爬升至第一次转折点。",
      },
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      stoppedTitle: "小车无法到达最低点",
      stoppedDetail: "当前设置下，摩擦会在最低点前耗尽可用机械能。",
      assumptionTitle: "受约束质点模型",
      assumptionDetail: "忽略车轮转动、空气阻力和轨道形变；播放在第一次转折点结束。",
    },
  },
};

const parameterDefinitions = energyTrackTemplate.parameterDefinitions as Array<{
  key: ParameterKey;
  unit: string;
  min: number;
  max: number;
  step: number;
}>;

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
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

function localizeIssue(issue: ScienceIssue, locale: Locale) {
  if (locale === "zh-CN") return issue;
  const copy = energyCopy.en.issues;
  if (issue.id === "stops-before-bottom") {
    return {...issue, title: copy.stoppedTitle, detail: copy.stoppedDetail};
  }
  if (issue.id === "energy-track-assumptions") {
    return {...issue, title: copy.assumptionTitle, detail: copy.assumptionDetail};
  }
  return {...issue, title: copy.invalidTitle, detail: copy.invalidDetail};
}

function buildTrackPath(fromAngle: number, toAngle: number, steps = 64) {
  return Array.from({length: steps + 1}, (_, index) => {
    const angle = fromAngle + ((toAngle - fromAngle) * index) / steps;
    const x = 360 + 260 * Math.sin(angle);
    const y = 500 + 260 * Math.cos(angle);
    return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(" ");
}

function EnergyTrackCanvas({
  parameters,
  state,
  locale,
  narrationStep,
  narrationStepIndex,
  narrationStepCount,
}: {
  parameters: EnergyTrackParameters;
  state: EnergyTrackState | null;
  locale: Locale;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const copy = energyCopy[locale].canvas;
  const angle = state?.angleRadians ?? -Math.acos(1 - parameters.startHeightM / 12);
  const cartX = 360 + 260 * Math.sin(angle);
  const cartY = 500 + 260 * Math.cos(angle);
  const cartRotation = (-angle * 180) / Math.PI;
  const inwardUnit = {x: -Math.sin(angle), y: -Math.cos(angle)};
  const tangentUnit = {x: Math.cos(angle), y: -Math.sin(angle)};
  const forceOrigin = {
    x: cartX + inwardUnit.x * 30,
    y: cartY + inwardUnit.y * 30,
  };
  const weightForceN = parameters.massKg * parameters.gravityMs2;
  const weightLength = 84;
  const normalLength = state && weightForceN > 0
    ? Math.min(132, Math.max(56, (state.normalForceN / weightForceN) * weightLength))
    : 0;
  const frictionLength = state && state.frictionForceN > 0 && weightForceN > 0
    ? Math.min(88, Math.max(52, (state.frictionForceN / weightForceN) * weightLength))
    : 0;
  const normalEnd = {
    x: forceOrigin.x + inwardUnit.x * normalLength,
    y: forceOrigin.y + inwardUnit.y * normalLength,
  };
  const frictionVector = {
    x: -tangentUnit.x * frictionLength,
    y: -tangentUnit.y * frictionLength,
  };
  const frictionEnd = {
    x: forceOrigin.x + frictionVector.x,
    y: forceOrigin.y + frictionVector.y,
  };
  const normalPointsLeft = inwardUnit.x < -0.12;
  const startAngle = -Math.acos(1 - parameters.startHeightM / 12);
  const startX = 360 + 260 * Math.sin(startAngle);
  const startY = 500 + 260 * Math.cos(startAngle);
  const endAngle = state
    ? Math.acos(Math.max(-1, Math.min(1, 1 - state.turningHeightM / 12))) *
      (state.reachesBottom ? 1 : -1)
    : -startAngle;
  const endX = 360 + 260 * Math.sin(endAngle);
  const endY = 500 + 260 * Math.cos(endAngle);
  const trailPath = buildTrackPath(startAngle, angle, 36);
  const totalEnergy = Math.max(state?.initialEnergyJ ?? 1, 1e-9);
  const fractions = {
    potential: Math.max(0, (state?.potentialEnergyJ ?? 0) / totalEnergy),
    kinetic: Math.max(0, (state?.kineticEnergyJ ?? 0) / totalEnergy),
    thermal: Math.max(0, (state?.thermalEnergyJ ?? 0) / totalEnergy),
  };
  const budgetX = 72;
  const budgetWidth = 576;
  const potentialWidth = budgetWidth * fractions.potential;
  const kineticWidth = budgetWidth * fractions.kinetic;
  const thermalWidth = Math.max(0, budgetWidth - potentialWidth - kineticWidth);
  const focus = narrationStep?.highlights[0];
  const trackOpacity = focus === "energy" || focus === "equation" ? 0.38 : 1;
  const budgetOpacity = focus === "setup" ? 0.36 : 1;
  const equationOpacity = focus === "setup" || focus === "energy" ? 0.36 : 1;
  const captionLines = narrationStep ? wrapCaption(narrationStep.caption) : [];
  const phaseText = !state || state.motion === "ready"
    ? copy.ready
    : state.phase === "descending"
      ? copy.descending
      : state.phase === "ascending"
        ? copy.ascending
        : state.phase === "stalled"
          ? copy.stalled
          : copy.turning;

  return (
    <div className="output-frame energy-output-frame" aria-label={copy.ariaLabel}>
      <svg className="experiment-svg" viewBox="0 0 720 1280" role="img" aria-labelledby="energy-canvas-title energy-canvas-description">
        <title id="energy-canvas-title">{copy.title}</title>
        <desc id="energy-canvas-description">{copy.description}</desc>
        <defs>
          <pattern id="energy-minor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dfe1da" strokeWidth="1" />
          </pattern>
          <marker id="energy-arrow-weight" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#e85d42" />
          </marker>
          <marker id="energy-arrow-normal" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#2659a8" />
          </marker>
          <marker id="energy-arrow-friction" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#b7791f" />
          </marker>
          <clipPath id="energy-budget-clip"><rect x={budgetX} y="868" width={budgetWidth} height="34" rx="3" /></clipPath>
        </defs>

        <rect width="720" height="1280" fill="#f6f7f2" />
        <rect x="44" y="44" width="632" height="1192" fill="url(#energy-minor-grid)" stroke="#c9ccc3" strokeDasharray="8 8" />
        <text x="72" y="104" className="canvas-kicker">MECHANICS / 02</text>
        <text x="72" y="152" className={`canvas-title ${locale === "en" ? "canvas-title-en" : ""}`}>{copy.title}</text>
        <text x="72" y="188" className="canvas-subtitle">{copy.subtitle}</text>

        {narrationStep ? (
          <g className="narration-chapter" transform="translate(72 226)">
            <text className="narration-step-number">{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text>
            <text y="45" className="narration-step-title">{narrationStep.title}</text>
            <text y="79" className="narration-step-caption">
              {captionLines.map((line, index) => <tspan x="0" dy={index === 0 ? 0 : 25} key={`${line}-${index}`}>{line}</tspan>)}
            </text>
            <line x1="0" y1="126" x2="576" y2="126" stroke="#b9bdb3" />
          </g>
        ) : (
          <g transform="translate(72 238)">
            <text className="measure-label">{copy.stateLabel}</text>
            <text y="42" className="motion-value">{phaseText}</text>
            <line x1="0" y1="64" x2="576" y2="64" stroke="#b9bdb3" />
          </g>
        )}

        <g className="energy-track-visual" opacity={trackOpacity}>
          <g className="energy-force-guide" transform="translate(72 338)">
            <text className="energy-force-guide-title">{copy.forceAnalysis}</text>
            <text x="576" textAnchor="end" className="energy-force-guide-note">{copy.forceScaleNote}</text>
            <line x1="0" y1="15" x2="576" y2="15" className="energy-force-guide-rule" />
            <g transform="translate(0 36)">
              <text className="energy-force-guide-value energy-force-weight">mg = {formatNumber(weightForceN, locale, 1)} N</text>
              <text y="22" className="energy-force-guide-copy">{copy.gravityGuide}</text>
            </g>
            <g transform="translate(198 36)">
              <text className="energy-force-guide-value energy-force-normal">N = {state ? formatNumber(state.normalForceN, locale, 1) : "--"} N</text>
              <text y="22" className="energy-force-guide-copy">{copy.normalGuide}</text>
            </g>
            <g transform="translate(396 36)" opacity={parameters.frictionCoefficient > 0 ? 1 : 0.32}>
              <text className="energy-force-guide-value energy-force-friction">f<tspan baselineShift="sub" fontSize="12">k</tspan> = {state ? formatNumber(state.frictionForceN, locale, 1) : "--"} N</text>
              <text y="22" className="energy-force-guide-copy energy-force-friction-copy">{copy.frictionGuide}</text>
            </g>
          </g>

          <path d={`${buildTrackPath(-Math.PI / 2, Math.PI / 2)} L 620 790 L 100 790 Z`} fill="#e5e7e0" />
          <path d={buildTrackPath(-Math.PI / 2, Math.PI / 2)} fill="none" stroke="#1b1d1a" strokeWidth="8" strokeLinecap="round" />
          <path d={trailPath} fill="none" stroke="#147f75" strokeWidth="8" strokeLinecap="round" />

          <line x1={startX} x2={startX} y1={startY} y2="790" stroke="#2b63ad" strokeWidth="2" strokeDasharray="7 7" />
          <text x={startX - 10} y={startY - 20} textAnchor="end" className="track-height-label">{copy.startHeight} {formatNumber(parameters.startHeightM, locale, 1)} m</text>
          <line x1={endX} x2={endX} y1={endY} y2="790" stroke="#d8972f" strokeWidth="2" strokeDasharray="7 7" />
          <text x={endX + (state?.reachesBottom ? 10 : -10)} y={endY - 20} textAnchor={state?.reachesBottom ? "start" : "end"} className="track-return-label">{copy.returnHeight} {state ? formatNumber(state.turningHeightM, locale, 1) : "--"} m</text>

          <g className="energy-cart" transform={`translate(${cartX} ${cartY}) rotate(${cartRotation})`}>
            <rect x="-38" y="-49" width="76" height="38" rx="5" fill="#f6f7f2" stroke="#1b1d1a" strokeWidth="5" />
            <line x1="-27" y1="-40" x2="27" y2="-40" stroke="#ef6548" strokeWidth="7" />
            <circle cx="-23" cy="-8" r="8" fill="#1b1d1a" />
            <circle cx="23" cy="-8" r="8" fill="#1b1d1a" />
          </g>

          {state ? (
            <g className="energy-force-vectors">
              <line
                x1={forceOrigin.x}
                y1={forceOrigin.y}
                x2={forceOrigin.x}
                y2={forceOrigin.y + weightLength}
                className="energy-force-arrow energy-force-arrow-weight"
                markerEnd="url(#energy-arrow-weight)"
              />
              <text x={forceOrigin.x + 12} y={forceOrigin.y + weightLength + 4} className="energy-force-label energy-force-weight">mg</text>
              <line
                x1={forceOrigin.x}
                y1={forceOrigin.y}
                x2={normalEnd.x}
                y2={normalEnd.y}
                className="energy-force-arrow energy-force-arrow-normal"
                markerEnd="url(#energy-arrow-normal)"
              />
              <text
                x={normalEnd.x + (normalPointsLeft ? -10 : 10)}
                y={normalEnd.y - 7}
                textAnchor={normalPointsLeft ? "end" : "start"}
                className="energy-force-label energy-force-normal"
              >N</text>
              {frictionLength > 0 ? (
                <>
                  <line
                    x1={forceOrigin.x}
                    y1={forceOrigin.y}
                    x2={frictionEnd.x}
                    y2={frictionEnd.y}
                    className="energy-force-arrow energy-force-arrow-friction"
                    markerEnd="url(#energy-arrow-friction)"
                  />
                  <text
                    x={frictionEnd.x - 10}
                    y={frictionEnd.y + (frictionVector.y > 0 ? 20 : -8)}
                    textAnchor="end"
                    className="energy-force-label energy-force-friction"
                  >f<tspan baselineShift="sub" fontSize="14">k</tspan></text>
                </>
              ) : null}
              <circle cx={forceOrigin.x} cy={forceOrigin.y} r="5" className="energy-force-origin" />
            </g>
          ) : null}
        </g>

        <g className="energy-budget-visual" opacity={budgetOpacity}>
          <text x={budgetX} y="838" className="energy-budget-heading">{copy.energyBudget}</text>
          <text x={budgetX + budgetWidth} y="838" textAnchor="end" className="energy-total-readout">{state ? formatNumber(state.totalEnergyJ, locale, 1) : "--"} J total</text>
          <rect x={budgetX} y="868" width={budgetWidth} height="34" rx="3" fill="#e1e3dc" stroke="#b9bdb3" />
          <g clipPath="url(#energy-budget-clip)">
            <rect x={budgetX} y="868" width={potentialWidth} height="34" fill="#2b63ad" />
            <rect x={budgetX + potentialWidth} y="868" width={kineticWidth} height="34" fill="#ef6548" />
            <rect x={budgetX + potentialWidth + kineticWidth} y="868" width={thermalWidth} height="34" fill="#d8972f" />
          </g>
          <g className="energy-legend" transform="translate(72 936)">
            <rect width="12" height="12" rx="2" fill="#2b63ad" /><text x="20" y="11" className="energy-legend-label">{copy.potential}</text><text x="176" y="11" textAnchor="end" className="energy-legend-value">{state ? formatNumber(state.potentialEnergyJ, locale, 1) : "--"} J</text>
            <rect x="204" width="12" height="12" rx="2" fill="#ef6548" /><text x="224" y="11" className="energy-legend-label">{copy.kinetic}</text><text x="376" y="11" textAnchor="end" className="energy-legend-value">{state ? formatNumber(state.kineticEnergyJ, locale, 1) : "--"} J</text>
            <rect x="404" width="12" height="12" rx="2" fill="#d8972f" /><text x="424" y="11" className="energy-legend-label">{copy.thermal}</text><text x="576" y="11" textAnchor="end" className="energy-legend-value">{state ? formatNumber(state.thermalEnergyJ, locale, 1) : "--"} J</text>
          </g>
        </g>

        <g className="energy-equation-visual" transform="translate(72 990)" opacity={equationOpacity}>
          <text className="formula-label">{copy.conservation}</text>
          <text y="51" className="energy-conservation-equation">E<tspan baselineShift="sub" fontSize="17">total</tspan> = E<tspan baselineShift="sub" fontSize="17">k</tspan> + E<tspan baselineShift="sub" fontSize="17">g</tspan> + E<tspan baselineShift="sub" fontSize="17">th</tspan></text>
          <text y="101" className="energy-prediction-label">{copy.prediction}</text>
          <text y="139" className="energy-prediction-result">h<tspan baselineShift="sub" fontSize="15">return</tspan> = {state ? formatNumber(state.turningHeightM, locale, 2) : "--"} m</text>
        </g>

        <g transform="translate(72 1174)">
          <text className="canvas-footnote">{copy.assumptions}</text>
          <text x="576" textAnchor="end" className="canvas-footnote">SCIENCE STUDIO</text>
        </g>
      </svg>
      {!state ? <div className="canvas-error">{copy.invalid}</div> : null}
    </div>
  );
}

export function EnergyTrackWorkbench() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [parameters, setParameters] = useState(energyTrackDefaults);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [narrationTextOverrides, setNarrationTextOverrides] = useState<Record<Locale, EnergyTextOverrides>>({en: {}, "zh-CN": {}});
  const [narrationDurationOverrides, setNarrationDurationOverrides] = useState<EnergyDurationOverrides>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastFrame = useRef<number | null>(null);
  const commonCopy = workbenchCopy[locale];
  const copy = energyCopy[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("science-studio-locale");
    if (storedLocale === "en" || storedLocale === "zh-CN") {
      setLocale(storedLocale);
      document.documentElement.lang = storedLocale;
    }
  }, []);

  const parsedParameters = useMemo(() => energyTrackParametersSchema.safeParse(parameters), [parameters]);
  const trajectory = useMemo(
    () => parsedParameters.success ? createEnergyTrackTrajectory(parsedParameters.data) : null,
    [parsedParameters],
  );
  const experimentDurationSeconds = trajectory
    ? Math.max(4, Number((trajectory.endTimeSeconds + 0.5).toFixed(6)))
    : 4;
  const narrationText = useMemo(() => {
    const text = structuredClone(copy.narration);
    if (trajectory) {
      text.setup.caption = locale === "en"
        ? `The ${formatNumber(parameters.massKg, locale, 1)} kg cart starts ${formatNumber(parameters.startHeightM, locale, 1)} m above the bottom.`
        : `${formatNumber(parameters.massKg, locale, 1)} kg 的小车从最低点上方 ${formatNumber(parameters.startHeightM, locale, 1)} m 处静止释放。`;
      text.prediction.caption = locale === "en"
        ? parameters.frictionCoefficient === 0
          ? "With no friction, the cart returns to its original height."
          : `Friction lowers the first return height to ${formatNumber(trajectory.turningHeightM, locale, 2)} m.`
        : parameters.frictionCoefficient === 0
          ? "没有摩擦时，小车会返回原来的高度。"
          : `摩擦使第一次返回高度降低到 ${formatNumber(trajectory.turningHeightM, locale, 2)} m。`;
      text.result.caption = locale === "en"
        ? trajectory.reachesBottom
          ? `The cart reaches ${formatNumber(trajectory.bottomVelocityMs ?? 0, locale, 2)} m/s at the bottom, then climbs to ${formatNumber(trajectory.turningHeightM, locale, 2)} m.`
          : "Friction stops the cart before it reaches the lowest point."
        : trajectory.reachesBottom
          ? `小车在最低点达到 ${formatNumber(trajectory.bottomVelocityMs ?? 0, locale, 2)} m/s，随后爬升到 ${formatNumber(trajectory.turningHeightM, locale, 2)} m。`
          : "摩擦使小车在到达最低点前停止。";
    }
    return text;
  }, [copy.narration, locale, parameters, trajectory]);
  const narrationSteps = useMemo<NarrationStep[]>(() => energyTrackTemplate.narration.map((definition) => {
    const id = definition.id as EnergyStepId;
    return {
      ...definition,
      title: narrationTextOverrides[locale][id]?.title ?? narrationText[id].title,
      caption: narrationTextOverrides[locale][id]?.caption ?? narrationText[id].caption,
      durationSeconds: narrationDurationOverrides[id] ?? definition.durationSeconds,
    };
  }), [locale, narrationDurationOverrides, narrationText, narrationTextOverrides]);
  const narrationDurationSeconds = useMemo(() => getNarrationDuration(narrationSteps), [narrationSteps]);
  const narrationFrame = useMemo(
    () => resolveNarrationFrame(narrationSteps, narrationTimeSeconds, trajectory?.endTimeSeconds ?? null),
    [narrationSteps, narrationTimeSeconds, trajectory?.endTimeSeconds],
  );
  const simulationTimeSeconds = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const state = useMemo(
    () => trajectory ? sampleEnergyTrack(trajectory, simulationTimeSeconds) : null,
    [simulationTimeSeconds, trajectory],
  );
  const durationSeconds = mode === "narration" ? narrationDurationSeconds : experimentDurationSeconds;
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const issues = useMemo(() => inspectEnergyTrack(parameters), [parameters]);
  const localizedIssues = useMemo(() => issues.map((issue) => localizeIssue(issue, locale)), [issues, locale]);

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
  const updateNarrationText = useCallback((id: EnergyStepId, field: "title" | "caption", value: string) => {
    setNarrationTextOverrides((current) => ({
      ...current,
      [locale]: {...current[locale], [id]: {...current[locale][id], [field]: value}},
    }));
  }, [locale]);
  const updateNarrationDuration = useCallback((id: EnergyStepId, value: number) => {
    if (!Number.isFinite(value)) return;
    const duration = Math.min(Math.max(value, 1), 10);
    setNarrationDurationOverrides((current) => ({...current, [id]: duration}));
    const activeId = narrationFrame.step.id as EnergyStepId;
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
  return (
    <main className={`workbench-shell energy-workbench ${mode === "narration" ? "narration-mode" : ""}`}>
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
        <div className="stage-area">
          <div className="stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="stage-meta-actions"><span>{commonCopy.stage.format}</span><CanvasTextSizeControls locale={locale} /></div></div>
          <EnergyTrackCanvas parameters={parameters} state={state} locale={locale} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} />
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
                        <label htmlFor={`energy-${definition.key}-number`}>{label}</label>
                        <div className="number-field"><input id={`energy-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateParameter(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(errorIssue)} /><span>{definition.unit}</span></div>
                      </div>
                      <input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateParameter(definition.key, event.currentTarget.valueAsNumber)} />
                      {errorIssue ? <p className="field-error">{locale === "en" ? `Enter a value from ${definition.min} to ${definition.max}.` : `请输入 ${definition.min} 到 ${definition.max} 之间的数值。`}</p> : null}
                    </div>
                  );
                })}
              </div>

              <section className="measurement-section">
                <div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div>
                <dl className="measurements energy-measurements">
                  <div><dt>{copy.measurements.speed}</dt><dd>{state ? formatNumber(state.velocityMs, locale) : "--"}<small>m/s</small></dd></div>
                  <div><dt>{copy.measurements.height}</dt><dd>{state ? formatNumber(state.heightM, locale) : "--"}<small>m</small></dd></div>
                  <div className="energy-potential"><dt>{copy.measurements.potential}</dt><dd>{state ? formatNumber(state.potentialEnergyJ, locale, 1) : "--"}<small>J</small></dd></div>
                  <div className="energy-kinetic"><dt>{copy.measurements.kinetic}</dt><dd>{state ? formatNumber(state.kineticEnergyJ, locale, 1) : "--"}<small>J</small></dd></div>
                  <div className="energy-thermal"><dt>{copy.measurements.thermal}</dt><dd>{state ? formatNumber(state.thermalEnergyJ, locale, 1) : "--"}<small>J</small></dd></div>
                  <div className="energy-total"><dt>{copy.measurements.total}</dt><dd>{state ? formatNumber(state.totalEnergyJ, locale, 1) : "--"}<small>J</small></dd></div>
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
                <label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as EnergyStepId, "title", event.currentTarget.value)} /></label>
                <label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as EnergyStepId, "caption", event.currentTarget.value)} /></label>
                <div className="narration-editor-row">
                  <label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as EnergyStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label>
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
