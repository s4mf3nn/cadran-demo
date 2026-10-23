import {
  CATEGORIES, COUNTRIES, REGULATIONS, RISKS, STATUSES,
  type Filters, type Risk, type Sort, type SortKey,
} from '../data/types';
import { initialFilters } from '../store/filters';

export const DEFAULT_SORT: Sort = { key: 'dueAt', dir: 'asc' };

const SORT_KEYS: readonly SortKey[] = ['ref', 'country', 'category', 'status', 'risk', 'dueAt'];
const DUE_WITHIN = [30, 90, 365] as const;

export interface UrlState {
  filters: Filters;
  sort: Sort;
  /** Exigence dont la fiche est ouverte. */
  openId: number | null;
}

/** Garde les seules valeurs connues d'une liste (une URL éditée à la main ne doit rien casser). */
const pick = <T extends string>(raw: string | null, allowed: readonly T[]): T[] =>
  (raw?.split(',') ?? []).filter((v): v is T => (allowed as readonly string[]).includes(v));

export function decodeUrlState(search: string): UrlState {
  const p = new URLSearchParams(search);
  const risk = Number(p.get('risque'));
  const due = Number(p.get('echeance'));
  const [key, dir] = (p.get('tri') ?? '').split('.');
  const id = Number(p.get('fiche'));
  const sortKey = SORT_KEYS.find((k) => k === key);
  return {
    filters: {
      search: p.get('q') ?? '',
      countries: pick(p.get('pays'), COUNTRIES),
      categories: pick(p.get('categorie'), CATEGORIES),
      statuses: pick(p.get('statut'), STATUSES),
      regulations: pick(p.get('reglementation'), REGULATIONS),
      minRisk: (RISKS as readonly number[]).includes(risk) ? (risk as Risk) : initialFilters.minRisk,
      dueWithin: DUE_WITHIN.find((d) => d === due) ?? null,
    },
    sort: sortKey ? { key: sortKey, dir: dir === 'desc' ? 'desc' : 'asc' } : DEFAULT_SORT,
    openId: p.get('fiche') !== null && Number.isInteger(id) && id >= 0 ? id : null,
  };
}

/** Query string (sans `?`) ; seuls les écarts avec l'état initial y figurent. */
export function encodeUrlState({ filters: f, sort, openId }: UrlState): string {
  const p = new URLSearchParams();
  if (f.search) p.set('q', f.search);
  if (f.countries.length) p.set('pays', f.countries.join(','));
  if (f.categories.length) p.set('categorie', f.categories.join(','));
  if (f.statuses.length) p.set('statut', f.statuses.join(','));
  if (f.regulations.length) p.set('reglementation', f.regulations.join(','));
  if (f.minRisk !== initialFilters.minRisk) p.set('risque', String(f.minRisk));
  if (f.dueWithin !== null) p.set('echeance', String(f.dueWithin));
  if (sort.key !== DEFAULT_SORT.key || sort.dir !== DEFAULT_SORT.dir) p.set('tri', `${sort.key}.${sort.dir}`);
  if (openId !== null) p.set('fiche', String(openId));
  return p.toString().replace(/%2C/g, ',');
}
