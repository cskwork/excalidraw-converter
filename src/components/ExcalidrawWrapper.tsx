"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import type { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  { ssr: false },
);

type SceneElements = Parameters<ExcalidrawImperativeAPI["updateScene"]>[0]["elements"];

/**
 * A scene the parent wants placed on the canvas (a conversion result, the
 * sample, or the restored session). `nonce` changes on every request so the
 * same elements can be loaded twice. User edits never flow back through here,
 * so editing never re-fits the viewport.
 */
export interface SceneLoad {
  readonly elements: readonly Record<string, unknown>[];
  readonly nonce: number;
}

interface ExcalidrawWrapperProps {
  scene: SceneLoad | null;
  hasContent: boolean;
  /** False while the canvas is hidden (mobile panel view); fitting waits until it is shown. */
  visible: boolean;
  onChange?: (elements: readonly Record<string, unknown>[]) => void;
  theme?: "light" | "dark";
}

export function ExcalidrawWrapper({ scene, hasContent, visible, onChange, theme = "light" }: ExcalidrawWrapperProps) {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI | null>(null);
  const appliedNonce = useRef<number | null>(null);
  const pendingFit = useRef(false);

  const handleRef = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  const fitToContent = useCallback(() => {
    if (!excalidrawAPI) return;
    pendingFit.current = false;
    const fit = () => {
      const elements = excalidrawAPI.getSceneElements();
      if (elements.length === 0) return;
      excalidrawAPI.scrollToContent(elements, { fitToViewport: true, viewportZoomFactor: 0.85 });
    };
    fit();
    // Fit again once a container that just became visible has been measured.
    // A timer (not rAF) so it still runs when the tab is in the background.
    setTimeout(fit, 120);
  }, [excalidrawAPI]);

  // Place a requested scene exactly once per nonce.
  useEffect(() => {
    if (!excalidrawAPI || !scene || appliedNonce.current === scene.nonce) return;
    appliedNonce.current = scene.nonce;
    excalidrawAPI.updateScene({ elements: scene.elements as SceneElements });
    if (visible) fitToContent();
    else pendingFit.current = true;
  }, [excalidrawAPI, scene, visible, fitToContent]);

  // A scene placed while the canvas was hidden gets fitted once it is shown.
  useEffect(() => {
    if (visible && pendingFit.current) fitToContent();
  }, [visible, fitToContent]);

  const handleChange = useCallback(
    (updatedElements: readonly Record<string, unknown>[]) => {
      onChange?.(updatedElements);
    },
    [onChange],
  );

  return (
    <div className="relative h-full w-full">
      {!hasContent && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center p-6">
          <figure className="converter-empty-state">
            {/* eslint-disable-next-line @next/next/no-img-element -- static art, no loader needed */}
            <img
              src="/art/empty-canvas.webp"
              width={960}
              height={640}
              alt="Sketch of a handwritten note turning into a flowchart of boxes and arrows"
              className="converter-empty-state__art"
            />
            <figcaption>
              <span className="converter-empty-state__title">Upload something to generate a diagram</span>
              <span className="converter-empty-state__hint">Or draw here directly: this canvas is a full Excalidraw editor.</span>
            </figcaption>
          </figure>
        </div>
      )}
      <Excalidraw excalidrawAPI={handleRef} onChange={handleChange} theme={theme} />
    </div>
  );
}
