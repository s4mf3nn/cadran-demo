import { create } from 'zustand';
import type { Filters, Requirement, Risk, Sort, SortKey } from '../data/types';

interface FiltersState {
  filters: Filters;
  sort: Sort;
  selectedId: number | null;
  /** Exigence dont le détail est ouvert (copie : elle reste affichée si les filtres l'écartent entre-temps). */
  opened: Requirement | null;
  setSearch: (search: string) => void;
  toggle: <K extends 'countries' | 'categories' | 'statuses'>(key: K, value: Filters[K][number]) => void;
  setMinRisk: (risk: Risk) => void;
  setSort: (key: SortKey) => void;
  select: (id: number | null) => void;
  open: (requirement: Requirement | null) => void;
  reset: () => void;
}

const initialFilters: Filters = { search: '', countries: [], categories: [], statuses: [], minRisk: 1 };

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
  setSort: (key) =>
    set((s) => ({ sort: { key, dir: s.sort.key === key && s.sort.dir === 'asc' ? 'desc' : 'asc' } })),
  select: (selectedId) => set({ selectedId }),
  open: (opened) => set({ opened }),
  reset: () => set({ filters: initialFilters }),
}));
