"use client";

import { useState, useCallback, useRef } from "react";
import { ImageIcon, AlertCircle } from "lucide-react";

interface ImageUploadProps {
  onSubmit: (file: File, mediaType: string) => void;
}

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_SIZE_BYTES = 10 * 1024 * 1024;

export function ImageUpload({ onSubmit }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = useCallback(
    (file: File) => {
      setError(null);
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Unsupported format. Use PNG, JPEG, GIF, or WebP.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError("Image exceeds 10MB limit.");
        return;
      }
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        if (typeof e.target?.result === "string") setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
      onSubmit(file, file.type);
    },
    [onSubmit],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processImage(file);
    },
    [processImage],
  );

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload an image"
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-all ${
          isDragging
            ? "border-[#6965db] bg-[#ececf4]"
            : "border-[#d4d4d4] bg-white hover:border-[#aaa] hover:bg-[#fafafa]"
        }`}
      >
        <ImageIcon className={`h-6 w-6 ${isDragging ? "text-[#6965db]" : "text-[#bbb]"}`} />
        <div>
          <p className="text-[12px] text-[#5b5b5b]">
            Drop an image here or <span className="text-[#6965db]">browse</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#aaa]">PNG, JPEG, GIF, WebP — max 10MB</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) processImage(f); }}
        className="hidden"
      />

      {preview && fileName && (
        <div className="flex items-center gap-2.5 rounded-lg border border-[#e2e2e2] bg-white px-3 py-2.5">
          <img src={preview} alt={fileName} className="h-10 w-10 flex-shrink-0 rounded object-cover" />
          <p className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#1b1b1f]">{fileName}</p>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-1.5 text-[12px] text-red-500">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
