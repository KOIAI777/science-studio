"use client";

import type {NarrationStep, ScienceIssue} from "@science-studio/experiment-schema";
import {
  SOUND_TUBE_LENGTH_M,
  createSoundWaveProfile,
  inspectSoundWave,
  particleDisplacementAt,
  solveSoundWave,
  soundMedia,
  soundPressureAt,
  soundWaveDefaults,
  soundWaveParametersSchema,
  soundWaveTemplate,
  type SoundMedium,
  type SoundWaveParameters,
  type SoundWaveProfile,
  type SoundWaveState,
} from "@science-studio/templates/sound-wave";
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
  Mic2,
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

const EXPERIMENT_DURATION_SECONDS = 0.026;
const TIMELINE_STEP_SECONDS = 0.0001;

type EditorMode = "experiment" | "narration";
type CanvasAspectRatio = "9:16" | "16:9";
type NumericParameterKey = "frequencyHz" | "soundLevelDb" | "microphoneSeparationM";
type SoundStepId = "source" | "longitudinal" | "level" | "microphones" | "medium" | "equation";
type SoundStepText = Record<SoundStepId, {title: string; caption: string}>;
type SoundTextOverrides = Partial<Record<SoundStepId, Partial<{title: string; caption: string}>>>;
type SoundDurationOverrides = Partial<Record<SoundStepId, number>>;

interface SoundCopy {
  projectName: string;
  packName: string;
  parameters: Record<NumericParameterKey, string> & {medium: string; particles: string};
  media: Record<SoundMedium, string>;
  toggles: {on: string; off: string};
  measurements: {
    title: string;
    model: string;
    frequency: string;
    period: string;
    wavelength: string;
    speed: string;
    pressure: string;
    delay: string;
    micA: string;
    micB: string;
    waiting: string;
    receiving: string;
  };
  canvas: {
    ariaLabel: string;
    title: string;
    subtitle: string;
    longitudinal: string;
    slowMotion: string;
    source: string;
    sourceFrequency: string;
    particleMotion: string;
    propagation: string;
    compression: string;
    rarefaction: string;
    micA: string;
    micB: string;
    arrived: string;
    waiting: string;
    scope: string;
    scopeNote: string;
    mediumSpeed: string;
    equation: string;
    delayMeasurement: string;
    exaggerated: string;
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
  narration: SoundStepText;
  issues: {
    invalidTitle: string;
    invalidDetail: string;
    longTitle: string;
    longDetail: string;
    highTitle: string;
    highDetail: string;
    assumptionTitle: string;
    assumptionDetail: string;
  };
}

const soundCopy: Record<Locale, SoundCopy> = {
  en: {
    projectName: "Sound: Pitch, Loudness & Speed",
    packName: "Middle School Pack",
    parameters: {
      frequencyHz: "Source frequency",
      soundLevelDb: "Sound pressure level",
      microphoneSeparationM: "Microphone separation",
      medium: "Propagation medium",
      particles: "Medium particles",
    },
    media: {air: "Air · 20 C", water: "Fresh water · 20 C", steel: "Steel · longitudinal"},
    toggles: {on: "Shown", off: "Hidden"},
    measurements: {
      title: "Sound measurements",
      model: "Ideal plane wave",
      frequency: "Frequency",
      period: "Period",
      wavelength: "Wavelength",
      speed: "Sound speed",
      pressure: "RMS pressure",
      delay: "A-to-B delay",
      micA: "Microphone A",
      micB: "Microphone B",
      waiting: "Waiting",
      receiving: "Receiving",
    },
    canvas: {
      ariaLabel: "Longitudinal sound-wave experiment with two microphones and synchronized pressure traces",
      title: "Sound through matter",
      subtitle: "Follow compression, particle vibration, and arrival time in one synchronized view.",
      longitudinal: "LONGITUDINAL WAVE",
      slowMotion: "SLOW-MOTION VIEW · SEE TIMELINE",
      source: "LOUDSPEAKER",
      sourceFrequency: "SOURCE",
      particleMotion: "PARTICLES VIBRATE BACK AND FORTH",
      propagation: "SOUND AND ENERGY TRAVEL RIGHT",
      compression: "COMPRESSION",
      rarefaction: "RAREFACTION",
      micA: "MIC A",
      micB: "MIC B",
      arrived: "SIGNAL ARRIVED",
      waiting: "WAITING FOR WAVEFRONT",
      scope: "MICROPHONE PRESSURE TRACES",
      scopeNote: "Same waveform, shifted by the travel delay",
      mediumSpeed: "REFERENCE SOUND SPEED",
      equation: "MEASURE SPEED · CONNECT THE WAVE",
      delayMeasurement: "MICROPHONE METHOD",
      exaggerated: "Particle displacement is magnified; equilibrium positions do not travel.",
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
      source: {title: "Start with the vibrating source", caption: "Frequency counts source cycles per second and is the main physical cue for pitch."},
      longitudinal: {title: "Track the medium particles", caption: "Particles move back and forth around fixed positions while compressions carry energy to the right."},
      level: {title: "Connect level to pressure", caption: "A higher sound pressure level means a larger pressure amplitude and is usually perceived as louder."},
      microphones: {title: "Measure the arrival delay", caption: "Microphone B records the same signal later because the wave travels the extra separation distance."},
      medium: {title: "Change the medium", caption: "The source frequency stays fixed, but sound speed, wavelength, and microphone delay change with the medium."},
      equation: {title: "Calculate speed and wavelength", caption: "Use c = Δx/Δt to measure speed, then verify the same result with c = fλ."},
    },
    issues: {
      invalidTitle: "Invalid parameter",
      invalidDetail: "Check the highlighted input before running the experiment.",
      longTitle: "Wavelength exceeds the visible tube",
      longDetail: "The calculation remains valid, but the 8 m display cannot show one complete wavelength.",
      highTitle: "High sound level",
      highDetail: "The simulation is silent, but sustained real-world exposure at this level can require hearing protection.",
      assumptionTitle: "Ideal longitudinal-wave model",
      assumptionDetail: "The medium is uniform and lossless; particle displacement is magnified and reflection, attenuation, and diffraction are excluded.",
    },
  },
  "zh-CN": {
    projectName: "声音：音调、响度与传播速度",
    packName: "初中物理实验包",
    parameters: {
      frequencyHz: "声源频率",
      soundLevelDb: "声压级",
      microphoneSeparationM: "麦克风间距",
      medium: "传播介质",
      particles: "介质粒子",
    },
    media: {air: "空气 · 20 C", water: "淡水 · 20 C", steel: "钢材 · 纵波"},
    toggles: {on: "显示", off: "隐藏"},
    measurements: {
      title: "声音测量",
      model: "理想平面声波",
      frequency: "频率",
      period: "周期",
      wavelength: "波长",
      speed: "声速",
      pressure: "声压有效值",
      delay: "A 到 B 延迟",
      micA: "麦克风 A",
      micB: "麦克风 B",
      waiting: "等待波前",
      receiving: "正在接收",
    },
    canvas: {
      ariaLabel: "包含两个麦克风和同步声压曲线的纵向声波实验",
      title: "声音在介质中传播",
      subtitle: "在同一画面观察疏密变化、粒子振动和到达时间。",
      longitudinal: "纵向声波",
      slowMotion: "慢动作显示 · 倍率见时间轴",
      source: "扬声器",
      sourceFrequency: "声源",
      particleMotion: "介质粒子只在平衡位置附近往复振动",
      propagation: "声音和能量向右传播",
      compression: "密部",
      rarefaction: "疏部",
      micA: "麦克风 A",
      micB: "麦克风 B",
      arrived: "已接收到信号",
      waiting: "等待波前到达",
      scope: "麦克风声压曲线",
      scopeNote: "波形相同，只相差传播延迟",
      mediumSpeed: "参考声速",
      equation: "测量声速 · 建立波动关系",
      delayMeasurement: "双麦克风测量",
      exaggerated: "粒子位移已放大；粒子的平衡位置不会随声波前进。",
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
      source: {title: "从振动声源开始", caption: "频率表示声源每秒振动的次数，是决定音调高低的主要物理量。"},
      longitudinal: {title: "追踪介质粒子", caption: "粒子只在固定平衡位置附近往复振动，疏密变化和能量向右传播。"},
      level: {title: "连接声压级与振幅", caption: "声压级越高，声压振幅越大，通常听起来也越响，但响度感受不是线性关系。"},
      microphones: {title: "测量到达延迟", caption: "声波多传播一段距离后才到达麦克风 B，因此两条记录具有可测的时间差。"},
      medium: {title: "更换传播介质", caption: "声源频率保持不变，但声速、波长和两个麦克风之间的延迟随介质变化。"},
      equation: {title: "计算声速与波长", caption: "先用 c = Δx/Δt 测量声速，再用 c = fλ 验证同一结果。"},
    },
    issues: {
      invalidTitle: "参数无法运行",
      invalidDetail: "运行实验前请检查高亮的参数。",
      longTitle: "波长超过可见声管",
      longDetail: "计算仍然有效，但 8 m 画面无法显示一个完整波长。",
      highTitle: "声压级较高",
      highDetail: "模拟本身不会发声，但现实中长时间处于该声压级可能需要听力保护。",
      assumptionTitle: "理想纵波模型",
      assumptionDetail: "介质均匀且无损耗；粒子位移已放大，不包含反射、衰减和衍射。",
    },
  },
};

function formatNumber(value: number, locale: Locale, digits = 2) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "zh-CN", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

function formatMilliseconds(seconds: number, locale: Locale, digits = 2) {
  return `${formatNumber(seconds * 1000, locale, digits)} ms`;
}

function buildSoundNarration(copy: SoundStepText, textOverrides: SoundTextOverrides, durationOverrides: SoundDurationOverrides): NarrationStep[] {
  return soundWaveTemplate.narration.map((definition) => {
    const id = definition.id as SoundStepId;
    return {
      ...definition,
      title: textOverrides[id]?.title ?? copy[id].title,
      caption: textOverrides[id]?.caption ?? copy[id].caption,
      durationSeconds: durationOverrides[id] ?? definition.durationSeconds,
    };
  });
}

function localizeIssue(issue: ScienceIssue, copy: SoundCopy): ScienceIssue {
  if (issue.id.startsWith("invalid-parameter")) return {...issue, title: copy.issues.invalidTitle, detail: copy.issues.invalidDetail};
  if (issue.id === "wavelength-longer-than-tube") return {...issue, title: copy.issues.longTitle, detail: copy.issues.longDetail};
  if (issue.id === "high-sound-level") return {...issue, title: copy.issues.highTitle, detail: copy.issues.highDetail};
  return {...issue, title: copy.issues.assumptionTitle, detail: copy.issues.assumptionDetail};
}

function ArrowMarker({id, color}: {id: string; color: string}) {
  return <marker id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L7,3 z" fill={color} /></marker>;
}

function microphoneTrace(profile: SoundWaveProfile, positionM: number, currentTime: number, x: number, y: number, width: number, amplitude: number) {
  const points = Array.from({length: 181}, (_, index) => {
    const sampleTime = (index / 180) * EXPERIMENT_DURATION_SECONDS;
    if (sampleTime > currentTime) return null;
    const pressure = soundPressureAt(profile, positionM, sampleTime);
    return {
      x: x + (sampleTime / EXPERIMENT_DURATION_SECONDS) * width,
      y: y - (pressure / profile.pressurePeakPa) * amplitude,
    };
  }).filter((point): point is {x: number; y: number} => point !== null);
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
}

function SoundWaveCanvas({state, locale, aspectRatio, narrationStep, narrationStepIndex, narrationStepCount}: {
  state: SoundWaveState | null;
  locale: Locale;
  aspectRatio: CanvasAspectRatio;
  narrationStep?: NarrationStep;
  narrationStepIndex?: number;
  narrationStepCount?: number;
}) {
  const copy = soundCopy[locale];
  const landscape = aspectRatio === "16:9";
  const viewWidth = landscape ? 1280 : 720;
  const viewHeight = landscape ? 720 : 1280;
  const tubeX = landscape ? 106 : 60;
  const tubeY = landscape ? 176 : 220;
  const tubeWidth = landscape ? 1064 : 600;
  const tubeHeight = landscape ? 218 : 302;
  const scopeX = tubeX;
  const scopeY = landscape ? 442 : 580;
  const scopeWidth = landscape ? 690 : 600;
  const scopeHeight = landscape ? 162 : 246;
  const formulaX = landscape ? 824 : 60;
  const formulaY = landscape ? 442 : 858;
  const formulaWidth = landscape ? 346 : 600;
  const formulaHeight = landscape ? 162 : 202;
  const profile = state ? createSoundWaveProfile(state.parameters) : null;
  const particleColumns = landscape ? 49 : 39;
  const particleRows = 3;
  const levelScale = state ? 6 + ((state.parameters.soundLevelDb - 40) / 60) * 13 : 0;
  const wavefrontX = state ? tubeX + (state.wavefrontPositionM / SOUND_TUBE_LENGTH_M) * tubeWidth : tubeX;
  const micX = (positionM: number) => tubeX + (positionM / SOUND_TUBE_LENGTH_M) * tubeWidth;
  const currentTimeX = state ? scopeX + (state.timeSeconds / EXPERIMENT_DURATION_SECONDS) * scopeWidth : scopeX;
  const travelDistanceM = state ? state.timeSeconds * state.medium.speedMs : 0;
  const pressureBandWidth = profile ? Math.max(18, (profile.wavelengthM / SOUND_TUBE_LENGTH_M) * tubeWidth * 0.22) : 18;
  const compressionBands = profile
    ? Array.from({length: 48}, (_, index) => travelDistanceM - index * profile.wavelengthM).filter((positionM) => positionM >= 0 && positionM <= SOUND_TUBE_LENGTH_M)
    : [];
  const rarefactionBands = profile
    ? Array.from({length: 48}, (_, index) => travelDistanceM - profile.wavelengthM / 2 - index * profile.wavelengthM).filter((positionM) => positionM >= 0 && positionM <= SOUND_TUBE_LENGTH_M)
    : [];

  const particles = state && profile && state.parameters.showParticles
    ? Array.from({length: particleColumns * particleRows}, (_, index) => {
      const column = index % particleColumns;
      const row = Math.floor(index / particleColumns);
      const positionM = (column / (particleColumns - 1)) * SOUND_TUBE_LENGTH_M;
      const normalizedDisplacement = profile.particleDisplacementAmplitudeM > 0
        ? particleDisplacementAt(profile, positionM, state.timeSeconds) / profile.particleDisplacementAmplitudeM
        : 0;
      return {
        key: `${column}-${row}`,
        x: tubeX + (positionM / SOUND_TUBE_LENGTH_M) * tubeWidth + normalizedDisplacement * levelScale,
        y: tubeY + tubeHeight * (0.36 + row * 0.14),
      };
    })
    : [];

  return <svg className="sound-canvas wave-canvas" viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-labelledby="sound-canvas-title sound-canvas-description">
    <title id="sound-canvas-title">{copy.canvas.ariaLabel}</title>
    <desc id="sound-canvas-description">{copy.canvas.subtitle}</desc>
    <defs>
      <linearGradient id="sound-canvas-paper" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8fbfc" /><stop offset="1" stopColor="#edf3f3" /></linearGradient>
      <linearGradient id="sound-speaker-cone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#24383b" /><stop offset="1" stopColor="#537477" /></linearGradient>
      <ArrowMarker id="sound-propagation-arrow" color="#bd5739" />
      <ArrowMarker id="sound-particle-arrow" color="#1b777d" />
      <clipPath id="sound-tube-clip"><rect x={tubeX} y={tubeY} width={tubeWidth} height={tubeHeight} rx="10" /></clipPath>
    </defs>
    <rect width={viewWidth} height={viewHeight} fill="url(#sound-canvas-paper)" />
    <g className="sound-canvas-heading">
      <text className="canvas-eyebrow" x={tubeX} y={landscape ? 52 : 70}>SCIENCE STUDIO · ACOUSTICS</text>
      <text className="canvas-title" x={tubeX} y={landscape ? 90 : 114}>{copy.canvas.title}</text>
      <text className="canvas-subtitle" x={tubeX} y={landscape ? 120 : 150}>{copy.canvas.subtitle}</text>
      <g className="sound-mode-badge" transform={`translate(${viewWidth - (landscape ? 366 : 300)} ${landscape ? 50 : 66})`}><rect width={landscape ? 260 : 240} height="52" rx="6" /><text x={landscape ? 130 : 120} y="21" textAnchor="middle">{copy.canvas.longitudinal}</text><text x={landscape ? 130 : 120} y="41" textAnchor="middle">{copy.canvas.slowMotion}</text></g>
    </g>

    {state && profile ? <>
      <g className={`sound-tube ${narrationStep?.id === "longitudinal" ? "highlighted" : ""}`}>
        <rect className="sound-tube-shell" x={tubeX} y={tubeY} width={tubeWidth} height={tubeHeight} rx="10" />
        <g clipPath="url(#sound-tube-clip)">
          {compressionBands.map((positionM, index) => <rect className="sound-pressure-band compression" x={tubeX + (positionM / SOUND_TUBE_LENGTH_M) * tubeWidth - pressureBandWidth / 2} y={tubeY + 8} width={pressureBandWidth} height={tubeHeight - 16} rx={pressureBandWidth / 2} key={`c-${index}`} />)}
          {rarefactionBands.map((positionM, index) => <rect className="sound-pressure-band rarefaction" x={tubeX + (positionM / SOUND_TUBE_LENGTH_M) * tubeWidth - pressureBandWidth / 2} y={tubeY + 8} width={pressureBandWidth} height={tubeHeight - 16} rx={pressureBandWidth / 2} key={`r-${index}`} />)}
          {Array.from({length: 9}, (_, index) => <line className="sound-distance-grid" x1={tubeX + (index / 8) * tubeWidth} x2={tubeX + (index / 8) * tubeWidth} y1={tubeY} y2={tubeY + tubeHeight} key={index} />)}
          {particles.map((particle) => <circle className="sound-particle" cx={particle.x} cy={particle.y} r={landscape ? 4.2 : 5.2} key={particle.key} />)}
          {state.wavefrontPositionM < SOUND_TUBE_LENGTH_M ? <line className="sound-wavefront-line" x1={wavefrontX} x2={wavefrontX} y1={tubeY + 18} y2={tubeY + tubeHeight - 18} /> : null}
        </g>
        {state.wavefrontPositionM < SOUND_TUBE_LENGTH_M ? <text className="sound-wavefront-label" x={Math.min(wavefrontX + 10, tubeX + tubeWidth - 12)} y={tubeY - 10} textAnchor={wavefrontX > tubeX + tubeWidth - 130 ? "end" : "start"}>WAVEFRONT</text> : null}
        <g className={`sound-speaker ${narrationStep?.id === "source" ? "highlighted" : ""}`} transform={`translate(${tubeX - (landscape ? 48 : 12)} ${tubeY + tubeHeight / 2})`}><rect x="-38" y="-58" width="35" height="116" rx="5" /><path d={`M-3,-43 L${20 + (state.sourceDisplacementM / profile.particleDisplacementAmplitudeM) * levelScale},-23 L${20 + (state.sourceDisplacementM / profile.particleDisplacementAmplitudeM) * levelScale},23 L-3,43 Z`} /><text x="-40" y="82">{copy.canvas.source}</text><text x="-40" y="101">f = {formatNumber(state.parameters.frequencyHz, locale, 0)} Hz</text></g>
        <g className="sound-direction-labels">
          <line x1={tubeX + tubeWidth * 0.08} x2={tubeX + tubeWidth * 0.22} y1={tubeY + 34} y2={tubeY + 34} markerStart="url(#sound-particle-arrow)" markerEnd="url(#sound-particle-arrow)" />
          <text x={tubeX + tubeWidth * 0.15} y={tubeY + 57} textAnchor="middle">{copy.canvas.particleMotion}</text>
          <line x1={tubeX + tubeWidth * 0.58} x2={tubeX + tubeWidth * 0.82} y1={tubeY + 34} y2={tubeY + 34} markerEnd="url(#sound-propagation-arrow)" />
          <text x={tubeX + tubeWidth * 0.7} y={tubeY + 57} textAnchor="middle">{copy.canvas.propagation}</text>
        </g>
        <g className="sound-density-legend" transform={`translate(${tubeX + 18} ${tubeY + tubeHeight - 20})`}><rect className="compression" width="22" height="8" rx="4" /><text x="30" y="8">{copy.canvas.compression}</text><rect className="rarefaction" x="116" width="22" height="8" rx="4" /><text x="146" y="8">{copy.canvas.rarefaction}</text></g>
        {([profile.microphoneAPositionM, profile.microphoneBPositionM] as const).map((positionM, index) => {
          const active = index === 0 ? state.microphoneAActive : state.microphoneBActive;
          const arrival = index === 0 ? profile.microphoneAArrivalSeconds : profile.microphoneBArrivalSeconds;
          const label = index === 0 ? copy.canvas.micA : copy.canvas.micB;
          return <g className={`sound-microphone ${active ? "active" : ""} ${narrationStep?.id === "microphones" ? "highlighted" : ""}`} transform={`translate(${micX(positionM)} ${tubeY + tubeHeight - 5})`} key={label}><line y1="-67" y2="0" /><circle cy="-79" r="14" /><path d="M-5,-83 Q0,-72 5,-83" /><text y="28" textAnchor="middle">{label} · {formatNumber(positionM, locale, 1)} m</text><text className="sound-mic-status" y="47" textAnchor="middle">{active ? copy.canvas.arrived : copy.canvas.waiting} · {formatMilliseconds(arrival, locale)}</text></g>;
        })}
      </g>

      <g className={`sound-scope ${narrationStep?.id === "microphones" ? "highlighted" : ""}`} transform={`translate(${scopeX} ${scopeY})`}>
        <rect width={scopeWidth} height={scopeHeight} rx="8" />
        <text className="sound-panel-kicker" x="18" y="25">{copy.canvas.scope}</text>
        <text className="sound-panel-note" x={scopeWidth - 18} y="25" textAnchor="end">{copy.canvas.scopeNote}</text>
        {[0, 1, 2, 3, 4].map((index) => <line className="sound-scope-grid" x1={18 + (index / 4) * (scopeWidth - 36)} x2={18 + (index / 4) * (scopeWidth - 36)} y1="38" y2={scopeHeight - 24} key={index} />)}
        <line className="sound-scope-baseline" x1="18" x2={scopeWidth - 18} y1={landscape ? 72 : 91} y2={landscape ? 72 : 91} />
        <line className="sound-scope-baseline" x1="18" x2={scopeWidth - 18} y1={landscape ? 121 : 167} y2={landscape ? 121 : 167} />
        <path className="sound-trace mic-a" d={microphoneTrace(profile, profile.microphoneAPositionM, state.timeSeconds, 18, landscape ? 72 : 91, scopeWidth - 36, landscape ? 18 : 27)} />
        <path className="sound-trace mic-b" d={microphoneTrace(profile, profile.microphoneBPositionM, state.timeSeconds, 18, landscape ? 121 : 167, scopeWidth - 36, landscape ? 18 : 27)} />
        <text className="sound-trace-label mic-a" x="25" y={landscape ? 62 : 78}>{copy.canvas.micA}</text>
        <text className="sound-trace-label mic-b" x="25" y={landscape ? 111 : 154}>{copy.canvas.micB}</text>
        <line className="sound-time-cursor" x1={currentTimeX - scopeX} x2={currentTimeX - scopeX} y1="38" y2={scopeHeight - 22} />
        <text className="sound-time-label" x="18" y={scopeHeight - 7}>0 ms</text><text className="sound-time-label" x={scopeWidth - 18} y={scopeHeight - 7} textAnchor="end">26 ms</text>
      </g>

      <g className={`sound-formula-panel ${narrationStep?.id === "equation" || narrationStep?.id === "medium" ? "highlighted" : ""}`} transform={`translate(${formulaX} ${formulaY})`}>
        <rect width={formulaWidth} height={formulaHeight} rx="8" />
        <text className="sound-panel-kicker" x="20" y="25">{copy.canvas.equation}</text>
        <text className="sound-formula-primary" x="20" y={landscape ? 61 : 67}>c = Δx / Δt = f · λ</text>
        <text className="sound-formula-reading" x="20" y={landscape ? 92 : 105}>Δx = {formatNumber(state.parameters.microphoneSeparationM, locale, 1)} m · Δt = {formatMilliseconds(state.microphoneDelaySeconds, locale)}</text>
        <text className="sound-formula-reading" x="20" y={landscape ? 118 : 139}>c = {formatNumber(state.medium.speedMs, locale, 0)} m/s · λ = {formatNumber(state.wavelengthM, locale, 2)} m</text>
        <g className="sound-medium-chip" transform={`translate(20 ${landscape ? 132 : 158})`}><circle cx="5" cy="5" r="5" /><text x="18" y="9">{copy.media[state.parameters.medium]}</text></g>
      </g>
    </> : <g className="invalid-state"><AlertTriangle /><text x={viewWidth / 2} y={viewHeight / 2}>{copy.canvas.invalid}</text></g>}

    {narrationStep ? <g className="narration-overlay sound-narration-overlay"><text className="narration-step-number" x={tubeX} y={viewHeight - 84}>{String((narrationStepIndex ?? 0) + 1).padStart(2, "0")} / {String(narrationStepCount ?? 0).padStart(2, "0")}</text><text className="narration-step-title" x={tubeX + 90} y={viewHeight - 86}>{narrationStep.title}</text><text className="narration-step-caption" x={tubeX + 90} y={viewHeight - 52}>{narrationStep.caption}</text></g> : null}
  </svg>;
}

export function SoundWaveWorkbench() {
  const [parameters, setParameters] = useState<SoundWaveParameters>(soundWaveDefaults);
  const [locale, setLocale] = useState<Locale>("en");
  const [mode, setMode] = useState<EditorMode>("experiment");
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [narrationTimeSeconds, setNarrationTimeSeconds] = useState(0);
  const [speed, setSpeed] = useState(1 / 300);
  const [aspectRatio, setAspectRatio] = useState<CanvasAspectRatio>("16:9");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({x: 0, y: 0});
  const [panMode, setPanMode] = useState(false);
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textOverrides, setTextOverrides] = useState<SoundTextOverrides>({});
  const [durationOverrides, setDurationOverrides] = useState<SoundDurationOverrides>({});
  const workbenchRef = useRef<HTMLElement>(null);
  const stageAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const panDragRef = useRef<{pointerId: number; startX: number; startY: number; originX: number; originY: number} | null>(null);

  const copy = soundCopy[locale];
  const commonCopy = workbenchCopy[locale];
  const parsedParameters = useMemo(() => soundWaveParametersSchema.safeParse(parameters), [parameters]);
  const narrationSteps = useMemo(() => buildSoundNarration(copy.narration, textOverrides, durationOverrides), [copy.narration, durationOverrides, textOverrides]);
  const narrationDuration = getNarrationDuration(narrationSteps);
  const narrationFrame = resolveNarrationFrame(narrationSteps, narrationTimeSeconds, EXPERIMENT_DURATION_SECONDS);
  const simulationTime = mode === "narration" ? narrationFrame.simulationTimeSeconds : timeSeconds;
  const renderedState = useMemo(() => parsedParameters.success ? solveSoundWave(parsedParameters.data, simulationTime) : null, [parsedParameters, simulationTime]);
  const issues = useMemo(() => inspectSoundWave(parameters).map((issue) => localizeIssue(issue, copy)), [copy, parameters]);
  const playbackTimeSeconds = mode === "narration" ? narrationTimeSeconds : timeSeconds;
  const durationSeconds = mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
  const numericDefinitions = soundWaveTemplate.parameterDefinitions as Array<{key: NumericParameterKey; unit: string; min: number; max: number; step: number}>;

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
      const delta = ((timestamp - previous) / 1000) * (mode === "narration" ? 1 : speed);
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
    return () => {if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);};
  }, [isPlaying, mode, narrationDuration, speed]);

  const updateNumeric = useCallback((key: NumericParameterKey, value: number) => {
    setParameters((current) => ({...current, [key]: value}));
    setIsPlaying(false);
    setTimeSeconds(0);
  }, []);
  const updateMedium = useCallback((medium: SoundMedium) => {
    setParameters((current) => ({...current, medium}));
    setIsPlaying(false);
    setTimeSeconds(0);
  }, []);
  const toggleParticles = useCallback(() => setParameters((current) => ({...current, showParticles: !current.showParticles})), []);
  const stopAndResetTime = useCallback(() => {
    setIsPlaying(false);
    if (mode === "narration") setNarrationTimeSeconds(0);
    else setTimeSeconds(0);
  }, [mode]);
  const step = useCallback((direction: -1 | 1) => {
    setIsPlaying(false);
    const setter = mode === "narration" ? setNarrationTimeSeconds : setTimeSeconds;
    const increment = mode === "narration" ? 1 / 30 : TIMELINE_STEP_SECONDS;
    const limit = mode === "narration" ? narrationDuration : EXPERIMENT_DURATION_SECONDS;
    setter((current) => Math.min(limit, Math.max(0, current + direction * increment)));
  }, [mode, narrationDuration]);
  const selectNarrationStep = useCallback((index: number) => {
    setIsPlaying(false);
    setNarrationTimeSeconds(getNarrationStepStart(narrationSteps, index));
  }, [narrationSteps]);
  const updateNarrationText = useCallback((id: SoundStepId, field: "title" | "caption", value: string) => setTextOverrides((current) => ({...current, [id]: {...current[id], [field]: value}})), []);
  const updateNarrationDuration = useCallback((id: SoundStepId, value: number) => {
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

  return <main className={`workbench-shell traveling-wave-workbench sound-wave-workbench ${mode === "narration" ? "narration-mode" : ""} ${aspectRatio === "16:9" ? "ratio-landscape" : "ratio-portrait"}`} ref={workbenchRef}>
    <header className="topbar">
      <div className="project-identity"><ExperimentLibraryBackLink className="back-to-library" aria-label={locale === "en" ? "Back to experiment library" : "返回实验目录"}><ArrowLeft size={16} /></ExperimentLibraryBackLink><span className="brand-mark"><FlaskConical size={17} /></span><span className="brand-name">Science Studio</span><span className="topbar-divider" /><span className="project-name">{copy.projectName}</span><span className="sound-pack-badge"><LockKeyhole size={11} />{copy.packName}</span></div>
      <nav className="mode-switch" aria-label={commonCopy.modeLabel}><button className={`mode-button ${mode === "experiment" ? "active" : ""}`} type="button" aria-pressed={mode === "experiment"} onClick={() => {setMode("experiment"); setIsPlaying(false);}}>{commonCopy.modes.experiment}</button><button className={`mode-button ${mode === "narration" ? "active" : ""}`} type="button" aria-pressed={mode === "narration"} onClick={() => {setMode("narration"); setIsPlaying(false);}}>{commonCopy.modes.narration}</button><button className="mode-button" type="button" disabled>{commonCopy.modes.export}</button></nav>
      <div className="topbar-actions"><button className="locale-button" type="button" onClick={toggleLocale} aria-label={commonCopy.actions.switchLanguage}><Languages size={15} /><span>{locale === "en" ? "EN" : "中文"}</span></button><button className="icon-button" type="button" aria-label={commonCopy.actions.undo} disabled><Undo2 /></button><button className="icon-button" type="button" aria-label={commonCopy.actions.redo} disabled><Redo2 /></button></div>
    </header>

    <section className="workspace">
      <div className="stage-area wave-stage-area" ref={stageAreaRef}>
        <div className="stage-meta wave-stage-meta"><span>{commonCopy.stage.outputCanvas}</span><div className="wave-canvas-toolbar" role="toolbar" aria-label={copy.viewport.canvasNavigation}><div className="canvas-ratio-switch" role="group" aria-label={copy.viewport.ratio}>{(["9:16", "16:9"] as CanvasAspectRatio[]).map((ratio) => <button className={aspectRatio === ratio ? "active" : ""} type="button" aria-pressed={aspectRatio === ratio} title={ratio === "9:16" ? copy.viewport.portrait : copy.viewport.landscape} onClick={() => changeAspectRatio(ratio)} key={ratio}>{ratio}</button>)}</div><CanvasTextSizeControls locale={locale} /><button className="canvas-tool-button" type="button" onClick={() => changeZoom(-0.25)} disabled={zoom <= 0.5} aria-label={copy.viewport.zoomOut}><ZoomOut /></button><output className="canvas-zoom-value" aria-live="polite">{Math.round(zoom * 100)}%</output><button className="canvas-tool-button" type="button" onClick={() => changeZoom(0.25)} disabled={zoom >= 2.5} aria-label={copy.viewport.zoomIn}><ZoomIn /></button><button className={`canvas-tool-button ${panMode ? "active" : ""}`} type="button" onClick={() => setPanMode((current) => !current)} disabled={zoom <= 1} aria-pressed={panMode} aria-label={copy.viewport.move}><Move /></button><button className="canvas-tool-button" type="button" onClick={resetCanvasView} disabled={zoom === 1 && pan.x === 0 && pan.y === 0} aria-label={copy.viewport.fit}><Scan /></button><button className="canvas-tool-button" type="button" onClick={() => void toggleFullscreen()} aria-label={isFullscreen ? copy.viewport.exitFullscreen : copy.viewport.enterFullscreen}>{isFullscreen ? <Minimize2 /> : <Maximize2 />}</button></div></div>
        <div className={`wave-canvas-transform ${aspectRatio === "16:9" ? "is-landscape" : "is-portrait"} ${panMode && zoom > 1 ? "can-pan" : ""} ${isDraggingCanvas ? "is-dragging" : ""}`} style={{transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`}} tabIndex={0} aria-label={copy.viewport.canvasNavigation}
          onWheel={(event) => {if (!event.ctrlKey && !event.metaKey) return; event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.25 : -0.25);}}
          onPointerDown={(event) => {if (!panMode || zoom <= 1 || event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); panDragRef.current = {pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, originX: pan.x, originY: pan.y}; setIsDraggingCanvas(true);}}
          onPointerMove={(event) => {const drag = panDragRef.current; if (!drag || drag.pointerId !== event.pointerId) return; setPan(clampPan({x: drag.originX + event.clientX - drag.startX, y: drag.originY + event.clientY - drag.startY}, zoom));}}
          onPointerUp={(event) => {if (panDragRef.current?.pointerId !== event.pointerId) return; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); panDragRef.current = null; setIsDraggingCanvas(false);}}
          onPointerCancel={() => {panDragRef.current = null; setIsDraggingCanvas(false);}}
          onKeyDown={(event) => {if (!panMode || zoom <= 1) return; const movement: Record<string, {x: number; y: number}> = {ArrowUp: {x: 0, y: 24}, ArrowDown: {x: 0, y: -24}, ArrowLeft: {x: 24, y: 0}, ArrowRight: {x: -24, y: 0}}; const delta = movement[event.key]; if (!delta) return; event.preventDefault(); setPan((current) => clampPan({x: current.x + delta.x, y: current.y + delta.y}, zoom));}}>
          <SoundWaveCanvas state={renderedState} locale={locale} aspectRatio={aspectRatio} narrationStep={mode === "narration" ? narrationFrame.step : undefined} narrationStepIndex={mode === "narration" ? narrationFrame.index : undefined} narrationStepCount={mode === "narration" ? narrationSteps.length : undefined} />
        </div>
      </div>

      <aside className="parameter-panel">
        {mode === "experiment" ? <>
          <div className="panel-heading"><div><span className="panel-kicker">{commonCopy.panel.kicker}</span><h1>{commonCopy.panel.parameters}</h1></div><button className="icon-button" type="button" aria-label={commonCopy.actions.collapseParameters}><ChevronDown /></button></div>
          <div className="parameter-list">
            <div className="parameter-control sound-medium-control"><label htmlFor="sound-medium">{copy.parameters.medium}</label><select id="sound-medium" value={parameters.medium} onChange={(event) => updateMedium(event.currentTarget.value as SoundMedium)}>{(Object.keys(soundMedia) as SoundMedium[]).map((medium) => <option value={medium} key={medium}>{copy.media[medium]}</option>)}</select></div>
            {numericDefinitions.map((definition) => {const issue = !parsedParameters.success ? parsedParameters.error.issues.find((item) => item.path[0] === definition.key) : undefined; const label = copy.parameters[definition.key]; return <div className="parameter-control" key={definition.key}><div className="parameter-row"><label htmlFor={`sound-${definition.key}-number`}>{label}</label><div className="number-field"><input id={`sound-${definition.key}-number`} type="number" min={definition.min} max={definition.max} step={definition.step} value={parameters[definition.key]} onInput={(event) => updateNumeric(definition.key, event.currentTarget.value === "" ? Number.NaN : Number(event.currentTarget.value))} aria-invalid={Boolean(issue)} /><span>{definition.unit}</span></div></div><input className="parameter-range" aria-label={`${label}${locale === "en" ? " slider" : "滑杆"}`} type="range" min={definition.min} max={definition.max} step={definition.step} value={Number.isFinite(parameters[definition.key]) ? parameters[definition.key] : definition.min} onChange={(event) => updateNumeric(definition.key, event.currentTarget.valueAsNumber)} />{issue ? <p className="field-error">{locale === "en" ? `Enter ${definition.min}-${definition.max}.` : `请输入 ${definition.min}-${definition.max}。`}</p> : null}</div>;})}
            <div className="parameter-control wave-toggle-parameter"><span className="wave-control-label">{copy.parameters.particles}</span><button className={`wave-switch-control ${parameters.showParticles ? "enabled" : ""}`} type="button" role="switch" aria-checked={parameters.showParticles} onClick={toggleParticles}><Check size={15} /><span>{parameters.showParticles ? copy.toggles.on : copy.toggles.off}</span><span className="wave-switch-track" aria-hidden="true"><span /></span></button></div>
          </div>
          <section className="measurement-section"><div className="section-title"><h2>{copy.measurements.title}</h2><span>{copy.measurements.model}</span></div><dl className="measurements sound-measurements">
            <div className="sound-measurement-heading"><dt>{copy.media[parameters.medium]}</dt><dd>{renderedState ? `${formatNumber(renderedState.medium.speedMs, locale, 0)} m/s` : "--"}</dd></div>
            <div><dt>{copy.measurements.frequency}</dt><dd>{renderedState ? formatNumber(renderedState.parameters.frequencyHz, locale, 0) : "--"}<small>Hz</small></dd></div><div><dt>{copy.measurements.period}</dt><dd>{renderedState ? formatMilliseconds(renderedState.periodSeconds, locale) : "--"}</dd></div><div><dt>{copy.measurements.wavelength}</dt><dd>{renderedState ? formatNumber(renderedState.wavelengthM, locale, 2) : "--"}<small>m</small></dd></div><div><dt>{copy.measurements.pressure}</dt><dd>{renderedState ? formatNumber(renderedState.pressureRmsPa, locale, 3) : "--"}<small>Pa</small></dd></div><div className="sound-delay-measurement"><dt>{copy.measurements.delay}</dt><dd>{renderedState ? formatMilliseconds(renderedState.microphoneDelaySeconds, locale) : "--"}</dd></div>
            <div className={`sound-mic-reading ${renderedState?.microphoneAActive ? "active" : ""}`}><dt><Mic2 size={13} />{copy.measurements.micA}</dt><dd>{renderedState?.microphoneAActive ? copy.measurements.receiving : copy.measurements.waiting}</dd></div><div className={`sound-mic-reading ${renderedState?.microphoneBActive ? "active" : ""}`}><dt><Mic2 size={13} />{copy.measurements.micB}</dt><dd>{renderedState?.microphoneBActive ? copy.measurements.receiving : copy.measurements.waiting}</dd></div>
          </dl></section>
          <section className="science-section"><div className="section-title"><h2>{commonCopy.panel.scienceNotes}</h2></div>{issues.map((issue) => <div className={`science-issue ${issue.severity}`} key={issue.id}>{issue.severity === "assumption" ? <Info size={15} /> : <AlertTriangle size={15} />}<div><strong>{issue.title}</strong><p>{issue.detail}</p></div></div>)}</section>
        </> : <>
          <div className="panel-heading narration-panel-heading"><div><span className="panel-kicker">{commonCopy.narration.kicker}</span><h1>{commonCopy.narration.steps}</h1></div><span className="narration-step-count">{commonCopy.narration.stepCount(narrationFrame.index + 1, narrationSteps.length)}</span></div>
          <div className="narration-step-list" aria-label={commonCopy.narration.steps}>{narrationSteps.map((item, index) => <button className={`narration-step-row ${index === narrationFrame.index ? "active" : ""}`} type="button" onClick={() => selectNarrationStep(index)} key={item.id}><span className="narration-step-index">{String(index + 1).padStart(2, "0")}</span><span className="narration-step-summary"><strong>{item.title}</strong><small>{item.durationSeconds.toFixed(1)} {commonCopy.narration.seconds}</small></span><span className={`scene-mode ${item.simulationMode}`}>{item.simulationMode === "play" ? <Play size={12} /> : <Pause size={12} />}</span></button>)}</div>
          <section className="narration-editor"><label><span>{commonCopy.narration.title}</span><input type="text" maxLength={80} value={narrationFrame.step.title} onChange={(event) => updateNarrationText(narrationFrame.step.id as SoundStepId, "title", event.currentTarget.value)} /></label><label><span>{commonCopy.narration.caption}</span><textarea maxLength={240} rows={3} value={narrationFrame.step.caption} onChange={(event) => updateNarrationText(narrationFrame.step.id as SoundStepId, "caption", event.currentTarget.value)} /></label><div className="narration-editor-row"><label><span>{commonCopy.narration.duration}</span><div className="duration-field"><input type="number" min="1" max="10" step="0.5" value={narrationFrame.step.durationSeconds} onChange={(event) => updateNarrationDuration(narrationFrame.step.id as SoundStepId, event.currentTarget.valueAsNumber)} /><span>{commonCopy.narration.seconds}</span></div></label><div className="scene-behavior"><span>{commonCopy.narration.scene}</span><strong>{narrationFrame.step.simulationMode === "play" ? <Play size={13} /> : <Pause size={13} />}{narrationFrame.step.simulationMode === "play" ? commonCopy.narration.playMotion : commonCopy.narration.holdFrame}</strong></div></div><button className="restore-steps-button" type="button" onClick={restoreNarrationDefaults}><ListRestart size={15} />{commonCopy.narration.restoreDefaults}</button></section>
        </>}
      </aside>
    </section>

    <footer className="playback-bar"><div className="playback-controls"><button className="icon-button" type="button" onClick={stopAndResetTime} aria-label={commonCopy.actions.reset}><RotateCcw /></button><button className="icon-button" type="button" onClick={() => step(-1)} aria-label={commonCopy.actions.previousFrame}><SkipBack /></button><button className="play-button" type="button" onClick={() => {if (playbackTimeSeconds >= durationSeconds) stopAndResetTime(); setIsPlaying((current) => !current);}} disabled={!renderedState} aria-label={isPlaying ? commonCopy.actions.pause : commonCopy.actions.play}>{isPlaying ? <Pause /> : <Play />}</button><button className="icon-button" type="button" onClick={() => step(1)} aria-label={commonCopy.actions.nextFrame}><SkipForward /></button></div><span className="timecode">{mode === "narration" ? formatNumber(playbackTimeSeconds, locale) : formatMilliseconds(playbackTimeSeconds, locale)} <small>/ {mode === "narration" ? `${formatNumber(durationSeconds, locale)} s` : formatMilliseconds(durationSeconds, locale, 0)}</small></span>{mode === "narration" ? <div className="lesson-timeline-wrap"><div className="lesson-segments" aria-hidden="true">{narrationSteps.map((item, index) => <span className={index === narrationFrame.index ? "active" : ""} style={{flex: item.durationSeconds}} key={item.id}><small>{String(index + 1).padStart(2, "0")}</small></span>)}</div><input className="timeline lesson-timeline" aria-label={commonCopy.narration.timeline} type="range" min="0" max={durationSeconds} step={1 / 30} value={narrationTimeSeconds} onInput={(event) => {setIsPlaying(false); setNarrationTimeSeconds(event.currentTarget.valueAsNumber);}} /></div> : <input className="timeline" aria-label={locale === "en" ? "Physical sound-wave time" : "声波物理时间"} type="range" min="0" max={durationSeconds} step={TIMELINE_STEP_SECONDS} value={timeSeconds} onInput={(event) => {setIsPlaying(false); setTimeSeconds(event.currentTarget.valueAsNumber);}} />}{mode === "experiment" ? <label className="speed-control"><span>{locale === "en" ? "Slow motion" : "慢动作"}</span><select value={speed} onChange={(event) => setSpeed(Number(event.currentTarget.value))}><option value={1 / 500}>1/500×</option><option value={1 / 300}>1/300×</option><option value={1 / 200}>1/200×</option><option value={1 / 100}>1/100×</option></select></label> : <span className="sound-lesson-speed"><Waves size={14} />{locale === "en" ? "Lesson timing" : "讲解时间"}</span>}</footer>
  </main>;
}
