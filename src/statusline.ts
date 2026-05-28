import { text } from "node:stream/consumers";
import { calculateEnvironmentalMetrics } from "./calculator";
import { renderStatuslineFor } from "./display";
import { countUserTurns, sumSessionUsage, type CumulativeUsage } from "./transcript";
import { writeSessionState } from "./state";

type StatuslineModel = {
  readonly id: string;
  readonly display_name: string;
};

type StatuslineContextWindow = {
  readonly total_input_tokens: number;
  readonly total_output_tokens: number;
};

type StatuslinePayload = {
  readonly session_id: string;
  readonly model: StatuslineModel;
  readonly context_window: StatuslineContextWindow;
  readonly transcript_path?: string;
  readonly columns?: number;
};

const DEFAULT_AVAILABLE_COLUMNS = 80;

const parsePayload = (rawPayload: string): StatuslinePayload =>
  JSON.parse(rawPayload) as StatuslinePayload;

const readPayloadFromStdin = async (): Promise<StatuslinePayload> => {
  const rawPayload = await text(process.stdin);
  return parsePayload(rawPayload);
};

const persistCumulativeUsage = (
  sessionId: string,
  cumulativeUsage: CumulativeUsage,
): void =>
  writeSessionState(sessionId, {
    cumulativeFreshInputTokens: cumulativeUsage.freshInputTokens,
    cumulativeCacheWriteTokens: cumulativeUsage.cacheWriteTokens,
    cumulativeCacheReadTokens: cumulativeUsage.cacheReadTokens,
    cumulativeOutputTokens: cumulativeUsage.outputTokens,
    lastUpdatedAt: new Date().toISOString(),
  });

const renderForPayload = (
  payload: StatuslinePayload,
  cumulativeUsage: CumulativeUsage,
): string =>
  renderStatuslineFor({
    metrics: calculateEnvironmentalMetrics({
      freshInputTokens: cumulativeUsage.freshInputTokens,
      cacheWriteTokens: cumulativeUsage.cacheWriteTokens,
      cacheReadTokens: cumulativeUsage.cacheReadTokens,
      outputTokens: cumulativeUsage.outputTokens,
      modelId: payload.model.id,
    }),
    modelDisplayName: payload.model.display_name,
    messageCount: countUserTurns(payload.transcript_path),
    availableColumns: payload.columns ?? DEFAULT_AVAILABLE_COLUMNS,
  });

const buildStatuslineOutput = (payload: StatuslinePayload): string => {
  const cumulativeUsage = sumSessionUsage(payload.transcript_path);
  persistCumulativeUsage(payload.session_id, cumulativeUsage);
  return renderForPayload(payload, cumulativeUsage);
};

export const runStatusline = async (): Promise<void> => {
  const payload = await readPayloadFromStdin();
  const output = buildStatuslineOutput(payload);
  process.stdout.write(output);
};
