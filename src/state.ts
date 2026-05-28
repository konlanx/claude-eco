import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

export type SessionState = {
  readonly cumulativeFreshInputTokens: number;
  readonly cumulativeCacheWriteTokens: number;
  readonly cumulativeCacheReadTokens: number;
  readonly cumulativeOutputTokens: number;
  readonly modelId: string;
  readonly lastUpdatedAt: string;
  readonly cwd?: string | undefined;
};

const STATE_FILE_VERSION = 3;

type StateFileContents = {
  readonly version: typeof STATE_FILE_VERSION;
  readonly sessions: Readonly<Record<string, SessionState>>;
};

export const DEFAULT_STATE_FILE_PATH = join(
  homedir(),
  ".claude",
  "claude-eco-state.json",
);

const EMPTY_STATE_FILE_CONTENTS: StateFileContents = {
  version: STATE_FILE_VERSION,
  sessions: {},
};

const isCurrentVersion = (contents: { version?: unknown }): boolean =>
  contents.version === STATE_FILE_VERSION;

const readStateFileContents = (filePath: string): StateFileContents => {
  if (!existsSync(filePath)) return EMPTY_STATE_FILE_CONTENTS;
  try {
    const parsed = JSON.parse(readFileSync(filePath, "utf8")) as StateFileContents;
    if (!isCurrentVersion(parsed)) return EMPTY_STATE_FILE_CONTENTS;
    return parsed;
  } catch {
    return EMPTY_STATE_FILE_CONTENTS;
  }
};

const sessionStateFromFile = (
  filePath: string,
  sessionId: string,
): SessionState | undefined => readStateFileContents(filePath).sessions[sessionId];

const mergeSessionInto = (
  contents: StateFileContents,
  sessionId: string,
  state: SessionState,
): StateFileContents => ({
  version: STATE_FILE_VERSION,
  sessions: { ...contents.sessions, [sessionId]: state },
});

export const readSessionState = (
  sessionId: string,
  filePath: string = DEFAULT_STATE_FILE_PATH,
): SessionState | undefined => sessionStateFromFile(filePath, sessionId);

export const readAllSessions = (
  filePath: string = DEFAULT_STATE_FILE_PATH,
): ReadonlyArray<SessionState> =>
  Object.values(readStateFileContents(filePath).sessions);

const ensureParentDirectoryExists = (filePath: string): void => {
  mkdirSync(dirname(filePath), { recursive: true });
};

export const writeSessionState = (
  sessionId: string,
  state: SessionState,
  filePath: string = DEFAULT_STATE_FILE_PATH,
): void => {
  ensureParentDirectoryExists(filePath);
  const existing = readStateFileContents(filePath);
  const updated = mergeSessionInto(existing, sessionId, state);
  writeFileSync(filePath, JSON.stringify(updated, null, 2), "utf8");
};
