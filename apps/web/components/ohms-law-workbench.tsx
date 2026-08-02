"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  inspectOhmsLaw,
  ohmsLawDefaults,
  ohmsLawParametersSchema,
  ohmsLawTemplate,
  solveOhmsLaw,
  type OhmsLawParameters,
  type OhmsLawState,
} from "@science-studio/templates/ohms-law";
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
  Power,
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
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {workbenchCopy, type Locale} from "../lib/i18n";
import {
  getNarrationDuration,
  getNarrationStepStart,
  resolveNarrationFrame,
} from "../lib/narration";
import {CanvasTextSizeControls} from "./canvas-text-size-controls";

const FPS = 30;
const EXPERIMENT_DURATION_SECONDS = 8;

type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "sourceVoltageV" | "resistanceOhm";
type OhmsStepId = "loop" | "switch" | "law" | "variable" | "power";
type OhmsStepText = Record<OhmsStepId, {title: string; caption: string}>;
type OhmsTextOverrides = Partial<Record<OhmsStepId, Partial<{title: string; caption: string}>>>;
type OhmsDurationOverrides = Partial<Record<OhmsStepId, number>>;

interface OhmsCopy {
  projectName: string;
  parameters: Record<NumericParameterKey, string> & {switchClosed: string};
  switchControl: {open: string; closed: string; openAction: string; closeAction: string};
  measurements: {
    title: string;
    model: string;
    source: string;
    resistance: string;
    switchState: string;
    current: string;
    resistorVoltage: string;
    switchVoltage: string;
    power: string;
  };
  canvas: {
    ariaLabel: string;
    description: string;
    title: string;
    subtitle: string;
    status: string;
    openCircuit: string;
    closedCircuit: string;
    source: string;
    switch: string;
    resistor: string;
    positiveTerminal: string;
    conventionalCurrent: string;
    currentNote: string;
    noCurrent: string;
    liveReadings: string;
    sourceVoltage: string;
    resistorVoltage: string;
    current: string;
    power: string;
    law: string;
    relationship: string;
    graphTitle: string;
    graphSubtitle: string;
    graphVoltage: string;
    graphCurrent: string;
    operatingPoint: string;
    openPoint: string;
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
  narration: OhmsStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    openTitle: string;
    openDetail: string;
    highPowerTitle: string;
    highPowerDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const ohmsCopy: Record<Locale, OhmsCopy> = {
  en: {
    projectName: "Ohm's Law Lab",
    parameters: {
      sourceVoltageV: "Source voltage",
      resistanceOhm: "Resistance",
      switchClosed: "Circuit switch",
    },
    switchControl: {
      open: "Open",
      closed: "Closed",
      openAction: "Open circuit switch",
      closeAction: "Close circuit switch",
    },
    measurements: {
      title: "Live circuit readings",
      model: "Ideal single loop",
      source: "Source voltage",
      resistance: "Resistance",
      switchState: "Switch",
      current: "Current",
      resistorVoltage: "Resistor drop",
      switchVoltage: "Switch voltage",
      power: "Resistor power",
    },
    canvas: {
      ariaLabel: "Ohm's law single-loop circuit experiment canvas",
      description: "One ideal voltage source, switch, and resistor form a rectangular circuit beside a synchronized voltage-current graph.",
      title: "Ohm's Law Lab",
      subtitle: "One loop. One resistor. A measurable relationship.",
      status: "CIRCUIT STATUS",
      openCircuit: "OPEN CIRCUIT",
      closedCircuit: "CLOSED · CURRENT FLOWS",
      source: "DC SOURCE",
      switch: "SWITCH",
      resistor: "RESISTOR",
      positiveTerminal: "positive terminal",
      conventionalCurrent: "CONVENTIONAL CURRENT",
      currentNote: "Illustrative direction only · marker speed is not electron drift speed",
      noCurrent: "No complete path · I = 0 A",
      liveReadings: "LIVE READINGS",
      sourceVoltage: "SOURCE",
      resistorVoltage: "RESISTOR DROP",
      current: "CURRENT",
      power: "POWER",
      law: "OHM'S LAW",
      relationship: "I = V / R",
      graphTitle: "V–I RELATIONSHIP",
      graphSubtitle: "Closed-loop prediction at the selected resistance",
      graphVoltage: "Voltage, V (V)",
      graphCurrent: "Current, I (A)",
      operatingPoint: "operating point",
      openPoint: "open switch",
      assumptions: "Ideal source · Ideal wires · One ohmic resistor",
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
      loop: {title: "Identify the loop", caption: "Find the source, switch, resistor, and the single conducting path."},
      switch: {title: "Close the switch", caption: "A complete path lets conventional current leave the positive terminal and return to the source."},
      law: {title: "Predict with Ohm's law", caption: "Divide the source voltage by the resistance to predict the circuit current."},
      variable: {title: "Change one variable", caption: "Keep resistance fixed while the V-I line shows how current responds to voltage."},
      power: {title: "Check the power", caption: "Compare voltage, current, and the power transferred to the resistor."},
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail: "Check the highlighted input before running the experiment.",
      openTitle: "The circuit is open",
      openDetail: "The broken path gives zero current and zero resistor power.",
      highPowerTitle: "High idealized power",
      highPowerDetail: "This setting is valid in the ideal model, but a real resistor would need an appropriate power rating.",
      assumptionTitle: "Ideal single-loop model",
      assumptionDetail: "The source and wires are ideal. Internal resistance, heating feedback, transients, and measurement error are ignored.",
    },
  },
  "zh-CN": {
    projectName: "欧姆定律实验室",
    parameters: {
      sourceVoltageV: "电源电压",
      resistanceOhm: "电阻",
      switchClosed: "电路开关",
    },
    switchControl: {
      open: "断开",
      closed: "闭合",
      openAction: "断开电路开关",
      closeAction: "闭合电路开关",
    },
    measurements: {
      title: "实时电路读数",
      model: "理想单回路",
      source: "电源电压",
      resistance: "电阻",
      switchState: "开关",
      current: "电流",
      resistorVoltage: "电阻压降",
      switchVoltage: "开关电压",
      power: "电阻功率",
    },
    canvas: {
      ariaLabel: "欧姆定律单回路实验画布",
      description: "一个理想电源、开关和电阻组成矩形回路，旁边同步显示电压—电流图像。",
      title: "欧姆定律实验室",
      subtitle: "一条回路、一个电阻、一组可测量关系",
      status: "电路状态",
      openCircuit: "回路断开",
      closedCircuit: "回路闭合 · 有电流",
      source: "直流电源",
      switch: "开关",
      resistor: "电阻",
      positiveTerminal: "正极",
      conventionalCurrent: "常规电流方向",
      currentNote: "箭头仅表示方向 · 动画速度不代表电子漂移速度",
      noCurrent: "没有完整路径 · I = 0 A",
      liveReadings: "实时读数",
      sourceVoltage: "电源",
      resistorVoltage: "电阻压降",
      current: "电流",
      power: "功率",
      law: "欧姆定律",
      relationship: "I = V / R",
      graphTitle: "电压–电流关系",
      graphSubtitle: "当前电阻下的闭合回路预测",
      graphVoltage: "电压 V（V）",
      graphCurrent: "电流 I（A）",
      operatingPoint: "当前工作点",
      openPoint: "开关断开",
      assumptions: "理想电源 · 理想导线 · 单个欧姆电阻",
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
      loop: {title: "识别完整回路", caption: "找到电源、开关、电阻，以及唯一的一条导电路径。"},
      switch: {title: "闭合开关", caption: "形成完整路径后，常规电流从正极流出并最终返回电源。"},
      law: {title: "用欧姆定律预测", caption: "用电源电压除以电阻，预测回路中的电流。"},
      variable: {title: "只改变一个变量", caption: "保持电阻不变，通过 V-I 直线观察电流怎样随电压变化。"},
      power: {title: "检查功率", caption: "比较电压、电流和电阻消耗的功率。"},
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      openTitle: "回路处于断开状态",
      openDetail: "导电路径不完整，因此电流与电阻功率都为零。",
      highPowerTitle: "理想模型功率较高",
      highPowerDetail: "这个参数组合在理想模型中有效，但真实电阻必须具有足够的额定功率。",
      assumptionTitle: "理想单回路模型",
      assumptionDetail: "电源与导线均视为理想元件；忽略内阻、温升反馈、瞬态过程和测量误差。",
    },
  },
};

const numericParameterDefinitions = (ohmsLawTemplate.parameterDefinitions as Array<{
  key: keyof OhmsLawParameters;
  unit: string;
  min?: number;
  max?: number;
  step?: number;
}>).filter((definition): definition is {
  key: NumericParameterKey;
  unit: string;
  min: number;
  max: number;
  step: number;
} => definition.key !== "switchClosed" && definition.min !== undefined && definition.max !== undefined && definition.step !== undefined);

function formatNumber(value: number, locale: Locale, digits = 2) {
  const normalizedValue = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(normalizedValue);
}

function formatCurrent(value: number, locale: Locale) {
  if (value > 0 && value < 0.01) return `${formatNumber(value * 1000, locale, 2)} mA`;
  return `${formatNumber(value, locale, 3)} A`;
}

function wrapCaption(caption: string, maxLength = 52) {
  const trimmed = caption.trim();
  if (trimmed.length <= maxLength) return [trimmed];
  if (!trimmed.includes(" ")) return [trimmed.slice(0, maxLength / 2), trimmed.slice(maxLength / 2, maxLength)];
  const words = trimmed.split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    const lineIndex = lines.length - 1;
    const candidate = `${lines[lineIndex]} ${word}`.trim();
    if (candidate.length <= maxLength || lines[lineIndex] === "") lines[lineIndex] = candidate;
    else if (lines.length === 1) lines.push(word);
    else lines[1] = `${lines[1]} ${word}`;
  }
  return lines.slice(0, 2);
}

function localizeIssue(issue: ScienceIssue, locale: Locale) {
  const copy = ohmsCopy[locale].issues;
  if (issue.id.includes("open")) return {...issue, title: copy.openTitle, detail: copy.openDetail};
  if (issue.id === "high-ideal-power") return {...issue, title: copy.highPowerTitle, detail: copy.highPowerDetail};
  if (issue.severity === "assumption") return {...issue, title: copy.assumptionTitle, detail: copy.assumptionDetail};
  return {...issue, title: copy.invalidTitle, detail: copy.invalidDetail};
}

function resistorPath(x: number, y1: number, y2: number) {
  const lead = 18;
  const segmentHeight = (y2 - y1 - lead * 2) / 8;
  const points = [`M ${x} ${y1}`, `L ${x} ${y1 + lead}`];
  for (let index = 0; index <= 8; index += 1) {
    const pointY = y1 + lead + segmentHeight * index;
    const pointX = index === 0 || index === 8 ? x : x + (index % 2 === 0 ? -15 : 15);
    points.push(`L ${pointX} ${pointY}`);
  }
  points.push(`L ${x} ${y2}`);
  return points.join(" ");
}

function CurrentMarker({x, y, rotation, active}: {x: number; y: number; rotation: number; active: boolean}) {
  return (
    <g className={`ohms-current-marker ${active ? "active" : ""}`} transform={`translate(${x} ${y}) rotate(${rotation})`} aria-hidden="true">
      <path d="M -8 -5 L 1 0 L -8 5" />
    </g>
  );
}

interface CircuitDiagramProps {
  x: number;
  y: number;
  width: number;
  height: number;
  state: OhmsLawState | null;
  locale: Locale;
  focus?: string;
  compact?: boolean;
}

function CircuitDiagram({x, y, width, height, state, locale, focus, compact = false}: CircuitDiagramProps) {
  const copy = ohmsCopy[locale].canvas;
  const left = x + 54;
  const right = x + width - 54;
  const top = y + 70;
  const bottom = y + height - 54;
  const switchLeft = x + width * 0.35;
  const switchRight = x + width * 0.58;
  const resistorTop = y + height * 0.34;
  const resistorBottom = y + height * 0.68;
  const batteryTop = y + height * 0.42;
  const batteryBottom = y + height * 0.58;
  const closed = state?.switchClosed ?? false;
  const markerPhase = state?.currentPhase ?? 0;
  const markerPoints = [
    {x: switchRight + (right - switchRight) * 0.5, y: top, rotation: 0},
    {x: right, y: resistorTop - 25, rotation: 90},
    {x: right, y: resistorBottom + 30, rotation: 90},
    {x: right - (right - left) * 0.28, y: bottom, rotation: 180},
    {x: right - (right - left) * 0.7, y: bottom, rotation: 180},
    {x: left, y: batteryBottom + 32, rotation: -90},
    {x: left, y: batteryTop - 32, rotation: -90},
  ];
  const activeIndex = Math.floor((((markerPhase % 1) + 1) % 1) * markerPoints.length);
  const sectionOpacity = (section: string) => {
    if (!focus || focus === section) return 1;
    if (section === "circuit" && ["loop", "current", "switch"].includes(focus)) return 1;
    if (section === "switch" && focus === "current") return 1;
    return 0.27;
  };

  return (
    <g className="ohms-circuit" opacity={sectionOpacity("circuit")}>
      <rect x={x} y={y} width={width} height={height} className="ohms-circuit-boundary" />
      <text x={x + 20} y={y + 30} className="ohms-section-heading">{copy.conventionalCurrent}</text>
      <text x={x + width - 20} y={y + 30} textAnchor="end" className={`ohms-circuit-status ${closed ? "closed" : "open"}`}>{closed ? copy.closedCircuit : copy.openCircuit}</text>

      <path d={`M ${left} ${top} H ${switchLeft}`} className="ohms-wire" />
      <path d={`M ${switchRight} ${top} H ${right} V ${resistorTop}`} className="ohms-wire" />
      <path d={resistorPath(right, resistorTop, resistorBottom)} className="ohms-resistor" />
      <path d={`M ${right} ${resistorBottom} V ${bottom} H ${left} V ${batteryBottom}`} className="ohms-wire" />
      <path d={`M ${left} ${batteryTop} V ${top}`} className="ohms-wire" />

      <g className="ohms-switch" opacity={sectionOpacity("switch")}>
        <circle cx={switchLeft} cy={top} r="6" />
        <circle cx={switchRight} cy={top} r="6" />
        <line
          x1={switchLeft + 5}
          y1={top - 2}
          x2={switchRight - 5}
          y2={closed ? top - 2 : top - Math.min(42, height * 0.13)}
          className={closed ? "closed" : "open"}
        />
        <text x={(switchLeft + switchRight) / 2} y={top - (closed ? 19 : 52)} textAnchor="middle" className="ohms-component-label">{copy.switch}</text>
      </g>

      <g className="ohms-battery">
        <line x1={left - 34} y1={batteryTop} x2={left + 34} y2={batteryTop} className="ohms-battery-positive" />
        <line x1={left - 19} y1={batteryBottom} x2={left + 19} y2={batteryBottom} className="ohms-battery-negative" />
        <text x={left + 47} y={batteryTop + 6} className="ohms-polarity positive">+</text>
        <text x={left + 47} y={batteryBottom + 6} className="ohms-polarity">−</text>
        <text x={compact ? left + 50 : left - 4} y={(batteryTop + batteryBottom) / 2 - 8} textAnchor={compact ? "start" : "end"} className="ohms-component-label">{copy.source}</text>
        <text x={compact ? left + 50 : left - 4} y={(batteryTop + batteryBottom) / 2 + 17} textAnchor={compact ? "start" : "end"} className="ohms-component-value">{state ? `${formatNumber(state.sourceVoltageV, locale, 1)} V` : "--"}</text>
        {!compact ? <text x={left + 47} y={batteryTop - 12} className="ohms-component-note">{copy.positiveTerminal}</text> : null}
      </g>

      <g className="ohms-resistor-label" opacity={sectionOpacity("law")}>
        <text x={right - 30} y={(resistorTop + resistorBottom) / 2 - 7} textAnchor="end" className="ohms-component-label">{copy.resistor}</text>
        <text x={right - 30} y={(resistorTop + resistorBottom) / 2 + 19} textAnchor="end" className="ohms-component-value">{state ? `${formatNumber(state.resistanceOhm, locale, 1)} Ω` : "--"}</text>
      </g>

      {closed ? markerPoints.map((marker, index) => (
        <CurrentMarker {...marker} active={index === activeIndex || index === (activeIndex + markerPoints.length - 1) % markerPoints.length} key={`${marker.x}-${marker.y}`} />
      )) : (
        <text x={x + width / 2} y={bottom - 24} textAnchor="middle" className="ohms-no-current">{copy.noCurrent}</text>
      )}

      <text x={x + width / 2} y={y + height - 16} textAnchor="middle" className="ohms-current-note">{copy.currentNote}</text>
    </g>
  );
}

function Meter({x, y, width, label, value, accent}: {x: number; y: number; width: number; label: string; value: string; accent: "blue" | "teal" | "copper" | "amber"}) {
  return (
    <g className={`ohms-meter ${accent}`} transform={`translate(${x} ${y})`}>
      <rect width={width} height="78" />
      <text x="16" y="25" className="ohms-meter-label">{label}</text>
      <text x="16" y="58" className="ohms-meter-value">{value}</text>
    </g>
  );
}

interface VIPlotProps {
  x: number;
  y: number;
  width: number;
  height: number;
  samples: Array<{sourceVoltageV: number; currentA: number}>;
  state: OhmsLawState | null;
  locale: Locale;
  focus?: string;
}

function VIPlot({x, y, width, height, samples, state, locale, focus}: VIPlotProps) {
  const copy = ohmsCopy[locale].canvas;
  const plotX = x + 62;
  const plotY = y + 80;
  const plotWidth = width - 86;
  const plotHeight = height - 138;
  const maxVoltage = Math.max(24, ...samples.map((sample) => sample.sourceVoltageV));
  const maxCurrent = Math.max(0.25, ...samples.map((sample) => sample.currentA)) * 1.08;
  const linePath = samples.map((sample, index) => {
    const pointX = plotX + (sample.sourceVoltageV / maxVoltage) * plotWidth;
    const pointY = plotY + plotHeight - (sample.currentA / maxCurrent) * plotHeight;
    return `${index === 0 ? "M" : "L"} ${pointX.toFixed(2)} ${pointY.toFixed(2)}`;
  }).join(" ");
  const dotX = plotX + ((state?.sourceVoltageV ?? 0) / maxVoltage) * plotWidth;
  const dotY = plotY + plotHeight - ((state?.currentA ?? 0) / maxCurrent) * plotHeight;
  const opacity = !focus || focus === "graph" || focus === "variable" ? 1 : 0.27;

  return (
    <g className="ohms-graph" opacity={opacity}>
      <rect x={x} y={y} width={width} height={height} className="ohms-graph-boundary" />
      <text x={x + 20} y={y + 31} className="ohms-section-heading">{copy.graphTitle}</text>
      <text x={x + width - 20} y={y + 33} textAnchor="end" className="ohms-graph-formula">I = V / R</text>
      <text x={x + 20} y={y + 54} className="ohms-section-note">{copy.graphSubtitle}</text>
      {[0, 0.25, 0.5, 0.75, 1].map((fraction) => (
        <g key={fraction}>
          <line x1={plotX} y1={plotY + plotHeight * fraction} x2={plotX + plotWidth} y2={plotY + plotHeight * fraction} className="ohms-graph-grid" />
          <line x1={plotX + plotWidth * fraction} y1={plotY} x2={plotX + plotWidth * fraction} y2={plotY + plotHeight} className="ohms-graph-grid" />
        </g>
      ))}
      <line x1={plotX} y1={plotY} x2={plotX} y2={plotY + plotHeight} className="ohms-graph-axis" />
      <line x1={plotX} y1={plotY + plotHeight} x2={plotX + plotWidth} y2={plotY + plotHeight} className="ohms-graph-axis" />
      <text x={plotX - 12} y={plotY + 5} textAnchor="end" className="ohms-axis-value">{formatNumber(maxCurrent, locale, 2)}</text>
      <text x={plotX - 12} y={plotY + plotHeight + 5} textAnchor="end" className="ohms-axis-value">0</text>
      <text x={plotX} y={plotY + plotHeight + 22} className="ohms-axis-value">0</text>
      <text x={plotX + plotWidth} y={plotY + plotHeight + 22} textAnchor="end" className="ohms-axis-value">{formatNumber(maxVoltage, locale, 0)}</text>
      <text x={plotX - 13} y={plotY - 11} textAnchor="start" className="ohms-axis-title">I (A)</text>
      <text x={plotX + plotWidth} y={plotY + plotHeight + 42} textAnchor="end" className="ohms-axis-title">V (V)</text>
      <path d={linePath} className={`ohms-vi-line ${state?.switchClosed ? "" : "muted"}`} />
      <line x1={dotX} y1={dotY} x2={dotX} y2={plotY + plotHeight} className="ohms-point-guide" />
      <line x1={plotX} y1={dotY} x2={dotX} y2={dotY} className="ohms-point-guide" />
      <circle cx={dotX} cy={dotY} r="7" className={`ohms-operating-dot ${state?.switchClosed ? "closed" : "open"}`} />
      <text x={Math.min(dotX + 13, plotX + plotWidth - 4)} y={dotY - 13} textAnchor={dotX > plotX + plotWidth * 0.72 ? "end" : "start"} className="ohms-operating-label">
        {state?.switchClosed ? copy.operatingPoint : copy.openPoint}
      </text>
    </g>
  );
}

interface OhmsCanvasContentProps {
  state: OhmsLawState | null;
  graphSamples: Array<{sourceVoltageV: number; currentA: number}>;
  locale: Locale;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}

function NarrationChapter({step, index, count, x, y, landscape = false}: {step?: NarrationStep; index?: number; count?: number; x: number; y: number; landscape?: boolean}) {
  if (!step) return null;
  const captionLines = wrapCaption(step.caption, landscape ? 64 : 52);
  return (
    <g className={`narration-chapter ${landscape ? "ohms-landscape-narration" : ""}`} transform={`translate(${x} ${y})`}>
      <text className="narration-step-number">{String((index ?? 0) + 1).padStart(2, "0")} / {String(count ?? 0).padStart(2, "0")}</text>
      <text y="42" className="narration-step-title">{step.title}</text>
      <text y="73" className="narration-step-caption">
        {captionLines.map((line, lineIndex) => <tspan x="0" dy={lineIndex === 0 ? 0 : 22} key={line}>{line}</tspan>)}
      </text>
    </g>
  );
}

function OhmsLawPortraitCanvas(props: OhmsCanvasContentProps) {
  const {state, graphSamples, locale, narrationStep, narrationStepIndex, narrationStepCount} = props;
  const copy = ohmsCopy[locale].canvas;
  const focus = narrationStep?.highlights[0];
  const circuitY = narrationStep ? 334 : 232;
  const circuitHeight = narrationStep ? 386 : 490;
  const meterY = narrationStep ? 752 : 757;
  const graphY = narrationStep ? 860 : 866;

  return (
    <svg className="experiment-svg" viewBox="0 0 720 1280" role="img" aria-labelledby="ohms-portrait-title ohms-portrait-description">
      <title id="ohms-portrait-title">{copy.title}</title>
      <desc id="ohms-portrait-description">{copy.description}</desc>
      <defs>
        <pattern id="ohms-portrait-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dfe1da" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="720" height="1280" fill="#f6f7f2" />
      <rect x="44" y="44" width="632" height="1192" fill="url(#ohms-portrait-grid)" stroke="#c9ccc3" strokeDasharray="8 8" />
      <text x="72" y="104" className="canvas-kicker">ELECTRICITY / 04</text>
      <text x="72" y="152" className={`canvas-title ${locale === "en" ? "canvas-title-en" : ""}`}>{copy.title}</text>
      <text x="72" y="188" className="canvas-subtitle">{copy.subtitle}</text>
      <text x="648" y="104" textAnchor="end" className={`ohms-status-pill ${state?.switchClosed ? "closed" : "open"}`}>{state?.switchClosed ? copy.closedCircuit : copy.openCircuit}</text>
      <NarrationChapter step={narrationStep} index={narrationStepIndex} count={narrationStepCount} x={72} y={216} />

      <CircuitDiagram x={72} y={circuitY} width={576} height={circuitHeight} state={state} locale={locale} focus={focus} />

      <g opacity={!focus || focus === "law" || focus === "power" ? 1 : 0.27}>
        <text x="72" y={meterY - 18} className="ohms-section-heading">{copy.liveReadings}</text>
        <text x="648" y={meterY - 18} textAnchor="end" className="ohms-meter-formula">{copy.law} · {copy.relationship}</text>
        <Meter x={72} y={meterY} width={132} label={copy.sourceVoltage} value={state ? `${formatNumber(state.sourceVoltageV, locale, 1)} V` : "--"} accent="blue" />
        <Meter x={220} y={meterY} width={132} label={copy.resistorVoltage} value={state ? `${formatNumber(state.resistorVoltageV, locale, 1)} V` : "--"} accent="copper" />
        <Meter x={368} y={meterY} width={132} label={copy.current} value={state ? formatCurrent(state.currentA, locale) : "--"} accent="teal" />
        <Meter x={516} y={meterY} width={132} label={copy.power} value={state ? `${formatNumber(state.powerW, locale, 2)} W` : "--"} accent="amber" />
      </g>

      <VIPlot x={72} y={graphY} width={576} height={274} samples={graphSamples} state={state} locale={locale} focus={focus} />
      <text x="72" y="1210" className="canvas-footnote">{copy.assumptions}</text>
      <text x="648" y="1210" textAnchor="end" className="canvas-footnote">SCIENCE STUDIO</text>
    </svg>
  );
}

function OhmsLawLandscapeCanvas(props: OhmsCanvasContentProps) {
  const {state, graphSamples, locale, narrationStep, narrationStepIndex, narrationStepCount} = props;
  const copy = ohmsCopy[locale].canvas;
  const focus = narrationStep?.highlights[0];

  return (
    <svg className="experiment-svg" viewBox="0 0 1280 720" role="img" aria-labelledby="ohms-landscape-title ohms-landscape-description">
      <title id="ohms-landscape-title">{copy.title}</title>
      <desc id="ohms-landscape-description">{copy.description}</desc>
      <defs>
        <pattern id="ohms-landscape-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dfe1da" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="1280" height="720" fill="#f6f7f2" />
      <rect x="30" y="30" width="1220" height="660" fill="url(#ohms-landscape-grid)" stroke="#c9ccc3" strokeDasharray="8 8" />
      <text x="52" y="76" className="canvas-kicker">ELECTRICITY / 04</text>
      <text x="52" y="116" className={`canvas-title ohms-landscape-title ${locale === "en" ? "canvas-title-en" : ""}`}>{copy.title}</text>
      <text x="52" y="145" className="canvas-subtitle">{copy.subtitle}</text>
      <text x="1228" y="76" textAnchor="end" className={`ohms-status-pill ${state?.switchClosed ? "closed" : "open"}`}>{state?.switchClosed ? copy.closedCircuit : copy.openCircuit}</text>
      <NarrationChapter step={narrationStep} index={narrationStepIndex} count={narrationStepCount} x={390} y={86} landscape />

      <CircuitDiagram x={52} y={174} width={590} height={390} state={state} locale={locale} focus={focus} compact />
      <VIPlot x={670} y={174} width={558} height={390} samples={graphSamples} state={state} locale={locale} focus={focus} />

      <g opacity={!focus || focus === "law" || focus === "power" ? 1 : 0.27}>
        <Meter x={52} y={582} width={180} label={copy.sourceVoltage} value={state ? `${formatNumber(state.sourceVoltageV, locale, 1)} V` : "--"} accent="blue" />
        <Meter x={246} y={582} width={180} label={copy.resistorVoltage} value={state ? `${formatNumber(state.resistorVoltageV, locale, 1)} V` : "--"} accent="copper" />
        <Meter x={440} y={582} width={180} label={copy.current} value={state ? formatCurrent(state.currentA, locale) : "--"} accent="teal" />
        <Meter x={670} y={582} width={180} label={copy.power} value={state ? `${formatNumber(state.powerW, locale, 2)} W` : "--"} accent="amber" />
        <g className="ohms-equation-readout" transform="translate(874 582)">
          <rect width="354" height="78" />
          <text x="17" y="25" className="ohms-meter-label">{copy.law}</text>
          <text x="17" y="58" className="ohms-equation-text">{copy.relationship}</text>
          <text x="337" y="58" textAnchor="end" className="ohms-equation-result">I = {state ? formatCurrent(state.currentA, locale) : "--"}</text>
        </g>
      </g>

      <text x="52" y="680" className="canvas-footnote">{copy.assumptions}</text>
      <text x="1228" y="680" textAnchor="end" className="canvas-footnote">SCIENCE STUDIO</text>
    </svg>
  );
}

function OhmsLawCanvas(props: OhmsCanvasContentProps & {aspectRatio: CanvasAspectRatio}) {
  const copy = ohmsCopy[props.locale].canvas;
  return (
    <div className={`output-frame ohms-output-frame ${props.aspectRatio === "16:9" ? "is-landscape" : "is-portrait"}`} aria-label={copy.ariaLabel}>
      {props.aspectRatio === "16:9" ? <OhmsLawLandscapeCanvas {...props} /> : <OhmsLawPortraitCanvas {...props} />}
      {!props.state ? <div className="canvas-error">{copy.invalid}</div> : null}
    </div>
  );
}

export function OhmsLawWorkbench() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [parameters, setParameters] = useState(ohmsLawDefaults);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [narrationTextOverrides, setNarrationTextOverrides] = useState<Record<Locale, OhmsTextOverrides>>({en: {}, "zh-CN": {}});
  const [narrationDurationOverrides, setNarrationDurationOverrides] = useState<OhmsDurationOverrides>({});
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
  const copy = ohmsCopy[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("science-studio-locale");
    if (storedLocale === "en" || storedLocale === "zh-CN") {
      setLocale(storedLocale);
      document.documentElement.lang = storedLocale;
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const parsedParameters = useMemo(() => ohmsLawParametersSchema.safeParse(parameters), [parameters]);
  const narrationText = useMemo(() => {
    const text = structuredClone(copy.narration);
    if (parsedParameters.success) {
      const snapshot = solveOhmsLaw(parsedParameters.data, 0);
      text.law.caption = locale === "en"
        ? `${formatNumber(snapshot.sourceVoltageV, locale, 1)} V across ${formatNumber(snapshot.resistanceOhm, locale, 1)} Ω predicts ${formatCurrent(snapshot.currentA, locale)}.`
        : `${formatNumber(snapshot.sourceVoltageV, locale, 1)} V 除以 ${formatNumber(snapshot.resistanceOhm, locale, 1)} Ω，预测电流为 ${formatCurrent(snapshot.currentA, locale)}。`;
      text.switch.caption = locale === "en"
        ? snapshot.switchClosed
          ? "The closed switch completes one path; conventional current runs clockwise from the positive terminal."
          : "The open switch breaks the only path, so the current is zero."
        : snapshot.switchClosed
          ? "开关闭合后形成唯一通路；常规电流从正极出发，沿顺时针方向流动。"
          : "开关断开了唯一通路，因此电流为零。";
      text.power.caption = locale === "en"
        ? `The resistor receives ${formatNumber(snapshot.powerW, locale, 2)} W in this ideal steady-DC model.`
        : `在理想稳恒直流模型中，电阻功率为 ${formatNumber(snapshot.powerW, locale, 2)} W。`;
    }
    return text;
  }, [copy.narration, locale, parsedParameters]);
  const narrationSteps = useMemo<NarrationStep[]>(() => ohmsLawTemplate.narration.map((definition) => {
    const id = definition.id as OhmsStepId;
    return {
      ...definition,
      title: narrationTextOverrides[locale][id]?.title ?? narrationText[id].title,
      caption: narrationTextOverrides[locale][id]?.caption ?? narrationText[id].caption,
      durationSeconds: narrationDurationOverrides[id] ?? definition.durationSeconds,
    };
  }), [locale, narrationDurationOverrides, narrationText, narrationTextOverrides]);
  const narrationDurationSeconds = useMemo(() => getNarrationDuration(narrationSteps), [narrationSteps]);
  const narrationFrame = useMemo(
    () => resolveNarrationFrame(narrationSteps, narrationTimeSeconds, EXPERIMENT_DURATION_SECONDS),
    [narrationSteps, narrationTimeSeconds],
  );
  const simulationTimeSeconds = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const state = useMemo(
    () => parsedParameters.success ? solveOhmsLaw(parsedParameters.data, simulationTimeSeconds) : null,
    [parsedParameters, simulationTimeSeconds],
  );
  const graphSamples = useMemo(() => {
    if (!parsedParameters.success) return [];
    const samples = Array.from({length: 24}, (_, index) => {
      const sourceVoltageV = 1 + (23 * index) / 23;
      const sample = solveOhmsLaw({...parsedParameters.data, sourceVoltageV, switchClosed: true}, 0);
      return {sourceVoltageV: sample.sourceVoltageV, currentA: sample.currentA};
    });
    return [{sourceVoltageV: 0, currentA: 0}, ...samples];
  }, [parsedParameters]);
  const durationSeconds = mode === "narration" ? narrationDurationSeconds : EXPERIMENT_DURATION_SECONDS;
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const issues = useMemo(() => inspectOhmsLaw(parameters), [parameters]);
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

  const updateNumericParameter = useCallback((key: NumericParameterKey, value: number) => {
    setParameters((current) => ({...current, [key]: value}));
    setTimeSeconds(0);
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, []);
  const toggleSwitch = useCallback(() => {
    setParameters((current) => ({...current, switchClosed: !current.switchClosed}));
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
  const updateNarrationText = useCallback((id: OhmsStepId, field: "title" | "caption", value: string) => {
    setNarrationTextOverrides((current) => ({
      ...current,
      [locale]: {...current[locale], [id]: {...current[locale][id], [field]: value}},
    }));
  }, [locale]);
  const updateNarrationDuration = useCallback((id: OhmsStepId, value: number) => {
    if (!Number.isFinite(value)) return;
    const duration = Math.min(Math.max(value, 1), 10);
    setNarrationDurationOverrides((current) => ({...current, [id]: duration}));
    const activeIndex = narrationSteps.findIndex((item) => item.id === id);
    if (activeIndex >= 0) setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, activeIndex));
    setIsPlaying(false);
  }, [narrationSteps]);
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
    const overflow = atZoom - 1;
    const limitX = width * Math.min(0.48, overflow * 0.35);
    const limitY = height * Math.min(0.48, overflow * 0.35);
    return {x: Math.min(limitX, Math.max(-limitX, nextPan.x)), y: Math.min(limitY, Math.max(-limitY, nextPan.y))};
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
    if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen();
    else await workbenchRef.current?.requestFullscreen();
  }, []);

  return (
    <main className={`workbench-shell ohms-law-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
      <header className="topbar">
        <div className="project-identity">
          <ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"} title={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink>
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
        <div className="stage-area ohms-stage-area" ref={stageAreaRef}>
          <div className="stage-meta ohms-stage-meta">
            <span>{commonCopy.stage.outputCanvas}</span>
            <div className="ohms-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}>
              <div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>
                {(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => (
                  <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>
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
            className={`ohms-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`}
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
            onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}}
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
            <OhmsLawCanvas
              state={state}
              graphSamples={graphSamples}
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
                {numericParameterDefinitions.map((definition) => {
                  const errorIssue = !parsedParameters.success ? parsedParameters.error.issues.find((issue) => issue.path[0] === definition.key) : undefined;
                  const label = copy.parameters[definition.key];
                  return (
                    <div className="parameter-control" key={definition.key}>
                      <div className="parameter-row">
                        <label htmlFor={`ohms-${definition.key}-number`}>{label}</label>
                        <div className="number-field"><input id={`ohms-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumericParameter(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(errorIssue)} /><span>{definition.unit}</span></div>
                      </div>
                      <input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumericParameter(definition.key, event.currentTarget.valueAsNumber)} />
                      {errorIssue ? <p className="field-error">{locale === "en" ? `Enter a value from ${definition.min} to ${definition.max}.` : `请输入 ${definition.min} 到 ${definition.max} 之间的数值。`}</p> : null}
                    </div>
                  );
                })}
                <div className="parameter-control ohms-switch-parameter">
                  <span className="ohms-switch-label">{copy.parameters.switchClosed}</span>
                  <button
                    className={`ohms-switch-control ${parameters.switchClosed ? "closed" : "open"}`}
                    type="button"
                    role="switch"
                    aria-checked={parameters.switchClosed}
                    aria-label={parameters.switchClosed ? copy.switchControl.openAction : copy.switchControl.closeAction}
                    onClick={toggleSwitch}
                  >
                    <span className="ohms-switch-icon"><Power size={15} /></span>
                    <span>{parameters.switchClosed ? copy.switchControl.closed : copy.switchControl.open}</span>
                    <span className="ohms-switch-track" aria-hidden="true"><span /></span>
                  </button>
                </div>
              </div>

              <section className="measurement-section">
                <div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div>
                <dl className="measurements ohms-measurements">
                  <div className="ohms-voltage-measurement"><dt>{copy.measurements.source}</dt><dd>{state ? formatNumber(state.sourceVoltageV, locale, 1) : "--"}<small>V</small></dd></div>
                  <div><dt>{copy.measurements.resistance}</dt><dd>{state ? formatNumber(state.resistanceOhm, locale, 1) : "--"}<small>Ω</small></dd></div>
                  <div className="ohms-switch-measurement"><dt>{copy.measurements.switchState}</dt><dd>{state ? (state.switchClosed ? copy.switchControl.closed : copy.switchControl.open) : "--"}</dd></div>
                  <div className="ohms-current-measurement"><dt>{copy.measurements.current}</dt><dd>{state ? formatNumber(state.currentA, locale, 3) : "--"}<small>A</small></dd></div>
                  <div><dt>{copy.measurements.resistorVoltage}</dt><dd>{state ? formatNumber(state.resistorVoltageV, locale, 1) : "--"}<small>V</small></dd></div>
                  <div><dt>{copy.measurements.switchVoltage}</dt><dd>{state ? formatNumber(state.switchVoltageV, locale, 1) : "--"}<small>V</small></dd></div>
                  <div className="ohms-power-measurement"><dt>{copy.measurements.power}</dt><dd>{state ? formatNumber(state.powerW, locale, 2) : "--"}<small>W</small></dd></div>
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
                <label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as OhmsStepId, "title", event.currentTarget.value)} /></label>
                <label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as OhmsStepId, "caption", event.currentTarget.value)} /></label>
                <div className="narration-editor-row">
                  <label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as OhmsStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label>
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
