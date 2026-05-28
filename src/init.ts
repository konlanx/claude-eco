import {
  DEFAULT_SETTINGS_PATH,
  mergeStatuslineConfig,
  persistSettings,
  readCurrentSettings,
  type StatuslineConfig,
} from "./config";

const CLAUDE_ECO_STATUSLINE: StatuslineConfig = {
  type: "command",
  command: "claude-eco",
  refreshInterval: 10,
};

const indented = (text: string, indent: string): string =>
  text
    .split("\n")
    .map((line) => `${indent}${line}`)
    .join("\n");

const printAlreadyInstalled = (settingsPath: string): void => {
  process.stdout.write(
    `claude-eco is already wired up in ${settingsPath} — no changes needed.\n`,
  );
};

const printOverwriteWarning = (previousCommand: string): void => {
  process.stderr.write(
    `claude-eco init: replacing existing statusLine (was: ${previousCommand}).\n`,
  );
};

const printInstalled = (settingsPath: string): void => {
  const preview = JSON.stringify(CLAUDE_ECO_STATUSLINE, null, 2);
  process.stdout.write(
    `claude-eco wired up in ${settingsPath}.\n\n` +
      `${indented(preview, "  ")}\n\n` +
      `Open a new Claude Code session to see it.\n`,
  );
};

export const runInit = async (): Promise<void> => {
  const existing = readCurrentSettings();
  const existingCommand = existing.statusLine?.command;
  if (existingCommand === CLAUDE_ECO_STATUSLINE.command) {
    printAlreadyInstalled(DEFAULT_SETTINGS_PATH);
    return;
  }
  if (typeof existingCommand === "string") {
    printOverwriteWarning(existingCommand);
  }
  persistSettings(mergeStatuslineConfig(CLAUDE_ECO_STATUSLINE));
  printInstalled(DEFAULT_SETTINGS_PATH);
};
