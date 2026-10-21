import { useId, useState, type ReactNode } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import { CATEGORIES, COUNTRIES, STATUS_LABEL, STATUSES, type Aggregates, type Risk } from '../data/types';
import { useFilters } from '../store/filters';
import { StatusDot } from './StatusTag';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Kbd } from '@/components/ui/kbd';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const nf = new Intl.NumberFormat('fr-FR');

/** Section repliable. `triggerId` sert de cible de focus aux raccourcis S, R, C et P. */
function Section({ title, hint, count, triggerId, children }: { title: string; hint: string; count?: number; triggerId: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  const contentId = useId();
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border-t border-border px-3 py-2">
      <CollapsibleTrigger
        id={triggerId}
        aria-controls={contentId}
        className="flex min-h-9 w-full items-center gap-2 rounded-md px-1.5 text-left text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Icon icon={ArrowDown01Icon} size={14} className={cn('transition-transform motion-reduce:transition-none', !open && '-rotate-90')} />
        <span className="flex-1">{title}</span>
        {count ? <span className="rounded-full bg-primary px-1.5 text-[11px] text-primary-foreground tabular-nums">{count}</span> : null}
        <Kbd aria-hidden="true">{hint}</Kbd>
      </CollapsibleTrigger>
      <CollapsibleContent id={contentId} className="pt-1 pb-1">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CheckRow({ checked, onChange, label, volume, lead }: { checked: boolean; onChange: () => void; label: string; volume?: number; lead?: ReactNode }) {
  return (
    <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-md px-1.5 text-sm hover:bg-accent">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      {lead}
      <span className="flex-1">{label}</span>
      {volume != null && <span className="text-xs text-muted-foreground tabular-nums">{nf.format(volume)}</span>}
    </label>
  );
}

const RISK_OPTIONS: { value: Risk; label: string; name: string }[] = [
  { value: 1, label: '≥ 1', name: 'Risque 1 ou plus' },
  { value: 2, label: '≥ 2', name: 'Risque 2 ou plus' },
  { value: 3, label: '≥ 3', name: 'Risque 3 ou plus' },
  { value: 4, label: '4', name: 'Risque 4 uniquement' },
];

function CountryCombobox() {
  const countries = useFilters((s) => s.filters.countries);
  const toggle = useFilters((s) => s.toggle);
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" aria-expanded={open} aria-label="Pays" id="filter-country-combobox" className="h-9 w-full justify-between px-2.5 font-normal">
            <span className={countries.length ? '' : 'text-muted-foreground'}>
              {countries.length ? `${countries.length} pays sélectionné${countries.length > 1 ? 's' : ''}` : 'Tous les pays'}
            </span>
            <Icon icon={ArrowDown01Icon} size={14} className="text-muted-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-56 gap-0 p-0">
          <Command>
            <CommandInput placeholder="Rechercher un pays…" />
            <CommandList>
              <CommandEmpty>Aucun pays.</CommandEmpty>
              {COUNTRIES.map((c) => (
                <CommandItem key={c} value={c} onSelect={() => toggle('countries', c)}>
                  <span className="flex-1">{c}</span>
                  {countries.includes(c) && <Icon icon={Tick02Icon} className="text-primary" />}
                </CommandItem>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {countries.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="Pays sélectionnés">
          {countries.map((c) => (
            <li key={c}>
              <button
                type="button"
                onClick={() => toggle('countries', c)}
                aria-label={`Retirer ${c}`}
                className="inline-flex min-h-6 items-center gap-1 rounded-full bg-accent px-2 text-xs hover:bg-border"
              >
                {c}
                <Icon icon={Cancel01Icon} size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function FilterPanel({ aggregates }: { aggregates?: Aggregates }) {
  // Sélecteurs ciblés : le panneau ne se re-rend pas quand on sélectionne une ligne.
  const filters = useFilters((s) => s.filters);
  const setSearch = useFilters((s) => s.setSearch);
  const toggle = useFilters((s) => s.toggle);
  const setMinRisk = useFilters((s) => s.setMinRisk);
  const reset = useFilters((s) => s.reset);
  const dirty = filters.search !== '' || filters.statuses.length + filters.categories.length + filters.countries.length > 0 || filters.minRisk > 1;

  return (
    <div className="flex flex-col">
      <div className="relative px-3 pb-3">
        <Icon icon={Search01Icon} className="pointer-events-none absolute top-1/2 left-5.5 -translate-y-[calc(50%+6px)] text-muted-foreground" />
        <Input
          id="filter-search"
          type="search"
          aria-label="Rechercher une exigence"
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Référence, sujet, règlement…"
          className="pr-8 pl-8 [&::-webkit-search-cancel-button]:hidden"
        />
        <Kbd aria-hidden="true" className="pointer-events-none absolute top-1/2 right-5 -translate-y-[calc(50%+6px)]">/</Kbd>
      </div>

      <Section title="Statut" hint="S" triggerId="filter-status" count={filters.statuses.length}>
        <div role="group" aria-label="Statut">
          {STATUSES.map((s) => (
            <CheckRow
              key={s}
              checked={filters.statuses.includes(s)}
              onChange={() => toggle('statuses', s)}
              label={STATUS_LABEL[s]}
              volume={aggregates?.byStatus[s]}
              lead={<StatusDot status={s} />}
            />
          ))}
        </div>
      </Section>

      <Section title="Risque minimum" hint="R" triggerId="filter-risk" count={filters.minRisk > 1 ? 1 : 0}>
        <RadioGroupPrimitive.Root
          aria-label="Risque minimum"
          value={String(filters.minRisk)}
          onValueChange={(v) => setMinRisk(Number(v) as Risk)}
          className="grid grid-cols-4 gap-0.5 rounded-lg bg-accent p-0.5"
        >
          {RISK_OPTIONS.map((o) => (
            <RadioGroupPrimitive.Item
              key={o.value}
              value={String(o.value)}
              aria-label={o.name}
              className="min-h-8 rounded-md text-xs font-medium text-muted-foreground tabular-nums hover:text-foreground data-[state=checked]:bg-background data-[state=checked]:text-foreground data-[state=checked]:shadow-xs"
            >
              {o.label}
            </RadioGroupPrimitive.Item>
          ))}
        </RadioGroupPrimitive.Root>
      </Section>

      <Section title="Catégories" hint="C" triggerId="filter-category" count={filters.categories.length}>
        <div role="group" aria-label="Catégories">
          {CATEGORIES.map((c) => (
            <CheckRow key={c} checked={filters.categories.includes(c)} onChange={() => toggle('categories', c)} label={c} volume={aggregates?.byCategory[c]} />
          ))}
        </div>
      </Section>

      <Section title="Pays" hint="P" triggerId="filter-country" count={filters.countries.length}>
        <CountryCombobox />
      </Section>

      {dirty && (
        <div className="border-t border-border px-3 py-3">
          <Button type="button" variant="link" onClick={reset} className="h-auto px-0 text-xs underline">
            Réinitialiser les filtres
          </Button>
        </div>
      )}
    </div>
  );
}
