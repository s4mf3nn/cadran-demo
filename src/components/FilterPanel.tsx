import { useState } from 'react';
import { RadioGroup as RadioGroupPrimitive } from 'radix-ui';
import { ArrowDown01Icon, Cancel01Icon, Search01Icon, Tick02Icon } from '@hugeicons/core-free-icons';
import {
  CATEGORIES, COUNTRIES, REGULATIONS, RISKS, STATUS_LABEL, STATUSES,
  type Aggregates, type DueWithin, type Risk,
} from '../data/types';
import { RISK_LABEL } from '../lib/labels';
import { useFilters, initialFilters } from '../store/filters';
import { useUi } from '../store/ui';
import { StatusDot } from './StatusTag';
import { HelpTip } from './viz/HelpTip';
import { nf, SEG_BG } from './viz/format';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Icon } from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const LABEL = 'text-[15px] text-muted';

/** Liste déroulante multi-choix (Popover + Command) présentée en ligne de 50 px : libellé, valeur, chevron. */
function SelectRow<T extends string>({ id, label, all, options, selected, onToggle, placeholder, empty }: {
  id: string;
  label: string;
  all: string;
  options: readonly T[];
  selected: T[];
  onToggle: (value: T) => void;
  placeholder: string;
  empty: string;
}) {
  const [open, setOpen] = useState(false);
  const value = selected.length === 0 ? all : selected.length === 1 ? selected[0] : String(selected.length);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-label={`${label} : ${selected.length ? selected.join(', ') : all}`}
          className="flex h-[50px] w-full items-center gap-3 border-b border-line text-left"
        >
          <span className={cn(LABEL, 'flex-1')}>{label}</span>
          <span className="max-w-32 truncate text-[15px]">{value}</span>
          <Icon icon={ArrowDown01Icon} size={16} className="text-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-0 rounded-2xl border border-track p-0 ring-0">
        <Command className="rounded-2xl">
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>{empty}</CommandEmpty>
            {options.map((o) => (
              <CommandItem key={o} value={o} onSelect={() => onToggle(o)}>
                <span className="flex-1">{o}</span>
                {selected.includes(o) && <Icon icon={Tick02Icon} />}
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const riskValueLabel = (r: Risk) => (r === 1 ? 'Tous niveaux' : r === 5 ? '5 uniquement' : `${r} et plus`);

/** Sélecteur de seuil de risque : radiogroup 1 à 5, plage retenue sur fond continu, barres --seg-n en dessous. */
function RiskSelector() {
  const minRisk = useFilters((s) => s.filters.minRisk);
  const setMinRisk = useFilters((s) => s.setMinRisk);
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <span id="filter-risk-label" className={LABEL}>Risque minimum</span>
        <span className="text-[15px]">{riskValueLabel(minRisk)}</span>
      </div>
      <RadioGroupPrimitive.Root
        id="filter-risk"
        aria-labelledby="filter-risk-label"
        orientation="horizontal"
        value={String(minRisk)}
        onValueChange={(v) => setMinRisk(Number(v) as Risk)}
        className="relative grid h-11 grid-cols-5 rounded-full border-[1.5px] border-track p-[3px] [--knob:36px] max-md:h-[53px] max-md:[--knob:44px]"
      >
        {/* Plage retenue : du seuil au niveau maximal, sur un fond continu. */}
        <span
          aria-hidden="true"
          className="absolute inset-y-[3px] right-[3px] rounded-full bg-surface"
          style={{ left: `calc(3px + (100% - 6px) * ${(minRisk - 0.5) / 5} - var(--knob) / 2)` }}
        />
        {RISKS.map((r) => (
          <RadioGroupPrimitive.Item
            key={r}
            value={String(r)}
            aria-label={`${riskValueLabel(r)} (${RISK_LABEL[r]})`}
            className={cn(
              'relative z-10 grid size-(--knob) place-items-center justify-self-center rounded-full text-[15px] tabular-nums',
              r < minRisk ? 'text-muted hover:text-foreground' : 'text-foreground',
              'data-[state=checked]:bg-foreground data-[state=checked]:font-bold data-[state=checked]:text-background',
            )}
          >
            {r}
          </RadioGroupPrimitive.Item>
        ))}
      </RadioGroupPrimitive.Root>
      <ul aria-hidden="true" className="grid grid-cols-5 gap-1.5 px-1">
        {RISKS.map((r) => (
          <li key={r} className="flex flex-col items-center gap-1.5">
            <span className={cn('h-1 w-full rounded-full', r >= minRisk ? SEG_BG[r - 1] : 'bg-track')} />
            <span className={cn('text-[11.5px]', r >= minRisk ? 'text-foreground-soft' : 'text-muted')}>{RISK_LABEL[r]}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const DUE_OPTIONS: { value: DueWithin; label: string; name: string }[] = [
  { value: 30, label: '30 j', name: 'Échéance sous 30 jours' },
  { value: 90, label: '90 j', name: 'Échéance sous 90 jours' },
  { value: 365, label: '12 mois', name: 'Échéance sous 12 mois' },
];

export function FilterPanel({ aggregates }: { aggregates?: Aggregates }) {
  // Sélecteurs ciblés : le panneau ne se re-rend pas quand on sélectionne une ligne.
  const filters = useFilters((s) => s.filters);
  const toggle = useFilters((s) => s.toggle);
  const setDueWithin = useFilters((s) => s.setDueWithin);
  const reset = useFilters((s) => s.reset);
  const openSearch = () => useUi.getState().setSearchOpen(true);
  const dirty = JSON.stringify(filters) !== JSON.stringify(initialFilters);
  const facets = aggregates?.statusFacets;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-[22px] overflow-y-auto px-5 pt-2 pb-5">
        <div>
          <h2 className="text-2xl leading-8 font-semibold">Filtres</h2>
          <p className="text-sm text-muted" aria-live="polite">
            {aggregates ? `${nf.format(aggregates.total)} exigence${aggregates.total > 1 ? 's' : ''} correspond${aggregates.total > 1 ? 'ent' : ''}` : 'Chargement…'}
          </p>
        </div>

        <div className="relative">
          <button
            type="button"
            id="filter-search"
            onClick={openSearch}
            aria-label={filters.search ? `Rechercher (filtre actif : ${filters.search})` : 'Rechercher une exigence'}
            className="flex h-[46px] w-full items-center gap-2.5 rounded-full bg-surface pr-3 pl-4 text-left text-[15px]"
          >
            <Icon icon={Search01Icon} size={18} className="text-muted" />
            <span className={cn('flex-1 truncate', !filters.search && 'text-muted')}>{filters.search || 'Rechercher'}</span>
            {!filters.search && (
              <kbd aria-hidden="true" className="grid h-5 min-w-5 place-items-center rounded-[5px] border border-track text-[11px] text-muted">/</kbd>
            )}
          </button>
          {filters.search && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => useFilters.getState().setSearch('')}
              className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center rounded-full bg-track text-muted hover:text-foreground"
            >
              <Icon icon={Cancel01Icon} size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span id="filter-status-label" className={LABEL}>Statut</span>
            <HelpTip label="Statut" text="Filtre multiple : sélectionnez un ou plusieurs statuts. Le volume indique les exigences de chaque statut avec les autres filtres." className="-mr-1" />
          </div>
          <div role="group" aria-labelledby="filter-status-label" className="flex flex-col gap-1.5">
            {STATUSES.map((s, i) => {
              const pressed = filters.statuses.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  id={i === 0 ? 'filter-status' : undefined}
                  aria-pressed={pressed}
                  onClick={() => toggle('statuses', s)}
                  className={cn(
                    'flex h-11 items-center gap-3 rounded-pill border-[1.5px] px-4 text-left text-[15px]',
                    pressed ? 'border-foreground bg-foreground text-background' : 'border-track hover:bg-surface',
                  )}
                >
                  <StatusDot status={s} />
                  <span className="flex-1">{STATUS_LABEL[s]}</span>
                  <span className={cn('text-[13px] tabular-nums', pressed ? 'text-[#636366]' : 'text-muted')}>
                    {facets ? nf.format(facets[s]) : ''}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <RiskSelector />

        <div className="flex flex-col gap-2">
          <span id="filter-due-label" className={LABEL}>Échéance</span>
          <div role="group" aria-labelledby="filter-due-label" className="flex gap-1">
            {DUE_OPTIONS.map((o) => {
              const pressed = filters.dueWithin === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={pressed}
                  aria-label={o.name}
                  onClick={() => setDueWithin(o.value)}
                  className={cn(
                    'h-[42px] rounded-full px-4 text-[15px]',
                    pressed ? 'bg-surface text-foreground' : 'text-foreground-soft hover:bg-surface/60',
                  )}
                >
                  {o.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col">
          <SelectRow
            id="filter-country" label="Pays" all="Tous" options={COUNTRIES} selected={filters.countries}
            onToggle={(c) => toggle('countries', c)} placeholder="Rechercher un pays…" empty="Aucun pays."
          />
          <SelectRow
            id="filter-category" label="Catégorie" all="Toutes" options={CATEGORIES} selected={filters.categories}
            onToggle={(c) => toggle('categories', c)} placeholder="Rechercher une catégorie…" empty="Aucune catégorie."
          />
          <SelectRow
            id="filter-regulation" label="Réglementation" all="Toutes" options={REGULATIONS} selected={filters.regulations}
            onToggle={(r) => toggle('regulations', r)} placeholder="Rechercher une réglementation…" empty="Aucune réglementation."
          />
        </div>
      </div>

      <div className="shrink-0 px-5 pb-5">
        <button
          type="button"
          onClick={reset}
          disabled={!dirty}
          className="h-14 w-full rounded-full bg-surface text-base font-medium hover:bg-track disabled:text-muted disabled:hover:bg-surface"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </div>
  );
}
