import { describe, expect, it } from 'vitest';
import { generateRequirements } from './generate';
import { runQuery } from './query';
import type { Filters, Sort } from './types';

const data = generateRequirements(5_000, 1);
const noFilter: Filters = { search: '', countries: [], categories: [], statuses: [], regulations: [], minRisk: 1, dueWithin: null };
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

  it('ventile les échéances par statut et les volumes par catégorie', () => {
    const { aggregates } = runQuery(data, noFilter, byRef, NOW);
    aggregates.deadlines.forEach((d, m) => {
      const sum = Object.values(aggregates.deadlinesByStatus[m]!).reduce((a, b) => a + b, 0);
      expect(sum).toBe(d.count);
    });
    expect(Object.values(aggregates.byCategory).reduce((a, b) => a + b, 0)).toBe(data.length);
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

  it('ventile par risque (1 à 5) et par statut sans perte', () => {
    const f: Filters = { ...noFilter, countries: ['France', 'Chine'] };
    const { aggregates } = runQuery(data, f, byRef, NOW);
    const sum = (o: Record<string, number>) => Object.values(o).reduce((a, b) => a + b, 0);
    expect(Object.keys(aggregates.byRisk)).toEqual(['1', '2', '3', '4', '5']);
    expect(sum(aggregates.byRisk)).toBe(aggregates.total);
    expect(sum(aggregates.byStatus)).toBe(aggregates.total);
  });

  it('les volumes par statut du panneau ignorent le filtre de statut', () => {
    const all = runQuery(data, noFilter, byRef, NOW).aggregates;
    const nc = runQuery(data, { ...noFilter, statuses: ['non_conforme'] }, byRef, NOW).aggregates;
    expect(nc.statusFacets).toEqual(all.byStatus);
    expect(nc.total).toBe(all.byStatus.non_conforme);
    expect(nc.byStatus.conforme).toBe(0);
  });

  it('compte les non conformes en retard et les échéances à moins de 90 jours', () => {
    const { aggregates } = runQuery(data, noFilter, byRef, NOW);
    const DAY = 86_400_000;
    expect(aggregates.overdueNonConforme).toBe(data.filter((r) => r.status === 'non_conforme' && r.dueAt < NOW).length);
    expect(aggregates.dueWithin90).toBe(data.filter((r) => r.dueAt >= NOW && r.dueAt < NOW + 90 * DAY).length);
    expect(aggregates.overdueNonConforme).toBeGreaterThan(0);
  });

  it('en risque = non conforme ou risque >= 4', () => {
    const { aggregates } = runQuery(data, noFilter, byRef, NOW);
    expect(aggregates.atRisk).toBe(data.filter((r) => r.status === 'non_conforme' || r.risk >= 4).length);
  });

  it('filtre par réglementation et par fenêtre d’échéance (retards inclus)', () => {
    const DAY = 86_400_000;
    const { indices } = runQuery(data, { ...noFilter, regulations: ['REACH'], dueWithin: 30 }, byRef, NOW);
    expect(indices.length).toBeGreaterThan(0);
    let overdue = 0;
    for (const i of indices) {
      const r = data[i]!;
      expect(r.regulation).toBe('REACH');
      expect(r.dueAt).toBeLessThanOrEqual(NOW + 30 * DAY);
      if (r.dueAt < NOW) overdue++;
    }
    expect(overdue).toBeGreaterThan(0);
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
