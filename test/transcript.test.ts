import { test } from "node:test";
import assert from "node:assert/strict";
import { resolve } from "node:path";
import { countUserTurns } from "../src/transcript";

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
