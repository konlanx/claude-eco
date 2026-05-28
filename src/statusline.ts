import { text } from "node:stream/consumers";
import {
  calculateEnvironmentalMetrics,
  type EnvironmentalMetrics,
} from "./calculator";
import { renderStatuslineFor, type DisplayInput } from "./display";
import {
  countUserTurns,
  lastConversationalActivityMs,
  sumSessionUsage,
  type CumulativeUsage,
} from "./transcript";
import { readAllSessions, writeSessionState, type SessionState } from "./state";
import {
  determineDisplayMode,
  type DisplayMode,
} from "./display-mode";
import {
  formatTrailingEquivalent,
  selectMetricForTick,
} from "./equivalent-cycle";
import { terminalSupportsEmoji } from "./emoji-support";

type StatuslineModel = {
  readonly id: string;
  readonly display_name: string;
};

type StatuslineContextWindow = {
  readonly total_input_tokens: number;
  readonly total_output_tokens: number;
};

type StatuslineWorkspace = {
  readonly current_dir?: string;
  readonly project_dir?: string;
};

type StatuslinePayload = {
  readonly session_id: string;
  readonly model: StatuslineModel;
  readonly context_window: StatuslineContextWindow;
  readonly transcript_path?: string;
  readonly columns?: number;
  readonly cwd?: string;
  readonly workspace?: StatuslineWorkspace;
};

const DEFAULT_AVAILABLE_COLUMNS = 80;
const CURRENT_SESSION_LEFT_LABEL = "Session";
const PROJECT_LEFT_LABEL = "Project";
const ALL_TIME_LEFT_LABEL = "Total";

const projectKeyForPayload = (payload: StatuslinePayload): string | undefined =>
  payload.workspace?.project_dir ?? payload.workspace?.current_dir ?? payload.cwd;

const ZERO_METRICS: EnvironmentalMetrics = {
  energy: { wattHours: 0 },
  water: { milliliters: 0 },
  co2: { grams: 0 },
};

const parsePayload = (rawPayload: string): StatuslinePayload =>
  JSON.parse(rawPayload) as StatuslinePayload;

const readPayloadFromStdin = async (): Promise<StatuslinePayload> => {
  const rawPayload = await text(process.stdin);
  return parsePayload(rawPayload);
};

const persistCurrentSession = (
  sessionId: string,
  cumulativeUsage: CumulativeUsage,
  modelId: string,
  cwd: string | undefined,
): void =>
  writeSessionState(sessionId, {
    cumulativeFreshInputTokens: cumulativeUsage.freshInputTokens,
    cumulativeCacheWriteTokens: cumulativeUsage.cacheWriteTokens,
    cumulativeCacheReadTokens: cumulativeUsage.cacheReadTokens,
    cumulativeOutputTokens: cumulativeUsage.outputTokens,
    modelId,
    lastUpdatedAt: new Date().toISOString(),
    cwd,
  });

const metricsForSession = (session: SessionState): EnvironmentalMetrics =>
  calculateEnvironmentalMetrics({
    freshInputTokens: session.cumulativeFreshInputTokens,
    cacheWriteTokens: session.cumulativeCacheWriteTokens,
    cacheReadTokens: session.cumulativeCacheReadTokens,
    outputTokens: session.cumulativeOutputTokens,
    modelId: session.modelId,
  });

const addMetrics = (
  left: EnvironmentalMetrics,
  right: EnvironmentalMetrics,
): EnvironmentalMetrics => ({
  energy: { wattHours: left.energy.wattHours + right.energy.wattHours },
  water: { milliliters: left.water.milliliters + right.water.milliliters },
  co2: { grams: left.co2.grams + right.co2.grams },
});

const sumAllTimeMetrics = (
  sessions: ReadonlyArray<SessionState>,
): EnvironmentalMetrics =>
  sessions.map(metricsForSession).reduce(addMetrics, ZERO_METRICS);

const allMetricsZero = (metrics: EnvironmentalMetrics): boolean =>
  metrics.energy.wattHours === 0 &&
  metrics.water.milliliters === 0 &&
  metrics.co2.grams === 0;

const trailingEquivalentNow = (
  metrics: EnvironmentalMetrics,
  supportsEmoji: boolean,
): string | undefined => {
  if (allMetricsZero(metrics)) return undefined;
  return formatTrailingEquivalent(
    selectMetricForTick(Date.now()),
    metrics,
    supportsEmoji,
  );
};

const currentSessionDisplayInput = (
  payload: StatuslinePayload,
  cumulativeUsage: CumulativeUsage,
  supportsEmoji: boolean,
): DisplayInput => {
  const metrics = calculateEnvironmentalMetrics({
    freshInputTokens: cumulativeUsage.freshInputTokens,
    cacheWriteTokens: cumulativeUsage.cacheWriteTokens,
    cacheReadTokens: cumulativeUsage.cacheReadTokens,
    outputTokens: cumulativeUsage.outputTokens,
    modelId: payload.model.id,
  });
  return {
    metrics,
    leftLabel: CURRENT_SESSION_LEFT_LABEL,
    rightSegments: [
      `${countUserTurns(payload.transcript_path)} msgs`,
      payload.model.display_name,
    ],
    trailingSegment: trailingEquivalentNow(metrics, supportsEmoji),
    availableColumns: payload.columns ?? DEFAULT_AVAILABLE_COLUMNS,
    supportsEmoji,
  };
};

const allTimeDisplayInput = (
  payload: StatuslinePayload,
  supportsEmoji: boolean,
): DisplayInput => {
  const allSessions = readAllSessions();
  const metrics = sumAllTimeMetrics(allSessions);
  return {
    metrics,
    leftLabel: ALL_TIME_LEFT_LABEL,
    rightSegments: [`${allSessions.length} sessions`],
    trailingSegment: trailingEquivalentNow(metrics, supportsEmoji),
    availableColumns: payload.columns ?? DEFAULT_AVAILABLE_COLUMNS,
    supportsEmoji,
  };
};

const sessionsInProject = (
  projectKey: string,
): ReadonlyArray<SessionState> =>
  readAllSessions().filter((session) => session.cwd === projectKey);

const projectTotalDisplayInput = (
  payload: StatuslinePayload,
  supportsEmoji: boolean,
  projectKey: string,
): DisplayInput => {
  const projectSessions = sessionsInProject(projectKey);
  const metrics = sumAllTimeMetrics(projectSessions);
  return {
    metrics,
    leftLabel: PROJECT_LEFT_LABEL,
    rightSegments: [`${projectSessions.length} sessions`],
    trailingSegment: trailingEquivalentNow(metrics, supportsEmoji),
    availableColumns: payload.columns ?? DEFAULT_AVAILABLE_COLUMNS,
    supportsEmoji,
  };
};

const projectOrAllTimeDisplayInput = (
  payload: StatuslinePayload,
  supportsEmoji: boolean,
): DisplayInput => {
  const projectKey = projectKeyForPayload(payload);
  if (projectKey === undefined) return allTimeDisplayInput(payload, supportsEmoji);
  return projectTotalDisplayInput(payload, supportsEmoji, projectKey);
};

const displayInputForMode = (
  mode: DisplayMode,
  payload: StatuslinePayload,
  cumulativeUsage: CumulativeUsage,
  supportsEmoji: boolean,
): DisplayInput => {
  if (mode === "current-session") {
    return currentSessionDisplayInput(payload, cumulativeUsage, supportsEmoji);
  }
  if (mode === "project-total") {
    return projectOrAllTimeDisplayInput(payload, supportsEmoji);
  }
  return allTimeDisplayInput(payload, supportsEmoji);
};

const buildStatuslineOutput = (payload: StatuslinePayload): string => {
  const cumulativeUsage = sumSessionUsage(payload.transcript_path);
  persistCurrentSession(
    payload.session_id,
    cumulativeUsage,
    payload.model.id,
    projectKeyForPayload(payload),
  );
  const mode = determineDisplayMode(
    lastConversationalActivityMs(payload.transcript_path),
    Date.now(),
  );
  const supportsEmoji = terminalSupportsEmoji();
  return renderStatuslineFor(
    displayInputForMode(mode, payload, cumulativeUsage, supportsEmoji),
  );
};

export const runStatusline = async (): Promise<void> => {
  const payload = await readPayloadFromStdin();
  const output = buildStatuslineOutput(payload);
  process.stdout.write(output);
};
