/**
 * Client-side helpers for the conversion flow: turning a failed request into
 * a message the user can act on, validating uploads before they are sent,
 * and summarising a scene for the status window.
 */

export type FailureKind = "engine" | "network" | "timeout" | "cancelled" | "input" | "server";

export interface ConvertFailure {
  readonly kind: FailureKind;
  readonly message: string;
}

/** Messages the API returns when it hides the real cause behind a generic error. */
const GENERIC_SERVER_MESSAGES = new Set(["internal server error", ""]);

export const ENGINE_UNAVAILABLE_MESSAGE =
  "The conversion engine isn't reachable from this server. Conversion runs through Claude Code on the machine hosting the app, so run it locally, or load the sample diagram to try the editor.";

/**
 * Describe a non-OK HTTP response from /api/convert.
 * Specific server messages are shown as-is; a generic 5xx means the Claude
 * engine could not run (the hosted demo has no Claude Code session).
 */
export function describeHttpFailure(status: number, serverMessage: string | null | undefined): ConvertFailure {
  const message = (serverMessage ?? "").trim();
  const isGeneric = GENERIC_SERVER_MESSAGES.has(message.toLowerCase());

  if (status >= 500 && isGeneric) {
    return { kind: "engine", message: ENGINE_UNAVAILABLE_MESSAGE };
  }
  if (status >= 400 && status < 500) {
    return { kind: "input", message: message || `The server rejected this input (${status}).` };
  }
  return { kind: "server", message: message || `Conversion failed (${status}).` };
}

/** Describe an exception thrown while calling fetch. */
export function describeThrownFailure(error: unknown, cancelledByUser: boolean): ConvertFailure {
  if (error instanceof DOMException && error.name === "AbortError") {
    return cancelledByUser
      ? { kind: "cancelled", message: "Conversion cancelled." }
      : { kind: "timeout", message: "Conversion timed out. Try simpler or shorter input." };
  }
  if (error instanceof TypeError) {
    return { kind: "network", message: "Couldn't reach the server. Check your connection and try again." };
  }
  return {
    kind: "server",
    message: error instanceof Error && error.message ? error.message : "An unexpected error occurred",
  };
}

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const DOCUMENT_EXTENSIONS = [".txt", ".md", ".json", ".csv", ".xml", ".html"] as const;
export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"] as const;

interface UploadLike {
  readonly name: string;
  readonly size: number;
  readonly type: string;
}

/** Returns an error message, or null when the document can be sent. */
export function validateDocument(file: UploadLike): string | null {
  const lower = file.name.toLowerCase();
  if (!DOCUMENT_EXTENSIONS.some((ext) => lower.endsWith(ext))) {
    return `Unsupported format. Use ${DOCUMENT_EXTENSIONS.join(", ")}.`;
  }
  if (file.size === 0) return "This document is empty.";
  if (file.size > MAX_UPLOAD_BYTES) return "Document exceeds the 10MB limit.";
  return null;
}

/** Returns an error message, or null when the picture can be sent. */
export function validatePicture(file: UploadLike): string | null {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return "Unsupported format. Use PNG, JPEG, GIF, or WebP.";
  }
  if (file.size > MAX_UPLOAD_BYTES) return "Image exceeds 10MB limit.";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** mm:ss for the status window clock. */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

interface SceneElementLike {
  readonly type?: unknown;
  readonly isDeleted?: unknown;
}

/** Visible (non-deleted) elements only. */
export function liveElements<T extends SceneElementLike>(elements: readonly T[]): T[] {
  return elements.filter((el) => el.isDeleted !== true);
}

export function countScene(elements: readonly SceneElementLike[]): { shapes: number; arrows: number } {
  let shapes = 0;
  let arrows = 0;
  for (const el of liveElements(elements)) {
    if (el.type === "rectangle" || el.type === "ellipse" || el.type === "diamond") shapes += 1;
    else if (el.type === "arrow") arrows += 1;
  }
  return { shapes, arrows };
}
