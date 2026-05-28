# claude-eco

Real-time energy, water, and CO₂ footprint for your Claude Code session, derived from token usage and rendered in the statusline.

```
Session  ⚡ 0.42 Wh  💧 0.76 ml  💨 0.18 g CO₂  ·  12 msgs  ·  Sonnet 4.6  ·  ⚡ 3 min of LED bulb
```

Energy is shown in green / amber / red bands based on session intensity. Units auto-scale (Wh → kWh, ml → L, g → kg → t). The trailing equivalent cycles through energy / water / CO₂ every 10 seconds. The line gracefully degrades on narrow terminals.

After 30 seconds of conversational idle, the view switches from `Session` to `Total` — cumulative usage across every session you've ever run.

## How it works

Claude Code invokes a statusline command on every refresh tick and pipes a JSON payload to stdin. `claude-eco` reads that payload, walks the session's transcript JSONL to compute cumulative token usage by channel (fresh input / cache write / cache read / output), applies the calibrated coefficients below, and prints a formatted line.

Per-session totals are persisted in `~/.claude/claude-eco-state.json` so they survive across ticks and feed the `Total` view across sessions.

## Setup

Once published to npm, the entire install is one line:

```bash
npm install -g claude-eco && claude-eco init
```

Until then, install from source:

```bash
git clone <repo-url>
cd claude-eco
npm install
npm run build
npm install -g .
claude-eco init
```

`claude-eco init` merges the `statusLine` block into `~/.claude/settings.json` (creating the file if needed), preserves any other settings you have, and prints a preview of what it wrote. It's idempotent — running it twice reports "already wired up." Re-running on a settings.json that already has a different `statusLine` will overwrite it after a warning.

To remove the wiring later: `claude-eco uninstall`. This refuses to touch a foreign `statusLine` (so if you've manually edited it, your changes are safe).

The generated block uses `refreshInterval: 10` — Claude Code's event-driven refresh only fires on new messages / mode changes, so without a timer the `Total` view never appears while you're idle and the cycled equivalent never advances. With `10`, both update on a 10-second cadence.

Open a new Claude Code session and the line appears at the bottom.

## Methodology

Every coefficient is traceable to a published source. Inline citations live in `src/calculator.ts` (per-token energy + water/CO₂ factors) and `src/equivalents.ts` (relatable equivalents). Where no direct measurement exists for Claude 4, the proxy is spelled out below.

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

### Equivalents

The trailing equivalent (`⚡ 3 min of LED bulb`, `💧 1 bath`, `💨 1 NYC–London R/T`, etc.) is chosen from a table of 81 sourced reference points (27 each for energy / water / CO₂). The picker selects the largest unit whose cost is ≤ the current value, so the count stays in a readable range across five orders of magnitude — from a light session (`⚡ 2 min of LED bulb`) to long-term accumulations (`⚡ 5 household years`).

Full citations for every equivalent live in the comment block at the top of [`src/equivalents.ts`](./src/equivalents.ts). Key sources by category:

- **Energy** — ENERGY STAR (lamps, computers, TVs, fridges, dishwashers, dryers, room AC), US DOE Energy Saver (ceiling fans, microwaves, ovens, central AC, water heaters, heat pumps), Apple iPhone spec, Tesla Powerwall datasheet, Nissan LEAF specs, Electrify America fast-charger spec, EIA US household electricity FAQ, NRDC console measurements.
- **Water** — EPA WaterSense (toilets, showers, faucets, outdoor use, statistics), USGS (water use 2015, evapotranspiration), NIST (volume units), FDA (reference amounts), Defra UK water indicators, UK Energy Saving Trust, ENERGY STAR (dishwashers, washers), Mekonnen & Hoekstra 2012 (food water footprints), FINA facilities rules (Olympic pool spec), WHO IV fluid guidance, peer-reviewed sip-volume study.
- **CO₂** — UK Defra/DESNZ 2024 GHG conversion factors (rail, bus, flights), EPA (typical passenger vehicle, eGRID), EEA new-car CO₂ register, IEA streaming-video commentary, Poore & Nemecek 2018 via Our World in Data (food LCAs), Steinberger et al. 2009 (apparel LCA), European Cyclists' Federation (bicycle LCA), EIA US emissions, Our World in Data India profile.

## Uncertainty & caveats

Treat the absolute numbers as ±50%. They are useful for ordering-of-magnitude intuition and for comparing sessions, not for carbon accounting.

- **No per-token energy figure is published for any Claude 4 model.** The Sonnet baseline is derived from Epoch AI's GPT-4o estimate (which Epoch describes as pessimistic) via Anthropic's input/output pricing ratio. Best available, not great.
- **Cache and tier ratios come from Anthropic's pricing.** Pricing reflects compute cost approximately but also includes infra amortization, margin, and positioning. For comparison, OpenAI prices cache reads at 0.5× input — same physics, different pricing — which suggests pricing is not a clean energy proxy.
- **Water and CO₂ factors are global averages.** Your actual data center region and the grid mix supplying it will differ. The figures here are intentionally single defensible numbers rather than region-aware estimates.
- **Equivalents have their own caveats.** Mekonnen & Hoekstra's water footprints include green water (rainfall that would have fallen anyway); blue-water-only figures for beef are ~30× smaller. Streaming-video CO₂ swings 10× by methodology — we use IEA's central 2019 figure. Food LCAs (Poore-Nemecek) are global averages over wildly different production systems.

## Limitations

- Since Claude Code v2.1.132, the statusline payload's `context_window.total_*_tokens` fields reflect the *current* context window, not cumulative session totals. `claude-eco` works around this by reading session totals from the transcript JSONL — if `transcript_path` is missing from the payload, metrics will read as zero.
- A "message" is counted as a distinct user `promptId` in the transcript. Tool-result follow-ups within the same turn do not double-count.
- "Idle" is defined as no `user` or `assistant` entry in the transcript within the last 30 seconds. Slowly typing a long prompt without sending it counts as idle (no entry is created until you send) — so the line may flip to `Total` mid-composition.

## Sources

### Coefficients (energy / water / CO₂ per token)

- Couch, S. — [Claude Code's environmental impact][couch] (Jan 2026)
- Epoch AI — [How much energy does ChatGPT use?][epoch] (Feb 2025)
- Anthropic — [Prompt caching documentation][caching]
- EESI — [Data Centers and Water Consumption][eesi] (Jun 2025)
- IEA — [Electricity 2025: Emissions chapter][iea] (2024 grid data)
- Jegham, N. et al. — [How Hungry is AI?][jegham] (May 2025, peer-reviewed methodology; no Claude 4 figures extractable)

### Equivalents — Energy

- [ENERGY STAR — Lamps][es-lamps], [Computers][es-computers], [TVs][es-tvs], [Refrigerators][es-fridge], [Dishwashers][es-dish], [Clothes Washers][es-wash], [Clothes Dryers][es-dryer], [Room AC][es-roomac]
- US DOE Energy Saver — [Ceiling Fans][doe-fan], [Microwaves][doe-microwave], [Conventional Cooking][doe-oven], [Central AC (FEMP)][doe-femp], [Water Heating][doe-water-heater], [Air-Source Heat Pumps][doe-heatpump], [Estimating Appliance Use][doe-appl]
- [EIA — How much electricity does an American home use?][eia-household]
- [Apple iPhone 13 Pro specs][apple-ip13], [Tesla Model 3 RWD on fueleconomy.gov][tesla-m3], [Tesla Powerwall 2 datasheet][tesla-powerwall], [Nissan LEAF range & battery][nissan-leaf]
- [Electrify America DC fast-charger spec][electrify]
- [NRDC — Latest Game Consoles][nrdc-consoles]

### Equivalents — Water

- EPA WaterSense — [Toilets][epa-toilet], [Showerheads][epa-shower], [Bathroom Faucets][epa-faucet], [Outdoor Water Use][epa-outdoor], [Statistics and Facts][epa-watersense]
- USGS — [Estimated Use of Water 2015][usgs-water], [Evapotranspiration][usgs-transpiration]
- [NIST — SI Units of Volume][nist-vol]
- [FDA — Reference Amounts][fda-can]
- [Defra UK — Environmental Indicator E8 (water)][defra-water]
- [UK Energy Saving Trust — Water and your home][est-water]
- [Mekonnen & Hoekstra 2012 — Water Footprint of Farm Animal Products (PDF)][mekonnen]
- [World Aquatics (FINA) — Facilities Rules (Olympic pool)][fina]
- [WHO IV Fluid Guidance][who-iv]
- Jelen, Lawless & Vukasin (1991), *Appetite* — sip volume study

### Equivalents — CO₂

- [UK Defra/DESNZ 2024 GHG Conversion Factors][defra-ghg]
- EPA — [Greenhouse Gas Emissions from a Typical Passenger Vehicle][epa-pv], [eGRID][epa-egrid]
- [EEA — CO₂ performance of new passenger cars][eea-car]
- [IEA — Carbon footprint of streaming video][iea-streaming]
- [Poore & Nemecek (2018), *Science* — via Our World in Data][poore]
- Steinberger et al. (2009), *J. Cleaner Production* — apparel LCA
- [European Cyclists' Federation — Bicycle LCA (PDF)][ecf]
- [EIA — Energy-related CO₂ emissions][eia-emissions]
- [Our World in Data — India CO₂ profile][owid-india]

[couch]: https://simonpcouch.com/blog/2026-01-20-cc-impact/
[epoch]: https://epoch.ai/gradient-updates/how-much-energy-does-chatgpt-use
[caching]: https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching
[eesi]: https://www.eesi.org/articles/view/data-centers-and-water-consumption
[iea]: https://www.iea.org/reports/electricity-2025/emissions
[jegham]: https://arxiv.org/abs/2505.09598

[es-lamps]: https://www.energystar.gov/products/light_bulbs
[es-computers]: https://www.energystar.gov/products/computers
[es-tvs]: https://www.energystar.gov/products/televisions
[es-fridge]: https://www.energystar.gov/products/refrigerators
[es-dish]: https://www.energystar.gov/products/dishwashers
[es-wash]: https://www.energystar.gov/products/clothes_washers
[es-dryer]: https://www.energystar.gov/products/clothes_dryers
[es-roomac]: https://www.energystar.gov/products/heating_cooling/air_conditioning_room
[doe-fan]: https://www.energy.gov/energysaver/ceiling-fans
[doe-microwave]: https://www.energy.gov/eere/buildings/standards-and-test-procedures-microwave-ovens
[doe-oven]: https://www.energy.gov/eere/buildings/standards-and-test-procedures-conventional-cooking-products
[doe-femp]: https://www.energy.gov/cmei/femp/purchasing-energy-efficient-residential-central-air-conditioners
[doe-water-heater]: https://www.energy.gov/energysaver/water-heating
[doe-heatpump]: https://www.energy.gov/energysaver/air-source-heat-pumps
[doe-appl]: https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use
[eia-household]: https://www.eia.gov/tools/faqs/faq.php?id=97&t=3
[apple-ip13]: https://www.apple.com/iphone-13-pro/specs/
[tesla-m3]: https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=46206
[tesla-powerwall]: https://www.tesla.com/sites/default/files/pdfs/powerwall/Powerwall%202_AC_Datasheet_en_northamerica.pdf
[nissan-leaf]: https://www1.nissanusa.com/vehicles/electric-cars/leaf/features/range-charging-battery.html
[electrify]: https://www.electrifyamerica.com/what-to-expect/
[nrdc-consoles]: https://www.nrdc.org/bio/noah-horowitz/latest-game-consoles-environmental-winners-or-losers

[epa-toilet]: https://www.epa.gov/watersense/residential-toilets
[epa-shower]: https://www.epa.gov/watersense/showerheads
[epa-faucet]: https://www.epa.gov/watersense/bathroom-faucets
[epa-outdoor]: https://www.epa.gov/watersense/outdoor-water-use-home
[epa-watersense]: https://www.epa.gov/watersense/statistics-and-facts
[usgs-water]: https://www.usgs.gov/mission-areas/water-resources/science/water-use-united-states
[usgs-transpiration]: https://www.usgs.gov/special-topics/water-science-school/science/evapotranspiration-water-cycle
[nist-vol]: https://www.nist.gov/pml/owm/si-units-volume
[fda-can]: https://www.fda.gov/food/food-labeling-nutrition/reference-amounts-customarily-consumed-list-values-emergency-use
[defra-water]: https://oifdata.defra.gov.uk/themes/natural-resources/E8/
[est-water]: https://energysavingtrust.org.uk/advice/water-and-your-home/
[mekonnen]: https://www.waterfootprint.org/resources/Mekonnen-Hoekstra-2012-WaterFootprintFarmAnimalProducts_1.pdf
[fina]: https://resources.fina.org/fina/document/2021/01/12/916f78fa-708e-4c66-940f-cbe839de9a40/2017-2021_facilities_16032018.pdf
[who-iv]: https://www.who.int/publications/i/item/9241546840

[defra-ghg]: https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
[epa-pv]: https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle
[epa-egrid]: https://www.epa.gov/egrid
[eea-car]: https://www.eea.europa.eu/en/analysis/indicators/co2-performance-of-new-passenger
[iea-streaming]: https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines
[poore]: https://ourworldindata.org/grapher/ghg-per-kg-poore
[ecf]: https://ecf.com/files/wp-content/uploads/ECF_BROCHURE_EN_planche.pdf
[eia-emissions]: https://www.eia.gov/environment/emissions/carbon/
[owid-india]: https://ourworldindata.org/profile/co2/india
