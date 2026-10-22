import {
  CATEGORIES, CATEGORY_WEIGHT, COUNTRIES, COUNTRY_HOTSPOTS, COUNTRY_PROFILE, REGULATIONS, STATUSES,
  type Country, type Requirement, type Risk,
} from './types';

/** PRNG déterministe : même seed, même dataset, donc des tests et des démos reproductibles. */
export function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SUBJECTS = [
  'Substances restreintes', 'Traçabilité des lots', 'Marquage et étiquetage',
  'Essais de résistance', 'Compatibilité électromagnétique', 'Documentation utilisateur',
  'Recyclabilité', 'Sécurité batterie', 'Allergènes', 'Information consommateur',
];

const DAY = 86_400_000;

export function generateRequirements(size: number, seed = 42, now = Date.UTC(2026, 9, 1)): Requirement[] {
  const rand = mulberry32(seed);
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)] as T;
  const out: Requirement[] = new Array(size);

  // Tirage pondéré des pays (table cumulative) : quelques pays concentrent le volume.
  const cumulative: number[] = [];
  let totalWeight = 0;
  for (const c of COUNTRIES) {
    totalWeight += COUNTRY_PROFILE[c].weight;
    cumulative.push(totalWeight);
  }
  const pickCountry = (): Country => {
    const x = rand() * totalWeight;
    const idx = cumulative.findIndex((w) => x < w);
    return COUNTRIES[idx === -1 ? COUNTRIES.length - 1 : idx] as Country;
  };

  // Catégorie pondérée par pays (poids global × point chaud), table cumulative par pays.
  const catTables = new Map<Country, number[]>();
  for (const c of COUNTRIES) {
    let acc = 0;
    catTables.set(c, CATEGORIES.map((cat) => (acc += CATEGORY_WEIGHT[cat] * (COUNTRY_HOTSPOTS[c]?.[cat] ?? 1))));
  }
  const pickCategory = (country: Country) => {
    const table = catTables.get(country)!;
    const x = rand() * table[table.length - 1]!;
    return CATEGORIES[table.findIndex((w) => x < w)] as (typeof CATEGORIES)[number];
  };

  for (let i = 0; i < size; i++) {
    const country = pickCountry();
    const bias = COUNTRY_PROFILE[country].riskBias;
    // Majorité conforme, mais la part de non-conformes (2 % à 22 %) dépend du pays.
    const r = rand();
    const conforme = 0.55 - 0.25 * bias;
    const nonConforme = 0.12 + 0.1 * bias;
    const status =
      r < conforme ? STATUSES[0]
      : r < conforme + 0.15 ? STATUSES[1]
      : r < 1 - nonConforme ? STATUSES[2]
      : STATUSES[3];
    const regulation = pick(REGULATIONS);
    out[i] = {
      id: i,
      ref: `REQ-${String(i + 1).padStart(6, '0')}`,
      title: `${pick(SUBJECTS)} (${regulation})`,
      regulation,
      country,
      category: pickCategory(country),
      status,
      risk: (1 + Math.floor(Math.min(0.999, Math.max(0, rand() + 0.3 * bias)) * 5)) as Risk,
      dueAt: now + Math.floor(rand() * 400 - 30) * DAY,
    };
  }
  return out;
}
