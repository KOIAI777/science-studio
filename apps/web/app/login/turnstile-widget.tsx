"use client";

import Script from "next/script";
import {useCallback, useEffect, useRef} from "react";

type WidgetSize = "compact" | "flexible";

type TurnstileApi = {
  render: (container: HTMLElement, options: {
    sitekey: string;
    action: string;
    size: WidgetSize;
    theme: "dark";
    responseFieldName: string;
  }) => string;
  remove: (widgetId: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

export function TurnstileWidget({siteKey}: {siteKey: string}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | undefined>(undefined);
  const widgetSizeRef = useRef<WidgetSize | undefined>(undefined);

  const renderWidget = useCallback(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!container || !turnstile) return;

    const size: WidgetSize = container.clientWidth < 300 ? "compact" : "flexible";
    if (widgetIdRef.current && widgetSizeRef.current === size) return;
    if (widgetIdRef.current) turnstile.remove(widgetIdRef.current);

    widgetSizeRef.current = size;
    widgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      action: "login",
      size,
      theme: "dark",
      responseFieldName: "cf-turnstile-response",
    });
  }, [siteKey]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(renderWidget);
    observer.observe(container);
    renderWidget();

    return () => {
      observer.disconnect();
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = undefined;
      widgetSizeRef.current = undefined;
    };
  }, [renderWidget]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={renderWidget}
      />
      <div className="auth-turnstile" ref={containerRef} />
    </>
  );
}
