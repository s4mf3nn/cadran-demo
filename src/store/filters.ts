import { create } from 'zustand';
import type { DueWithin, Filters, Requirement, Risk, Sort, SortKey } from '../data/types';

interface FiltersState {
  filters: Filters;
  sort: Sort;
  selectedId: number | null;
  /** Exigence dont le détail est ouvert (copie : elle reste affichée si les filtres l'écartent entre-temps). */
  opened: Requirement | null;
  setSearch: (search: string) => void;
  toggle: <K extends 'countries' | 'categories' | 'statuses' | 'regulations'>(key: K, value: Filters[K][number]) => void;
  setMinRisk: (risk: Risk) => void;
  /** Sélectionne une fenêtre d'échéance ; la re-sélectionner la retire (toutes les échéances). */
  setDueWithin: (days: DueWithin) => void;
  setSort: (key: SortKey) => void;
  select: (id: number | null) => void;
  open: (requirement: Requirement | null) => void;
  reset: () => void;
}

export const initialFilters: Filters = {
  search: '', countries: [], categories: [], statuses: [], regulations: [], minRisk: 1, dueWithin: null,
};

export const useFilters = create<FiltersState>((set) => ({
  filters: initialFilters,
  sort: { key: 'dueAt', dir: 'asc' },
  selectedId: null,
  opened: null,
  setSearch: (search) => set((s) => ({ filters: { ...s.filters, search } })),
  toggle: (key, value) =>
    set((s) => {
      const list = s.filters[key] as string[];
      const next = list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
      return { filters: { ...s.filters, [key]: next } };
    }),
  setMinRisk: (minRisk) => set((s) => ({ filters: { ...s.filters, minRisk } })),
  setDueWithin: (days) =>
    set((s) => ({ filters: { ...s.filters, dueWithin: s.filters.dueWithin === days ? null : days } })),
  setSort: (key) =>
    set((s) => ({ sort: { key, dir: s.sort.key === key && s.sort.dir === 'asc' ? 'desc' : 'asc' } })),
  select: (selectedId) => set({ selectedId }),
  open: (opened) => set({ opened }),
  reset: () => set({ filters: initialFilters }),
}));
