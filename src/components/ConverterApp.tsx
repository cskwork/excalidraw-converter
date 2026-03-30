"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, AlertCircle, Type, FileUp, ImageIcon, GripVertical, Sun, MoonStar } from "lucide-react";
import { TextInput } from "./TextInput";
import { FileUpload } from "./FileUpload";
import { ImageUpload } from "./ImageUpload";
import { ExcalidrawWrapper } from "./ExcalidrawWrapper";

type InputMode = "text" | "file" | "image";
type ThemeMode = "light" | "dark";

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

const STORAGE_KEYS = {
  elements: "excalidraw-converter:elements",
  text: "excalidraw-converter:text",
  mode: "excalidraw-converter:mode",
  theme: "excalidraw-converter:theme",
} as const;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function ConverterApp() {
  const getInitialTheme = useCallback((): ThemeMode => {
    const stored = loadFromStorage<ThemeMode | null>(STORAGE_KEYS.theme, null);
    if (stored) return stored;
    if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  }, []);

  const [inputMode, setInputMode] = useState<InputMode>(() =>
    loadFromStorage<InputMode>(STORAGE_KEYS.mode, "text"),
  );
  const [isConverting, setIsConverting] = useState(false);
  const [elements, setElements] = useState<readonly Record<string, unknown>[]>(() =>
    loadFromStorage<Record<string, unknown>[]>(STORAGE_KEYS.elements, []),
  );
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  const [pendingText, setPendingText] = useState<string | null>(() =>
    loadFromStorage<string | null>(STORAGE_KEYS.text, null),
  );
  const [pendingFile, setPendingFile] = useState<{ file: File; fileName: string } | null>(null);
  const [pendingImage, setPendingImage] = useState<{ file: File; mediaType: string } | null>(null);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.mode, JSON.stringify(inputMode));
  }, [inputMode]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.elements, JSON.stringify(elements));
  }, [elements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.text, JSON.stringify(pendingText));
  }, [pendingText]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.theme, JSON.stringify(theme));
  }, [theme]);

  // Resize handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, e.clientX));
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
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

  const [elapsedSec, setElapsedSec] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  // Elapsed time ticker while converting
  useEffect(() => {
    if (!isConverting) {
      setElapsedSec(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [isConverting]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const handleConvert = useCallback(async () => {
    setError(null);
    setSummary(null);

    const formData = new FormData();
    formData.set("type", inputMode);

    if (inputMode === "text" && pendingText) {
      formData.set("text", pendingText);
    } else if (inputMode === "file" && pendingFile) {
      formData.set("file", pendingFile.file, pendingFile.fileName);
    } else if (inputMode === "image" && pendingImage) {
      formData.set("file", pendingImage.file);
    } else {
      setError("Please provide input before converting.");
      return;
    }

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    // Client-side timeout (130s — slightly longer than server's 120s)
    const clientTimeout = setTimeout(() => controller.abort(), 130_000);

    setIsConverting(true);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? `Conversion failed (${response.status})`);
      }
      const data = (await response.json()) as { elements: Record<string, unknown>[]; summary?: string };
      setElements(data.elements);
      setSummary(data.summary ?? null);
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("Conversion timed out. Try simpler or shorter input.");
      } else {
        setError(err instanceof Error ? err.message : "An unexpected error occurred");
      }
    } finally {
      clearTimeout(clientTimeout);
      setIsConverting(false);
      abortRef.current = null;
    }
  }, [inputMode, pendingText, pendingFile, pendingImage]);

  const handleTextSubmit = useCallback((text: string) => setPendingText(text), []);
  const handleFileSubmit = useCallback((file: File, fileName: string) => setPendingFile({ file, fileName }), []);
  const handleImageSubmit = useCallback((file: File, mediaType: string) => setPendingImage({ file, mediaType }), []);
  const handleElementsChange = useCallback((updated: readonly Record<string, unknown>[]) => {
    setElements(updated);
  }, []);

  const modes: { key: InputMode; label: string; icon: typeof Type }[] = [
    { key: "text", label: "Text", icon: Type },
    { key: "file", label: "File", icon: FileUp },
    { key: "image", label: "Image", icon: ImageIcon },
  ];

  const hasInput =
    (inputMode === "text" && pendingText) ||
    (inputMode === "file" && pendingFile) ||
    (inputMode === "image" && pendingImage);

  return (
    <div className="converter-root flex h-screen font-sans" data-theme={theme}>
      {/* Left sidebar */}
      <aside
        className="converter-sidebar flex flex-shrink-0 flex-col"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 pb-3 pt-4">
          <div>
            <h1 className="converter-heading text-[15px] font-semibold">Excalidraw Converter</h1>
            <p className="converter-subheading mt-0.5 text-[11px]">Turn anything into editable diagrams</p>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="converter-toggle"
            aria-pressed={theme === "dark"}
            aria-label="Toggle dark mode"
          >
            {theme === "dark" ? <MoonStar className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            <span className="converter-toggle__label text-[11px] font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
          </button>
        </div>

        {/* Mode tabs — pill style matching Excalidraw toolbar */}
        <div className="flex gap-1 px-4 pb-3">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setInputMode(key)}
              className={`converter-tab flex items-center gap-1.5 rounded-lg px-3 py-[6px] text-[12px] font-medium transition-all ${
                inputMode === key ? "is-active" : ""
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="converter-divider mx-4 border-t" />

        {/* Input area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {inputMode === "text" && <TextInput onSubmit={handleTextSubmit} initialValue={pendingText ?? ""} />}
          {inputMode === "file" && <FileUpload onSubmit={handleFileSubmit} />}
          {inputMode === "image" && <ImageUpload onSubmit={handleImageSubmit} />}
        </div>

        {/* Error */}
        {error && (
          <div className="converter-card converter-card--error mx-4 mb-2 flex items-start gap-2 rounded-lg px-3 py-2 text-[12px]">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary */}
        {summary && !error && (
          <div className="converter-card converter-card--info mx-4 mb-2 rounded-lg px-3 py-2 text-[12px]">
            {summary}
          </div>
        )}

        {/* Convert button — Excalidraw accent purple */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleConvert}
            disabled={isConverting || !hasInput}
            className={`converter-primary flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all ${
              isConverting || !hasInput ? "is-disabled" : ""
            }`}
          >
            {isConverting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Converting… {elapsedSec > 0 && `${elapsedSec}s`}
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                Convert to Diagram
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Resize handle */}
      <div
        onMouseDown={startResize}
        className="converter-resize group flex w-[6px] cursor-col-resize items-center justify-center"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Right — Excalidraw editor */}
      <main className="flex-1">
        <ExcalidrawWrapper elements={elements} onChange={handleElementsChange} theme={theme} />
      </main>
    </div>
  );
}
