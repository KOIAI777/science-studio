"use client";

import {
  inclinedPlaneDefaults,
  inclinedPlaneParametersSchema,
  inclinedPlaneTemplate,
  inspectInclinedPlane,
  solveInclinedPlane,
  type InclinedPlaneParameters,
  type InclinedPlaneState,
} from "@science-studio/templates/inclined-plane";
import type {NarrationStep} from "@science-studio/experiment-schema";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  CircleGauge,
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
import {
  localizeScienceIssue,
  workbenchCopy,
  type Locale,
  type WorkbenchCopy,
} from "../lib/i18n";
import {
  buildNarrationSteps,
  getNarrationDuration,
  getNarrationStepStart,
  resolveNarrationFrame,
  type NarrationDurationOverrides,
  type NarrationStepId,
  type NarrationTextOverrides,
} from "../lib/narration";

const FPS = 30;

type ParameterKey = keyof InclinedPlaneParameters;
type EditorMode = "experiment" | "narration";

const parameterDefinitions = inclinedPlaneTemplate.parameterDefinitions as Array<{
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

  if (!trimmed.includes(" ")) {
    return [trimmed.slice(0, 26), trimmed.slice(26, 52)];
  }

  const words = trimmed.split(/\s+/);
  const lines: string[] = [""];
  for (const word of words) {
    const lineIndex = lines.length - 1;
    const candidate = `${lines[lineIndex]} ${word}`.trim();
    if (candidate.length <= 52 || lines[lineIndex] === "") {
      lines[lineIndex] = candidate;
    } else if (lines.length === 1) {
      lines.push(word);
    } else {
      lines[1] = `${lines[1]} ${word}`;
    }
  }
  return lines.slice(0, 2);
}

function InclinedPlaneCanvas({
  parameters,
  state,
  locale,
  copy,
  narrationStep,
  narrationStepIndex,
  narrationStepCount,
}: {
  parameters: InclinedPlaneParameters;
  state: InclinedPlaneState | null;
  locale: Locale;
  copy: WorkbenchCopy;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const rampPixels = 430;
  const angleRadians = (parameters.angleDegrees * Math.PI) / 180;
  const rampBottom = {x: 570, y: 920};
  const rampTop = {
    x: rampBottom.x - rampPixels * Math.cos(angleRadians),
    y: rampBottom.y - rampPixels * Math.sin(angleRadians),
  };
  const slopeUnit = {
    x: Math.cos(angleRadians),
    y: Math.sin(angleRadians),
  };
  const progress = state
    ? Math.min(state.displacementM / parameters.rampLengthM, 1)
    : 0;
  const blockStart = {
    x: rampTop.x + slopeUnit.x * 42,
    y: rampTop.y + slopeUnit.y * 42,
  };
  const blockEnd = {
    x: rampBottom.x - slopeUnit.x * 64,
    y: rampBottom.y - slopeUnit.y * 64,
  };
  const block = {
    x: blockStart.x + (blockEnd.x - blockStart.x) * progress,
    y: blockStart.y + (blockEnd.y - blockStart.y) * progress,
  };
  const angleArcRadius = 26;
  const angleArcPath = Array.from({length: 13}, (_, index) => {
    const arcAngle = (angleRadians * index) / 12;
    const x = rampBottom.x - angleArcRadius * Math.cos(arcAngle);
    const y = rampBottom.y - angleArcRadius * Math.sin(arcAngle);
    return `${index === 0 ? "M" : "L"} ${x} ${y}`;
  }).join(" ");
  const forceOrigin = {x: block.x, y: block.y - 32};
  const weightForceN = parameters.massKg * parameters.gravityMs2;
  const weightLength = 118;
  const normalLength = state && weightForceN > 0
    ? Math.max(82, (state.normalForceN / weightForceN) * weightLength)
    : 0;
  const frictionLength = state && weightForceN > 0
    ? Math.max(62, (state.frictionForceN / weightForceN) * weightLength)
    : 0;
  const normalVector = {
    x: Math.sin(angleRadians) * normalLength,
    y: -Math.cos(angleRadians) * normalLength,
  };
  const frictionVector = {
    x: -Math.cos(angleRadians) * frictionLength,
    y: -Math.sin(angleRadians) * frictionLength,
  };
  const parallelLength = Math.max(
    72,
    weightLength * Math.sin(angleRadians),
  );
  const parallelVector = {
    x: Math.cos(angleRadians) * parallelLength,
    y: Math.sin(angleRadians) * parallelLength,
  };
  const parallelEnd = {
    x: forceOrigin.x + parallelVector.x,
    y: forceOrigin.y + parallelVector.y,
  };
  const perpendicularLength = Math.max(
    90,
    weightLength * Math.cos(angleRadians),
  );
  const perpendicularEnd = {
    x: forceOrigin.x - Math.sin(angleRadians) * perpendicularLength,
    y: forceOrigin.y + Math.cos(angleRadians) * perpendicularLength,
  };
  const nearLeftEdge = forceOrigin.x < 170;
  const nearRightEdge = forceOrigin.x > 490;
  const narrationFocus = narrationStep?.highlights[0];
  const captionLines = narrationStep ? wrapCaption(narrationStep.caption) : [];

  return (
    <div className="output-frame" aria-label={copy.canvas.ariaLabel}>
      <svg
        className="experiment-svg"
        viewBox="0 0 720 1280"
        role="img"
        aria-labelledby="canvas-title canvas-description"
      >
        <title id="canvas-title">{copy.canvas.title}</title>
        <desc id="canvas-description">{copy.canvas.description}</desc>
        <defs>
          <pattern id="minor-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#dfe1da" strokeWidth="1" />
          </pattern>
          <marker id="arrow-force" markerWidth="7" markerHeight="7" refX="6.2" refY="3.5" orient="auto">
            <path d="M0,0 L7,3.5 L0,7 Z" fill="#e85d42" />
          </marker>
          <marker id="arrow-measure" markerWidth="6" markerHeight="6" refX="5.2" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 Z" fill="#2659a8" />
          </marker>
        </defs>

        <rect width="720" height="1280" fill="#f6f7f2" />
        <rect x="44" y="44" width="632" height="1192" fill="url(#minor-grid)" stroke="#c9ccc3" strokeDasharray="8 8" />

        <text x="72" y="104" className="canvas-kicker">MECHANICS / 01</text>
        <text x="72" y="152" className={`canvas-title ${locale === "en" ? "canvas-title-en" : ""}`}>{copy.canvas.title}</text>
        <text x="72" y="188" className="canvas-subtitle">{copy.canvas.subtitle}</text>

        {narrationStep ? (
          <g className="narration-chapter" transform="translate(72 226)">
            <text className="narration-step-number">
              {String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}
            </text>
            <text y="45" className="narration-step-title">{narrationStep.title}</text>
            <text y="79" className="narration-step-caption">
              {captionLines.map((line, index) => (
                <tspan x="0" dy={index === 0 ? 0 : 25} key={`${line}-${index}`}>{line}</tspan>
              ))}
            </text>
            <line x1="0" y1="126" x2="576" y2="126" stroke="#b9bdb3" />
          </g>
        ) : (
          <g transform="translate(72 238)">
            <text className="measure-label">{copy.canvas.motionLabel}</text>
            <text y="42" className="motion-value">
              {state?.motion === "stationary"
                ? copy.canvas.stationary
                : state?.motion === "complete"
                  ? copy.canvas.complete
                  : copy.canvas.sliding}
            </text>
            <line x1="0" y1="64" x2="576" y2="64" stroke="#b9bdb3" />
          </g>
        )}

        <path
          d={`M ${rampTop.x} ${rampTop.y} L ${rampBottom.x} ${rampBottom.y} L ${rampTop.x} ${rampBottom.y} Z`}
          fill="#e5e7e0"
          stroke="#181917"
          strokeWidth="5"
          strokeLinejoin="round"
        />
        <path
          d={angleArcPath}
          fill="none"
          stroke="#2659a8"
          strokeWidth="3"
        />
        <text x={rampBottom.x + 16} y={rampBottom.y + 44} className="angle-label">
          {formatNumber(parameters.angleDegrees, locale, 0)}°
        </text>

        <g
          className="experiment-block"
          transform={`translate(${block.x} ${block.y}) rotate(${parameters.angleDegrees})`}
        >
          <rect
            x="-36"
            y="-52"
            width="72"
            height="48"
            rx="4"
            fill="#f6f7f2"
            stroke="#181917"
            strokeWidth="5"
          />
          <line x1="-27" y1="-43" x2="27" y2="-43" stroke="#ef6548" strokeWidth="7" />
          <text x="0" y="-17" textAnchor="middle" className="block-label">m</text>
        </g>

        {state && weightForceN > 0 ? (
          <g className={`force-vectors force-primary focus-${narrationFocus ?? "all"}`}>
            <line
              x1={forceOrigin.x}
              y1={forceOrigin.y}
              x2={forceOrigin.x}
              y2={forceOrigin.y + weightLength}
              stroke="#e85d42"
              strokeWidth="4"
              markerEnd="url(#arrow-force)"
            />
            <text x={forceOrigin.x + 13} y={forceOrigin.y + weightLength - 2} className="force-label">mg</text>
            <line
              x1={forceOrigin.x}
              y1={forceOrigin.y}
              x2={forceOrigin.x + normalVector.x}
              y2={forceOrigin.y + normalVector.y}
              stroke="#e85d42"
              strokeWidth="4"
              markerEnd="url(#arrow-force)"
            />
            <text
              x={forceOrigin.x + normalVector.x + (nearRightEdge ? -9 : 9)}
              y={forceOrigin.y + normalVector.y - 4}
              textAnchor={nearRightEdge ? "end" : "start"}
              className="force-label"
            >
              N
            </text>
            <line
              x1={forceOrigin.x}
              y1={forceOrigin.y}
              x2={forceOrigin.x + frictionVector.x}
              y2={forceOrigin.y + frictionVector.y}
              stroke="#e85d42"
              strokeWidth="4"
              markerEnd="url(#arrow-force)"
            />
            <text
              x={forceOrigin.x + frictionVector.x + (nearLeftEdge ? 9 : -9)}
              y={forceOrigin.y + frictionVector.y - 8}
              textAnchor={nearLeftEdge ? "start" : "end"}
              className="force-label"
            >
              f
              <tspan baselineShift="sub" fontSize="14">
                {state.motion === "stationary" ? "s" : "k"}
              </tspan>
            </text>
          </g>
        ) : null}
        {state && weightForceN > 0 ? (
          <g className={`force-vectors force-components focus-${narrationFocus ?? "all"}`}>
            <line
              x1={forceOrigin.x}
              y1={forceOrigin.y}
              x2={parallelEnd.x}
              y2={parallelEnd.y}
              stroke="#2659a8"
              strokeWidth="3"
              strokeDasharray="8 6"
              markerEnd="url(#arrow-measure)"
            />
            <text
              x={parallelEnd.x + (nearRightEdge ? -10 : 10)}
              y={parallelEnd.y + (nearRightEdge ? 24 : 6)}
              textAnchor={nearRightEdge ? "end" : "start"}
              className="component-label"
            >
              mg sin θ
            </text>
            <line
              x1={forceOrigin.x}
              y1={forceOrigin.y}
              x2={perpendicularEnd.x}
              y2={perpendicularEnd.y}
              stroke="#2659a8"
              strokeWidth="3"
              strokeDasharray="8 6"
              markerEnd="url(#arrow-measure)"
            />
            <text
              x={perpendicularEnd.x - 10}
              y={perpendicularEnd.y - 12}
              textAnchor="end"
              className="component-label"
            >
              mg cos θ
            </text>
          </g>
        ) : null}

        <g className={`formula-block focus-${narrationFocus ?? "all"}`} transform="translate(72 960)">
          <text className="formula-label">{copy.canvas.analyticalResult}</text>
          <text y="48" className="formula">a = g (sin θ − μₖ cos θ)</text>
          <text y="93" className="formula-result">
            a = {state ? formatNumber(state.accelerationMs2, locale) : "--"} m/s²
          </text>
          <text y="132" className="end-velocity-formula">
            v² = u² + 2aL · u = 0
          </text>
          <text y="169" className="bottom-velocity-result">
            v
            <tspan baselineShift="sub" fontSize="15">bottom</tspan>
            <tspan> = √(2aL) = {state ? formatNumber(state.bottomVelocityMs, locale) : "--"} m/s</tspan>
          </text>
        </g>

        <g transform="translate(72 1174)">
          <text className="canvas-footnote">{copy.canvas.assumptions}</text>
          <text x="576" textAnchor="end" className="canvas-footnote">SCIENCE STUDIO</text>
        </g>
      </svg>
      {!state ? <div className="canvas-error">{copy.canvas.invalid}</div> : null}
    </div>
  );
}

export function ExperimentWorkbench() {
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [parameters, setParameters] = useState(inclinedPlaneDefaults);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [narrationTextOverrides, setNarrationTextOverrides] = useState<
    Record<Locale, NarrationTextOverrides>
  >({en: {}, "zh-CN": {}});
  const [narrationDurationOverrides, setNarrationDurationOverrides] = useState<
    NarrationDurationOverrides
  >({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const lastFrame = useRef<number | null>(null);
  const copy = workbenchCopy[locale];

  useEffect(() => {
    const storedLocale = window.localStorage.getItem("science-studio-locale");
    if (storedLocale === "en" || storedLocale === "zh-CN") {
      setLocale(storedLocale);
      document.documentElement.lang = storedLocale;
    }
  }, []);

  const parsedParameters = useMemo(
    () => inclinedPlaneParametersSchema.safeParse(parameters),
    [parameters],
  );
  const initialState = useMemo(
    () => parsedParameters.success
      ? solveInclinedPlane(parsedParameters.data, 0)
      : null,
    [parsedParameters],
  );
  const experimentDurationSeconds = initialState?.endTimeSeconds
    ? Math.max(4, initialState.endTimeSeconds + 0.5)
    : 5;
  const narrationText = useMemo(() => {
    const text = structuredClone(copy.narration.stepText);
    const isStationary = initialState?.motion === "stationary";
    if (locale === "en") {
      text.setup.caption = `A block rests on a ${formatNumber(parameters.angleDegrees, locale, 0)}° inclined plane.`;
      text.equation.caption = isStationary
        ? "Static friction balances mg sin θ, so the block remains at rest."
        : "mg sin θ exceeds μₛN, so the block begins to slide.";
      text.result.caption = initialState
        ? isStationary
          ? "The block remains at rest because static friction balances the downhill force."
          : `The block accelerates at ${formatNumber(initialState.accelerationMs2, locale)} m/s² and reaches ${formatNumber(initialState.bottomVelocityMs, locale)} m/s.`
        : copy.narration.stepText.result.caption;
    } else {
      text.setup.caption = `物体静置在 ${formatNumber(parameters.angleDegrees, locale, 0)}° 的斜面上。`;
      text.equation.caption = isStationary
        ? "静摩擦力平衡 mg sin θ，因此物体保持静止。"
        : "mg sin θ 大于 μₛN，因此物体开始滑动。";
      text.result.caption = initialState
        ? isStationary
          ? "静摩擦力平衡沿斜面的力，因此物体保持静止。"
          : `物体以 ${formatNumber(initialState.accelerationMs2, locale)} m/s² 的加速度运动，底端速度为 ${formatNumber(initialState.bottomVelocityMs, locale)} m/s。`
        : copy.narration.stepText.result.caption;
    }
    return text;
  }, [copy.narration.stepText, initialState, locale, parameters.angleDegrees]);
  const narrationSteps = useMemo(
    () => buildNarrationSteps(
      narrationText,
      narrationTextOverrides[locale],
      narrationDurationOverrides,
      inclinedPlaneTemplate.narration,
    ),
    [locale, narrationDurationOverrides, narrationText, narrationTextOverrides],
  );
  const narrationDurationSeconds = useMemo(
    () => getNarrationDuration(narrationSteps),
    [narrationSteps],
  );
  const narrationFrame = useMemo(
    () => resolveNarrationFrame(
      narrationSteps,
      narrationTimeSeconds,
      initialState?.endTimeSeconds ?? null,
    ),
    [initialState?.endTimeSeconds, narrationSteps, narrationTimeSeconds],
  );
  const simulationTimeSeconds = mode === "narration"
    ? narrationFrame.simulationTimeSeconds
    : timeSeconds;
  const state = useMemo(
    () => parsedParameters.success
      ? solveInclinedPlane(parsedParameters.data, simulationTimeSeconds)
      : null,
    [parsedParameters, simulationTimeSeconds],
  );
  const durationSeconds = mode === "narration"
    ? narrationDurationSeconds
    : experimentDurationSeconds;
  const playbackTimeSeconds = mode === "narration"
    ? narrationTimeSeconds
    : timeSeconds;
  const issues = useMemo(
    () => inspectInclinedPlane(parameters),
    [parameters],
  );
  const localizedIssues = useMemo(
    () => issues.map((issue) => ({
      ...issue,
      ...localizeScienceIssue(
        issue,
        locale,
        initialState?.criticalAngleDegrees,
      ),
    })),
    [initialState?.criticalAngleDegrees, issues, locale],
  );

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

      const updateTime = mode === "narration"
        ? setNarrationTimeSeconds
        : setTimeSeconds;
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
    const updateTime = mode === "narration"
      ? setNarrationTimeSeconds
      : setTimeSeconds;
    updateTime((current) =>
      Math.min(Math.max(current + direction / FPS, 0), durationSeconds),
    );
  }, [durationSeconds, mode]);

  const selectNarrationStep = useCallback((index: number) => {
    setIsPlaying(false);
    setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));
  }, [narrationSteps]);

  const updateNarrationText = useCallback((
    id: NarrationStepId,
    field: "title" | "caption",
    value: string,
  ) => {
    setNarrationTextOverrides((current) => ({
      ...current,
      [locale]: {
        ...current[locale],
        [id]: {...current[locale][id], [field]: value},
      },
    }));
  }, [locale]);

  const updateNarrationDuration = useCallback((id: NarrationStepId, value: number) => {
    if (!Number.isFinite(value)) return;
    const duration = Math.min(Math.max(value, 1), 10);
    const activeStepId = narrationFrame.step.id as NarrationStepId;
    setNarrationDurationOverrides((current) => ({...current, [id]: duration}));
    if (id === activeStepId) {
      const activeStepIndex = narrationSteps.findIndex((step) => step.id === id);
      setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, activeStepIndex));
    }
    setIsPlaying(false);
  }, [narrationFrame.step.id, narrationSteps]);

  const restoreNarrationDefaults = useCallback(() => {
    setNarrationTextOverrides((current) => ({...current, [locale]: {}}));
    setNarrationDurationOverrides({});
    setNarrationTimeSeconds(0);
    setIsPlaying(false);
  }, [locale]);

  const blockingCount = issues.filter((issue) => issue.severity === "blocking").length;

  const toggleLocale = useCallback(() => {
    setLocale((current) => {
      const next = current === "en" ? "zh-CN" : "en";
      window.localStorage.setItem("science-studio-locale", next);
      document.documentElement.lang = next;
      return next;
    });
  }, []);

  return (
    <main className={`workbench-shell ${mode === "narration" ? "narration-mode" : ""}`}>
      <header className="topbar">
        <div className="project-identity">
          <Link className="back-to-library" href="/" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"} title={locale === "en" ? "Back to experiment library" : "返回实验目录"}>
            <ArrowLeft size={16} />
          </Link>
          <span className="brand-mark"><FlaskConical size={17} /></span>
          <span className="brand-name">Science Studio</span>
          <span className="topbar-divider" />
          <span className="project-name">{copy.projectName}</span>
          <span className="save-state"><Check size={12} /> {copy.localDraft}</span>
        </div>

        <nav className="mode-switch" aria-label={copy.modeLabel}>
          <button
            className={`mode-button ${mode === "experiment" ? "active" : ""}`}
            type="button"
            aria-pressed={mode === "experiment"}
            onClick={() => {
              setMode("experiment");
              setIsPlaying(false);
            }}
          >{copy.modes.experiment}</button>
          <button
            className={`mode-button ${mode === "narration" ? "active" : ""}`}
            type="button"
            aria-pressed={mode === "narration"}
            onClick={() => {
              setMode("narration");
              setIsPlaying(false);
            }}
          >{copy.modes.narration}</button>
          <button className="mode-button" type="button" disabled>{copy.modes.export}</button>
        </nav>

        <div className="topbar-actions">
          <button
            className="locale-button"
            type="button"
            onClick={toggleLocale}
            aria-label={copy.actions.switchLanguage}
            title={copy.actions.switchLanguage}
          >
            <Languages size={15} />
            <span>{locale === "en" ? "EN" : "中文"}</span>
          </button>
          <button className="icon-button" type="button" aria-label={copy.actions.undo} title={copy.actions.undo} disabled><Undo2 /></button>
          <button className="icon-button" type="button" aria-label={copy.actions.redo} title={copy.actions.redo} disabled><Redo2 /></button>
          <button className="science-button" type="button">
            {blockingCount ? <AlertTriangle size={15} /> : <CircleGauge size={15} />}
            {copy.actions.scienceCheck}
            <span>{issues.length}</span>
          </button>
        </div>
      </header>

      <section className="workspace">
        <div className="stage-area">
          <div className="stage-meta">
            <span>{copy.stage.outputCanvas}</span>
            <span>{copy.stage.format}</span>
          </div>
          <InclinedPlaneCanvas
            parameters={parameters}
            state={state}
            locale={locale}
            copy={copy}
            narrationStep={mode === "narration" ? narrationFrame.step : undefined}
            narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined}
            narrationStepCount={mode === "narration" ? narrationSteps.length : undefined}
          />
        </div>

        <aside className="parameter-panel">
          {mode === "experiment" ? (
            <>
              <div className="panel-heading">
                <div>
                  <span className="panel-kicker">{copy.panel.kicker}</span>
                  <h1>{copy.panel.parameters}</h1>
                </div>
                <button className="icon-button" type="button" aria-label={copy.actions.collapseParameters} title={copy.actions.collapseParameters}>
                  <ChevronDown />
                </button>
              </div>

              <div className="parameter-list">
                {parameterDefinitions.map((definition) => {
              const hasError = !parsedParameters.success && parsedParameters.error.issues.some(
                (issue) => issue.path[0] === definition.key,
              );
              const error = hasError
                ? definition.key === "kineticFrictionCoefficient" &&
                    parameters.kineticFrictionCoefficient > parameters.staticFrictionCoefficient
                  ? copy.validation.frictionOrder
                  : copy.validation.range(definition.min, definition.max)
                : undefined;
              const label = copy.parameters[definition.key];
              return (
                <div className="parameter-control" key={definition.key}>
                  <div className="parameter-row">
                    <label htmlFor={`${definition.key}-number`}>{label}</label>
                    <div className="number-field">
                      <input
                        id={`${definition.key}-number`}
                        type="number"
                        min={definition.min}
                        max={definition.max}
                        step={definition.step}
                        value={parameters[definition.key]}
                        onInput={(event) => {
                          const value = event.currentTarget.value;
                          updateParameter(
                            definition.key,
                            value === "" ? Number.NaN : Number(value),
                          );
                        }}
                        aria-invalid={Boolean(error)}
                      />
                      <span>{definition.unit}</span>
                    </div>
                  </div>
                  <input
                    className="parameter-range"
                    aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`}
                    type="range"
                    min={definition.min}
                    max={definition.max}
                    step={definition.step}
                    value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min}
                    onChange={(event) => updateParameter(definition.key, event.currentTarget.valueAsNumber)}
                  />
                  {error ? <p className="field-error">{error}</p> : null}
                </div>
              );
                })}
              </div>

              <section className="measurement-section">
                <div className="section-title">
                  <h2>{copy.panel.measurements}</h2>
                  <span>{state?.motion === "stationary" ? copy.measurements.staticEquilibrium : copy.measurements.analytical}</span>
                </div>
                <dl className="measurements">
                  <div><dt>{copy.measurements.acceleration}</dt><dd>{state ? formatNumber(state.accelerationMs2, locale) : "--"}<small>m/s²</small></dd></div>
                  <div><dt>{copy.measurements.velocity}</dt><dd>{state ? formatNumber(state.velocityMs, locale) : "--"}<small>m/s</small></dd></div>
                  <div><dt>{copy.measurements.displacement}</dt><dd>{state ? formatNumber(state.displacementM, locale) : "--"}<small>m</small></dd></div>
                  <div><dt>{copy.measurements.normalForce}</dt><dd>{state ? formatNumber(state.normalForceN, locale) : "--"}<small>N</small></dd></div>
                  <div className="end-velocity-measurement"><dt>{copy.measurements.bottomVelocity} <span className="measurement-symbol">v<sub>bottom</sub></span></dt><dd>{state ? formatNumber(state.bottomVelocityMs, locale) : "--"}<small>m/s</small></dd></div>
                </dl>
              </section>

              <section className="science-section">
                <div className="section-title"><h2>{copy.panel.scienceNotes}</h2></div>
                {localizedIssues.map((issue) => (
                  <div className={`science-issue ${issue.severity}`} key={issue.id}>
                    {issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}
                    <div><strong>{issue.title}</strong><p>{issue.detail}</p></div>
                  </div>
                ))}
              </section>
            </>
          ) : (
            <>
              <div className="panel-heading narration-panel-heading">
                <div>
                  <span className="panel-kicker">{copy.narration.kicker}</span>
                  <h1>{copy.narration.steps}</h1>
                </div>
                <span className="narration-step-count">
                  {copy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}
                </span>
              </div>
              <div className="narration-step-list" aria-label={copy.narration.steps}>
                {narrationSteps.map((stepItem, index) => (
                  <button
                    className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`}
                    type="button"
                    onClick={() => selectNarrationStep(index)}
                    key={stepItem.id}
                  >
                    <span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span>
                    <span className="narration-step-summary">
                      <strong>{stepItem.title}</strong>
                      <small>{stepItem.durationSeconds.toFixed(1)} {copy.narration.seconds}</small>
                    </span>
                    <span className={`scene-mode ${stepItem.simulationMode}`}>
                      {stepItem.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}
                    </span>
                  </button>
                ))}
              </div>
              <section className="narration-editor">
                <label>
                  <span>{copy.narration.title}</span>
                  <input
                    type="text"
                    maxLength={80}
                    value={narrationFrame.step.title}
                    onChange={(event) => updateNarrationText(
                      narrationFrame.step.id as NarrationStepId,
                      "title",
                      event.currentTarget.value,
                    )}
                  />
                </label>
                <label>
                  <span>{copy.narration.caption}</span>
                  <textarea
                    maxLength={240}
                    rows={3}
                    value={narrationFrame.step.caption}
                    onChange={(event) => updateNarrationText(
                      narrationFrame.step.id as NarrationStepId,
                      "caption",
                      event.currentTarget.value,
                    )}
                  />
                </label>
                <div className="narration-editor-row">
                  <label>
                    <span>{copy.narration.duration}</span>
                    <div className="duration-field">
                      <input
                        type="number"
                        min="1"
                        max="10"
                        step="0.5"
                        value={narrationFrame.step.durationSeconds}
                        onChange={(event) => updateNarrationDuration(
                          narrationFrame.step.id as NarrationStepId,
                          event.currentTarget.valueAsNumber,
                        )}
                      />
                      <span>{copy.narration.seconds}</span>
                    </div>
                  </label>
                  <div className="scene-behavior">
                    <span>{copy.narration.scene}</span>
                    <strong>
                      {narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}
                      {narrationFrame.step.simulationMode === "play"
                        ? copy.narration.playMotion
                        : copy.narration.holdFrame}
                    </strong>
                  </div>
                </div>
                <button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}>
                  <ListRestart size={15} />
                  {copy.narration.restoreDefaults}
                </button>
              </section>
            </>
          )}
        </aside>
      </section>

      <footer className="playback-bar">
        <div className="playback-controls">
          <button className="icon-button" type="button" onClick={reset} aria-label={copy.actions.reset} title={copy.actions.reset}><RotateCcw /></button>
          <button className="icon-button" type="button" onClick={() => step(-1)} aria-label={copy.actions.previousFrame} title={copy.actions.previousFrame}><SkipBack /></button>
          <button
            className="play-button"
            type="button"
            onClick={() => {
              if (playbackTimeSeconds >= durationSeconds) {
                if (mode === "narration") setNarrationTimeSeconds(0);
                else setTimeSeconds(0);
              }
              setIsPlaying((current) => !current);
            }}
            disabled={!state}
            aria-label={isPlaying ? copy.actions.pause : copy.actions.play}
            title={isPlaying ? copy.actions.pause : copy.actions.play}
          >
            {isPlaying ? <Pause /> : <Play />}
          </button>
          <button className="icon-button" type="button" onClick={() => step(1)} aria-label={copy.actions.nextFrame} title={copy.actions.nextFrame}><SkipForward /></button>
        </div>

        <span className="timecode">{formatNumber(playbackTimeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>
        {mode === "narration" ? (
          <div className="lesson-timeline-wrap">
            <div className="lesson-segments" aria-hidden="true">
              {narrationSteps.map((stepItem, index) => (
                <span
                  className={index === narrationFrame.index ? "active" : ""}
                  style={{flex: stepItem.durationSeconds}}
                  key={stepItem.id}
                >
                  <small>{String(index + 1).padStart(2, "0")}</small>
                </span>
              ))}
            </div>
            <input
              className="timeline lesson-timeline"
              aria-label={copy.narration.timeline}
              type="range"
              min="0"
              max={durationSeconds}
              step={1 / FPS}
              value={narrationTimeSeconds}
              onInput={(event) => {
                setIsPlaying(false);
                setNarrationTimeSeconds(event.currentTarget.valueAsNumber);
              }}
            />
          </div>
        ) : (
          <input
            className="timeline"
            aria-label={locale === "en" ? "Experiment time" : "实验时间"}
            type="range"
            min="0"
            max={durationSeconds}
            step={1 / FPS}
            value={timeSeconds}
            onInput={(event) => {
              setIsPlaying(false);
              setTimeSeconds(event.currentTarget.valueAsNumber);
            }}
          />
        )}
        <label className="speed-control">
          <span>{copy.actions.speed}</span>
          <select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}>
            <option value="0.25">0.25×</option>
            <option value="0.5">0.5×</option>
            <option value="1">1×</option>
            <option value="2">2×</option>
          </select>
        </label>
      </footer>
    </main>
  );
}
