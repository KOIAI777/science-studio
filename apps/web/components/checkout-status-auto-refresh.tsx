"use client";

import {RefreshCw} from "lucide-react";
import {useRouter} from "next/navigation";
import {useEffect, useState} from "react";

const MAX_AUTOMATIC_CHECKS = 6;

export function CheckoutStatusAutoRefresh({enabled}: {enabled: boolean}) {
  const router = useRouter();
  const [checks, setChecks] = useState(0);

  useEffect(() => {
    if (!enabled || checks >= MAX_AUTOMATIC_CHECKS) return;
    const timer = window.setTimeout(() => {
      router.refresh();
      setChecks((current) => current + 1);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [checks, enabled, router]);

  if (!enabled) return null;

  return (
    <div className="checkout-auto-refresh" aria-live="polite" aria-atomic="true">
      <RefreshCw className={checks < MAX_AUTOMATIC_CHECKS ? "checking" : ""} size={14} />
      <span>{checks < MAX_AUTOMATIC_CHECKS ? "This screen checks your access automatically every few seconds." : "Automatic checks are paused. Use Refresh status to check again."}</span>
    </div>
  );
}
