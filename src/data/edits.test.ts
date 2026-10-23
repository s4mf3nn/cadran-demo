import { describe, expect, it } from 'vitest';
import { applyEdit, sanitizeEdits } from './edits';
import { generateRequirements } from './generate';
import { runQuery } from './query';
import { initialFilters } from '../store/filters';

const [r] = generateRequirements(1);

describe('applyEdit', () => {
  it("laisse l'exigence intacte sans modification", () => {
    expect(applyEdit(r!, undefined)).toBe(r);
  });

  it('applique les champs modifiés', () => {
    expect(applyEdit(r!, { status: 'non_conforme', risk: 5 })).toMatchObject({ id: r!.id, ref: r!.ref, status: 'non_conforme', risk: 5 });
  });

  it("garde l'intitulé cohérent quand la réglementation change", () => {
    const next = applyEdit(r!, { regulation: 'REACH' });
    expect(next.title).toBe(r!.title.replace(/\([^)]*\)$/, '(REACH)'));
  });

  it("respecte un intitulé saisi avec la réglementation", () => {
    expect(applyEdit(r!, { regulation: 'REACH', title: 'Mon intitulé' }).title).toBe('Mon intitulé');
  });
});

describe('sanitizeEdits', () => {
  it('écarte les ids, champs et valeurs invalides', () => {
    expect(sanitizeEdits({
      3: { status: 'conforme', risk: 9, foo: 1, title: '  ' },
      x: { status: 'conforme' },
      4: { dueAt: 'demain' },
      5: 'nope',
    })).toEqual({ 3: { status: 'conforme' } });
    expect(sanitizeEdits(null)).toEqual({});
  });
});

describe('modifications et requêtes', () => {
  it('se répercutent sur les agrégats', () => {
    const data = generateRequirements(500);
    const before = runQuery(data, initialFilters, { key: 'ref', dir: 'asc' }).aggregates;
    const target = data.find((d) => d.status === 'conforme' && d.risk < 4)!;
    data[target.id] = applyEdit(target, { status: 'non_conforme' });
    const after = runQuery(data, initialFilters, { key: 'ref', dir: 'asc' }).aggregates;
    expect(after.byStatus.non_conforme).toBe(before.byStatus.non_conforme + 1);
    expect(after.atRisk).toBe(before.atRisk + 1);
  });
});
