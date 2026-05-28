import {
  DEFAULT_SETTINGS_PATH,
  persistSettings,
  readCurrentSettings,
  settingsWithoutStatusline,
} from "./config";

const CLAUDE_ECO_COMMAND = "claude-eco";

const printNotInstalled = (settingsPath: string): void => {
  process.stdout.write(
    `claude-eco is not installed in ${settingsPath} — nothing to remove.\n`,
  );
};

const refuseToTouchForeignStatusline = (existingCommand: string): never => {
  process.stderr.write(
    `claude-eco uninstall: statusLine is configured for a different command (${existingCommand}) — leaving it alone.\n` +
      `Edit ${DEFAULT_SETTINGS_PATH} manually if you want to remove it.\n`,
  );
  process.exit(1);
};

const printRemoved = (settingsPath: string): void => {
  process.stdout.write(
    `claude-eco statusLine block removed from ${settingsPath}.\n`,
  );
};

export const runUninstall = async (): Promise<void> => {
  const existing = readCurrentSettings();
  const existingCommand = existing.statusLine?.command;
  if (existingCommand === undefined) {
    printNotInstalled(DEFAULT_SETTINGS_PATH);
    return;
  }
  if (existingCommand !== CLAUDE_ECO_COMMAND) {
    refuseToTouchForeignStatusline(existingCommand);
  }
  persistSettings(settingsWithoutStatusline());
  printRemoved(DEFAULT_SETTINGS_PATH);
};
