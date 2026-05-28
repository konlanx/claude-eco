import { existsSync, readFileSync } from "node:fs";

type AssistantUsage = {
  readonly input_tokens: number;
  readonly cache_creation_input_tokens: number;
  readonly cache_read_input_tokens: number;
  readonly output_tokens: number;
};

type TranscriptEntry = {
  readonly type?: string;
  readonly promptId?: string;
  readonly timestamp?: string;
  readonly message?: {
    readonly id?: string;
    readonly usage?: AssistantUsage;
  };
};

type AssistantTranscriptEntry = {
  readonly type: "assistant";
  readonly message: {
    readonly id: string;
    readonly usage: AssistantUsage;
  };
};

export type CumulativeUsage = {
  readonly freshInputTokens: number;
  readonly cacheWriteTokens: number;
  readonly cacheReadTokens: number;
  readonly outputTokens: number;
};

const EMPTY_CUMULATIVE_USAGE: CumulativeUsage = {
  freshInputTokens: 0,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
  outputTokens: 0,
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

const isAssistantEntry = (
  entry: TranscriptEntry | undefined,
): entry is AssistantTranscriptEntry => {
  if (entry?.type !== "assistant") return false;
  if (entry.message?.id === undefined) return false;
  return entry.message.usage !== undefined;

};

const promptIdOf = (entry: TranscriptEntry): string | undefined => entry.promptId;

const messageIdOf = (entry: AssistantTranscriptEntry): string => entry.message.id;

const usageOf = (entry: AssistantTranscriptEntry): AssistantUsage => entry.message.usage;

const isDefinedString = (value: string | undefined): value is string =>
  value !== undefined;

const distinctValueCount = (values: ReadonlyArray<string>): number =>
  new Set(values).size;

const dedupeByKey = <Item>(
  items: ReadonlyArray<Item>,
  keyOf: (item: Item) => string,
): ReadonlyArray<Item> =>
  Array.from(new Map(items.map((item) => [keyOf(item), item])).values());

const accumulateUsage = (
  accumulator: CumulativeUsage,
  usage: AssistantUsage,
): CumulativeUsage => ({
  freshInputTokens: accumulator.freshInputTokens + usage.input_tokens,
  cacheWriteTokens: accumulator.cacheWriteTokens + usage.cache_creation_input_tokens,
  cacheReadTokens: accumulator.cacheReadTokens + usage.cache_read_input_tokens,
  outputTokens: accumulator.outputTokens + usage.output_tokens,
});

const readTranscriptLines = (transcriptPath: string): ReadonlyArray<string> =>
  readFileSync(transcriptPath, "utf8").split("\n");

const parsedTranscriptEntries = (
  transcriptPath: string,
): ReadonlyArray<TranscriptEntry> =>
  readTranscriptLines(transcriptPath)
    .map(parseTranscriptLine)
    .filter((entry): entry is TranscriptEntry => entry !== undefined);

export const countUserTurns = (transcriptPath: string | undefined): number => {
  if (transcriptPath === undefined) return 0;
  if (!existsSync(transcriptPath)) return 0;
  const promptIds = parsedTranscriptEntries(transcriptPath)
    .filter(isUserEntry)
    .map(promptIdOf)
    .filter(isDefinedString);
  return distinctValueCount(promptIds);
};

export const sumSessionUsage = (
  transcriptPath: string | undefined,
): CumulativeUsage => {
  if (transcriptPath === undefined) return EMPTY_CUMULATIVE_USAGE;
  if (!existsSync(transcriptPath)) return EMPTY_CUMULATIVE_USAGE;
  const distinctAssistantEntries = dedupeByKey(
    parsedTranscriptEntries(transcriptPath).filter(isAssistantEntry),
    messageIdOf,
  );
  return distinctAssistantEntries
    .map(usageOf)
    .reduce(accumulateUsage, EMPTY_CUMULATIVE_USAGE);
};

const isConversationalEntry = (entry: TranscriptEntry | undefined): boolean =>
  entry?.type === "user" || entry?.type === "assistant";

const timestampMsOf = (entry: TranscriptEntry): number =>
  entry.timestamp === undefined ? NaN : Date.parse(entry.timestamp);

const greaterOf = (left: number, right: number): number =>
  left >= right ? left : right;

const maxOf = (values: ReadonlyArray<number>): number | undefined =>
  values.length === 0 ? undefined : values.reduce(greaterOf);

export const lastConversationalActivityMs = (
  transcriptPath: string | undefined,
): number | undefined => {
  if (transcriptPath === undefined) return undefined;
  if (!existsSync(transcriptPath)) return undefined;
  const timestamps = parsedTranscriptEntries(transcriptPath)
    .filter(isConversationalEntry)
    .map(timestampMsOf)
    .filter(Number.isFinite);
  return maxOf(timestamps);
};
