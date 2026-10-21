import { ArrowDown01Icon, ArrowUpDownIcon, FilterHorizontalIcon } from '@hugeicons/core-free-icons';
import { SORT_LABEL } from '@/lib/labels';
import { focusIn } from '@/lib/focus';
import { useFilters } from '@/store/filters';
import type { SortKey } from '@/data/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export interface Timings { init?: number; query?: number }

export function SortButton({ className }: { className?: string }) {
  const sort = useFilters((s) => s.sort);
  const setSort = useFilters((s) => s.setSort);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn('border-dashed shadow-none', className)}>
          <Icon icon={ArrowUpDownIcon} />
          Trier
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Trier par ({sort.dir === 'asc' ? 'croissant' : 'décroissant'})</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort.key} onValueChange={(v) => setSort(v as SortKey)}>
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            <DropdownMenuRadioItem key={k} value={k} onSelect={(e) => { if (k === sort.key) { e.preventDefault(); setSort(k); } }}>
              {SORT_LABEL[k]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ViewBar({ timings, isRefreshing }: { timings: Timings; isRefreshing: boolean }) {
  const activeFilters = useFilters((s) => {
    const f = s.filters;
    return f.statuses.length + f.categories.length + f.countries.length + (f.minRisk > 1 ? 1 : 0) + (f.search ? 1 : 0);
  });

  return (
    <div className="flex h-12 shrink-0 items-center justify-between gap-3 px-6">
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="font-semibold">
              Toutes les exigences
              <Icon icon={ArrowDown01Icon} size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuRadioGroup value="all">
              <DropdownMenuRadioItem value="all">Toutes les exigences</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <SortButton />

        <Button type="button" variant="outline" size="sm" className="border-dashed shadow-none" onClick={() => focusIn('left', 'filter-status')}>
          <Icon icon={FilterHorizontalIcon} />
          Filtrer
          {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-xs tabular-nums">{activeFilters}</span>}
        </Button>
      </div>

      <p className="hidden text-xs text-muted-foreground lg:block" aria-live="polite">
        {timings.init != null && `génération ${timings.init.toFixed(0)} ms`}
        {timings.query != null && ` · requête ${timings.query.toFixed(0)} ms (hors main thread)`}
        {isRefreshing && ' · recalcul…'}
      </p>
    </div>
  );
}
