import { memo, useRef, useState, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Alert02Icon, ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon, Calendar03Icon, File01Icon, Globe02Icon,
  GridViewIcon, InformationCircleIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';
import { COUNTRY_CODE } from '@/lib/labels';
import { CATEGORIES, COUNTRIES, type Aggregates, type Requirement, type SortKey } from '../data/types';
import { useFilters } from '../store/filters';
import { RiskMeter } from './RiskMeter';
import { StatusTag } from './StatusTag';

const COLUMNS: { key: SortKey; label: string; width: string; icon: IconSvgElement }[] = [
  { key: 'ref', label: 'Référence', width: '10.5rem', icon: File01Icon },
  { key: 'country', label: 'Pays', width: '11rem', icon: Globe02Icon },
  { key: 'category', label: 'Catégorie', width: '9rem', icon: GridViewIcon },
  { key: 'status', label: 'Statut', width: '8rem', icon: InformationCircleIcon },
  { key: 'risk', label: 'Risque', width: '7.5rem', icon: Alert02Icon },
  { key: 'dueAt', label: 'Échéance', width: '8rem', icon: Calendar03Icon },
];
const GRID = `${COLUMNS.map((c) => c.width).join(' ')} minmax(16rem, 1fr)`;
const ROW_HEIGHT = 40;
const CELL = 'flex h-full min-w-0 items-center border-r border-border px-3 last:border-r-0';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' });
const nf = new Intl.NumberFormat('fr-FR');

/**
 * Table virtualisée : quelle que soit la taille du résultat (150 000 lignes),
 * seules ~30 lignes existent dans le DOM. Accessible au clavier
 * (flèches, Page Up/Down, Home/End, Espace, Entrée) avec la sémantique ARIA grid.
 */
export const RequirementsTable = memo(function RequirementsTable({ rows, aggregates }: { rows: Requirement[]; aggregates?: Aggregates }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const sort = useFilters((s) => s.sort);
  const setSort = useFilters((s) => s.setSort);
  const selectedId = useFilters((s) => s.selectedId);
  const select = useFilters((s) => s.select);
  const open = useFilters((s) => s.open);
  const nbCountries = useFilters((s) => s.filters.countries.length || COUNTRIES.length);
  const nbCategories = useFilters((s) => s.filters.categories.length || CATEGORIES.length);

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
    // Les touches de la grille ne doivent pas se déclencher depuis les boutons d'en-tête (Espace/Entrée = tri).
    if (e.target !== e.currentTarget) return;
    const page = Math.floor((parentRef.current?.clientHeight ?? 400) / ROW_HEIGHT);
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
    <section aria-label="Exigences" className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div
        role="grid"
        aria-label="Exigences réglementaires"
        aria-rowcount={rows.length + 1}
        aria-activedescendant={rows.length ? `row-${rows[activeIndex]?.id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        ref={parentRef}
        className="relative min-h-0 flex-1 overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div role="row" aria-rowindex={1} className="sticky top-0 z-10 grid min-w-max border-b border-border bg-sidebar" style={{ gridTemplateColumns: GRID, height: ROW_HEIGHT }}>
          {COLUMNS.map((c) => {
            const isSorted = sort.key === c.key;
            return (
              <div
                key={c.key}
                role="columnheader"
                aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                className="h-full min-w-0 border-r border-border"
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSort(c.key)}
                  className="h-full w-full justify-start gap-1.5 rounded-none px-3 text-xs font-medium text-muted-foreground hover:bg-accent"
                >
                  <Icon icon={c.icon} size={14} />
                  <span className="flex-1 text-left">{c.label}</span>
                  <Icon icon={isSorted ? (sort.dir === 'asc' ? ArrowUp01Icon : ArrowDown01Icon) : ArrowUpDownIcon} size={14} className={isSorted ? 'text-foreground' : 'text-muted-foreground/70'} />
                </Button>
              </div>
            );
          })}
          <div role="columnheader" className="flex items-center px-3 text-xs font-medium text-muted-foreground">Intitulé</div>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">Aucune exigence ne correspond aux filtres.</p>
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }} className="min-w-max">
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
                  onClick={() => { setActive(v.index); select(r.id); open(r); }}
                  className={cn(
                    'absolute left-0 grid w-full min-w-max cursor-pointer items-center border-b border-border',
                    isSelected ? 'bg-surface' : 'hover:bg-accent/60',
                    isActive && 'shadow-[inset_0_0_0_2px_var(--ring)]',
                  )}
                  style={{ gridTemplateColumns: GRID, height: ROW_HEIGHT, transform: `translateY(${v.start}px)` }}
                >
                  <div role="gridcell" className={cn(CELL, 'gap-2')}>
                    <span aria-hidden="true" className="grid size-6 shrink-0 place-items-center rounded-md border border-border bg-background text-muted-foreground">
                      <Icon icon={File01Icon} size={13} />
                    </span>
                    <span className="truncate font-mono text-xs underline decoration-border decoration-1 underline-offset-4">{r.ref}</span>
                  </div>
                  <div role="gridcell" className={CELL}>
                    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-background py-0.5 pr-2 pl-1 text-xs">
                      <span aria-hidden="true" className="rounded-full bg-accent px-1 font-mono text-[10px] font-medium text-muted-foreground">{COUNTRY_CODE[r.country]}</span>
                      <span className="truncate">{r.country}</span>
                    </span>
                  </div>
                  <div role="gridcell" className={cn(CELL, 'truncate')}>{r.category}</div>
                  <div role="gridcell" className={CELL}><StatusTag status={r.status} /></div>
                  <div role="gridcell" className={CELL}><RiskMeter risk={r.risk} /></div>
                  <div role="gridcell" className={cn(CELL, 'tabular-nums')}>{dateFmt.format(r.dueAt)}</div>
                  <div role="gridcell" className={cn(CELL, 'truncate text-muted-foreground')}>{r.title}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer className="flex h-10 shrink-0 items-center justify-between gap-4 border-t border-border bg-sidebar px-4 text-xs text-muted-foreground">
        <p className="tabular-nums">
          <strong className="font-medium text-foreground">{nf.format(rows.length)}</strong> exigences · {nbCountries} pays · {nbCategories} catégories
          {aggregates && ` · ${nf.format(aggregates.byStatus.non_conforme)} non conformes · ${nf.format(aggregates.atRisk)} en risque`}
        </p>
        <p className="hidden items-center gap-1.5 md:flex" aria-hidden="true">
          <Kbd>↑</Kbd><Kbd>↓</Kbd> naviguer <Kbd>↵</Kbd> ouvrir (ou clic)
        </p>
      </footer>
    </section>
  );
});
