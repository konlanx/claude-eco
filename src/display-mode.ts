export type DisplayMode = "current-session" | "project-total" | "all-time-total";

export const IDLE_THRESHOLD_MS = 30_000;
export const IDLE_CYCLE_PERIOD_MS = 30_000;

const idleDurationMs = (lastActivityMs: number, nowMs: number): number =>
  nowMs - lastActivityMs;

const idleSlotIndex = (idleMs: number): number =>
  Math.floor((idleMs - IDLE_THRESHOLD_MS) / IDLE_CYCLE_PERIOD_MS);

const modeForIdleSlot = (idleMs: number): DisplayMode =>
  idleSlotIndex(idleMs) % 2 === 0 ? "all-time-total" : "project-total";

export const determineDisplayMode = (
  lastActivityMs: number | undefined,
  nowMs: number,
): DisplayMode => {
  if (lastActivityMs === undefined) return "current-session";
  const idleMs = idleDurationMs(lastActivityMs, nowMs);
  if (idleMs < IDLE_THRESHOLD_MS) return "current-session";
  return modeForIdleSlot(idleMs);
};
