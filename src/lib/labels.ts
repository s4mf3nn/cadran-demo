import { STATUS_LABEL, type Country, type DueWithin, type Filters, type Risk, type SortKey, type Status } from '../data/types';

export const SORT_LABEL: Record<SortKey, string> = {
  ref: 'Référence',
  country: 'Pays',
  category: 'Catégorie',
  status: 'Statut',
  risk: 'Risque',
  dueAt: 'Échéance',
};

/** Code pays sur 2 lettres (ISO 3166-1 alpha-2) pour les pastilles. */
export const COUNTRY_CODE: Record<Country, string> = {
  France: 'FR', Allemagne: 'DE', Espagne: 'ES', Italie: 'IT', Belgique: 'BE', 'Pays-Bas': 'NL', Pologne: 'PL',
  'Royaume-Uni': 'GB', 'États-Unis': 'US', Canada: 'CA', Brésil: 'BR', Chine: 'CN', Inde: 'IN', Japon: 'JP',
  'Corée du Sud': 'KR', Australie: 'AU', Mexique: 'MX', Turquie: 'TR', Maroc: 'MA', 'Afrique du Sud': 'ZA',
};

export const RISK_LABEL: Record<Risk, string> = { 1: 'Faible', 2: 'Limité', 3: 'Modéré', 4: 'Élevé', 5: 'Critique' };

export const DUE_LABEL: Record<DueWithin, string> = { 30: '30 prochains jours', 90: '90 prochains jours', 365: '12 prochains mois' };

/** Statuts au pluriel, pour les phrases de contexte (« non conformes, risque ≥ 3 »). */
const STATUS_PLURAL: Record<Status, string> = { conforme: 'conformes', en_cours: 'en cours', a_evaluer: 'à évaluer', non_conforme: 'non conformes' };

export type FilterChip = { label: string; kind: 'status' | 'risk' | 'other'; status?: Status; risk?: Risk };

/** Filtres actifs sous forme de puces (assistant) ; même ordre que le panneau de filtres. */
export function filterChips(f: Filters): FilterChip[] {
  const search = f.search.trim();
  return [
    ...f.statuses.map((status): FilterChip => ({ label: STATUS_LABEL[status], kind: 'status', status })),
    ...(f.minRisk > 1 ? [{ label: `Risque ≥ ${f.minRisk}`, kind: 'risk', risk: f.minRisk } satisfies FilterChip] : []),
    ...(f.dueWithin ? [{ label: DUE_LABEL[f.dueWithin], kind: 'other' } satisfies FilterChip] : []),
    ...[...f.countries, ...f.categories, ...f.regulations].map((label): FilterChip => ({ label, kind: 'other' })),
    ...(search ? [{ label: `« ${search} »`, kind: 'other' } satisfies FilterChip] : []),
  ];
}

/** Résumé court des filtres actifs, en minuscules (en-tête de la table). */
export function filterSummary(f: Filters): string {
  const parts = filterChips(f).map((c) => (c.kind === 'status' ? STATUS_PLURAL[c.status!] : c.kind === 'risk' ? c.label.toLowerCase() : c.label));
  return parts.length ? parts.join(', ') : 'sans filtre';
}
