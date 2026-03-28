"use client";

import { useState, useCallback, useRef } from "react";
import { Upload, FileText } from "lucide-react";

interface FileUploadProps {
  onSubmit: (file: File, fileName: string) => void;
}

const ACCEPTED_EXTENSIONS = ".txt,.md,.json,.csv,.xml,.html";

export function FileUpload({ onSubmit }: FileUploadProps) {
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readFile = useCallback(
    (file: File) => {
      setFileName(file.name);
      setFileSize(file.size);
      onSubmit(file, file.name);
    },
    [onSubmit],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    [readFile],
  );

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload a file"
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
        <Upload className={`h-6 w-6 ${isDragging ? "text-[#6965db]" : "text-[#bbb]"}`} />
        <div>
          <p className="text-[12px] text-[#5b5b5b]">
            Drop a file here or <span className="text-[#6965db]">browse</span>
          </p>
          <p className="mt-0.5 text-[11px] text-[#aaa]">
            .txt, .md, .json, .csv, .xml, .html
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f); }}
        className="hidden"
      />

      {fileName && fileSize !== null && (
        <div className="flex items-center gap-2.5 rounded-lg border border-[#e2e2e2] bg-white px-3 py-2.5">
          <FileText className="h-4 w-4 flex-shrink-0 text-[#6965db]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-medium text-[#1b1b1f]">{fileName}</p>
            <p className="text-[11px] text-[#aaa]">{formatSize(fileSize)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
