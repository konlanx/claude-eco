import { test } from "node:test";
import assert from "node:assert/strict";
import { terminalSupportsEmoji, type Environment } from "../src/emoji-support";

const modernUtf8Environment: Environment = {
  LANG: "en_US.UTF-8",
  TERM: "xterm-256color",
};

test("returns true for a modern UTF-8 terminal with no special markers", () => {
  assert.strictEqual(terminalSupportsEmoji(modernUtf8Environment), true);
});

test("respects CLAUDE_ECO_NO_EMOJI=1 as an explicit override", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ ...modernUtf8Environment, CLAUDE_ECO_NO_EMOJI: "1" }),
    false,
  );
});

test("respects CLAUDE_ECO_NO_EMOJI=true and is case-insensitive", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ ...modernUtf8Environment, CLAUDE_ECO_NO_EMOJI: "TRUE" }),
    false,
  );
});

test("ignores CLAUDE_ECO_NO_EMOJI=0 (falsy values keep emoji enabled)", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ ...modernUtf8Environment, CLAUDE_ECO_NO_EMOJI: "0" }),
    true,
  );
});

test("detects Android Studio / IntelliJ via TERMINAL_EMULATOR=JetBrains-JediTerm", () => {
  assert.strictEqual(
    terminalSupportsEmoji({
      ...modernUtf8Environment,
      TERMINAL_EMULATOR: "JetBrains-JediTerm",
    }),
    false,
  );
});

test("treats TERM=dumb as unable to render emoji", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ ...modernUtf8Environment, TERM: "dumb" }),
    false,
  );
});

test("treats a non-UTF-8 locale as unable to render emoji", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ TERM: "xterm-256color", LANG: "C" }),
    false,
  );
});

test("accepts utf8 spelled without a hyphen (en_US.utf8)", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ TERM: "xterm-256color", LANG: "en_US.utf8" }),
    true,
  );
});

test("falls back to LC_CTYPE / LC_ALL when LANG is unset", () => {
  assert.strictEqual(
    terminalSupportsEmoji({ TERM: "xterm-256color", LC_CTYPE: "C" }),
    false,
  );
  assert.strictEqual(
    terminalSupportsEmoji({ TERM: "xterm-256color", LC_ALL: "en_US.UTF-8" }),
    true,
  );
});

test("treats absent locale variables as 'unknown — assume default UTF-8'", () => {
  assert.strictEqual(terminalSupportsEmoji({ TERM: "xterm-256color" }), true);
});

test("known-bad terminal + CLAUDE_ECO_NO_EMOJI=1 stays disabled (redundant but consistent)", () => {
  assert.strictEqual(
    terminalSupportsEmoji({
      ...modernUtf8Environment,
      TERMINAL_EMULATOR: "JetBrains-JediTerm",
      CLAUDE_ECO_NO_EMOJI: "1",
    }),
    false,
  );
});
