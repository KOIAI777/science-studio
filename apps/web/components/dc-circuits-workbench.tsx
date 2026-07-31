"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  dcCircuitsDefaults,
  dcCircuitsParametersSchema,
  dcCircuitsTemplate,
  inspectDCCircuits,
  solveDCCircuits,
  type DCCircuitsParameters,
  type DCCircuitsState,
  type DCCircuitsTopology,
} from "@science-studio/templates/dc-circuits";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
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
  Power,
  RotateCcw,
  Scan,
  SkipBack,
  SkipForward,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {workbenchCopy, type Locale} from "../lib/i18n";
import {getNarrationDuration, getNarrationStepStart, resolveNarrationFrame} from "../lib/narration";

const FPS = 30;
const EXPERIMENT_DURATION_SECONDS = 8;

type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "sourceVoltageV" | "resistance1Ohm" | "resistance2Ohm";
type MeterTarget = "source" | "r1" | "r2";
type DcStepId = "topology" | "current-path" | "equivalent-resistance" | "ohms-law" | "branch-readings" | "compare";
type DcStepText = Record<DcStepId, {title: string; caption: string}>;
type DcTextOverrides = Partial<Record<DcStepId, Partial<{title: string; caption: string}>>>;
type DcDurationOverrides = Partial<Record<DcStepId, number>>;

interface DcCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {
    topology: string;
    circuitSwitch: string;
    conventionalCurrent: string;
    meterTarget: string;
  };
  topology: Record<DCCircuitsTopology, string>;
  switchControl: {open: string; closed: string; openAction: string; closeAction: string};
  visibility: {show: string; hide: string};
  meterTargets: Record<MeterTarget, string>;
  measurements: {
    title: string;
    model: string;
    equivalentResistance: string;
    totalCurrent: string;
    branch1Current: string;
    branch2Current: string;
    resistor1Voltage: string;
    resistor2Voltage: string;
    totalPower: string;
    switchState: string;
  };
  canvas: {
    ariaLabel: string;
    description: string;
    title: string;
    subtitle: string;
    circuitStatus: string;
    openCircuit: string;
    closedCircuit: string;
    source: string;
    switch: string;
    selectedMeter: string;
    voltage: string;
    current: string;
    networkLaw: string;
    topologyCompare: string;
    singleFormula: string;
    seriesFormula: string;
    parallelFormula: string;
    currentNote: string;
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
  narration: DcStepText;
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

const dcCopy: Record<Locale, DcCopy> = {
  en: {
    projectName: "DC Circuits: Series & Parallel",
    packName: "Middle School Pack",
    parameters: {
      topology: "Circuit topology",
      sourceVoltageV: "Source voltage",
      resistance1Ohm: "Resistance R1",
      resistance2Ohm: "Resistance R2",
      circuitSwitch: "Circuit switch",
      conventionalCurrent: "Current direction",
      meterTarget: "Measurement point",
    },
    topology: {single: "Single", series: "Series", parallel: "Parallel"},
    switchControl: {open: "Open", closed: "Closed", openAction: "Open circuit switch", closeAction: "Close circuit switch"},
    visibility: {show: "Shown", hide: "Hidden"},
    meterTargets: {source: "Source", r1: "R1", r2: "R2"},
    measurements: {
      title: "Circuit measurements",
      model: "Ideal steady DC",
      equivalentResistance: "Equivalent resistance",
      totalCurrent: "Total current",
      branch1Current: "Current through R1",
      branch2Current: "Current through R2",
      resistor1Voltage: "Voltage across R1",
      resistor2Voltage: "Voltage across R2",
      totalPower: "Total power",
      switchState: "Switch",
    },
    canvas: {
      ariaLabel: "Series and parallel DC circuit comparison canvas",
      description: "An ideal source, switch, and two resistors form a selected single, series, or parallel topology with synchronized current and voltage measurements.",
      title: "DC Circuits",
      subtitle: "Compare current paths, voltage drops, and equivalent resistance.",
      circuitStatus: "CIRCUIT STATUS",
      openCircuit: "OPEN · NO CURRENT",
      closedCircuit: "CLOSED · STEADY DC",
      source: "DC SOURCE",
      switch: "SWITCH",
      selectedMeter: "SELECTED MEASUREMENT",
      voltage: "VOLTAGE",
      current: "CURRENT",
      networkLaw: "OHM'S LAW · NETWORK",
      topologyCompare: "TOPOLOGY COMPARISON",
      singleFormula: "R_eq = R1",
      seriesFormula: "R_eq = R1 + R2",
      parallelFormula: "1 / R_eq = 1 / R1 + 1 / R2",
      currentNote: "Conventional-current direction · marker speed is illustrative",
      assumptions: "Ideal source · Ideal wires · Ohmic resistors · Steady DC",
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
      topology: {title: "Identify the topology", caption: "Locate the source, switch, and the available current paths."},
      "current-path": {title: "Predict the current paths", caption: "Trace conventional current before using any numerical result."},
      "equivalent-resistance": {title: "Find equivalent resistance", caption: "Replace the resistor network with one equivalent resistance."},
      "ohms-law": {title: "Apply Ohm's law", caption: "Use source voltage and equivalent resistance to predict total current."},
      "branch-readings": {title: "Measure each component", caption: "Compare current and voltage at the source, R1, and R2."},
      compare: {title: "Compare the topologies", caption: "State what remains equal and what divides in series and parallel circuits."},
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail: "Check the highlighted input before running the experiment.",
      openTitle: "The circuit is open",
      openDetail: "The broken path gives zero current and zero resistor power.",
      highPowerTitle: "High idealized power",
      highPowerDetail: "A real circuit would require resistors and a source rated for this power.",
      assumptionTitle: "Ideal steady-DC model",
      assumptionDetail: "Internal resistance, wire resistance, transients, heating feedback, and measurement error are ignored.",
    },
  },
  "zh-CN": {
    projectName: "直流串并联电路",
    packName: "初中物理实验包",
    parameters: {
      topology: "电路拓扑",
      sourceVoltageV: "电源电压",
      resistance1Ohm: "电阻 R1",
      resistance2Ohm: "电阻 R2",
      circuitSwitch: "电路开关",
      conventionalCurrent: "常规电流方向",
      meterTarget: "测量位置",
    },
    topology: {single: "单电阻", series: "串联", parallel: "并联"},
    switchControl: {open: "断开", closed: "闭合", openAction: "断开电路开关", closeAction: "闭合电路开关"},
    visibility: {show: "显示", hide: "隐藏"},
    meterTargets: {source: "电源", r1: "R1", r2: "R2"},
    measurements: {
      title: "电路测量",
      model: "理想稳恒直流",
      equivalentResistance: "等效电阻",
      totalCurrent: "总电流",
      branch1Current: "R1 电流",
      branch2Current: "R2 电流",
      resistor1Voltage: "R1 电压",
      resistor2Voltage: "R2 电压",
      totalPower: "总功率",
      switchState: "开关",
    },
    canvas: {
      ariaLabel: "直流串联与并联电路对比画布",
      description: "理想电源、开关和两个电阻组成单电阻、串联或并联拓扑，并同步显示电流与电压测量。",
      title: "直流电路",
      subtitle: "比较电流路径、电压降与等效电阻",
      circuitStatus: "电路状态",
      openCircuit: "断开 · 无电流",
      closedCircuit: "闭合 · 稳恒直流",
      source: "直流电源",
      switch: "开关",
      selectedMeter: "当前测量位置",
      voltage: "电压",
      current: "电流",
      networkLaw: "欧姆定律 · 电阻网络",
      topologyCompare: "拓扑对比",
      singleFormula: "R_eq = R1",
      seriesFormula: "R_eq = R1 + R2",
      parallelFormula: "1 / R_eq = 1 / R1 + 1 / R2",
      currentNote: "常规电流方向 · 标记速度只用于示意",
      assumptions: "理想电源 · 理想导线 · 欧姆电阻 · 稳恒直流",
      invalid: "修正参数后恢复实验",
    },
    viewport: {
      ratio: "画布比例",
      portrait: "竖版 9:16",
      landscape: "横版 16:9",
      zoomOut: "缩小",
      zoomIn: "放大",
      move: "移动画布",
      fit: "适应画布",
      enterFullscreen: "进入全屏",
      exitFullscreen: "退出全屏",
      canvasNavigation: "画布导航",
    },
    narration: {
      topology: {title: "识别电路拓扑", caption: "找到电源、开关和所有可能的电流路径。"},
      "current-path": {title: "预测电流路径", caption: "先沿常规电流方向追踪路径，再查看数值。"},
      "equivalent-resistance": {title: "计算等效电阻", caption: "用一个等效电阻替代当前电阻网络。"},
      "ohms-law": {title: "应用欧姆定律", caption: "用电源电压和等效电阻预测总电流。"},
      "branch-readings": {title: "测量各元件", caption: "比较电源、R1 和 R2 处的电流与电压。"},
      compare: {title: "比较串联与并联", caption: "总结两种连接中哪些量相同，哪些量发生分配。"},
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      openTitle: "电路处于断开状态",
      openDetail: "回路不完整，因此电流和电阻功率均为零。",
      highPowerTitle: "理想功率较高",
      highPowerDetail: "真实电路需要选择额定功率合适的电阻和电源。",
      assumptionTitle: "理想稳恒直流模型",
      assumptionDetail: "忽略电源内阻、导线电阻、瞬态、热反馈和测量误差。",
    },
  },
};

const numericParameterDefinitions = dcCircuitsTemplate.parameterDefinitions.filter(
  (definition): definition is typeof definition & {key: NumericParameterKey} =>
    ["sourceVoltageV", "resistance1Ohm", "resistance2Ohm"].includes(definition.key),
);

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale, {maximumFractionDigits: digits, minimumFractionDigits: digits}).format(value);
}

function formatCurrent(value: number, locale: Locale) {
  if (value > 0 && value < 0.1) return `${formatNumber(value * 1000, locale, 1)} mA`;
  return `${formatNumber(value, locale, 3)} A`;
}

function localizeIssue(issue: ScienceIssue, locale: Locale) {
  const copy = dcCopy[locale].issues;
  if (issue.severity === "blocking") return {...issue, title: copy.invalidTitle, detail: copy.invalidDetail};
  if (issue.id === "open-circuit" || issue.id === "open-switch") return {...issue, title: copy.openTitle, detail: copy.openDetail};
  if (issue.id === "high-ideal-power" || issue.id === "high-power") return {...issue, title: copy.highPowerTitle, detail: copy.highPowerDetail};
  return {...issue, title: copy.assumptionTitle, detail: copy.assumptionDetail};
}

function resistorPath(x: number, top: number, bottom: number) {
  const usable = bottom - top;
  const lead = usable * 0.2;
  const start = top + lead;
  const end = bottom - lead;
  const segments = 8;
  const step = (end - start) / segments;
  let path = `M ${x} ${top} V ${start}`;
  for (let index = 0; index <= segments; index += 1) {
    const nextX = x + (index % 2 === 0 ? -13 : 13);
    path += ` L ${nextX} ${start + index * step}`;
  }
  return `${path} L ${x} ${end} V ${bottom}`;
}

function SelectedMeter({x, y, width, state, target, locale}: {x: number; y: number; width: number; state: DCCircuitsState; target: MeterTarget; locale: Locale}) {
  const copy = dcCopy[locale];
  const voltage = target === "source" ? state.parameters.sourceVoltageV : target === "r1" ? state.resistorVoltage1V : state.resistorVoltage2V;
  const current = target === "source" ? state.totalCurrentA : target === "r1" ? state.branchCurrent1A : state.branchCurrent2A;
  return (
    <g className="dc-meter" transform={`translate(${x} ${y})`}>
      <rect width={width} height="112" rx="4" />
      <text x="18" y="27" className="dc-section-label">{copy.canvas.selectedMeter} · {copy.meterTargets[target]}</text>
      <text x="18" y="58" className="dc-meter-label">{copy.canvas.voltage}</text>
      <text x="18" y="91" className="dc-meter-value voltage">{formatNumber(voltage, locale, 2)} V</text>
      <text x={width * 0.54} y="58" className="dc-meter-label">{copy.canvas.current}</text>
      <text x={width * 0.54} y="91" className="dc-meter-value current">{formatCurrent(current, locale)}</text>
    </g>
  );
}

function CircuitSchematic({x, y, width, height, state, topology, meterTarget, showCurrent, locale}: {x: number; y: number; width: number; height: number; state: DCCircuitsState; topology: DCCircuitsTopology; meterTarget: MeterTarget; showCurrent: boolean; locale: Locale}) {
  const copy = dcCopy[locale];
  const left = x + 58;
  const right = x + width - 44;
  const top = y + 82;
  const bottom = y + height - 62;
  const switchLeft = left + width * 0.22;
  const switchRight = switchLeft + 82;
  const activeCurrent = state.circuitClosed && showCurrent;
  const currentOffset = -state.currentMarkerPhase * 48;
  const currentClass = activeCurrent ? "dc-current-path active" : "dc-current-path";
  const resistorColor = meterTarget === "r1" ? " selected" : "";
  const resistor2Color = meterTarget === "r2" ? " selected" : "";
  const sourceSelected = meterTarget === "source" ? " selected" : "";
  const status = state.circuitClosed ? copy.canvas.closedCircuit : copy.canvas.openCircuit;

  const resistor1X = topology === "parallel" ? x + width * 0.56 : right;
  const resistor2X = topology === "parallel" ? x + width * 0.81 : right;
  const splitY = top + (bottom - top) / 2;

  return (
    <g className="dc-schematic">
      <rect x={x} y={y} width={width} height={height} rx="4" className="dc-schematic-boundary" />
      <text x={x + 20} y={y + 30} className="dc-section-label">{copy.topology[topology].toUpperCase()} {locale === "en" ? "CIRCUIT" : "电路"}</text>
      <text x={x + width - 20} y={y + 30} textAnchor="end" className={`dc-status ${state.circuitClosed ? "closed" : "open"}`}>{status}</text>

      <path d={`M ${left} ${top} H ${switchLeft}`} className="dc-wire" />
      <path d={`M ${switchRight} ${top} H ${right}`} className="dc-wire" />
      <path d={`M ${left} ${bottom} H ${right}`} className="dc-wire" />
      <path d={`M ${left} ${top} V ${y + height * 0.43}`} className="dc-wire" />
      <path d={`M ${left} ${y + height * 0.57} V ${bottom}`} className="dc-wire" />

      <g className={`dc-source${sourceSelected}`}>
        <line x1={left - 31} y1={y + height * 0.43} x2={left + 31} y2={y + height * 0.43} className="dc-battery-positive" />
        <line x1={left - 19} y1={y + height * 0.57} x2={left + 19} y2={y + height * 0.57} className="dc-battery-negative" />
        <text x={left + 43} y={y + height * 0.43 + 6} className="dc-polarity positive">+</text>
        <text x={left + 43} y={y + height * 0.57 + 6} className="dc-polarity">−</text>
        <text x={left + 56} y={y + height / 2 - 8} className="dc-component-label">{copy.canvas.source}</text>
        <text x={left + 56} y={y + height / 2 + 19} className="dc-component-value">{formatNumber(state.parameters.sourceVoltageV, locale, 1)} V</text>
      </g>

      <g className="dc-switch">
        <circle cx={switchLeft} cy={top} r="6" />
        <circle cx={switchRight} cy={top} r="6" />
        <line x1={switchLeft} y1={top} x2={switchRight} y2={state.circuitClosed ? top : top - 42} className={state.circuitClosed ? "" : "open"} />
        <text x={(switchLeft + switchRight) / 2} y={top - (state.circuitClosed ? 20 : 56)} textAnchor="middle" className="dc-component-label">{copy.canvas.switch}</text>
      </g>

      {topology === "single" ? (
        <>
          <path d={resistorPath(right, top, bottom)} className={`dc-resistor${resistorColor}`} />
          <text x={right - 28} y={splitY - 8} textAnchor="end" className="dc-component-label">R1</text>
          <text x={right - 28} y={splitY + 20} textAnchor="end" className="dc-component-value">{formatNumber(state.parameters.resistance1Ohm, locale, 0)} Ω</text>
        </>
      ) : topology === "series" ? (
        <>
          <path d={resistorPath(right, top, splitY - 8)} className={`dc-resistor${resistorColor}`} />
          <path d={resistorPath(right, splitY + 8, bottom)} className={`dc-resistor${resistor2Color}`} />
          <text x={right - 30} y={top + (splitY - top) / 2 - 5} textAnchor="end" className="dc-component-label">R1 · {formatNumber(state.parameters.resistance1Ohm, locale, 0)} Ω</text>
          <text x={right - 30} y={splitY + (bottom - splitY) / 2 + 5} textAnchor="end" className="dc-component-label">R2 · {formatNumber(state.parameters.resistance2Ohm, locale, 0)} Ω</text>
        </>
      ) : (
        <>
          <path d={`M ${right} ${top} V ${bottom}`} className="dc-wire" />
          <path d={resistorPath(resistor1X, top, bottom)} className={`dc-resistor${resistorColor}`} />
          <path d={resistorPath(resistor2X, top, bottom)} className={`dc-resistor${resistor2Color}`} />
          <circle cx={resistor1X} cy={top} r="5" className="dc-node" />
          <circle cx={resistor1X} cy={bottom} r="5" className="dc-node" />
          <circle cx={resistor2X} cy={top} r="5" className="dc-node" />
          <circle cx={resistor2X} cy={bottom} r="5" className="dc-node" />
          <text x={resistor1X - 24} y={splitY - 8} textAnchor="end" className="dc-component-label">R1</text>
          <text x={resistor1X - 24} y={splitY + 20} textAnchor="end" className="dc-component-value">{formatNumber(state.parameters.resistance1Ohm, locale, 0)} Ω</text>
          <text x={resistor2X - 24} y={splitY - 8} textAnchor="end" className="dc-component-label">R2</text>
          <text x={resistor2X - 24} y={splitY + 20} textAnchor="end" className="dc-component-value">{formatNumber(state.parameters.resistance2Ohm, locale, 0)} Ω</text>
        </>
      )}

      <path d={`M ${left + 18} ${top} H ${switchLeft - 12}`} className={currentClass} style={{strokeDashoffset: currentOffset}} markerEnd={activeCurrent ? "url(#dc-current-arrow)" : undefined} />
      {topology === "parallel" ? (
        <>
          <path d={`M ${resistor1X} ${top + 34} V ${bottom - 34}`} className={currentClass} style={{strokeDashoffset: currentOffset}} markerEnd={activeCurrent ? "url(#dc-current-arrow)" : undefined} />
          <path d={`M ${resistor2X} ${top + 34} V ${bottom - 34}`} className={currentClass} style={{strokeDashoffset: currentOffset}} markerEnd={activeCurrent ? "url(#dc-current-arrow)" : undefined} />
          {activeCurrent ? <>
            <text x={resistor1X + 20} y={splitY} className="dc-current-label">I1 {formatCurrent(state.branchCurrent1A, locale)}</text>
            <text x={resistor2X + 20} y={splitY} className="dc-current-label">I2 {formatCurrent(state.branchCurrent2A, locale)}</text>
          </> : null}
        </>
      ) : activeCurrent ? <text x={left + width * 0.38} y={top - 19} className="dc-current-label">I {formatCurrent(state.totalCurrentA, locale)}</text> : null}

      {!state.circuitClosed ? <text x={x + width / 2} y={bottom - 20} textAnchor="middle" className="dc-open-note">I = 0 A · P = 0 W</text> : null}
      <text x={x + width / 2} y={y + height - 17} textAnchor="middle" className="dc-footnote">{copy.canvas.currentNote}</text>
    </g>
  );
}

function TopologyComparison({x, y, width, state, topology, locale}: {x: number; y: number; width: number; state: DCCircuitsState; topology: DCCircuitsTopology; locale: Locale}) {
  const copy = dcCopy[locale];
  const rows: Array<{key: DCCircuitsTopology; formula: string}> = [
    {key: "single", formula: copy.canvas.singleFormula},
    {key: "series", formula: copy.canvas.seriesFormula},
    {key: "parallel", formula: copy.canvas.parallelFormula},
  ];
  return (
    <g className="dc-comparison" transform={`translate(${x} ${y})`}>
      <rect width={width} height="184" rx="4" />
      <text x="18" y="28" className="dc-section-label">{copy.canvas.topologyCompare}</text>
      {rows.map((row, index) => {
        const active = row.key === topology;
        const rowY = 45 + index * 42;
        return <g className={active ? "active" : ""} transform={`translate(12 ${rowY})`} key={row.key}>
          <rect width={width - 24} height="35" rx="3" />
          <text x="10" y="23" className="dc-compare-name">{copy.topology[row.key]}</text>
          <text x={width - 38} y="23" textAnchor="end" className="dc-compare-formula">{row.formula}</text>
        </g>;
      })}
      <text x={width - 18} y="172" textAnchor="end" className="dc-equivalent-result">R_eq = {formatNumber(state.equivalentResistanceOhm, locale, 2)} Ω</text>
    </g>
  );
}

interface DcCanvasProps {
  state: DCCircuitsState | null;
  parameters: DCCircuitsParameters;
  locale: Locale;
  aspectRatio: CanvasAspectRatio;
  meterTarget: MeterTarget;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}

function NarrationHeader({x, y, step, index, count}: {x: number; y: number; step?: NarrationStep; index?: number; count?: number}) {
  if (!step || index === undefined || count === undefined) return null;
  return <g className="dc-narration" transform={`translate(${x} ${y})`}>
    <text className="narration-step-number">{String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}</text>
    <text y="34" className="narration-step-title">{step.title}</text>
    <text y="62" className="narration-step-caption">{step.caption}</text>
  </g>;
}

function DcLandscapeCanvas(props: DcCanvasProps) {
  const copy = dcCopy[props.locale];
  return <svg className="experiment-svg" viewBox="0 0 1280 720" role="img" aria-labelledby="dc-landscape-title dc-landscape-description">
    <title id="dc-landscape-title">{copy.canvas.title}</title>
    <desc id="dc-landscape-description">{copy.canvas.description}</desc>
    <defs>
      <pattern id="dc-landscape-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" className="dc-grid-line" /></pattern>
      <marker id="dc-current-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" className="dc-arrow-head" /></marker>
    </defs>
    <rect width="1280" height="720" className="dc-canvas-bg" />
    <rect x="30" y="30" width="1220" height="660" fill="url(#dc-landscape-grid)" className="dc-canvas-border" />
    <text x="56" y="78" className="canvas-kicker">ELECTRICITY / 05</text>
    <text x="56" y="122" className="canvas-title dc-landscape-title">{copy.canvas.title}</text>
    <text x="56" y="151" className="canvas-subtitle dc-landscape-subtitle">{copy.canvas.subtitle}</text>
    {props.state ? <>
      <CircuitSchematic x={52} y={178} width={760} height={460} state={props.state} topology={props.parameters.topology} meterTarget={props.meterTarget} showCurrent={props.parameters.showConventionalCurrent} locale={props.locale} />
      <SelectedMeter x={842} y={179} width={372} state={props.state} target={props.meterTarget} locale={props.locale} />
      <TopologyComparison x={842} y={311} width={372} state={props.state} topology={props.parameters.topology} locale={props.locale} />
      <g className="dc-equation-card" transform="translate(842 515)"><rect width="372" height="123" rx="4" /><text x="18" y="28" className="dc-section-label">{copy.canvas.networkLaw}</text><text x="18" y="68" className="dc-equation">I_total = V_source / R_eq</text><text x="354" y="101" textAnchor="end" className="dc-equation-result">{formatCurrent(props.state.totalCurrentA, props.locale)}</text></g>
    </> : <text x="640" y="380" textAnchor="middle" className="dc-invalid">{copy.canvas.invalid}</text>}
    <NarrationHeader x={842} y={76} step={props.narrationStep} index={props.narrationStepIndex} count={props.narrationStepCount} />
    <text x="1225" y="675" textAnchor="end" className="dc-assumptions">{copy.canvas.assumptions}</text>
  </svg>;
}

function DcPortraitCanvas(props: DcCanvasProps) {
  const copy = dcCopy[props.locale];
  return <svg className="experiment-svg" viewBox="0 0 720 1280" role="img" aria-labelledby="dc-portrait-title dc-portrait-description">
    <title id="dc-portrait-title">{copy.canvas.title}</title>
    <desc id="dc-portrait-description">{copy.canvas.description}</desc>
    <defs>
      <pattern id="dc-portrait-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" className="dc-grid-line" /></pattern>
      <marker id="dc-current-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" className="dc-arrow-head" /></marker>
    </defs>
    <rect width="720" height="1280" className="dc-canvas-bg" />
    <rect x="30" y="30" width="660" height="1220" fill="url(#dc-portrait-grid)" className="dc-canvas-border" />
    <text x="54" y="78" className="canvas-kicker">ELECTRICITY / 05</text>
    <text x="54" y="123" className="canvas-title dc-portrait-title">{copy.canvas.title}</text>
    <text x="54" y="155" className="canvas-subtitle dc-portrait-subtitle">{copy.canvas.subtitle}</text>
    <NarrationHeader x={54} y={184} step={props.narrationStep} index={props.narrationStepIndex} count={props.narrationStepCount} />
    {props.state ? <>
      <CircuitSchematic x={54} y={props.narrationStep ? 276 : 190} width={612} height={516} state={props.state} topology={props.parameters.topology} meterTarget={props.meterTarget} showCurrent={props.parameters.showConventionalCurrent} locale={props.locale} />
      <SelectedMeter x={54} y={props.narrationStep ? 812 : 726} width={612} state={props.state} target={props.meterTarget} locale={props.locale} />
      <TopologyComparison x={54} y={props.narrationStep ? 944 : 858} width={612} state={props.state} topology={props.parameters.topology} locale={props.locale} />
      <g className="dc-equation-card" transform={`translate(54 ${props.narrationStep ? 1148 : 1062})`}><rect width="612" height="76" rx="4" /><text x="18" y="29" className="dc-section-label">{copy.canvas.networkLaw}</text><text x="18" y="59" className="dc-equation small">I_total = V_source / R_eq</text><text x="594" y="59" textAnchor="end" className="dc-equation-result">{formatCurrent(props.state.totalCurrentA, props.locale)}</text></g>
    </> : <text x="360" y="640" textAnchor="middle" className="dc-invalid">{copy.canvas.invalid}</text>}
    <text x="666" y="1234" textAnchor="end" className="dc-assumptions">{copy.canvas.assumptions}</text>
  </svg>;
}

function DcCircuitsCanvas(props: DcCanvasProps) {
  return <div className={`output-frame dc-output-frame ${props.aspectRatio === "16:9" ? "is-landscape" : "is-portrait"}`}>
    {props.aspectRatio === "16:9" ? <DcLandscapeCanvas {...props} /> : <DcPortraitCanvas {...props} />}
  </div>;
}

export function DcCircuitsWorkbench() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [parameters, setParameters] = useState(dcCircuitsDefaults);
  const [meterTarget, setMeterTarget] = useState<MeterTarget>("source");
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [narrationTextOverrides, setNarrationTextOverrides] = useState<Record<Locale, DcTextOverrides>>({en: {}, "zh-CN": {}});
  const [narrationDurationOverrides, setNarrationDurationOverrides] = useState<DcDurationOverrides>({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("16:9");
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
  const copy = dcCopy[locale];

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

  const parsedParameters = useMemo(() => dcCircuitsParametersSchema.safeParse(parameters), [parameters]);
  const state = useMemo(() => parsedParameters.success ? solveDCCircuits(parsedParameters.data, mode === "narration" ? resolveNarrationFrame(
    dcCircuitsTemplate.narration.map((definition) => ({...definition, title: copy.narration[definition.id as DcStepId].title, caption: copy.narration[definition.id as DcStepId].caption})),
    narrationTimeSeconds,
    EXPERIMENT_DURATION_SECONDS,
  ).simulationTimeSeconds : timeSeconds) : null, [copy.narration, mode, narrationTimeSeconds, parsedParameters, timeSeconds]);

  const narrationText = useMemo(() => {
    const text = structuredClone(copy.narration);
    if (state) {
      text["equivalent-resistance"].caption = locale === "en"
        ? `The ${copy.topology[parameters.topology].toLowerCase()} network has R_eq = ${formatNumber(state.equivalentResistanceOhm, locale, 2)} Ω.`
        : `${copy.topology[parameters.topology]}网络的等效电阻为 ${formatNumber(state.equivalentResistanceOhm, locale, 2)} Ω。`;
      text["ohms-law"].caption = locale === "en"
        ? `${formatNumber(state.parameters.sourceVoltageV, locale, 1)} V / ${formatNumber(state.equivalentResistanceOhm, locale, 2)} Ω predicts ${formatCurrent(state.totalCurrentA, locale)}.`
        : `${formatNumber(state.parameters.sourceVoltageV, locale, 1)} V 除以 ${formatNumber(state.equivalentResistanceOhm, locale, 2)} Ω，预测总电流为 ${formatCurrent(state.totalCurrentA, locale)}。`;
      text["branch-readings"].caption = locale === "en"
        ? `R1 reads ${formatCurrent(state.branchCurrent1A, locale)} and ${formatNumber(state.resistorVoltage1V, locale, 2)} V; R2 reads ${formatCurrent(state.branchCurrent2A, locale)} and ${formatNumber(state.resistorVoltage2V, locale, 2)} V.`
        : `R1 为 ${formatCurrent(state.branchCurrent1A, locale)}、${formatNumber(state.resistorVoltage1V, locale, 2)} V；R2 为 ${formatCurrent(state.branchCurrent2A, locale)}、${formatNumber(state.resistorVoltage2V, locale, 2)} V。`;
    }
    return text;
  }, [copy.narration, copy.topology, locale, parameters.topology, state]);

  const narrationSteps = useMemo<NarrationStep[]>(() => dcCircuitsTemplate.narration.map((definition) => {
    const id = definition.id as DcStepId;
    return {
      ...definition,
      title: narrationTextOverrides[locale][id]?.title ?? narrationText[id].title,
      caption: narrationTextOverrides[locale][id]?.caption ?? narrationText[id].caption,
      durationSeconds: narrationDurationOverrides[id] ?? definition.durationSeconds,
    };
  }), [locale, narrationDurationOverrides, narrationText, narrationTextOverrides]);
  const narrationDurationSeconds = useMemo(() => getNarrationDuration(narrationSteps), [narrationSteps]);
  const narrationFrame = useMemo(() => resolveNarrationFrame(narrationSteps, narrationTimeSeconds, EXPERIMENT_DURATION_SECONDS), [narrationSteps, narrationTimeSeconds]);
  const simulationTimeSeconds = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveDCCircuits(parsedParameters.data, simulationTimeSeconds) : null, [parsedParameters, simulationTimeSeconds]);
  const durationSeconds = mode === "narration" ? narrationDurationSeconds : EXPERIMENT_DURATION_SECONDS;
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const issues = useMemo(() => inspectDCCircuits(parameters), [parameters]);
  const localizedIssues = useMemo(() => issues.map((issue) => localizeIssue(issue, locale)), [issues, locale]);

  useEffect(() => {
    if (!isPlaying || !renderedState) {
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
  }, [durationSeconds, isPlaying, mode, renderedState, speed]);

  const stopAndResetTime = useCallback(() => {
    setTimeSeconds(0);
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, []);
  const updateNumericParameter = useCallback((key: NumericParameterKey, value: number) => {
    setParameters((current) => ({...current, [key]: value}));
    stopAndResetTime();
  }, [stopAndResetTime]);
  const updateTopology = useCallback((topology: DCCircuitsTopology) => {
    setParameters((current) => ({...current, topology}));
    if (topology === "single" && meterTarget === "r2") setMeterTarget("r1");
    stopAndResetTime();
  }, [meterTarget, stopAndResetTime]);
  const toggleBoolean = useCallback((key: "switchClosed" | "showConventionalCurrent") => {
    setParameters((current) => ({...current, [key]: !current[key]}));
    stopAndResetTime();
  }, [stopAndResetTime]);
  const step = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    const updateTime = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
    updateTime((current) => Math.min(Math.max(current + direction / FPS, 0), durationSeconds));
  }, [durationSeconds, mode]);
  const selectNarrationStep = useCallback((index: number) => {
    setIsPlaying(false);
    setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));
  }, [narrationSteps]);
  const updateNarrationText = useCallback((id: DcStepId, field: "title" | "caption", value: string) => {
    setNarrationTextOverrides((current) => ({...current, [locale]: {...current[locale], [id]: {...current[locale][id], [field]: value}}}));
  }, [locale]);
  const updateNarrationDuration = useCallback((id: DcStepId, value: number) => {
    if (!Number.isFinite(value)) return;
    setNarrationDurationOverrides((current) => ({...current, [id]: Math.min(Math.max(value, 1), 10)}));
    setIsPlaying(false);
  }, []);
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
    return {
      x: Math.min(width * Math.min(0.48, overflow * 0.35), Math.max(-width * Math.min(0.48, overflow * 0.35), nextPan.x)),
      y: Math.min(height * Math.min(0.48, overflow * 0.35), Math.max(-height * Math.min(0.48, overflow * 0.35), nextPan.y)),
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
    if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen();
    else await workbenchRef.current?.requestFullscreen();
  }, []);

  return <main className={`workbench-shell dc-circuits-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar">
      <div className="project-identity">
        <Link className="back-to-library" href="/experiments" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></Link>
        <span className="brand-mark"><FlaskConical size={17} /></span>
        <span className="brand-name">Science Studio</span>
        <span className="topbar-divider" />
        <span className="project-name">{copy.projectName}</span>
        <span className="dc-pack-badge"><LockKeyhole size={11} />{copy.packName}</span>
      </div>
      <nav className="mode-switch" aria-label={commonCopy.modeLabel}>
        <button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button>
        <button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button>
        <button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button>
      </nav>
      <div className="topbar-actions">
        <button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button>
        <button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button>
        <button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button>
      </div>
    </header>

    <section className="workspace">
      <div className="stage-area dc-stage-area" ref={stageAreaRef}>
        <div className="stage-meta dc-stage-meta">
          <span>{commonCopy.stage.outputCanvas}</span>
          <div className="dc-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}>
            <div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>
              {(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}
            </div>
            <button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button>
            <output className="canvas-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</output>
            <button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button>
            <button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button>
            <button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button>
            <button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
          </div>
        </div>
        <div className={`dc-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation}
          onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}}
          onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}}
          onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}}
          onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}}
          onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}}
          onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}>
          <DcCircuitsCanvas state={renderedState} parameters={parameters} locale={locale} aspectRatio={aspectRatio} meterTarget={meterTarget} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} />
        </div>
      </div>

      <aside className="parameter-panel">
        {mode === "experiment" ? <>
          <div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div>
          <div className="parameter-list">
            <div className="parameter-control dc-topology-parameter">
              <span className="dc-control-label">{copy.parameters.topology}</span>
              <div className="dc-topology-control" role="group" aria-label={copy.parameters.topology}>
                {(["single", "series", "parallel"] as DCCircuitsTopology[]).map((topology) => <button className={parameters.topology === topology ? "active" : ""} type="button" aria-pressed={parameters.topology === topology} onClick={() => updateTopology(topology)} key={topology}>{copy.topology[topology]}</button>)}
              </div>
            </div>
            {numericParameterDefinitions.map((definition) => {
              const errorIssue = !parsedParameters.success ? parsedParameters.error.issues.find((issue) => issue.path[0] === definition.key) : undefined;
              const disabled = definition.key === "resistance2Ohm" && parameters.topology === "single";
              const label = copy.parameters[definition.key];
              return <div className={`parameter-control ${disabled ? "disabled" : ""}`} key={definition.key}>
                <div className="parameter-row"><label htmlFor={`dc-${definition.key}-number`}>{label}</label><div className="number-field"><input id={`dc-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} disabled={disabled} onInput={(event) => updateNumericParameter(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(errorIssue)} /><span>{definition.unit}</span></div></div>
                <input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} disabled={disabled} onChange={(event) => updateNumericParameter(definition.key, event.currentTarget.valueAsNumber)} />
                {errorIssue ? <p className="field-error">{locale === "en" ? `Enter a value from ${definition.min} to ${definition.max}.` : `请输入 ${definition.min} 到 ${definition.max} 之间的数值。`}</p> : null}
              </div>;
            })}
            <div className="parameter-control dc-switch-parameter"><span className="dc-control-label">{copy.parameters.circuitSwitch}</span><button className={`dc-switch-control ${parameters.switchClosed ? "closed" : "open"}`} type="button" role="switch" aria-checked={parameters.switchClosed} aria-label={parameters.switchClosed ? copy.switchControl.openAction : copy.switchControl.closeAction} onClick={() => toggleBoolean("switchClosed")}><Power size={15} /><span>{parameters.switchClosed ? copy.switchControl.closed : copy.switchControl.open}</span><span className="dc-switch-track" aria-hidden="true"><span /></span></button></div>
            <div className="parameter-control dc-switch-parameter"><span className="dc-control-label">{copy.parameters.conventionalCurrent}</span><button className={`dc-switch-control ${parameters.showConventionalCurrent ? "closed" : "open"}`} type="button" role="switch" aria-checked={parameters.showConventionalCurrent} onClick={() => toggleBoolean("showConventionalCurrent")}><Check size={15} /><span>{parameters.showConventionalCurrent ? copy.visibility.show : copy.visibility.hide}</span><span className="dc-switch-track" aria-hidden="true"><span /></span></button></div>
            <div className="parameter-control dc-meter-parameter"><span className="dc-control-label">{copy.parameters.meterTarget}</span><div className="dc-meter-targets" role="group" aria-label={copy.parameters.meterTarget}>{(["source", "r1", "r2"] as MeterTarget[]).map((target) => <button className={meterTarget === target ? "active" : ""} type="button" disabled={target === "r2" && parameters.topology === "single"} aria-pressed={meterTarget === target} onClick={() => setMeterTarget(target)} key={target}>{copy.meterTargets[target]}</button>)}</div></div>
          </div>
          <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements dc-measurements">
            <div><dt>{copy.measurements.equivalentResistance}</dt><dd>{renderedState ? formatNumber(renderedState.equivalentResistanceOhm, locale, 2) : "--"}<small>Ω</small></dd></div>
            <div className="dc-total-current"><dt>{copy.measurements.totalCurrent}</dt><dd>{renderedState ? formatCurrent(renderedState.totalCurrentA, locale) : "--"}</dd></div>
            <div><dt>{copy.measurements.branch1Current}</dt><dd>{renderedState ? formatCurrent(renderedState.branchCurrent1A, locale) : "--"}</dd></div>
            <div><dt>{copy.measurements.branch2Current}</dt><dd>{renderedState ? formatCurrent(renderedState.branchCurrent2A, locale) : "--"}</dd></div>
            <div><dt>{copy.measurements.resistor1Voltage}</dt><dd>{renderedState ? formatNumber(renderedState.resistorVoltage1V, locale, 2) : "--"}<small>V</small></dd></div>
            <div><dt>{copy.measurements.resistor2Voltage}</dt><dd>{renderedState ? formatNumber(renderedState.resistorVoltage2V, locale, 2) : "--"}<small>V</small></dd></div>
            <div className="dc-total-power"><dt>{copy.measurements.totalPower}</dt><dd>{renderedState ? formatNumber(renderedState.totalPowerW, locale, 2) : "--"}<small>W</small></dd></div>
            <div><dt>{copy.measurements.switchState}</dt><dd>{renderedState ? (renderedState.circuitClosed ? copy.switchControl.closed : copy.switchControl.open) : "--"}</dd></div>
          </dl></section>
          <section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{localizedIssues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section>
        </> : <>
          <div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div>
          <div className="narration-step-list" aria-label={commonCopy.narration.steps}>{narrationSteps.map((stepItem, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={stepItem.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{stepItem.title}</strong><small>{stepItem.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${stepItem.simulationMode}`}>{stepItem.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div>
          <section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as DcStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as DcStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as DcStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section>
        </>}
      </aside>
    </section>

    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Experiment time" : "实验时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{commonCopy.actions.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></footer>
  </main>;
}
