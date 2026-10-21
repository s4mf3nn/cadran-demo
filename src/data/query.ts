import {
  CATEGORIES, COUNTRIES, STATUSES,
  type Aggregates, type Category, type Filters, type Requirement, type Sort, type Status,
} from './types';

/**
 * Fonctions pures, sans dépendance au DOM : elles tournent dans le Web Worker
 * en production et sont testées directement dans Vitest.
 */

export function matches(r: Requirement, f: Filters, needle: string): boolean {
  if (r.risk < f.minRisk) return false;
  if (f.countries.length && !f.countries.includes(r.country)) return false;
  if (f.categories.length && !f.categories.includes(r.category)) return false;
  if (f.statuses.length && !f.statuses.includes(r.status)) return false;
  if (needle && !r.ref.toLowerCase().includes(needle) && !r.title.toLowerCase().includes(needle)) return false;
  return true;
}

const STATUS_ORDER: Record<Status, number> = { conforme: 0, en_cours: 1, a_evaluer: 2, non_conforme: 3 };

export function compare(a: Requirement, b: Requirement, sort: Sort): number {
  let d: number;
  switch (sort.key) {
    case 'status': d = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
    case 'risk': d = a.risk - b.risk; break;
    case 'dueAt': d = a.dueAt - b.dueAt; break;
    default: d = a[sort.key].localeCompare(b[sort.key], 'fr');
  }
  return sort.dir === 'asc' ? d || a.id - b.id : -d || a.id - b.id;
}

const isAtRisk = (r: Requirement) => r.status === 'non_conforme' || r.risk >= 3;

export interface QueryResult {
  /** Index des lignes retenues, dans l'ordre de tri. Transférable sans copie. */
  indices: Uint32Array;
  aggregates: Aggregates;
}

export function runQuery(data: Requirement[], filters: Filters, sort: Sort, now = Date.now()): QueryResult {
  const needle = filters.search.trim().toLowerCase();
  const kept: Requirement[] = [];

  const byStatus = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<Status, number>;
  const countryIdx = new Map(COUNTRIES.map((c, i) => [c, i]));
  const categoryIdx = new Map(CATEGORIES.map((c, i) => [c, i]));
  const byCountry = new Uint32Array(COUNTRIES.length);
  const heat = new Uint32Array(COUNTRIES.length * CATEGORIES.length);

  const start = new Date(now);
  const monthStart = Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1);
  const deadlines = new Uint32Array(12);
  const deadlinesByStatus = new Uint32Array(12 * STATUSES.length);
  const statusIdx = new Map(STATUSES.map((s, i) => [s, i]));
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c, 0])) as Record<Category, number>;
  let atRisk = 0;

  // Une seule passe sur le dataset pour le filtre et toutes les agrégations.
  for (const r of data) {
    if (!matches(r, filters, needle)) continue;
    kept.push(r);
    byStatus[r.status]++;
    byCategory[r.category]++;
    if (isAtRisk(r)) {
      atRisk++;
      const ci = countryIdx.get(r.country)!;
      byCountry[ci]!++;
      heat[ci * CATEGORIES.length + categoryIdx.get(r.category)!]!++;
    }
    const d = new Date(r.dueAt);
    const m = (d.getUTCFullYear() - start.getUTCFullYear()) * 12 + d.getUTCMonth() - start.getUTCMonth();
    if (r.dueAt >= monthStart && m >= 0 && m < 12) {
      deadlines[m]!++;
      deadlinesByStatus[m * STATUSES.length + statusIdx.get(r.status)!]!++;
    }
  }

  kept.sort((a, b) => compare(a, b, sort));
  const indices = new Uint32Array(kept.length);
  for (let i = 0; i < kept.length; i++) indices[i] = kept[i]!.id;

  return {
    indices,
    aggregates: {
      total: kept.length,
      atRisk,
      byStatus,
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
