import {
  AT_RISK_MIN, CATEGORIES, COUNTRIES, RISKS, STATUSES,
  type Aggregates, type Category, type Filters, type Requirement, type Risk, type Sort, type Status,
} from './types';

const DAY = 86_400_000;

/**
 * Fonctions pures, sans dépendance au DOM : elles tournent dans le Web Worker
 * en production et sont testées directement dans Vitest.
 */

/** Intitulés en minuscules : ~140 intitulés distincts, on évite un toLowerCase par ligne et par frappe. */
const lowerTitles = new Map<string, string>();
const lowerTitle = (title: string) => {
  let t = lowerTitles.get(title);
  if (t === undefined) lowerTitles.set(title, (t = title.toLowerCase()));
  return t;
};

/**
 * Recherche sans casse. Les références sont en ASCII majuscule (« REQ-000042 ») : chercher
 * l'aiguille en majuscules dans la référence équivaut à comparer les deux en minuscules, sans allocation.
 */
const matchesNeedle = (r: Requirement, needle: string, needleUpper: string) =>
  r.ref.includes(needleUpper) || lowerTitle(r.title).includes(needle);

const matchesCountry = (r: Requirement, f: Filters) => !f.countries.length || f.countries.includes(r.country);

/** Tous les filtres sauf le statut et le pays (sert aussi aux volumes par statut et à l'échelle des pays). */
function matchesBase(r: Requirement, f: Filters, needle: string, dueLimit: number, needleUpper = needle.toUpperCase()): boolean {
  if (r.risk < f.minRisk) return false;
  if (r.dueAt > dueLimit) return false;
  if (f.categories.length && !f.categories.includes(r.category)) return false;
  if (f.regulations.length && !f.regulations.includes(r.regulation)) return false;
  if (needle && !matchesNeedle(r, needle, needleUpper)) return false;
  return true;
}

const matchesStatus = (r: Requirement, f: Filters) => !f.statuses.length || f.statuses.includes(r.status);

/** Limite haute d'échéance du filtre (les retards restent inclus). */
const dueLimitOf = (f: Filters, now: number) => (f.dueWithin == null ? Infinity : now + f.dueWithin * DAY);

export function matches(r: Requirement, f: Filters, needle: string, now = Date.now()): boolean {
  return matchesBase(r, f, needle, dueLimitOf(f, now)) && matchesCountry(r, f) && matchesStatus(r, f);
}

const STATUS_ORDER: Record<Status, number> = { conforme: 0, en_cours: 1, a_evaluer: 2, non_conforme: 3 };

/** Rang alphabétique (français) des pays et catégories, calculé une fois. */
const rankOf = <T extends string>(values: readonly T[]) => {
  const sorted = [...values].sort(new Intl.Collator('fr').compare);
  return Object.fromEntries(sorted.map((v, i) => [v, i])) as Record<T, number>;
};
const COUNTRY_RANK = rankOf(COUNTRIES);
const CATEGORY_RANK = rankOf(CATEGORIES);

/**
 * Ordre de référence (utilisé tel quel par les tests). La référence suit l'ordre numérique de l'id :
 * « REQ-1000000 » vient après « REQ-999999 », ce que l'ordre alphabétique ne garantit pas.
 */
export function compare(a: Requirement, b: Requirement, sort: Sort): number {
  let d: number;
  switch (sort.key) {
    case 'status': d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
    case 'risk': d = a.risk - b.risk; break;
    case 'dueAt': d = a.dueAt - b.dueAt; break;
    case 'country': d = COUNTRY_RANK[a.country] - COUNTRY_RANK[b.country]; break;
    case 'category': d = CATEGORY_RANK[a.category] - CATEGORY_RANK[b.category]; break;
    default: d = a.id - b.id;
  }
  return sort.dir === 'asc' ? d || a.id - b.id : -d || a.id - b.id;
}

/** Clé entière (>= 0) de faible cardinalité par colonne triable, hors référence et échéance. */
const SMALL_KEYS: Record<Exclude<Sort['key'], 'ref' | 'dueAt'>, (r: Requirement) => number> = {
  status: (r) => STATUS_ORDER[r.status],
  risk: (r) => r.risk,
  country: (r) => COUNTRY_RANK[r.country],
  category: (r) => CATEGORY_RANK[r.category],
};

/**
 * Tri en O(n) par comptage, équivalent à `kept.sort(compare)` : `kept` arrive dans l'ordre des id,
 * et le tri par comptage est stable, donc les ex aequo restent par id croissant dans les deux sens.
 * Toutes les clés sont de faible cardinalité (l'échéance est au jour près : ~430 valeurs).
 * À 1 M de lignes : ~20 ms contre ~200 ms pour un tri par comparateur.
 */
export function sortIds(kept: Requirement[], sort: Sort): Uint32Array {
  const n = kept.length;
  const desc = sort.dir === 'desc';
  const out = new Uint32Array(n);
  if (sort.key === 'ref') {
    for (let i = 0; i < n; i++) out[i] = kept[desc ? n - 1 - i : i]!.id;
    return out;
  }

  const keys = new Uint32Array(n);
  let max = 0;
  if (sort.key === 'dueAt') {
    let min = Infinity;
    for (const r of kept) if (r.dueAt < min) min = r.dueAt;
    for (let i = 0; i < n; i++) {
      const days = (kept[i]!.dueAt - min) / DAY;
      // Échéance hors du jour pile ou plage trop large : retour au tri par comparateur.
      if (!Number.isInteger(days) || days > 100_000) return Uint32Array.from(kept.slice().sort((a, b) => compare(a, b, sort)), (r) => r.id);
      keys[i] = days;
      if (days > max) max = days;
    }
  } else {
    const keyOf = SMALL_KEYS[sort.key];
    for (let i = 0; i < n; i++) {
      const k = keyOf(kept[i]!);
      keys[i] = k;
      if (k > max) max = k;
    }
  }
  if (desc) for (let i = 0; i < n; i++) keys[i] = max - keys[i]!;

  const starts = new Uint32Array(max + 2);
  for (let i = 0; i < n; i++) starts[keys[i]! + 1]!++;
  for (let k = 1; k < starts.length; k++) starts[k]! += starts[k - 1]!;
  for (let i = 0; i < n; i++) out[starts[keys[i]!]!++] = kept[i]!.id;
  return out;
}

const isAtRisk = (r: Requirement) => r.status === 'non_conforme' || r.risk >= AT_RISK_MIN;

export interface QueryResult {
  /** Index des lignes retenues, dans l'ordre de tri. Transférable sans copie. */
  indices: Uint32Array;
  aggregates: Aggregates;
}

export function runQuery(data: Requirement[], filters: Filters, sort: Sort, now = Date.now()): QueryResult {
  const needle = filters.search.trim().toLowerCase();
  const needleUpper = needle.toUpperCase();
  const dueLimit = dueLimitOf(filters, now);
  const in90 = now + 90 * DAY;
  const kept: Requirement[] = [];

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  const statusFacets = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  const byRisk = Object.fromEntries(RISKS.map((r) => [r, 0])) as Record<Risk, number>;
  let overdueNonConforme = 0;
  let dueWithin90 = 0;
  const countryIdx = new Map(COUNTRIES.map((c, i) => [c, i]));
  const categoryIdx = new Map(CATEGORIES.map((c, i) => [c, i]));
  const byCountry = new Uint32Array(COUNTRIES.length);
  // Comme byCountry mais sans le filtre pays : fixe l'échelle de couleur et de taille des pays.
  const countryFacets = new Uint32Array(COUNTRIES.length);
  const heat = new Uint32Array(COUNTRIES.length * CATEGORIES.length);

  const start = new Date(now);
  // Débuts des 12 mois suivis + borne de fin : on situe l'échéance sans allouer de Date par ligne.
  const monthBounds = Array.from({ length: 13 }, (_, i) => Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
  const deadlines = new Uint32Array(12);
  const deadlinesByStatus = new Uint32Array(12 * STATUSES.length);
  const statusIdx = new Map(STATUSES.map((s, i) => [s, i]));
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  let atRisk = 0;

  // Une seule passe sur le dataset pour le filtre et toutes les agrégations.
  for (const r of data) {
    if (!matchesBase(r, filters, needle, dueLimit, needleUpper)) continue;
    const inStatus = matchesStatus(r, filters);
    if (inStatus && isAtRisk(r)) countryFacets[countryIdx.get(r.country)!]!++;
    if (!matchesCountry(r, filters)) continue;
    statusFacets[r.status]++;
    if (!inStatus) continue;
    kept.push(r);
    byStatus[r.status]++;
    byCategory[r.category]++;
    byRisk[r.risk]++;
    if (r.dueAt < now) {
      if (r.status === 'non_conforme') overdueNonConforme++;
    } else if (r.dueAt < in90) dueWithin90++;
    if (isAtRisk(r)) {
      atRisk++;
      const ci = countryIdx.get(r.country)!;
      byCountry[ci]!++;
      heat[ci * CATEGORIES.length + categoryIdx.get(r.category)!]!++;
    }
    if (r.dueAt >= monthBounds[0]! && r.dueAt < monthBounds[12]!) {
      let m = 0;
      while (r.dueAt >= monthBounds[m + 1]!) m++;
      deadlines[m]!++;
      deadlinesByStatus[m * STATUSES.length + statusIdx.get(r.status)!]!++;
    }
  }

  const indices = sortIds(kept, sort);

  return {
    indices,
    aggregates: {
      total: kept.length,
      atRisk,
      byStatus,
      statusFacets,
      byRisk,
      overdueNonConforme,
      dueWithin90,
      countryMax: countryFacets.reduce((m, n) => Math.max(m, n), 0),
      byCountry: COUNTRIES.map((country, i) => ({ country, count: byCountry[i]! }))
        .sort((a, b) => b.count - a.count),
      heatmap: COUNTRIES.flatMap((country, ci) =>
        CATEGORIES.map((category, ki) => ({ country, category, count: heat[ci * CATEGORIES.length + ki]! })),
      ),
      byCategory,
      deadlinesByStatus: Array.from({ length: 12 }, (_, m) =>
        Object.fromEntries(STATUSES.map((s, i) => [s, deadlinesByStatus[m * STATUSES.length + i]!])) as Record<Status, number>,
      ),
      deadlines: Array.from(deadlines, (count, i) => ({
        month: new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1))
          .toLocaleDateString('fr-FR', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
        count,
      })),
    },
  };
}
