import { ArrowUpDownIcon } from '@hugeicons/core-free-icons';
import { SORT_LABEL } from '@/lib/labels';
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

export function TimingsText({ timings, isRefreshing }: { timings: Timings; isRefreshing: boolean }) {
  return (
    <p className="hidden truncate text-xs text-muted-foreground lg:block" aria-live="polite">
      {timings.init != null && `génération ${timings.init.toFixed(0)} ms`}
      {timings.query != null && ` · requête ${timings.query.toFixed(0)} ms (hors main thread)`}
      {isRefreshing && ' · recalcul…'}
    </p>
  );
}
