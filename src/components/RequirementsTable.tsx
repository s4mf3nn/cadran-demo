import { memo, useRef, useState, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown01Icon, ArrowUp01Icon, Layers01Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import { filterSummary, SORT_LABEL } from '@/lib/labels';
import type { Aggregates, Requirement, SortKey } from '../data/types';
import { useFilters } from '../store/filters';
import { RiskMeter } from './RiskMeter';
import { StatusTag } from './StatusTag';
import { SortMenu } from './layout/ViewBar';

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'ref', label: 'Référence', width: '8.75rem' },
  { key: 'country', label: 'Pays', width: '9rem' },
  { key: 'status', label: 'Statut', width: '9rem' },
  { key: 'risk', label: 'Risque', width: '6.25rem' },
  { key: 'dueAt', label: 'Échéance', width: '7.5rem' },
];
const GRID = `${COLUMNS.map((c) => c.width).join(' ')} minmax(12rem, 1fr)`;
/** Largeur minimale de la grille (colonnes fixes + 12rem d'intitulé) : au-delà, l'intitulé s'élargit et se tronque. */
const MIN_WIDTH = 'min-w-[52.5rem]';
const ROW_HEIGHT = 46;
const HEADER_HEIGHT = 36;
const TITLE_HEIGHT = 47;
/** Hauteur de la carte pour 20 lignes : titre + en-tête + lignes + pb-3 de la grille + bordures (plafonnée à la zone visible dans App). */
export const TABLE_MIN_HEIGHT = TITLE_HEIGHT + HEADER_HEIGHT + 20 * ROW_HEIGHT + 12 + 4;
const CELL = 'flex h-full min-w-0 items-center px-3';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });
const nf = new Intl.NumberFormat('fr-FR');

/**
 * Table virtualisée : quelle que soit la taille du résultat (150 000 lignes),
 * seules ~30 lignes existent dans le DOM. Navigation clavier par ligne
 * (flèches haut/bas, Page Up/Down, Home/End, Espace, Entrée) avec la sémantique ARIA grid.
 */
export const RequirementsTable = memo(function RequirementsTable({ rows, aggregates }: { rows: Requirement[]; aggregates?: Aggregates }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const sort = useFilters((s) => s.sort);
  const setSort = useFilters((s) => s.setSort);
  const selectedId = useFilters((s) => s.selectedId);
  const select = useFilters((s) => s.select);
  const open = useFilters((s) => s.open);
  const filters = useFilters((s) => s.filters);

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    // Les lignes commencent sous l'en-tête collant : sans cette marge, la ligne active peut s'y cacher.
    scrollMargin: HEADER_HEIGHT,
  });

  const activeIndex = Math.min(active, Math.max(rows.length - 1, 0));

  const move = (to: number) => {
    const next = Math.max(0, Math.min(rows.length - 1, to));
    setActive(next);
    virtualizer.scrollToIndex(next, { align: 'auto' });
  };

  const onKeyDown = (e: KeyboardEvent) => {
    // Les touches de la grille ne doivent pas se déclencher depuis les boutons d'en-tête (Espace/Entrée = tri).
    if (e.target !== e.currentTarget) return;
    const page = Math.floor(((parentRef.current?.clientHeight ?? 400) - HEADER_HEIGHT) / ROW_HEIGHT);
    const row = rows[activeIndex];
    const keys: Record<string, () => void> = {
      ArrowDown: () => move(activeIndex + 1),
      ArrowUp: () => move(activeIndex - 1),
      PageDown: () => move(activeIndex + page),
      PageUp: () => move(activeIndex - page),
      Home: () => move(0),
      End: () => move(rows.length - 1),
      ' ': () => row && open(row),
      Enter: () => row && open(row),
    };
    const action = keys[e.key];
    if (action) {
      e.preventDefault();
      action();
    }
  };

  return (
    <section aria-labelledby="requirements-title" className="flex h-full min-h-0 flex-col overflow-hidden rounded-card border-2 border-card-border bg-background">
      <div className="flex shrink-0 items-center gap-3 px-6 pt-4 pb-2" style={{ height: TITLE_HEIGHT }}>
        <Icon icon={Layers01Icon} size={22} className="text-muted" />
        <h2 id="requirements-title" className="text-title font-medium">Exigences</h2>
        <p className="min-w-0 flex-1 truncate text-sm text-muted">
          {nf.format(rows.length)} · {filterSummary(filters)}
          {aggregates && <span className="sr-only"> · {nf.format(aggregates.byStatus.non_conforme)} non conformes · {nf.format(aggregates.atRisk)} en risque</span>}
        </p>
        <SortMenu align="end">
          <button
            type="button"
            aria-label={`Trié par ${SORT_LABEL[sort.key].toLowerCase()}, ordre ${sort.dir === 'asc' ? 'croissant' : 'décroissant'} : changer le tri`}
            className="-mr-2 shrink-0 rounded-full px-2 py-1 text-sm text-muted hover:bg-surface hover:text-foreground data-[state=open]:bg-surface data-[state=open]:text-foreground"
          >
            Trié par {SORT_LABEL[sort.key].toLowerCase()} {sort.dir === 'asc' ? '↑' : '↓'}
          </button>
        </SortMenu>
      </div>

      <div
        role="grid"
        aria-label="Exigences réglementaires"
        // En-tête + lignes ; sans résultat, une ligne porte le message.
        aria-rowcount={Math.max(rows.length, 1) + 1}
        aria-activedescendant={rows.length ? `row-${rows[activeIndex]?.id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        ref={parentRef}
        className="group/grid relative min-h-0 flex-1 overflow-auto px-3 pb-3 text-body outline-none"
      >
        <div role="row" aria-rowindex={1} className={cn('sticky top-0 z-10 grid bg-background', MIN_WIDTH)} style={{ gridTemplateColumns: GRID, height: HEADER_HEIGHT }}>
          {COLUMNS.map((c) => {
            const isSorted = sort.key === c.key;
            return (
              <div
                key={c.key}
                role="columnheader"
                aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="h-full min-w-0"
              >
                <button
                  type="button"
                  onClick={() => setSort(c.key)}
                  className={cn('flex h-full w-full items-center gap-1 rounded-lg px-3 text-left text-caption hover:text-foreground', isSorted ? 'text-foreground-soft' : 'text-muted')}
                >
                  {c.label}
                  {isSorted && <Icon icon={sort.dir === 'asc' ? ArrowUp01Icon : ArrowDown01Icon} size={14} />}
                </button>
              </div>
            );
          })}
          <div role="columnheader" className="flex items-center px-3 text-caption text-muted">Intitulé</div>
        </div>

        {rows.length === 0 ? (
          <div role="row" aria-rowindex={2} className={MIN_WIDTH}>
            <div role="gridcell" aria-colspan={COLUMNS.length + 1} className="p-6 text-center text-muted">Aucune exigence ne correspond aux filtres.</div>
          </div>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }} className={MIN_WIDTH}>
            {virtualizer.getVirtualItems().map((v) => {
              const r = rows[v.index]!;
              const isActive = v.index === activeIndex;
              const isSelected = r.id === selectedId;
              // Pas de séparateur au-dessus de la première ligne, ni autour de la ligne sélectionnée.
              const noSeparator = v.index === 0 || isSelected || rows[v.index - 1]?.id === selectedId;
              return (
                <div
                  key={r.id}
                  id={`row-${r.id}`}
                  role="row"
                  aria-rowindex={v.index + 2}
                  aria-selected={isSelected}
                  onClick={() => { setActive(v.index); select(r.id); open(r); }}
                  className={cn(
                    'absolute left-0 grid w-full cursor-pointer items-center rounded-2xl border-t',
                    noSeparator ? 'border-transparent' : 'border-line',
                    isSelected ? 'bg-surface' : 'hover:bg-surface/60',
                    isActive && 'group-focus-visible/grid:shadow-[inset_0_0_0_2px_var(--foreground)]',
                  )}
                  style={{ gridTemplateColumns: GRID, height: ROW_HEIGHT, transform: `translateY(${v.start - HEADER_HEIGHT}px)` }}
                >
                  <div role="gridcell" className={cn(CELL, 'text-muted-soft tabular-nums')}><span className="truncate">{r.ref}</span></div>
                  <div role="gridcell" className={CELL}><span className="truncate">{r.country}</span></div>
                  <div role="gridcell" className={CELL}><StatusTag status={r.status} /></div>
                  <div role="gridcell" className={CELL}><RiskMeter risk={r.risk} /></div>
                  <div role="gridcell" className={cn(CELL, 'tabular-nums')}>{dateFmt.format(r.dueAt)}</div>
                  <div role="gridcell" className={CELL}><span className="truncate">{r.title}</span></div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
});
