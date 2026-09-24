"use client";

import { useCallback, useEffect, useState } from "react";
import { ImageIcon } from "lucide-react";
import { formatBytes, IMAGE_TYPES, validatePicture } from "@/lib/convert-client";
import { DropBay, SelectedItem } from "./DropBay";

interface ImageUploadProps {
  selected: File | null;
  onSelect: (file: File) => void;
  onClear: () => void;
}

export function ImageUpload({ selected, onSelect, onClear }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const validate = useCallback((file: File) => validatePicture(file), []);

  useEffect(() => {
    if (!selected) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(selected);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [selected]);

  return (
    <div className="flex flex-col gap-2">
      <DropBay
        label="Upload an image"
        accept={IMAGE_TYPES.join(",")}
        icon={<ImageIcon className="h-5 w-5" aria-hidden />}
        prompt={<>Drop an image here or <span className="converter-link">browse</span></>}
        hint="PNG, JPEG, GIF, WebP — max 10MB"
        validate={validate}
        onAccept={onSelect}
      />
      {selected && (
        <SelectedItem
          name={selected.name}
          detail={formatBytes(selected.size)}
          thumb={
            preview ? (
              // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
              <img src={preview} alt={`Preview of ${selected.name}`} className="h-full w-full object-cover" />
            ) : (
              <ImageIcon className="h-4 w-4" aria-hidden />
            )
          }
          removeLabel={`Remove ${selected.name}`}
          onRemove={onClear}
        />
      )}
    </div>
  );
}
