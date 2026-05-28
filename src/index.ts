#!/usr/bin/env node
import { runStatusline } from "./statusline";

const reportFatalError = (error: unknown): never => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`claude-eco: ${errorMessage}\n`);
  process.exit(1);
};

const handleUnknownCommand = (commandName: string): never => {
  process.stderr.write(`claude-eco: unknown command "${commandName}"\n`);
  process.exit(1);
};

const runCommand = async (commandName: string | undefined): Promise<void> => {
  if (commandName === undefined) return runStatusline();
  handleUnknownCommand(commandName);
};

const main = async (): Promise<void> => {
  const commandName = process.argv[2];
  await runCommand(commandName);
};

main().catch(reportFatalError);
