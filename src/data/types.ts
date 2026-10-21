export const COUNTRIES = [
  'France', 'Allemagne', 'Espagne', 'Italie', 'Belgique', 'Pays-Bas', 'Pologne',
  'Royaume-Uni', 'États-Unis', 'Canada', 'Brésil', 'Chine', 'Inde', 'Japon',
  'Corée du Sud', 'Australie', 'Mexique', 'Turquie', 'Maroc', 'Afrique du Sud',
] as const;

export const CATEGORIES = [
  'Textile', 'Chaussures', 'Vélo', 'Vélo électrique', 'Escalade', 'Nautique',
  'Camping', 'Fitness', 'Électronique', 'Nutrition',
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
}
