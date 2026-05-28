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
  modelDisplayName: "Sonnet 4.6",
  messageCount: 12,
  availableColumns: 200,
  ...overrides,
});

test("full layout includes raw metrics, equivalents, msg count, and model", () => {
  const rendered = stripAnsi(renderStatuslineFor(buildInput()));
  assert.match(rendered, /⚡ 0\.42Wh/);
  assert.match(rendered, /💧 0\.76ml/);
  assert.match(rendered, /💨 0\.18g CO₂/);
  assert.match(rendered, /\(\d+s of TV\)/);
  assert.match(rendered, /\(\d+ drops\)/);
  assert.match(rendered, /\(\d+m of driving\)/);
  assert.match(rendered, /12 msgs/);
  assert.match(rendered, /Sonnet 4\.6/);
});

test("low energy (<0.5 Wh) is rendered in green", () => {
  const rendered = renderStatuslineFor(buildInput());
  assert.ok(rendered.includes(ANSI_GREEN), "expected green ANSI code");
});

test("medium energy (0.5–2 Wh) is rendered in yellow", () => {
  const rendered = renderStatuslineFor(
    buildInput({ metrics: {
      energy: { wattHours: 1.0 },
      water: { milliliters: 1.8 },
      co2: { grams: 0.429 },
    } }),
  );
  assert.ok(rendered.includes(ANSI_YELLOW), "expected yellow ANSI code");
});

test("high energy (>2 Wh) is rendered in red", () => {
  const rendered = renderStatuslineFor(
    buildInput({ metrics: {
      energy: { wattHours: 5.0 },
      water: { milliliters: 9.0 },
      co2: { grams: 2.15 },
    } }),
  );
  assert.ok(rendered.includes(ANSI_RED), "expected red ANSI code");
});

test("compact layout drops equivalents when full doesn't fit", () => {
  const rendered = stripAnsi(renderStatuslineFor(buildInput({ availableColumns: 60 })));
  assert.doesNotMatch(rendered, /\(\d+s of TV\)/);
  assert.match(rendered, /⚡ 0\.42Wh/);
  assert.match(rendered, /12 msgs/);
});

test("minimal layout drops msg count and model when compact still overflows", () => {
  const rendered = stripAnsi(renderStatuslineFor(buildInput({ availableColumns: 30 })));
  assert.doesNotMatch(rendered, /msgs/);
  assert.doesNotMatch(rendered, /Sonnet/);
  assert.match(rendered, /⚡ 0\.42Wh/);
  assert.match(rendered, /💧 0\.76ml/);
  assert.match(rendered, /💨 0\.18g CO₂/);
});

test("equivalents never round below 1 — small metrics still report a number", () => {
  const rendered = stripAnsi(renderStatuslineFor(
    buildInput({ metrics: {
      energy: { wattHours: 0.001 },
      water: { milliliters: 0.001 },
      co2: { grams: 0.001 },
    } }),
  ));
  assert.match(rendered, /\(1s of TV\)/);
  assert.match(rendered, /\(1 drops\)/);
  assert.match(rendered, /\(1m of driving\)/);
});

test("rendered line resets ANSI styling — no dangling escape state", () => {
  const rendered = renderStatuslineFor(buildInput());
  assert.ok(rendered.endsWith("\x1b[0m"), "expected trailing ANSI reset");
});
