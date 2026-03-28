"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

interface ExcalidrawWrapperProps {
  elements: readonly Record<string, unknown>[];
}

export function ExcalidrawWrapper({ elements }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);

  const handleRef = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  useEffect(() => {
    if (!excalidrawAPI || elements.length === 0) return;

    // Excalidraw's updateScene accepts a broad element shape internally
    excalidrawAPI.updateScene({
      elements: elements as Parameters<
        ExcalidrawImperativeAPI["updateScene"]
      >[0]["elements"],
    });
    excalidrawAPI.scrollToContent(
      elements as Parameters<ExcalidrawImperativeAPI["scrollToContent"]>[0],
      { fitToViewport: true },
    );
  }, [excalidrawAPI, elements]);

  return (
    <div className="relative h-full w-full">
      {elements.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
          <p className="rounded-xl bg-white/80 px-6 py-3 text-sm text-gray-400 shadow-sm backdrop-blur">
            Upload something to generate a diagram
          </p>
        </div>
      )}
      <Excalidraw excalidrawAPI={handleRef} />
    </div>
  );
}
