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

/** Position [longitude, latitude] du point de chaque pays sur la carte (centre du bassin d'activité). */
export const COUNTRY_COORDS: Record<(typeof COUNTRIES)[number], readonly [number, number]> = {
  'France': [2.4, 46.7], 'Allemagne': [10.4, 51.1], 'Espagne': [-3.7, 40.3], 'Italie': [12.5, 42.8],
  'Belgique': [4.5, 50.6], 'Pays-Bas': [5.5, 52.2], 'Pologne': [19.4, 52.1], 'Royaume-Uni': [-1.8, 52.8],
  'États-Unis': [-97, 38.5], 'Canada': [-96, 54], 'Brésil': [-50, -12], 'Chine': [108, 33],
  'Inde': [78.5, 22], 'Japon': [138.5, 36.5], 'Corée du Sud': [127.8, 36.4], 'Australie': [135, -25],
  'Mexique': [-102, 23.5], 'Turquie': [34.5, 39], 'Maroc': [-6.5, 32], 'Afrique du Sud': [24.5, -29.5],
};

/** Réglementations du référentiel (filtre « Réglementation »). */
export const REGULATIONS = [
  'REACH', 'RoHS', 'DEEE', 'EN 14764', 'EN 15194', 'EN 12572', 'ISO 20957',
  'CPSIA', 'Prop 65', 'GB 18401', 'UKCA', 'Loi AGEC', 'Étiquetage textile', 'CE Marking',
] as const;

export const STATUSES = ['conforme', 'en_cours', 'a_evaluer', 'non_conforme'] as const;

export const STATUS_LABEL: Record<Status, string> = {
  conforme: 'Conforme',
  en_cours: 'En cours',
  a_evaluer: 'À évaluer',
  non_conforme: 'Non conforme',
};

export type Country = (typeof COUNTRIES)[number];
export type Category = (typeof CATEGORIES)[number];
export type Status = (typeof STATUSES)[number];
export type Regulation = (typeof REGULATIONS)[number];
/** Risque de 1 (Faible) à 5 (Critique). */
export type Risk = 1 | 2 | 3 | 4 | 5;
export const RISKS = [1, 2, 3, 4, 5] as const satisfies readonly Risk[];
/** Seuil de risque à partir duquel une exigence est « en risque » (avec les non conformes). */
export const AT_RISK_MIN: Risk = 4;
/** Fenêtres d'échéance du filtre, en jours (retards inclus). */
export type DueWithin = 30 | 90 | 365;

export interface Requirement {
  id: number;
  ref: string;
  title: string;
  regulation: Regulation;
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
  regulations: Regulation[];
  minRisk: Risk;
  /** Échéance au plus tard dans N jours (retards inclus) ; null = toutes. */
  dueWithin: DueWithin | null;
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
  /** Volumes par statut avec tous les filtres sauf le statut (pilules du panneau de filtres). */
  statusFacets: Record<Status, number>;
  byRisk: Record<Risk, number>;
  /** Non conformes dont l'échéance est passée. */
  overdueNonConforme: number;
  /** Échéance dans les 90 prochains jours (retards exclus). */
  dueWithin90: number;
  /** Exigences en risque (non conformes ou risque >= AT_RISK_MIN) par pays, triées décroissant. */
  byCountry: { country: Country; count: number }[];
  /** Matrice pays x catégorie du nombre d'exigences en risque. */
  heatmap: { country: Country; category: Category; count: number }[];
  /** Échéances par mois sur les 12 prochains mois. */
  deadlines: { month: string; count: number }[];
  /** Mêmes mois que `deadlines` (même ordre), ventilés par statut pour les barres empilées. */
  deadlinesByStatus: Record<Status, number>[];
  /** Exigences filtrées par catégorie (volume affiché dans le panneau de filtres). */
  byCategory: Record<Category, number>;
}
