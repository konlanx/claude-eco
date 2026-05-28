import { test } from "node:test";
import assert from "node:assert/strict";
import { renderStatuslineFor, type DisplayInput } from "../src/display";

const ANSI_ESCAPE_PATTERN = /\x1b\[[0-9;]*m/g;

const stripAnsi = (text: string): string => text.replace(ANSI_ESCAPE_PATTERN, "");

const ANSI_GREEN = "\x1b[32m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_RED = "\x1b[31m";

const buildInput = (overrides: Partial<DisplayInput> = {}): DisplayInput => ({
  metrics: {
    energy: { wattHours: 0.42 },
    water: { milliliters: 0.76 },
    co2: { grams: 0.18 },
  },
  rightSegments: ["12 msgs", "Sonnet 4.6"],
  availableColumns: 200,
  ...overrides,
});

test("full layout includes raw metrics, equivalents, and all right segments", () => {
  const rendered = stripAnsi(renderStatuslineFor(buildInput()));
  assert.match(rendered, /⚡ 0\.42 Wh/);
  assert.match(rendered, /💧 0\.76 ml/);
  assert.match(rendered, /💨 0\.18 g CO₂/);
  assert.match(rendered, /\(\d+s of TV\)/);
  assert.match(rendered, /\(\d+ drops\)/);
  assert.match(rendered, /\(\d+m of driving\)/);
  assert.match(rendered, /12 msgs/);
  assert.match(rendered, /Sonnet 4\.6/);
});

test("energy scales Wh → kWh at the 1000 Wh threshold", () => {
  const stayedWh = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 999 }, water: { milliliters: 0 }, co2: { grams: 0 } },
      }),
    ),
  );
  assert.match(stayedWh, /⚡ 999\.00 Wh/);
  const becameKWh = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 1500 }, water: { milliliters: 0 }, co2: { grams: 0 } },
      }),
    ),
  );
  assert.match(becameKWh, /⚡ 1\.50 kWh/);
});

test("water scales ml → L at the 1000 ml threshold", () => {
  const stayedMl = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 0 }, water: { milliliters: 999 }, co2: { grams: 0 } },
      }),
    ),
  );
  assert.match(stayedMl, /💧 999\.00 ml/);
  const becameLiters = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 0 }, water: { milliliters: 2500 }, co2: { grams: 0 } },
      }),
    ),
  );
  assert.match(becameLiters, /💧 2\.50 L/);
});

test("co2 scales g → kg at 1000, kg → t at 1,000,000", () => {
  const stayedGrams = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 0 }, water: { milliliters: 0 }, co2: { grams: 999 } },
      }),
    ),
  );
  assert.match(stayedGrams, /💨 999\.00 g CO₂/);
  const becameKg = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 0 }, water: { milliliters: 0 }, co2: { grams: 3500 } },
      }),
    ),
  );
  assert.match(becameKg, /💨 3\.50 kg CO₂/);
  const becameTonnes = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: { energy: { wattHours: 0 }, water: { milliliters: 0 }, co2: { grams: 1_500_000 } },
      }),
    ),
  );
  assert.match(becameTonnes, /💨 1\.50 t CO₂/);
});

test("left label is prepended in bold when provided (e.g. Session / Total)", () => {
  const rendered = renderStatuslineFor(buildInput({ leftLabel: "Total" }));
  const stripped = stripAnsi(rendered);
  assert.match(stripped, /^Total {2}⚡/);
  assert.ok(rendered.includes("\x1b[1mTotal"), "expected bold ANSI code on label");
});

test("low energy (<0.5 Wh) is rendered in green", () => {
  const rendered = renderStatuslineFor(buildInput());
  assert.ok(rendered.includes(ANSI_GREEN), "expected green ANSI code");
});

test("medium energy (0.5–2 Wh) is rendered in yellow", () => {
  const rendered = renderStatuslineFor(
    buildInput({
      metrics: {
        energy: { wattHours: 1.0 },
        water: { milliliters: 1.8 },
        co2: { grams: 0.429 },
      },
    }),
  );
  assert.ok(rendered.includes(ANSI_YELLOW), "expected yellow ANSI code");
});

test("high energy (>2 Wh) is rendered in red", () => {
  const rendered = renderStatuslineFor(
    buildInput({
      metrics: {
        energy: { wattHours: 5.0 },
        water: { milliliters: 9.0 },
        co2: { grams: 2.15 },
      },
    }),
  );
  assert.ok(rendered.includes(ANSI_RED), "expected red ANSI code");
});

test("compact layout drops equivalents when full doesn't fit", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ availableColumns: 90 })),
  );
  assert.doesNotMatch(rendered, /\(\d+s of TV\)/);
  assert.match(rendered, /⚡ 0\.42 Wh/);
  assert.match(rendered, /12 msgs/);
});

test("minimal layout drops right segments when compact still overflows", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ availableColumns: 30 })),
  );
  assert.doesNotMatch(rendered, /msgs/);
  assert.doesNotMatch(rendered, /Sonnet/);
  assert.match(rendered, /⚡ 0\.42 Wh/);
  assert.match(rendered, /💧 0\.76 ml/);
  assert.match(rendered, /💨 0\.18 g CO₂/);
});

test("empty right segments produce metrics-only output without trailing separator", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ rightSegments: [] })),
  );
  assert.doesNotMatch(rendered, /·/);
});

test("equivalents never round below 1 — small metrics still report a number", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(
      buildInput({
        metrics: {
          energy: { wattHours: 0.001 },
          water: { milliliters: 0.001 },
          co2: { grams: 0.001 },
        },
      }),
    ),
  );
  assert.match(rendered, /\(1s of TV\)/);
  assert.match(rendered, /\(1 drops\)/);
  assert.match(rendered, /\(1m of driving\)/);
});

test("rendered line resets ANSI styling — no dangling escape state", () => {
  const rendered = renderStatuslineFor(buildInput());
  assert.ok(rendered.endsWith("\x1b[0m"), "expected trailing ANSI reset");
});
