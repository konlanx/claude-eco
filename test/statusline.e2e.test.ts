import { test } from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import assert from "node:assert/strict";

const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*m/g;

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

const stripAnsi = (text: string): string => text.replace(ANSI_ESCAPE_PATTERN, "");

const newIsolatedHome = (): string =>
  mkdtempSync(join(tmpdir(), "claude-eco-e2e-home-"));

const invokeCli = (payloadJson: string): CliInvocationResult => {
  const spawnResult = spawnSync("node", [cliExecutablePath], {
    input: payloadJson,
    encoding: "utf8",
    env: { ...process.env, HOME: newIsolatedHome() },
  });
  return {
    stdout: spawnResult.stdout,
    stderr: spawnResult.stderr,
    exitStatus: spawnResult.status,
  };
};

test("renders all three environmental metrics with units for a real sonnet payload", () => {
  const result = invokeCli(loadFixture("sonnet"));
  assert.strictEqual(result.exitStatus, 0);
  assert.strictEqual(result.stderr, "");
  const stripped = stripAnsi(result.stdout);
  assert.match(stripped, /^Session {2}⚡/);
  assert.match(stripped, /⚡ \d+\.\d{2} (Wh|kWh)/);
  assert.match(stripped, /💧 \d+\.\d{2} (ml|L)/);
  assert.match(stripped, /💨 \d+\.\d{2} (g|kg|t) CO₂/);
  assert.match(stripped, /Sonnet 4\.6/);
});

test("emits ANSI color codes (statusline is colorized, not bare text)", () => {
  const result = invokeCli(loadFixture("sonnet"));
  assert.match(result.stdout, ANSI_ESCAPE_PATTERN);
});

test("handles a zero-token freshly-started session without crashing", () => {
  const result = invokeCli(loadFixture("empty-session"));
  assert.strictEqual(result.exitStatus, 0);
  const stripped = stripAnsi(result.stdout);
  assert.match(stripped, /⚡ 0\.00 Wh/);
  assert.match(stripped, /💧 0\.00 ml/);
  assert.match(stripped, /💨 0\.00 g CO₂/);
});

test("computes cumulative metrics from the transcript, not the payload snapshot", () => {
  const payload = {
    ...JSON.parse(loadFixture("opus")),
    transcript_path: resolve("test/fixtures/transcripts/usage-three-responses.jsonl"),
  };
  const result = invokeCli(JSON.stringify(payload));
  assert.strictEqual(result.exitStatus, 0);
  const stripped = stripAnsi(result.stdout);
  assert.match(stripped, /Opus 4\.7/);
  assert.match(stripped, /⚡ 3\.46 Wh/);
  assert.match(stripped, /💧 22\.28 ml/);
  assert.match(stripped, /💨 1\.54 g CO₂/);
  assert.match(stripped, /2 msgs/);
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
