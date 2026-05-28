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
  trailingSegment: "⚡ 3 min of LED bulb",
  availableColumns: 200,
  ...overrides,
});

test("full layout includes raw metrics, all right segments, and trailing equivalent", () => {
  const rendered = stripAnsi(renderStatuslineFor(buildInput()));
  assert.match(rendered, /⚡ 0\.42 Wh/);
  assert.match(rendered, /💧 0\.76 ml/);
  assert.match(rendered, /💨 0\.18 g CO₂/);
  assert.match(rendered, /12 msgs/);
  assert.match(rendered, /Sonnet 4\.6/);
  assert.match(rendered, /⚡ 3 min of LED bulb$/);
});

test("trailing equivalent renders after right segments, separated by ·", () => {
  const rendered = stripAnsi(renderStatuslineFor(buildInput()));
  assert.match(rendered, /Sonnet 4\.6\s+·\s+⚡ 3 min of LED bulb/);
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

test("when full doesn't fit, drops the model name first — msgs and trailing stay", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ availableColumns: 80 })),
  );
  assert.match(rendered, /12 msgs/);
  assert.match(rendered, /⚡ 3 min of LED bulb/);
  assert.doesNotMatch(rendered, /Sonnet/);
});

test("when narrower, drops all right segments before dropping the trailing equivalent", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ availableColumns: 70 })),
  );
  assert.match(rendered, /⚡ 3 min of LED bulb/);
  assert.doesNotMatch(rendered, /msgs/);
  assert.doesNotMatch(rendered, /Sonnet/);
});

test("minimal layout drops everything but metrics for very narrow terminals", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ availableColumns: 40 })),
  );
  assert.doesNotMatch(rendered, /min of LED bulb/);
  assert.doesNotMatch(rendered, /msgs/);
  assert.doesNotMatch(rendered, /Sonnet/);
  assert.match(rendered, /⚡ 0\.42 Wh/);
  assert.match(rendered, /💧 0\.76 ml/);
  assert.match(rendered, /💨 0\.18 g CO₂/);
});

test("a DisplayInput with no trailing segment renders cleanly without a dangling separator", () => {
  const rendered = stripAnsi(
    renderStatuslineFor(buildInput({ trailingSegment: undefined, rightSegments: [] })),
  );
  assert.doesNotMatch(rendered, /·/);
});

test("rendered line resets ANSI styling — no dangling escape state", () => {
  const rendered = renderStatuslineFor(buildInput());
  assert.ok(rendered.endsWith("\x1b[0m"), "expected trailing ANSI reset");
});
