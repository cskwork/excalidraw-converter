"use client";

import { formatClock } from "@/lib/convert-client";

export type Phase = "idle" | "ready" | "working" | "plotted" | "fault";

const PHASE_WORD: Record<Phase, string> = {
  idle: "IDLE",
  ready: "READY",
  working: "WORKING",
  plotted: "PLOTTED",
  fault: "FAULT",
};

interface StatusWindowProps {
  phase: Phase;
  seconds: number | null;
  detail: string;
}

/**
 * Amber status window. The state is always named in words (never color alone),
 * and the clock keeps its unlit 88:88 cells visible when idle.
 */
export function StatusWindow({ phase, seconds, detail }: StatusWindowProps) {
  const clock = seconds === null ? null : formatClock(seconds);
  return (
    <div className="converter-lcd" data-phase={phase}>
      <div className="converter-lcd__glass">
        <div className="converter-lcd__row">
          <span className="converter-lcd__phase" aria-hidden>
            {PHASE_WORD[phase]}
          </span>
          <span className="converter-lcd__clock" aria-hidden>
            <span className="converter-lcd__ghost">88:88</span>
            <span className="converter-lcd__digits" style={{ opacity: clock ? 1 : 0 }}>
              {clock ?? "00:00"}
            </span>
          </span>
        </div>
        <p className="converter-lcd__detail" data-testid="status-detail">
          {detail}
        </p>
        <p className="sr-only" role="status" aria-live="polite">
          {`Status: ${PHASE_WORD[phase].toLowerCase()}.`}
        </p>
      </div>
    </div>
  );
}
