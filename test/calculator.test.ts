import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateEnvironmentalMetrics, type TokenUsage } from "../src/calculator";

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

const usageFor = (overrides: Partial<TokenUsage>): TokenUsage => ({
  freshInputTokens: 0,
  cacheWriteTokens: 0,
  cacheReadTokens: 0,
  outputTokens: 0,
  modelId: "claude-sonnet-4-6",
  ...overrides,
});

test("zero tokens produce zero metrics across every channel", () => {
  const metrics = calculateEnvironmentalMetrics(usageFor({ modelId: "claude-opus-4-7" }));
  assert.strictEqual(metrics.energy.wattHours, 0);
  assert.strictEqual(metrics.water.milliliters, 0);
  assert.strictEqual(metrics.co2.grams, 0);
});

test("sonnet fresh input applies the baseline 0.00039 Wh/token rate (Couch 2026)", () => {
  const metrics = calculateEnvironmentalMetrics(
    usageFor({ freshInputTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  assertNumberCloseTo(metrics.energy.wattHours, 0.39, "fresh-input energy");
});

test("sonnet output applies the baseline 0.00195 Wh/token rate (Couch 2026)", () => {
  const metrics = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  assertNumberCloseTo(metrics.energy.wattHours, 1.95, "output energy");
});

test("cache writes cost 1.25× fresh input (Anthropic pricing proxy)", () => {
  const writes = calculateEnvironmentalMetrics(
    usageFor({ cacheWriteTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  const fresh = calculateEnvironmentalMetrics(
    usageFor({ freshInputTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  assertNumberCloseTo(
    writes.energy.wattHours / fresh.energy.wattHours,
    1.25,
    "cache-write to fresh-input ratio",
  );
});

test("cache reads cost 0.10× fresh input (Anthropic pricing proxy)", () => {
  const reads = calculateEnvironmentalMetrics(
    usageFor({ cacheReadTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  const fresh = calculateEnvironmentalMetrics(
    usageFor({ freshInputTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  assertNumberCloseTo(
    reads.energy.wattHours / fresh.energy.wattHours,
    0.1,
    "cache-read to fresh-input ratio",
  );
});

test("opus draws 5× the energy per token of sonnet across every channel", () => {
  const sonnet = calculateEnvironmentalMetrics(
    usageFor({
      freshInputTokens: 1000,
      cacheWriteTokens: 1000,
      cacheReadTokens: 1000,
      outputTokens: 1000,
      modelId: "claude-sonnet-4-6",
    }),
  );
  const opus = calculateEnvironmentalMetrics(
    usageFor({
      freshInputTokens: 1000,
      cacheWriteTokens: 1000,
      cacheReadTokens: 1000,
      outputTokens: 1000,
      modelId: "claude-opus-4-7",
    }),
  );
  assertNumberCloseTo(
    opus.energy.wattHours / sonnet.energy.wattHours,
    5,
    "opus/sonnet energy ratio",
  );
});

test("haiku draws 1/3× the energy per token of sonnet across every channel", () => {
  const sonnet = calculateEnvironmentalMetrics(
    usageFor({
      freshInputTokens: 1000,
      cacheReadTokens: 1000,
      outputTokens: 1000,
      modelId: "claude-sonnet-4-6",
    }),
  );
  const haiku = calculateEnvironmentalMetrics(
    usageFor({
      freshInputTokens: 1000,
      cacheReadTokens: 1000,
      outputTokens: 1000,
      modelId: "claude-haiku-4-5",
    }),
  );
  assertNumberCloseTo(
    haiku.energy.wattHours / sonnet.energy.wattHours,
    1 / 3,
    "haiku/sonnet energy ratio",
  );
});

test("classifies opus even with extended-context suffixes such as [1m]", () => {
  const withSuffix = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "claude-opus-4-7[1m]" }),
  );
  const withoutSuffix = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "claude-opus-4-7" }),
  );
  assert.strictEqual(withSuffix.energy.wattHours, withoutSuffix.energy.wattHours);
});

test("unknown model ids fall back to sonnet-equivalent coefficients", () => {
  const unknown = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "not-a-recognized-model" }),
  );
  const sonnet = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "claude-sonnet-4-6" }),
  );
  assert.strictEqual(unknown.energy.wattHours, sonnet.energy.wattHours);
});

test("water is a pure 6.44 ml/Wh derivation of energy (EESI 2025 total)", () => {
  const metrics = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "claude-opus-4-7" }),
  );
  assertNumberCloseTo(
    metrics.water.milliliters,
    metrics.energy.wattHours * 6.44,
    "water = energy × 6.44",
  );
});

test("co2 is a pure 0.445 g/Wh derivation of energy (IEA 2024 global average)", () => {
  const metrics = calculateEnvironmentalMetrics(
    usageFor({ outputTokens: 1000, modelId: "claude-opus-4-7" }),
  );
  assertNumberCloseTo(
    metrics.co2.grams,
    metrics.energy.wattHours * 0.445,
    "co2 = energy × 0.445",
  );
});

test("realistic Claude Code session breakdown (cache-read dominant) is computable end to end", () => {
  const metrics = calculateEnvironmentalMetrics({
    freshInputTokens: 50_000,
    cacheWriteTokens: 200_000,
    cacheReadTokens: 5_000_000,
    outputTokens: 100_000,
    modelId: "claude-opus-4-7",
  });
  assert.ok(
    metrics.energy.wattHours > 0,
    `expected non-zero energy, got ${metrics.energy.wattHours}`,
  );
  assert.ok(
    Number.isFinite(metrics.energy.wattHours),
    "energy should be a finite number",
  );
});
