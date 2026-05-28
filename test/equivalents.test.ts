import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCo2Equivalent,
  formatEnergyEquivalent,
  formatWaterEquivalent,
} from "../src/equivalents";

// Picker rule: choose the largest equivalent whose unit cost is ≤ the value.
// Count is rounded to one decimal place; trailing ".0" is trimmed so integer
// counts read cleanly. Counts are clamped to a 0.1 minimum so we never
// display "0 X" for tiny values.

test("energy clamps to 0.1 when the value is far below the smallest equivalent", () => {
  assert.strictEqual(formatEnergyEquivalent(0.001), "0.1 min of LED bulb");
});

test("energy uses one decimal between integer counts (LED minute tier)", () => {
  assert.strictEqual(formatEnergyEquivalent(0.42), "2.8 min of LED bulb");
});

test("energy trims trailing .0 for clean integer counts", () => {
  assert.strictEqual(formatEnergyEquivalent(12), "1 phone charge");
});

test("energy uses 'h of TV' with a 1.5 reading in the 100–158 Wh tier", () => {
  assert.strictEqual(formatEnergyEquivalent(150), "1.5 h of TV");
});

test("energy uses 'h of gaming' with a fractional reading in the 180–500 Wh tier", () => {
  assert.strictEqual(formatEnergyEquivalent(400), "2.2 h of gaming");
});

test("energy uses 'h of central AC' for mid-kWh totals", () => {
  assert.strictEqual(formatEnergyEquivalent(8000), "2.7 h of central AC");
});

test("energy uses 'Tesla M3 battery' at clean multiples of 75 kWh", () => {
  assert.strictEqual(formatEnergyEquivalent(150000), "2 Tesla M3 batteries");
});

test("energy uses 'household month' for ~MWh accumulations", () => {
  assert.strictEqual(formatEnergyEquivalent(2_000_000), "2.3 household months");
});

test("energy uses 'household year' for the largest long-term totals", () => {
  assert.strictEqual(formatEnergyEquivalent(15_000_000), "1.5 household years");
});

test("water shows fractional drops below the next tier", () => {
  assert.strictEqual(formatWaterEquivalent(0.76), "15.2 drops");
});

test("water clamps to 0.1 for sub-drop volumes", () => {
  assert.strictEqual(formatWaterEquivalent(0.001), "0.1 drops");
});

test("water uses tbsp with a fractional count in the 15–30 ml tier", () => {
  assert.strictEqual(formatWaterEquivalent(25), "1.7 tbsp");
});

test("water uses cups with one decimal in the 240–355 ml tier", () => {
  assert.strictEqual(formatWaterEquivalent(300), "1.3 cups");
});

test("water uses 1L bottles with one decimal in the 1000–3785 ml tier", () => {
  assert.strictEqual(formatWaterEquivalent(2200), "2.2 1L bottles");
});

test("water uses dish cycles with one decimal in the 10s of liters", () => {
  assert.strictEqual(formatWaterEquivalent(30000), "2.5 dish cycles");
});

test("water uses 'cubic meter' singular at exactly 1 m³", () => {
  assert.strictEqual(formatWaterEquivalent(1_000_000), "1 cubic meter");
});

test("water uses 'kg of beef' for very large totals", () => {
  assert.strictEqual(formatWaterEquivalent(30_000_000), "1.9 kg of beef");
});

test("water uses 'Olympic pool' at clean multiples", () => {
  assert.strictEqual(formatWaterEquivalent(5_000_000_000), "2 Olympic pools");
});

test("co2 clamps to 0.1 for sub-Google-search emissions", () => {
  assert.strictEqual(formatCo2Equivalent(0.001), "0.1 Google searches");
});

test("co2 uses Google searches with clean integer count", () => {
  assert.strictEqual(formatCo2Equivalent(0.18), "6 Google searches");
});

test("co2 uses 'min of streaming' with one decimal in the 0.6–4 g tier", () => {
  assert.strictEqual(formatCo2Equivalent(1.54), "2.6 min of streaming");
});

test("co2 uses 'EU car km' with one decimal in the 106–249 g tier", () => {
  assert.strictEqual(formatCo2Equivalent(200), "1.9 EU car km");
});

test("co2 uses 'kg of pork' with one decimal in the 12.31–23.9 kg tier", () => {
  assert.strictEqual(formatCo2Equivalent(20000), "1.6 kg of pork");
});

test("co2 uses 'NYC–London R/T' with one decimal for ~1.7 Mg totals", () => {
  assert.strictEqual(formatCo2Equivalent(1_800_000), "1.1 NYC–London R/T");
});

test("co2 uses 'US person-year' with one decimal for tonnes-scale", () => {
  assert.strictEqual(formatCo2Equivalent(30_000_000), "2.1 US person-years");
});

test("co2 uses 'ICE car lifetime' with one decimal for the largest totals", () => {
  assert.strictEqual(formatCo2Equivalent(100_000_000), "1.4 ICE car lifetimes");
});

test("co2 uses singular form for exact integer count of 1", () => {
  assert.strictEqual(formatCo2Equivalent(0.03), "1 Google search");
});
