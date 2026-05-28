import type { EnvironmentalMetrics } from "./calculator";
import {
  formatCo2Equivalent,
  formatEnergyEquivalent,
  formatWaterEquivalent,
} from "./equivalents";

export const METRIC_CYCLE_PERIOD_MS = 10_000;

export type MetricSelector = "energy" | "water" | "co2";

const METRIC_SELECTORS: ReadonlyArray<MetricSelector> = ["energy", "water", "co2"];

export const selectMetricForTick = (nowMs: number): MetricSelector => {
  const periodIndex = Math.floor(nowMs / METRIC_CYCLE_PERIOD_MS);
  const positiveIndex = ((periodIndex % METRIC_SELECTORS.length) + METRIC_SELECTORS.length) % METRIC_SELECTORS.length;
  return METRIC_SELECTORS[positiveIndex]!;
};

const EMOJI_PREFIX_FOR_SELECTOR: Readonly<Record<MetricSelector, string>> = {
  energy: "⚡ ",
  water: "💧 ",
  co2: "💨 ",
};

const ASCII_PREFIX_FOR_SELECTOR: Readonly<Record<MetricSelector, string>> = {
  energy: "E ",
  water: "W ",
  co2: "P ",
};

const trailingPrefix = (selector: MetricSelector, supportsEmoji: boolean): string =>
  supportsEmoji
    ? EMOJI_PREFIX_FOR_SELECTOR[selector]
    : ASCII_PREFIX_FOR_SELECTOR[selector];

const formatterForSelector: Readonly<
  Record<MetricSelector, (metrics: EnvironmentalMetrics) => string>
> = {
  energy: (metrics) => formatEnergyEquivalent(metrics.energy.wattHours),
  water: (metrics) => formatWaterEquivalent(metrics.water.milliliters),
  co2: (metrics) => formatCo2Equivalent(metrics.co2.grams),
};

export const formatTrailingEquivalent = (
  selector: MetricSelector,
  metrics: EnvironmentalMetrics,
  supportsEmoji: boolean,
): string => `${trailingPrefix(selector, supportsEmoji)}${formatterForSelector[selector](metrics)}`;
