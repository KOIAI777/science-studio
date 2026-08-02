"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  inspectThinLens,
  solveThinLens,
  thinLensDefaults,
  thinLensParametersSchema,
  thinLensTemplate,
  type ThinLensParameters,
  type ThinLensRegime,
  type ThinLensState,
} from "@science-studio/templates/thin-lens";
import {
  AlertTriangle,
  Aperture,
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
type NumericParameterKey = "focalLengthMeters" | "objectDistanceMeters" | "objectHeightMeters";
type LensStepId = "bench" | "parallel-ray" | "center-ray" | "focal-ray" | "image" | "equation";
type LensStepText = Record<LensStepId, {title: string; caption: string}>;
type LensTextOverrides = Partial<Record<LensStepId, Partial<{title: string; caption: string}>>>;
type LensDurationOverrides = Partial<Record<LensStepId, number>>;
type LensPreset = "beyond-2f" | "at-2f" | "inside-f" | "diverging" | "custom";

interface LensCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {presets: string; lensType: string; labels: string; rays: string};
  presets: Record<Exclude<LensPreset, "custom">, string>;
  lensTypes: {converging: string; diverging: string};
  toggles: {shown: string; hidden: string};
  regime: Record<ThinLensRegime, string>;
  orientation: {upright: string; inverted: string; "at-infinity": string};
  size: {reduced: string; same: string; enlarged: string; "at-infinity": string};
  measurements: {title: string; model: string; outcome: string; focalLength: string; objectDistance: string; imageDistance: string; magnification: string; objectHeight: string; imageHeight: string};
  canvas: {
    ariaLabel: string; title: string; subtitle: string; bench: string; object: string; image: string; realImage: string;
    virtualImage: string; noFiniteImage: string; converging: string; diverging: string; opticalAxis: string;
    parallel: string; center: string; focal: string; virtualExtension: string; formula: string; result: string;
    distanceSign: string; constructionNote: string; invalid: string;
  };
  viewport: {ratio: string; portrait: string; landscape: string; zoomOut: string; zoomIn: string; move: string; fit: string; enterFullscreen: string; exitFullscreen: string; canvasNavigation: string};
  narration: LensStepText;
  issues: {invalidTitle: string; invalidDetail: string; infinityTitle: string; infinityDetail: string; assumptionTitle: string; assumptionDetail: string};
}

const lensCopy: Record<Locale, LensCopy> = {
  en: {
    projectName: "Lenses & Image Formation",
    packName: "Middle School Pack",
    parameters: {presets: "Image case", focalLengthMeters: "Focal length |f|", objectDistanceMeters: "Object distance u", objectHeightMeters: "Object height", lensType: "Lens type", labels: "Bench labels", rays: "Principal rays"},
    presets: {"beyond-2f": "Beyond 2F", "at-2f": "At 2F", "inside-f": "Inside F", diverging: "Diverging lens"},
    lensTypes: {converging: "Converging", diverging: "Diverging"},
    toggles: {shown: "Shown", hidden: "Hidden"},
    regime: {real: "Real image", virtual: "Virtual image", "at-focus": "Image at infinity"},
    orientation: {upright: "Upright", inverted: "Inverted", "at-infinity": "Not finite"},
    size: {reduced: "Reduced", same: "Same size", enlarged: "Enlarged", "at-infinity": "Not finite"},
    measurements: {title: "Image measurements", model: "Ideal thin lens", outcome: "Image result", focalLength: "Signed focal length", objectDistance: "Object distance", imageDistance: "Image distance", magnification: "Magnification", objectHeight: "Object height", imageHeight: "Image height"},
    canvas: {ariaLabel: "Optical bench showing a thin lens, focal points, object and image arrows, and three principal rays", title: "Build the image with three rays", subtitle: "Move the object across F and 2F, then verify the thin-lens equation", bench: "OPTICAL BENCH", object: "OBJECT", image: "IMAGE", realImage: "REAL · INVERTED", virtualImage: "VIRTUAL · UPRIGHT", noFiniteImage: "OBJECT AT F · OUTGOING RAYS ARE PARALLEL · IMAGE AT INFINITY", converging: "CONVERGING LENS", diverging: "DIVERGING LENS", opticalAxis: "OPTICAL AXIS", parallel: "1 · PARALLEL RAY", center: "2 · OPTICAL-CENTER RAY", focal: "3 · FOCAL RAY", virtualExtension: "BACKWARD EXTENSIONS", formula: "THIN-LENS EQUATION", result: "SOLVER RESULT", distanceSign: "v > 0 real · v < 0 virtual", constructionNote: "IDEAL THIN-LENS RAY CONSTRUCTION", invalid: "Fix the parameters to resume"},
    viewport: {ratio: "Canvas ratio", portrait: "Portrait 9:16", landscape: "Widescreen 16:9", zoomOut: "Zoom out", zoomIn: "Zoom in", move: "Move canvas", fit: "Fit canvas", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", canvasNavigation: "Canvas navigation"},
    narration: {
      bench: {title: "Set the object on the bench", caption: "Measure the object distance u from the optical center and mark F and 2F on both sides."},
      "parallel-ray": {title: "Draw the parallel ray", caption: "A ray parallel to the axis refracts through the far focus, or appears to come from the near focus."},
      "center-ray": {title: "Draw the center ray", caption: "In the thin-lens model, the ray through the optical center continues undeviated."},
      "focal-ray": {title: "Draw the focal ray", caption: "A ray through the near focus, or aimed at the far focus, emerges parallel to the axis."},
      image: {title: "Locate the image", caption: "Real rays meet at a real image; backward dashed extensions meet at a virtual image."},
      equation: {title: "Check the calculation", caption: "Use 1/f = 1/u + 1/v and m = -v/u to verify position, size, and orientation."},
    },
    issues: {invalidTitle: "Invalid parameter", invalidDetail: "Check the highlighted input before running the experiment.", infinityTitle: "No finite image", infinityDetail: "The object is at F, so ideal outgoing rays are parallel and the image lies at infinity.", assumptionTitle: "Ideal thin-lens model", assumptionDetail: "The lens is thin and paraxial; aberration, diffraction, dispersion, thickness, and brightness are excluded."},
  },
  "zh-CN": {
    projectName: "透镜与成像",
    packName: "初中物理实验包",
    parameters: {presets: "成像情形", focalLengthMeters: "焦距绝对值 |f|", objectDistanceMeters: "物距 u", objectHeightMeters: "物体高度", lensType: "透镜类型", labels: "光具座标注", rays: "三条特殊光线"},
    presets: {"beyond-2f": "物在 2F 外", "at-2f": "物在 2F", "inside-f": "物在 F 内", diverging: "发散透镜"},
    lensTypes: {converging: "会聚透镜", diverging: "发散透镜"},
    toggles: {shown: "显示", hidden: "隐藏"},
    regime: {real: "实像", virtual: "虚像", "at-focus": "像在无穷远"},
    orientation: {upright: "正立", inverted: "倒立", "at-infinity": "无有限像"},
    size: {reduced: "缩小", same: "等大", enlarged: "放大", "at-infinity": "无有限像"},
    measurements: {title: "成像测量", model: "理想薄透镜", outcome: "成像结果", focalLength: "带符号焦距", objectDistance: "物距", imageDistance: "像距", magnification: "放大率", objectHeight: "物高", imageHeight: "像高"},
    canvas: {ariaLabel: "展示薄透镜、焦点、物像箭头和三条特殊光线的光具座", title: "用三条特殊光线确定像", subtitle: "让物体跨过 F 与 2F，再用薄透镜公式检验", bench: "光具座", object: "物体", image: "像", realImage: "实像 · 倒立", virtualImage: "虚像 · 正立", noFiniteImage: "物体位于 F · 出射光线平行 · 像在无穷远", converging: "会聚透镜", diverging: "发散透镜", opticalAxis: "主光轴", parallel: "1 · 平行光线", center: "2 · 光心光线", focal: "3 · 焦点光线", virtualExtension: "反向延长线", formula: "薄透镜公式", result: "计算结果", distanceSign: "v > 0 为实像 · v < 0 为虚像", constructionNote: "理想薄透镜光路作图", invalid: "修正参数后恢复实验"},
    viewport: {ratio: "画布比例", portrait: "竖版 9:16", landscape: "横版 16:9", zoomOut: "缩小", zoomIn: "放大", move: "移动画布", fit: "适应画布", enterFullscreen: "进入全屏", exitFullscreen: "退出全屏", canvasNavigation: "画布导航"},
    narration: {
      bench: {title: "在光具座上放置物体", caption: "物距 u 从光心量起，并在透镜两侧标出 F 与 2F。"},
      "parallel-ray": {title: "画平行光线", caption: "平行于主轴的光线折射后通过异侧焦点，或看似来自同侧焦点。"},
      "center-ray": {title: "画光心光线", caption: "在薄透镜模型中，通过光心的光线方向不变。"},
      "focal-ray": {title: "画焦点光线", caption: "通过同侧焦点或朝向异侧焦点的光线，折射后平行于主轴。"},
      image: {title: "确定像的位置", caption: "实际光线相交形成实像；反向虚线延长线相交形成虚像。"},
      equation: {title: "检验计算结果", caption: "用 1/f = 1/u + 1/v 与 m = -v/u 检验像的位置、大小和正倒。"},
    },
    issues: {invalidTitle: "参数无法运行", invalidDetail: "运行实验前请检查高亮的参数。", infinityTitle: "没有有限位置的像", infinityDetail: "物体位于 F，理想出射光线互相平行，像位于无穷远。", assumptionTitle: "理想薄透镜模型", assumptionDetail: "透镜视为薄透镜并采用近轴光线；不模拟像差、衍射、色散、厚度和亮度。"},
  },
};

const numericDefinitions = thinLensTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale, {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
}

function formatSignedDistance(value: number | null, locale: Locale) {
  if (value === null) return "∞";
  return `${value > 0 ? "+" : "−"}${formatNumber(Math.abs(value), locale)} m`;
}

function buildNarration(copy: LensStepText, textOverrides: LensTextOverrides, durationOverrides: LensDurationOverrides): NarrationStep[] {
  return thinLensTemplate.narration.map((definition) => {
    const id = definition.id as LensStepId;
    return {...definition, title: textOverrides[id]?.title ?? copy[id].title, caption: textOverrides[id]?.caption ?? copy[id].caption, durationSeconds: durationOverrides[id] ?? definition.durationSeconds};
  });
}

function localizeIssue(issue: ScienceIssue, copy: LensCopy): ScienceIssue {
  if (issue.severity === "blocking") return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "image-at-infinity") return {...issue, title: copy.issues.infinityTitle, detail: copy.issues.infinityDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function lineYAtX(first: {x: number; y: number}, second: {x: number; y: number}, x: number) {
  if (Math.abs(second.x - first.x) < 1e-9) return second.y;
  return first.y + (second.y - first.y) * ((x - first.x) / (second.x - first.x));
}

function LensArrow({x, axisY, tipY, label, virtual = false}: {x: number; axisY: number; tipY: number; label: string; virtual?: boolean}) {
  const upward = tipY < axisY;
  return <g className={`lens-image-arrow ${virtual ? "virtual" : ""}`}>
    <line x1={x} x2={x} y1={axisY} y2={tipY} />
    <path d={upward ? `M ${x - 9} ${tipY + 13} L ${x} ${tipY} L ${x + 9} ${tipY + 13}` : `M ${x - 9} ${tipY - 13} L ${x} ${tipY} L ${x + 9} ${tipY - 13}`} />
    <text x={x} y={upward ? tipY - 14 : tipY + 27} textAnchor="middle">{label}</text>
  </g>;
}

function ThinLensCanvas({state, locale, aspectRatio, constructionProgress, narrationStep, narrationStepIndex, narrationStepCount}: {
  state: ThinLensState | null;
  locale: Locale;
  aspectRatio: CanvasAspectRatio;
  constructionProgress: number;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const copy = lensCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const apparatus = landscape ? {x: 48, y: 148, w: 844, h: 456} : {x: 42, y: 178, w: 636, h: 590};
  const readings = landscape ? {x: 920, y: 148, w: 312, h: 456} : {x: 42, y: 806, w: 636, h: 324};
  const readingRows = landscape
    ? {formula1: 78, formula2: 116, divider: 142, kicker: 174, result: 210, f: 258, u: 292, v: 326, m: 360, sign: 406, note: 433}
    : {formula1: 62, formula2: 92, divider: 110, kicker: 136, result: 166, f: 196, u: 222, v: 248, m: 274, sign: 298, note: 316};
  const axisY = apparatus.y + apparatus.h * (landscape ? 0.57 : 0.54);
  const lensX = apparatus.x + apparatus.w * 0.56;
  const leftLimit = apparatus.x + 36;
  const rightLimit = apparatus.x + apparatus.w - 30;
  const highlighted = (id: LensStepId) => narrationStep?.id === id;

  if (!state) return <svg className="wave-canvas thin-lens-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label={copy.canvas.ariaLabel}><rect width={viewWidth} height={viewHeight} fill="#eef2ef" /><g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g></svg>;

  const f = state.parameters.focalLengthMeters;
  const u = state.parameters.objectDistanceMeters;
  const vMagnitude = Math.abs(state.imageDistanceMeters ?? 0);
  const maximumDistance = Math.max(0.62, u, vMagnitude, f * 2.25);
  const pxPerMeter = Math.min((lensX - leftLimit) / maximumDistance, (rightLimit - lensX) / maximumDistance);
  const fPx = f * pxPerMeter;
  const objectX = lensX - u * pxPerMeter;
  const objectHeightPx = state.parameters.objectHeightMeters * pxPerMeter;
  const objectTipY = axisY - objectHeightPx;
  const imageX = state.imageDistanceMeters === null ? null : lensX + state.imageDistanceMeters * pxPerMeter;
  const imageTipY = state.imageHeightMeters === null ? null : axisY - state.imageHeightMeters * pxPerMeter;
  const leftFocus = {x: lensX - fPx, y: axisY};
  const rightFocus = {x: lensX + fPx, y: axisY};
  const ray1Lens = {x: lensX, y: objectTipY};
  const ray1Guide = state.parameters.lensType === "converging" ? rightFocus : leftFocus;
  const ray1End = {x: rightLimit, y: lineYAtX(ray1Guide, ray1Lens, rightLimit)};
  const centerEnd = {x: rightLimit, y: lineYAtX({x: objectX, y: objectTipY}, {x: lensX, y: axisY}, rightLimit)};
  const focalTarget = state.parameters.lensType === "converging" ? leftFocus : rightFocus;
  const focalLensY = lineYAtX({x: objectX, y: objectTipY}, focalTarget, lensX);
  const rayOpacity = (start: number) => 0.28 + Math.max(0, Math.min(1, (constructionProgress - start) / 0.18)) * 0.72;
  const showRay1 = state.parameters.showPrincipalRays ? rayOpacity(0.08) : 0;
  const showRay2 = state.parameters.showPrincipalRays ? rayOpacity(0.32) : 0;
  const showRay3 = state.parameters.showPrincipalRays && state.regime !== "at-focus" ? rayOpacity(0.56) : 0;
  const showImage = rayOpacity(0.78);
  const isVirtual = state.imageIsVirtual;
  const imageResultPrimary = copy.regime[state.regime];
  const imageResultSecondary = state.regime === "at-focus" ? copy.orientation["at-infinity"] : `${copy.orientation[state.orientation]} · ${copy.size[state.relativeSize]}`;
  const ray1BackY = lineYAtX(ray1Guide, ray1Lens, imageX ?? leftLimit);
  const centerBackY = lineYAtX({x: objectX, y: objectTipY}, {x: lensX, y: axisY}, imageX ?? leftLimit);
  const focalBackY = focalLensY;
  const rayLabelY = (value: number) => Math.min(apparatus.y + apparatus.h - 18, Math.max(apparatus.y + 52, value - 10));

  return <svg className={`wave-canvas thin-lens-canvas ${landscape ? "is-landscape" : "is-portrait"}`} viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="thin-lens-title thin-lens-description">
    <title id="thin-lens-title">{copy.canvas.ariaLabel}</title><desc id="thin-lens-description">{copy.canvas.subtitle}</desc>
    <defs>
      <linearGradient id="thin-lens-glass" x1="0" x2="1"><stop offset="0" stopColor="#9dd7d2" stopOpacity="0.25" /><stop offset="0.5" stopColor="#dff7f4" stopOpacity="0.78" /><stop offset="1" stopColor="#6aafa9" stopOpacity="0.32" /></linearGradient>
      <pattern id="thin-lens-grid" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M 28 0 L 0 0 0 28" fill="none" stroke="#cbd5d1" strokeWidth="1" opacity="0.35" /></pattern>
    </defs>
    <rect className="thin-lens-canvas-bg" width={viewWidth} height={viewHeight} />
    <rect className="thin-lens-canvas-grid" width={viewWidth} height={viewHeight} fill="url(#thin-lens-grid)" />
    <g className="thin-lens-heading"><text className="canvas-eyebrow" x={landscape ? 48 : 42} y={landscape ? 42 : 60}>SCIENCE STUDIO · GEOMETRIC OPTICS</text><text className="canvas-title" x={landscape ? 48 : 42} y={landscape ? 82 : 104}>{copy.canvas.title}</text><text className="canvas-subtitle" x={landscape ? 48 : 42} y={landscape ? 113 : 139}>{copy.canvas.subtitle}</text></g>
    <g className={`thin-lens-apparatus ${highlighted("bench") ? "highlighted" : ""}`}>
      <rect className="thin-lens-panel" x={apparatus.x} y={apparatus.y} width={apparatus.w} height={apparatus.h} rx="8" />
      <text className="thin-lens-panel-kicker" x={apparatus.x + 18} y={apparatus.y + 28}>{copy.canvas.bench}</text>
      <line className="thin-lens-axis" x1={leftLimit} x2={rightLimit} y1={axisY} y2={axisY} />
      <text className="thin-lens-axis-label" x={leftLimit} y={axisY - 12}>{copy.canvas.opticalAxis}</text>
      <g className="thin-lens-ruler">
        <rect x={leftLimit} y={axisY + 38} width={rightLimit - leftLimit} height="38" rx="4" />
        {Array.from({length: 21}, (_, index) => leftLimit + index * (rightLimit - leftLimit) / 20).map((x, index) => <line x1={x} x2={x} y1={axisY + 38} y2={axisY + (index % 5 === 0 ? 62 : 54)} key={index} />)}
      </g>
      {state.parameters.showLabels ? <g className="thin-lens-focus-marks">
        {[{x: lensX - 2 * fPx, label: "2F"}, {x: leftFocus.x, label: "F"}, {x: rightFocus.x, label: "F′"}, {x: lensX + 2 * fPx, label: "2F′"}].map((marker) => <g transform={`translate(${marker.x} ${axisY})`} key={`${marker.label}-${marker.x}`}><circle r="4" /><line y1="-8" y2="8" /><text y="25" textAnchor="middle">{marker.label}</text></g>)}
      </g> : null}
      <g className={`thin-lens-body ${state.parameters.lensType} ${highlighted("bench") ? "highlighted" : ""}`}>
        {state.parameters.lensType === "converging" ? <path d={`M ${lensX} ${axisY - 136} C ${lensX - 34} ${axisY - 90}, ${lensX - 34} ${axisY + 90}, ${lensX} ${axisY + 136} C ${lensX + 34} ${axisY + 90}, ${lensX + 34} ${axisY - 90}, ${lensX} ${axisY - 136} Z`} /> : <path d={`M ${lensX - 22} ${axisY - 136} C ${lensX + 16} ${axisY - 90}, ${lensX + 16} ${axisY + 90}, ${lensX - 22} ${axisY + 136} L ${lensX + 22} ${axisY + 136} C ${lensX - 16} ${axisY + 90}, ${lensX - 16} ${axisY - 90}, ${lensX + 22} ${axisY - 136} Z`} />}
        <line x1={lensX} x2={lensX} y1={axisY - 145} y2={axisY + 145} />
        <text x={lensX} y={axisY + 174} textAnchor="middle">{state.parameters.lensType === "converging" ? copy.canvas.converging : copy.canvas.diverging}</text>
      </g>
      <g className={`thin-lens-object ${highlighted("bench") ? "highlighted" : ""}`}><LensArrow x={objectX} axisY={axisY} tipY={objectTipY} label={copy.canvas.object} /></g>
      <g className={`thin-lens-ray parallel ${highlighted("parallel-ray") ? "highlighted" : ""}`} opacity={showRay1}>
        <line className="incident" x1={objectX} x2={lensX} y1={objectTipY} y2={objectTipY} />
        <line className="refracted" x1={lensX} x2={rightLimit} y1={objectTipY} y2={ray1End.y} />
        {state.parameters.showLabels ? <text x={rightLimit - 12} y={rayLabelY(ray1End.y)} textAnchor="end">{copy.canvas.parallel}</text> : null}
      </g>
      <g className={`thin-lens-ray center ${highlighted("center-ray") ? "highlighted" : ""}`} opacity={showRay2}>
        <line className="incident" x1={objectX} x2={lensX} y1={objectTipY} y2={axisY} />
        <line className="refracted" x1={lensX} x2={rightLimit} y1={axisY} y2={centerEnd.y} />
        {state.parameters.showLabels ? <text x={rightLimit - 12} y={rayLabelY(centerEnd.y)} textAnchor="end">{copy.canvas.center}</text> : null}
      </g>
      <g className={`thin-lens-ray focal ${highlighted("focal-ray") ? "highlighted" : ""}`} opacity={showRay3}>
        <line className="incident" x1={objectX} x2={lensX} y1={objectTipY} y2={focalLensY} />
        <line className="refracted" x1={lensX} x2={rightLimit} y1={focalLensY} y2={focalLensY} />
        {state.parameters.showLabels ? <text x={rightLimit - 12} y={rayLabelY(focalLensY)} textAnchor="end">{copy.canvas.focal}</text> : null}
      </g>
      {isVirtual && imageX !== null && imageTipY !== null && state.parameters.showPrincipalRays ? <g className={`thin-lens-extensions ${highlighted("image") ? "highlighted" : ""}`} opacity={showImage}>
        <line x1={lensX} x2={imageX} y1={objectTipY} y2={ray1BackY} />
        <line x1={lensX} x2={imageX} y1={axisY} y2={centerBackY} />
        <line x1={lensX} x2={imageX} y1={focalLensY} y2={focalBackY} />
        {state.parameters.showLabels ? <text x={(lensX + imageX) / 2 + 18} y={Math.min(imageTipY, objectTipY) - 34} textAnchor="middle">{copy.canvas.virtualExtension}</text> : null}
      </g> : null}
      {imageX !== null && imageTipY !== null ? <g className={`thin-lens-image ${state.regime} ${highlighted("image") ? "highlighted" : ""}`} opacity={showImage}><LensArrow x={imageX} axisY={axisY} tipY={imageTipY} label={copy.canvas.image} virtual={isVirtual} /></g> : null}
      {state.regime === "at-focus" ? <g className="thin-lens-infinity-banner" opacity={showImage}><rect x={apparatus.x + 62} y={apparatus.y + apparatus.h - 76} width={apparatus.w - 124} height="42" rx="5" /><text x={apparatus.x + apparatus.w / 2} y={apparatus.y + apparatus.h - 49} textAnchor="middle">{copy.canvas.noFiniteImage}</text></g> : null}
    </g>
    <g className={`thin-lens-readings ${highlighted("equation") ? "highlighted" : ""}`} transform={`translate(${readings.x} ${readings.y})`}>
      <rect width={readings.w} height={readings.h} rx="8" />
      <text className="thin-lens-panel-kicker" x="20" y="30">{copy.canvas.formula}</text>
      <text className="thin-lens-formula" x="20" y={readingRows.formula1}>1/f = 1/u + 1/v</text>
      <text className="thin-lens-formula secondary" x="20" y={readingRows.formula2}>m = −v/u = hᵢ/hₒ</text>
      <line x1="20" x2={readings.w - 20} y1={readingRows.divider} y2={readingRows.divider} />
      <text className="thin-lens-panel-kicker" x="20" y={readingRows.kicker}>{copy.canvas.result}</text>
      <text className="thin-lens-result" x="20" y={readingRows.result}>{landscape ? <><tspan>{imageResultPrimary}</tspan><tspan x="20" dy="22">{imageResultSecondary}</tspan></> : `${imageResultPrimary} · ${imageResultSecondary}`}</text>
      <g className="thin-lens-reading-row" transform={`translate(20 ${readingRows.f})`}><text>f</text><text x={readings.w - 40} textAnchor="end">{formatSignedDistance(state.signedFocalLengthMeters, locale)}</text></g>
      <g className="thin-lens-reading-row" transform={`translate(20 ${readingRows.u})`}><text>u</text><text x={readings.w - 40} textAnchor="end">{formatNumber(u, locale)} m</text></g>
      <g className="thin-lens-reading-row accent" transform={`translate(20 ${readingRows.v})`}><text>v</text><text x={readings.w - 40} textAnchor="end">{formatSignedDistance(state.imageDistanceMeters, locale)}</text></g>
      <g className="thin-lens-reading-row" transform={`translate(20 ${readingRows.m})`}><text>m</text><text x={readings.w - 40} textAnchor="end">{state.magnification === null ? "∞" : formatNumber(state.magnification, locale)}</text></g>
      <text className="thin-lens-sign-note" x="20" y={readingRows.sign}>{copy.canvas.distanceSign}</text>
      <text className="thin-lens-model-note" x="20" y={readingRows.note}>{copy.canvas.constructionNote}</text>
    </g>
    {narrationStep ? <g className="narration-overlay thin-lens-narration-overlay"><text className="narration-step-number" x={landscape ? 48 : 42} y={viewHeight - 75}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={landscape ? 138 : 132} y={viewHeight - 77}>{narrationStep.title}</text><text className="narration-step-caption" x={landscape ? 138 : 132} y={viewHeight - 43}>{narrationStep.caption}</text></g> : null}
  </svg>;
}

export function ThinLensWorkbench() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [parameters, setParameters] = useState<ThinLensParameters>(thinLensDefaults);
  const [preset, setPreset] = useState<LensPreset>("at-2f");
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("16:9");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [panMode, setPanMode] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textOverrides, setTextOverrides] = useState<LensTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<LensDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);
  const copy = lensCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => thinLensParametersSchema.safeParse(parameters), [parameters]);
  const renderedState = useMemo(() => parsedParameters.success ? solveThinLens(parsedParameters.data) : null, [parsedParameters]);
  const issues = useMemo(() => inspectThinLens(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const narrationSteps = useMemo(() => buildNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = useMemo(() => getNarrationDuration(narrationSteps), [narrationSteps]);
  const narrationFrame = useMemo(() => resolveNarrationFrame(narrationSteps, narrationTimeSeconds, 1), [narrationSteps, narrationTimeSeconds]);
  const constructionProgress = 1;

  useEffect(() => {const saved = window.localStorage.getItem("science-studio-locale"); if (saved === "en" || saved === "zh-CN") {setLocale(saved); document.documentElement.lang = saved;}}, []);
  useEffect(() => {const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current); document.addEventListener("fullscreenchange", onFullscreen); return () => document.removeEventListener("fullscreenchange", onFullscreen);}, []);
  useEffect(() => {
    if (!isPlaying) {lastTimestampRef.current = null; return;}
    const tick = (timestamp: number) => {const previous = lastTimestampRef.current ?? timestamp; lastTimestampRef.current = timestamp; const delta = (timestamp - previous) / 1000; setNarrationTimeSeconds((current) => {const next = Math.min(narrationDuration, current + delta); if (next >= narrationDuration) setIsPlaying(false); return next;}); animationRef.current = requestAnimationFrame(tick);};
    animationRef.current = requestAnimationFrame(tick);
    return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [isPlaying, narrationDuration]);

  const resetConstruction = useCallback(() => setIsPlaying(false), []);
  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {setParameters((current) => ({...current, [key]: value})); setPreset("custom"); resetConstruction();}, [resetConstruction]);
  const applyPreset = useCallback((next: Exclude<LensPreset, "custom">) => {const values: ThinLensParameters = next === "beyond-2f" ? {...thinLensDefaults, objectDistanceMeters: 0.45} : next === "at-2f" ? thinLensDefaults : next === "inside-f" ? {...thinLensDefaults, objectDistanceMeters: 0.1} : {...thinLensDefaults, lensType: "diverging", objectDistanceMeters: 0.3}; setParameters(values); setPreset(next); resetConstruction();}, [resetConstruction]);
  const updateLensType = useCallback((lensType: ThinLensParameters["lensType"]) => {setParameters((current) => ({...current, lensType})); setPreset("custom"); resetConstruction();}, [resetConstruction]);
  const toggleBoolean = useCallback((key: "showLabels" | "showPrincipalRays") => setParameters((current) => ({...current, [key]: !current[key]})), []);
  const stopAndResetTime = useCallback(() => {setIsPlaying(false); setNarrationTimeSeconds(0);}, []);
  const step = useCallback((direction: -1 | 1) => {setIsPlaying(false); setNarrationTimeSeconds((current) => Math.min(narrationDuration, Math.max(0, current + direction / FPS)));}, [narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {setIsPlaying(false); setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));}, [narrationSteps]);
  const updateNarrationText = useCallback((id: LensStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: LensStepId, value: number) => {if (!Number.isFinite(value)) return; setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));}, []);
  const restoreNarrationDefaults = useCallback(() => {setTextOverrides({}); setDurationOverrides({}); setNarrationTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleLocale = useCallback(() => setLocale((current) => {const next = current === "en" ? "zh-CN" : "en"; window.localStorage.setItem("science-studio-locale", next); document.documentElement.lang = next; return next;}), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {if (atZoom <= 1) return {x: 0, y: 0}; const width = stageAreaRef.current?.clientWidth ?? 900; const height = stageAreaRef.current?.clientHeight ?? 600; const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35); const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35); return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};}, []);
  const resetCanvasView = useCallback(() => {setZoom(1); setPan({x: 0, y: 0}); setPanMode(false); setIsDraggingCanvas(false); panDragRef.current = null;}, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))); setPan((currentPan) => clampPan(currentPan, next)); if (next <= 1) setPanMode(false); return next;}), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {setAspectRatio(next); resetCanvasView();}, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen(); else await workbenchRef.current?.requestFullscreen();}, []);

  return <main className={`workbench-shell traveling-wave-workbench thin-lens-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar"><div className="project-identity"><ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="thin-lens-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div><nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav><div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div></header>
    <section className="workspace"><div className="stage-area wave-stage-area" ref={stageAreaRef}><div className="stage-meta wave-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="wave-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div><div className={`wave-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation} onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}} onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}} onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}} onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}} onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}} onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}><ThinLensCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} constructionProgress={constructionProgress} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} /></div></div>
      <aside className="parameter-panel">{mode === "experiment" ? <><div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div><div className="parameter-list"><div className="parameter-control thin-lens-preset-control"><span className="thin-lens-control-label">{copy.parameters.presets}</span><div className="thin-lens-preset-buttons" role="group" aria-label={copy.parameters.presets}>{(["beyond-2f", "at-2f", "inside-f", "diverging"] as const).map((item) => <button className={preset === item ? "active" : ""} type="button" aria-pressed={preset === item} onClick={() => applyPreset(item)} key={item}>{copy.presets[item]}</button>)}</div></div><div className="parameter-control"><span className="thin-lens-control-label">{copy.parameters.lensType}</span><div className="thin-lens-segmented" role="group" aria-label={copy.parameters.lensType}>{(["converging", "diverging"] as const).map((lensType) => <button className={parameters.lensType === lensType ? "active" : ""} type="button" aria-pressed={parameters.lensType === lensType} onClick={() => updateLensType(lensType)} key={lensType}>{copy.lensTypes[lensType]}</button>)}</div></div>{numericDefinitions.map((definition) => {const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; return <div className="parameter-control" key={definition.key}><div className="parameter-row"><label htmlFor={`thin-lens-${definition.key}`}>{label}</label><div className="number-field"><input id={`thin-lens-${definition.key}`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}{(["showLabels", "showPrincipalRays"] as const).map((key) => <div className="parameter-control wave-toggle-parameter" key={key}><span className="wave-control-label">{key === "showLabels" ? copy.parameters.labels : copy.parameters.rays}</span><button className={`wave-switch-control ${parameters[key] ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters[key]} onClick={() => toggleBoolean(key)}><Check size={15} /><span>{parameters[key] ? copy.toggles.shown : copy.toggles.hidden}</span><span className="wave-switch-track" aria-hidden="true"><span /></span></button></div>)}</div>
        <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements thin-lens-measurements"><div className="thin-lens-measurement-heading"><dt>{copy.measurements.outcome}</dt><dd>{renderedState ? copy.regime[renderedState.regime] : "--"}</dd></div><div><dt>{copy.measurements.focalLength}</dt><dd>{renderedState ? formatSignedDistance(renderedState.signedFocalLengthMeters, locale) : "--"}</dd></div><div><dt>{copy.measurements.objectDistance}</dt><dd>{renderedState ? formatNumber(renderedState.parameters.objectDistanceMeters, locale) : "--"}<small>m</small></dd></div><div><dt>{copy.measurements.imageDistance}</dt><dd>{renderedState ? formatSignedDistance(renderedState.imageDistanceMeters, locale) : "--"}</dd></div><div><dt>{copy.measurements.magnification}</dt><dd>{renderedState?.magnification === null || !renderedState ? "∞" : formatNumber(renderedState.magnification, locale)}<small>×</small></dd></div><div><dt>{copy.measurements.objectHeight}</dt><dd>{renderedState ? formatNumber(renderedState.parameters.objectHeightMeters, locale) : "--"}<small>m</small></dd></div><div><dt>{copy.measurements.imageHeight}</dt><dd>{renderedState?.imageHeightMeters === null || !renderedState ? "∞" : formatNumber(renderedState.imageHeightMeters, locale)}<small>m</small></dd></div></dl></section><section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section></> : <><div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div><div className="narration-step-list" aria-label={commonCopy.narration.steps}>{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div><section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as LensStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as LensStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as LensStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section></>}</aside>
    </section>{mode === "narration" ? <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (narrationTimeSeconds >= narrationDuration) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(narrationTimeSeconds, locale, 1)} <small>/ {formatNumber(narrationDuration, locale, 0)} s</small></span><div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={narrationDuration} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div><span className="thin-lens-footer-law"><Aperture size={14} />1/f = 1/u + 1/v</span></footer> : null}
  </main>;
}
