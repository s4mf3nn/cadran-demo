import { describe, expect, it } from 'vitest';
import { initialFilters } from '../store/filters';
import { DEFAULT_SORT, decodeUrlState, encodeUrlState } from './urlState';

describe('urlState', () => {
  it("l'état initial donne une URL vide", () => {
    expect(encodeUrlState({ filters: initialFilters, sort: DEFAULT_SORT, openId: null })).toBe('');
    expect(decodeUrlState('')).toEqual({ filters: initialFilters, sort: DEFAULT_SORT, openId: null });
  });

  it('fait un aller-retour sur un état complet', () => {
    const state = {
      filters: {
        search: 'câble é&',
        countries: ['France', 'Corée du Sud'],
        categories: ['Vélo électrique'],
        statuses: ['non_conforme', 'en_cours'],
        regulations: ['EN 14764'],
        minRisk: 4,
        dueWithin: 90,
      },
      sort: { key: 'risk', dir: 'desc' },
      openId: 1234,
    } as const;
    const qs = encodeUrlState(structuredClone(state) as never);
    expect(decodeUrlState(`?${qs}`)).toEqual(state);
  });

  it('ignore les valeurs inconnues ou invalides', () => {
    const s = decodeUrlState('?pays=France,Atlantide&risque=9&echeance=7&tri=nimporte.desc&fiche=abc');
    expect(s.filters.countries).toEqual(['France']);
    expect(s.filters.minRisk).toBe(1);
    expect(s.filters.dueWithin).toBeNull();
    expect(s.sort).toEqual(DEFAULT_SORT);
    expect(s.openId).toBeNull();
  });

  it('accepte la fiche 0', () => {
    expect(decodeUrlState('?fiche=0').openId).toBe(0);
  });
});
