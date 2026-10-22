import type { Country, Risk, SortKey } from '../data/types';

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
