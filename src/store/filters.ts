import { create } from 'zustand';
import type { Filters, Risk, Sort, SortKey } from '../data/types';

interface FiltersState {
  filters: Filters;
  sort: Sort;
  selectedId: number | null;
  setSearch: (search: string) => void;
  toggle: <K extends 'countries' | 'categories' | 'statuses'>(key: K, value: Filters[K][number]) => void;
  setMinRisk: (risk: Risk) => void;
  setSort: (key: SortKey) => void;
  select: (id: number | null) => void;
  reset: () => void;
}

const initialFilters: Filters = { search: '', countries: [], categories: [], statuses: [], minRisk: 1 };

export const useFilters = create<FiltersState>((set) => ({
  filters: initialFilters,
  sort: { key: 'dueAt', dir: 'asc' },
  selectedId: null,
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
  reset: () => set({ filters: initialFilters }),
}));
