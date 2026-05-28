import { text } from "node:stream/consumers";

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
};

const parsePayload = (rawPayload: string): StatuslinePayload =>
  JSON.parse(rawPayload) as StatuslinePayload;

const readPayloadFromStdin = async (): Promise<StatuslinePayload> => {
  const rawPayload = await text(process.stdin);
  return parsePayload(rawPayload);
};

const formatStatuslineLine = (payload: StatuslinePayload): string => {
  const inputTokens = payload.context_window.total_input_tokens;
  const outputTokens = payload.context_window.total_output_tokens;
  const modelIdentifier = payload.model.id;
  return `↑ ${inputTokens} ↓ ${outputTokens} · ${modelIdentifier}`;
};

export const runStatusline = async (): Promise<void> => {
  const payload = await readPayloadFromStdin();
  const statuslineLine = formatStatuslineLine(payload);
  process.stdout.write(statuslineLine);
};
