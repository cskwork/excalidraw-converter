"use client";

import { forwardRef } from "react";

interface TextInputProps {
  value: string;
  onChange: (text: string) => void;
  maxLength: number;
}

export const TextInput = forwardRef<HTMLTextAreaElement, TextInputProps>(function TextInput(
  { value, onChange, maxLength },
  ref,
) {
  const over = value.length > maxLength;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="converter-text" className="converter-legend">
        Describe the diagram
      </label>
      <textarea
        id="converter-text"
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Paste any text — meeting notes, code, documentation, lists..."
        className="converter-well converter-textarea"
        spellCheck
        aria-describedby="converter-text-count"
      />
      <div id="converter-text-count" className={`converter-meter ${over ? "is-over" : ""}`}>
        {value.length.toLocaleString()} characters
        {over && <span> · only the first {maxLength.toLocaleString()} are used</span>}
      </div>
    </div>
  );
});
