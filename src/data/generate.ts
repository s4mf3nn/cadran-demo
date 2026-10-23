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

/** Intitulés pré-calculés (sujet × réglementation) : 140 chaînes partagées au lieu d'une par ligne. */
const TITLES = SUBJECTS.map((s) => REGULATIONS.map((reg) => `${s} (${reg})`));

const DAY = 86_400_000;

/**
 * Référentiel en colonnes (index dans les tables d'énumérations) : ~13 octets par exigence,
 * transférables sans copie du worker vers le main thread, quel que soit le volume.
 */
export interface Columns {
  country: Uint8Array;
  category: Uint8Array;
  status: Uint8Array;
  regulation: Uint8Array;
  subject: Uint8Array;
  risk: Uint8Array;
  dueAt: Float64Array;
}

export const columnBuffers = (c: Columns): ArrayBuffer[] =>
  [c.country, c.category, c.status, c.regulation, c.subject, c.risk, c.dueAt].map((a) => a.buffer as ArrayBuffer);

export function generateColumns(size: number, seed = 42, now = Date.UTC(2026, 9, 1)): Columns {
  const rand = mulberry32(seed);
  const cols: Columns = {
    country: new Uint8Array(size),
    category: new Uint8Array(size),
    status: new Uint8Array(size),
    regulation: new Uint8Array(size),
    subject: new Uint8Array(size),
    risk: new Uint8Array(size),
    dueAt: new Float64Array(size),
  };

  // Tirage pondéré des pays (table cumulative) : quelques pays concentrent le volume.
  const cumulative: number[] = [];
  let totalWeight = 0;
  for (const c of COUNTRIES) {
    totalWeight += COUNTRY_PROFILE[c].weight;
    cumulative.push(totalWeight);
  }
  const pickCountry = () => {
    const x = rand() * totalWeight;
    const idx = cumulative.findIndex((w) => x < w);
    return idx === -1 ? COUNTRIES.length - 1 : idx;
  };

  // Catégorie pondérée par pays (poids global × point chaud), table cumulative par pays.
  const catTables = COUNTRIES.map((c) => {
    let acc = 0;
    return CATEGORIES.map((cat) => (acc += CATEGORY_WEIGHT[cat] * (COUNTRY_HOTSPOTS[c]?.[cat] ?? 1)));
  });
  const pickCategory = (country: number) => {
    const table = catTables[country]!;
    const x = rand() * table[table.length - 1]!;
    return table.findIndex((w) => x < w);
  };

  // L'ordre des tirages est figé : il détermine le dataset (et donc les démos et les tests).
  for (let i = 0; i < size; i++) {
    const country = pickCountry();
    const bias = COUNTRY_PROFILE[COUNTRIES[country] as Country].riskBias;
    // Majorité conforme, mais la part de non-conformes (2 % à 22 %) dépend du pays.
    const r = rand();
    const conforme = 0.55 - 0.25 * bias;
    const nonConforme = 0.12 + 0.1 * bias;
    cols.country[i] = country;
    cols.status[i] = r < conforme ? 0 : r < conforme + 0.15 ? 1 : r < 1 - nonConforme ? 2 : 3;
    cols.regulation[i] = Math.floor(rand() * REGULATIONS.length);
    cols.subject[i] = Math.floor(rand() * SUBJECTS.length);
    cols.category[i] = pickCategory(country);
    cols.risk[i] = 1 + Math.floor(Math.min(0.999, Math.max(0, rand() + 0.3 * bias)) * 5);
    cols.dueAt[i] = now + Math.floor(rand() * 400 - 30) * DAY;
  }
  return cols;
}

/** Reconstruit l'exigence `id` à partir des colonnes. */
export function rowAt(cols: Columns, id: number): Requirement {
  const regulation = cols.regulation[id]!;
  return {
    id,
    ref: `REQ-${String(id + 1).padStart(6, '0')}`,
    title: TITLES[cols.subject[id]!]![regulation]!,
    regulation: REGULATIONS[regulation]!,
    country: COUNTRIES[cols.country[id]!]!,
    category: CATEGORIES[cols.category[id]!]!,
    status: STATUSES[cols.status[id]!]!,
    risk: cols.risk[id] as Risk,
    dueAt: cols.dueAt[id]!,
  };
}

export function generateRequirements(size: number, seed = 42, now = Date.UTC(2026, 9, 1)): Requirement[] {
  const cols = generateColumns(size, seed, now);
  return Array.from({ length: size }, (_, i) => rowAt(cols, i));
}
