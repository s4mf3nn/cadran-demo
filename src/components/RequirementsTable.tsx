import { memo, useRef, useState, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { STATUS_LABEL, type Requirement, type SortKey } from '../data/types';
import { useFilters } from '../store/filters';

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'ref', label: 'Référence', width: '9rem' },
  { key: 'country', label: 'Pays', width: '9rem' },
  { key: 'category', label: 'Catégorie', width: '9rem' },
  { key: 'status', label: 'Statut', width: '8rem' },
  { key: 'risk', label: 'Risque', width: '5rem' },
  { key: 'dueAt', label: 'Échéance', width: '7rem' },
];
const GRID = `${COLUMNS.map((c) => c.width).join(' ')} minmax(16rem, 1fr)`;
const ROW_HEIGHT = 36;

const STATUS_STYLE: Record<Requirement['status'], string> = {
  conforme: 'bg-green-100 text-green-800',
  en_cours: 'bg-blue-100 text-blue-800',
  a_evaluer: 'bg-slate-100 text-slate-700',
  non_conforme: 'bg-red-100 text-red-800',
};

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });

/**
 * Table virtualisée : quelle que soit la taille du résultat (150 000 lignes),
 * seules ~30 lignes existent dans le DOM. Accessible au clavier
 * (flèches, Page Up/Down, Home/End, Entrée) avec la sémantique ARIA grid.
 */
export const RequirementsTable = memo(function RequirementsTable({ rows }: { rows: Requirement[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const sort = useFilters((s) => s.sort);
  const setSort = useFilters((s) => s.setSort);
  const selectedId = useFilters((s) => s.selectedId);
  const select = useFilters((s) => s.select);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
  });

  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  const move = (to: number) => {
    const next = Math.max(0, Math.min(rows.length - 1, to));
    setActive(next);
    virtualizer.scrollToIndex(next, { align: 'auto' });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    const page = Math.floor((parentRef.current?.clientHeight ?? 400) / ROW_HEIGHT);
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(activeIndex + 1),
      ArrowUp: () => move(activeIndex - 1),
      PageDown: () => move(activeIndex + page),
      PageUp: () => move(activeIndex - page),
      Home: () => move(0),
      End: () => move(rows.length - 1),
      Enter: () => rows[activeIndex] && select(rows[activeIndex].id),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div
        role="grid"
        aria-label="Exigences réglementaires"
        aria-rowcount={rows.length + 1}
        aria-activedescendant={rows.length ? `row-${rows[activeIndex]?.id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        ref={parentRef}
        className="relative flex-1 overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        <div role="row" aria-rowindex={1} className="sticky top-0 z-10 grid border-b border-slate-200 bg-slate-50" style={{ gridTemplateColumns: GRID }}>
          {COLUMNS.map((c) => {
            const isSorted = sort.key === c.key;
            return (
              <div
                key={c.key}
                role="columnheader"
                aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <button
                  type="button"
                  onClick={() => setSort(c.key)}
                  className="flex w-full items-center gap-1 px-3 py-2 text-left font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {c.label}
                  <span aria-hidden="true" className="text-xs text-slate-400">
                    {isSorted ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}
                  </span>
                </button>
              </div>
            );
          })}
          <div role="columnheader" className="px-3 py-2 font-semibold text-slate-700">Intitulé</div>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-center text-slate-500">Aucune exigence ne correspond aux filtres.</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
            {virtualizer.getVirtualItems().map((v) => {
              const r = rows[v.index]!;
              const isActive = v.index === activeIndex;
              const isSelected = r.id === selectedId;
              return (
                <div
                  key={r.id}
                  id={`row-${r.id}`}
                  role="row"
                  aria-rowindex={v.index + 2}
                  aria-selected={isSelected}
                  onClick={() => { setActive(v.index); select(r.id); }}
                  className={`absolute left-0 grid w-full cursor-pointer items-center border-b border-slate-100 ${
                    isSelected ? 'bg-blue-50' : isActive ? 'bg-slate-50' : 'hover:bg-slate-50'
                  } ${isActive ? 'outline outline-2 -outline-offset-2 outline-blue-400' : ''}`}
                  style={{ gridTemplateColumns: GRID, height: ROW_HEIGHT, transform: `translateY(${v.start}px)` }}
                >
                  <div role="gridcell" className="px-3 font-mono text-xs">{r.ref}</div>
                  <div role="gridcell" className="truncate px-3">{r.country}</div>
                  <div role="gridcell" className="truncate px-3">{r.category}</div>
                  <div role="gridcell" className="px-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                  <div role="gridcell" className="px-3" aria-label={`Risque ${r.risk} sur 4`}>
                    <span aria-hidden="true">{'●'.repeat(r.risk)}<span className="text-slate-300">{'●'.repeat(4 - r.risk)}</span></span>
                  </div>
                  <div role="gridcell" className="px-3 tabular-nums">{dateFmt.format(r.dueAt)}</div>
                  <div role="gridcell" className="truncate px-3 text-slate-600">{r.title}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
