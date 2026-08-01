"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  inspectRayOptics,
  rayOpticsDefaults,
  rayOpticsParametersSchema,
  rayOpticsTemplate,
  solveRayOptics,
  type RayOpticsParameters,
  type RayOpticsRegime,
  type RayOpticsState,
} from "@science-studio/templates/ray-optics";
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
import Link from "next/link";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {workbenchCopy, type Locale} from "../lib/i18n";
import {getNarrationDuration, getNarrationStepStart, resolveNarrationFrame} from "../lib/narration";
import {CanvasTextSizeControls} from "./canvas-text-size-controls";

const FPS = 30;
const DIAGRAM_DURATION_SECONDS = 6;
type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "incidentAngleDegrees" | "refractiveIndex1" | "refractiveIndex2";
type OpticsStepId = "interface" | "angles" | "reflection" | "snell" | "critical-angle" | "tir";
type OpticsStepText = Record<OpticsStepId, {title: string; caption: string}>;
type OpticsTextOverrides = Partial<Record<OpticsStepId, Partial<{title: string; caption: string}>>>;
type OpticsDurationOverrides = Partial<Record<OpticsStepId, number>>;

interface OpticsCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {showNormal: string; showAngles: string};
  presets: {airGlass: string; waterAir: string; glassAir: string; critical: string};
  toggles: {shown: string; hidden: string};
  regime: Record<RayOpticsRegime, string>;
  bend: {toward: string; away: string; straight: string; none: string};
  measurements: {
    title: string;
    model: string;
    outcome: string;
    incidence: string;
    reflection: string;
    refraction: string;
    critical: string;
    speed1: string;
    speed2: string;
    unavailable: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    medium1: string;
    medium2: string;
    incidentRay: string;
    reflectedRay: string;
    refractedRay: string;
    normal: string;
    interface: string;
    geometry: string;
    critical: string;
    unavailable: string;
    noTransmittedRay: string;
    constructionNote: string;
    brightnessNote: string;
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
  narration: OpticsStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    matchedTitle: string;
    matchedDetail: string;
    tirTitle: string;
    tirDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const opticsCopy: Record<Locale, OpticsCopy> = {
  en: {
    projectName: "Refraction & Total Internal Reflection",
    packName: "Middle School Pack",
    parameters: {incidentAngleDegrees: "Incident angle", refractiveIndex1: "Medium 1 index", refractiveIndex2: "Medium 2 index", showNormal: "Normal line", showAngles: "Angle labels"},
    presets: {airGlass: "Air → glass", waterAir: "Water → air", glassAir: "Glass → air", critical: "Set θ₁ to critical angle"},
    toggles: {shown: "Shown", hidden: "Hidden"},
    regime: {"normal-incidence": "Normal incidence", refraction: "Reflection + refraction", critical: "Critical angle", "total-internal-reflection": "Total internal reflection"},
    bend: {toward: "Bends toward the normal", away: "Bends away from the normal", straight: "Continues without bending", none: "No transmitted ray"},
    measurements: {title: "Ray measurements", model: "Ideal flat interface", outcome: "Outcome", incidence: "Incident angle", reflection: "Reflection angle", refraction: "Refraction angle", critical: "Critical angle", speed1: "Speed in medium 1", speed2: "Speed in medium 2", unavailable: "Not available"},
    canvas: {ariaLabel: "Reflection, refraction, and total internal reflection ray diagram", title: "Refraction & Total Internal Reflection", subtitle: "Measure every angle from the normal, then test the critical-angle condition.", medium1: "MEDIUM 1", medium2: "MEDIUM 2", incidentRay: "INCIDENT", reflectedRay: "REFLECTED", refractedRay: "REFRACTED", normal: "NORMAL", interface: "FLAT INTERFACE", geometry: "RAY GEOMETRY", critical: "CRITICAL ANGLE", unavailable: "not available", noTransmittedRay: "NO TRANSMITTED RAY", constructionNote: "DIAGRAM SEQUENCE · NOT LIGHT-TRAVEL TIME", brightnessNote: "Ray brightness is qualitative · Fresnel intensity is not modeled", invalid: "Fix the parameters to resume"},
    viewport: {ratio: "Canvas ratio", portrait: "Portrait 9:16", landscape: "Widescreen 16:9", zoomOut: "Zoom out", zoomIn: "Zoom in", move: "Move canvas", fit: "Fit canvas", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", canvasNavigation: "Canvas navigation"},
    narration: {
      interface: {title: "Identify the boundary", caption: "Name the incident medium, the transmitted medium, and the point of incidence."},
      angles: {title: "Draw the normal", caption: "Measure every ray angle from the dashed normal, not from the interface."},
      reflection: {title: "Apply the law of reflection", caption: "The reflected ray leaves at the same angle as the incident ray."},
      snell: {title: "Predict the refracted ray", caption: "Use n₁ sin θ₁ = n₂ sin θ₂ to calculate the transmitted direction."},
      "critical-angle": {title: "Find the critical angle", caption: "A critical angle exists only when light moves from higher index to lower index."},
      tir: {title: "Test total internal reflection", caption: "Above the critical angle, Snell's law has no transmitted-ray solution."},
    },
    issues: {invalidTitle: "Invalid parameter", invalidDetail: "Check the highlighted input before running the experiment.", matchedTitle: "The ray will not bend", matchedDetail: "Both media have the same refractive index, so the transmitted angle equals the incident angle.", tirTitle: "No transmitted ray", tirDetail: "The incident angle is greater than the critical angle, so the ideal ray is totally internally reflected.", assumptionTitle: "Ideal geometric-optics model", assumptionDetail: "The boundary is flat and the media are uniform. Brightness is qualitative because Fresnel coefficients are not modeled."},
  },
  "zh-CN": {
    projectName: "光的折射与全反射",
    packName: "初中物理实验包",
    parameters: {incidentAngleDegrees: "入射角", refractiveIndex1: "介质 1 折射率", refractiveIndex2: "介质 2 折射率", showNormal: "法线", showAngles: "角度标注"},
    presets: {airGlass: "空气 → 玻璃", waterAir: "水 → 空气", glassAir: "玻璃 → 空气", critical: "将 θ₁ 设为临界角"},
    toggles: {shown: "显示", hidden: "隐藏"},
    regime: {"normal-incidence": "垂直入射", refraction: "反射与折射", critical: "临界角", "total-internal-reflection": "全反射"},
    bend: {toward: "向法线偏折", away: "远离法线偏折", straight: "方向保持不变", none: "没有透射光线"},
    measurements: {title: "光路测量", model: "理想平面界面", outcome: "当前状态", incidence: "入射角", reflection: "反射角", refraction: "折射角", critical: "临界角", speed1: "介质 1 中速度", speed2: "介质 2 中速度", unavailable: "不存在"},
    canvas: {ariaLabel: "反射、折射与全反射光路图", title: "光的折射与全反射", subtitle: "所有角度均相对法线测量，并检验临界角条件。", medium1: "介质 1", medium2: "介质 2", incidentRay: "入射光", reflectedRay: "反射光", refractedRay: "折射光", normal: "法线", interface: "平面界面", geometry: "光路关系", critical: "临界角", unavailable: "不存在", noTransmittedRay: "没有透射光线", constructionNote: "构图演示 · 不表示真实光传播时间", brightnessNote: "光线亮度仅作示意 · 未计算菲涅耳能量比例", invalid: "修正参数后恢复实验"},
    viewport: {ratio: "画布比例", portrait: "竖屏 9:16", landscape: "宽屏 16:9", zoomOut: "缩小", zoomIn: "放大", move: "移动画布", fit: "适应画布", enterFullscreen: "进入全屏", exitFullscreen: "退出全屏", canvasNavigation: "画布导航"},
    narration: {
      interface: {title: "识别介质界面", caption: "确认入射介质、透射介质和入射点。"},
      angles: {title: "画出法线", caption: "所有光线角度都从虚线法线开始测量，而不是从界面测量。"},
      reflection: {title: "应用反射定律", caption: "反射角始终等于入射角。"},
      snell: {title: "预测折射方向", caption: "使用 n₁ sin θ₁ = n₂ sin θ₂ 计算透射方向。"},
      "critical-angle": {title: "计算临界角", caption: "只有光从高折射率介质进入低折射率介质时才存在临界角。"},
      tir: {title: "检验全反射", caption: "入射角超过临界角后，斯涅尔定律不再有透射光线解。"},
    },
    issues: {invalidTitle: "参数无法运行", invalidDetail: "运行实验前请检查高亮的参数。", matchedTitle: "光线不会偏折", matchedDetail: "两种介质折射率相同，折射角等于入射角。", tirTitle: "没有透射光线", tirDetail: "入射角大于临界角，理想光线发生全反射。", assumptionTitle: "理想几何光学模型", assumptionDetail: "界面为平面且介质均匀；未计算菲涅耳系数，因此光线亮度仅作示意。"},
  },
};

const mediumPresets = [
  {key: "airGlass", n1: 1, n2: 1.5},
  {key: "waterAir", n1: 1.33, n2: 1},
  {key: "glassAir", n1: 1.5, n2: 1},
] as const;

function formatNumber(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
}

function buildNarration(copy: OpticsStepText, textOverrides: OpticsTextOverrides, durationOverrides: OpticsDurationOverrides): NarrationStep[] {
  return rayOpticsTemplate.narration.map((definition) => {
    const id = definition.id as OpticsStepId;
    return {...definition, title: textOverrides[id]?.title ?? copy[id].title, caption: textOverrides[id]?.caption ?? copy[id].caption, durationSeconds: durationOverrides[id] ?? definition.durationSeconds};
  });
}

function localizeIssue(issue: ScienceIssue, copy: OpticsCopy): ScienceIssue {
  if (issue.id.startsWith("invalid-parameter")) return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "matched-indices") return {...issue, title: copy.issues.matchedTitle, detail: copy.issues.matchedDetail};
  if (issue.id === "total-internal-reflection") return {...issue, title: copy.issues.tirTitle, detail: copy.issues.tirDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number) {
  const radians = degrees * Math.PI / 180;
  return {x: cx + radius * Math.cos(radians), y: cy + radius * Math.sin(radians)};
}

function arcPath(cx: number, cy: number, radius: number, startDegrees: number, endDegrees: number) {
  const start = polarPoint(cx, cy, radius, startDegrees);
  const end = polarPoint(cx, cy, radius, endDegrees);
  const sweep = endDegrees >= startDegrees ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweep} ${end.x} ${end.y}`;
}

function wrapNarrationCaption(text: string, locale: Locale, maxCharacters: number) {
  if (locale === "zh-CN") return [text.slice(0, maxCharacters), text.slice(maxCharacters)].filter(Boolean).slice(0, 2);
  const lines: string[] = [];
  for (const word of text.split(/\s+/)) {
    const current = lines.at(-1);
    if (!current || current.length + word.length + 1 > maxCharacters) lines.push(word);
    else lines[lines.length - 1] = `${current} ${word}`;
  }
  return lines.slice(0, 2);
}

function RayMarker({id, color}: {id: string; color: string}) {
  return <marker id={id} markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,8 L9,4 z" fill={color} /></marker>;
}

function OpticsCanvas({state, locale, aspectRatio, constructionProgress, narrationStep, narrationStepIndex, narrationStepCount}: {
  state: RayOpticsState | null;
  locale: Locale;
  aspectRatio: CanvasAspectRatio;
  constructionProgress: number;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const copy = opticsCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const margin = landscape ? 58 : 54;
  const originX = landscape ? 495 : 360;
  const interfaceY = landscape ? 380 : 610;
  const rayLength = landscape ? 248 : 270;
  const formulaX = landscape ? 820 : 54;
  const formulaY = landscape ? 172 : 910;
  const formulaWidth = landscape ? 402 : 612;
  const formulaHeight = landscape ? 392 : 300;
  const formulaRows = landscape
    ? {kicker: 30, equation: 78, substitution: 112, divider: 137, reflection: 176, refraction: 216, critical: 257, bend: 301, note: 370}
    : {kicker: 28, equation: 65, substitution: 94, divider: 114, reflection: 145, refraction: 178, critical: 211, bend: 244, note: 278};
  const narrationBaseY = landscape ? viewHeight - 108 : 795;
  const rayOpacity = (start: number) => 0.32 + Math.max(0, Math.min(1, (constructionProgress - start) / 0.22)) * 0.68;
  const highlights = narrationStep?.highlights ?? [];
  const focusOpacity = (names: string[]) => !narrationStep || names.some((name) => highlights.includes(name)) ? 1 : 0.3;

  if (!state) return <svg className="optics-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={copy.canvas.ariaLabel}><rect width={viewWidth} height={viewHeight} fill="#f5f8f7" /><g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g></svg>;

  const theta1 = state.parameters.incidentAngleDegrees;
  const theta2 = state.refractionAngleDegrees;
  const incidentStart = polarPoint(originX, interfaceY, rayLength, -90 - theta1);
  const reflectedEnd = polarPoint(originX, interfaceY, rayLength, -90 + theta1);
  const refractedEnd = theta2 === null ? null : polarPoint(originX, interfaceY, rayLength, 90 - theta2);
  const incidentLabel = {x: originX - (landscape ? 128 : 112), y: interfaceY - (landscape ? 76 : 92)};
  const reflectedLabel = {x: originX + (landscape ? 128 : 112), y: interfaceY - (landscape ? 76 : 92)};
  const refractedLabel = theta2 === null ? null : {x: originX + (landscape ? 116 : 104), y: interfaceY + (landscape ? 86 : 96)};
  const bendText = state.regime === "total-internal-reflection" ? copy.bend.none : state.bendsTowardNormal ? copy.bend.toward : state.bendsAwayFromNormal ? copy.bend.away : copy.bend.straight;
  const transmittedTerm = state.transmittedSineTerm === null ? "--" : formatNumber(state.transmittedSineTerm, locale, 3);

  return <svg className="optics-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={copy.canvas.ariaLabel}>
    <defs>
      <pattern id="optics-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M 32 0 L 0 0 0 32" fill="none" stroke="#cad8d5" strokeWidth="1" opacity="0.45" /></pattern>
      <RayMarker id="incident-ray-arrow" color="#d8892d" />
      <RayMarker id="reflected-ray-arrow" color="#d85f45" />
      <RayMarker id="refracted-ray-arrow" color="#168d8b" />
    </defs>
    <rect width={viewWidth} height={interfaceY} fill="#f7f8f4" />
    <rect y={interfaceY} width={viewWidth} height={viewHeight - interfaceY} fill="#dcefed" />
    <rect width={viewWidth} height={viewHeight} fill="url(#optics-grid)" />
    <g className="optics-canvas-heading">
      <text className="optics-eyebrow" x={margin} y={landscape ? 50 : 62}>SCIENCE STUDIO · OPTICS</text>
      <text className="optics-title" x={margin} y={landscape ? 91 : 105}>{copy.canvas.title}</text>
      <text className="optics-subtitle" x={margin} y={landscape ? 120 : 137}>{copy.canvas.subtitle}</text>
    </g>
    <g className="optics-index-card" transform={`translate(${landscape ? 890 : 54} ${landscape ? 46 : 168})`}>
      <rect width={landscape ? 330 : 612} height="76" rx="7" />
      <text x="18" y="27">{copy.canvas.medium1} · n₁ = {formatNumber(state.parameters.refractiveIndex1, locale, 2)}</text>
      <text x="18" y="55">{copy.canvas.medium2} · n₂ = {formatNumber(state.parameters.refractiveIndex2, locale, 2)}</text>
    </g>

    <g className="optics-interface-group" opacity={focusOpacity(["interface", "normal", "angles"])}>
      <line className="optics-interface" x1={margin} x2={landscape ? 760 : viewWidth - margin} y1={interfaceY} y2={interfaceY} />
      <text className="optics-medium-label" x={margin} y={interfaceY - 24}>{copy.canvas.medium1} · n₁ = {formatNumber(state.parameters.refractiveIndex1, locale, 2)}</text>
      <text className="optics-medium-label" x={margin} y={interfaceY + 37}>{copy.canvas.medium2} · n₂ = {formatNumber(state.parameters.refractiveIndex2, locale, 2)}</text>
      <text className="optics-interface-label" x={landscape ? 760 : viewWidth - margin} y={interfaceY - 13} textAnchor="end">{copy.canvas.interface}</text>
      <circle className="optics-incidence-point" cx={originX} cy={interfaceY} r="8" />
      {state.parameters.showNormal ? <><line className="optics-normal" x1={originX} x2={originX} y1={interfaceY - rayLength - 40} y2={interfaceY + rayLength + 40} /><text className="optics-normal-label" x={originX + 13} y={interfaceY - rayLength + 8}>{copy.canvas.normal}</text></> : null}
    </g>

    <g className="optics-ray incident" opacity={rayOpacity(0) * focusOpacity(["interface", "angles", "snell"])}>
      <line x1={incidentStart.x} y1={incidentStart.y} x2={originX} y2={interfaceY} markerEnd="url(#incident-ray-arrow)" />
      <text x={incidentStart.x + 8} y={incidentStart.y - 15}>{copy.canvas.incidentRay}</text>
    </g>
    <g className="optics-ray reflected" opacity={rayOpacity(0.28) * focusOpacity(["reflection", "angles"])}>
      <line x1={originX} y1={interfaceY} x2={reflectedEnd.x} y2={reflectedEnd.y} markerEnd="url(#reflected-ray-arrow)" />
      <text x={reflectedEnd.x - 8} y={reflectedEnd.y - 15} textAnchor="end">{copy.canvas.reflectedRay}</text>
    </g>
    {refractedEnd ? <g className="optics-ray refracted" opacity={rayOpacity(0.48) * focusOpacity(["refraction", "snell", "critical"])}>
      <line x1={originX} y1={interfaceY} x2={refractedEnd.x} y2={refractedEnd.y} markerEnd="url(#refracted-ray-arrow)" />
      <text x={refractedEnd.x - (theta2 === 90 ? 18 : 8)} y={refractedEnd.y + (theta2 === 90 ? 28 : 24)} textAnchor="end">{copy.canvas.refractedRay}</text>
    </g> : <g className="optics-tir-badge" transform={`translate(${originX + 44} ${interfaceY + 48})`} opacity={focusOpacity(["tir", "critical"])}><AlertTriangle size={18} /><text x="28" y="15">{copy.canvas.noTransmittedRay}</text></g>}

    {state.parameters.showAngles ? <g className="optics-angle-layer" opacity={focusOpacity(["angles", "reflection", "refraction", "snell", "critical"])}>
      {theta1 > 0 ? <><path className="optics-angle-arc incident" d={arcPath(originX, interfaceY, 76, -90 - theta1, -90)} /><path className="optics-angle-arc reflected" d={arcPath(originX, interfaceY, 76, -90, -90 + theta1)} /></> : null}
      <text className="optics-angle-value incident" x={incidentLabel.x} y={incidentLabel.y} textAnchor="middle">θ₁ = {formatNumber(theta1, locale, 1)}°</text>
      <text className="optics-angle-value reflected" x={reflectedLabel.x} y={reflectedLabel.y} textAnchor="middle">θᵣ = {formatNumber(state.reflectionAngleDegrees, locale, 1)}°</text>
      {theta2 !== null && refractedLabel ? <><path className="optics-angle-arc refracted" d={arcPath(originX, interfaceY, 76, 90 - theta2, 90)} /><text className="optics-angle-value refracted" x={refractedLabel.x} y={refractedLabel.y} textAnchor="middle">θ₂ = {formatNumber(theta2, locale, 1)}°</text></> : null}
    </g> : null}

    <g className={`optics-formula-panel regime-${state.regime}`} opacity={rayOpacity(0.62) * focusOpacity(["snell", "critical", "tir", "reflection"])}>
      <rect x={formulaX} y={formulaY} width={formulaWidth} height={formulaHeight} rx="9" />
      <text className="optics-panel-kicker" x={formulaX + 22} y={formulaY + formulaRows.kicker}>{copy.canvas.geometry}</text>
      <text className="optics-regime-label" x={formulaX + formulaWidth - 22} y={formulaY + formulaRows.kicker} textAnchor="end">{copy.regime[state.regime].toUpperCase()}</text>
      <text className="optics-equation" x={formulaX + 22} y={formulaY + formulaRows.equation}>n₁ sin θ₁ = n₂ sin θ₂</text>
      <text className="optics-substitution" x={formulaX + 22} y={formulaY + formulaRows.substitution}>{formatNumber(state.parameters.refractiveIndex1, locale, 2)} × sin {formatNumber(theta1, locale, 1)}° = {transmittedTerm}</text>
      <line x1={formulaX + 22} x2={formulaX + formulaWidth - 22} y1={formulaY + formulaRows.divider} y2={formulaY + formulaRows.divider} />
      <text className="optics-result reflection" x={formulaX + 22} y={formulaY + formulaRows.reflection}>θᵣ = θ₁ = {formatNumber(state.reflectionAngleDegrees, locale, 1)}°</text>
      <text className="optics-result refraction" x={formulaX + 22} y={formulaY + formulaRows.refraction}>θ₂ = {theta2 === null ? "--" : `${formatNumber(theta2, locale, 1)}°`}</text>
      <text className="optics-critical-label" x={formulaX + 22} y={formulaY + formulaRows.critical}>{copy.canvas.critical}</text>
      <text className="optics-critical-value" x={formulaX + formulaWidth - 22} y={formulaY + formulaRows.critical} textAnchor="end">{state.criticalAngleDegrees === null ? copy.canvas.unavailable : `θc = ${formatNumber(state.criticalAngleDegrees, locale, 1)}°`}</text>
      <text className="optics-bend-result" x={formulaX + 22} y={formulaY + formulaRows.bend}>{bendText}</text>
      <text className="optics-brightness-note" x={formulaX + 22} y={formulaY + formulaRows.note}>{copy.canvas.brightnessNote}</text>
    </g>

    <text className="optics-construction-note" x={margin} y={viewHeight - 32}>{copy.canvas.constructionNote}</text>
    {narrationStep ? <g className="narration-overlay optics-narration-overlay"><text className="narration-step-number" x={margin} y={narrationBaseY}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={margin + 90} y={narrationBaseY - 2}>{narrationStep.title}</text><text className="narration-step-caption">{wrapNarrationCaption(narrationStep.caption, locale, landscape ? 82 : 52).map((line, index) => <tspan x={margin + 90} y={narrationBaseY + 30 + index * 23} key={`${line}-${index}`}>{line}</tspan>)}</text></g> : null}
  </svg>;
}

export function RayOpticsWorkbench() {
  const [parameters, setParameters] = useState<RayOpticsParameters>(rayOpticsDefaults);
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
  const [textOverrides, setTextOverrides] = useState<OpticsTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<OpticsDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);
  const copy = opticsCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => rayOpticsParametersSchema.safeParse(parameters), [parameters]);
  const renderedState = useMemo(() => parsedParameters.success ? solveRayOptics(parsedParameters.data) : null, [parsedParameters]);
  const narrationSteps = useMemo(() => buildNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(narrationSteps, narrationTimeSeconds, DIAGRAM_DURATION_SECONDS);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : DIAGRAM_DURATION_SECONDS;
  const constructionProgress = mode === "narration" ? (narrationFrame.index + 1) / narrationSteps.length : timeSeconds / DIAGRAM_DURATION_SECONDS;
  const issues = useMemo(() => inspectRayOptics(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const numericDefinitions = rayOpticsTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

  useEffect(() => {const stored = window.localStorage.getItem("science-studio-locale"); if (stored === "en" || stored === "zh-CN") setLocale(stored);}, []);
  useEffect(() => {const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current); document.addEventListener("fullscreenchange", onFullscreen); return () => document.removeEventListener("fullscreenchange", onFullscreen);}, []);
  useEffect(() => {
    if (!isPlaying) {lastTimestampRef.current = null; if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); return;}
    const tick = (timestamp: number) => {const previous = lastTimestampRef.current ?? timestamp; lastTimestampRef.current = timestamp; const delta = ((timestamp - previous) / 1000) * speed; const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; setter((current) => {const limit = mode === "narration" ? narrationDuration : DIAGRAM_DURATION_SECONDS; const next = Math.min(limit, current + delta); if (next >= limit) setIsPlaying(false); return next;}); animationRef.current = requestAnimationFrame(tick);};
    animationRef.current = requestAnimationFrame(tick); return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [isPlaying, mode, narrationDuration, speed]);

  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {setParameters((current) => ({...current, [key]: value})); setTimeSeconds(DIAGRAM_DURATION_SECONDS); setIsPlaying(false);}, []);
  const setPreset = useCallback((n1: number, n2: number) => {setParameters((current) => ({...current, refractiveIndex1: n1, refractiveIndex2: n2})); setTimeSeconds(DIAGRAM_DURATION_SECONDS); setIsPlaying(false);}, []);
  const toggleBoolean = useCallback((key: "showNormal" | "showAngles") => setParameters((current) => ({...current, [key]: !current[key]})), []);
  const stopAndResetTime = useCallback(() => {setIsPlaying(false); if (mode === "narration") setNarrationTimeSeconds(0); else setTimeSeconds(0);}, [mode]);
  const step = useCallback((direction: -1 | 1) => {setIsPlaying(false); const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; const limit = mode === "narration" ? narrationDuration : DIAGRAM_DURATION_SECONDS; setter((current) => Math.min(limit, Math.max(0, current + direction / FPS)));}, [mode, narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {setIsPlaying(false); setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));}, [narrationSteps]);
  const updateNarrationText = useCallback((id: OpticsStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: OpticsStepId, value: number) => {if (Number.isFinite(value)) setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));}, []);
  const restoreNarrationDefaults = useCallback(() => {setTextOverrides({}); setDurationOverrides({}); setNarrationTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleLocale = useCallback(() => setLocale((current) => {const next = current === "en" ? "zh-CN" : "en"; window.localStorage.setItem("science-studio-locale", next); document.documentElement.lang = next; return next;}), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {if (atZoom <= 1) return {x: 0, y: 0}; const width = stageAreaRef.current?.clientWidth ?? 900; const height = stageAreaRef.current?.clientHeight ?? 600; const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35); const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35); return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};}, []);
  const resetCanvasView = useCallback(() => {setZoom(1); setPan({x: 0, y: 0}); setPanMode(false); setIsDraggingCanvas(false); panDragRef.current = null;}, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))); setPan((currentPan) => clampPan(currentPan, next)); if (next <= 1) setPanMode(false); return next;}), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {setAspectRatio(next); resetCanvasView();}, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen(); else await workbenchRef.current?.requestFullscreen();}, []);

  return <main className={`workbench-shell ray-optics-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar"><div className="project-identity"><Link className="back-to-library" href="/experiments" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></Link><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="optics-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div><nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav><div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div></header>
    <section className="workspace"><div className="stage-area optics-stage-area" ref={stageAreaRef}><div className="stage-meta optics-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="optics-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div>
      <div className={`optics-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation} onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}} onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}} onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}} onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}} onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}} onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}><OpticsCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} constructionProgress={constructionProgress} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} /></div></div>
      <aside className="parameter-panel">{mode === "experiment" ? <><div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div><div className="parameter-list"><div className="parameter-control optics-preset-parameter"><span className="optics-control-label">{locale === "en" ? "Medium presets" : "介质预设"}</span><div className="optics-presets">{mediumPresets.map((preset) => <button className={parameters.refractiveIndex1 === preset.n1 && parameters.refractiveIndex2 === preset.n2 ? "active" : ""} type="button" onClick={() => setPreset(preset.n1, preset.n2)} key={preset.key}>{copy.presets[preset.key]}</button>)}</div>{renderedState?.criticalAngleDegrees !== null && renderedState ? <button className={`optics-critical-preset ${Math.abs(renderedState.parameters.incidentAngleDegrees - renderedState.criticalAngleDegrees) <= 1e-9 ? "active" : ""}`} type="button" onClick={() => updateNumeric("incidentAngleDegrees", renderedState.criticalAngleDegrees as number)}>{copy.presets.critical}<span>{formatNumber(renderedState.criticalAngleDegrees, locale, 2)}°</span></button> : null}</div>{numericDefinitions.map((definition) => {const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; return <div className="parameter-control" key={definition.key}><div className="parameter-row"><label htmlFor={`optics-${definition.key}`}>{label}</label><div className="number-field"><input id={`optics-${definition.key}`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit === "deg" ? "°" : definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}{(["showNormal", "showAngles"] as const).map((key) => <div className="parameter-control optics-toggle-parameter" key={key}><span className="optics-control-label">{copy.parameters[key]}</span><button className={`optics-switch-control ${parameters[key] ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters[key]} onClick={() => toggleBoolean(key)}><Check size={15} /><span>{parameters[key] ? copy.toggles.shown : copy.toggles.hidden}</span><span className="optics-switch-track"><span /></span></button></div>)}</div>
        <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements optics-measurements"><div className={`optics-measurement-heading regime-${renderedState?.regime ?? "invalid"}`}><dt>{copy.measurements.outcome}</dt><dd>{renderedState ? copy.regime[renderedState.regime] : "--"}</dd></div><div><dt>{copy.measurements.incidence}</dt><dd>{renderedState ? formatNumber(renderedState.parameters.incidentAngleDegrees, locale, 1) : "--"}<small>°</small></dd></div><div><dt>{copy.measurements.reflection}</dt><dd>{renderedState ? formatNumber(renderedState.reflectionAngleDegrees, locale, 1) : "--"}<small>°</small></dd></div><div><dt>{copy.measurements.refraction}</dt><dd>{renderedState?.refractionAngleDegrees === null || !renderedState ? "--" : formatNumber(renderedState.refractionAngleDegrees, locale, 1)}{renderedState?.refractionAngleDegrees !== null && renderedState ? <small>°</small> : null}</dd></div><div><dt>{copy.measurements.critical}</dt><dd>{renderedState?.criticalAngleDegrees === null || !renderedState ? copy.measurements.unavailable : formatNumber(renderedState.criticalAngleDegrees, locale, 1)}{renderedState?.criticalAngleDegrees !== null && renderedState ? <small>°</small> : null}</dd></div><div><dt>{copy.measurements.speed1}</dt><dd>{renderedState ? formatNumber(renderedState.relativeLightSpeed1, locale, 3) : "--"}<small>c</small></dd></div><div><dt>{copy.measurements.speed2}</dt><dd>{renderedState ? formatNumber(renderedState.relativeLightSpeed2, locale, 3) : "--"}<small>c</small></dd></div></dl></section><section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section></> : <><div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div><div className="narration-step-list">{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div><section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as OpticsStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as OpticsStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as OpticsStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong><Pause size={13} />{commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section></>}</aside></section>
    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale, 2)} <small>/ {formatNumber(durationSeconds, locale, 2)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Diagram sequence" : "构图进度"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{commonCopy.actions.speed}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.25">0.25×</option><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></footer>
  </main>;
}
