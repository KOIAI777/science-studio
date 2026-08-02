"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  electricalPowerDefaults,
  electricalPowerParametersSchema,
  electricalPowerTemplate,
  inspectElectricalPower,
  solveElectricalPower,
  type ElectricalPowerChannelProfile,
  type ElectricalPowerParameters,
  type ElectricalPowerState,
} from "@science-studio/templates/electrical-power";
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
  RotateCcw,
  Scan,
  SkipBack,
  SkipForward,
  Undo2,
  Redo2,
  Zap,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {ExperimentLibraryBackLink} from "./experiment-library-back-link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {workbenchCopy, type Locale} from "../lib/i18n";
import {getNarrationDuration, getNarrationStepStart, resolveNarrationFrame} from "../lib/narration";
import {CanvasTextSizeControls} from "./canvas-text-size-controls";

const FPS = 30;

type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "voltageAV" | "resistanceAOhm" | "voltageBV" | "resistanceBOhm" | "runDurationSeconds";
type PowerStepId = "set-runs" | "current" | "power" | "energy" | "compare" | "equations";
type PowerStepText = Record<PowerStepId, {title: string; caption: string}>;
type PowerTextOverrides = Partial<Record<PowerStepId, Partial<{title: string; caption: string}>>>;
type PowerDurationOverrides = Partial<Record<PowerStepId, number>>;
type ComparisonPreset = "same-voltage" | "double-voltage" | "equal-power" | "custom";

interface PowerCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {presets: string; currentMarkers: string};
  presets: Record<Exclude<ComparisonPreset, "custom">, string>;
  toggles: {shown: string; hidden: string};
  measurements: {
    title: string;
    model: string;
    runA: string;
    runB: string;
    current: string;
    power: string;
    energy: string;
    charge: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    badge: string;
    runA: string;
    runB: string;
    idealLoad: string;
    source: string;
    resistor: string;
    conventionalCurrent: string;
    recorder: string;
    recorderNote: string;
    transferredEnergy: string;
    physicalTime: string;
    equations: string;
    comparison: string;
    equal: string;
    leaderA: string;
    leaderB: string;
    directionNote: string;
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
  narration: PowerStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    highPowerTitle: string;
    highPowerDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const powerCopy: Record<Locale, PowerCopy> = {
  en: {
    projectName: "Electrical Power & Energy",
    packName: "Middle School Pack",
    parameters: {
      presets: "Comparison preset",
      voltageAV: "Run A voltage",
      resistanceAOhm: "Run A resistance",
      voltageBV: "Run B voltage",
      resistanceBOhm: "Run B resistance",
      runDurationSeconds: "Run duration",
      currentMarkers: "Current direction",
    },
    presets: {"same-voltage": "Same voltage", "double-voltage": "Double voltage", "equal-power": "Equal power"},
    toggles: {shown: "Shown", hidden: "Hidden"},
    measurements: {title: "Live comparison", model: "Ideal resistive loads", runA: "Run A", runB: "Run B", current: "Current", power: "Power", energy: "Energy", charge: "Charge moved"},
    canvas: {
      ariaLabel: "Two ideal resistive circuits compared with a synchronized electrical-energy graph",
      title: "Power sets the pace",
      subtitle: "Two controlled runs · one physical clock",
      badge: "POWER IS ENERGY PER SECOND",
      runA: "RUN A",
      runB: "RUN B",
      idealLoad: "INDEPENDENT IDEAL LOAD",
      source: "SOURCE",
      resistor: "OHMIC LOAD",
      conventionalCurrent: "CONVENTIONAL CURRENT",
      recorder: "SYNCHRONIZED ENERGY RECORDER",
      recorderNote: "The steeper line has greater constant power",
      transferredEnergy: "ENERGY TRANSFERRED",
      physicalTime: "PHYSICAL TIME",
      equations: "POWER · ENERGY",
      comparison: "CURRENT COMPARISON",
      equal: "Both runs transfer energy at the same rate",
      leaderA: "Run A transfers more energy in the same time",
      leaderB: "Run B transfers more energy in the same time",
      directionNote: "Marker motion shows direction only · no temperature model",
      invalid: "Fix the parameters to resume",
    },
    viewport: {ratio: "Canvas ratio", portrait: "Portrait 9:16", landscape: "Widescreen 16:9", zoomOut: "Zoom out", zoomIn: "Zoom in", move: "Move canvas", fit: "Fit canvas", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", canvasNavigation: "Canvas navigation"},
    narration: {
      "set-runs": {title: "Set up two controlled runs", caption: "Compare two independent ideal loads while changing one variable at a time."},
      current: {title: "Calculate the current", caption: "Use I = V/R for each load; moving markers indicate conventional-current direction only."},
      power: {title: "Find the transfer rate", caption: "Power tells us how many joules of electrical energy are transferred each second."},
      energy: {title: "Let energy accumulate", caption: "With constant power, E = Pt produces a straight line whose slope equals power."},
      compare: {title: "Compare equal elapsed times", caption: "At the same time, the greater-power run has transferred more energy."},
      equations: {title: "Verify every relationship", caption: "Check P = VI = I²R = V²/R and convert between joules and watt-hours."},
    },
    issues: {invalidTitle: "Invalid parameter", invalidDetail: "Check the highlighted input before running the experiment.", highPowerTitle: "High idealized power", highPowerDetail: "A real setup would require a source and resistor rated for this voltage, current, power, and heat transfer.", assumptionTitle: "Ideal resistive-load model", assumptionDetail: "Both channels use constant ohmic resistance and ideal steady DC; temperature rise, source limits, transients, and losses are excluded."},
  },
  "zh-CN": {
    projectName: "电功率与电能",
    packName: "初中物理实验包",
    parameters: {
      presets: "对比预设",
      voltageAV: "A 组电压",
      resistanceAOhm: "A 组电阻",
      voltageBV: "B 组电压",
      resistanceBOhm: "B 组电阻",
      runDurationSeconds: "运行时长",
      currentMarkers: "电流方向",
    },
    presets: {"same-voltage": "相同电压", "double-voltage": "电压加倍", "equal-power": "相同功率"},
    toggles: {shown: "显示", hidden: "隐藏"},
    measurements: {title: "实时对比", model: "理想电阻负载", runA: "A 组", runB: "B 组", current: "电流", power: "功率", energy: "电能", charge: "通过电荷量"},
    canvas: {
      ariaLabel: "两组理想电阻电路及同步电能曲线对比",
      title: "功率决定能量积累速度",
      subtitle: "两组受控实验 · 同一物理时钟",
      badge: "功率表示每秒转移的能量",
      runA: "A 组",
      runB: "B 组",
      idealLoad: "独立理想负载",
      source: "电源",
      resistor: "欧姆负载",
      conventionalCurrent: "常规电流",
      recorder: "同步电能记录器",
      recorderNote: "曲线越陡，恒定功率越大",
      transferredEnergy: "已转移电能",
      physicalTime: "物理时间",
      equations: "功率 · 电能",
      comparison: "当前对比",
      equal: "两组以相同速率转移能量",
      leaderA: "相同时间内 A 组转移的能量更多",
      leaderB: "相同时间内 B 组转移的能量更多",
      directionNote: "动点只表示常规电流方向 · 不模拟温度",
      invalid: "修正参数后恢复实验",
    },
    viewport: {ratio: "画布比例", portrait: "竖版 9:16", landscape: "横版 16:9", zoomOut: "缩小", zoomIn: "放大", move: "移动画布", fit: "适应画布", enterFullscreen: "进入全屏", exitFullscreen: "退出全屏", canvasNavigation: "画布导航"},
    narration: {
      "set-runs": {title: "设置两组受控实验", caption: "两组使用独立理想负载，每次只改变一个变量。"},
      current: {title: "计算电流", caption: "分别使用 I = V/R；移动标记只表示常规电流方向。"},
      power: {title: "求能量转移速率", caption: "功率表示每秒转移多少焦耳的电能。"},
      energy: {title: "观察电能积累", caption: "功率恒定时，E = Pt 是直线，曲线斜率就是功率。"},
      compare: {title: "比较相同时间", caption: "经过相同时间后，功率更大的实验转移的电能更多。"},
      equations: {title: "验证等价公式", caption: "核对 P = VI = I²R = V²/R，并在焦耳和瓦时之间换算。"},
    },
    issues: {invalidTitle: "参数无法运行", invalidDetail: "运行实验前请检查高亮的参数。", highPowerTitle: "理想功率较高", highPowerDetail: "真实装置需要使用电压、电流、功率和散热额定值合适的电源与电阻。", assumptionTitle: "理想电阻负载模型", assumptionDetail: "两组均采用恒定欧姆电阻和理想稳恒直流；不模拟温升、电源限制、瞬态与损耗。"},
  },
};

const numericDefinitions = electricalPowerTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale, {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
}

function formatCompact(value: number, locale: Locale) {
  if (value >= 1000) return `${formatNumber(value / 1000, locale, 2)} kJ`;
  return `${formatNumber(value, locale, 1)} J`;
}

function localizeIssue(issue: ScienceIssue, copy: PowerCopy): ScienceIssue {
  if (issue.severity === "blocking") return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "high-ideal-power") return {...issue, title: copy.issues.highPowerTitle, detail: copy.issues.highPowerDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function buildNarration(copy: PowerStepText, textOverrides: PowerTextOverrides, durationOverrides: PowerDurationOverrides): NarrationStep[] {
  return electricalPowerTemplate.narration.map((definition) => {
    const id = definition.id as PowerStepId;
    return {...definition, title: textOverrides[id]?.title ?? copy[id].title, caption: textOverrides[id]?.caption ?? copy[id].caption, durationSeconds: durationOverrides[id] ?? definition.durationSeconds};
  });
}

function VerticalResistor({x, top, bottom}: {x: number; top: number; bottom: number}) {
  const start = top + 8;
  const end = bottom - 8;
  const step = (end - start) / 8;
  let path = `M ${x} ${top} V ${start}`;
  for (let index = 0; index <= 8; index += 1) path += ` L ${x + (index % 2 === 0 ? -10 : 10)} ${start + index * step}`;
  return <path d={`${path} L ${x} ${end} V ${bottom}`} className="power-resistor" />;
}

function PowerChannel({x, y, width, height, channel, state, label, accent, locale, highlighted}: {
  x: number;
  y: number;
  width: number;
  height: number;
  channel: ElectricalPowerChannelProfile;
  state: ElectricalPowerState;
  label: string;
  accent: "a" | "b";
  locale: Locale;
  highlighted: boolean;
}) {
  const copy = powerCopy[locale];
  const left = x + 62;
  const right = x + width - 62;
  const top = y + 78;
  const bottom = y + height - 40;
  const dashOffset = -state.currentMarkerPhase * 100;
  return <g className={`power-channel channel-${accent} ${highlighted ? "highlighted" : ""}`}>
    <rect className="power-channel-surface" x={x} y={y} width={width} height={height} rx="7" />
    <rect className="power-channel-tab" x={x} y={y} width="100" height="31" rx="7" />
    <text className="power-channel-name" x={x + 16} y={y + 21}>{label}</text>
    <text className="power-channel-kicker" x={x + width - 18} y={y + 21} textAnchor="end">{copy.canvas.idealLoad}</text>
    <path className="power-wire" d={`M ${left} ${top} H ${right} V ${bottom} H ${left} V ${top}`} />
    {state.currentMarkersActive ? <path className="power-current-markers" d={`M ${left} ${top} H ${right} V ${bottom} H ${left} V ${top}`} pathLength="100" style={{strokeDashoffset: dashOffset}} /> : null}
    <g className="power-battery"><line x1={left - 20} x2={left + 20} y1={y + height * 0.52 - 9} y2={y + height * 0.52 - 9} /><line x1={left - 12} x2={left + 12} y1={y + height * 0.52 + 9} y2={y + height * 0.52 + 9} /><text x={left + 31} y={y + height * 0.52 - 15}>+</text><text x={left + 31} y={y + height * 0.52 + 25}>−</text></g>
    <VerticalResistor x={right} top={top + 6} bottom={bottom - 6} />
    <text className="power-component-label" x={left + 62} y={y + height * 0.52 - 10}>{copy.canvas.source}</text>
    <text className="power-component-value" x={left + 62} y={y + height * 0.52 + 22}>{formatNumber(channel.voltageV, locale, 0)} V</text>
    <text className="power-component-label" x={right - 28} y={y + height * 0.52 - 10} textAnchor="end">{copy.canvas.resistor}</text>
    <text className="power-component-value" x={right - 28} y={y + height * 0.52 + 22} textAnchor="end">{formatNumber(channel.resistanceOhm, locale, 0)} Ω</text>
    <text className="power-channel-current" x={x + width * 0.5} y={top - 20} textAnchor="middle">I = {formatNumber(channel.currentA, locale, 3)} A</text>
    <g className="power-watt-readout" transform={`translate(${x + width * 0.5 - 77} ${bottom - 16})`}><rect width="154" height="40" rx="20" /><text x="77" y="26" textAnchor="middle">P = {formatNumber(channel.powerW, locale, 2)} W</text></g>
  </g>;
}

function EnergyRecorder({x, y, width, height, state, locale, highlighted}: {x: number; y: number; width: number; height: number; state: ElectricalPowerState; locale: Locale; highlighted: boolean}) {
  const copy = powerCopy[locale];
  const chartX = x + 58;
  const chartY = y + 51;
  const chartWidth = width - 92;
  const chartHeight = height - 92;
  const duration = state.parameters.runDurationSeconds;
  const maxEnergy = Math.max(state.channelA.powerW, state.channelB.powerW) * duration;
  const timeFraction = duration > 0 ? state.timeSeconds / duration : 0;
  const point = (powerW: number) => ({x: chartX + chartWidth * timeFraction, y: chartY + chartHeight - (powerW * state.timeSeconds / maxEnergy) * chartHeight});
  const end = (powerW: number) => ({x: chartX + chartWidth, y: chartY + chartHeight - (powerW * duration / maxEnergy) * chartHeight});
  const pointA = point(state.channelA.powerW);
  const pointB = point(state.channelB.powerW);
  const endA = end(state.channelA.powerW);
  const endB = end(state.channelB.powerW);
  return <g className={`power-recorder ${highlighted ? "highlighted" : ""}`}>
    <rect x={x} y={y} width={width} height={height} rx="8" />
    <text className="power-panel-kicker" x={x + 18} y={y + 25}>{copy.canvas.recorder}</text>
    <text className="power-panel-note" x={x + width - 18} y={y + (width < 700 ? 41 : 25)} textAnchor="end">{copy.canvas.recorderNote}</text>
    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <line className="power-chart-grid" x1={chartX} x2={chartX + chartWidth} y1={chartY + chartHeight * ratio} y2={chartY + chartHeight * ratio} key={`h-${ratio}`} />)}
    {[0, 0.25, 0.5, 0.75, 1].map((ratio) => <line className="power-chart-grid" x1={chartX + chartWidth * ratio} x2={chartX + chartWidth * ratio} y1={chartY} y2={chartY + chartHeight} key={`v-${ratio}`} />)}
    <line className="power-axis" x1={chartX} x2={chartX} y1={chartY} y2={chartY + chartHeight} />
    <line className="power-axis" x1={chartX} x2={chartX + chartWidth} y1={chartY + chartHeight} y2={chartY + chartHeight} />
    <path className="power-projection channel-a" d={`M ${chartX} ${chartY + chartHeight} L ${endA.x} ${endA.y}`} />
    <path className="power-projection channel-b" d={`M ${chartX} ${chartY + chartHeight} L ${endB.x} ${endB.y}`} />
    {state.timeSeconds > 0 ? <><path className="power-energy-line channel-a" d={`M ${chartX} ${chartY + chartHeight} L ${pointA.x} ${pointA.y}`} /><path className="power-energy-line channel-b" d={`M ${chartX} ${chartY + chartHeight} L ${pointB.x} ${pointB.y}`} /><circle className="power-energy-point channel-a" cx={pointA.x} cy={pointA.y} r="5" /><circle className="power-energy-point channel-b" cx={pointB.x} cy={pointB.y} r="5" /></> : null}
    <line className="power-time-cursor" x1={pointA.x} x2={pointA.x} y1={chartY} y2={chartY + chartHeight} />
    <text className="power-axis-label" x={chartX + 8} y={chartY + 16}>{formatCompact(maxEnergy, locale)}</text>
    <text className="power-axis-label" x={chartX} y={chartY + chartHeight + 20}>0 s</text>
    <text className="power-axis-label" x={chartX + chartWidth} y={chartY + chartHeight + 20} textAnchor="end">{formatNumber(duration, locale, 0)} s</text>
    <g transform={`translate(${chartX - 43} ${chartY + chartHeight / 2}) rotate(-90)`}>
      <text className="power-axis-title" x="0" y="0" textAnchor="middle">{copy.canvas.transferredEnergy}</text>
    </g>
    <text className="power-axis-title" x={chartX + chartWidth / 2} y={chartY + chartHeight + 38} textAnchor="middle">{copy.canvas.physicalTime}</text>
  </g>;
}

function ElectricalPowerCanvas({state, locale, aspectRatio, narrationStep, narrationStepIndex, narrationStepCount}: {state: ElectricalPowerState | null; locale: Locale; aspectRatio: CanvasAspectRatio; narrationStep?: NarrationStep; narrationStepIndex?: number; narrationStepCount?: number}) {
  const copy = powerCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const channelWidth = landscape ? 510 : 600;
  const channelHeight = landscape ? 190 : 205;
  const channelAX = landscape ? 92 : 60;
  const channelAY = landscape ? 145 : 183;
  const channelBX = landscape ? 678 : 60;
  const channelBY = landscape ? 145 : 414;
  const recorderX = landscape ? 92 : 60;
  const recorderY = landscape ? 371 : 653;
  const recorderWidth = landscape ? 750 : 600;
  const recorderHeight = landscape ? 248 : 282;
  const formulaX = landscape ? 868 : 60;
  const formulaY = landscape ? 371 : 964;
  const formulaWidth = landscape ? 320 : 600;
  const formulaHeight = landscape ? 248 : 250;
  const comparison = state?.energyLeader === "equal" ? copy.canvas.equal : state?.energyLeader === "a" ? copy.canvas.leaderA : copy.canvas.leaderB;
  const highlightChannels = narrationStep?.id === "set-runs" || narrationStep?.id === "current" || narrationStep?.id === "power";
  const highlightRecorder = narrationStep?.id === "energy" || narrationStep?.id === "compare";

  return <svg className={`wave-canvas electrical-power-canvas ${landscape ? "is-landscape" : "is-portrait"}`} viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="power-canvas-title power-canvas-description">
    <title id="power-canvas-title">{copy.canvas.ariaLabel}</title>
    <desc id="power-canvas-description">{copy.canvas.subtitle}</desc>
    <rect width={viewWidth} height={viewHeight} className="power-canvas-bg" />
    <g className="power-canvas-heading"><text className="canvas-eyebrow" x={landscape ? 92 : 60} y={landscape ? 40 : 63}>SCIENCE STUDIO · ELECTRICAL ENERGY</text><text className="canvas-title" x={landscape ? 92 : 60} y={landscape ? 84 : 105}>{copy.canvas.title}</text><text className="canvas-subtitle" x={landscape ? 92 : 60} y={landscape ? 115 : 140}>{copy.canvas.subtitle}</text><g className="power-mode-badge" transform={`translate(${landscape ? 924 : 390} ${landscape ? 48 : 35})`}><rect width={landscape ? 264 : 270} height={landscape ? 52 : 42} rx="6" /><text x={landscape ? 132 : 135} y={landscape ? 31 : 26} textAnchor="middle">{copy.canvas.badge}</text></g></g>
    {state ? <>
      <PowerChannel x={channelAX} y={channelAY} width={channelWidth} height={channelHeight} channel={state.channelA} state={state} label={copy.canvas.runA} accent="a" locale={locale} highlighted={highlightChannels} />
      <PowerChannel x={channelBX} y={channelBY} width={channelWidth} height={channelHeight} channel={state.channelB} state={state} label={copy.canvas.runB} accent="b" locale={locale} highlighted={highlightChannels} />
      <EnergyRecorder x={recorderX} y={recorderY} width={recorderWidth} height={recorderHeight} state={state} locale={locale} highlighted={highlightRecorder} />
      <g className={`power-formula-panel ${narrationStep?.id === "equations" || narrationStep?.id === "compare" ? "highlighted" : ""}`} transform={`translate(${formulaX} ${formulaY})`}>
        <rect width={formulaWidth} height={formulaHeight} rx="8" />
        <text className="power-panel-kicker" x="20" y="27">{copy.canvas.equations}</text>
        <text className="power-formula-primary" x="20" y={landscape ? 66 : 70}>P = V·I = I²R = V²/R</text>
        <text className="power-formula-primary secondary" x="20" y={landscape ? 102 : 118}>E = P·t</text>
        <line className="power-formula-divider" x1="20" x2={formulaWidth - 20} y1={landscape ? 119 : 142} y2={landscape ? 119 : 142} />
        <text className="power-panel-kicker" x="20" y={landscape ? 143 : 166}>{copy.canvas.comparison}</text>
        <g className="power-inline-readings" transform={`translate(20 ${landscape ? 159 : 180})`}><circle className="channel-a" cx="5" cy="5" r="5" /><text x="17" y="9">A · {formatCompact(state.energyAJ, locale)}</text><circle className="channel-b" cx={landscape ? 132 : 250} cy="5" r="5" /><text x={landscape ? 144 : 262} y="9">B · {formatCompact(state.energyBJ, locale)}</text></g>
        <text className="power-comparison-result" x="20" y={landscape ? 199 : 214}>{comparison}</text>
        <text className="power-direction-note" x="20" y={landscape ? formulaHeight - 18 : 239}>{copy.canvas.directionNote}</text>
      </g>
      {narrationStep ? <g className="narration-overlay power-narration-overlay"><text className="narration-step-number" x={landscape ? 92 : 60} y={viewHeight - 75}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={landscape ? 182 : 150} y={viewHeight - 77}>{narrationStep.title}</text><text className="narration-step-caption" x={landscape ? 182 : 150} y={viewHeight - 43}>{narrationStep.caption}</text></g> : null}
    </> : <g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g>}
  </svg>;
}

export function ElectricalPowerWorkbench() {
  const [parameters, setParameters] = useState<ElectricalPowerParameters>(electricalPowerDefaults);
  const [preset, setPreset] = useState<ComparisonPreset>("same-voltage");
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [speed, setSpeed] = useState(4);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("16:9");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [panMode, setPanMode] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textOverrides, setTextOverrides] = useState<PowerTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<PowerDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);

  const copy = powerCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => electricalPowerParametersSchema.safeParse(parameters), [parameters]);
  const narrationSteps = useMemo(() => buildNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(narrationSteps, narrationTimeSeconds, parameters.runDurationSeconds);
  const simulationTime = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveElectricalPower(parsedParameters.data, simulationTime) : null, [parsedParameters, simulationTime]);
  const issues = useMemo(() => inspectElectricalPower(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : parameters.runDurationSeconds;

  useEffect(() => {const stored = window.localStorage.getItem("science-studio-locale"); if (stored === "en" || stored === "zh-CN") setLocale(stored);}, []);
  useEffect(() => {const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current); document.addEventListener("fullscreenchange", onFullscreen); return () => document.removeEventListener("fullscreenchange", onFullscreen);}, []);
  useEffect(() => {
    if (!isPlaying) {lastTimestampRef.current = null; if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); return;}
    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current ?? timestamp;
      lastTimestampRef.current = timestamp;
      const delta = ((timestamp - previous) / 1000) * (mode === "narration" ? 1 : speed);
      const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
      setter((current) => {const limit = mode === "narration" ? narrationDuration : parameters.runDurationSeconds; const next = Math.min(limit, current + delta); if (next >= limit) setIsPlaying(false); return next;});
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [isPlaying, mode, narrationDuration, parameters.runDurationSeconds, speed]);

  const resetPhysicalTime = useCallback(() => {setIsPlaying(false); setTimeSeconds(0);}, []);
  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {setParameters((current) => ({...current, [key]: value})); setPreset("custom"); resetPhysicalTime();}, [resetPhysicalTime]);
  const applyPreset = useCallback((next: Exclude<ComparisonPreset, "custom">) => {
    const values = next === "same-voltage"
      ? {voltageAV: 12, resistanceAOhm: 24, voltageBV: 12, resistanceBOhm: 12}
      : next === "double-voltage"
        ? {voltageAV: 6, resistanceAOhm: 24, voltageBV: 12, resistanceBOhm: 24}
        : {voltageAV: 12, resistanceAOhm: 24, voltageBV: 6, resistanceBOhm: 6};
    setParameters((current) => ({...current, ...values}));
    setPreset(next);
    resetPhysicalTime();
  }, [resetPhysicalTime]);
  const toggleMarkers = useCallback(() => setParameters((current) => ({...current, showConventionalCurrent: !current.showConventionalCurrent})), []);
  const stopAndResetTime = useCallback(() => {setIsPlaying(false); if (mode === "narration") setNarrationTimeSeconds(0); else setTimeSeconds(0);}, [mode]);
  const step = useCallback((direction: -1 | 1) => {setIsPlaying(false); const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; const increment = 1 / FPS; const limit = mode === "narration" ? narrationDuration : parameters.runDurationSeconds; setter((current) => Math.min(limit, Math.max(0, current + direction * increment)));}, [mode, narrationDuration, parameters.runDurationSeconds]);
  const selectNarrationStep = useCallback((index: number) => {setIsPlaying(false); setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));}, [narrationSteps]);
  const updateNarrationText = useCallback((id: PowerStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: PowerStepId, value: number) => {if (!Number.isFinite(value)) return; setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));}, []);
  const restoreNarrationDefaults = useCallback(() => {setTextOverrides({}); setDurationOverrides({}); setNarrationTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleLocale = useCallback(() => setLocale((current) => {const next = current === "en" ? "zh-CN" : "en"; window.localStorage.setItem("science-studio-locale", next); document.documentElement.lang = next; return next;}), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {if (atZoom <= 1) return {x: 0, y: 0}; const width = stageAreaRef.current?.clientWidth ?? 900; const height = stageAreaRef.current?.clientHeight ?? 600; const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35); const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35); return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};}, []);
  const resetCanvasView = useCallback(() => {setZoom(1); setPan({x: 0, y: 0}); setPanMode(false); setIsDraggingCanvas(false); panDragRef.current = null;}, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))); setPan((currentPan) => clampPan(currentPan, next)); if (next <= 1) setPanMode(false); return next;}), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {setAspectRatio(next); resetCanvasView();}, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen(); else await workbenchRef.current?.requestFullscreen();}, []);

  return <main className={`workbench-shell traveling-wave-workbench electrical-power-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar"><div className="project-identity"><ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="power-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div><nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav><div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div></header>
    <section className="workspace">
      <div className="stage-area wave-stage-area" ref={stageAreaRef}><div className="stage-meta wave-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="wave-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div>
        <div className={`wave-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation} onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}} onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}} onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}} onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}} onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}} onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}><ElectricalPowerCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} /></div>
      </div>
      <aside className="parameter-panel">{mode === "experiment" ? <><div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div><div className="parameter-list"><div className="parameter-control power-preset-control"><span className="power-control-label">{copy.parameters.presets}</span><div className="power-preset-buttons" role="group" aria-label={copy.parameters.presets}>{(["same-voltage", "double-voltage", "equal-power"] as const).map((item) => <button className={preset === item ? "active" : ""} type="button" aria-pressed={preset === item} onClick={() => applyPreset(item)} key={item}>{copy.presets[item]}</button>)}</div></div>{numericDefinitions.map((definition) => {const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; const channelClass = definition.key.includes("A") ? "channel-a-control" : definition.key.includes("B") ? "channel-b-control" : ""; return <div className={`parameter-control ${channelClass}`} key={definition.key}><div className="parameter-row"><label htmlFor={`power-${definition.key}-number`}>{label}</label><div className="number-field"><input id={`power-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}<div className="parameter-control wave-toggle-parameter"><span className="wave-control-label">{copy.parameters.currentMarkers}</span><button className={`wave-switch-control ${parameters.showConventionalCurrent ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.showConventionalCurrent} onClick={toggleMarkers}><Check size={15} /><span>{parameters.showConventionalCurrent ? copy.toggles.shown : copy.toggles.hidden}</span><span className="wave-switch-track" aria-hidden="true"><span /></span></button></div></div>
        <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements power-measurements"><div className="power-measurement-heading channel-a"><dt>{copy.measurements.runA}</dt><dd>{renderedState ? `${formatNumber(renderedState.channelA.powerW, locale, 2)} W` : "--"}</dd></div><div><dt>{copy.measurements.current}</dt><dd>{renderedState ? formatNumber(renderedState.channelA.currentA, locale, 3) : "--"}<small>A</small></dd></div><div><dt>{copy.measurements.energy}</dt><dd>{renderedState ? formatNumber(renderedState.energyAJ, locale, 1) : "--"}<small>J</small></dd></div><div className="power-measurement-heading channel-b"><dt>{copy.measurements.runB}</dt><dd>{renderedState ? `${formatNumber(renderedState.channelB.powerW, locale, 2)} W` : "--"}</dd></div><div><dt>{copy.measurements.current}</dt><dd>{renderedState ? formatNumber(renderedState.channelB.currentA, locale, 3) : "--"}<small>A</small></dd></div><div><dt>{copy.measurements.energy}</dt><dd>{renderedState ? formatNumber(renderedState.energyBJ, locale, 1) : "--"}<small>J</small></dd></div><div className="power-charge-measurement"><dt>{copy.measurements.charge} · A / B</dt><dd>{renderedState ? `${formatNumber(renderedState.chargeAC, locale, 1)} / ${formatNumber(renderedState.chargeBC, locale, 1)}` : "--"}<small>C</small></dd></div></dl></section><section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section></> : <><div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div><div className="narration-step-list" aria-label={commonCopy.narration.steps}>{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div><section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as PowerStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as PowerStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as PowerStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section></>}</aside>
    </section>
    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale, 1)} <small>/ {formatNumber(durationSeconds, locale, 0)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Electrical energy physical time" : "电能实验物理时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{locale === "en" ? "Playback" : "播放速度"}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option><option value="8">8×</option></select></label><span className="power-footer-law"><Zap size={14} />E = P·t</span></footer>
  </main>;
}
