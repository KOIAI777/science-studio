"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  WAVE_MEDIUM_LENGTH_M,
  createTravelingWaveProfile,
  displacementAt,
  inspectTravelingWave,
  solveTravelingWave,
  travelingWaveDefaults,
  travelingWaveParametersSchema,
  travelingWaveTemplate,
  type TravelingWaveParameters,
  type TravelingWaveProfile,
  type TravelingWaveState,
} from "@science-studio/templates/traveling-wave";
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
  Waves,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {ExperimentLibraryBackLink} from "./experiment-library-back-link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {workbenchCopy, type Locale} from "../lib/i18n";
import {getNarrationDuration, getNarrationStepStart, resolveNarrationFrame} from "../lib/narration";
import {CanvasTextSizeControls} from "./canvas-text-size-controls";

const FPS = 30;
const EXPERIMENT_DURATION_SECONDS = 8;
const SVG_NS = "http://www.w3.org/2000/svg";

type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "amplitudeM" | "frequencyHz" | "waveSpeedMs" | "comparisonFrequencyHz";
type WaveStepId = "medium-motion" | "amplitude" | "frequency-period" | "wavelength" | "wave-equation" | "compare";
type WaveStepText = Record<WaveStepId, {title: string; caption: string}>;
type WaveTextOverrides = Partial<Record<WaveStepId, Partial<{title: string; caption: string}>>>;
type WaveDurationOverrides = Partial<Record<WaveStepId, number>>;

interface WaveCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {
    comparisonMode: string;
    particles: string;
  };
  toggles: {on: string; off: string};
  measurements: {
    title: string;
    model: string;
    waveA: string;
    waveB: string;
    period: string;
    wavelength: string;
    speed: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    waveA: string;
    waveB: string;
    propagation: string;
    particles: string;
    amplitude: string;
    wavelength: string;
    fixedSpeed: string;
    equation: string;
    sameMedium: string;
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
  narration: WaveStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    longTitle: string;
    longDetail: string;
    matchingTitle: string;
    matchingDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const waveCopy: Record<Locale, WaveCopy> = {
  en: {
    projectName: "Waves: Frequency, Wavelength & Speed",
    packName: "Middle School Pack",
    parameters: {
      amplitudeM: "Amplitude A",
      frequencyHz: "Wave A frequency",
      waveSpeedMs: "Wave speed",
      comparisonFrequencyHz: "Wave B frequency",
      comparisonMode: "A/B comparison",
      particles: "Medium particles",
    },
    toggles: {on: "Shown", off: "Hidden"},
    measurements: {
      title: "Wave measurements",
      model: "Ideal transverse wave",
      waveA: "Wave A",
      waveB: "Wave B",
      period: "Period",
      wavelength: "Wavelength",
      speed: "Wave speed",
    },
    canvas: {
      ariaLabel: "Traveling transverse wave measurement and comparison canvas",
      title: "Traveling Waves",
      subtitle: "Measure one cycle. Then change frequency while the medium stays the same.",
      waveA: "WAVE A",
      waveB: "WAVE B · COMPARISON",
      propagation: "WAVE TRAVELS RIGHT",
      particles: "PARTICLES OSCILLATE UP AND DOWN",
      amplitude: "AMPLITUDE",
      wavelength: "ONE WAVELENGTH",
      fixedSpeed: "SAME MEDIUM · FIXED SPEED",
      equation: "WAVE RELATIONSHIP",
      sameMedium: "Amplitude and speed held constant",
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
      "medium-motion": {title: "Separate motion from travel", caption: "Each marker moves up and down while the wave pattern travels to the right."},
      amplitude: {title: "Measure amplitude", caption: "Amplitude is the maximum displacement from the equilibrium line."},
      "frequency-period": {title: "Count cycles at the source", caption: "Frequency counts cycles per second; period is the time for one cycle."},
      wavelength: {title: "Measure one wavelength", caption: "Wavelength is the horizontal distance between neighboring points in the same phase."},
      "wave-equation": {title: "Connect speed, frequency, and wavelength", caption: "Multiply frequency by wavelength to recover the fixed wave speed."},
      compare: {title: "Compare two frequencies", caption: "In the same medium, the higher-frequency wave has the shorter wavelength."},
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail: "Check the highlighted input before running the experiment.",
      longTitle: "Wavelength exceeds the visible medium",
      longDetail: "The calculation remains valid, but the full wavelength extends beyond the 12 m display.",
      matchingTitle: "The comparison waves match",
      matchingDetail: "Choose a different Wave B frequency to make the comparison useful.",
      assumptionTitle: "Ideal transverse-wave model",
      assumptionDetail: "The medium is uniform and lossless; reflection, damping, dispersion, and sound behavior are excluded.",
    },
  },
  "zh-CN": {
    projectName: "频率、波长与波速",
    packName: "初中物理实验包",
    parameters: {
      amplitudeM: "振幅 A",
      frequencyHz: "波 A 频率",
      waveSpeedMs: "波速",
      comparisonFrequencyHz: "波 B 频率",
      comparisonMode: "A/B 对照",
      particles: "介质质点",
    },
    toggles: {on: "显示", off: "隐藏"},
    measurements: {
      title: "波的测量",
      model: "理想横波",
      waveA: "波 A",
      waveB: "波 B",
      period: "周期",
      wavelength: "波长",
      speed: "波速",
    },
    canvas: {
      ariaLabel: "横向行波测量和对照实验画布",
      title: "横向行波",
      subtitle: "测量一个周期，再保持介质不变并改变频率。",
      waveA: "波 A",
      waveB: "波 B · 对照",
      propagation: "波向右传播",
      particles: "质点只在平衡位置上下振动",
      amplitude: "振幅",
      wavelength: "一个波长",
      fixedSpeed: "同一介质 · 波速不变",
      equation: "波速关系",
      sameMedium: "保持振幅和波速相同",
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
      "medium-motion": {title: "区分振动与传播", caption: "每个质点只会上下振动，波形整体向右传播。"},
      amplitude: {title: "测量振幅", caption: "振幅是质点偏离平衡位置的最大距离。"},
      "frequency-period": {title: "观察波源振动", caption: "频率表示每秒完成的周期数，周期表示完成一次振动所需的时间。"},
      wavelength: {title: "测量一个波长", caption: "波长是相邻两个同相位点之间的水平距离。"},
      "wave-equation": {title: "建立波速关系", caption: "频率与波长的乘积等于当前介质中的波速。"},
      compare: {title: "比较两个频率", caption: "在同一介质中，频率越高，波长越短。"},
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      longTitle: "波长超过可见介质",
      longDetail: "计算仍然有效，但 12 m 画面无法容纳一个完整波长。",
      matchingTitle: "两列波完全相同",
      matchingDetail: "请为波 B 选择不同频率，使对照结果清晰。",
      assumptionTitle: "理想横波模型",
      assumptionDetail: "介质均匀且无损耗，不包含反射、阻尼、色散和声波行为。",
    },
  },
};

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function buildWaveNarration(
  copy: WaveStepText,
  textOverrides: WaveTextOverrides,
  durationOverrides: WaveDurationOverrides,
): NarrationStep[] {
  return travelingWaveTemplate.narration.map((definition) => {
    const id = definition.id as WaveStepId;
    return {
      ...definition,
      title: textOverrides[id]?.title ?? copy[id].title,
      caption: textOverrides[id]?.caption ?? copy[id].caption,
      durationSeconds: durationOverrides[id] ?? definition.durationSeconds,
    };
  });
}

function localizeIssue(issue: ScienceIssue, copy: WaveCopy): ScienceIssue {
  if (issue.id.startsWith("invalid-parameter")) return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "long-wavelength") return {...issue, title: copy.issues.longTitle, detail: copy.issues.longDetail};
  if (issue.id === "matching-comparison") return {...issue, title: copy.issues.matchingTitle, detail: copy.issues.matchingDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function wavePath(
  profile: TravelingWaveProfile,
  timeSeconds: number,
  wave: "primary" | "comparison",
  x: number,
  centerY: number,
  width: number,
  amplitudeScale: number,
) {
  const points = Array.from({length: 181}, (_, index) => {
    const positionM = (index / 180) * WAVE_MEDIUM_LENGTH_M;
    const px = x + (index / 180) * width;
    const py = centerY - (displacementAt(profile, positionM, timeSeconds, wave) / 1.2) * amplitudeScale;
    return `${index === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
  });
  return points.join(" ");
}

function ArrowMarker({id, color}: {id: string; color: string}) {
  return <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" fill={color} /></marker>;
}

function WavePlot({
  profile,
  state,
  wave,
  x,
  centerY,
  width,
  height,
  label,
  color,
  showParticles,
  showMeasurements,
  copy,
}: {
  profile: TravelingWaveProfile;
  state: TravelingWaveState;
  wave: "primary" | "comparison";
  x: number;
  centerY: number;
  width: number;
  height: number;
  label: string;
  color: string;
  showParticles: boolean;
  showMeasurements: boolean;
  copy: WaveCopy;
}) {
  const wavelength = wave === "primary" ? profile.wavelengthM : profile.comparisonWavelengthM;
  const frequency = wave === "primary" ? profile.parameters.frequencyHz : profile.parameters.comparisonFrequencyHz;
  const period = wave === "primary" ? profile.periodSeconds : profile.comparisonPeriodSeconds;
  const amplitudeScale = height * 0.34;
  const wavelengthPixels = (wavelength / WAVE_MEDIUM_LENGTH_M) * width;
  const bracketStart = x + width * 0.08;
  const bracketEnd = Math.min(x + width * 0.94, bracketStart + wavelengthPixels);
  const clippedWavelength = bracketStart + wavelengthPixels > x + width * 0.94;
  const crestBaseM = wavelength / 4 + profile.parameters.waveSpeedMs * state.timeSeconds;
  const visibleCrests = Array.from({length: 41}, (_, index) => crestBaseM + (index - 20) * wavelength)
    .filter((positionM) => positionM >= 0.7 && positionM <= WAVE_MEDIUM_LENGTH_M - 0.7);
  const crestPositionM = visibleCrests.reduce<number | null>((closest, positionM) => {
    if (closest === null) return positionM;
    return Math.abs(positionM - 2.2) < Math.abs(closest - 2.2) ? positionM : closest;
  }, null);
  const amplitudeX = crestPositionM === null
    ? x + 28
    : x + (crestPositionM / WAVE_MEDIUM_LENGTH_M) * width;
  const amplitudeLabelOnLeft = amplitudeX > x + width * 0.72;
  const markerId = wave === "primary" ? "wave-a-arrow" : "wave-b-arrow";
  const particlePoints = Array.from({length: 25}, (_, index) => {
    const positionM = (index / 24) * WAVE_MEDIUM_LENGTH_M;
    const px = x + (index / 24) * width;
    const py = centerY - (displacementAt(profile, positionM, state.timeSeconds, wave) / 1.2) * amplitudeScale;
    return {positionM, px, py};
  });

  return <g className={`wave-plot wave-plot-${wave}`}>
    <rect className="wave-plot-surface" x={x - 18} y={centerY - height / 2} width={width + 36} height={height} rx="10" />
    <text className="wave-plot-label" x={x} y={centerY - height / 2 + 28}>{label}</text>
    <text className="wave-plot-reading" x={x + width} y={centerY - height / 2 + 28} textAnchor="end">f = {formatNumber(frequency, "en", 1)} Hz · T = {formatNumber(period, "en", 2)} s</text>
    {Array.from({length: 7}, (_, index) => <line className="wave-grid-line" x1={x + (index / 6) * width} x2={x + (index / 6) * width} y1={centerY - height * 0.3} y2={centerY + height * 0.3} key={index} />)}
    <line className="wave-equilibrium" x1={x} x2={x + width} y1={centerY} y2={centerY} />
    <path d={wavePath(profile, state.timeSeconds, wave, x, centerY, width, amplitudeScale)} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    {showParticles ? particlePoints.map((point, index) => <g key={point.positionM}>
      {index % 4 === 0 ? <line className="wave-particle-guide" x1={point.px} x2={point.px} y1={centerY - height * 0.3} y2={centerY + height * 0.3} /> : null}
      <circle className="wave-particle" cx={point.px} cy={point.py} r={index % 4 === 0 ? 5 : 3.5} fill={color} />
    </g>) : null}
    <line className="wave-direction-line" x1={x + width * 0.7} x2={x + width * 0.92} y1={centerY - height * 0.32} y2={centerY - height * 0.32} markerEnd={`url(#${markerId})`} />
    {showMeasurements ? <>
      <line className="wave-measure-line" x1={amplitudeX} x2={amplitudeX} y1={centerY} y2={centerY - amplitudeScale * (profile.parameters.amplitudeM / 1.2)} />
      <line className="wave-measure-cap" x1={amplitudeX - 8} x2={amplitudeX + 8} y1={centerY} y2={centerY} />
      <line className="wave-measure-cap" x1={amplitudeX - 8} x2={amplitudeX + 8} y1={centerY - amplitudeScale * (profile.parameters.amplitudeM / 1.2)} y2={centerY - amplitudeScale * (profile.parameters.amplitudeM / 1.2)} />
      <text className="wave-measure-label" x={amplitudeX + (amplitudeLabelOnLeft ? -14 : 14)} y={centerY - amplitudeScale * (profile.parameters.amplitudeM / 2.4)} textAnchor={amplitudeLabelOnLeft ? "end" : "start"}>{copy.canvas.amplitude} A = {formatNumber(profile.parameters.amplitudeM, "en", 1)} m</text>
      <line className="wave-measure-line" x1={bracketStart} x2={bracketEnd} y1={centerY + height * 0.34} y2={centerY + height * 0.34} />
      <line className="wave-measure-cap" x1={bracketStart} x2={bracketStart} y1={centerY + height * 0.29} y2={centerY + height * 0.39} />
      <line className={`wave-measure-cap ${clippedWavelength ? "clipped" : ""}`} x1={bracketEnd} x2={bracketEnd} y1={centerY + height * 0.29} y2={centerY + height * 0.39} />
      <text className="wave-measure-label" x={(bracketStart + bracketEnd) / 2} y={centerY + height * 0.47} textAnchor="middle">λ = {formatNumber(wavelength, "en", 2)} m{clippedWavelength ? " · extends" : ""}</text>
    </> : null}
  </g>;
}

function TravelingWaveCanvas({state, locale, aspectRatio, narrationStep, narrationStepIndex, narrationStepCount}: {
  state: TravelingWaveState | null;
  locale: Locale;
  aspectRatio: CanvasAspectRatio;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const copy = waveCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const profile = state ? createTravelingWaveProfile(state.parameters) : null;
  const comparison = Boolean(state?.parameters.comparisonMode);
  const plotX = landscape ? 88 : 58;
  const plotWidth = landscape ? 1100 : 604;
  const primaryCenter = landscape ? (comparison ? 244 : 300) : (comparison ? 380 : 470);
  const secondaryCenter = landscape ? 472 : 770;
  const plotHeight = landscape ? (comparison ? 190 : 270) : (comparison ? 250 : 360);
  const formulaY = landscape ? 610 : 1040;
  const primaryHighlighted = !narrationStep || narrationStep.id !== "compare";

  return <svg className="wave-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="wave-canvas-title wave-canvas-description">
    <title id="wave-canvas-title">{copy.canvas.ariaLabel}</title>
    <desc id="wave-canvas-description">{copy.canvas.subtitle}</desc>
    <defs>
      <linearGradient id="wave-canvas-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fbfc" /><stop offset="1" stopColor="#eef4f5" /></linearGradient>
      <ArrowMarker id="wave-a-arrow" color="#0d7280" />
      <ArrowMarker id="wave-b-arrow" color="#c65f32" />
    </defs>
    <rect width={viewWidth} height={viewHeight} fill="url(#wave-canvas-paper)" />
    <g className="wave-canvas-heading">
      <text className="canvas-eyebrow" x={plotX} y={landscape ? 58 : 72}>SCIENCE STUDIO · WAVES</text>
      <text className="canvas-title" x={plotX} y={landscape ? 98 : 118}>{copy.canvas.title}</text>
      <text className="canvas-subtitle" x={plotX} y={landscape ? 126 : 153}>{copy.canvas.subtitle}</text>
      <g className="wave-medium-badge" transform={`translate(${viewWidth - (landscape ? 362 : 304)} ${landscape ? 58 : 74})`}><rect width={landscape ? 274 : 246} height="48" rx="6" /><text x={landscape ? 137 : 123} y="20" textAnchor="middle">{copy.canvas.fixedSpeed}</text><text x={landscape ? 137 : 123} y="38" textAnchor="middle">v = {state ? formatNumber(state.parameters.waveSpeedMs, "en", 1) : "--"} m/s</text></g>
    </g>
    {state && profile ? <>
      <WavePlot profile={profile} state={state} wave="primary" x={plotX} centerY={primaryCenter} width={plotWidth} height={plotHeight} label={copy.canvas.waveA} color="#0d7280" showParticles={state.parameters.showParticles} showMeasurements={primaryHighlighted} copy={copy} />
      {comparison ? <WavePlot profile={profile} state={state} wave="comparison" x={plotX} centerY={secondaryCenter} width={plotWidth} height={plotHeight} label={copy.canvas.waveB} color="#c65f32" showParticles={state.parameters.showParticles} showMeasurements={narrationStep?.id === "compare"} copy={copy} /> : null}
      <g className="wave-direction-note" transform={`translate(${plotX} ${landscape ? 563 : 945})`}><Waves aria-hidden="true" /><text x="30" y="4">{copy.canvas.propagation}</text><line x1={landscape ? 254 : 220} x2={landscape ? 382 : 346} y1="0" y2="0" markerEnd="url(#wave-a-arrow)" /><text x={landscape ? 418 : 378} y="4">{copy.canvas.particles}</text></g>
      <g className={`wave-formula-panel ${narrationStep?.id === "wave-equation" ? "highlighted" : ""}`} transform={`translate(${plotX} ${formulaY})`}>
        <rect width={plotWidth} height={landscape ? 76 : 122} rx="8" />
        <text className="wave-formula-kicker" x="22" y="26">{copy.canvas.equation}</text>
        <text className="wave-formula" x="22" y={landscape ? 57 : 62}>v = f · λ</text>
        <text className="wave-formula-calculation" x={landscape ? 235 : 22} y={landscape ? 57 : 96}>A: {formatNumber(state.parameters.waveSpeedMs, "en", 1)} m/s = {formatNumber(state.parameters.frequencyHz, "en", 1)} Hz × {formatNumber(state.wavelengthM, "en", 2)} m</text>
        {comparison ? <text className="wave-formula-calculation wave-formula-b" x={landscape ? 680 : 332} y={landscape ? 57 : 96}>B: {formatNumber(state.parameters.waveSpeedMs, "en", 1)} m/s = {formatNumber(state.parameters.comparisonFrequencyHz, "en", 1)} Hz × {formatNumber(state.comparisonWavelengthM, "en", 2)} m</text> : null}
      </g>
    </> : <g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g>}
    {narrationStep ? <g className="narration-overlay wave-narration-overlay">
      <text className="narration-step-number" x={plotX} y={viewHeight - 84}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text>
      <text className="narration-step-title" x={plotX + 90} y={viewHeight - 86}>{narrationStep.title}</text>
      <text className="narration-step-caption" x={plotX + 90} y={viewHeight - 52}>{narrationStep.caption}</text>
    </g> : null}
  </svg>;
}

export function TravelingWaveWorkbench() {
  const [parameters, setParameters] = useState<TravelingWaveParameters>(travelingWaveDefaults);
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("16:9");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [panMode, setPanMode] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textOverrides, setTextOverrides] = useState<WaveTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<WaveDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);

  const copy = waveCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => travelingWaveParametersSchema.safeParse(parameters), [parameters]);
  const narrationSteps = useMemo(() => buildWaveNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(narrationSteps, narrationTimeSeconds, EXPERIMENT_DURATION_SECONDS);
  const simulationTime = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveTravelingWave(parsedParameters.data, simulationTime) : null, [parsedParameters, simulationTime]);
  const issues = useMemo(() => inspectTravelingWave(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
  const numericDefinitions = travelingWaveTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

  useEffect(() => {
    const stored = window.localStorage.getItem("science-studio-locale");
    if (stored === "en" || stored === "zh-CN") setLocale(stored);
  }, []);

  useEffect(() => {
    const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current);
    document.addEventListener("fullscreenchange", onFullscreen);
    return () => document.removeEventListener("fullscreenchange", onFullscreen);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      lastTimestampRef.current = null;
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      return;
    }
    const tick = (timestamp: number) => {
      const previous = lastTimestampRef.current ?? timestamp;
      lastTimestampRef.current = timestamp;
      const delta = ((timestamp - previous) / 1000) * speed;
      const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
      setter((current) => {
        const limit = mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
        const next = Math.min(limit, current + delta);
        if (next >= limit) setIsPlaying(false);
        return next;
      });
      animationRef.current = requestAnimationFrame(tick);
    };
    animationRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, mode, narrationDuration, speed]);

  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => setParameters((current) => ({...current, [key]: value})), []);
  const toggleBoolean = useCallback((key: "comparisonMode" | "showParticles") => setParameters((current) => ({...current, [key]: !current[key]})), []);
  const stopAndResetTime = useCallback(() => {
    setIsPlaying(false);
    if (mode === "narration") setNarrationTimeSeconds(0);
    else setTimeSeconds(0);
  }, [mode]);
  const step = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
    const limit = mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
    setter((current) => Math.min(limit, Math.max(0, current + direction / FPS)));
  }, [mode, narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {
    setIsPlaying(false);
    setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));
  }, [narrationSteps]);
  const updateNarrationText = useCallback((id: WaveStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: WaveStepId, value: number) => {
    if (!Number.isFinite(value)) return;
    setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));
  }, []);
  const restoreNarrationDefaults = useCallback(() => {
    setTextOverrides({});
    setDurationOverrides({});
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, []);
  const toggleLocale = useCallback(() => setLocale((current) => {
    const next = current === "en" ? "zh-CN" : "en";
    window.localStorage.setItem("science-studio-locale", next);
    document.documentElement.lang = next;
    return next;
  }), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {
    if (atZoom <= 1) return {x: 0, y: 0};
    const width = stageAreaRef.current?.clientWidth ?? 900;
    const height = stageAreaRef.current?.clientHeight ?? 600;
    const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35);
    const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35);
    return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};
  }, []);
  const resetCanvasView = useCallback(() => {
    setZoom(1);
    setPan({x: 0, y: 0});
    setPanMode(false);
    setIsDraggingCanvas(false);
    panDragRef.current = null;
  }, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {
    const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2))));
    setPan((currentPan) => clampPan(currentPan, next));
    if (next <= 1) setPanMode(false);
    return next;
  }), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {
    setAspectRatio(next);
    resetCanvasView();
  }, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {
    if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen();
    else await workbenchRef.current?.requestFullscreen();
  }, []);

  return <main className={`workbench-shell traveling-wave-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar">
      <div className="project-identity">
        <ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink>
        <span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="wave-pack-badge"><LockKeyhole size={11} />{copy.packName}</span>
      </div>
      <nav className="mode-switch" aria-label={commonCopy.modeLabel}>
        <button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button>
        <button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button>
        <button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button>
      </nav>
      <div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div>
    </header>

    <section className="workspace">
      <div className="stage-area wave-stage-area" ref={stageAreaRef}>
        <div className="stage-meta wave-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="wave-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}>
          <div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div>
          <CanvasTextSizeControls locale={locale} />
          <button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button>
        </div></div>
        <div className={`wave-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation}
          onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}}
          onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}}
          onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}}
          onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}}
          onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}}
          onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}>
          <TravelingWaveCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} />
        </div>
      </div>

      <aside className="parameter-panel">
        {mode === "experiment" ? <>
          <div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div>
          <div className="parameter-list">
            {numericDefinitions.map((definition) => {
              const disabled = definition.key === "comparisonFrequencyHz" && !parameters.comparisonMode;
              const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined;
              const label = copy.parameters[definition.key];
              return <div className={`parameter-control ${disabled ? "disabled" : ""}`} key={definition.key}><div className="parameter-row"><label htmlFor={`wave-${definition.key}-number`}>{label}</label><div className="number-field"><input id={`wave-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} disabled={disabled} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} disabled={disabled} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;
            })}
            <div className="parameter-control wave-toggle-parameter"><span className="wave-control-label">{copy.parameters.comparisonMode}</span><button className={`wave-switch-control ${parameters.comparisonMode ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.comparisonMode} onClick={() => toggleBoolean("comparisonMode")}><Check size={15} /><span>{parameters.comparisonMode ? copy.toggles.on : copy.toggles.off}</span><span className="wave-switch-track" aria-hidden="true"><span /></span></button></div>
            <div className="parameter-control wave-toggle-parameter"><span className="wave-control-label">{copy.parameters.particles}</span><button className={`wave-switch-control ${parameters.showParticles ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.showParticles} onClick={() => toggleBoolean("showParticles")}><Check size={15} /><span>{parameters.showParticles ? copy.toggles.on : copy.toggles.off}</span><span className="wave-switch-track" aria-hidden="true"><span /></span></button></div>
          </div>
          <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements wave-measurements">
            <div className="wave-measurement-heading"><dt>{copy.measurements.waveA}</dt><dd>{renderedState ? `${formatNumber(renderedState.parameters.frequencyHz, locale, 1)} Hz` : "--"}</dd></div>
            <div><dt>{copy.measurements.period}</dt><dd>{renderedState ? formatNumber(renderedState.periodSeconds, locale, 2) : "--"}<small>s</small></dd></div><div><dt>{copy.measurements.wavelength}</dt><dd>{renderedState ? formatNumber(renderedState.wavelengthM, locale, 2) : "--"}<small>m</small></dd></div>
            {parameters.comparisonMode ? <><div className="wave-measurement-heading wave-b-heading"><dt>{copy.measurements.waveB}</dt><dd>{renderedState ? `${formatNumber(renderedState.parameters.comparisonFrequencyHz, locale, 1)} Hz` : "--"}</dd></div><div><dt>{copy.measurements.period}</dt><dd>{renderedState ? formatNumber(renderedState.comparisonPeriodSeconds, locale, 2) : "--"}<small>s</small></dd></div><div><dt>{copy.measurements.wavelength}</dt><dd>{renderedState ? formatNumber(renderedState.comparisonWavelengthM, locale, 2) : "--"}<small>m</small></dd></div></> : null}
            <div className="wave-speed-measurement"><dt>{copy.measurements.speed}</dt><dd>{renderedState ? formatNumber(renderedState.parameters.waveSpeedMs, locale, 1) : "--"}<small>m/s</small></dd></div>
          </dl></section>
          <section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section>
        </> : <>
          <div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div>
          <div className="narration-step-list" aria-label={commonCopy.narration.steps}>{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div>
          <section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as WaveStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as WaveStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as WaveStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section>
        </>}
      </aside>
    </section>

    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Experiment time" : "实验时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{commonCopy.actions.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></footer>
  </main>;
}
