/**
 * 구조화된 JSON 로거
 * Vercel log drain 호환 포맷. 프로덕션에서 pino로 교체 가능.
 */

type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  event: string;
  timestamp: string;
  [key: string]: unknown;
}

function formatEntry(level: LogLevel, event: string, data?: Record<string, unknown>): LogEntry {
  return {
    level,
    event,
    timestamp: new Date().toISOString(),
    ...data,
  };
}

function serializeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      stack: error.stack?.split("\n").slice(0, 5).join("\n"),
    };
  }
  return { errorMessage: String(error) };
}

function log(level: LogLevel, event: string, data?: Record<string, unknown>): void {
  const entry = formatEntry(level, event, data);

  // error 필드가 있으면 직렬화
  if (entry.error !== undefined) {
    const serialized = serializeError(entry.error);
    delete entry.error;
    Object.assign(entry, serialized);
  }

  const line = JSON.stringify(entry);

  switch (level) {
    case "error":
      console.error(line);
      break;
    case "warn":
      console.warn(line);
      break;
    default:
      console.log(line);
  }
}

export const logger = {
  info: (event: string, data?: Record<string, unknown>) => log("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => log("error", event, data),
} as const;
