"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  getMomentumCollisionExperimentDuration,
  inspectMomentumCollision,
  momentumCollisionDefaults,
  momentumCollisionParametersSchema,
  momentumCollisionTemplate,
  solveMomentumCollision,
  type CollisionKind,
  type CollisionPhase,
  type MomentumCollisionParameters,
  type MomentumCollisionState,
} from "@science-studio/templates/momentum-collision";
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
import {getNarrationDuration, getNarrationStepStart, resolveNarrationFrame} from "../lib/narration";
import {CanvasTextSizeControls} from "./canvas-text-size-controls";

const FPS = 30;
type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "mass1Kg" | "mass2Kg" | "initialVelocity1Ms" | "initialVelocity2Ms" | "restitutionCoefficient";
type CollisionStepId = "initial-state" | "system-momentum" | "collision-type" | "predict" | "impact" | "compare";
type CollisionStepText = Record<CollisionStepId, {title: string; caption: string}>;
type CollisionTextOverrides = Partial<Record<CollisionStepId, Partial<{title: string; caption: string}>>>;
type CollisionDurationOverrides = Partial<Record<CollisionStepId, number>>;

interface CollisionCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {showVelocityVectors: string};
  presets: {elastic: string; inelastic: string; stick: string};
  toggles: {shown: string; hidden: string};
  kind: Record<CollisionKind, string>;
  phase: Record<CollisionPhase, string>;
  measurements: {
    title: string;
    model: string;
    system: string;
    phase: string;
    momentum: string;
    kineticEnergy: string;
    cart1: string;
    cart2: string;
    finalVelocity: string;
    impulse: string;
    energyChange: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    cart1: string;
    cart2: string;
    frictionlessTrack: string;
    before: string;
    after: string;
    momentumLedger: string;
    total: string;
    prediction: string;
    conserved: string;
    kineticEnergy: string;
    energyLoss: string;
    impact: string;
    noImpact: string;
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
  narration: CollisionStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    noCollisionTitle: string;
    noCollisionDetail: string;
    lateCollisionTitle: string;
    lateCollisionDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const collisionCopy: Record<Locale, CollisionCopy> = {
  en: {
    projectName: "Momentum & Collisions",
    packName: "Middle School Pack",
    parameters: {mass1Kg: "Cart A mass", mass2Kg: "Cart B mass", initialVelocity1Ms: "Cart A initial velocity", initialVelocity2Ms: "Cart B initial velocity", restitutionCoefficient: "Restitution coefficient", showVelocityVectors: "Velocity vectors"},
    presets: {elastic: "Elastic", inelastic: "Partly inelastic", stick: "Stick together"},
    toggles: {shown: "Shown", hidden: "Hidden"},
    kind: {elastic: "Elastic", inelastic: "Partly inelastic", "perfectly-inelastic": "Perfectly inelastic"},
    phase: {approaching: "Approaching", impact: "Impact", separating: "Separating", joined: "Moving together", "no-collision": "No collision"},
    measurements: {title: "Collision measurements", model: "1D frictionless track", system: "Two-cart system", phase: "Phase", momentum: "Total momentum", kineticEnergy: "Kinetic energy", cart1: "Cart A", cart2: "Cart B", finalVelocity: "Final velocity", impulse: "Impulse", energyChange: "Kinetic-energy change"},
    canvas: {ariaLabel: "One-dimensional momentum and collision experiment", title: "Momentum & Collisions", subtitle: "Track two carts through impact. Momentum is conserved; kinetic energy may not be.", cart1: "CART A", cart2: "CART B", frictionlessTrack: "HORIZONTAL FRICTIONLESS TRACK", before: "BEFORE", after: "AFTER", momentumLedger: "MOMENTUM LEDGER", total: "TOTAL", prediction: "COLLISION MODEL", conserved: "SYSTEM MOMENTUM CONSERVED", kineticEnergy: "KINETIC ENERGY", energyLoss: "converted to internal energy", impact: "IMPACT", noImpact: "NO IMPACT IN THIS SETUP", invalid: "Fix the parameters to resume"},
    viewport: {ratio: "Canvas ratio", portrait: "Portrait 9:16", landscape: "Widescreen 16:9", zoomOut: "Zoom out", zoomIn: "Zoom in", move: "Move canvas", fit: "Fit canvas", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", canvasNavigation: "Canvas navigation"},
    narration: {
      "initial-state": {title: "Record the initial state", caption: "Direction matters: right is positive, and left is negative."},
      "system-momentum": {title: "Add both momenta", caption: "Treat both carts as one system and calculate p = mv for each cart."},
      "collision-type": {title: "Choose the collision type", caption: "The restitution coefficient sets how quickly the carts separate after impact."},
      predict: {title: "Predict the final velocities", caption: "Use momentum conservation together with the restitution relationship."},
      impact: {title: "Watch the impact", caption: "The carts receive equal and opposite impulses during the same brief interaction."},
      compare: {title: "Compare before and after", caption: "Total momentum matches. Kinetic energy only matches for a perfectly elastic collision."},
    },
    issues: {invalidTitle: "Invalid parameter", invalidDetail: "Check the highlighted input before running the experiment.", noCollisionTitle: "The carts will not collide", noCollisionDetail: "Cart A must approach Cart B faster than Cart B moves away.", lateCollisionTitle: "Impact is outside the timeline", lateCollisionDetail: "Increase the relative approach speed so the collision occurs within 20 seconds.", assumptionTitle: "Ideal one-dimensional collision", assumptionDetail: "The track is horizontal and frictionless; rotation, deformation, sound, and external horizontal forces are ignored."},
  },
  "zh-CN": {
    projectName: "动量与碰撞",
    packName: "初中物理实验包",
    parameters: {mass1Kg: "小车 A 质量", mass2Kg: "小车 B 质量", initialVelocity1Ms: "小车 A 初速度", initialVelocity2Ms: "小车 B 初速度", restitutionCoefficient: "恢复系数", showVelocityVectors: "速度矢量"},
    presets: {elastic: "弹性碰撞", inelastic: "部分非弹性", stick: "碰后粘连"},
    toggles: {shown: "显示", hidden: "隐藏"},
    kind: {elastic: "弹性碰撞", inelastic: "部分非弹性碰撞", "perfectly-inelastic": "完全非弹性碰撞"},
    phase: {approaching: "正在接近", impact: "碰撞瞬间", separating: "正在分离", joined: "共同运动", "no-collision": "不会碰撞"},
    measurements: {title: "碰撞测量", model: "一维无摩擦轨道", system: "双小车系统", phase: "阶段", momentum: "总动量", kineticEnergy: "动能", cart1: "小车 A", cart2: "小车 B", finalVelocity: "末速度", impulse: "冲量", energyChange: "动能变化"},
    canvas: {ariaLabel: "一维动量与碰撞实验", title: "动量与碰撞", subtitle: "追踪两辆小车的碰撞过程：系统动量守恒，但动能不一定守恒。", cart1: "小车 A", cart2: "小车 B", frictionlessTrack: "水平无摩擦轨道", before: "碰撞前", after: "碰撞后", momentumLedger: "动量对照", total: "总计", prediction: "碰撞模型", conserved: "系统总动量守恒", kineticEnergy: "动能", energyLoss: "转化为内能", impact: "碰撞", noImpact: "当前设置不会发生碰撞", invalid: "修正参数后恢复实验"},
    viewport: {ratio: "画布比例", portrait: "竖屏 9:16", landscape: "宽屏 16:9", zoomOut: "缩小", zoomIn: "放大", move: "移动画布", fit: "适应画布", enterFullscreen: "进入全屏", exitFullscreen: "退出全屏", canvasNavigation: "画布导航"},
    narration: {
      "initial-state": {title: "记录初始状态", caption: "方向会影响符号：向右为正，向左为负。"},
      "system-momentum": {title: "求系统总动量", caption: "把两辆小车看作一个系统，分别用 p = mv 计算动量。"},
      "collision-type": {title: "选择碰撞类型", caption: "恢复系数决定碰撞后两车相互分离的相对速度。"},
      predict: {title: "预测末速度", caption: "联立动量守恒与恢复系数关系，计算两车末速度。"},
      impact: {title: "观察碰撞瞬间", caption: "短暂相互作用中，两辆小车受到大小相等、方向相反的冲量。"},
      compare: {title: "比较碰撞前后", caption: "总动量相同；只有完全弹性碰撞的动能也保持不变。"},
    },
    issues: {invalidTitle: "参数无法运行", invalidDetail: "运行实验前请检查高亮的参数。", noCollisionTitle: "两辆小车不会碰撞", noCollisionDetail: "小车 A 必须以更大的相对速度接近小车 B。", lateCollisionTitle: "碰撞超出时间轴", lateCollisionDetail: "请增大相对接近速度，使碰撞在 20 秒内发生。", assumptionTitle: "理想一维碰撞模型", assumptionDetail: "轨道水平且无摩擦；忽略旋转、形变、声音和外部水平力。"},
  },
};

const collisionPresets = [
  {key: "elastic", value: 1},
  {key: "inelastic", value: 0.5},
  {key: "stick", value: 0},
] as const;

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
}

function formatSigned(value: number, locale: Locale, digits = 2) {
  const rounded = Math.abs(value) < 0.5 * 10 ** -digits ? 0 : value;
  return `${rounded > 0 ? "+" : ""}${formatNumber(rounded, locale, digits)}`;
}

function buildNarration(copy: CollisionStepText, textOverrides: CollisionTextOverrides, durationOverrides: CollisionDurationOverrides): NarrationStep[] {
  return momentumCollisionTemplate.narration.map((definition) => {
    const id = definition.id as CollisionStepId;
    return {...definition, title: textOverrides[id]?.title ?? copy[id].title, caption: textOverrides[id]?.caption ?? copy[id].caption, durationSeconds: durationOverrides[id] ?? definition.durationSeconds};
  });
}

function localizeIssue(issue: ScienceIssue, copy: CollisionCopy): ScienceIssue {
  if (issue.id.startsWith("invalid-parameter")) return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "no-collision") return {...issue, title: copy.issues.noCollisionTitle, detail: copy.issues.noCollisionDetail};
  if (issue.id === "late-collision") return {...issue, title: copy.issues.lateCollisionTitle, detail: copy.issues.lateCollisionDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function ArrowMarker({id, color}: {id: string; color: string}) {
  return <marker id={id} markerWidth="9" markerHeight="9" refX="7" refY="3.5" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,7 L8,3.5 z" fill={color} /></marker>;
}

function VelocityArrow({centerX, y, velocity, color, label, marker}: {centerX: number; y: number; velocity: number; color: string; label: string; marker: string}) {
  const direction = Math.sign(velocity);
  if (direction === 0) return <g className="collision-velocity zero"><circle cx={centerX} cy={y} r="4" fill={color} /><text x={centerX} y={y - 13} textAnchor="middle">{label} = 0.00 m/s</text></g>;
  const length = 54 + Math.min(86, Math.abs(velocity) / 4 * 86);
  const endX = centerX + direction * length;
  return <g className="collision-velocity"><line x1={centerX} y1={y} x2={endX} y2={y} stroke={color} markerEnd={`url(#${marker})`} /><text x={(centerX + endX) / 2} y={y - 13} textAnchor="middle" fill={color}>{label} = {formatSigned(velocity, "en")} m/s</text></g>;
}

function Cart({x, trackY, mass, label, velocity, color, marker, showVelocity, bodyWidth, arrowLift}: {x: number; trackY: number; mass: number; label: string; velocity: number; color: string; marker: string; showVelocity: boolean; bodyWidth: number; arrowLift: number}) {
  const bodyHeight = 58 + (mass - 0.5) / 4.5 * 24;
  const bodyY = trackY - bodyHeight - 22;
  return <g className="collision-cart" transform={`translate(${x} 0)`}>
    {showVelocity ? <VelocityArrow centerX={0} y={bodyY - arrowLift} velocity={velocity} color={color} marker={marker} label="v" /> : null}
    <rect x={-bodyWidth / 2} y={bodyY} width={bodyWidth} height={bodyHeight} rx="6" fill={color} />
    <rect className="collision-cart-window" x={-bodyWidth * 0.27} y={bodyY + 13} width={bodyWidth * 0.54} height="19" rx="3" />
    <text className="collision-cart-label" x="0" y={bodyY + bodyHeight - 12} textAnchor="middle">{label}</text>
    <circle className="collision-wheel" cx={-bodyWidth * 0.28} cy={trackY - 9} r={Math.min(11, bodyWidth * 0.18)} /><circle className="collision-wheel" cx={bodyWidth * 0.28} cy={trackY - 9} r={Math.min(11, bodyWidth * 0.18)} />
  </g>;
}

function MomentumRow({label, value, maxMagnitude, x, y, width, color}: {label: string; value: number; maxMagnitude: number; x: number; y: number; width: number; color: string}) {
  const barLeft = x + 44;
  const barRight = x + width - 94;
  const center = (barLeft + barRight) / 2;
  const barMax = (barRight - barLeft) / 2;
  const barWidth = Math.max(value === 0 ? 0 : 2, Math.abs(value) / maxMagnitude * barMax);
  return <g className="collision-momentum-row"><text x={x} y={y + 5}>{label}</text><line x1={barLeft} y1={y} x2={barRight} y2={y} /><line className="collision-zero-axis" x1={center} y1={y - 9} x2={center} y2={y + 9} />{value !== 0 ? <rect x={value > 0 ? center : center - barWidth} y={y - 7} width={barWidth} height="14" rx="3" fill={color} /> : null}<text className="collision-momentum-value" x={x + width} y={y + 5} textAnchor="end">{formatSigned(value, "en")} kg·m/s</text></g>;
}

function MomentumLedger({state, x, y, width, height, copy, highlighted}: {state: MomentumCollisionState; x: number; y: number; width: number; height: number; copy: CollisionCopy; highlighted: boolean}) {
  const gap = 28;
  const columnWidth = (width - gap - 36) / 2;
  const leftX = x + 18;
  const rightX = leftX + columnWidth + gap;
  const maxMagnitude = Math.max(0.1, Math.abs(state.initialMomentum1KgMs), Math.abs(state.initialMomentum2KgMs), Math.abs(state.initialTotalMomentumKgMs), Math.abs(state.finalMomentum1KgMs), Math.abs(state.finalMomentum2KgMs), Math.abs(state.finalTotalMomentumKgMs));
  return <g className={`collision-ledger ${highlighted ? "highlighted" : ""}`}><rect x={x} y={y} width={width} height={height} rx="8" /><text className="collision-panel-kicker" x={x + 18} y={y + 25}>{copy.canvas.momentumLedger}</text><g transform={`translate(0 ${y + 47})`}><text className="collision-column-title" x={leftX}> {copy.canvas.before}</text><text className="collision-column-title" x={rightX}>{copy.canvas.after}</text>
    <MomentumRow label="pA" value={state.initialMomentum1KgMs} maxMagnitude={maxMagnitude} x={leftX} y={34} width={columnWidth} color="#168d8b" />
    <MomentumRow label="pB" value={state.initialMomentum2KgMs} maxMagnitude={maxMagnitude} x={leftX} y={72} width={columnWidth} color="#df6a45" />
    <MomentumRow label={`Σp`} value={state.initialTotalMomentumKgMs} maxMagnitude={maxMagnitude} x={leftX} y={112} width={columnWidth} color="#273b48" />
    <MomentumRow label="pA" value={state.finalMomentum1KgMs} maxMagnitude={maxMagnitude} x={rightX} y={34} width={columnWidth} color="#168d8b" />
    <MomentumRow label="pB" value={state.finalMomentum2KgMs} maxMagnitude={maxMagnitude} x={rightX} y={72} width={columnWidth} color="#df6a45" />
    <MomentumRow label={`Σp`} value={state.finalTotalMomentumKgMs} maxMagnitude={maxMagnitude} x={rightX} y={112} width={columnWidth} color="#273b48" />
  </g><g className="collision-conserved-badge" transform={`translate(${x + width - 242} ${y + 11})`}><Check size={13} /><text x="22" y="13">{copy.canvas.conserved}</text></g></g>;
}

function CollisionCanvas({state, locale, aspectRatio, narrationStep, narrationStepIndex, narrationStepCount}: {state: MomentumCollisionState | null; locale: Locale; aspectRatio: CanvasAspectRatio; narrationStep?: NarrationStep; narrationStepIndex?: number; narrationStepCount?: number}) {
  const copy = collisionCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const margin = landscape ? 68 : 52;
  const trackY = landscape ? 330 : 445;
  const plotLeft = margin + 38;
  const plotRight = viewWidth - margin - 38;
  const worldMin = -7;
  const worldMax = 7;
  const toX = (positionM: number) => plotLeft + (Math.max(worldMin, Math.min(worldMax, positionM)) - worldMin) / (worldMax - worldMin) * (plotRight - plotLeft);
  const cartPixelLength = toX(1) - toX(0);
  const ledgerX = margin;
  const ledgerY = landscape ? 402 : 535;
  const ledgerWidth = landscape ? 746 : viewWidth - margin * 2;
  const ledgerHeight = landscape ? 224 : 250;
  const formulaX = landscape ? 846 : margin;
  const formulaY = landscape ? 402 : 825;
  const formulaWidth = landscape ? 366 : viewWidth - margin * 2;
  const formulaHeight = landscape ? 224 : 210;
  const highlights = narrationStep?.highlights ?? [];
  const impactX = state?.collisionPosition1M === null || state?.collisionPosition2M === null ? viewWidth / 2 : toX(((state?.collisionPosition1M ?? 0) + (state?.collisionPosition2M ?? 0)) / 2);

  return <svg className="collision-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="collision-canvas-title collision-canvas-description">
    <title id="collision-canvas-title">{copy.canvas.ariaLabel}</title><desc id="collision-canvas-description">{copy.canvas.subtitle}</desc>
    <defs><linearGradient id="collision-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8faf7" /><stop offset="1" stopColor="#edf2ee" /></linearGradient><ArrowMarker id="cart-a-velocity" color="#147f80" /><ArrowMarker id="cart-b-velocity" color="#c95235" /></defs>
    <rect width={viewWidth} height={viewHeight} fill="url(#collision-paper)" />
    <text className="collision-eyebrow" x={margin} y={landscape ? 47 : 58}>SCIENCE STUDIO · MECHANICS</text>
    <text className="collision-title" x={margin} y={landscape ? 89 : 102}>{copy.canvas.title}</text>
    <text className="collision-subtitle" x={margin} y={landscape ? 119 : 137}>{copy.canvas.subtitle}</text>
    {state ? <>
      <g className="collision-status" transform={`translate(${viewWidth - margin - (landscape ? 250 : 220)} ${landscape ? 47 : 166})`}><rect width={landscape ? 250 : 220} height="42" rx="6" /><circle cx="20" cy="21" r="5" /><text x="36" y="17">{copy.kind[state.collisionKind].toUpperCase()}</text><text className="collision-status-phase" x="36" y="32">{copy.phase[state.phase]} · e = {formatNumber(state.parameters.restitutionCoefficient, "en", 1)}</text></g>
      <g className={`collision-track-scene ${highlights.includes("initial") || highlights.includes("impact") ? "highlighted" : ""}`}>
        <text className="collision-track-label" x={plotLeft} y={trackY + 58}>{copy.canvas.frictionlessTrack}</text>
        <line className="collision-track" x1={plotLeft} y1={trackY} x2={plotRight} y2={trackY} />
        {Array.from({length: 15}, (_, index) => <line className="collision-track-tick" x1={plotLeft + (plotRight - plotLeft) / 14 * index} x2={plotLeft + (plotRight - plotLeft) / 14 * index} y1={trackY} y2={trackY + 10} key={index} />)}
        <Cart x={toX(state.position1M)} trackY={trackY} mass={state.parameters.mass1Kg} label="A" velocity={state.velocity1Ms} color="#168d8b" marker="cart-a-velocity" showVelocity={state.parameters.showVelocityVectors} bodyWidth={cartPixelLength} arrowLift={28} />
        <Cart x={toX(state.position2M)} trackY={trackY} mass={state.parameters.mass2Kg} label="B" velocity={state.velocity2Ms} color="#df6a45" marker="cart-b-velocity" showVelocity={state.parameters.showVelocityVectors} bodyWidth={cartPixelLength} arrowLift={58} />
        {state.phase === "impact" ? <g className="collision-impact" transform={`translate(${impactX} ${trackY - 64})`}><circle r="40" /><circle r="22" /><text y="5" textAnchor="middle">{copy.canvas.impact}</text></g> : null}
        {state.phase === "no-collision" ? <text className="collision-no-impact" x={viewWidth / 2} y={trackY - 144} textAnchor="middle">{copy.canvas.noImpact}</text> : null}
      </g>
      <MomentumLedger state={state} x={ledgerX} y={ledgerY} width={ledgerWidth} height={ledgerHeight} copy={copy} highlighted={highlights.includes("momentum") || highlights.includes("comparison")} />
      <g className={`collision-formula-panel ${highlights.includes("prediction") || highlights.includes("restitution") || highlights.includes("energy") ? "highlighted" : ""}`}><rect x={formulaX} y={formulaY} width={formulaWidth} height={formulaHeight} rx="8" /><text className="collision-panel-kicker" x={formulaX + 20} y={formulaY + 27}>{copy.canvas.prediction}</text><text className="collision-equation" x={formulaX + 20} y={formulaY + 64}>Σp<tspan baselineShift="sub" fontSize="16">i</tspan> = Σp<tspan baselineShift="sub" fontSize="16">f</tspan></text><text className="collision-equation secondary" x={formulaX + 20} y={formulaY + 98}>vB − vA = e(uA − uB)</text><text className="collision-formula-result" x={formulaX + 20} y={formulaY + 132}>vA = {formatSigned(state.finalVelocity1Ms, "en")} m/s</text><text className="collision-formula-result cart-b" x={formulaX + 20} y={formulaY + 158}>vB = {formatSigned(state.finalVelocity2Ms, "en")} m/s</text><line x1={formulaX + 20} x2={formulaX + formulaWidth - 20} y1={formulaY + 176} y2={formulaY + 176} /><text className="collision-energy-result" x={formulaX + 20} y={formulaY + 202}>ΔK = {formatSigned(state.kineticEnergyChangeJ, "en")} J · {formatNumber(state.kineticEnergyLossPercent, "en", 1)}% {copy.canvas.energyLoss}</text></g>
    </> : <g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g>}
    {narrationStep ? <g className="narration-overlay collision-narration-overlay"><text className="narration-step-number" x={margin} y={viewHeight - 72}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={margin + 90} y={viewHeight - 74}>{narrationStep.title}</text><text className="narration-step-caption" x={margin + 90} y={viewHeight - 42}>{narrationStep.caption}</text></g> : null}
  </svg>;
}

export function MomentumCollisionWorkbench() {
  const [parameters, setParameters] = useState<MomentumCollisionParameters>(momentumCollisionDefaults);
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
  const [textOverrides, setTextOverrides] = useState<CollisionTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<CollisionDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);
  const copy = collisionCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => momentumCollisionParametersSchema.safeParse(parameters), [parameters]);
  const experimentDuration = useMemo(() => parsedParameters.success ? getMomentumCollisionExperimentDuration(parsedParameters.data) : 1, [parsedParameters]);
  const narrationSteps = useMemo(() => buildNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(narrationSteps, narrationTimeSeconds, experimentDuration);
  const simulationTime = mode === "narration" ? (narrationFrame.step.id === "compare" ? experimentDuration : narrationFrame.simulationTimeSeconds) : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveMomentumCollision(parsedParameters.data, simulationTime) : null, [parsedParameters, simulationTime]);
  const issues = useMemo(() => inspectMomentumCollision(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : experimentDuration;
  const numericDefinitions = momentumCollisionTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

  useEffect(() => {const stored = window.localStorage.getItem("science-studio-locale"); if (stored === "en" || stored === "zh-CN") setLocale(stored);}, []);
  useEffect(() => {const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current); document.addEventListener("fullscreenchange", onFullscreen); return () => document.removeEventListener("fullscreenchange", onFullscreen);}, []);
  useEffect(() => {
    if (!isPlaying) {lastTimestampRef.current = null; if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); return;}
    const tick = (timestamp: number) => {const previous = lastTimestampRef.current ?? timestamp; lastTimestampRef.current = timestamp; const delta = ((timestamp - previous) / 1000) * speed; const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; setter((current) => {const limit = mode === "narration" ? narrationDuration : experimentDuration; const next = Math.min(limit, current + delta); if (next >= limit) setIsPlaying(false); return next;}); animationRef.current = requestAnimationFrame(tick);};
    animationRef.current = requestAnimationFrame(tick); return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [experimentDuration, isPlaying, mode, narrationDuration, speed]);

  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {setParameters((current) => ({...current, [key]: value})); setTimeSeconds(0); setIsPlaying(false);}, []);
  const setCollisionPreset = useCallback((value: number) => {setParameters((current) => ({...current, restitutionCoefficient: value})); setTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleVectors = useCallback(() => setParameters((current) => ({...current, showVelocityVectors: !current.showVelocityVectors})), []);
  const stopAndResetTime = useCallback(() => {setIsPlaying(false); if (mode === "narration") setNarrationTimeSeconds(0); else setTimeSeconds(0);}, [mode]);
  const step = useCallback((direction: -1 | 1) => {setIsPlaying(false); const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; const limit = mode === "narration" ? narrationDuration : experimentDuration; setter((current) => Math.min(limit, Math.max(0, current + direction / FPS)));}, [experimentDuration, mode, narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {setIsPlaying(false); setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));}, [narrationSteps]);
  const updateNarrationText = useCallback((id: CollisionStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: CollisionStepId, value: number) => {if (Number.isFinite(value)) setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));}, []);
  const restoreNarrationDefaults = useCallback(() => {setTextOverrides({}); setDurationOverrides({}); setNarrationTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleLocale = useCallback(() => setLocale((current) => {const next = current === "en" ? "zh-CN" : "en"; window.localStorage.setItem("science-studio-locale", next); document.documentElement.lang = next; return next;}), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {if (atZoom <= 1) return {x: 0, y: 0}; const width = stageAreaRef.current?.clientWidth ?? 900; const height = stageAreaRef.current?.clientHeight ?? 600; const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35); const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35); return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};}, []);
  const resetCanvasView = useCallback(() => {setZoom(1); setPan({x: 0, y: 0}); setPanMode(false); setIsDraggingCanvas(false); panDragRef.current = null;}, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))); setPan((currentPan) => clampPan(currentPan, next)); if (next <= 1) setPanMode(false); return next;}), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {setAspectRatio(next); resetCanvasView();}, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen(); else await workbenchRef.current?.requestFullscreen();}, []);

  return <main className={`workbench-shell momentum-collision-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar"><div className="project-identity"><ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="collision-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div><nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav><div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div></header>
    <section className="workspace"><div className="stage-area collision-stage-area" ref={stageAreaRef}><div className="stage-meta collision-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="collision-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div>
      <div className={`collision-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation} onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}} onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}} onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}} onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}} onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}} onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}><CollisionCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} /></div></div>
      <aside className="parameter-panel">{mode === "experiment" ? <><div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div><div className="parameter-list">{numericDefinitions.map((definition) => {const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; const isRestitution = definition.key === "restitutionCoefficient"; return <div className="parameter-control" key={definition.key}><div className="parameter-row"><label htmlFor={`collision-${definition.key}`}>{label}</label><div className="number-field"><input id={`collision-${definition.key}`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{isRestitution ? <div className="collision-presets">{collisionPresets.map((preset) => <button className={parameters.restitutionCoefficient === preset.value ? "active" : ""} type="button" onClick={() => setCollisionPreset(preset.value)} key={preset.key}>{copy.presets[preset.key]}</button>)}</div> : null}{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}<div className="parameter-control collision-toggle-parameter"><span className="collision-control-label">{copy.parameters.showVelocityVectors}</span><button className={`collision-switch-control ${parameters.showVelocityVectors ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.showVelocityVectors} onClick={toggleVectors}><Check size={15} /><span>{parameters.showVelocityVectors ? copy.toggles.shown : copy.toggles.hidden}</span><span className="collision-switch-track"><span /></span></button></div></div>
        <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements collision-measurements"><div className="collision-measurement-heading system"><dt>{copy.measurements.system}</dt><dd>{renderedState ? copy.phase[renderedState.phase] : "--"}</dd></div><div><dt>{copy.measurements.momentum}</dt><dd>{renderedState ? formatNumber(renderedState.totalMomentumKgMs, locale) : "--"}<small>kg·m/s</small></dd></div><div><dt>{copy.measurements.kineticEnergy}</dt><dd>{renderedState ? formatNumber(renderedState.kineticEnergyJ, locale) : "--"}<small>J</small></dd></div>{renderedState ? <><div className="collision-measurement-heading cart-a"><dt>{copy.measurements.cart1}</dt><dd>{formatSigned(renderedState.finalVelocity1Ms, locale)} m/s</dd></div><div><dt>{copy.measurements.finalVelocity}</dt><dd>{formatSigned(renderedState.finalVelocity1Ms, locale)}<small>m/s</small></dd></div><div><dt>{copy.measurements.impulse}</dt><dd>{formatSigned(renderedState.impulseOn1Ns, locale)}<small>N·s</small></dd></div><div className="collision-measurement-heading cart-b"><dt>{copy.measurements.cart2}</dt><dd>{formatSigned(renderedState.finalVelocity2Ms, locale)} m/s</dd></div><div><dt>{copy.measurements.finalVelocity}</dt><dd>{formatSigned(renderedState.finalVelocity2Ms, locale)}<small>m/s</small></dd></div><div><dt>{copy.measurements.impulse}</dt><dd>{formatSigned(renderedState.impulseOn2Ns, locale)}<small>N·s</small></dd></div><div className="collision-energy-measurement"><dt>{copy.measurements.energyChange}</dt><dd>{formatSigned(renderedState.kineticEnergyChangeJ, locale)}<small>J</small></dd></div></> : null}</dl></section><section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section></> : <><div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div><div className="narration-step-list">{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div><section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as CollisionStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as CollisionStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as CollisionStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section></>}</aside></section>
    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Experiment time" : "实验时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{commonCopy.actions.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></footer>
  </main>;
}
