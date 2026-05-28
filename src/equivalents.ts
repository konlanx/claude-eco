/*
 * Equivalent sources — every unitCost below is taken from a published reference.
 * Where the original figure uses different units, the conversion is shown.
 *
 * ─────────────────────────  ENERGY (Wh)  ─────────────────────────
 *   [ESTAR-LAMPS]      ENERGY STAR Lamps V2.1 (9 W typical 60 W-equivalent LED)
 *                      https://www.energystar.gov/products/light_bulbs
 *   [APPLE-IP13]       iPhone 13 Pro battery: 3095 mAh × 3.83 V = 11.85 Wh
 *                      https://www.apple.com/iphone-13-pro/specs/
 *   [DOE-MICROWAVE]    US DOE appliance standards (1000 W reference rating)
 *                      https://www.energy.gov/eere/buildings/standards-and-test-procedures-microwave-ovens
 *   [KETTLE-CUP]       240 g × 80 °C × 4.186 J/g/°C ÷ 3600 ÷ 0.85 eff = 22 Wh
 *   [ESTAR-LAPTOP]     ENERGY STAR Computers (10–60 W; 30 W middle estimate)
 *                      https://www.energystar.gov/products/computers
 *   [DOE-CEILING-FAN]  US DOE Energy Saver — Ceiling Fans (60 W typical)
 *                      https://www.energy.gov/energysaver/ceiling-fans
 *   [ESTAR-TV]         ENERGY STAR Televisions (100 W typical 50–55" LED)
 *                      https://www.energystar.gov/products/televisions
 *   [TESLA-M3]         Tesla Model 3 RWD on EPA fueleconomy.gov (255 Wh/mi = 158 Wh/km)
 *                      https://www.fueleconomy.gov/feg/Find.do?action=sbs&id=46206
 *   [NRDC-CONSOLES]    NRDC console measurements (PS5/Xbox SX, ~180 W active)
 *                      https://www.nrdc.org/bio/noah-horowitz/latest-game-consoles-environmental-winners-or-losers
 *   [ESTAR-WASH-E]     ENERGY STAR Clothes Washers (~500 Wh/cycle, cold)
 *                      https://www.energystar.gov/products/clothes_washers
 *   [DOE-APPL]         US DOE Energy Saver — Estimating Appliance Energy Use (air fryer ~1500 W × 30 min)
 *                      https://www.energy.gov/energysaver/estimating-appliance-and-home-electronic-energy-use
 *   [ESTAR-ROOM-AC]    ENERGY STAR Room AC criteria (mid-size 1 kW)
 *                      https://www.energystar.gov/products/heating_cooling/air_conditioning_room
 *   [ESTAR-FRIDGE]     ENERGY STAR Refrigerators (~400 kWh/yr ÷ 365 ≈ 1100 Wh/day)
 *                      https://www.energystar.gov/products/refrigerators
 *   [ESTAR-DRYER]      ENERGY STAR Residential Clothes Dryers scoping (~2.15 kWh/cycle)
 *                      https://www.energystar.gov/products/clothes_dryers
 *   [DOE-OVEN]         US DOE conventional cooking products (~2.3 kW typical)
 *                      https://www.energy.gov/eere/buildings/standards-and-test-procedures-conventional-cooking-products
 *   [DOE-FEMP-CAC]     US DOE FEMP central AC reference (3 ton, SEER 14)
 *                      https://www.energy.gov/cmei/femp/purchasing-energy-efficient-residential-central-air-conditioners
 *   [DOE-WATER-HEATER] US DOE — Water heating basics (storage tank, family of 4)
 *                      https://www.energy.gov/energysaver/water-heating
 *   [TESLA-POWERWALL]  Tesla Powerwall 2 datasheet (13.5 kWh usable)
 *                      https://www.tesla.com/sites/default/files/pdfs/powerwall/Powerwall%202_AC_Datasheet_en_northamerica.pdf
 *   [DOE-HEAT-PUMP]    US DOE Energy Saver — Air-source heat pumps (~5475 kWh/yr avg)
 *                      https://www.energy.gov/energysaver/air-source-heat-pumps
 *   [ELECTRIFY-AMERICA] DC fast-charger spec (150 kW × 10 min = 25 kWh)
 *                      https://www.electrifyamerica.com/what-to-expect/
 *   [NISSAN-LEAF]      Nissan LEAF range & battery (40 kWh gross pack)
 *                      https://www1.nissanusa.com/vehicles/electric-cars/leaf/features/range-charging-battery.html
 *   [TESLA-M3-BATTERY] Tesla Model 3 LR (75 kWh usable, ~82 kWh gross, EPA/CARB filings)
 *                      https://en.wikipedia.org/wiki/Tesla_Model_3
 *   [EIA-HOUSEHOLD]    EIA — US household electricity (10,260 kWh/yr avg, 2023)
 *                      https://www.eia.gov/tools/faqs/faq.php?id=97&t=3
 *
 * ─────────────────────────  WATER (ml)  ─────────────────────────
 *   [WHO-DROP]         WHO IV fluid guidance: 20 gtt/ml (= 50 µl/drop)
 *                      https://www.who.int/publications/i/item/9241546840
 *   [NIST-VOL]         NIST Handbook 44 / SI units of volume
 *                      https://www.nist.gov/pml/owm/si-units-volume
 *   [SIP-STUDY]        Jelen, Lawless & Vukasin (1991), Appetite — sip volume study
 *                      https://www.sciencedirect.com/journal/appetite
 *   [FDA-CAN]          FDA reference amounts — 12 fl oz soft-drink can (355 ml)
 *                      https://www.fda.gov/food/food-labeling-nutrition/reference-amounts-customarily-consumed-list-values-emergency-use
 *   [EPA-TOILET]       EPA WaterSense toilets: 1.28 gpf = 4.85 L
 *                      https://www.epa.gov/watersense/residential-toilets
 *   [EPA-SHOWER]       EPA WaterSense showerheads: 2.0 gpm = 7.57 L/min
 *                      https://www.epa.gov/watersense/showerheads
 *   [ESTAR-DISH]       ENERGY STAR Dishwashers: 3.2 gal/cycle max = 12.1 L
 *                      https://www.energystar.gov/products/dishwashers
 *   [ESTAR-WASH-W]     ENERGY STAR Clothes Washers: 13 gal/load front-load = 49 L
 *                      https://www.energystar.gov/products/clothes_washers
 *   [EPA-FAUCET]       EPA WaterSense bathroom faucets (~6 L/min hand-wash 10 min)
 *                      https://www.epa.gov/watersense/bathroom-faucets
 *   [EST-BATH]         UK Energy Saving Trust: half-filled bath ≈ 80 L
 *                      https://energysavingtrust.org.uk/advice/water-and-your-home/
 *   [DEFRA-UK-WATER]   Defra Environmental Indicator E8 — UK person/day 142 L
 *                      https://oifdata.defra.gov.uk/themes/natural-resources/E8/
 *   [EPA-OUTDOOR]      EPA WaterSense outdoor water use — DIY car wash ~180 L
 *                      https://www.epa.gov/watersense/outdoor-water-use-home
 *   [USGS-WATER-USE]   USGS Estimated Use of Water 2015 — US person/day 310 L (83 gal)
 *                      https://www.usgs.gov/mission-areas/water-resources/science/water-use-united-states
 *   [EPA-WATERSENSE]   EPA WaterSense — US household ~1135 L/day; indoor ~110 m³/yr
 *                      https://www.epa.gov/watersense/statistics-and-facts
 *   [MEKONNEN-HOEKSTRA] Mekonnen & Hoekstra (2012) — global water footprints (chicken 4325, cheese 5060, pork 5990, beef 15400 L/kg)
 *                      https://www.waterfootprint.org/resources/Mekonnen-Hoekstra-2012-WaterFootprintFarmAnimalProducts_1.pdf
 *                      Note: includes green water (rainfall); blue-only is far smaller.
 *   [USGS-TRANSPIRATION] USGS — Evapotranspiration / mature oak tree (~40,000 gal/yr = 151,400 L)
 *                      https://www.usgs.gov/special-topics/water-science-school/science/evapotranspiration-water-cycle
 *   [FINA-POOL]        World Aquatics (FINA) Facilities Rules — Olympic pool min 2 m × 50 × 25 m = 2500 m³
 *                      https://resources.fina.org/fina/document/2021/01/12/916f78fa-708e-4c66-940f-cbe839de9a40/2017-2021_facilities_16032018.pdf
 *
 * ─────────────────────────  CO₂ (g)  ─────────────────────────
 *   [GOOGLE-2024]      Google 2024 Environmental Report — Gemini-era text prompt (0.03 g)
 *                      https://sustainability.google/reports/google-2024-environmental-report/
 *   [IEA-STREAMING]    IEA — Streaming video footprint (36 g/hr global avg 2019; 0.6 g/min)
 *                      https://www.iea.org/commentaries/the-carbon-footprint-of-streaming-video-fact-checking-the-headlines
 *   [EPA-EGRID]        EPA eGRID 2023 — US grid intensity (~394 g CO₂/kWh)
 *                      https://www.epa.gov/egrid
 *   [ECF-CYCLING]      European Cyclists' Federation — bicycle LCA (16 g/km incl. food cals)
 *                      https://ecf.com/files/wp-content/uploads/ECF_BROCHURE_EN_planche.pdf
 *   [DEFRA-2024]       UK Defra/DESNZ 2024 GHG Conversion Factors — rail 35, bus 89, flight 81 (g/pkm), short flight 158 g/pkm, long-haul economy 117 g/pkm
 *                      https://www.gov.uk/government/collections/government-conversion-factors-for-company-reporting
 *   [EEA-CAR]          EEA — New EU passenger car CO₂ (106 g/km tailpipe, WLTP 2023)
 *                      https://www.eea.europa.eu/en/analysis/indicators/co2-performance-of-new-passenger
 *   [EPA-PV]           EPA — Typical passenger vehicle (249 g/km tailpipe; 4.6 t/yr)
 *                      https://www.epa.gov/greenvehicles/greenhouse-gas-emissions-typical-passenger-vehicle
 *   [POORE-2018]       Poore & Nemecek (2018), Science — food LCAs via Our World in Data
 *                      https://ourworldindata.org/grapher/ghg-per-kg-poore
 *                      Coffee 280 g, potatoes 460 g, rice 4500 g, chicken 9870 g, pork 12310 g, cheese 23900 g, lamb 39200 g, beef-global-avg 60000 g (per kg).
 *   [TSHIRT-LCA]       Steinberger et al. (2009) — apparel LCA (~5.5 kg/t-shirt)
 *                      https://www.sciencedirect.com/science/article/pii/S0959652608001880
 *   [OWID-INDIA]       Our World in Data — India CO₂ profile (per-capita ~2.07 t/yr)
 *                      https://ourworldindata.org/profile/co2/india
 *   [EIA-EMISSIONS]    EIA — US energy-related CO₂ per capita (~14.6 t/yr 2022)
 *                      https://www.eia.gov/environment/emissions/carbon/
 *
 * Honest caveats baked in: pricing-derived proxies, biogenic vs anthropogenic
 * separation, and methodology variance on Bitcoin/food/water all noted in
 * the comments next to specific entries above.
 */

type Equivalent = {
  readonly unitCost: number;
  readonly singularLabel: string;
  readonly pluralLabel: string;
};

const ENERGY_EQUIVALENTS: ReadonlyArray<Equivalent> = [
  { unitCost: 0.15, singularLabel: "min of LED bulb", pluralLabel: "min of LED bulb" },
  { unitCost: 9, singularLabel: "h of LED bulb", pluralLabel: "h of LED bulb" },
  { unitCost: 12, singularLabel: "phone charge", pluralLabel: "phone charges" },
  { unitCost: 17, singularLabel: "min of microwave", pluralLabel: "min of microwave" },
  { unitCost: 22, singularLabel: "tea kettle", pluralLabel: "tea kettles" },
  { unitCost: 30, singularLabel: "h of laptop", pluralLabel: "h of laptop" },
  { unitCost: 60, singularLabel: "h of ceiling fan", pluralLabel: "h of ceiling fan" },
  { unitCost: 100, singularLabel: "h of TV", pluralLabel: "h of TV" },
  { unitCost: 158, singularLabel: "EV km", pluralLabel: "EV km" },
  { unitCost: 180, singularLabel: "h of gaming", pluralLabel: "h of gaming" },
  { unitCost: 500, singularLabel: "wash cycle", pluralLabel: "wash cycles" },
  { unitCost: 750, singularLabel: "air-fryer cycle", pluralLabel: "air-fryer cycles" },
  { unitCost: 1000, singularLabel: "h of window AC", pluralLabel: "h of window AC" },
  { unitCost: 1100, singularLabel: "fridge-day", pluralLabel: "fridge-days" },
  { unitCost: 2150, singularLabel: "dryer cycle", pluralLabel: "dryer cycles" },
  { unitCost: 2300, singularLabel: "h of oven", pluralLabel: "h of oven" },
  { unitCost: 3000, singularLabel: "h of central AC", pluralLabel: "h of central AC" },
  { unitCost: 12000, singularLabel: "water-heater day", pluralLabel: "water-heater days" },
  { unitCost: 13500, singularLabel: "Powerwall", pluralLabel: "Powerwalls" },
  { unitCost: 15000, singularLabel: "heat-pump day", pluralLabel: "heat-pump days" },
  { unitCost: 25000, singularLabel: "EV fast-charge", pluralLabel: "EV fast-charges" },
  { unitCost: 40000, singularLabel: "Nissan Leaf battery", pluralLabel: "Nissan Leaf batteries" },
  { unitCost: 75000, singularLabel: "Tesla M3 battery", pluralLabel: "Tesla M3 batteries" },
  { unitCost: 500000, singularLabel: "fridge-year", pluralLabel: "fridge-years" },
  { unitCost: 855000, singularLabel: "household month", pluralLabel: "household months" },
  { unitCost: 5475000, singularLabel: "heat-pump year", pluralLabel: "heat-pump years" },
  { unitCost: 10260000, singularLabel: "household year", pluralLabel: "household years" },
];

const WATER_EQUIVALENTS: ReadonlyArray<Equivalent> = [
  { unitCost: 0.05, singularLabel: "drop", pluralLabel: "drops" },
  { unitCost: 4.93, singularLabel: "tsp", pluralLabel: "tsp" },
  { unitCost: 14.79, singularLabel: "tbsp", pluralLabel: "tbsp" },
  { unitCost: 30, singularLabel: "sip", pluralLabel: "sips" },
  { unitCost: 240, singularLabel: "cup", pluralLabel: "cups" },
  { unitCost: 355, singularLabel: "soda can", pluralLabel: "soda cans" },
  { unitCost: 500, singularLabel: "bottle", pluralLabel: "bottles" },
  { unitCost: 1000, singularLabel: "1L bottle", pluralLabel: "1L bottles" },
  { unitCost: 3785, singularLabel: "milk jug", pluralLabel: "milk jugs" },
  { unitCost: 4845, singularLabel: "flush", pluralLabel: "flushes" },
  { unitCost: 7570, singularLabel: "min of shower", pluralLabel: "min of shower" },
  { unitCost: 12110, singularLabel: "dish cycle", pluralLabel: "dish cycles" },
  { unitCost: 49000, singularLabel: "wash load", pluralLabel: "wash loads" },
  { unitCost: 60000, singularLabel: "hand-wash", pluralLabel: "hand-washes" },
  { unitCost: 100000, singularLabel: "bath", pluralLabel: "baths" },
  { unitCost: 142000, singularLabel: "UK person-day", pluralLabel: "UK person-days" },
  { unitCost: 180000, singularLabel: "car wash", pluralLabel: "car washes" },
  { unitCost: 310000, singularLabel: "US person-day", pluralLabel: "US person-days" },
  { unitCost: 1000000, singularLabel: "cubic meter", pluralLabel: "cubic meters" },
  { unitCost: 1135000, singularLabel: "US household day", pluralLabel: "US household days" },
  { unitCost: 4325000, singularLabel: "kg of chicken", pluralLabel: "kg of chicken" },
  { unitCost: 5060000, singularLabel: "kg of cheese", pluralLabel: "kg of cheese" },
  { unitCost: 5990000, singularLabel: "kg of pork", pluralLabel: "kg of pork" },
  { unitCost: 15400000, singularLabel: "kg of beef", pluralLabel: "kg of beef" },
  { unitCost: 110000000, singularLabel: "household water-year", pluralLabel: "household water-years" },
  { unitCost: 151400000, singularLabel: "oak tree year", pluralLabel: "oak tree years" },
  { unitCost: 2500000000, singularLabel: "Olympic pool", pluralLabel: "Olympic pools" },
];

const CO2_EQUIVALENTS: ReadonlyArray<Equivalent> = [
  { unitCost: 0.03, singularLabel: "Google search", pluralLabel: "Google searches" },
  { unitCost: 0.6, singularLabel: "min of streaming", pluralLabel: "min of streaming" },
  { unitCost: 4, singularLabel: "phone charge", pluralLabel: "phone charges" },
  { unitCost: 16, singularLabel: "cycling km", pluralLabel: "cycling km" },
  { unitCost: 35, singularLabel: "rail km", pluralLabel: "rail km" },
  { unitCost: 81, singularLabel: "flight km", pluralLabel: "flight km" },
  { unitCost: 89, singularLabel: "bus km", pluralLabel: "bus km" },
  { unitCost: 106, singularLabel: "EU car km", pluralLabel: "EU car km" },
  { unitCost: 249, singularLabel: "car km", pluralLabel: "car km" },
  { unitCost: 280, singularLabel: "coffee", pluralLabel: "coffees" },
  { unitCost: 460, singularLabel: "kg of potatoes", pluralLabel: "kg of potatoes" },
  { unitCost: 4500, singularLabel: "kg of rice", pluralLabel: "kg of rice" },
  { unitCost: 5500, singularLabel: "t-shirt", pluralLabel: "t-shirts" },
  { unitCost: 6800, singularLabel: "burger", pluralLabel: "burgers" },
  { unitCost: 9870, singularLabel: "kg of chicken", pluralLabel: "kg of chicken" },
  { unitCost: 12310, singularLabel: "kg of pork", pluralLabel: "kg of pork" },
  { unitCost: 23900, singularLabel: "kg of cheese", pluralLabel: "kg of cheese" },
  { unitCost: 36000, singularLabel: "h of streaming", pluralLabel: "h of streaming" },
  { unitCost: 39200, singularLabel: "kg of lamb", pluralLabel: "kg of lamb" },
  { unitCost: 60000, singularLabel: "kg of beef", pluralLabel: "kg of beef" },
  { unitCost: 79000, singularLabel: "short flight", pluralLabel: "short flights" },
  { unitCost: 1670000, singularLabel: "NYC–London R/T", pluralLabel: "NYC–London R/T" },
  { unitCost: 4042000, singularLabel: "US household year", pluralLabel: "US household years" },
  { unitCost: 4600000, singularLabel: "US car-year", pluralLabel: "US car-years" },
  { unitCost: 14600000, singularLabel: "US person-year", pluralLabel: "US person-years" },
  { unitCost: 69000000, singularLabel: "ICE car lifetime", pluralLabel: "ICE car lifetimes" },
];

const roundedAtLeastOne = (value: number): number =>
  Math.max(1, Math.round(value));

const pickEquivalentForValue = (
  value: number,
  equivalents: ReadonlyArray<Equivalent>,
): Equivalent => {
  const fittingEquivalents = equivalents.filter(
    (equivalent) => value >= equivalent.unitCost,
  );
  if (fittingEquivalents.length === 0) return equivalents[0]!;
  return fittingEquivalents[fittingEquivalents.length - 1]!;
};

const labelForCount = (equivalent: Equivalent, count: number): string =>
  count === 1 ? equivalent.singularLabel : equivalent.pluralLabel;

const formatAgainst = (
  value: number,
  equivalents: ReadonlyArray<Equivalent>,
): string => {
  const equivalent = pickEquivalentForValue(value, equivalents);
  const count = roundedAtLeastOne(value / equivalent.unitCost);
  return `${count} ${labelForCount(equivalent, count)}`;
};

export const formatEnergyEquivalent = (wattHours: number): string =>
  formatAgainst(wattHours, ENERGY_EQUIVALENTS);

export const formatWaterEquivalent = (milliliters: number): string =>
  formatAgainst(milliliters, WATER_EQUIVALENTS);

export const formatCo2Equivalent = (grams: number): string =>
  formatAgainst(grams, CO2_EQUIVALENTS);
