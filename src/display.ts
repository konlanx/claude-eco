import type { EnvironmentalMetrics } from "./calculator";

const ANSI_RESET = "\x1b[0m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_RED = "\x1b[31m";
const ANSI_BOLD = "\x1b[1m";
const ANSI_DIM = "\x1b[2m";
const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*m/g;

const ENERGY_THRESHOLD_LOW_WATT_HOURS = 0.5;
const ENERGY_THRESHOLD_HIGH_WATT_HOURS = 2.0;

const SEGMENT_GAP = "  ";
const SEPARATOR_RAW = "  ·  ";

export type DisplayInput = {
  readonly metrics: EnvironmentalMetrics;
  readonly leftLabel?: string;
  readonly rightSegments: ReadonlyArray<string>;
  readonly trailingSegment?: string;
  readonly availableColumns: number;
};

type LayoutMode = "full" | "without-model" | "trailing-only" | "minimal";

const LAYOUT_CASCADE: ReadonlyArray<LayoutMode> = [
  "full",
  "without-model",
  "trailing-only",
  "minimal",
];

const visibleWidthOf = (text: string): number =>
  text.replace(ANSI_ESCAPE_PATTERN, "").length;

const colorize = (ansiColor: string, content: string): string =>
  `${ansiColor}${content}${ANSI_RESET}`;

const colorForEnergy = (wattHours: number): string => {
  if (wattHours < ENERGY_THRESHOLD_LOW_WATT_HOURS) return ANSI_GREEN;
  if (wattHours < ENERGY_THRESHOLD_HIGH_WATT_HOURS) return ANSI_YELLOW;
  return ANSI_RED;
};

const formatTwoDecimals = (value: number): string => value.toFixed(2);

type ScaledValue = { readonly display: string; readonly unit: string };

const scaleEnergyForDisplay = (wattHours: number): ScaledValue => {
  if (wattHours >= 1000) {
    return { display: formatTwoDecimals(wattHours / 1000), unit: "kWh" };
  }
  return { display: formatTwoDecimals(wattHours), unit: "Wh" };
};

const scaleWaterForDisplay = (milliliters: number): ScaledValue => {
  if (milliliters >= 1000) {
    return { display: formatTwoDecimals(milliliters / 1000), unit: "L" };
  }
  return { display: formatTwoDecimals(milliliters), unit: "ml" };
};

const scaleCo2ForDisplay = (grams: number): ScaledValue => {
  if (grams >= 1_000_000) {
    return { display: formatTwoDecimals(grams / 1_000_000), unit: "t" };
  }
  if (grams >= 1000) {
    return { display: formatTwoDecimals(grams / 1000), unit: "kg" };
  }
  return { display: formatTwoDecimals(grams), unit: "g" };
};

const renderEnergySegment = (wattHours: number): string => {
  const scaled = scaleEnergyForDisplay(wattHours);
  return colorize(
    colorForEnergy(wattHours),
    `⚡ ${scaled.display} ${scaled.unit}`,
  );
};

const renderWaterSegment = (milliliters: number): string => {
  const scaled = scaleWaterForDisplay(milliliters);
  return `💧 ${scaled.display} ${scaled.unit}`;
};

const renderCo2Segment = (grams: number): string => {
  const scaled = scaleCo2ForDisplay(grams);
  return `💨 ${scaled.display} ${scaled.unit} CO₂`;
};

const renderLeftLabel = (leftLabel: string | undefined): string => {
  if (leftLabel === undefined) return "";
  return `${colorize(ANSI_BOLD, leftLabel)}${SEGMENT_GAP}`;
};

const rightSegmentsForLayout = (
  layout: LayoutMode,
  segments: ReadonlyArray<string>,
): ReadonlyArray<string> => {
  if (layout === "full") return segments;
  if (layout === "without-model") return segments.slice(0, -1);
  return [];
};

const trailingForLayout = (
  layout: LayoutMode,
  trailingSegment: string | undefined,
): string | undefined => {
  if (layout === "minimal") return undefined;
  return trailingSegment;
};

const renderMetricsRow = (input: DisplayInput): string => {
  const energy = renderEnergySegment(input.metrics.energy.wattHours);
  const water = renderWaterSegment(input.metrics.water.milliliters);
  const co2 = renderCo2Segment(input.metrics.co2.grams);
  return `${renderLeftLabel(input.leftLabel)}${[energy, water, co2].join(SEGMENT_GAP)}`;
};

const renderRightSegments = (segments: ReadonlyArray<string>): string => {
  if (segments.length === 0) return "";
  const separator = colorize(ANSI_DIM, SEPARATOR_RAW);
  const dimmedSegments = segments.map((segment) => colorize(ANSI_DIM, segment));
  return `${separator}${dimmedSegments.join(separator)}`;
};

const composeRightSegments = (
  layout: LayoutMode,
  input: DisplayInput,
): ReadonlyArray<string> => {
  const baseSegments = rightSegmentsForLayout(layout, input.rightSegments);
  const trailing = trailingForLayout(layout, input.trailingSegment);
  if (trailing === undefined) return baseSegments;
  return [...baseSegments, trailing];
};

const renderWithLayout = (input: DisplayInput, layout: LayoutMode): string => {
  const metricsRow = renderMetricsRow(input);
  return `${metricsRow}${renderRightSegments(composeRightSegments(layout, input))}`;
};

const fitsWithinColumns = (rendered: string, columns: number): boolean =>
  visibleWidthOf(rendered) <= columns;

const firstFittingLayout = (input: DisplayInput): LayoutMode => {
  const fitting = LAYOUT_CASCADE.find((layout) =>
    fitsWithinColumns(renderWithLayout(input, layout), input.availableColumns),
  );
  return fitting ?? "minimal";
};

export const renderStatuslineFor = (input: DisplayInput): string =>
  renderWithLayout(input, firstFittingLayout(input));
