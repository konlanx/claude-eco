import { test } from "node:test";
import assert from "node:assert/strict";
import {
  METRIC_CYCLE_PERIOD_MS,
  formatTrailingEquivalent,
  selectMetricForTick,
} from "../src/equivalent-cycle";

const sampleMetrics = {
  energy: { wattHours: 0.42 },
  water: { milliliters: 0.76 },
  co2: { grams: 0.18 },
};

test("cycle period is 10 seconds (matches the recommended refreshInterval)", () => {
  assert.strictEqual(METRIC_CYCLE_PERIOD_MS, 10_000);
});

test("first 10s window selects energy", () => {
  assert.strictEqual(selectMetricForTick(0), "energy");
  assert.strictEqual(selectMetricForTick(9_999), "energy");
});

test("second 10s window selects water", () => {
  assert.strictEqual(selectMetricForTick(10_000), "water");
  assert.strictEqual(selectMetricForTick(19_999), "water");
});

test("third 10s window selects co2", () => {
  assert.strictEqual(selectMetricForTick(20_000), "co2");
  assert.strictEqual(selectMetricForTick(29_999), "co2");
});

test("cycle wraps back to energy after three windows", () => {
  assert.strictEqual(selectMetricForTick(30_000), "energy");
  assert.strictEqual(selectMetricForTick(40_000), "water");
  assert.strictEqual(selectMetricForTick(50_000), "co2");
});

test("negative timestamps still produce a valid selector (clock skew safety)", () => {
  const result = selectMetricForTick(-5_000);
  assert.ok(
    result === "energy" || result === "water" || result === "co2",
    `expected a valid selector, got ${result}`,
  );
});

test("formatTrailingEquivalent prefixes the energy equivalent with ⚡", () => {
  assert.strictEqual(
    formatTrailingEquivalent("energy", sampleMetrics, true),
    "⚡ 2.8 min of LED bulb",
  );
});

test("formatTrailingEquivalent prefixes the water equivalent with 💧", () => {
  assert.strictEqual(
    formatTrailingEquivalent("water", sampleMetrics, true),
    "💧 15.2 drops",
  );
});

test("formatTrailingEquivalent prefixes the co2 equivalent with 💨", () => {
  assert.strictEqual(
    formatTrailingEquivalent("co2", sampleMetrics, true),
    "💨 6 Google searches",
  );
});

test("formatTrailingEquivalent falls back to single-letter prefixes when unsupported", () => {
  assert.strictEqual(
    formatTrailingEquivalent("energy", sampleMetrics, false),
    "E 2.8 min of LED bulb",
  );
  assert.strictEqual(
    formatTrailingEquivalent("water", sampleMetrics, false),
    "W 15.2 drops",
  );
  assert.strictEqual(
    formatTrailingEquivalent("co2", sampleMetrics, false),
    "P 6 Google searches",
  );
});
