import { text } from "node:stream/consumers";
import { calculateEnvironmentalMetrics } from "./calculator";
import { renderStatuslineFor } from "./display";
import { countUserTurns } from "./transcript";

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

const metricsForPayload = (payload: StatuslinePayload) =>
  calculateEnvironmentalMetrics({
    inputTokens: payload.context_window.total_input_tokens,
    outputTokens: payload.context_window.total_output_tokens,
    modelId: payload.model.id,
  });

const buildStatuslineOutput = (payload: StatuslinePayload): string =>
  renderStatuslineFor({
    metrics: metricsForPayload(payload),
    modelDisplayName: payload.model.display_name,
    messageCount: countUserTurns(payload.transcript_path),
    availableColumns: payload.columns ?? DEFAULT_AVAILABLE_COLUMNS,
  });

export const runStatusline = async (): Promise<void> => {
  const payload = await readPayloadFromStdin();
  const output = buildStatuslineOutput(payload);
  process.stdout.write(output);
};
