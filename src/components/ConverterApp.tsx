"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Sparkles, AlertCircle, Type, FileUp, ImageIcon, GripVertical } from "lucide-react";
import { TextInput } from "./TextInput";
import { FileUpload } from "./FileUpload";
import { ImageUpload } from "./ImageUpload";
import { ExcalidrawWrapper } from "./ExcalidrawWrapper";

type InputMode = "text" | "file" | "image";

const MIN_WIDTH = 280;
const MAX_WIDTH = 600;
const DEFAULT_WIDTH = 360;

const STORAGE_KEYS = {
  elements: "excalidraw-converter:elements",
  text: "excalidraw-converter:text",
  mode: "excalidraw-converter:mode",
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

    setIsConverting(true);
    try {
      const response = await fetch("/api/convert", { method: "POST", body: formData });
      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errorData?.error ?? `Conversion failed (${response.status})`);
      }
      const data = (await response.json()) as { elements: Record<string, unknown>[]; summary?: string };
      setElements(data.elements);
      setSummary(data.summary ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsConverting(false);
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
    <div className="flex h-screen bg-white font-sans">
      {/* Left sidebar — Excalidraw-style light theme */}
      <aside
        className="flex flex-shrink-0 flex-col border-r border-[#e2e2e2] bg-[#f8f9fa]"
        style={{ width: sidebarWidth }}
      >
        {/* Header */}
        <div className="px-4 pb-3 pt-4">
          <h1 className="text-[15px] font-semibold text-[#1b1b1f]">
            Excalidraw Converter
          </h1>
          <p className="mt-0.5 text-[11px] text-[#8b8b8b]">
            Turn anything into editable diagrams
          </p>
        </div>

        {/* Mode tabs — pill style matching Excalidraw toolbar */}
        <div className="flex gap-1 px-4 pb-3">
          {modes.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setInputMode(key)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-[6px] text-[12px] font-medium transition-all ${
                inputMode === key
                  ? "bg-[#6965db] text-white shadow-sm"
                  : "bg-white text-[#5b5b5b] shadow-[0_0_0_1px_#e2e2e2] hover:bg-[#ececf4] hover:text-[#1b1b1f]"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="mx-4 border-t border-[#e2e2e2]" />

        {/* Input area */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {inputMode === "text" && <TextInput onSubmit={handleTextSubmit} initialValue={pendingText ?? ""} />}
          {inputMode === "file" && <FileUpload onSubmit={handleFileSubmit} />}
          {inputMode === "image" && <ImageUpload onSubmit={handleImageSubmit} />}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-4 mb-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-600">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary */}
        {summary && !error && (
          <div className="mx-4 mb-2 rounded-lg border border-[#d4d4f7] bg-[#ececf4] px-3 py-2 text-[12px] text-[#5b5b5b]">
            {summary}
          </div>
        )}

        {/* Convert button — Excalidraw accent purple */}
        <div className="px-4 pb-4 pt-2">
          <button
            onClick={handleConvert}
            disabled={isConverting || !hasInput}
            className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[13px] font-semibold transition-all ${
              isConverting || !hasInput
                ? "cursor-not-allowed bg-[#e2e2e2] text-[#aaa]"
                : "bg-[#6965db] text-white shadow-sm hover:bg-[#5b57d1] active:scale-[0.98]"
            }`}
          >
            {isConverting ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Converting...
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
        className="group flex w-[6px] cursor-col-resize items-center justify-center hover:bg-[#6965db]/10 active:bg-[#6965db]/20"
      >
        <GripVertical className="h-4 w-4 text-[#ccc] group-hover:text-[#6965db]" />
      </div>

      {/* Right — Excalidraw editor */}
      <main className="flex-1">
        <ExcalidrawWrapper elements={elements} onChange={handleElementsChange} />
      </main>
    </div>
  );
}
