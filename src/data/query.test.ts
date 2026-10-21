import { describe, expect, it } from 'vitest';
import { generateRequirements } from './generate';
import { runQuery } from './query';
import type { Filters, Sort } from './types';

const data = generateRequirements(5_000, 1);
const noFilter: Filters = { search: '', countries: [], categories: [], statuses: [], minRisk: 1 };
const byRef: Sort = { key: 'ref', dir: 'asc' };
const NOW = Date.UTC(2026, 9, 1);

describe('generateRequirements', () => {
  it('est déterministe pour une même seed', () => {
    expect(generateRequirements(100, 7)).toEqual(generateRequirements(100, 7));
  });
});

describe('runQuery', () => {
  it('renvoie tout sans filtre et des agrégats cohérents', () => {
    const { indices, aggregates } = runQuery(data, noFilter, byRef, NOW);
    expect(indices.length).toBe(data.length);
    const sumStatus = Object.values(aggregates.byStatus).reduce((a, b) => a + b, 0);
    expect(sumStatus).toBe(data.length);
    const sumCountries = aggregates.byCountry.reduce((a, c) => a + c.count, 0);
    expect(sumCountries).toBe(aggregates.atRisk);
  });

  it('combine les filtres pays, statut et risque', () => {
    const f: Filters = { ...noFilter, countries: ['France'], statuses: ['non_conforme'], minRisk: 3 };
    const { indices } = runQuery(data, f, byRef, NOW);
    expect(indices.length).toBeGreaterThan(0);
    for (const i of indices) {
      const r = data[i]!;
      expect(r.country).toBe('France');
      expect(r.status).toBe('non_conforme');
      expect(r.risk).toBeGreaterThanOrEqual(3);
    }
  });

  it('recherche sans tenir compte de la casse', () => {
    const { indices } = runQuery(data, { ...noFilter, search: 'req-000042' }, byRef, NOW);
    expect(Array.from(indices, (i) => data[i]!.ref)).toEqual(['REQ-000042']);
  });

  it('trie par échéance décroissante de façon stable', () => {
    const { indices } = runQuery(data, noFilter, { key: 'dueAt', dir: 'desc' }, NOW);
    for (let i = 1; i < indices.length; i++) {
      expect(data[indices[i - 1]!]!.dueAt).toBeGreaterThanOrEqual(data[indices[i]!]!.dueAt);
    }
  });

  it('traite 150 000 lignes en un temps raisonnable', () => {
    const big = generateRequirements(150_000, 3);
    const t0 = performance.now();
    runQuery(big, { ...noFilter, search: 'batterie' }, { key: 'risk', dir: 'desc' }, NOW);
    expect(performance.now() - t0).toBeLessThan(1_500);
  });
});
