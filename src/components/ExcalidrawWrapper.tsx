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
  // Excalidraw hands out its API from its constructor, then loads its initial
  // (empty) scene asynchronously and resets history. A scene placed before that
  // finishes is wiped, so placement waits for the first change event, which
  // Excalidraw only emits once loading is done.
  const [editorReady, setEditorReady] = useState(false);
  const appliedNonce = useRef<number | null>(null);
  const pendingFit = useRef(false);
  const visibleRef = useRef(visible);
  visibleRef.current = visible;

  const handleRef = useCallback((api: ExcalidrawImperativeAPI) => {
    setExcalidrawAPI(api);
  }, []);

  // Fit a freshly placed scene once the canvas is shown and Excalidraw has
  // measured it. A canvas that was hidden reports a 0x0 viewport until its
  // resize observation arrives, and fitting to that leaves the diagram as a
  // speck in the corner, so this waits for real dimensions instead of a timer.
  const tryFit = useCallback(() => {
    if (!excalidrawAPI || !pendingFit.current || !visibleRef.current) return;
    const { width, height } = excalidrawAPI.getAppState();
    if (width <= 0 || height <= 0) return;
    pendingFit.current = false;
    const elements = excalidrawAPI.getSceneElements();
    if (elements.length === 0) return;
    excalidrawAPI.scrollToContent(elements, { fitToViewport: true, viewportZoomFactor: 0.85 });
  }, [excalidrawAPI]);

  // Every state change (including the viewport measurement) is a chance to
  // finish a pending fit. Deferred so the fit's own state update runs outside
  // Excalidraw's update cycle.
  useEffect(() => {
    if (!excalidrawAPI) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = excalidrawAPI.onChange(() => {
      setEditorReady(true);
      if (!pendingFit.current || timer) return;
      timer = setTimeout(() => {
        timer = null;
        tryFit();
      }, 0);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, [excalidrawAPI, tryFit]);

  // Place a requested scene exactly once per nonce, after the editor has loaded.
  useEffect(() => {
    if (!excalidrawAPI || !editorReady || !scene || appliedNonce.current === scene.nonce) return;
    appliedNonce.current = scene.nonce;
    excalidrawAPI.updateScene({ elements: scene.elements as SceneElements });
    pendingFit.current = true;
    tryFit();
  }, [excalidrawAPI, editorReady, scene, tryFit]);

  // A scene placed while the canvas was hidden gets fitted once it is shown.
  useEffect(() => {
    if (visible) tryFit();
  }, [visible, tryFit]);

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
