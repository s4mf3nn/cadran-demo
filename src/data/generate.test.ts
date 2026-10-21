import { describe, expect, it } from 'vitest';
import { generateRequirements } from './generate';

describe('generateRequirements — écarts entre pays', () => {
  const rows = generateRequirements(150_000, 42);
  const stats = new Map<string, { n: number; nc: number }>();
  for (const r of rows) {
    const s = stats.get(r.country) ?? { n: 0, nc: 0 };
    s.n++;
    if (r.status === 'non_conforme') s.nc++;
    stats.set(r.country, s);
  }
  const rate = (c: string) => stats.get(c)!.nc / stats.get(c)!.n;

  it('le pays le plus fréquent a au moins 3× le volume du moins fréquent', () => {
    const counts = [...stats.values()].map((s) => s.n);
    expect(Math.max(...counts) / Math.min(...counts)).toBeGreaterThanOrEqual(3);
  });

  it('chaque pays a des catégories dominantes (points chauds)', () => {
    const cnt = (country: string, cat: string) => rows.filter((r) => r.country === country && r.category === cat).length;
    expect(cnt('Pays-Bas', 'Vélo')).toBeGreaterThan(cnt('Pays-Bas', 'Escalade') * 5);
    expect(cnt('Turquie', 'Textile')).toBeGreaterThan(cnt('Turquie', 'Nautique') * 5);
  });

  it('le taux de non-conformité varie nettement selon le pays', () => {
    expect(rate('Chine')).toBeGreaterThan(rate('Allemagne') * 3);
  });
});
