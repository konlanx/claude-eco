import { test } from "node:test";
import assert from "node:assert/strict";
import {
  determineDisplayMode,
  IDLE_THRESHOLD_MS,
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

test("returns all-time-total exactly at the idle threshold (30s)", () => {
  const now = 1_000_000_000;
  const atThreshold = now - IDLE_THRESHOLD_MS;
  assert.strictEqual(
    determineDisplayMode(atThreshold, now),
    "all-time-total",
  );
});

test("returns all-time-total after a long idle gap", () => {
  const now = 1_000_000_000;
  const longAgo = now - 60 * 60 * 1000;
  assert.strictEqual(
    determineDisplayMode(longAgo, now),
    "all-time-total",
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
