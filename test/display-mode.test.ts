import { test } from "node:test";
import assert from "node:assert/strict";
import {
  determineDisplayMode,
  IDLE_THRESHOLD_MS,
  IDLE_CYCLE_PERIOD_MS,
} from "../src/display-mode";

test("returns current-session when activity timestamp is unknown (fresh session)", () => {
  assert.strictEqual(
    determineDisplayMode(undefined, Date.now()),
    "current-session",
  );
});

test("returns current-session immediately after activity", () => {
  const now = 1_000_000_000;
  assert.strictEqual(determineDisplayMode(now, now), "current-session");
});

test("returns current-session just before the idle threshold", () => {
  const now = 1_000_000_000;
  const justBeforeThreshold = now - (IDLE_THRESHOLD_MS - 1);
  assert.strictEqual(
    determineDisplayMode(justBeforeThreshold, now),
    "current-session",
  );
});

test("first slot after the idle threshold shows all-time-total", () => {
  const lastActivity = 0;
  assert.strictEqual(
    determineDisplayMode(lastActivity, IDLE_THRESHOLD_MS),
    "all-time-total",
  );
});

test("second idle slot (30s later) switches to project-total", () => {
  const lastActivity = 0;
  assert.strictEqual(
    determineDisplayMode(lastActivity, IDLE_THRESHOLD_MS + IDLE_CYCLE_PERIOD_MS),
    "project-total",
  );
});

test("third idle slot returns to all-time-total — slots alternate", () => {
  const lastActivity = 0;
  const nowInThirdSlot = IDLE_THRESHOLD_MS + IDLE_CYCLE_PERIOD_MS * 2;
  assert.strictEqual(
    determineDisplayMode(lastActivity, nowInThirdSlot),
    "all-time-total",
  );
});

test("fourth idle slot returns to project-total", () => {
  const lastActivity = 0;
  const nowInFourthSlot = IDLE_THRESHOLD_MS + IDLE_CYCLE_PERIOD_MS * 3;
  assert.strictEqual(
    determineDisplayMode(lastActivity, nowInFourthSlot),
    "project-total",
  );
});

test("returns current-session when activity timestamp is in the future (clock skew)", () => {
  const now = 1_000_000_000;
  const futureActivity = now + 5000;
  assert.strictEqual(
    determineDisplayMode(futureActivity, now),
    "current-session",
  );
});
