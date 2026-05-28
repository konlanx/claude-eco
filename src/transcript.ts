import { existsSync, readFileSync } from "node:fs";

type TranscriptEntry = {
  readonly type?: string;
  readonly promptId?: string;
};

const parseTranscriptLine = (line: string): TranscriptEntry | undefined => {
  if (line.trim().length === 0) return undefined;
  try {
    return JSON.parse(line) as TranscriptEntry;
  } catch {
    return undefined;
  }
};

const isUserEntry = (entry: TranscriptEntry | undefined): entry is TranscriptEntry =>
  entry?.type === "user";

const promptIdOf = (entry: TranscriptEntry): string | undefined => entry.promptId;

const isDefinedString = (value: string | undefined): value is string =>
  value !== undefined;

const distinctValueCount = (values: ReadonlyArray<string>): number =>
  new Set(values).size;

const readTranscriptLines = (transcriptPath: string): ReadonlyArray<string> =>
  readFileSync(transcriptPath, "utf8").split("\n");

export const countUserTurns = (transcriptPath: string | undefined): number => {
  if (transcriptPath === undefined) return 0;
  if (!existsSync(transcriptPath)) return 0;
  const promptIds = readTranscriptLines(transcriptPath)
    .map(parseTranscriptLine)
    .filter(isUserEntry)
    .map(promptIdOf)
    .filter(isDefinedString);
  return distinctValueCount(promptIds);
};
