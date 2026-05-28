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

const WATT_HOURS_PER_TV_SECOND = 0.05;
const MILLILITERS_PER_WATER_DROP = 0.05;
const GRAMS_CO2_PER_METER_DRIVEN = 0.15;

const SEGMENT_GAP = "  ";
const SEPARATOR_RAW = "  ·  ";

export type DisplayInput = {
  readonly metrics: EnvironmentalMetrics;
  readonly leftLabel?: string;
  readonly rightSegments: ReadonlyArray<string>;
  readonly availableColumns: number;
};

type LayoutMode = "full" | "compact" | "minimal";

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

const roundedAtLeastOne = (value: number): number =>
  Math.max(1, Math.round(value));

const tvSecondsEquivalent = (wattHours: number): string =>
  `${roundedAtLeastOne(wattHours / WATT_HOURS_PER_TV_SECOND)}s of TV`;

const waterDropsEquivalent = (milliliters: number): string =>
  `${roundedAtLeastOne(milliliters / MILLILITERS_PER_WATER_DROP)} drops`;

const drivingMetersEquivalent = (gramsCo2: number): string =>
  `${roundedAtLeastOne(gramsCo2 / GRAMS_CO2_PER_METER_DRIVEN)}m of driving`;

const withEquivalent = (base: string, equivalent: string): string =>
  `${base} ${colorize(ANSI_DIM, `(${equivalent})`)}`;

const renderEnergySegment = (wattHours: number, layout: LayoutMode): string => {
  const scaled = scaleEnergyForDisplay(wattHours);
  const base = colorize(
    colorForEnergy(wattHours),
    `⚡ ${scaled.display} ${scaled.unit}`,
  );
  if (layout !== "full") return base;
  return withEquivalent(base, tvSecondsEquivalent(wattHours));
};

const renderWaterSegment = (milliliters: number, layout: LayoutMode): string => {
  const scaled = scaleWaterForDisplay(milliliters);
  const base = `💧 ${scaled.display} ${scaled.unit}`;
  if (layout !== "full") return base;
  return withEquivalent(base, waterDropsEquivalent(milliliters));
};

const renderCo2Segment = (grams: number, layout: LayoutMode): string => {
  const scaled = scaleCo2ForDisplay(grams);
  const base = `💨 ${scaled.display} ${scaled.unit} CO₂`;
  if (layout !== "full") return base;
  return withEquivalent(base, drivingMetersEquivalent(grams));
};

const renderLeftLabel = (leftLabel: string | undefined): string => {
  if (leftLabel === undefined) return "";
  return `${colorize(ANSI_BOLD, leftLabel)}${SEGMENT_GAP}`;
};

const renderMetricsRow = (input: DisplayInput, layout: LayoutMode): string => {
  const energy = renderEnergySegment(input.metrics.energy.wattHours, layout);
  const water = renderWaterSegment(input.metrics.water.milliliters, layout);
  const co2 = renderCo2Segment(input.metrics.co2.grams, layout);
  return `${renderLeftLabel(input.leftLabel)}${[energy, water, co2].join(SEGMENT_GAP)}`;
};

const renderRightSegments = (segments: ReadonlyArray<string>): string => {
  if (segments.length === 0) return "";
  const separator = colorize(ANSI_DIM, SEPARATOR_RAW);
  const dimmedSegments = segments.map((segment) => colorize(ANSI_DIM, segment));
  return `${separator}${dimmedSegments.join(separator)}`;
};

const renderWithLayout = (input: DisplayInput, layout: LayoutMode): string => {
  const metricsRow = renderMetricsRow(input, layout);
  if (layout === "minimal") return metricsRow;
  return `${metricsRow}${renderRightSegments(input.rightSegments)}`;
};

const fitsWithinColumns = (rendered: string, columns: number): boolean =>
  visibleWidthOf(rendered) <= columns;

export const renderStatuslineFor = (input: DisplayInput): string => {
  const full = renderWithLayout(input, "full");
  if (fitsWithinColumns(full, input.availableColumns)) return full;
  const compact = renderWithLayout(input, "compact");
  if (fitsWithinColumns(compact, input.availableColumns)) return compact;
  return renderWithLayout(input, "minimal");
};
