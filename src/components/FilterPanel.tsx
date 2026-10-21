import { useId } from 'react';
import { CATEGORIES, COUNTRIES, STATUS_LABEL, STATUSES, type Risk } from '../data/types';
import { useFilters } from '../store/filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { cn } from '@/lib/utils';

const LEGEND_CLASS = 'mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground';

function ChipGroup<T extends string>({
  legend, options, selected, onToggle, format = (v) => v, className,
}: {
  legend: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  format?: (v: T) => string;
  className?: string;
}) {
  const legendId = useId();
  // Les puces sont des boutons à bascule (Radix expose aria-pressed en mode "multiple").
  // La valeur du ToggleGroup est pilotée par le store : on calcule le diff pour déclencher onToggle.
  const onValueChange = (next: string[]) => {
    const added = next.find((v) => !selected.includes(v as T));
    const removed = selected.find((v) => !next.includes(v));
    const changed = added ?? removed;
    if (changed) onToggle(changed as T);
  };

  return (
    <div role="group" aria-labelledby={legendId}>
      <div id={legendId} className={LEGEND_CLASS}>{legend}</div>
      <ToggleGroup
        type="multiple"
        variant="outline"
        size="sm"
        spacing={1.5}
        value={selected}
        onValueChange={onValueChange}
        className={cn('flex-wrap', className)}
      >
        {options.map((o) => (
          <ToggleGroupItem
            key={o}
            value={o}
            className="h-7 min-w-0 rounded-full px-2.5 text-xs data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:hover:bg-primary/90 data-[state=on]:hover:text-primary-foreground"
          >
            {format(o)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}

export function FilterPanel() {
  // Sélecteurs ciblés : le panneau ne se re-rend pas quand on sélectionne une ligne.
  const filters = useFilters((s) => s.filters);
  const setSearch = useFilters((s) => s.setSearch);
  const toggle = useFilters((s) => s.toggle);
  const setMinRisk = useFilters((s) => s.setMinRisk);
  const reset = useFilters((s) => s.reset);
  const searchId = useId();
  const riskId = useId();

  return (
    <Card className="min-h-0 overflow-y-auto" role="complementary" aria-label="Filtres">
      <CardContent className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={searchId} className={cn(LEGEND_CLASS, 'mb-0')}>Recherche</Label>
          <Input
            id={searchId}
            type="search"
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Référence, sujet, règlement…"
          />
        </div>

        <ChipGroup legend="Statut" options={STATUSES} selected={filters.statuses} onToggle={(v) => toggle('statuses', v)} format={(s) => STATUS_LABEL[s]} />

        <div className="flex flex-col gap-3">
          <div id={riskId} className={LEGEND_CLASS + ' mb-0'}>Risque minimum : {filters.minRisk}</div>
          <Slider
            aria-labelledby={riskId}
            min={1}
            max={4}
            step={1}
            value={[filters.minRisk]}
            onValueChange={([v]) => v !== undefined && setMinRisk(v as Risk)}
          />
        </div>

        <ChipGroup legend="Catégorie" options={CATEGORIES} selected={filters.categories} onToggle={(v) => toggle('categories', v)} />

        {/* 20 pays : la liste défile dans une zone bornée pour garder les autres filtres visibles. */}
        <ScrollArea className="rounded-md [&>[data-slot=scroll-area-viewport]]:max-h-44">
          <ChipGroup legend="Pays" options={COUNTRIES} selected={filters.countries} onToggle={(v) => toggle('countries', v)} className="pr-3" />
        </ScrollArea>

        <Button type="button" variant="link" onClick={reset} className="self-start px-0 underline">
          Réinitialiser les filtres
        </Button>
      </CardContent>
    </Card>
  );
}
