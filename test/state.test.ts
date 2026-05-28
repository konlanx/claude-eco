import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  readAllSessions,
  readSessionState,
  writeSessionState,
  type SessionState,
} from "../src/state";

const newTempStateFilePath = (): string =>
  join(mkdtempSync(join(tmpdir(), "claude-eco-state-")), "state.json");

const sampleState = (overrides: Partial<SessionState> = {}): SessionState => ({
  cumulativeFreshInputTokens: 100,
  cumulativeCacheWriteTokens: 50,
  cumulativeCacheReadTokens: 850,
  cumulativeOutputTokens: 200,
  modelId: "claude-sonnet-4-6",
  lastUpdatedAt: "2026-05-28T10:00:00.000Z",
  ...overrides,
});

test("returns undefined when state file does not exist", () => {
  const stateFilePath = newTempStateFilePath();
  assert.strictEqual(readSessionState("any-session", stateFilePath), undefined);
});

test("returns undefined when state file is unparseable", () => {
  const stateFilePath = newTempStateFilePath();
  writeFileSync(stateFilePath, "{ not valid json", "utf8");
  assert.strictEqual(readSessionState("any-session", stateFilePath), undefined);
});

test("writes and reads back a single session's state", () => {
  const stateFilePath = newTempStateFilePath();
  const state = sampleState();
  writeSessionState("session-a", state, stateFilePath);
  assert.deepStrictEqual(readSessionState("session-a", stateFilePath), state);
});

test("multiple sessions are stored independently without bleed", () => {
  const stateFilePath = newTempStateFilePath();
  const stateA = sampleState({ cumulativeFreshInputTokens: 100 });
  const stateB = sampleState({ cumulativeFreshInputTokens: 999 });
  writeSessionState("session-a", stateA, stateFilePath);
  writeSessionState("session-b", stateB, stateFilePath);
  assert.deepStrictEqual(readSessionState("session-a", stateFilePath), stateA);
  assert.deepStrictEqual(readSessionState("session-b", stateFilePath), stateB);
});

test("re-writing the same session id overwrites prior state", () => {
  const stateFilePath = newTempStateFilePath();
  writeSessionState(
    "session-x",
    sampleState({ cumulativeFreshInputTokens: 1 }),
    stateFilePath,
  );
  writeSessionState(
    "session-x",
    sampleState({ cumulativeFreshInputTokens: 2 }),
    stateFilePath,
  );
  const final = readSessionState("session-x", stateFilePath);
  assert.strictEqual(final?.cumulativeFreshInputTokens, 2);
});

test("state file uses a versioned envelope (v3 after adding modelId per session)", () => {
  const stateFilePath = newTempStateFilePath();
  writeSessionState("session-v", sampleState(), stateFilePath);
  const parsed = JSON.parse(readFileSync(stateFilePath, "utf8"));
  assert.strictEqual(parsed.version, 3);
  assert.ok("sessions" in parsed);
});

test("old v2 state files are silently discarded — no broken-shape data leaks through", () => {
  const stateFilePath = newTempStateFilePath();
  const oldV2 = {
    version: 2,
    sessions: {
      "old-session": {
        cumulativeFreshInputTokens: 100,
        cumulativeCacheWriteTokens: 50,
        cumulativeCacheReadTokens: 850,
        cumulativeOutputTokens: 200,
        lastUpdatedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  };
  writeFileSync(stateFilePath, JSON.stringify(oldV2), "utf8");
  assert.strictEqual(readSessionState("old-session", stateFilePath), undefined);
});

test("readAllSessions returns every persisted session", () => {
  const stateFilePath = newTempStateFilePath();
  writeSessionState(
    "session-a",
    sampleState({ cumulativeOutputTokens: 100 }),
    stateFilePath,
  );
  writeSessionState(
    "session-b",
    sampleState({ cumulativeOutputTokens: 200 }),
    stateFilePath,
  );
  const allSessions = readAllSessions(stateFilePath);
  assert.strictEqual(allSessions.length, 2);
  const outputs = allSessions.map((session) => session.cumulativeOutputTokens).sort();
  assert.deepStrictEqual(outputs, [100, 200]);
});

test("readAllSessions returns an empty array for a missing state file", () => {
  const stateFilePath = newTempStateFilePath();
  assert.deepStrictEqual(readAllSessions(stateFilePath), []);
});

test("optional cwd is round-tripped through write and read", () => {
  const stateFilePath = newTempStateFilePath();
  const stateWithCwd = sampleState({ cwd: "/home/user/dev/project-a" });
  writeSessionState("session-with-cwd", stateWithCwd, stateFilePath);
  assert.strictEqual(
    readSessionState("session-with-cwd", stateFilePath)?.cwd,
    "/home/user/dev/project-a",
  );
});

test("session state without cwd loads cleanly (backward compatibility)", () => {
  const stateFilePath = newTempStateFilePath();
  const stateWithoutCwd = sampleState();
  writeSessionState("legacy-session", stateWithoutCwd, stateFilePath);
  assert.strictEqual(
    readSessionState("legacy-session", stateFilePath)?.cwd,
    undefined,
  );
});
