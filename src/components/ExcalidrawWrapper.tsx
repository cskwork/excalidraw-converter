"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

interface ExcalidrawWrapperProps {
  elements: readonly Record<string, unknown>[];
  onChange?: (elements: readonly Record<string, unknown>[]) => void;
  theme?: "light" | "dark";
}

export function ExcalidrawWrapper({ elements, onChange, theme = "light" }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const isUpdatingFromProps = useRef(false);

  const handleRef = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  useEffect(() => {
    if (!excalidrawAPI || elements.length === 0) return;

    isUpdatingFromProps.current = true;
    excalidrawAPI.updateScene({
      elements: elements as Parameters<
        ExcalidrawImperativeAPI["updateScene"]
      >[0]["elements"],
    });
    excalidrawAPI.scrollToContent(
      elements as Parameters<ExcalidrawImperativeAPI["scrollToContent"]>[0],
      { fitToViewport: true },
    );
    // Allow onChange to fire again after a tick
    requestAnimationFrame(() => {
      isUpdatingFromProps.current = false;
    });
  }, [excalidrawAPI, elements]);

  const handleChange = useCallback(
    (updatedElements: readonly Record<string, unknown>[]) => {
      if (isUpdatingFromProps.current || !onChange) return;
      onChange(updatedElements);
    },
    [onChange],
  );

  return (
    <div className="relative h-full w-full">
      {elements.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p className="rounded-xl bg-white/80 px-6 py-3 text-sm text-gray-400 shadow-sm backdrop-blur">
            Upload something to generate a diagram
          </p>
        </div>
      )}
      <Excalidraw excalidrawAPI={handleRef} onChange={handleChange} theme={theme} />
    </div>
  );
}
