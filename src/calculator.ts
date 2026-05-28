type ModelTier = "opus" | "sonnet" | "haiku" | "unknown";

type EnergyCoefficients = {
  readonly wattHoursPerInputToken: number;
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
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly modelId: string;
};

const MILLILITERS_OF_WATER_PER_WATT_HOUR = 1.8;
const GRAMS_CO2_PER_WATT_HOUR = 0.429;

const COEFFICIENTS_BY_TIER: Readonly<Record<ModelTier, EnergyCoefficients>> = {
  opus: {
    wattHoursPerInputToken: 0.0006,
    wattHoursPerOutputToken: 0.002,
  },
  sonnet: {
    wattHoursPerInputToken: 0.00015,
    wattHoursPerOutputToken: 0.0005,
  },
  haiku: {
    wattHoursPerInputToken: 0.00006,
    wattHoursPerOutputToken: 0.0002,
  },
  unknown: {
    wattHoursPerInputToken: 0.00015,
    wattHoursPerOutputToken: 0.0005,
  },
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
  inputTokens: number,
  outputTokens: number,
  coefficients: EnergyCoefficients,
): EnergyMetric => ({
  wattHours:
    inputTokens * coefficients.wattHoursPerInputToken +
    outputTokens * coefficients.wattHoursPerOutputToken,
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
  const energy = calculateEnergy(
    usage.inputTokens,
    usage.outputTokens,
    coefficients,
  );
  return {
    energy,
    water: calculateWater(energy),
    co2: calculateCo2(energy),
  };
};
