"use client";

import Link from "next/link";
import type {ComponentProps} from "react";
import {useEffect, useState} from "react";

export const EXPERIMENT_LIBRARY_RETURN_KEY = "science-studio:experiment-library:return";

type ExperimentLibraryBackLinkProps = Omit<ComponentProps<typeof Link>, "href">;

export function ExperimentLibraryBackLink(props: ExperimentLibraryBackLinkProps) {
  const [href, setHref] = useState("/experiments");

  useEffect(() => {
    const savedLocation = window.sessionStorage.getItem(EXPERIMENT_LIBRARY_RETURN_KEY);
    if (savedLocation?.startsWith("/experiments?") || savedLocation === "/experiments") {
      setHref(savedLocation);
    }
  }, []);

  return <Link {...props} href={href} />;
}
