# claude-eco

Real-time energy, water, and CO₂ footprint for your Claude Code session, derived from token usage and rendered in the statusline.

```
⚡ 31.42Wh (629s of TV)  💧 202.34ml (4047 drops)  💨 13.98g CO₂ (93m of driving)  ·  12 msgs  ·  Sonnet 4.6
```

Energy is shown in green / amber / red bands based on session intensity. The line gracefully degrades on narrow terminals.

## How it works

Claude Code invokes a statusline command on every refresh tick and pipes a JSON payload to stdin. `claude-eco` reads that payload, walks the session's transcript JSONL to compute cumulative token usage by channel (fresh input / cache write / cache read / output), applies the calibrated coefficients below, and prints a formatted line.

Session totals are persisted in `~/.claude/claude-eco-state.json` so they survive across ticks and are queryable later.

## Setup

This project is not on npm yet. Install from source:

```bash
git clone <repo-url>
cd claude-eco
npm install
npm run build
```

Then add to `~/.claude/settings.json` (create the file with `{}` if it does not exist):

```json
{
  "statusLine": {
    "type": "command",
    "command": "node /absolute/path/to/claude-eco/dist/index.js"
  }
}
```

Open a new Claude Code session and the line appears at the bottom.

## Methodology

Every coefficient is traceable to a published source. Inline citations live in `src/calculator.ts`. Where no direct measurement exists for Claude 4, the proxy is spelled out below.

### Energy per token

Baseline rates (Sonnet 4):

| Channel | Wh per token | Basis |
|---|---|---|
| Fresh input | 0.00039 | [Couch 2026][couch] derived from [Epoch AI 2025][epoch] |
| Cache write | 0.0004875 (1.25× fresh) | [Anthropic pricing][caching] |
| Cache read | 0.000039 (0.10× fresh) | [Anthropic pricing][caching] |
| Output | 0.00195 (5× fresh, matches API price ratio) | [Couch 2026][couch] |

Tier multipliers applied to the Sonnet baseline:

| Tier | Multiplier | Basis |
|---|---|---|
| Opus | 5× | Anthropic input pricing ($15 vs $3 / Mtok) |
| Sonnet | 1× | baseline |
| Haiku | 1/3× | Anthropic input pricing ($1 vs $3 / Mtok) |
| Unknown | 1× | Sonnet-equivalent fallback |

### Water

**6.44 ml per Wh** (≈ 6.44 L per kWh) — [EESI 2025][eesi]: 1.9 L/kWh on-site (data center cooling) plus 4.54 L/kWh indirect (power-generation water). Including both reflects the full water footprint, not just the cooling number operators typically publish.

### CO₂

**0.445 g per Wh** (≈ 445 g per kWh) — [IEA Electricity 2025 — Emissions][iea], global average grid intensity for 2024.

## Uncertainty & caveats

Treat the absolute numbers as ±50%. They are useful for ordering-of-magnitude intuition and for comparing sessions, not for carbon accounting.

- **No per-token energy figure is published for any Claude 4 model.** The Sonnet baseline is derived from Epoch AI's GPT-4o estimate (which Epoch describes as pessimistic) via Anthropic's input/output pricing ratio. Best available, not great.
- **Cache and tier ratios come from Anthropic's pricing.** Pricing reflects compute cost approximately but also includes infra amortization, margin, and positioning. For comparison, OpenAI prices cache reads at 0.5× input — same physics, different pricing — which suggests pricing is not a clean energy proxy.
- **Water and CO₂ factors are global averages.** Your actual data center region and the grid mix supplying it will differ. The figures here are intentionally single defensible numbers rather than region-aware estimates.

## Limitations

- Since Claude Code v2.1.132, the statusline payload's `context_window.total_*_tokens` fields reflect the *current* context window, not cumulative session totals. `claude-eco` works around this by reading session totals from the transcript JSONL — if `transcript_path` is missing from the payload, metrics will read as zero.
- A "message" is counted as a distinct user `promptId` in the transcript. Tool-result follow-ups within the same turn do not double-count.

## Sources

- Couch, S. — [Claude Code's environmental impact][couch] (Jan 2026)
- Epoch AI — [How much energy does ChatGPT use?][epoch] (Feb 2025)
- Anthropic — [Prompt caching documentation][caching]
- EESI — [Data Centers and Water Consumption][eesi] (Jun 2025)
- IEA — [Electricity 2025: Emissions chapter][iea] (2024 grid data)
- Jegham, N. et al. — [How Hungry is AI?][jegham] (May 2025, peer-reviewed methodology; no Claude 4 figures extractable)

[couch]: https://simonpcouch.com/blog/2026-01-20-cc-impact/
[epoch]: https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
[caching]: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
[eesi]: https://www.eesi.org/articles/view/data-centers-and-water-consumption
[iea]: https://www.iea.org/reports/electricity-2025/emissions
[jegham]: https://arxiv.org/abs/2505.09598
