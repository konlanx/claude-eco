# claude-eco

Show the energy, water, and CO₂ footprint of your Claude Code session — live in the statusline.

```
Session  ⚡ 0.42 Wh  💧 0.76 ml  💨 0.18 g CO₂  ·  12 msgs  ·  Sonnet 4.6  ·  ⚡ 3 min of LED bulb
```

[![npm](https://img.shields.io/npm/v/claude-eco.svg)](https://www.npmjs.com/package/claude-eco)
[![CI](https://github.com/konlanx/claude-eco/actions/workflows/ci.yml/badge.svg)](https://github.com/konlanx/claude-eco/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

Numbers grow as you work. Color flips green → amber → red as energy intensity rises. Units auto-scale (Wh → kWh, ml → L, g → kg → t). Every 10 seconds the trailing equivalent rotates through energy, water, and CO₂.

## Install

```bash
npm install -g claude-eco && claude-eco init
```

That's it. `init` merges the statusline config into `~/.claude/settings.json`, preserving anything else you have there. Open a new Claude Code session and the line appears at the bottom.

To remove the wiring: `claude-eco uninstall`.

Requires Node 20+ and Claude Code v2.1.132 or newer.

## What you see

Two modes adapt to your activity:

**Session** — the current Claude Code conversation, shown while you're working:

```
Session  ⚡ 0.42 Wh  💧 0.76 ml  💨 0.18 g CO₂  ·  12 msgs  ·  Sonnet 4.6  ·  ⚡ 3 min of LED bulb
```

**Total** — cumulative across every session you've ever run, shown after 30 seconds of conversational idle:

```
Total  ⚡ 8.63 kWh  💧 55.57 L  💨 3.84 kg CO₂  ·  7 sessions  ·  ⚡ 5 h of oven
```

The trailing element (`⚡ 3 min of LED bulb`, `💧 1 bath`, `💨 1 NYC–London R/T`, etc.) is a relatable equivalent picked from a table of 81 sourced reference points. It cycles between the three metrics on a 10-second timer, choosing the largest unit whose cost is ≤ your current usage — so the count stays readable from a fresh session up to long-term accumulations.

On narrow terminals the line degrades gracefully: the model name drops first, then the message count, then the trailing equivalent, finally leaving just the three metrics.

## How it works

Claude Code calls a statusline command on every refresh tick and pipes session metadata to stdin. `claude-eco` reads the payload, walks the session's transcript JSONL to compute cumulative token usage by channel (fresh input / cache write / cache read / output), applies the calibrated coefficients, and prints a formatted line. Per-session totals are persisted to `~/.claude/claude-eco-state.json` to feed the cross-session Total view.

## Methodology

Every coefficient is traceable to a published source. Full inline citations live in [`src/calculator.ts`](./src/calculator.ts) (per-token coefficients + water/CO₂ factors) and [`src/equivalents.ts`](./src/equivalents.ts) (the equivalents table).

### Energy per token

Baseline rates for Sonnet 4:

| Channel | Wh per token | Source |
|---|---|---|
| Fresh input | 0.00039 | [Couch 2026][couch] derived from [Epoch AI 2025][epoch] |
| Cache write | 0.0004875 (1.25× fresh) | [Anthropic pricing][caching] |
| Cache read | 0.000039 (0.10× fresh) | [Anthropic pricing][caching] |
| Output | 0.00195 (5× fresh) | [Couch 2026][couch] |

Tier multipliers applied to the Sonnet baseline:

| Tier | Multiplier | Source |
|---|---|---|
| Opus | 5× | Anthropic per-Mtok pricing |
| Sonnet | 1× | baseline |
| Haiku | 1/3× | Anthropic per-Mtok pricing |

### Water

**6.44 ml per Wh** — on-site data center water (1.9 L/kWh) plus indirect power-generation water (4.54 L/kWh), [EESI 2025][eesi]. Including both reflects the full water footprint, not just the cooling number operators typically publish.

### CO₂

**0.445 g per Wh** — global average grid intensity for 2024, [IEA Electricity 2025][iea].

### Equivalents

81 reference points — 27 each for energy, water, and CO₂ — drawn from authoritative sources including EPA, US DOE, ENERGY STAR, EIA, IEA, UK Defra/DESNZ, EEA, USGS, NIST, FDA, the WHO, peer-reviewed life-cycle assessments (Poore & Nemecek 2018; Mekonnen & Hoekstra 2012; Steinberger et al. 2009; European Cyclists' Federation), and manufacturer specifications (Tesla Powerwall and Model 3, Nissan LEAF, Apple iPhone). The complete per-entry citation list with primary-source URLs is in [`src/equivalents.ts`](./src/equivalents.ts).

## Caveats

Treat absolute numbers as ±50%. They're useful for ordering-of-magnitude intuition and session-to-session comparison, not for carbon accounting.

- **No per-token energy is published for any Claude 4 model.** The Sonnet baseline is derived from Epoch AI's GPT-4o estimate (which Epoch itself describes as pessimistic) via Anthropic's input/output pricing ratio.
- **Cache and tier ratios come from Anthropic's pricing**, not measured energy. Pricing reflects compute cost approximately but also includes margin and positioning — OpenAI prices cache reads at 0.5× (vs Anthropic's 0.10×), same physics, suggesting pricing is not a clean energy proxy.
- **Water and CO₂ factors are global averages.** Your actual data center region and the grid mix supplying it will differ.
- **Slow typing counts as idle.** Activity detection uses transcript timestamps; if you compose a prompt for more than 30 seconds without sending, the line flips to Total mid-composition.

## License

MIT — see [LICENSE](./LICENSE).

[couch]: https://simonpcouch.com/blog/2026-01-20-cc-impact/
[epoch]: https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
[caching]: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
[eesi]: https://www.eesi.org/articles/view/data-centers-and-water-consumption
[iea]: https://www.iea.org/reports/electricity-2025/emissions
