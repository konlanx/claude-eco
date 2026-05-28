import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEnvironmentalMetrics } from "../src/calculator";

const FLOATING_POINT_TOLERANCE = 1e-9;

const assertNumberCloseTo = (
  actualValue: number,
  expectedValue: number,
  label: string,
): void => {
  const difference = Math.abs(actualValue - expectedValue);
  assert.ok(
    difference < FLOATING_POINT_TOLERANCE,
    `${label}: expected ~${expectedValue}, got ${actualValue} (diff ${difference})`,
  );
};

test("zero tokens produce zero metrics across every channel", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 0,
    outputTokens: 0,
    modelId: "claude-opus-4-7",
  });
  assert.strictEqual(metrics.energy.wattHours, 0);
  assert.strictEqual(metrics.water.milliliters, 0);
  assert.strictEqual(metrics.co2.grams, 0);
});

test("sonnet applies baseline coefficients (0.00015 Wh in, 0.0005 Wh out)", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 1000,
    outputTokens: 200,
    modelId: "claude-sonnet-4-6",
  });
  assertNumberCloseTo(metrics.energy.wattHours, 0.25, "sonnet energy");
  assertNumberCloseTo(metrics.water.milliliters, 0.45, "sonnet water");
  assertNumberCloseTo(metrics.co2.grams, 0.10725, "sonnet co2");
});

test("opus draws roughly 4x the energy per token of sonnet", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 1000,
    outputTokens: 200,
    modelId: "claude-opus-4-7",
  });
  assertNumberCloseTo(metrics.energy.wattHours, 1.0, "opus energy");
  assertNumberCloseTo(metrics.water.milliliters, 1.8, "opus water");
  assertNumberCloseTo(metrics.co2.grams, 0.429, "opus co2");
});

test("haiku draws roughly 0.4x the energy per token of sonnet", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 10000,
    outputTokens: 2000,
    modelId: "claude-haiku-4-5",
  });
  assertNumberCloseTo(metrics.energy.wattHours, 1.0, "haiku energy");
  assertNumberCloseTo(metrics.water.milliliters, 1.8, "haiku water");
  assertNumberCloseTo(metrics.co2.grams, 0.429, "haiku co2");
});

test("classifies opus even with extended-context suffixes such as [1m]", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 1000,
    outputTokens: 200,
    modelId: "claude-opus-4-7[1m]",
  });
  assertNumberCloseTo(metrics.energy.wattHours, 1.0, "opus-1m energy");
});

test("unknown model ids fall back to sonnet-equivalent coefficients", () => {
  const unknownModelMetrics = calculateEnvironmentalMetrics({
    inputTokens: 1000,
    outputTokens: 200,
    modelId: "not-a-recognized-model",
  });
  const sonnetMetrics = calculateEnvironmentalMetrics({
    inputTokens: 1000,
    outputTokens: 200,
    modelId: "claude-sonnet-4-6",
  });
  assert.strictEqual(
    unknownModelMetrics.energy.wattHours,
    sonnetMetrics.energy.wattHours,
  );
});

test("large sonnet sessions scale linearly without floating point drift", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 1_000_000,
    outputTokens: 100_000,
    modelId: "claude-sonnet-4-6",
  });
  assertNumberCloseTo(metrics.energy.wattHours, 200, "large sonnet energy");
  assertNumberCloseTo(metrics.water.milliliters, 360, "large sonnet water");
  assertNumberCloseTo(metrics.co2.grams, 85.8, "large sonnet co2");
});

test("water and co2 are pure derivations of energy (1.8 ml/Wh, 0.429 g/Wh)", () => {
  const metrics = calculateEnvironmentalMetrics({
    inputTokens: 1000,
    outputTokens: 200,
    modelId: "claude-opus-4-7",
  });
  assertNumberCloseTo(
    metrics.water.milliliters,
    metrics.energy.wattHours * 1.8,
    "water derivation",
  );
  assertNumberCloseTo(
    metrics.co2.grams,
    metrics.energy.wattHours * 0.429,
    "co2 derivation",
  );
});
