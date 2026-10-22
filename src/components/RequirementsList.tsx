import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useFilters } from '../store/filters';
import type { Requirement } from '../data/types';
import { StatusTag } from './StatusTag';
import { cn } from '@/lib/utils';

const ITEM_HEIGHT = 64;
const nf = new Intl.NumberFormat('fr-FR');

/** Version mobile de la table : une liste virtualisée (référence, statut, intitulé). */
export const RequirementsList = memo(function RequirementsList({ rows }: { rows: Requirement[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const selectedId = useFilters((s) => s.selectedId);
  const select = useFilters((s) => s.select);
  const open = useFilters((s) => s.open);
  const virtualizer = useVirtualizer({ count: rows.length, getScrollElement: () => parentRef.current, estimateSize: () => ITEM_HEIGHT, overscan: 8 });

  return (
    <section aria-label="Exigences" className="flex h-[32rem] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-xs">
      <div ref={parentRef} className="min-h-0 flex-1 overflow-y-auto">
        {rows.length === 0 ? (
          <p className="p-6 text-center text-muted-foreground">Aucune exigence ne correspond aux filtres.</p>
        ) : (
          <ul role="list" aria-label="Exigences réglementaires" style={{ height: virtualizer.getTotalSize() }} className="relative">
            {virtualizer.getVirtualItems().map((v) => {
              const r = rows[v.index]!;
              const isSelected = r.id === selectedId;
              return (
                <li
                  key={r.id}
                  aria-setsize={rows.length}
                  aria-posinset={v.index + 1}
                  className="absolute left-0 w-full border-b border-border"
                  style={{ height: ITEM_HEIGHT, transform: `translateY(${v.start}px)` }}
                >
                  <button
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => { select(r.id); open(r); }}
                    className={cn('flex h-full w-full flex-col justify-center gap-1 px-4 text-left', isSelected && 'bg-surface')}
                  >
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs underline decoration-border underline-offset-4">{r.ref}</span>
                      <StatusTag status={r.status} />
                    </span>
                    <span className="truncate text-sm">{r.title}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <p className="border-t border-border bg-sidebar px-4 py-2 text-xs text-muted-foreground tabular-nums">{nf.format(rows.length)} exigences</p>
    </section>
  );
});
