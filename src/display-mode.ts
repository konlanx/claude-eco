export type DisplayMode = "current-session" | "all-time-total";

export const IDLE_THRESHOLD_MS = 30_000;

export const determineDisplayMode = (
  lastActivityMs: number | undefined,
  nowMs: number,
): DisplayMode => {
  if (lastActivityMs === undefined) return "current-session";
  const idleDurationMs = nowMs - lastActivityMs;
  return idleDurationMs >= IDLE_THRESHOLD_MS
    ? "all-time-total"
    : "current-session";
};
