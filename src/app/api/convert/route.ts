import { NextRequest, NextResponse } from "next/server";
import { query } from "@anthropic-ai/claude-agent-sdk";
import { writeFile, unlink, mkdtemp } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { buildConversionPrompt } from "@/lib/excalidraw-prompt";
import { validateElements, autoLayout } from "@/lib/element-helpers";
import { assertOAuthAuth } from "@/lib/assert-oauth-auth";
import type { InputType, ExcalidrawElement } from "@/types/excalidraw";

// Next.js route segment config — extend default timeout for LLM calls
export const maxDuration = 150; // seconds

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_TEXT_LENGTH = 100_000; // ~100KB text cap for LLM context

const SUPPORTED_IMAGE_TYPES: ReadonlySet<string> = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]);

const SUPPORTED_TEXT_TYPES: ReadonlySet<string> = new Set([
  "text/plain",
  "text/markdown",
  "text/csv",
  "text/html",
  "application/json",
  "application/xml",
]);

function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function extractJsonArray(raw: string): string {
  const fenceMatch = raw.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (fenceMatch) return fenceMatch[1];

  const bracketMatch = raw.match(/\[[\s\S]*\]/);
  if (bracketMatch) return bracketMatch[0];

  return raw;
}

async function buildPrompt(
  inputType: InputType,
  text: string | null,
  file: File | null,
): Promise<{ prompt: string; tempFile?: string; allowRead: boolean }> {
  const systemPrompt = buildConversionPrompt(inputType);

  if (inputType === "image" && file) {
    // Save image to temp file so Claude Agent can Read it (multimodal)
    const tempDir = await mkdtemp(join(tmpdir(), "excalidraw-"));
    const ext = file.name.split(".").pop() || "png";
    const tempPath = join(tempDir, `upload.${ext}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(tempPath, buffer);

    return {
      prompt: `${systemPrompt}\n\nRead the image file at "${tempPath}" and analyze it. Then convert what you see into an Excalidraw diagram. Return ONLY the JSON array of ExcalidrawElement objects.`,
      tempFile: tempPath,
      allowRead: true,
    };
  }

  if (inputType === "text" && text) {
    const truncated =
      text.length > MAX_TEXT_LENGTH
        ? text.slice(0, MAX_TEXT_LENGTH) + "\n\n[...truncated]"
        : text;
    return {
      prompt: `${systemPrompt}\n\nConvert the following text into an Excalidraw diagram. Return ONLY the JSON array of elements.\n\n---\n${truncated}\n---`,
      allowRead: false,
    };
  }

  if (inputType === "file" && file) {
    const rawText = await file.text();
    const fileText =
      rawText.length > MAX_TEXT_LENGTH
        ? rawText.slice(0, MAX_TEXT_LENGTH) + "\n\n[...truncated]"
        : rawText;
    return {
      prompt: `${systemPrompt}\n\nConvert the following file content (${file.name}) into an Excalidraw diagram. Return ONLY the JSON array of elements.\n\n---\n${fileText}\n---`,
      allowRead: false,
    };
  }

  throw new Error("No valid input provided");
}

const QUERY_TIMEOUT_MS = 120_000; // 2 minute hard timeout

export async function POST(request: NextRequest): Promise<NextResponse> {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data", 400);
  }

  const inputType = formData.get("type") as InputType | null;
  if (!inputType || !["text", "image", "file"].includes(inputType)) {
    return errorResponse(
      'Missing or invalid "type" field. Must be "text", "image", or "file".',
      400,
    );
  }

  const text = formData.get("text") as string | null;
  const file = formData.get("file") as File | null;

  if (inputType === "text" && (!text || text.trim().length === 0)) {
    return errorResponse("Text input is required when type is 'text'", 400);
  }

  if ((inputType === "image" || inputType === "file") && !file) {
    return errorResponse(
      `File upload is required when type is '${inputType}'`,
      400,
    );
  }

  if (file && file.size > MAX_FILE_SIZE) {
    return errorResponse(
      `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
      413,
    );
  }

  if (file && inputType === "image" && !SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return errorResponse(
      `Unsupported image type: ${file.type}. Supported: png, jpeg, gif, webp`,
      415,
    );
  }

  if (
    file &&
    inputType === "file" &&
    !SUPPORTED_TEXT_TYPES.has(file.type) &&
    !file.name.endsWith(".md") &&
    !file.name.endsWith(".txt") &&
    !file.name.endsWith(".csv") &&
    !file.name.endsWith(".json")
  ) {
    return errorResponse(
      `Unsupported file type: ${file.type}. Supported: text, markdown, csv, json, html, xml`,
      415,
    );
  }

  let tempFile: string | undefined;

  try {
    // Ensure OAuth auth — fail fast if ANTHROPIC_API_KEY is set
    assertOAuthAuth();

    const built = await buildPrompt(inputType, text, file);
    tempFile = built.tempFile;

    // Use Claude Agent SDK — authenticates via Claude Code CLI's OAuth token
    const allowedTools: string[] = built.allowRead ? ["Read"] : [];

    let resultText = "";

    const response = query({
      prompt: built.prompt,
      options: {
        maxTurns: 1,
        allowedTools,
        permissionMode: "dontAsk",
        persistSession: false,
        model: "sonnet",
        effort: "low",
        maxBudgetUsd: 0.25,
      },
    });

    // Race against timeout to prevent hanging forever
    const result = await Promise.race([
      (async () => {
        for await (const msg of response) {
          if (msg.type === "result") {
            if (msg.subtype === "success") {
              return { ok: true as const, text: msg.result };
            }
            return { ok: false as const, error: `Claude Agent error: ${msg.subtype}` };
          }
        }
        return { ok: false as const, error: "Claude returned no result message" };
      })(),
      new Promise<{ ok: false; error: string }>((resolve) =>
        setTimeout(
          () => resolve({ ok: false, error: "Conversion timed out after 2 minutes. Please try with simpler input." }),
          QUERY_TIMEOUT_MS,
        ),
      ),
    ]);

    if (!result.ok) {
      return errorResponse(result.error, 502);
    }

    resultText = result.text;

    if (!resultText) {
      return errorResponse("Claude returned an empty response", 502);
    }

    // Parse the JSON array from Claude's response
    const jsonString = extractJsonArray(resultText);
    let rawElements: unknown[];
    try {
      rawElements = JSON.parse(jsonString);
    } catch {
      return errorResponse(
        "Failed to parse diagram elements from response",
        502,
      );
    }

    if (!Array.isArray(rawElements) || rawElements.length === 0) {
      return errorResponse("Claude returned no diagram elements", 502);
    }

    const validated = validateElements(rawElements);
    if (validated.length === 0) {
      return errorResponse(
        "No valid Excalidraw elements could be extracted",
        502,
      );
    }

    const elements: readonly ExcalidrawElement[] = autoLayout(validated);

    const shapeCount = elements.filter(
      (el) =>
        el.type === "rectangle" ||
        el.type === "ellipse" ||
        el.type === "diamond",
    ).length;
    const arrowCount = elements.filter((el) => el.type === "arrow").length;
    const summary = `Generated diagram with ${shapeCount} shapes and ${arrowCount} connections (${elements.length} total elements)`;

    return NextResponse.json({ elements, summary });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return errorResponse(message, 500);
  } finally {
    // Clean up temp file
    if (tempFile) {
      unlink(tempFile).catch(() => {});
    }
  }
}
