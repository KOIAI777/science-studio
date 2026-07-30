"use client";

import {
  inclinedPlaneDefaults,
  inclinedPlaneParametersSchema,
  inspectInclinedPlane,
  solveInclinedPlane,
  type InclinedPlaneParameters,
  type InclinedPlaneState,
} from "@science-studio/templates/inclined-plane";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  CircleGauge,
  FlaskConical,
  Info,
  Languages,
  Pause,
  Play,
  Redo2,
  RotateCcw,
  SkipBack,
  SkipForward,
  Undo2,
} from "lucide-react";
import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
  localizeScienceIssue,
  workbenchCopy,
  type Locale,
  type WorkbenchCopy,
} from "../lib/i18n";

const FPS = 30;

type ParameterKey = keyof InclinedPlaneParameters;

interface ParameterDefinition {
  key: ParameterKey;
  unit: string;
  min: number;
  max: number;
  step: number;
}

const parameterDefinitions: ParameterDefinition[] = [
  {key: "angleDegrees", unit: "°", min: 5, max: 60, step: 1},
  {key: "massKg", unit: "kg", min: 0, max: 20, step: 0.1},
  {
    key: "staticFrictionCoefficient",
    unit: "μs",
    min: 0,
    max: 1.5,
    step: 0.01,
  },
  {
    key: "kineticFrictionCoefficient",
    unit: "μk",
    min: 0,
    max: 1.5,
    step: 0.01,
  },
  {key: "gravityMs2", unit: "m/s²", min: 1, max: 20, step: 0.01},
  {key: "rampLengthM", unit: "m", min: 2, max: 20, step: 0.1},
];

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}

function InclinedPlaneCanvas({
  parameters,
  state,
  locale,
  copy,
}: {
  parameters: InclinedPlaneParameters;
  state: InclinedPlaneState | null;
  locale: Locale;
  copy: WorkbenchCopy;
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
          <g className="force-vectors">
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

        <g transform="translate(72 960)">
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
  const [parameters, setParameters] = useState(inclinedPlaneDefaults);
  const [timeSeconds, setTimeSeconds] = useState(0);
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
  const state = useMemo(
    () => parsedParameters.success
      ? solveInclinedPlane(parsedParameters.data, timeSeconds)
      : null,
    [parsedParameters, timeSeconds],
  );
  const initialState = useMemo(
    () => parsedParameters.success
      ? solveInclinedPlane(parsedParameters.data, 0)
      : null,
    [parsedParameters],
  );
  const durationSeconds = initialState?.endTimeSeconds
    ? Math.max(4, initialState.endTimeSeconds + 0.5)
    : 5;
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

      setTimeSeconds((current) => {
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
  }, [durationSeconds, isPlaying, speed, state]);

  const updateParameter = useCallback((key: ParameterKey, value: number) => {
    setParameters((current) => ({...current, [key]: value}));
    setTimeSeconds(0);
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setTimeSeconds(0);
    setIsPlaying(false);
  }, []);

  const step = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    setTimeSeconds((current) =>
      Math.min(Math.max(current + direction / FPS, 0), durationSeconds),
    );
  }, [durationSeconds]);

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
    <main className="workbench-shell">
      <header className="topbar">
        <div className="project-identity">
          <span className="brand-mark"><FlaskConical size={17} /></span>
          <span className="brand-name">Science Studio</span>
          <span className="topbar-divider" />
          <span className="project-name">{copy.projectName}</span>
          <span className="save-state"><Check size={12} /> {copy.localDraft}</span>
        </div>

        <nav className="mode-switch" aria-label={copy.modeLabel}>
          <button className="mode-button active" type="button">{copy.modes.experiment}</button>
          <button className="mode-button" type="button" disabled>{copy.modes.narration}</button>
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
          <InclinedPlaneCanvas parameters={parameters} state={state} locale={locale} copy={copy} />
        </div>

        <aside className="parameter-panel">
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
              if (timeSeconds >= durationSeconds) setTimeSeconds(0);
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

        <span className="timecode">{formatNumber(timeSeconds, locale)} <small>/ {formatNumber(durationSeconds, locale)} s</small></span>
        <input
          className="timeline"
          aria-label={locale === "en" ? "Experiment time" : "实验时间"}
          type="range"
          min="0"
          max={durationSeconds}
          step={1 / FPS}
          value={timeSeconds}
          onChange={(event) => {
            setIsPlaying(false);
            setTimeSeconds(event.currentTarget.valueAsNumber);
          }}
        />
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
