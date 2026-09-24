"use client";

import { useRef, useState, type ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";

interface DropBayProps {
  label: string;
  accept: string;
  icon: ReactNode;
  prompt: ReactNode;
  hint: string;
  /** Returns an error message, or null when the file is acceptable. */
  validate: (file: File) => string | null;
  onAccept: (file: File) => void;
}

/** Recessed drop bay: click, Enter/Space, or drag a single file in. */
export function DropBay({ label, accept, icon, prompt, hint, validate, onAccept }: DropBayProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const take = (file: File | undefined) => {
    if (!file) return;
    const problem = validate(file);
    setError(problem);
    if (!problem) onAccept(file);
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={0}
        aria-label={label}
        aria-describedby={error ? `${inputId(label)}-error` : undefined}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          take(e.dataTransfer.files[0]);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        className={`converter-well converter-bay ${isDragging ? "is-dragging" : ""}`}
      >
        <span className="converter-bay__icon">{icon}</span>
        <p className="converter-bay__prompt">{prompt}</p>
        <p className="converter-bay__hint">{hint}</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />
      {error && (
        <p id={`${inputId(label)}-error`} role="alert" className="converter-inline-error">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

function inputId(label: string): string {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

interface SelectedItemProps {
  name: string;
  detail: string;
  thumb: ReactNode;
  removeLabel: string;
  onRemove: () => void;
}

/** The loaded item, like a cartridge seated in the bay. */
export function SelectedItem({ name, detail, thumb, removeLabel, onRemove }: SelectedItemProps) {
  return (
    <div className="converter-slot">
      <span className="converter-slot__thumb">{thumb}</span>
      <span className="min-w-0 flex-1">
        <span className="converter-slot__name">{name}</span>
        <span className="converter-slot__detail">{detail}</span>
      </span>
      <button type="button" onClick={onRemove} aria-label={removeLabel} title={removeLabel} className="converter-icon-key">
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </div>
  );
}
