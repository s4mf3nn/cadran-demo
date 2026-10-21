export const COUNTRIES = [
  'France', 'Allemagne', 'Espagne', 'Italie', 'Belgique', 'Pays-Bas', 'Pologne',
  'Royaume-Uni', 'États-Unis', 'Canada', 'Brésil', 'Chine', 'Inde', 'Japon',
  'Corée du Sud', 'Australie', 'Mexique', 'Turquie', 'Maroc', 'Afrique du Sud',
] as const;

/**
 * Profil de démo par pays : `weight` = part du volume d'exigences, `riskBias` (-1..1) =
 * propension à la non-conformité et aux risques élevés. Crée des écarts nets entre pays.
 */
export const COUNTRY_PROFILE: Record<(typeof COUNTRIES)[number], { weight: number; riskBias: number }> = {
  'France': { weight: 14, riskBias: 0.2 },
  'Allemagne': { weight: 12, riskBias: -0.9 },
  'États-Unis': { weight: 11, riskBias: 0.5 },
  'Royaume-Uni': { weight: 9, riskBias: 0.1 },
  'Italie': { weight: 7, riskBias: 0.3 },
  'Espagne': { weight: 6, riskBias: 0 },
  'Chine': { weight: 6, riskBias: 1 },
  'Inde': { weight: 5, riskBias: 0.8 },
  'Pays-Bas': { weight: 4, riskBias: -0.8 },
  'Brésil': { weight: 4, riskBias: 0.7 },
  'Pologne': { weight: 3, riskBias: -0.2 },
  'Japon': { weight: 3, riskBias: -1 },
  'Canada': { weight: 3, riskBias: -0.4 },
  'Turquie': { weight: 2.5, riskBias: 0.9 },
  'Belgique': { weight: 2.5, riskBias: -0.3 },
  'Mexique': { weight: 2, riskBias: 0.4 },
  'Corée du Sud': { weight: 2, riskBias: -0.5 },
  'Australie': { weight: 1.2, riskBias: -0.6 },
  'Maroc': { weight: 1, riskBias: 0.6 },
  'Afrique du Sud': { weight: 1, riskBias: 0.5 },
};

export const CATEGORIES = [
  'Textile', 'Chaussures', 'Vélo', 'Vélo électrique', 'Escalade', 'Nautique',
  'Camping', 'Fitness', 'Électronique', 'Nutrition',
] as const;

/** Poids global par catégorie (variété entre colonnes de la carte de chaleur). */
export const CATEGORY_WEIGHT: Record<(typeof CATEGORIES)[number], number> = {
  'Textile': 2, 'Chaussures': 1.2, 'Vélo': 0.8, 'Vélo électrique': 1.6, 'Escalade': 0.5,
  'Nautique': 0.6, 'Camping': 0.9, 'Fitness': 1, 'Électronique': 2.2, 'Nutrition': 0.7,
};

/** Points chauds : multiplicateur de la catégorie pour un pays (défaut 1). */
export const COUNTRY_HOTSPOTS: Partial<Record<(typeof COUNTRIES)[number], Partial<Record<(typeof CATEGORIES)[number], number>>>> = {
  'France': { 'Vélo': 5, 'Escalade': 6, 'Textile': 1.5 },
  'Allemagne': { 'Vélo électrique': 4, 'Électronique': 2 },
  'États-Unis': { 'Nutrition': 6, 'Fitness': 4, 'Électronique': 1.5 },
  'Royaume-Uni': { 'Camping': 5, 'Nautique': 5 },
  'Italie': { 'Chaussures': 5, 'Textile': 3 },
  'Espagne': { 'Nautique': 5, 'Textile': 2 },
  'Chine': { 'Électronique': 5, 'Vélo électrique': 4, 'Textile': 3 },
  'Inde': { 'Textile': 6, 'Chaussures': 3 },
  'Pays-Bas': { 'Vélo': 8, 'Vélo électrique': 4 },
  'Brésil': { 'Chaussures': 5, 'Nutrition': 4 },
  'Pologne': { 'Camping': 4 },
  'Japon': { 'Électronique': 3, 'Fitness': 3 },
  'Canada': { 'Camping': 6, 'Escalade': 4 },
  'Turquie': { 'Textile': 8 },
  'Mexique': { 'Nutrition': 4, 'Chaussures': 3 },
};

export const STATUSES =['conforme', 'en_cours', 'a_evaluer', 'non_conforme'] as const;

export const STATUS_LABEL: Record<Status, string> = {
  conforme: 'Conforme',
  en_cours: 'En cours',
  a_evaluer: 'À évaluer',
  non_conforme: 'Non conforme',
};

export type Country = (typeof COUNTRIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Risk = 1 | 2 | 3 | 4;

export interface Requirement {
  id: number;
  ref: string;
  title: string;
  regulation: string;
  country: Country;
  category: Category;
  status: Status;
  risk: Risk;
  /** Échéance en timestamp ms (plus léger à trier et à cloner qu'un Date). */
  dueAt: number;
}

export interface Filters {
  search: string;
  countries: Country[];
  categories: Category[];
  statuses: Status[];
  minRisk: Risk;
}

export type SortKey = 'ref' | 'country' | 'category' | 'status' | 'risk' | 'dueAt';
export interface Sort {
  key: SortKey;
  dir: 'asc' | 'desc';
}

export interface Aggregates {
  total: number;
  atRisk: number;
  byStatus: Record<Status, number>;
  /** Non-conformités par pays, triées décroissant. */
  byCountry: { country: Country; count: number }[];
  /** Matrice pays x catégorie du nombre d'exigences non conformes ou en risque >= 3. */
  heatmap: { country: Country; category: Category; count: number }[];
  /** Échéances par mois sur les 12 prochains mois. */
  deadlines: { month: string; count: number }[];
  /** Mêmes mois que `deadlines` (même ordre), ventilés par statut pour les barres empilées. */
  deadlinesByStatus: Record<Status, number>[];
  /** Exigences filtrées par catégorie (volume affiché dans le panneau de filtres). */
  byCategory: Record<Category, number>;
}
