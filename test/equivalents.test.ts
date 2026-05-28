import { test } from "node:test";
import assert from "node:assert/strict";
import {
  formatCo2Equivalent,
  formatEnergyEquivalent,
  formatWaterEquivalent,
} from "../src/equivalents";

// The picker rule: choose the largest equivalent whose unit cost is ≤ the value.
// Below the smallest unit cost, fall back to the smallest unit and clamp count ≥ 1.

test("energy below the smallest equivalent shows '1 min of LED bulb'", () => {
  assert.strictEqual(formatEnergyEquivalent(0.001), "1 min of LED bulb");
});

test("energy uses LED minutes for sub-Wh values", () => {
  assert.strictEqual(formatEnergyEquivalent(0.42), "3 min of LED bulb");
});

test("energy uses 'h of TV' in the 100–158 Wh tier", () => {
  assert.strictEqual(formatEnergyEquivalent(150), "2 h of TV");
});

test("energy uses 'h of gaming' in the 180–500 Wh tier", () => {
  assert.strictEqual(formatEnergyEquivalent(400), "2 h of gaming");
});

test("energy uses 'h of central AC' for mid-kWh totals", () => {
  assert.strictEqual(formatEnergyEquivalent(8000), "3 h of central AC");
});

test("energy uses 'Powerwall' in the 13.5–15 kWh tier", () => {
  assert.strictEqual(formatEnergyEquivalent(14000), "1 Powerwall");
});

test("energy uses 'Tesla M3 battery' for ~75 kWh sessions", () => {
  assert.strictEqual(formatEnergyEquivalent(150000), "2 Tesla M3 batteries");
});

test("energy uses 'household month' for ~MWh accumulations", () => {
  assert.strictEqual(formatEnergyEquivalent(2_000_000), "2 household months");
});

test("energy uses 'household year' for the largest long-term totals", () => {
  assert.strictEqual(formatEnergyEquivalent(15_000_000), "1 household year");
});

test("energy uses singular form when count rounds to 1", () => {
  assert.strictEqual(formatEnergyEquivalent(12), "1 phone charge");
});

test("water below the smallest equivalent shows '1 drop'", () => {
  assert.strictEqual(formatWaterEquivalent(0.01), "1 drop");
});

test("water uses drops for sub-teaspoon values", () => {
  assert.strictEqual(formatWaterEquivalent(0.76), "15 drops");
});

test("water uses tbsp in the 15–30 ml tier", () => {
  assert.strictEqual(formatWaterEquivalent(25), "2 tbsp");
});

test("water uses cups in the 240–355 ml tier (below soda-can)", () => {
  assert.strictEqual(formatWaterEquivalent(300), "1 cup");
});

test("water uses 1L bottles in the 1000–3785 ml tier", () => {
  assert.strictEqual(formatWaterEquivalent(2200), "2 1L bottles");
});

test("water uses dish cycles in the 10s of liters", () => {
  assert.strictEqual(formatWaterEquivalent(30000), "2 dish cycles");
});

test("water uses 'cubic meter' at the 1 m³ boundary", () => {
  assert.strictEqual(formatWaterEquivalent(1_050_000), "1 cubic meter");
});

test("water uses 'kg of beef' for very large totals", () => {
  assert.strictEqual(formatWaterEquivalent(30_000_000), "2 kg of beef");
});

test("water uses 'Olympic pool' for the largest accumulations", () => {
  assert.strictEqual(formatWaterEquivalent(5_000_000_000), "2 Olympic pools");
});

test("co2 below the smallest equivalent shows '1 Google search'", () => {
  assert.strictEqual(formatCo2Equivalent(0.001), "1 Google search");
});

test("co2 uses Google searches for fractional grams", () => {
  assert.strictEqual(formatCo2Equivalent(0.18), "6 Google searches");
});

test("co2 uses 'min of streaming' in the 0.6–4 g tier", () => {
  assert.strictEqual(formatCo2Equivalent(1.54), "3 min of streaming");
});

test("co2 uses 'EU car km' in the 106–249 g tier", () => {
  assert.strictEqual(formatCo2Equivalent(200), "2 EU car km");
});

test("co2 uses 'kg of potatoes' in the 460–4500 g tier", () => {
  assert.strictEqual(formatCo2Equivalent(900), "2 kg of potatoes");
});

test("co2 uses 'kg of pork' in the 12.31–23.9 kg tier", () => {
  assert.strictEqual(formatCo2Equivalent(20000), "2 kg of pork");
});

test("co2 uses 'short flight' for ~80 kg sessions", () => {
  assert.strictEqual(formatCo2Equivalent(160_000), "2 short flights");
});

test("co2 uses 'NYC–London R/T' for transatlantic-flight-scale totals", () => {
  assert.strictEqual(formatCo2Equivalent(1_800_000), "1 NYC–London R/T");
});

test("co2 uses 'US person-year' for tonnes-scale accumulations", () => {
  assert.strictEqual(formatCo2Equivalent(30_000_000), "2 US person-years");
});

test("co2 uses 'ICE car lifetime' for the largest long-term totals", () => {
  assert.strictEqual(formatCo2Equivalent(100_000_000), "1 ICE car lifetime");
});

test("co2 uses singular form when count rounds to 1", () => {
  assert.strictEqual(formatCo2Equivalent(0.03), "1 Google search");
});
