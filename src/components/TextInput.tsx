"use client";

import { useState, useCallback, useEffect } from "react";

interface TextInputProps {
  onSubmit: (text: string) => void;
  initialValue?: string;
}

export function TextInput({ onSubmit, initialValue = "" }: TextInputProps) {
  const [text, setText] = useState(initialValue);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value);
    },
    [],
  );

  useEffect(() => {
    onSubmit(text);
  }, [text, onSubmit]);

  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={text}
        onChange={handleChange}
        placeholder="Paste any text — meeting notes, code, documentation, lists..."
        className="h-52 w-full resize-none rounded-lg border border-[#e2e2e2] bg-white px-3 py-2.5 text-[13px] text-[#1b1b1f] placeholder-[#aaa] transition-all focus:border-[#6965db] focus:outline-none focus:ring-1 focus:ring-[#6965db]/30"
      />
      <div className="text-right text-[11px] text-[#aaa]">
        {text.length.toLocaleString()} characters
      </div>
    </div>
  );
}
