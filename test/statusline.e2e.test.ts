import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import assert from "node:assert/strict";

type CliInvocationResult = {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitStatus: number | null;
};

const cliExecutablePath: string = resolve("dist/index.js");

const fixturePath = (fixtureName: string): string =>
  resolve("test/fixtures", `${fixtureName}.json`);

const loadFixture = (fixtureName: string): string =>
  readFileSync(fixturePath(fixtureName), "utf8");

const invokeCli = (payloadJson: string): CliInvocationResult => {
  const spawnResult = spawnSync("node", [cliExecutablePath], {
    input: payloadJson,
    encoding: "utf8",
  });
  return {
    stdout: spawnResult.stdout,
    stderr: spawnResult.stderr,
    exitStatus: spawnResult.status,
  };
};

test("formats a sonnet payload with token counts and model id", () => {
  const result = invokeCli(loadFixture("sonnet"));
  assert.strictEqual(result.exitStatus, 0);
  assert.strictEqual(result.stderr, "");
  assert.strictEqual(result.stdout, "↑ 12345 ↓ 678 · claude-sonnet-4-6");
});

test("handles large opus token counts without truncation", () => {
  const result = invokeCli(loadFixture("opus"));
  assert.strictEqual(result.exitStatus, 0);
  assert.strictEqual(result.stderr, "");
  assert.strictEqual(result.stdout, "↑ 250000 ↓ 12000 · claude-opus-4-7");
});

test("renders a freshly-started session with zero tokens", () => {
  const result = invokeCli(loadFixture("empty-session"));
  assert.strictEqual(result.exitStatus, 0);
  assert.strictEqual(result.stderr, "");
  assert.strictEqual(result.stdout, "↑ 0 ↓ 0 · claude-haiku-4-5");
});

test("exits non-zero and reports an error when stdin is not valid json", () => {
  const result = invokeCli("not valid json");
  assert.strictEqual(result.exitStatus, 1);
  assert.match(result.stderr, /claude-eco:/);
});

test("rejects unknown subcommands with a clear stderr message", () => {
  const spawnResult = spawnSync("node", [cliExecutablePath, "definitely-not-a-command"], {
    encoding: "utf8",
  });
  assert.strictEqual(spawnResult.status, 1);
  assert.match(spawnResult.stderr, /unknown command "definitely-not-a-command"/);
});
