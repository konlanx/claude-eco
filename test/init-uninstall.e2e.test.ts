import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const cliExecutablePath = resolve("dist/index.js");

const newIsolatedHome = (): string => {
  const home = mkdtempSync(join(tmpdir(), "claude-eco-init-home-"));
  mkdirSync(join(home, ".claude"), { recursive: true });
  return home;
};

const settingsPathFor = (home: string): string =>
  join(home, ".claude", "settings.json");

const runCli = (
  args: ReadonlyArray<string>,
  homeDir: string,
): { readonly status: number | null; readonly stdout: string; readonly stderr: string } => {
  const result = spawnSync("node", [cliExecutablePath, ...args], {
    encoding: "utf8",
    env: { ...process.env, HOME: homeDir },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
};

test("init writes the claude-eco statusLine into a fresh settings.json", () => {
  const home = newIsolatedHome();
  const result = runCli(["init"], home);
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /claude-eco wired up in/);
  const settings = JSON.parse(readFileSync(settingsPathFor(home), "utf8"));
  assert.deepStrictEqual(settings.statusLine, {
    type: "command",
    command: "claude-eco",
    refreshInterval: 10,
  });
});

test("init preserves other top-level settings keys", () => {
  const home = newIsolatedHome();
  writeFileSync(
    settingsPathFor(home),
    JSON.stringify({ theme: "dark", model: "claude-sonnet-4-6" }),
    "utf8",
  );
  const result = runCli(["init"], home);
  assert.strictEqual(result.status, 0);
  const settings = JSON.parse(readFileSync(settingsPathFor(home), "utf8"));
  assert.strictEqual(settings.theme, "dark");
  assert.strictEqual(settings.model, "claude-sonnet-4-6");
  assert.strictEqual(settings.statusLine.command, "claude-eco");
});

test("init warns and overwrites when a different statusLine command is present", () => {
  const home = newIsolatedHome();
  writeFileSync(
    settingsPathFor(home),
    JSON.stringify({
      statusLine: { type: "command", command: "/usr/local/bin/my-bar" },
    }),
    "utf8",
  );
  const result = runCli(["init"], home);
  assert.strictEqual(result.status, 0);
  assert.match(result.stderr, /replacing existing statusLine.*my-bar/);
  const settings = JSON.parse(readFileSync(settingsPathFor(home), "utf8"));
  assert.strictEqual(settings.statusLine.command, "claude-eco");
});

test("init is idempotent — running it twice reports 'already wired up'", () => {
  const home = newIsolatedHome();
  runCli(["init"], home);
  const secondRun = runCli(["init"], home);
  assert.strictEqual(secondRun.status, 0);
  assert.match(secondRun.stdout, /already wired up/);
});

test("uninstall removes the claude-eco statusLine block but keeps other settings", () => {
  const home = newIsolatedHome();
  runCli(["init"], home);
  const result = runCli(["uninstall"], home);
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /statusLine block removed/);
  const settings = JSON.parse(readFileSync(settingsPathFor(home), "utf8"));
  assert.strictEqual(settings.statusLine, undefined);
});

test("uninstall reports 'not installed' when no statusLine is configured", () => {
  const home = newIsolatedHome();
  writeFileSync(settingsPathFor(home), JSON.stringify({ theme: "dark" }), "utf8");
  const result = runCli(["uninstall"], home);
  assert.strictEqual(result.status, 0);
  assert.match(result.stdout, /not installed/);
});

test("uninstall refuses to touch a foreign statusLine and exits non-zero", () => {
  const home = newIsolatedHome();
  writeFileSync(
    settingsPathFor(home),
    JSON.stringify({
      statusLine: { type: "command", command: "/usr/local/bin/my-bar" },
    }),
    "utf8",
  );
  const result = runCli(["uninstall"], home);
  assert.strictEqual(result.status, 1);
  assert.match(result.stderr, /different command.*my-bar/);
  const settings = JSON.parse(readFileSync(settingsPathFor(home), "utf8"));
  assert.strictEqual(settings.statusLine.command, "/usr/local/bin/my-bar");
});
