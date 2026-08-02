"use client";

import {useEffect} from "react";
import {EXPERIMENT_LIBRARY_RETURN_KEY} from "./experiment-library-back-link";

const STORAGE_PREFIX = "science-studio:experiment-library:scroll";

function readSavedScroll(storageKey: string) {
  const value = Number.parseInt(window.sessionStorage.getItem(storageKey) ?? "", 10);
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function ExperimentLibraryScrollMemory({locationKey}: {locationKey: string}) {
  useEffect(() => {
    const storageKey = `${STORAGE_PREFIX}:${locationKey}`;
    let saveFrame = 0;
    let restoreFrame = 0;

    const saveScroll = () => {
      window.sessionStorage.setItem(storageKey, String(Math.max(0, Math.round(window.scrollY))));
    };

    const scheduleSave = () => {
      window.cancelAnimationFrame(saveFrame);
      saveFrame = window.requestAnimationFrame(saveScroll);
    };

    const savedScroll = readSavedScroll(storageKey);
    window.sessionStorage.setItem(EXPERIMENT_LIBRARY_RETURN_KEY, locationKey);
    if (savedScroll > 0) {
      const restoreScroll = () => {
        const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        window.scrollTo({top: Math.min(savedScroll, maximumScroll), behavior: "auto"});
      };

      restoreScroll();
      restoreFrame = window.requestAnimationFrame(restoreScroll);
    }

    window.addEventListener("scroll", scheduleSave, {passive: true});
    window.addEventListener("pagehide", saveScroll);
    document.addEventListener("click", saveScroll, true);

    return () => {
      window.cancelAnimationFrame(saveFrame);
      window.cancelAnimationFrame(restoreFrame);
      window.removeEventListener("scroll", scheduleSave);
      window.removeEventListener("pagehide", saveScroll);
      document.removeEventListener("click", saveScroll, true);
    };
  }, [locationKey]);

  return null;
}
