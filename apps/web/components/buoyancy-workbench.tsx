"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  BUOYANCY_TANK_DEPTH_M,
  buoyancyDefaults,
  buoyancyParametersSchema,
  buoyancyTemplate,
  getBuoyancyExperimentDuration,
  inspectBuoyancy,
  solveBuoyancy,
  type BuoyancyOutcome,
  type BuoyancyParameters,
  type BuoyancyPhase,
  type BuoyancyProfile,
  type BuoyancyState,
  type BuoyancyTankState,
} from "@science-studio/templates/buoyancy";
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
type NumericParameterKey = "massKg" | "volumeLiters" | "fluidDensityKgM3" | "comparisonFluidDensityKgM3" | "gravityMs2";
type BuoyancyStepId = "object-density" | "displaced-volume" | "forces" | "predict" | "release" | "compare";
type BuoyancyStepText = Record<BuoyancyStepId, {title: string; caption: string}>;
type BuoyancyTextOverrides = Partial<Record<BuoyancyStepId, Partial<{title: string; caption: string}>>>;
type BuoyancyDurationOverrides = Partial<Record<BuoyancyStepId, number>>;

interface BuoyancyCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {comparisonMode: string; showForces: string};
  liquids: {oil: string; water: string; saltWater: string};
  toggles: {shown: string; hidden: string};
  outcome: Record<BuoyancyOutcome, string>;
  phase: Record<BuoyancyPhase, string>;
  measurements: {
    title: string;
    model: string;
    object: string;
    density: string;
    weight: string;
    tankA: string;
    tankB: string;
    displaced: string;
    submerged: string;
    buoyant: string;
    netForce: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    sameObject: string;
    tankA: string;
    tankB: string;
    objectDensity: string;
    fluidDensity: string;
    released: string;
    held: string;
    displacedVolume: string;
    submerged: string;
    equilibrium: string;
    weight: string;
    buoyancy: string;
    drag: string;
    normal: string;
    relationship: string;
    densityRule: string;
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
  narration: BuoyancyStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    denseTitle: string;
    denseDetail: string;
    matchingTitle: string;
    matchingDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const buoyancyCopy: Record<Locale, BuoyancyCopy> = {
  en: {
    projectName: "Density & Buoyancy",
    packName: "Middle School Pack",
    parameters: {massKg: "Object mass", volumeLiters: "Object volume", fluidDensityKgM3: "Fluid A density", comparisonFluidDensityKgM3: "Fluid B density", gravityMs2: "Gravity", comparisonMode: "Two-fluid comparison", showForces: "Force arrows"},
    liquids: {oil: "Oil", water: "Water", saltWater: "Salt water"},
    toggles: {shown: "Shown", hidden: "Hidden"},
    outcome: {float: "Float", suspend: "Suspend", sink: "Sink"},
    phase: {rising: "Rising", sinking: "Sinking", suspended: "Suspended", bobbing: "Floating / bobbing", floating: "Floating at equilibrium", bottom: "Resting on bottom"},
    measurements: {title: "Buoyancy measurements", model: "Vertical cube model", object: "Object", density: "Density", weight: "Weight", tankA: "Fluid A", tankB: "Fluid B", displaced: "Displaced volume", submerged: "Submerged", buoyant: "Buoyant force", netForce: "Net force"},
    canvas: {ariaLabel: "Two-fluid density and buoyancy comparison canvas", title: "Density & Buoyancy", subtitle: "Release the same object in two fluids and follow the changing displaced volume.", sameObject: "SAME OBJECT · TWO FLUIDS", tankA: "FLUID A", tankB: "FLUID B · COMPARISON", objectDensity: "OBJECT DENSITY", fluidDensity: "FLUID DENSITY", released: "RELEASED", held: "HELD UNDER SURFACE", displacedVolume: "DISPLACED", submerged: "SUBMERGED", equilibrium: "EQUILIBRIUM", weight: "W", buoyancy: "Fᵦ", drag: "Fᴅ", normal: "N", relationship: "ARCHIMEDES' PRINCIPLE", densityRule: "Compare object density with fluid density", invalid: "Fix the parameters to resume"},
    viewport: {ratio: "Canvas ratio", portrait: "Portrait 9:16", landscape: "Widescreen 16:9", zoomOut: "Zoom out", zoomIn: "Zoom in", move: "Move canvas", fit: "Fit canvas", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", canvasNavigation: "Canvas navigation"},
    narration: {
      "object-density": {title: "Calculate object density", caption: "Divide the object's mass by its volume before looking at either fluid."},
      "displaced-volume": {title: "Identify displaced fluid", caption: "Only the submerged part of the cube displaces fluid."},
      forces: {title: "Compare weight and buoyancy", caption: "Weight points down. Buoyant force points up and depends on displaced volume."},
      predict: {title: "Predict the outcome", caption: "Compare object density with each fluid density: float, suspend, or sink."},
      release: {title: "Release the object", caption: "Watch displaced volume and buoyant force change as the cube moves."},
      compare: {title: "Explain the two-fluid result", caption: "The object is unchanged; only fluid density changes the buoyant force and outcome."},
    },
    issues: {invalidTitle: "Invalid parameter", invalidDetail: "Check the highlighted input before running the experiment.", denseTitle: "Very dense object", denseDetail: "Check whether this mass-to-volume ratio is intended for the classroom material.", matchingTitle: "The comparison fluids match", matchingDetail: "Choose different fluid densities to make the comparison useful.", assumptionTitle: "Idealized vertical buoyancy model", assumptionDetail: "The cube stays upright in still fluid; surface tension, splashing, waves, rotation, and horizontal motion are ignored."},
  },
  "zh-CN": {
    projectName: "密度与浮力",
    packName: "初中物理实验包",
    parameters: {massKg: "物体质量", volumeLiters: "物体体积", fluidDensityKgM3: "液体 A 密度", comparisonFluidDensityKgM3: "液体 B 密度", gravityMs2: "重力加速度", comparisonMode: "双液体对照", showForces: "受力箭头"},
    liquids: {oil: "油", water: "水", saltWater: "盐水"},
    toggles: {shown: "显示", hidden: "隐藏"},
    outcome: {float: "上浮", suspend: "悬浮", sink: "下沉"},
    phase: {rising: "正在上浮", sinking: "正在下沉", suspended: "悬浮", bobbing: "漂浮并轻微起伏", floating: "漂浮平衡", bottom: "静止在槽底"},
    measurements: {title: "浮力测量", model: "竖直立方体模型", object: "物体", density: "密度", weight: "重力", tankA: "液体 A", tankB: "液体 B", displaced: "排液体积", submerged: "浸没比例", buoyant: "浮力", netForce: "合力"},
    canvas: {ariaLabel: "双液体密度与浮力对照实验画布", title: "密度与浮力", subtitle: "将同一物体释放到两种液体中，观察排液体积如何改变。", sameObject: "同一物体 · 两种液体", tankA: "液体 A", tankB: "液体 B · 对照", objectDensity: "物体密度", fluidDensity: "液体密度", released: "已释放", held: "保持浸没", displacedVolume: "排液体积", submerged: "浸没比例", equilibrium: "平衡位置", weight: "G", buoyancy: "F浮", drag: "F阻", normal: "N", relationship: "阿基米德原理", densityRule: "比较物体密度与液体密度", invalid: "修正参数后恢复实验"},
    viewport: {ratio: "画布比例", portrait: "竖屏 9:16", landscape: "宽屏 16:9", zoomOut: "缩小", zoomIn: "放大", move: "移动画布", fit: "适应画布", enterFullscreen: "进入全屏", exitFullscreen: "退出全屏", canvasNavigation: "画布导航"},
    narration: {
      "object-density": {title: "计算物体密度", caption: "观察液体前，先用物体质量除以体积。"},
      "displaced-volume": {title: "识别排开的液体", caption: "只有浸入液体的部分会排开液体。"},
      forces: {title: "比较重力和浮力", caption: "重力向下；浮力向上，并随排液体积改变。"},
      predict: {title: "预测运动结果", caption: "比较物体与两种液体的密度，判断上浮、悬浮或下沉。"},
      release: {title: "释放物体", caption: "观察物体运动时排液体积和浮力如何同步变化。"},
      compare: {title: "解释双液体结果", caption: "物体没有改变，只有液体密度改变了浮力和最终结果。"},
    },
    issues: {invalidTitle: "参数无法运行", invalidDetail: "运行实验前请检查高亮的参数。", denseTitle: "物体密度很大", denseDetail: "请确认当前质量和体积确实对应所需材料。", matchingTitle: "两种液体密度相同", matchingDetail: "请选择不同液体密度，使对照结果清晰。", assumptionTitle: "理想竖直浮力模型", assumptionDetail: "物体保持竖直，液体静止且均匀；忽略表面张力、水花、波动、旋转和水平运动。"},
  },
};

const liquidPresets = [
  {key: "oil", density: 850},
  {key: "water", density: 1000},
  {key: "saltWater", density: 1200},
] as const;

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
}

function buildNarration(copy: BuoyancyStepText, textOverrides: BuoyancyTextOverrides, durationOverrides: BuoyancyDurationOverrides): NarrationStep[] {
  return buoyancyTemplate.narration.map((definition) => {
    const id = definition.id as BuoyancyStepId;
    return {...definition, title: textOverrides[id]?.title ?? copy[id].title, caption: textOverrides[id]?.caption ?? copy[id].caption, durationSeconds: durationOverrides[id] ?? definition.durationSeconds};
  });
}

function localizeIssue(issue: ScienceIssue, copy: BuoyancyCopy): ScienceIssue {
  if (issue.id.startsWith("invalid-parameter")) return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "high-object-density") return {...issue, title: copy.issues.denseTitle, detail: copy.issues.denseDetail};
  if (issue.id === "matching-fluids") return {...issue, title: copy.issues.matchingTitle, detail: copy.issues.matchingDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function SvgArrowMarker({id, color}: {id: string; color: string}) {
  return <marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,7 L8,3.5 z" fill={color} /></marker>;
}

function ForceArrow({x, y, force, maxForce, direction, color, marker, label}: {x: number; y: number; force: number; maxForce: number; direction: "up" | "down"; color: string; marker: string; label: string}) {
  if (force < 0.04) return null;
  const length = 30 + Math.min(62, (force / Math.max(maxForce, 0.01)) * 62);
  const endY = y + (direction === "down" ? length : -length);
  return <g className="buoyancy-force-arrow"><line x1={x} x2={x} y1={y} y2={endY} stroke={color} markerEnd={`url(#${marker})`} /><text x={x + 9} y={(y + endY) / 2 + 4} fill={color}>{label}</text></g>;
}

function TankDiagram({profile, state, x, y, width, height, label, color, markerSuffix, copy, showForces, highlight}: {profile: BuoyancyProfile; state: BuoyancyTankState; x: number; y: number; width: number; height: number; label: string; color: string; markerSuffix: string; copy: BuoyancyCopy; showForces: boolean; highlight?: string[]}) {
  const tankTop = y + 45;
  const tankBottom = y + height - 22;
  const surfaceY = tankTop + 54;
  const waterHeight = tankBottom - surfaceY;
  const centerY = surfaceY - (state.centerPositionM / BUOYANCY_TANK_DEPTH_M) * waterHeight;
  const objectSize = Math.min(98, Math.max(62, 62 + ((profile.objectSideM - 0.079) / 0.103) * 36));
  const objectX = x + width / 2 - objectSize / 2;
  const objectY = centerY - objectSize / 2;
  const equilibriumY = state.equilibriumCenterPositionM === null ? null : surfaceY - (state.equilibriumCenterPositionM / BUOYANCY_TANK_DEPTH_M) * waterHeight;
  const maxForce = Math.max(profile.weightN, state.fullBuoyantForceN);
  const clipId = `tank-water-${markerSuffix}`;
  const outcomeColor = state.predictedOutcome === "float" ? "#167568" : state.predictedOutcome === "suspend" ? "#9a6a18" : "#b34f38";
  const displacementHighlighted = highlight?.includes("displacement");
  const forcesHighlighted = highlight?.includes("forces");
  const outcomeHighlighted = highlight?.includes("outcome") || highlight?.includes("comparison");

  return <g className="buoyancy-tank">
    <defs><clipPath id={clipId}><rect x={x + 2} y={surfaceY} width={width - 4} height={tankBottom - surfaceY} /></clipPath></defs>
    <text className="buoyancy-tank-label" x={x} y={y + 23}>{label}</text>
    <g className={`buoyancy-outcome-badge ${outcomeHighlighted ? "highlighted" : ""}`} transform={`translate(${x + width - 138} ${y + 5})`}><rect width="138" height="30" rx="5" fill={outcomeColor} /><text x="69" y="20" textAnchor="middle">{copy.outcome[state.predictedOutcome].toUpperCase()}</text></g>
    <path className="buoyancy-tank-glass" d={`M${x},${tankTop} L${x},${tankBottom} Q${x},${tankBottom + 12} ${x + 12},${tankBottom + 12} L${x + width - 12},${tankBottom + 12} Q${x + width},${tankBottom + 12} ${x + width},${tankBottom} L${x + width},${tankTop}`} />
    <rect className="buoyancy-fluid" x={x + 2} y={surfaceY} width={width - 4} height={tankBottom - surfaceY} fill={color} />
    <line className="buoyancy-surface" x1={x + 2} x2={x + width - 2} y1={surfaceY} y2={surfaceY} />
    {equilibriumY !== null ? <g className="buoyancy-equilibrium"><line x1={x + 16} x2={x + width - 16} y1={equilibriumY} y2={equilibriumY} /><text x={x + width - 20} y={equilibriumY - 7} textAnchor="end">{copy.canvas.equilibrium} · {Math.round(state.equilibriumSubmergedFraction * 100)}%</text></g> : null}
    <rect className="buoyancy-object" x={objectX} y={objectY} width={objectSize} height={objectSize} rx="7" />
    <rect className={`buoyancy-object-submerged ${displacementHighlighted ? "highlighted" : ""}`} x={objectX} y={objectY} width={objectSize} height={objectSize} rx="7" clipPath={`url(#${clipId})`} />
    <line className="buoyancy-object-center" x1={objectX + 12} x2={objectX + objectSize - 12} y1={centerY} y2={centerY} />
    <text className="buoyancy-object-density" x={objectX + objectSize / 2} y={centerY + 4} textAnchor="middle">{Math.round(profile.objectDensityKgM3)}</text>
    <g className="buoyancy-displacement-readout" transform={`translate(${x + 14} ${tankBottom - 52})`}><text>{copy.canvas.displacedVolume}</text><text y="19">{formatNumber(state.displacedVolumeM3 * 1000, "en", 2)} L · {Math.round(state.submergedFraction * 100)}%</text></g>
    <text className="buoyancy-fluid-density" x={x + width - 14} y={tankBottom - 36} textAnchor="end">ρ = {Math.round(state.fluidDensityKgM3)} kg/m³</text>
    <text className="buoyancy-phase" x={x + width - 14} y={tankBottom - 16} textAnchor="end">{copy.phase[state.phase].toUpperCase()}</text>
    {showForces ? <g className={forcesHighlighted ? "buoyancy-forces highlighted" : "buoyancy-forces"}>
      <ForceArrow x={objectX + objectSize * 0.3} y={centerY} force={state.buoyantForceN} maxForce={maxForce} direction="up" color="#2678b8" marker={`buoyancy-up-${markerSuffix}`} label={copy.canvas.buoyancy} />
      <ForceArrow x={objectX + objectSize * 0.7} y={centerY} force={profile.weightN} maxForce={maxForce} direction="down" color="#d0543d" marker={`buoyancy-down-${markerSuffix}`} label={copy.canvas.weight} />
      <ForceArrow x={objectX + objectSize + 17} y={centerY} force={Math.abs(state.dragForceN)} maxForce={maxForce} direction={state.dragForceN >= 0 ? "up" : "down"} color="#6d7270" marker={`buoyancy-drag-${markerSuffix}`} label={copy.canvas.drag} />
      <ForceArrow x={objectX + objectSize * 0.5} y={objectY + objectSize} force={state.normalForceN} maxForce={maxForce} direction="up" color="#23866f" marker={`buoyancy-normal-${markerSuffix}`} label={copy.canvas.normal} />
    </g> : null}
    <text className="buoyancy-tank-density" x={x + 14} y={surfaceY - 14}>{copy.canvas.fluidDensity}: {Math.round(state.fluidDensityKgM3)} kg/m³</text>
  </g>;
}

function BuoyancyCanvas({state, locale, aspectRatio, narrationStep, narrationStepIndex, narrationStepCount}: {state: BuoyancyState | null; locale: Locale; aspectRatio: CanvasAspectRatio; narrationStep?: NarrationStep; narrationStepIndex?: number; narrationStepCount?: number}) {
  const copy = buoyancyCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const plotX = landscape ? 72 : 54;
  const primaryX = landscape ? 72 : 54;
  const primaryY = landscape ? 145 : 170;
  const tankWidth = landscape ? (state?.parameters.comparisonMode ? 532 : 760) : 612;
  const tankHeight = landscape ? 348 : 352;
  const comparisonX = landscape ? 676 : 54;
  const comparisonY = landscape ? 145 : 560;
  const formulaY = landscape ? 540 : 980;
  const highlights = narrationStep?.highlights;

  return <svg className="buoyancy-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="buoyancy-canvas-title buoyancy-canvas-description">
    <title id="buoyancy-canvas-title">{copy.canvas.ariaLabel}</title><desc id="buoyancy-canvas-description">{copy.canvas.subtitle}</desc>
    <defs>
      <linearGradient id="buoyancy-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fbfa" /><stop offset="1" stopColor="#edf5f3" /></linearGradient>
      {(["a", "b"] as const).flatMap((suffix) => [<SvgArrowMarker id={`buoyancy-up-${suffix}`} color="#2678b8" key={`up-${suffix}`} />, <SvgArrowMarker id={`buoyancy-down-${suffix}`} color="#d0543d" key={`down-${suffix}`} />, <SvgArrowMarker id={`buoyancy-drag-${suffix}`} color="#6d7270" key={`drag-${suffix}`} />, <SvgArrowMarker id={`buoyancy-normal-${suffix}`} color="#23866f" key={`normal-${suffix}`} />])}
    </defs>
    <rect width={viewWidth} height={viewHeight} fill="url(#buoyancy-paper)" />
    <text className="buoyancy-eyebrow" x={plotX} y={landscape ? 48 : 58}>SCIENCE STUDIO · FLUIDS</text>
    <text className="buoyancy-title" x={plotX} y={landscape ? 88 : 98}>{copy.canvas.title}</text>
    <text className="buoyancy-subtitle" x={plotX} y={landscape ? 116 : 132}>{copy.canvas.subtitle}</text>
    {state ? <>
      <g className={`buoyancy-object-summary ${highlights?.includes("density") ? "highlighted" : ""}`} transform={`translate(${viewWidth - (landscape ? 365 : 304)} ${landscape ? 48 : 54})`}><rect width={landscape ? 292 : 250} height="66" rx="7" /><text x="18" y="23">{copy.canvas.sameObject}</text><text className="buoyancy-summary-value" x="18" y="48">ρ = {Math.round(state.objectDensityKgM3)} kg/m³</text><text className="buoyancy-summary-small" x={landscape ? 274 : 232} y="48" textAnchor="end">{formatNumber(state.parameters.massKg, "en", 1)} kg · {formatNumber(state.parameters.volumeLiters, "en", 1)} L</text></g>
      <TankDiagram profile={state} state={state.primaryState} x={state.parameters.comparisonMode ? primaryX : landscape ? 260 : primaryX} y={primaryY} width={tankWidth} height={tankHeight} label={copy.canvas.tankA} color="#80c6d5" markerSuffix="a" copy={copy} showForces={state.parameters.showForces} highlight={highlights} />
      {state.parameters.comparisonMode ? <TankDiagram profile={state} state={state.comparisonState} x={comparisonX} y={comparisonY} width={tankWidth} height={tankHeight} label={copy.canvas.tankB} color="#a9c79f" markerSuffix="b" copy={copy} showForces={state.parameters.showForces} highlight={highlights} /> : null}
      <g className={`buoyancy-formula-panel ${highlights?.includes("forces") || highlights?.includes("displacement") ? "highlighted" : ""}`} transform={`translate(${plotX} ${formulaY})`}><rect width={viewWidth - plotX * 2} height={landscape ? 106 : 186} rx="8" /><text className="buoyancy-formula-kicker" x="22" y="25">{copy.canvas.relationship}</text><text className="buoyancy-formula" x="22" y="58">Fᵦ = ρfluid · Vdisplaced · g</text><text className="buoyancy-density-formula" x={landscape ? 430 : 22} y={landscape ? 58 : 101}>ρobject = m / V = {Math.round(state.objectDensityKgM3)} kg/m³</text><text className="buoyancy-formula-result" x="22" y={landscape ? 88 : 142}>A: {formatNumber(state.primaryState.buoyantForceN, "en", 2)} N · {Math.round(state.primaryState.submergedFraction * 100)}% {copy.canvas.submerged.toLowerCase()}</text>{state.parameters.comparisonMode ? <text className="buoyancy-formula-result comparison" x={landscape ? 580 : 22} y={landscape ? 88 : 170}>B: {formatNumber(state.comparisonState.buoyantForceN, "en", 2)} N · {Math.round(state.comparisonState.submergedFraction * 100)}% {copy.canvas.submerged.toLowerCase()}</text> : null}</g>
    </> : <g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g>}
    {narrationStep ? <g className="narration-overlay buoyancy-narration-overlay"><text className="narration-step-number" x={plotX} y={viewHeight - 72}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={plotX + 90} y={viewHeight - 74}>{narrationStep.title}</text><text className="narration-step-caption" x={plotX + 90} y={viewHeight - 42}>{narrationStep.caption}</text></g> : null}
  </svg>;
}

export function BuoyancyWorkbench() {
  const [parameters, setParameters] = useState<BuoyancyParameters>(buoyancyDefaults);
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
  const [textOverrides, setTextOverrides] = useState<BuoyancyTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<BuoyancyDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);
  const copy = buoyancyCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => buoyancyParametersSchema.safeParse(parameters), [parameters]);
  const experimentDuration = useMemo(() => parsedParameters.success ? getBuoyancyExperimentDuration(parsedParameters.data) : 1, [parsedParameters]);
  const narrationSteps = useMemo(() => buildNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(narrationSteps, narrationTimeSeconds, experimentDuration);
  const simulationTime = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveBuoyancy(parsedParameters.data, simulationTime) : null, [parsedParameters, simulationTime]);
  const issues = useMemo(() => inspectBuoyancy(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : experimentDuration;
  const numericDefinitions = buoyancyTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

  useEffect(() => {const stored = window.localStorage.getItem("science-studio-locale"); if (stored === "en" || stored === "zh-CN") setLocale(stored);}, []);
  useEffect(() => {const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current); document.addEventListener("fullscreenchange", onFullscreen); return () => document.removeEventListener("fullscreenchange", onFullscreen);}, []);
  useEffect(() => {
    if (!isPlaying) {lastTimestampRef.current = null; if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); return;}
    const tick = (timestamp: number) => {const previous = lastTimestampRef.current ?? timestamp; lastTimestampRef.current = timestamp; const delta = ((timestamp - previous) / 1000) * speed; const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; setter((current) => {const limit = mode === "narration" ? narrationDuration : experimentDuration; const next = Math.min(limit, current + delta); if (next >= limit) setIsPlaying(false); return next;}); animationRef.current = requestAnimationFrame(tick);};
    animationRef.current = requestAnimationFrame(tick); return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [experimentDuration, isPlaying, mode, narrationDuration, speed]);

  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {setParameters((current) => ({...current, [key]: value})); setTimeSeconds(0); setIsPlaying(false);}, []);
  const setLiquidPreset = useCallback((key: "fluidDensityKgM3" | "comparisonFluidDensityKgM3", density: number) => {setParameters((current) => ({...current, [key]: density})); setTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleBoolean = useCallback((key: "comparisonMode" | "showForces") => setParameters((current) => ({...current, [key]: !current[key]})), []);
  const stopAndResetTime = useCallback(() => {setIsPlaying(false); if (mode === "narration") setNarrationTimeSeconds(0); else setTimeSeconds(0);}, [mode]);
  const step = useCallback((direction: -1 | 1) => {setIsPlaying(false); const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; const limit = mode === "narration" ? narrationDuration : experimentDuration; setter((current) => Math.min(limit, Math.max(0, current + direction / FPS)));}, [experimentDuration, mode, narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {setIsPlaying(false); setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));}, [narrationSteps]);
  const updateNarrationText = useCallback((id: BuoyancyStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: BuoyancyStepId, value: number) => {if (Number.isFinite(value)) setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));}, []);
  const restoreNarrationDefaults = useCallback(() => {setTextOverrides({}); setDurationOverrides({}); setNarrationTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleLocale = useCallback(() => setLocale((current) => {const next = current === "en" ? "zh-CN" : "en"; window.localStorage.setItem("science-studio-locale", next); document.documentElement.lang = next; return next;}), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {if (atZoom <= 1) return {x: 0, y: 0}; const width = stageAreaRef.current?.clientWidth ?? 900; const height = stageAreaRef.current?.clientHeight ?? 600; const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35); const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35); return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};}, []);
  const resetCanvasView = useCallback(() => {setZoom(1); setPan({x: 0, y: 0}); setPanMode(false); setIsDraggingCanvas(false); panDragRef.current = null;}, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))); setPan((currentPan) => clampPan(currentPan, next)); if (next <= 1) setPanMode(false); return next;}), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {setAspectRatio(next); resetCanvasView();}, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen(); else await workbenchRef.current?.requestFullscreen();}, []);

  return <main className={`workbench-shell buoyancy-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar"><div className="project-identity"><ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="buoyancy-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div><nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav><div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div></header>
    <section className="workspace"><div className="stage-area buoyancy-stage-area" ref={stageAreaRef}><div className="stage-meta buoyancy-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="buoyancy-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div>
      <div className={`buoyancy-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation} onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}} onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}} onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}} onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}} onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}} onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}><BuoyancyCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} /></div></div>
      <aside className="parameter-panel">{mode === "experiment" ? <><div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div><div className="parameter-list">{numericDefinitions.map((definition) => {const disabled = definition.key === "comparisonFluidDensityKgM3" && !parameters.comparisonMode; const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; const fluidKey = definition.key === "fluidDensityKgM3" || definition.key === "comparisonFluidDensityKgM3" ? definition.key : null; return <div className={`parameter-control ${disabled ? "disabled" : ""}`} key={definition.key}><div className="parameter-row"><label htmlFor={`buoyancy-${definition.key}`}>{label}</label><div className="number-field"><input id={`buoyancy-${definition.key}`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} disabled={disabled} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} disabled={disabled} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{fluidKey ? <div className="buoyancy-liquid-presets">{liquidPresets.map((preset) => <button className={parameters[fluidKey] === preset.density ? "active" : ""} type="button" disabled={disabled} onClick={() => setLiquidPreset(fluidKey, preset.density)} key={preset.key}>{copy.liquids[preset.key]}</button>)}</div> : null}{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}<div className="parameter-control buoyancy-toggle-parameter"><span className="buoyancy-control-label">{copy.parameters.comparisonMode}</span><button className={`buoyancy-switch-control ${parameters.comparisonMode ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.comparisonMode} onClick={() => toggleBoolean("comparisonMode")}><Check size={15} /><span>{parameters.comparisonMode ? copy.toggles.shown : copy.toggles.hidden}</span><span className="buoyancy-switch-track"><span /></span></button></div><div className="parameter-control buoyancy-toggle-parameter"><span className="buoyancy-control-label">{copy.parameters.showForces}</span><button className={`buoyancy-switch-control ${parameters.showForces ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.showForces} onClick={() => toggleBoolean("showForces")}><Check size={15} /><span>{parameters.showForces ? copy.toggles.shown : copy.toggles.hidden}</span><span className="buoyancy-switch-track"><span /></span></button></div></div>
        <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements buoyancy-measurements"><div className="buoyancy-measurement-heading object"><dt>{copy.measurements.object}</dt><dd>{renderedState ? `${Math.round(renderedState.objectDensityKgM3)} kg/m³` : "--"}</dd></div><div><dt>{copy.measurements.weight}</dt><dd>{renderedState ? formatNumber(renderedState.weightN, locale, 2) : "--"}<small>N</small></dd></div><div><dt>{copy.measurements.density}</dt><dd>{renderedState ? Math.round(renderedState.objectDensityKgM3) : "--"}<small>kg/m³</small></dd></div>{renderedState ? <TankMeasurements title={copy.measurements.tankA} state={renderedState.primaryState} copy={copy} locale={locale} /> : null}{renderedState && parameters.comparisonMode ? <TankMeasurements title={copy.measurements.tankB} state={renderedState.comparisonState} copy={copy} locale={locale} comparison /> : null}</dl></section><section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section></> : <><div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div><div className="narration-step-list">{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div><section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as BuoyancyStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as BuoyancyStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as BuoyancyStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section></>}</aside></section>
    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Experiment time" : "实验时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{commonCopy.actions.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></footer>
  </main>;
}

function TankMeasurements({title, state, copy, locale, comparison = false}: {title: string; state: BuoyancyTankState; copy: BuoyancyCopy; locale: Locale; comparison?: boolean}) {
  return <><div className={`buoyancy-measurement-heading ${comparison ? "comparison" : ""}`}><dt>{title}</dt><dd>{copy.outcome[state.predictedOutcome]}</dd></div><div><dt>{copy.measurements.displaced}</dt><dd>{formatNumber(state.displacedVolumeM3 * 1000, locale, 2)}<small>L</small></dd></div><div><dt>{copy.measurements.submerged}</dt><dd>{Math.round(state.submergedFraction * 100)}<small>%</small></dd></div><div><dt>{copy.measurements.buoyant}</dt><dd>{formatNumber(state.buoyantForceN, locale, 2)}<small>N</small></dd></div><div><dt>{copy.measurements.netForce}</dt><dd>{formatNumber(state.netForceN, locale, 2)}<small>N</small></dd></div></>;
}
