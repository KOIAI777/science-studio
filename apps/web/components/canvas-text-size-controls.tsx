"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import type {Locale} from "../lib/i18n";

const STORAGE_KEY = "science-studio-canvas-text-scale";
const TEXT_SCALES = [0.9, 1, 1.1, 1.2, 1.25, 1.5, 1.75, 2] as const;

function normalizeScale(value: number) {
  return TEXT_SCALES.reduce((closest, candidate) => (
    Math.abs(candidate - value) < Math.abs(closest - value) ? candidate : closest
  ), TEXT_SCALES[1]);
}

export function CanvasTextSizeControls({locale}: {locale: Locale}) {
  const [scale, setScale] = useState<number>(1);
  const controlsRef = useRef<HTMLDivElement>(null);
  const labels = locale === "en"
    ? {group: "Canvas text size", decrease: "Decrease canvas text size", increase: "Increase canvas text size"}
    : {group: "画布字号", decrease: "减小画布字号", increase: "增大画布字号"};

  const applyScale = useCallback((next: number) => {
    const normalized = normalizeScale(next);
    controlsRef.current?.closest<HTMLElement>(".stage-area")?.style.setProperty("--canvas-text-scale", String(normalized));
    window.localStorage.setItem(STORAGE_KEY, String(normalized));
    setScale(normalized);
  }, []);

  useEffect(() => {
    const stored = Number(window.localStorage.getItem(STORAGE_KEY));
    applyScale(Number.isFinite(stored) && stored > 0 ? stored : 1);
  }, [applyScale]);

  const changeScale = (direction: -1 | 1) => {
    const currentIndex = TEXT_SCALES.findIndex((item) => item === scale);
    const nextIndex = Math.min(TEXT_SCALES.length - 1, Math.max(0, currentIndex + direction));
    applyScale(TEXT_SCALES[nextIndex]);
  };

  return <div className="canvas-text-controls" role="group" aria-label={labels.group} ref={controlsRef}>
    <button className="canvas-text-button" type="button" onClick={() => changeScale(-1)} disabled={scale <= TEXT_SCALES[0]} aria-label={labels.decrease} title={labels.decrease}>A−</button>
    <output className="canvas-text-value" aria-live="polite" aria-label={labels.group}>{Math.round(scale * 100)}%</output>
    <button className="canvas-text-button" type="button" onClick={() => changeScale(1)} disabled={scale >= TEXT_SCALES[TEXT_SCALES.length - 1]} aria-label={labels.increase} title={labels.increase}>A+</button>
  </div>;
}
