import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type StatuslineConfig = {
  readonly type: "command";
  readonly command: string;
  readonly refreshInterval: number;
};

export type ClaudeCodeSettings = {
  readonly statusLine?: { readonly command?: string; readonly [key: string]: unknown };
  readonly [key: string]: unknown;
};

export const DEFAULT_SETTINGS_PATH = join(homedir(), ".claude", "settings.json");

const ensureParentDirectoryExists = (filePath: string): void => {
  mkdirSync(dirname(filePath), { recursive: true });
};

const parseSettings = (raw: string): ClaudeCodeSettings => {
  try {
    return JSON.parse(raw) as ClaudeCodeSettings;
  } catch {
    return {};
  }
};

export const readCurrentSettings = (
  filePath: string = DEFAULT_SETTINGS_PATH,
): ClaudeCodeSettings => {
  if (!existsSync(filePath)) return {};
  return parseSettings(readFileSync(filePath, "utf8"));
};

const withoutKey = <Key extends string>(
  source: Record<string, unknown>,
  keyToRemove: Key,
): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(source).filter(([key]) => key !== keyToRemove),
  );

export const mergeStatuslineConfig = (
  statuslineConfig: StatuslineConfig,
  filePath: string = DEFAULT_SETTINGS_PATH,
): ClaudeCodeSettings => ({
  ...readCurrentSettings(filePath),
  statusLine: statuslineConfig,
});

export const settingsWithoutStatusline = (
  filePath: string = DEFAULT_SETTINGS_PATH,
): ClaudeCodeSettings =>
  withoutKey(readCurrentSettings(filePath), "statusLine") as ClaudeCodeSettings;

export const persistSettings = (
  settings: ClaudeCodeSettings,
  filePath: string = DEFAULT_SETTINGS_PATH,
): void => {
  ensureParentDirectoryExists(filePath);
  writeFileSync(filePath, `${JSON.stringify(settings, null, 2)}\n`, "utf8");
};
