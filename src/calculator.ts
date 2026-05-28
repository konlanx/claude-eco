/*
 * Coefficient sources — every number here traces back to a published reference.
 *
 * [COUCH-2026]  Couch, S. "Claude Code's environmental impact" (Jan 2026).
 *               https://simonpcouch.com/blog/2026-01-20-cc-impact/
 *               Derives Wh per Claude token by anchoring on Epoch AI's GPT-4o energy
 *               estimate (0.3 Wh / 500-token query) and splitting input vs output
 *               using Anthropic's 1:5 input/output price ratio.
 *
 * [EPOCH-2025] Epoch AI, "How much energy does ChatGPT use?" (Feb 2025).
 *               https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
 *               The GPT-4o anchor Couch builds on. Self-described as pessimistic.
 *
 * [ANTHROPIC-PRICING] Anthropic API pricing & prompt-caching docs.
 *               https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
 *               Used as a proxy for relative compute cost:
 *                 cache writes ≈ 1.25× fresh-input price
 *                 cache reads  ≈ 0.10× fresh-input price
 *                 Opus 4 input is 5× Sonnet 4 input ($15 vs $3 per Mtok)
 *                 Haiku 4.5 input is 1/3× Sonnet 4 input ($1 vs $3 per Mtok)
 *               Pricing-derived proxies, not independently measured energy ratios.
 *
 * [EESI-2025]   Environmental and Energy Study Institute, "Data Centers and Water
 *               Consumption" (Jun 2025).
 *               https://www.eesi.org/articles/view/data-centers-and-water-consumption
 *               On-site WUE = 1.9 L/kWh; indirect (power generation) ≈ 4.54 L/kWh.
 *               Total ≈ 6.44 ml/Wh — used here to reflect the full footprint, not
 *               just the cooling water reported by individual operators.
 *
 * [IEA-2025]    IEA, Electricity 2025 — Emissions chapter.
 *               https://www.iea.org/reports/electricity-2025/emissions
 *               Global average grid intensity, 2024: 445 g CO₂ / kWh.
 *
 * Honest caveat: no per-token energy figure has been published for Claude 4. All
 * tier scaling is derived from API pricing, which approximates relative compute
 * cost but is not a direct energy measurement. Treat absolute numbers as ±50%.
 */

type ModelTier = "opus" | "sonnet" | "haiku" | "unknown";

type EnergyCoefficients = {
  readonly wattHoursPerFreshInputToken: number;
  readonly wattHoursPerCacheWriteToken: number;
  readonly wattHoursPerCacheReadToken: number;
  readonly wattHoursPerOutputToken: number;
};

export type EnergyMetric = { readonly wattHours: number };
export type WaterMetric = { readonly milliliters: number };
export type Co2Metric = { readonly grams: number };

export type EnvironmentalMetrics = {
  readonly energy: EnergyMetric;
  readonly water: WaterMetric;
  readonly co2: Co2Metric;
};

export type TokenUsage = {
  readonly freshInputTokens: number;
  readonly cacheWriteTokens: number;
  readonly cacheReadTokens: number;
  readonly outputTokens: number;
  readonly modelId: string;
};

const SONNET_WATT_HOURS_PER_FRESH_INPUT_TOKEN = 0.00039;
const SONNET_WATT_HOURS_PER_OUTPUT_TOKEN = 0.00195;
const CACHE_WRITE_RATIO = 1.25;
const CACHE_READ_RATIO = 0.10;

const HAIKU_TIER_MULTIPLIER = 1 / 3;
const SONNET_TIER_MULTIPLIER = 1;
const OPUS_TIER_MULTIPLIER = 5;

const MILLILITERS_OF_WATER_PER_WATT_HOUR = 6.44;
const GRAMS_CO2_PER_WATT_HOUR = 0.445;

const buildCoefficientsForTier = (tierMultiplier: number): EnergyCoefficients => ({
  wattHoursPerFreshInputToken:
    SONNET_WATT_HOURS_PER_FRESH_INPUT_TOKEN * tierMultiplier,
  wattHoursPerCacheWriteToken:
    SONNET_WATT_HOURS_PER_FRESH_INPUT_TOKEN * CACHE_WRITE_RATIO * tierMultiplier,
  wattHoursPerCacheReadToken:
    SONNET_WATT_HOURS_PER_FRESH_INPUT_TOKEN * CACHE_READ_RATIO * tierMultiplier,
  wattHoursPerOutputToken:
    SONNET_WATT_HOURS_PER_OUTPUT_TOKEN * tierMultiplier,
});

const COEFFICIENTS_BY_TIER: Readonly<Record<ModelTier, EnergyCoefficients>> = {
  opus: buildCoefficientsForTier(OPUS_TIER_MULTIPLIER),
  sonnet: buildCoefficientsForTier(SONNET_TIER_MULTIPLIER),
  haiku: buildCoefficientsForTier(HAIKU_TIER_MULTIPLIER),
  unknown: buildCoefficientsForTier(SONNET_TIER_MULTIPLIER),
};

const classifyModelTier = (modelId: string): ModelTier => {
  const normalizedModelId = modelId.toLowerCase();
  if (normalizedModelId.includes("opus")) return "opus";
  if (normalizedModelId.includes("sonnet")) return "sonnet";
  if (normalizedModelId.includes("haiku")) return "haiku";
  return "unknown";
};

const energyCoefficientsForModel = (modelId: string): EnergyCoefficients =>
  COEFFICIENTS_BY_TIER[classifyModelTier(modelId)];

const calculateEnergy = (
  usage: TokenUsage,
  coefficients: EnergyCoefficients,
): EnergyMetric => ({
  wattHours:
    usage.freshInputTokens * coefficients.wattHoursPerFreshInputToken +
    usage.cacheWriteTokens * coefficients.wattHoursPerCacheWriteToken +
    usage.cacheReadTokens * coefficients.wattHoursPerCacheReadToken +
    usage.outputTokens * coefficients.wattHoursPerOutputToken,
});

const calculateWater = (energy: EnergyMetric): WaterMetric => ({
  milliliters: energy.wattHours * MILLILITERS_OF_WATER_PER_WATT_HOUR,
});

const calculateCo2 = (energy: EnergyMetric): Co2Metric => ({
  grams: energy.wattHours * GRAMS_CO2_PER_WATT_HOUR,
});

export const calculateEnvironmentalMetrics = (
  usage: TokenUsage,
): EnvironmentalMetrics => {
  const coefficients = energyCoefficientsForModel(usage.modelId);
  const energy = calculateEnergy(usage, coefficients);
  return {
    energy,
    water: calculateWater(energy),
    co2: calculateCo2(energy),
  };
};
