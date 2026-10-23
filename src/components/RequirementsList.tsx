import { memo, useRef } from 'react';
import { useFixedVirtual } from '../hooks/useFixedVirtual';
import { useFilters } from '../store/filters';
import type { RowSet } from '../data/types';
import { RiskMeter } from './RiskMeter';
import { StatusTag } from './StatusTag';
import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 72;
const nf = new Intl.NumberFormat('fr-FR');

/** Version mobile de la table : une liste virtualisée (référence, statut, intitulé). */
export const RequirementsList = memo(function RequirementsList({ rows }: { rows: RowSet }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedId = useFilters((s) => s.selectedId);
  const select = useFilters((s) => s.select);
  const open = useFilters((s) => s.open);
  const virtualizer = useFixedVirtual({ count: rows.length, scrollRef: parentRef, itemHeight: ITEM_HEIGHT, overscan: 8 });

  return (
    <section aria-label="Exigences" className="flex h-[32rem] flex-col overflow-hidden rounded-card border-2 border-card-border bg-background">
      <p className="shrink-0 px-5 pt-4 pb-2 text-title font-medium">
        Exigences <span className="text-sm font-normal text-muted tabular-nums">{nf.format(rows.length)}</span>
      </p>
      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto px-2 pb-2">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-muted">Aucune exigence ne correspond aux filtres.</p>
        ) : (
          <ul role="list" aria-label="Exigences réglementaires" style={{ height: virtualizer.totalSize }} className="relative">
            {virtualizer.items.map((v) => {
              const r = rows.at(v.index)!;
              const isSelected = r.id === selectedId;
              return (
                <li
                  key={r.id}
                  aria-setsize={rows.length}
                  aria-posinset={v.index + 1}
                  className={cn('absolute left-0 w-full border-t', v.index === 0 || isSelected || rows.at(v.index - 1)?.id === selectedId ? 'border-transparent' : 'border-line')}
                  style={{ height: ITEM_HEIGHT, transform: `translateY(${v.top}px)` }}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { select(r.id); open(r); }}
                    className={cn('flex h-full w-full flex-col justify-center gap-1.5 rounded-2xl px-3 text-left', isSelected && 'bg-surface')}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-sm text-muted-soft tabular-nums">{r.ref} · {r.country}</span>
                      <StatusTag status={r.status} className="text-sm" />
                    </span>
                    <span className="flex items-center justify-between gap-3">
                      <span className="truncate text-body">{r.title}</span>
                      <RiskMeter risk={r.risk} className="shrink-0" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
});
