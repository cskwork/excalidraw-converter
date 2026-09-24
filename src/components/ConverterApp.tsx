"use client";

import { useState, useCallback, useRef, useEffect, type KeyboardEvent } from "react";
import { AlertCircle, FileUp, GripVertical, ImageIcon, Moon, Shapes, Sun, Type } from "lucide-react";
import { TextInput } from "./TextInput";
import { FileUpload } from "./FileUpload";
import { ImageUpload } from "./ImageUpload";
import { ExcalidrawWrapper, type SceneLoad } from "./ExcalidrawWrapper";
import { StatusWindow, type Phase } from "./StatusWindow";
import {
  countScene,
  describeHttpFailure,
  describeThrownFailure,
  liveElements,
  type ConvertFailure,
} from "@/lib/convert-client";
import { buildSampleSkeleton } from "@/lib/sample-diagram";

type InputMode = "text" | "file" | "image";
type ThemeMode = "light" | "dark";
type View = "panel" | "canvas";
type SceneElement = Record<string, unknown>;

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;
const RESIZE_STEP = 16;
const MAX_TEXT_LENGTH = 100_000;
const CLIENT_TIMEOUT_MS = 130_000; // slightly longer than the server's 120s
const PERSIST_DELAY_MS = 400;

const STORAGE_KEYS = {
  elements: "excalidraw-converter:elements",
  text: "excalidraw-converter:text",
  mode: "excalidraw-converter:mode",
  theme: "excalidraw-converter:theme",
} as const;

const MODES: readonly { key: InputMode; label: string; icon: typeof Type }[] = [
  { key: "text", label: "Text", icon: Type },
  { key: "file", label: "File", icon: FileUp },
  { key: "image", label: "Image", icon: ImageIcon },
];

const EXAMPLES: readonly { code: string; title: string; prompt: string }[] = [
  {
    code: "A1",
    title: "Microservices",
    prompt: "Draw a microservices architecture with an API gateway, three services and a shared database.",
  },
  {
    code: "A2",
    title: "Sign-in flow",
    prompt: "Create a user authentication flow with login, two-factor authentication and password reset.",
  },
  {
    code: "A3",
    title: "Checkout",
    prompt: "Map an online checkout: cart, shipping address, payment, fraud check, order confirmation and receipt email.",
  },
  {
    code: "A4",
    title: "Release pipeline",
    prompt: "Show a release pipeline: commit, build, unit and end-to-end checks, staging deploy, approval, production deploy and rollback.",
  },
];

const REPO_URL = "https://github.com/cskwork/excalidraw-converter";

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeStorage(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): the session still works, it just won't be restored.
  }
}

function initialTheme(): ThemeMode {
  const stored = readStorage<string | null>(STORAGE_KEYS.theme, null);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function isMobileViewport(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(max-width: 767.98px)").matches;
}

type Outcome =
  | { kind: "plotted"; summary: string; seconds: number | null }
  | { kind: "fault"; failure: ConvertFailure; seconds: number | null };

export function ConverterApp() {
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [text, setText] = useState("");
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState<View>("panel");
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const [isConverting, setIsConverting] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [scene, setScene] = useState<SceneLoad | null>(null);
  const [hasContent, setHasContent] = useState(false);
  const [isMac, setIsMac] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  const isResizing = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const cancelledByUser = useRef(false);
  const sceneNonce = useRef(0);
  const awaitingRestore = useRef(false);
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingElements = useRef<SceneElement[] | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const tabRefs = useRef<Record<InputMode, HTMLButtonElement | null>>({ text: null, file: null, image: null });

  // Restore the session after hydration (keeps server and client markup identical).
  useEffect(() => {
    const storedMode = readStorage<string>(STORAGE_KEYS.mode, "text");
    if (storedMode === "text" || storedMode === "file" || storedMode === "image") setInputMode(storedMode);
    setText(readStorage<string | null>(STORAGE_KEYS.text, null) ?? "");
    setTheme(initialTheme());
    setIsMac(/Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent));

    const stored = liveElements(readStorage<SceneElement[]>(STORAGE_KEYS.elements, []));
    if (stored.length > 0) {
      awaitingRestore.current = true;
      sceneNonce.current += 1;
      setScene({ elements: stored, nonce: sceneNonce.current });
      setHasContent(true);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767.98px)");
    const sync = () => setIsMobile(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.mode, inputMode);
  }, [inputMode, hydrated]);

  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.text, text);
  }, [text, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeStorage(STORAGE_KEYS.theme, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme, hydrated]);

  // Canvas persistence: debounced, flushed when the page is hidden.
  const flushElements = useCallback(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = null;
    if (pendingElements.current) writeStorage(STORAGE_KEYS.elements, pendingElements.current);
    pendingElements.current = null;
  }, []);

  useEffect(() => {
    const onHide = () => flushElements();
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      flushElements();
    };
  }, [flushElements]);

  const handleElementsChange = useCallback(
    (updated: readonly SceneElement[]) => {
      const live = liveElements(updated);
      // Excalidraw reports an empty scene once before the restored one is placed.
      if (awaitingRestore.current) {
        if (live.length === 0) return;
        awaitingRestore.current = false;
      }
      setHasContent(live.length > 0);
      pendingElements.current = live;
      if (persistTimer.current) clearTimeout(persistTimer.current);
      persistTimer.current = setTimeout(flushElements, PERSIST_DELAY_MS);
    },
    [flushElements],
  );

  const placeScene = useCallback(
    (elements: readonly SceneElement[]) => {
      awaitingRestore.current = false;
      sceneNonce.current += 1;
      setScene({ elements, nonce: sceneNonce.current });
      setHasContent(elements.length > 0);
      pendingElements.current = [...elements];
      flushElements();
      if (isMobileViewport()) setView("canvas");
    },
    [flushElements],
  );

  // Sidebar resize: pointer drag plus keyboard on the separator.
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      setSidebarWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX)));
    };
    const handleMouseUp = () => {
      if (!isResizing.current) return;
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startResize = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const handleResizeKey = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const delta = e.key === "ArrowLeft" ? -RESIZE_STEP : e.key === "ArrowRight" ? RESIZE_STEP : 0;
    if (e.key === "Home") setSidebarWidth(MIN_WIDTH);
    else if (e.key === "End") setSidebarWidth(MAX_WIDTH);
    else if (delta) setSidebarWidth((w) => Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, w + delta)));
    else return;
    e.preventDefault();
  }, []);

  // Clock while converting
  useEffect(() => {
    if (!isConverting) return;
    const start = Date.now();
    setElapsedSec(0);
    const timer = setInterval(() => setElapsedSec(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(timer);
  }, [isConverting]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const hasInput =
    (inputMode === "text" && text.trim().length > 0) ||
    (inputMode === "file" && pendingFile !== null) ||
    (inputMode === "image" && pendingImage !== null);

  const handleConvert = useCallback(async () => {
    if (isConverting) return;
    const formData = new FormData();
    formData.set("type", inputMode);
    if (inputMode === "text" && text.trim()) formData.set("text", text);
    else if (inputMode === "file" && pendingFile) formData.set("file", pendingFile, pendingFile.name);
    else if (inputMode === "image" && pendingImage) formData.set("file", pendingImage);
    else {
      setOutcome({ kind: "fault", failure: { kind: "input", message: "Please provide input before converting." }, seconds: null });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    cancelledByUser.current = false;
    const clientTimeout = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    const started = Date.now();
    const took = () => Math.round((Date.now() - started) / 1000);

    setOutcome(null);
    setIsConverting(true);
    try {
      const response = await fetch("/api/convert", { method: "POST", body: formData, signal: controller.signal });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        setOutcome({ kind: "fault", failure: describeHttpFailure(response.status, errorData?.error), seconds: took() });
        return;
      }
      const data = (await response.json()) as { elements: SceneElement[]; summary?: string };
      const { shapes, arrows } = countScene(data.elements);
      placeScene(data.elements);
      setOutcome({
        kind: "plotted",
        summary: data.summary ?? `Plotted ${shapes} shapes and ${arrows} connections.`,
        seconds: took(),
      });
    } catch (err: unknown) {
      setOutcome({ kind: "fault", failure: describeThrownFailure(err, cancelledByUser.current), seconds: took() });
    } finally {
      clearTimeout(clientTimeout);
      setIsConverting(false);
      abortRef.current = null;
    }
  }, [isConverting, inputMode, text, pendingFile, pendingImage, placeScene]);

  const handleCancel = useCallback(() => {
    cancelledByUser.current = true;
    abortRef.current?.abort();
  }, []);

  const loadSample = useCallback(async () => {
    try {
      const { convertToExcalidrawElements } = await import("@excalidraw/excalidraw");
      // Text is measured when elements are built; wait for the hand-drawn face so labels aren't clipped.
      await Promise.race([
        document.fonts.load('20px "Excalifont"').catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
      const elements = convertToExcalidrawElements(
        buildSampleSkeleton() as unknown as Parameters<typeof convertToExcalidrawElements>[0],
      ) as unknown as SceneElement[];
      const { shapes, arrows } = countScene(elements);
      placeScene(elements);
      setOutcome({
        kind: "plotted",
        summary: `Sample loaded: ${shapes} shapes and ${arrows} connections. Edit it freely.`,
        seconds: null,
      });
    } catch {
      setOutcome({
        kind: "fault",
        failure: { kind: "server", message: "The sample diagram couldn't be loaded. Reload the page and try again." },
        seconds: null,
      });
    }
  }, [placeScene]);

  const chooseMode = useCallback((mode: InputMode) => {
    setInputMode(mode);
    setOutcome(null);
  }, []);

  const handleTabKey = useCallback(
    (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
      let next = index;
      if (e.key === "ArrowRight") next = (index + 1) % MODES.length;
      else if (e.key === "ArrowLeft") next = (index - 1 + MODES.length) % MODES.length;
      else if (e.key === "Home") next = 0;
      else if (e.key === "End") next = MODES.length - 1;
      else return;
      e.preventDefault();
      const mode = MODES[next].key;
      chooseMode(mode);
      tabRefs.current[mode]?.focus();
    },
    [chooseMode],
  );

  const applyExample = useCallback(
    (prompt: string) => {
      chooseMode("text");
      setText(prompt);
      requestAnimationFrame(() => textRef.current?.focus());
    },
    [chooseMode],
  );

  const handlePanelKey = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && hasInput && !isConverting) {
        e.preventDefault();
        void handleConvert();
      }
    },
    [hasInput, isConverting, handleConvert],
  );

  const phase: Phase = isConverting
    ? "working"
    : outcome?.kind === "fault"
      ? "fault"
      : outcome?.kind === "plotted"
        ? "plotted"
        : hasInput
          ? "ready"
          : "idle";

  const shortcut = isMac ? "Cmd+Enter" : "Ctrl+Enter";
  const detail =
    phase === "working"
      ? "Claude is drawing your diagram. This can take up to two minutes."
      : phase === "plotted" && outcome?.kind === "plotted"
        ? outcome.summary
        : phase === "fault"
          ? "Stopped. The message below says what happened and what to try."
          : phase === "ready"
            ? `Input loaded. Press Convert or ${shortcut}.`
            : "Pick a mode, then describe a diagram or drop in a document or picture.";
  const clockSeconds = isConverting ? elapsedSec : (outcome?.seconds ?? null);

  const failure = outcome?.kind === "fault" ? outcome.failure : null;

  return (
    <div
      className="converter-root flex h-[100dvh] flex-col font-sans md:flex-row"
      data-theme={theme}
      data-view={view}
      style={{ ["--panel-w" as string]: `${sidebarWidth}px` }}
    >
      {/* Mobile only: switch between the instrument and the canvas */}
      <div className="converter-viewswitch gap-1.5 px-3 py-2" role="tablist" aria-label="View">
        {(["panel", "canvas"] as const).map((v) => (
          <button
            key={v}
            type="button"
            role="tab"
            aria-selected={view === v}
            onClick={() => setView(v)}
            className={`converter-key converter-tab !min-h-[36px] !flex-row ${view === v ? "is-active" : ""}`}
          >
            <span className="converter-tab__led !top-1/2 !-translate-y-1/2" aria-hidden />
            {v === "panel" ? "Panel" : "Canvas"}
          </button>
        ))}
      </div>

      <aside
        className="converter-sidebar flex min-h-0 flex-1 flex-shrink-0 flex-col md:flex-none"
        style={{ width: sidebarWidth }}
        onKeyDown={handlePanelKey}
        aria-label="Converter controls"
      >
        {/* Header plate */}
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div className="min-w-0">
            <h1 className="converter-heading">Excalidraw Converter</h1>
            <p className="converter-subheading mt-1">Turn anything into editable diagrams</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="converter-key converter-toggle flex-shrink-0"
            aria-pressed={theme === "dark"}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" aria-hidden /> : <Moon className="h-3.5 w-3.5" aria-hidden />}
            <span className="converter-toggle__label">{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </div>

        <div className="px-4 pb-3">
          <StatusWindow phase={phase} seconds={clockSeconds} detail={detail} />
        </div>

        {/* Mode keys */}
        <div className="flex gap-2 px-4 pb-4" role="tablist" aria-label="Input mode">
          {MODES.map(({ key, label, icon: Icon }, index) => (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el;
              }}
              type="button"
              role="tab"
              id={`mode-tab-${key}`}
              aria-selected={inputMode === key}
              aria-controls="mode-panel"
              tabIndex={inputMode === key ? 0 : -1}
              onClick={() => chooseMode(key)}
              onKeyDown={(e) => handleTabKey(e, index)}
              className={`converter-key converter-tab ${inputMode === key ? "is-active" : ""}`}
            >
              <span className="converter-tab__led" aria-hidden />
              <Icon className="h-4 w-4" aria-hidden />
              {label}
            </button>
          ))}
        </div>

        <div className="converter-groove mx-4" />

        {/* Input bay */}
        <div
          className="converter-scroll flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-4 py-4"
          id="mode-panel"
          role="tabpanel"
          aria-labelledby={`mode-tab-${inputMode}`}
        >
          {inputMode === "text" && <TextInput ref={textRef} value={text} onChange={setText} maxLength={MAX_TEXT_LENGTH} />}
          {inputMode === "file" && (
            <FileUpload selected={pendingFile} onSelect={(f) => { setPendingFile(f); setOutcome(null); }} onClear={() => setPendingFile(null)} />
          )}
          {inputMode === "image" && (
            <ImageUpload selected={pendingImage} onSelect={(f) => { setPendingImage(f); setOutcome(null); }} onClear={() => setPendingImage(null)} />
          )}

          <section aria-labelledby="examples-heading" className="flex flex-col gap-2">
            <h2 id="examples-heading" className="converter-legend">
              Examples
            </h2>
            <div className="converter-cells">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.code}
                  type="button"
                  className="converter-key converter-cell"
                  onClick={() => applyExample(ex.prompt)}
                  title={ex.prompt}
                >
                  <span className="converter-cell__code" aria-hidden>
                    {ex.code}
                  </span>
                  {ex.title}
                </button>
              ))}
            </div>
            <button type="button" className="converter-key w-full !justify-start gap-2" onClick={() => void loadSample()}>
              <Shapes className="h-4 w-4" aria-hidden />
              Load sample diagram
            </button>
          </section>
        </div>

        {/* Fault message */}
        {failure && (
          <div role="alert" className="converter-card converter-card--error mx-4 mb-3 flex items-start gap-2 px-3 py-2.5 text-[12.5px] leading-snug">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
            <div className="flex flex-col gap-2">
              <span>{failure.message}</span>
              {failure.kind === "engine" && (
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  <button type="button" className="font-semibold underline underline-offset-2" onClick={() => void loadSample()}>
                    Try the sample instead
                  </button>
                  <a className="font-semibold underline underline-offset-2" href={`${REPO_URL}#quick-start`} target="_blank" rel="noreferrer">
                    Run it locally
                  </a>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Commit key */}
        <div className="flex flex-col gap-2.5 px-4 pb-4 pt-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleConvert()}
              disabled={isConverting || !hasInput}
              aria-keyshortcuts="Meta+Enter Control+Enter"
              className={`converter-primary ${isConverting ? "is-working" : ""} ${!isConverting && !hasInput ? "is-disabled" : ""}`}
            >
              <span>{isConverting ? "Converting..." : "Convert to Diagram"}</span>
              {!isConverting && (
                <kbd className="converter-kbd" aria-hidden>
                  {shortcut}
                </kbd>
              )}
            </button>
            {isConverting && (
              <button type="button" onClick={handleCancel} className="converter-key !min-h-[54px] flex-shrink-0">
                Cancel
              </button>
            )}
          </div>
          <p className="converter-footnote">
            Conversion runs through Claude Code on the machine serving this app.{" "}
            <a href={`${REPO_URL}#quick-start`} target="_blank" rel="noreferrer">
              Run it locally
            </a>
          </p>
        </div>
      </aside>

      {/* Resize handle (desktop) */}
      <div
        onMouseDown={startResize}
        onKeyDown={handleResizeKey}
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize panel"
        aria-valuemin={MIN_WIDTH}
        aria-valuemax={MAX_WIDTH}
        aria-valuenow={sidebarWidth}
        tabIndex={0}
        className="converter-resize hidden w-[6px] flex-shrink-0 cursor-col-resize items-center justify-center md:flex"
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </div>

      <main className="converter-canvas min-h-0 flex-1">
        <ExcalidrawWrapper
          scene={scene}
          hasContent={hasContent}
          visible={view === "canvas" || !isMobile}
          onChange={handleElementsChange}
          theme={theme}
        />
      </main>
    </div>
  );
}
