import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { countUserTurns, sumSessionUsage } from "../src/transcript";

const fixturePath = (fixtureName: string): string =>
  resolve("test/fixtures/transcripts", fixtureName);

test("returns 0 when transcript path is undefined", () => {
  assert.strictEqual(countUserTurns(undefined), 0);
});

test("returns 0 when transcript file does not exist", () => {
  assert.strictEqual(
    countUserTurns(fixturePath("definitely-not-a-real-file.jsonl")),
    0,
  );
});

test("returns 0 when transcript has no user entries", () => {
  assert.strictEqual(countUserTurns(fixturePath("no-turns.jsonl")), 0);
});

test("counts distinct promptIds — tool-result follow-ups in the same turn don't double-count", () => {
  assert.strictEqual(countUserTurns(fixturePath("seven-turns.jsonl")), 7);
});

const EMPTY_USAGE = {
  freshInputTokens: 0,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
  outputTokens: 0,
};

test("sumSessionUsage returns zero usage when path is undefined or missing", () => {
  assert.deepStrictEqual(sumSessionUsage(undefined), EMPTY_USAGE);
  assert.deepStrictEqual(
    sumSessionUsage(fixturePath("definitely-not-a-real-file.jsonl")),
    EMPTY_USAGE,
  );
});

test("sumSessionUsage returns zero usage when transcript has no assistant message entries", () => {
  assert.deepStrictEqual(sumSessionUsage(fixturePath("no-turns.jsonl")), EMPTY_USAGE);
});

test("sumSessionUsage keeps fresh / cache-write / cache-read / output separate, deduped by message.id", () => {
  const usage = sumSessionUsage(fixturePath("usage-three-responses.jsonl"));
  assert.strictEqual(usage.freshInputTokens, 350);
  assert.strictEqual(usage.cacheWriteTokens, 150);
  assert.strictEqual(usage.cacheReadTokens, 370);
  assert.strictEqual(usage.outputTokens, 240);
});
