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

export function SortButton({ className }: { className?: string }) {
  const sort = useFilters((s) => s.sort);
  const setSort = useFilters((s) => s.setSort);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn('h-11 rounded-full border-[1.5px] border-track bg-transparent px-4 text-body', className)}>
          <Icon icon={ArrowUpDownIcon} />
          Trier
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuLabel>Trier par ({sort.dir === 'asc' ? 'croissant' : 'décroissant'})</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort.key} onValueChange={(v) => setSort(v as SortKey)}>
          {(Object.keys(SORT_LABEL) as SortKey[]).map((k) => (
            // Radix appelle onValueChange même pour l'option déjà cochée (setSort inverse alors le sens) : onSelect garde juste le menu ouvert.
            <DropdownMenuRadioItem key={k} value={k} onSelect={(e) => { if (k === sort.key) e.preventDefault(); }}>
              {SORT_LABEL[k]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
