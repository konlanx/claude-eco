import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  mergeStatuslineConfig,
  persistSettings,
  readCurrentSettings,
  settingsWithoutStatusline,
  type StatuslineConfig,
} from "../src/config";

const newTempSettingsFilePath = (): string =>
  join(mkdtempSync(join(tmpdir(), "claude-eco-config-")), "settings.json");

const sampleStatuslineConfig: StatuslineConfig = {
  type: "command",
  command: "claude-eco",
  refreshInterval: 10,
};

test("readCurrentSettings returns {} when the settings file does not exist", () => {
  const settingsPath = newTempSettingsFilePath();
  assert.deepStrictEqual(readCurrentSettings(settingsPath), {});
});

test("readCurrentSettings returns {} when the settings file is unparseable", () => {
  const settingsPath = newTempSettingsFilePath();
  writeFileSync(settingsPath, "{ not valid json", "utf8");
  assert.deepStrictEqual(readCurrentSettings(settingsPath), {});
});

test("mergeStatuslineConfig adds a statusLine block without touching other keys", () => {
  const settingsPath = newTempSettingsFilePath();
  writeFileSync(
    settingsPath,
    JSON.stringify({ theme: "dark", model: "claude-sonnet-4-6" }),
    "utf8",
  );
  const merged = mergeStatuslineConfig(sampleStatuslineConfig, settingsPath);
  assert.strictEqual(merged.theme, "dark");
  assert.strictEqual(merged.model, "claude-sonnet-4-6");
  assert.deepStrictEqual(merged.statusLine, sampleStatuslineConfig);
});

test("mergeStatuslineConfig replaces an existing statusLine block", () => {
  const settingsPath = newTempSettingsFilePath();
  writeFileSync(
    settingsPath,
    JSON.stringify({ statusLine: { type: "command", command: "/other/script" } }),
    "utf8",
  );
  const merged = mergeStatuslineConfig(sampleStatuslineConfig, settingsPath);
  assert.deepStrictEqual(merged.statusLine, sampleStatuslineConfig);
});

test("settingsWithoutStatusline removes only the statusLine key", () => {
  const settingsPath = newTempSettingsFilePath();
  writeFileSync(
    settingsPath,
    JSON.stringify({
      theme: "dark",
      statusLine: { type: "command", command: "claude-eco" },
    }),
    "utf8",
  );
  const trimmed = settingsWithoutStatusline(settingsPath);
  assert.strictEqual(trimmed.theme, "dark");
  assert.strictEqual(trimmed.statusLine, undefined);
});

test("persistSettings creates the parent directory if missing and writes a trailing newline", () => {
  const settingsPath = join(
    mkdtempSync(join(tmpdir(), "claude-eco-config-")),
    "nested",
    "dir",
    "settings.json",
  );
  persistSettings({ theme: "light" }, settingsPath);
  const written = readFileSync(settingsPath, "utf8");
  assert.match(written, /\n$/);
  assert.strictEqual(JSON.parse(written).theme, "light");
});
