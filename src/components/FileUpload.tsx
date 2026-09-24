"use client";

import { useCallback } from "react";
import { FileText, Upload } from "lucide-react";
import { DOCUMENT_EXTENSIONS, formatBytes, validateDocument } from "@/lib/convert-client";
import { DropBay, SelectedItem } from "./DropBay";

interface FileUploadProps {
  selected: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}

export function FileUpload({ selected, onSelect, onClear }: FileUploadProps) {
  const validate = useCallback((file: File) => validateDocument(file), []);

  return (
    <div className="flex flex-col gap-2">
      <DropBay
        label="Upload a file"
        accept={DOCUMENT_EXTENSIONS.join(",")}
        icon={<Upload className="h-5 w-5" aria-hidden />}
        prompt={<>Drop a file here or <span className="converter-link">browse</span></>}
        hint={DOCUMENT_EXTENSIONS.join(", ")}
        validate={validate}
        onAccept={onSelect}
      />
      {selected && (
        <SelectedItem
          name={selected.name}
          detail={formatBytes(selected.size)}
          thumb={<FileText className="h-4 w-4" aria-hidden />}
          removeLabel={`Remove ${selected.name}`}
          onRemove={onClear}
        />
      )}
    </div>
  );
}
