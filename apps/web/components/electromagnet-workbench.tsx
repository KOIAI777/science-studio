"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  ELECTROMAGNET_DURATION_SECONDS,
  electromagnetDefaults,
  electromagnetParametersSchema,
  electromagnetTemplate,
  inspectElectromagnet,
  solveElectromagnet,
  type ElectromagnetCore,
  type ElectromagnetDirection,
  type ElectromagnetParameters,
  type ElectromagnetState,
} from "@science-studio/templates/electromagnet";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  Compass,
  FlaskConical,
  Info,
  Languages,
  ListRestart,
  LockKeyhole,
  Magnet,
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
type NumericParameterKey = "currentA" | "turns" | "coilLengthM" | "probeDistanceM";
type ElectromagnetStepId = "circuit" | "coil" | "field" | "polarity" | "core" | "probe";
type ElectromagnetStepText = Record<ElectromagnetStepId, {title: string; caption: string}>;
type ElectromagnetTextOverrides = Partial<Record<ElectromagnetStepId, Partial<{title: string; caption: string}>>>;
type ElectromagnetDurationOverrides = Partial<Record<ElectromagnetStepId, number>>;
type ElectromagnetPreset = "baseline" | "more-turns" | "iron-core" | "reverse" | "custom";

interface ElectromagnetCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {presets: string; core: string; direction: string; switch: string};
  presets: Record<Exclude<ElectromagnetPreset, "custom">, string>;
  cores: Record<ElectromagnetCore, string>;
  directions: Record<ElectromagnetDirection, string>;
  toggles: {closed: string; open: string};
  measurements: {title: string; model: string; center: string; probe: string; ampereTurns: string; turnDensity: string; deflection: string; poles: string};
  canvas: {
    ariaLabel: string; title: string; subtitle: string; badge: string; source: string; closed: string; open: string;
    current: string; coil: string; turns: string; airCore: string; ironCore: string; field: string; noField: string;
    compass: string; earthNorth: string; probe: string; model: string; centerField: string; probeField: string;
    ampereTurns: string; turnDensity: string; deflection: string; rightHandRule: string; viewingEnd: string; invalid: string;
  };
  viewport: {ratio: string; portrait: string; landscape: string; zoomOut: string; zoomIn: string; move: string; fit: string; enterFullscreen: string; exitFullscreen: string; canvasNavigation: string};
  narration: ElectromagnetStepText;
  issues: {invalidTitle: string; invalidDetail: string; limitTitle: string; limitDetail: string; assumptionTitle: string; assumptionDetail: string};
}

const electromagnetCopy: Record<Locale, ElectromagnetCopy> = {
  en: {
    projectName: "Electromagnets: Current, Coils & Polarity",
    packName: "Middle School Pack",
    parameters: {presets: "Classroom preset", currentA: "Current", turns: "Coil turns", coilLengthM: "Coil length", probeDistanceM: "Probe distance", core: "Core material", direction: "Current viewed from right end", switch: "Circuit switch"},
    presets: {baseline: "Baseline", "more-turns": "More turns", "iron-core": "Iron core", reverse: "Reverse"},
    cores: {air: "Air", iron: "Iron"},
    directions: {counterclockwise: "Counterclockwise", clockwise: "Clockwise"},
    toggles: {closed: "Closed", open: "Open"},
    measurements: {title: "Field measurements", model: "Finite ideal solenoid", center: "Center field", probe: "Probe field", ampereTurns: "Ampere-turns", turnDensity: "Turn density", deflection: "Compass deflection", poles: "Left / right poles"},
    canvas: {ariaLabel: "An energized solenoid with magnetic field lines, labeled poles, and a compass probe", title: "Current turns a coil into a magnet", subtitle: "Change one variable, then test strength and polarity", badge: "RIGHT-HAND GRIP RULE", source: "DC SOURCE", closed: "CIRCUIT CLOSED", open: "CIRCUIT OPEN", current: "CONVENTIONAL CURRENT", coil: "COPPER COIL", turns: "turns", airCore: "AIR CORE", ironCore: "LINEAR IRON CORE", field: "CALCULATED AXIAL FIELD", noField: "NO CURRENT · NO MAGNETIC FIELD", compass: "COMPASS PROBE", earthNorth: "EARTH NORTH", probe: "from coil end", model: "FINITE SOLENOID MODEL", centerField: "CENTER FIELD", probeField: "PROBE FIELD", ampereTurns: "AMPERE-TURNS", turnDensity: "TURN DENSITY", deflection: "COMPASS DEFLECTION", rightHandRule: "Curl fingers with current; thumb points to N", viewingEnd: "Direction is viewed from the right end", invalid: "Fix the parameters to resume"},
    viewport: {ratio: "Canvas ratio", portrait: "Portrait 9:16", landscape: "Widescreen 16:9", zoomOut: "Zoom out", zoomIn: "Zoom in", move: "Move canvas", fit: "Fit canvas", enterFullscreen: "Enter fullscreen", exitFullscreen: "Exit fullscreen", canvasNavigation: "Canvas navigation"},
    narration: {
      circuit: {title: "Close the DC circuit", caption: "Conventional current moves through the winding and creates a steady magnetic field."},
      coil: {title: "Count turns per metre", caption: "More turns in the same length increase the turn density N/L."},
      field: {title: "Calculate field strength", caption: "At fixed geometry, the solenoid field scales with current and turn count."},
      polarity: {title: "Use the right-hand grip rule", caption: "Viewed from the right end, counterclockwise current makes that end north."},
      core: {title: "Insert the iron core", caption: "The classroom model applies a constant effective permeability; real cores eventually saturate."},
      probe: {title: "Read the compass probe", caption: "The external axial field weakens with distance and turns the compass away from Earth north."},
    },
    issues: {invalidTitle: "Invalid parameter", invalidDetail: "Check the highlighted input before running the experiment.", limitTitle: "Linear core limit", limitDetail: "A real iron core may begin to saturate here, so field strength will not keep scaling linearly.", assumptionTitle: "Ideal finite-solenoid model", assumptionDetail: "Turns are uniform and core permeability is constant; heating, hysteresis, saturation, and switching transients are excluded."},
  },
  "zh-CN": {
    projectName: "电磁铁：电流、线圈与磁极",
    packName: "初中物理实验包",
    parameters: {presets: "课堂预设", currentA: "电流", turns: "线圈匝数", coilLengthM: "线圈长度", probeDistanceM: "探针距离", core: "铁芯材料", direction: "从右端观察电流方向", switch: "电路开关"},
    presets: {baseline: "基础", "more-turns": "增加匝数", "iron-core": "加入铁芯", reverse: "反向电流"},
    cores: {air: "空气", iron: "铁芯"},
    directions: {counterclockwise: "逆时针", clockwise: "顺时针"},
    toggles: {closed: "闭合", open: "断开"},
    measurements: {title: "磁场测量", model: "有限长理想螺线管", center: "中心磁场", probe: "探针磁场", ampereTurns: "安匝数", turnDensity: "匝密度", deflection: "指南针偏转", poles: "左端 / 右端磁极"},
    canvas: {ariaLabel: "通电螺线管、磁力线、磁极与指南针探针", title: "电流让线圈成为磁体", subtitle: "每次改变一个变量，再检验磁场强弱与磁极", badge: "右手螺旋定则", source: "直流电源", closed: "电路闭合", open: "电路断开", current: "常规电流", coil: "铜线线圈", turns: "匝", airCore: "空气芯", ironCore: "线性铁芯", field: "轴线磁场计算结果", noField: "无电流 · 无磁场", compass: "指南针探针", earthNorth: "地磁北", probe: "距线圈端", model: "有限长螺线管模型", centerField: "中心磁场", probeField: "探针磁场", ampereTurns: "安匝数", turnDensity: "匝密度", deflection: "指南针偏转", rightHandRule: "四指沿电流弯曲，拇指指向 N 极", viewingEnd: "电流方向从线圈右端观察", invalid: "修正参数后恢复实验"},
    viewport: {ratio: "画布比例", portrait: "竖版 9:16", landscape: "横版 16:9", zoomOut: "缩小", zoomIn: "放大", move: "移动画布", fit: "适应画布", enterFullscreen: "进入全屏", exitFullscreen: "退出全屏", canvasNavigation: "画布导航"},
    narration: {
      circuit: {title: "闭合直流电路", caption: "常规电流流过线圈，线圈周围建立稳恒磁场。"},
      coil: {title: "计算单位长度匝数", caption: "长度不变时增加匝数，会增大匝密度 N/L。"},
      field: {title: "计算磁场强度", caption: "几何条件不变时，螺线管磁场随电流和匝数增大。"},
      polarity: {title: "使用右手螺旋定则", caption: "从右端看，电流逆时针时右端为 N 极。"},
      core: {title: "插入铁芯", caption: "课堂模型使用恒定有效磁导率；真实铁芯最终会发生磁饱和。"},
      probe: {title: "读取指南针探针", caption: "外部轴线磁场随距离减弱，并使指针偏离地磁北方向。"},
    },
    issues: {invalidTitle: "参数无法运行", invalidDetail: "运行实验前请检查高亮的参数。", limitTitle: "线性铁芯近似达到边界", limitDetail: "真实铁芯在此处可能开始磁饱和，磁场不会继续线性增长。", assumptionTitle: "有限长理想螺线管模型", assumptionDetail: "线圈均匀绕制且铁芯磁导率恒定；不模拟发热、磁滞、磁饱和和开关瞬态。"},
  },
};

const numericDefinitions = electromagnetTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

function formatNumber(value: number, locale: Locale, digits = 1) {
  return new Intl.NumberFormat(locale, {minimumFractionDigits: digits, maximumFractionDigits: digits}).format(value);
}

function formatField(valueT: number, locale: Locale) {
  if (valueT >= 1e-3) return `${formatNumber(valueT * 1e3, locale, 2)} mT`;
  return `${formatNumber(valueT * 1e6, locale, 1)} µT`;
}

function stableSvgCoordinate(value: number) {
  return Number(value.toFixed(3));
}

function coilHalfTurnPath(centerX: number, centerY: number, sweep: 0 | 1) {
  const tilt = 6;
  const radiusX = 20;
  const radiusY = 88;
  return `M ${stableSvgCoordinate(centerX - tilt)} ${stableSvgCoordinate(centerY - radiusY)} A ${radiusX} ${radiusY} 0 0 ${sweep} ${stableSvgCoordinate(centerX + tilt)} ${stableSvgCoordinate(centerY + radiusY)}`;
}

function localizeIssue(issue: ScienceIssue, copy: ElectromagnetCopy): ScienceIssue {
  if (issue.severity === "blocking") return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "linear-core-limit") return {...issue, title: copy.issues.limitTitle, detail: copy.issues.limitDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function buildNarration(copy: ElectromagnetStepText, textOverrides: ElectromagnetTextOverrides, durationOverrides: ElectromagnetDurationOverrides): NarrationStep[] {
  return electromagnetTemplate.narration.map((definition) => {
    const id = definition.id as ElectromagnetStepId;
    return {...definition, title: textOverrides[id]?.title ?? copy[id].title, caption: textOverrides[id]?.caption ?? copy[id].caption, durationSeconds: durationOverrides[id] ?? definition.durationSeconds};
  });
}

function ElectromagnetCanvas({state, locale, aspectRatio, narrationStep, narrationStepIndex, narrationStepCount}: {state: ElectromagnetState | null; locale: Locale; aspectRatio: CanvasAspectRatio; narrationStep?: NarrationStep; narrationStepIndex?: number; narrationStepCount?: number}) {
  const copy = electromagnetCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const apparatus = landscape ? {x: 70, y: 150, w: 820, h: 430} : {x: 50, y: 180, w: 620, h: 560};
  const readings = landscape ? {x: 920, y: 150, w: 290, h: 430} : {x: 50, y: 770, w: 620, h: 360};
  const coilLength = state ? 330 + ((state.parameters.coilLengthM - 0.12) / 0.24) * 170 : 420;
  const coilCx = apparatus.x + apparatus.w * (landscape ? 0.48 : 0.46);
  const coilCy = apparatus.y + (landscape ? 220 : 260);
  const coilLeft = coilCx - coilLength / 2;
  const coilRight = coilCx + coilLength / 2;
  const turnLines = state ? Math.round(9 + ((state.parameters.turns - 40) / 200) * 13) : 14;
  const turnCenters = Array.from({length: turnLines}, (_, index) => coilLeft + (index / Math.max(1, turnLines - 1)) * coilLength);
  const probeOffset = state ? 82 + ((state.parameters.probeDistanceM - 0.06) / 0.29) * (landscape ? 95 : 60) : 120;
  const compassX = Math.min(apparatus.x + apparatus.w - 72, coilRight + probeOffset);
  const compassY = coilCy;
  const currentActive = Boolean(state?.active);
  const rightIsNorth = state?.rightPole === "north";
  const externalStart = rightIsNorth ? coilRight : coilLeft;
  const externalEnd = rightIsNorth ? coilLeft : coilRight;
  const internalStart = rightIsNorth ? coilLeft : coilRight;
  const internalEnd = rightIsNorth ? coilRight : coilLeft;
  const highlighted = (id: ElectromagnetStepId) => narrationStep?.id === id;
  const currentMarkers = state?.active ? Array.from({length: 6}, (_, index) => {
    const phase = (state.currentMarkerPhase + index / 6) % 1;
    const angle = -Math.PI / 2 + phase * Math.PI * 2;
    const turnIndex = Math.round(((index + 0.5) / 6) * (turnCenters.length - 1));
    const centerX = turnCenters[turnIndex] ?? coilCx;
    const markerX = stableSvgCoordinate(centerX + Math.cos(angle) * 20);
    const markerY = stableSvgCoordinate(coilCy + Math.sin(angle) * 88);
    const tangentX = -Math.sin(angle) * 20 * state.directionSign;
    const tangentY = Math.cos(angle) * 88 * state.directionSign;
    const rotation = stableSvgCoordinate(Math.atan2(tangentY, tangentX) * 180 / Math.PI);
    return {index, markerX, markerY, rotation, side: Math.cos(angle) >= 0 ? "front" : "back"};
  }) : [];
  const renderCurrentMarkers = (side: "front" | "back") => currentMarkers
    .filter((marker) => marker.side === side)
    .map((marker) => <g className={`electromagnet-current-marker is-${side}`} transform={`translate(${marker.markerX} ${marker.markerY}) rotate(${marker.rotation})`} aria-hidden="true" key={marker.index}><path d="M -8 -5 L 8 0 L -8 5 Z" /></g>);

  return <svg className={`wave-canvas electromagnet-canvas ${landscape ? "is-landscape" : "is-portrait"}`} viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="electromagnet-canvas-title electromagnet-canvas-description">
    <title id="electromagnet-canvas-title">{copy.canvas.ariaLabel}</title><desc id="electromagnet-canvas-description">{copy.canvas.subtitle}</desc>
    <defs>
      <linearGradient id="electromagnet-core-gradient" x1="0" x2="1"><stop offset="0" stopColor="#34474c" /><stop offset="0.5" stopColor="#7d8c8e" /><stop offset="1" stopColor="#34474c" /></linearGradient>
      <linearGradient id="electromagnet-copper-gradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#7c3d23" /><stop offset="0.38" stopColor="#e39a68" /><stop offset="0.62" stopColor="#f2bb86" /><stop offset="1" stopColor="#9a4d2a" /></linearGradient>
      <marker id="electromagnet-field-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" /></marker>
    </defs>
    <rect width={viewWidth} height={viewHeight} className="electromagnet-canvas-bg" />
    <g className="electromagnet-heading"><text className="canvas-eyebrow" x={landscape ? 70 : 50} y={landscape ? 44 : 64}>SCIENCE STUDIO · ELECTROMAGNETISM</text><text className="canvas-title" x={landscape ? 70 : 50} y={landscape ? 84 : 108}>{copy.canvas.title}</text><text className="canvas-subtitle" x={landscape ? 70 : 50} y={landscape ? 116 : 143}>{copy.canvas.subtitle}</text><g className="electromagnet-rule-badge" transform={`translate(${landscape ? 956 : 410} ${landscape ? 50 : 45})`}><rect width={landscape ? 254 : 260} height="48" rx="6" /><text x={landscape ? 127 : 130} y="29" textAnchor="middle">{copy.canvas.badge}</text></g></g>
    {state ? <>
      <g className={`electromagnet-apparatus ${highlighted("circuit") || highlighted("coil") || highlighted("field") || highlighted("polarity") || highlighted("core") ? "highlighted" : ""}`}>
        <rect className="electromagnet-panel-surface" x={apparatus.x} y={apparatus.y} width={apparatus.w} height={apparatus.h} rx="8" />
        <text className="electromagnet-panel-kicker" x={apparatus.x + 18} y={apparatus.y + 28}>{copy.canvas.field}</text>
        <g className={`electromagnet-source ${highlighted("circuit") ? "highlighted" : ""}`} transform={`translate(${apparatus.x + 28} ${coilCy - 61})`}><rect width="112" height="122" rx="7" /><text x="56" y="25" textAnchor="middle">{copy.canvas.source}</text><line x1="37" x2="75" y1="53" y2="53" /><line x1="45" x2="67" y1="69" y2="69" /><text x="56" y="99" textAnchor="middle">{formatNumber(state.parameters.currentA, locale, 1)} A</text></g>
        <path className={`electromagnet-circuit-wire ${currentActive ? "active" : ""}`} d={`M ${apparatus.x + 140} ${coilCy - 42} H ${coilLeft} M ${apparatus.x + 140} ${coilCy + 42} H ${coilLeft}`} />
        <g className={`electromagnet-switch ${state.parameters.switchClosed ? "closed" : "open"}`} transform={`translate(${apparatus.x + 164} ${coilCy - 62})`}><circle cx="0" cy="20" r="5" /><circle cx="58" cy="20" r="5" /><line x1="4" y1="18" x2="54" y2={state.parameters.switchClosed ? 20 : -3} /><text x="29" y="-15" textAnchor="middle">{state.parameters.switchClosed ? copy.canvas.closed : copy.canvas.open}</text></g>
        {currentActive ? [-125, -82, -45].map((offset) => <path className="electromagnet-field-line" markerEnd="url(#electromagnet-field-arrow)" d={`M ${externalStart} ${coilCy} C ${externalStart + (rightIsNorth ? 120 : -120)} ${coilCy + offset} ${externalEnd + (rightIsNorth ? -120 : 120)} ${coilCy + offset} ${externalEnd} ${coilCy}`} key={`top-${offset}`} />) : null}
        {currentActive ? [45, 82, 125].map((offset) => <path className="electromagnet-field-line" markerEnd="url(#electromagnet-field-arrow)" d={`M ${externalStart} ${coilCy} C ${externalStart + (rightIsNorth ? 120 : -120)} ${coilCy + offset} ${externalEnd + (rightIsNorth ? -120 : 120)} ${coilCy + offset} ${externalEnd} ${coilCy}`} key={`bottom-${offset}`} />) : null}
        {currentActive ? <line className="electromagnet-field-axis" x1={internalStart + (rightIsNorth ? 20 : -20)} x2={internalEnd + (rightIsNorth ? -20 : 20)} y1={coilCy} y2={coilCy} markerEnd="url(#electromagnet-field-arrow)" /> : null}
        <g className={`electromagnet-coil ${highlighted("coil") || highlighted("core") ? "highlighted" : ""}`}>
          <g className="electromagnet-coil-back" aria-hidden="true">{turnCenters.map((centerX, index) => <path d={coilHalfTurnPath(centerX, coilCy, 0)} key={`back-${index}`} />)}</g>
          <g className="electromagnet-current-markers is-back">{renderCurrentMarkers("back")}</g>
          <g className={`electromagnet-core-assembly ${state.parameters.core}`}>
            <rect className="electromagnet-core-body" x={coilLeft - 12} y={coilCy - 34} width={coilLength + 24} height="68" rx="10" />
            <ellipse className="electromagnet-core-end start" cx={coilLeft - 12} cy={coilCy} rx="15" ry="34" />
            <ellipse className="electromagnet-core-end finish" cx={coilRight + 12} cy={coilCy} rx="15" ry="34" />
            <path className="electromagnet-core-highlight" d={`M ${stableSvgCoordinate(coilLeft - 5)} ${stableSvgCoordinate(coilCy - 19)} H ${stableSvgCoordinate(coilRight + 7)}`} />
          </g>
          <g className="electromagnet-coil-front">{turnCenters.map((centerX, index) => <path d={coilHalfTurnPath(centerX, coilCy, 1)} key={`front-${index}`} />)}</g>
          <g className="electromagnet-current-markers is-front">{renderCurrentMarkers("front")}</g>
          <text className="electromagnet-coil-label" x={coilCx} y={coilCy - 112} textAnchor="middle">{copy.canvas.coil} · {state.parameters.turns} {copy.canvas.turns}</text>
          <text className="electromagnet-core-label" x={coilCx} y={coilCy + 8} textAnchor="middle">{state.parameters.core === "iron" ? copy.canvas.ironCore : copy.canvas.airCore}</text>
        </g>
        <g className={`electromagnet-poles ${highlighted("polarity") ? "highlighted" : ""}`}><g className={`electromagnet-pole ${state.leftPole}`} transform={`translate(${coilLeft - 36} ${coilCy - 30})`}><rect width="58" height="60" rx="6" /><text x="29" y="39" textAnchor="middle">{state.leftPole === "none" ? "—" : state.leftPole === "north" ? "N" : "S"}</text></g><g className={`electromagnet-pole ${state.rightPole}`} transform={`translate(${coilRight - 22} ${coilCy - 30})`}><rect width="58" height="60" rx="6" /><text x="29" y="39" textAnchor="middle">{state.rightPole === "none" ? "—" : state.rightPole === "north" ? "N" : "S"}</text></g></g>
        <text className="electromagnet-current-label" x={coilCx} y={coilCy + 121} textAnchor="middle">{state.active ? `${copy.canvas.current} · ${copy.directions[state.parameters.currentDirection]}` : copy.canvas.noField}</text>
        <g className={`electromagnet-compass ${highlighted("probe") ? "highlighted" : ""}`} transform={`translate(${compassX} ${compassY})`}><circle r="53" /><line className="earth-axis" x1="0" x2="0" y1="-68" y2="68" /><text className="earth-label" x="0" y="-76" textAnchor="middle">{copy.canvas.earthNorth}</text><g transform={`rotate(${state.compassDeflectionDegrees})`}><path className="compass-north" d="M 0 -42 L 10 0 L 0 -6 L -10 0 Z" /><path className="compass-south" d="M 0 42 L 10 0 L 0 6 L -10 0 Z" /></g><circle r="5" /><text className="compass-label" x="0" y="82" textAnchor="middle">{copy.canvas.compass}</text><text className="compass-reading" x="0" y="102" textAnchor="middle">{formatNumber(state.compassDeflectionDegrees, locale, 1)}°</text></g>
        <line className="electromagnet-probe-distance" x1={coilRight + 30} x2={compassX - 56} y1={coilCy + 116} y2={coilCy + 116} /><text className="electromagnet-probe-label" x={(coilRight + compassX - 26) / 2} y={coilCy + 140} textAnchor="middle">{formatNumber(state.parameters.probeDistanceM, locale, 2)} m {copy.canvas.probe}</text>
      </g>
      <g className={`electromagnet-readings ${highlighted("field") || highlighted("probe") ? "highlighted" : ""}`} transform={`translate(${readings.x} ${readings.y})`}><rect width={readings.w} height={readings.h} rx="8" /><text className="electromagnet-panel-kicker" x="20" y="30">{copy.canvas.model}</text><text className="electromagnet-formula" x="20" y="76">B(z) = μ₀ μᵣ n I · G(z)</text><line x1="20" x2={readings.w - 20} y1="98" y2="98" />
        <g className="electromagnet-reading-row" transform="translate(20 126)"><text>{copy.canvas.centerField}</text><text x={readings.w - 40} textAnchor="end">{formatField(state.centerFieldT, locale)}</text></g>
        <g className="electromagnet-reading-row" transform="translate(20 166)"><text>{copy.canvas.probeField}</text><text x={readings.w - 40} textAnchor="end">{formatField(state.probeFieldT, locale)}</text></g>
        <g className="electromagnet-reading-row" transform="translate(20 206)"><text>{copy.canvas.ampereTurns}</text><text x={readings.w - 40} textAnchor="end">{formatNumber(state.ampereTurns, locale, 0)} A·turn</text></g>
        <g className="electromagnet-reading-row" transform="translate(20 246)"><text>{copy.canvas.turnDensity}</text><text x={readings.w - 40} textAnchor="end">{formatNumber(state.turnDensityPerM, locale, 0)} m⁻¹</text></g>
        <g className="electromagnet-reading-row accent" transform="translate(20 286)"><text>{copy.canvas.deflection}</text><text x={readings.w - 40} textAnchor="end">{formatNumber(state.compassDeflectionDegrees, locale, 1)}°</text></g>
        <g className="electromagnet-strength-meter" transform={`translate(20 ${readings.h - 104})`}><rect width={readings.w - 40} height="13" rx="6.5" /><rect width={(readings.w - 40) * state.normalizedFieldStrength} height="13" rx="6.5" /></g>
        <text className="electromagnet-rule-note" x="20" y={readings.h - 55}>{copy.canvas.rightHandRule}</text><text className="electromagnet-model-note" x="20" y={readings.h - 29}>{copy.canvas.viewingEnd}</text>
      </g>
      {narrationStep ? <g className="narration-overlay electromagnet-narration-overlay"><text className="narration-step-number" x={landscape ? 70 : 50} y={viewHeight - 75}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={landscape ? 160 : 140} y={viewHeight - 77}>{narrationStep.title}</text><text className="narration-step-caption" x={landscape ? 160 : 140} y={viewHeight - 43}>{narrationStep.caption}</text></g> : null}
    </> : <g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g>}
  </svg>;
}

export function ElectromagnetWorkbench() {
  const [parameters, setParameters] = useState<ElectromagnetParameters>(electromagnetDefaults);
  const [preset, setPreset] = useState<ElectromagnetPreset>("baseline");
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
  const [textOverrides, setTextOverrides] = useState<ElectromagnetTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<ElectromagnetDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);
  const copy = electromagnetCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => electromagnetParametersSchema.safeParse(parameters), [parameters]);
  const issues = useMemo(() => inspectElectromagnet(parameters).map((issue) => localizeIssue(issue, copy)), [parameters, copy]);
  const narrationSteps = useMemo(() => buildNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = useMemo(() => getNarrationDuration(narrationSteps), [narrationSteps]);
  const narrationFrame = useMemo(() => resolveNarrationFrame(narrationSteps, narrationTimeSeconds, ELECTROMAGNET_DURATION_SECONDS), [narrationSteps, narrationTimeSeconds]);
  const simulationTimeSeconds = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveElectromagnet(parsedParameters.data, simulationTimeSeconds) : null, [parsedParameters, simulationTimeSeconds]);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : ELECTROMAGNET_DURATION_SECONDS;

  useEffect(() => {const stored = window.localStorage.getItem("science-studio-locale"); if (stored === "zh-CN") setLocale("zh-CN");}, []);
  useEffect(() => {const onFullscreen = () => setIsFullscreen(document.fullscreenElement === workbenchRef.current); document.addEventListener("fullscreenchange", onFullscreen); return () => document.removeEventListener("fullscreenchange", onFullscreen);}, []);
  useEffect(() => {
    if (!isPlaying) {lastTimestampRef.current = null; if (animationRef.current !== null) cancelAnimationFrame(animationRef.current); return;}
    const tick = (timestamp: number) => {const previous = lastTimestampRef.current ?? timestamp; lastTimestampRef.current = timestamp; const delta = ((timestamp - previous) / 1000) * (mode === "narration" ? 1 : speed); const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; setter((current) => {const limit = mode === "narration" ? narrationDuration : ELECTROMAGNET_DURATION_SECONDS; const next = Math.min(limit, current + delta); if (next >= limit) setIsPlaying(false); return next;}); animationRef.current = requestAnimationFrame(tick);};
    animationRef.current = requestAnimationFrame(tick); return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [isPlaying, mode, narrationDuration, speed]);

  const resetObservation = useCallback(() => {setIsPlaying(false); setTimeSeconds(0);}, []);
  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {setParameters((current) => ({...current, [key]: value})); setPreset("custom"); resetObservation();}, [resetObservation]);
  const applyPreset = useCallback((next: Exclude<ElectromagnetPreset, "custom">) => {const values = next === "baseline" ? electromagnetDefaults : next === "more-turns" ? {...electromagnetDefaults, turns: 240} : next === "iron-core" ? {...electromagnetDefaults, core: "iron" as const} : {...electromagnetDefaults, currentDirection: "clockwise" as const}; setParameters(values); setPreset(next); resetObservation();}, [resetObservation]);
  const updateCore = useCallback((core: ElectromagnetCore) => {setParameters((current) => ({...current, core})); setPreset("custom"); resetObservation();}, [resetObservation]);
  const updateDirection = useCallback((currentDirection: ElectromagnetDirection) => {setParameters((current) => ({...current, currentDirection})); setPreset("custom"); resetObservation();}, [resetObservation]);
  const toggleSwitch = useCallback(() => {setParameters((current) => ({...current, switchClosed: !current.switchClosed})); setPreset("custom"); resetObservation();}, [resetObservation]);
  const stopAndResetTime = useCallback(() => {setIsPlaying(false); if (mode === "narration") setNarrationTimeSeconds(0); else setTimeSeconds(0);}, [mode]);
  const step = useCallback((direction: -1 | 1) => {setIsPlaying(false); const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds; const limit = mode === "narration" ? narrationDuration : ELECTROMAGNET_DURATION_SECONDS; setter((current) => Math.min(limit, Math.max(0, current + direction / FPS)));}, [mode, narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {setIsPlaying(false); setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));}, [narrationSteps]);
  const updateNarrationText = useCallback((id: ElectromagnetStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: ElectromagnetStepId, value: number) => {if (!Number.isFinite(value)) return; setDurationOverrides((current) => ({...current, [id]: Math.min(10, Math.max(1, value))}));}, []);
  const restoreNarrationDefaults = useCallback(() => {setTextOverrides({}); setDurationOverrides({}); setNarrationTimeSeconds(0); setIsPlaying(false);}, []);
  const toggleLocale = useCallback(() => setLocale((current) => {const next = current === "en" ? "zh-CN" : "en"; window.localStorage.setItem("science-studio-locale", next); document.documentElement.lang = next; return next;}), []);
  const clampPan = useCallback((nextPan: {x: number; y: number}, atZoom: number) => {if (atZoom <= 1) return {x: 0, y: 0}; const width = stageAreaRef.current?.clientWidth ?? 900; const height = stageAreaRef.current?.clientHeight ?? 600; const maxX = width * Math.min(0.48, (atZoom - 1) * 0.35); const maxY = height * Math.min(0.48, (atZoom - 1) * 0.35); return {x: Math.min(maxX, Math.max(-maxX, nextPan.x)), y: Math.min(maxY, Math.max(-maxY, nextPan.y))};}, []);
  const resetCanvasView = useCallback(() => {setZoom(1); setPan({x: 0, y: 0}); setPanMode(false); setIsDraggingCanvas(false); panDragRef.current = null;}, []);
  const changeZoom = useCallback((delta: number) => setZoom((current) => {const next = Math.min(2.5, Math.max(0.5, Number((current + delta).toFixed(2)))); setPan((currentPan) => clampPan(currentPan, next)); if (next <= 1) setPanMode(false); return next;}), [clampPan]);
  const changeAspectRatio = useCallback((next: CanvasAspectRatio) => {setAspectRatio(next); resetCanvasView();}, [resetCanvasView]);
  const toggleFullscreen = useCallback(async () => {if (document.fullscreenElement === workbenchRef.current) await document.exitFullscreen(); else await workbenchRef.current?.requestFullscreen();}, []);

  return <main className={`workbench-shell traveling-wave-workbench electromagnet-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar"><div className="project-identity"><ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="electromagnet-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div><nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav><div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div></header>
    <section className="workspace"><div className="stage-area wave-stage-area" ref={stageAreaRef}><div className="stage-meta wave-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="wave-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div><div className={`wave-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation} onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}} onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}} onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}} onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}} onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}} onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}><ElectromagnetCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} /></div></div>
      <aside className="parameter-panel">{mode === "experiment" ? <><div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div><div className="parameter-list"><div className="parameter-control electromagnet-preset-control"><span className="electromagnet-control-label">{copy.parameters.presets}</span><div className="electromagnet-preset-buttons" role="group" aria-label={copy.parameters.presets}>{(["baseline", "more-turns", "iron-core", "reverse"] as const).map((item) => <button className={preset === item ? "active" : ""} type="button" aria-pressed={preset === item} onClick={() => applyPreset(item)} key={item}>{copy.presets[item]}</button>)}</div></div>{numericDefinitions.map((definition) => {const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; return <div className="parameter-control" key={definition.key}><div className="parameter-row"><label htmlFor={`electromagnet-${definition.key}-number`}>{label}</label><div className="number-field"><input id={`electromagnet-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}<div className="parameter-control"><span className="electromagnet-control-label">{copy.parameters.core}</span><div className="electromagnet-segmented" role="group" aria-label={copy.parameters.core}>{(["air", "iron"] as ElectromagnetCore[]).map((core) => <button className={parameters.core === core ? "active" : ""} type="button" aria-pressed={parameters.core === core} onClick={() => updateCore(core)} key={core}>{copy.cores[core]}</button>)}</div></div><div className="parameter-control"><span className="electromagnet-control-label">{copy.parameters.direction}</span><div className="electromagnet-segmented" role="group" aria-label={copy.parameters.direction}>{(["counterclockwise", "clockwise"] as ElectromagnetDirection[]).map((direction) => <button className={parameters.currentDirection === direction ? "active" : ""} type="button" aria-pressed={parameters.currentDirection === direction} onClick={() => updateDirection(direction)} key={direction}>{copy.directions[direction]}</button>)}</div></div><div className="parameter-control wave-toggle-parameter"><span className="wave-control-label">{copy.parameters.switch}</span><button className={`wave-switch-control ${parameters.switchClosed ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.switchClosed} onClick={toggleSwitch}><Check size={15} /><span>{parameters.switchClosed ? copy.toggles.closed : copy.toggles.open}</span><span className="wave-switch-track" aria-hidden="true"><span /></span></button></div></div><section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements electromagnet-measurements"><div className="electromagnet-measurement-heading"><dt>{copy.measurements.poles}</dt><dd>{renderedState ? `${renderedState.leftPole === "none" ? "—" : renderedState.leftPole === "north" ? "N" : "S"} / ${renderedState.rightPole === "none" ? "—" : renderedState.rightPole === "north" ? "N" : "S"}` : "--"}</dd></div><div><dt>{copy.measurements.center}</dt><dd>{renderedState ? formatField(renderedState.centerFieldT, locale) : "--"}</dd></div><div><dt>{copy.measurements.probe}</dt><dd>{renderedState ? formatField(renderedState.probeFieldT, locale) : "--"}</dd></div><div><dt>{copy.measurements.ampereTurns}</dt><dd>{renderedState ? formatNumber(renderedState.ampereTurns, locale, 0) : "--"}<small>A·turn</small></dd></div><div><dt>{copy.measurements.turnDensity}</dt><dd>{renderedState ? formatNumber(renderedState.turnDensityPerM, locale, 0) : "--"}<small>m⁻¹</small></dd></div><div className="electromagnet-deflection-measurement"><dt><Compass size={13} />{copy.measurements.deflection}</dt><dd>{renderedState ? `${formatNumber(renderedState.compassDeflectionDegrees, locale, 1)}°` : "--"}</dd></div></dl></section><section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section></> : <><div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div><div className="narration-step-list" aria-label={commonCopy.narration.steps}>{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div><section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as ElectromagnetStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as ElectromagnetStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as ElectromagnetStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section></>}</aside>
    </section><footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{formatNumber(playbackTimeSeconds, locale, 1)} <small>/ {formatNumber(durationSeconds, locale, 0)} s</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / FPS} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Electromagnet observation time" : "电磁铁观察时间"} type="range" min="0" max={durationSeconds} step={1 / FPS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}<label className="speed-control"><span>{locale === "en" ? "Playback" : "播放速度"}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select></label><span className="electromagnet-footer-law"><Magnet size={14} />B ∝ μᵣ(N/L)I</span></footer>
  </main>;
}
