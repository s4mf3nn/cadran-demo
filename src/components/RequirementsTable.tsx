import { memo, useRef, useState, type KeyboardEvent } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowDown01Icon, ArrowUp01Icon, ArrowUpDownIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
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

// Teinte légère en clair ; en sombre, une teinte plus claire ferait chuter le contraste du texte, on passe donc à un liseré.
const STATUS_STYLE: Record<Requirement['status'], string> = {
  conforme: 'bg-success/10 text-success dark:border-success/40 dark:bg-transparent',
  en_cours: 'bg-info/10 text-info dark:border-info/40 dark:bg-transparent',
  a_evaluer: 'bg-warning/10 text-warning dark:border-warning/40 dark:bg-transparent',
  non_conforme: 'bg-destructive/10 text-destructive dark:border-destructive/40 dark:bg-transparent',
};

const RISK_FILL: Record<Requirement['risk'], string> = {
  1: 'bg-success',
  2: 'bg-warning',
  3: 'bg-destructive',
  4: 'bg-destructive',
};

/** Indicateur de risque en 4 segments ; la valeur est portée par l'aria-label de la cellule. */
function RiskMeter({ risk }: { risk: Requirement['risk'] }) {
  return (
    <span aria-hidden="true" className="flex gap-0.5">
      {[1, 2, 3, 4].map((level) => (
        <span key={level} className={cn('h-2 w-3 rounded-[2px]', level <= risk ? RISK_FILL[risk] : 'bg-border')} />
      ))}
    </span>
  );
}

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
    <Card className="h-[28rem] min-h-0 gap-0 py-0 lg:h-full">
      <div
        role="grid"
        aria-label="Exigences réglementaires"
        aria-rowcount={rows.length + 1}
        aria-activedescendant={rows.length ? `row-${rows[activeIndex]?.id}` : undefined}
        tabIndex={0}
        onKeyDown={onKeyDown}
        ref={parentRef}
        className="relative flex-1 overflow-auto text-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
      >
        <div role="row" aria-rowindex={1} className="sticky top-0 z-10 grid border-b bg-muted" style={{ gridTemplateColumns: GRID }}>
          {COLUMNS.map((c) => {
            const isSorted = sort.key === c.key;
            return (
              <div
                key={c.key}
                role="columnheader"
                aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setSort(c.key)}
                  className="h-9 w-full justify-start rounded-none px-3 font-semibold hover:bg-accent"
                >
                  {c.label}
                  {isSorted ? (
                    sort.dir === 'asc' ? <Icon icon={ArrowUp01Icon} size={14} /> : <Icon icon={ArrowDown01Icon} size={14} />
                  ) : (
                    <Icon icon={ArrowUpDownIcon} size={14} className="text-muted-foreground" />
                  )}
                </Button>
              </div>
            );
          })}
          <div role="columnheader" className="flex items-center px-3 font-semibold">Intitulé</div>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">Aucune exigence ne correspond aux filtres.</p>
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
                  className={cn(
                    'absolute left-0 grid w-full cursor-pointer items-center border-b',
                    isSelected ? 'bg-accent' : 'hover:bg-muted/50',
                    isActive && 'outline-2 -outline-offset-2 outline-ring',
                  )}
                  style={{ gridTemplateColumns: GRID, height: ROW_HEIGHT, transform: `translateY(${v.start}px)` }}
                >
                  <div role="gridcell" className="px-3 font-mono text-xs">{r.ref}</div>
                  <div role="gridcell" className="truncate px-3">{r.country}</div>
                  <div role="gridcell" className="truncate px-3">{r.category}</div>
                  <div role="gridcell" className="px-3">
                    <Badge className={STATUS_STYLE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                  </div>
                  <div role="gridcell" className="px-3" aria-label={`Risque ${r.risk} sur 4`}>
                    <RiskMeter risk={r.risk} />
                  </div>
                  <div role="gridcell" className="px-3 tabular-nums">{dateFmt.format(r.dueAt)}</div>
                  <div role="gridcell" className="truncate px-3 text-muted-foreground">{r.title}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
});
