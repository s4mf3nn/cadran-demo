import { useId } from 'react';
import { CATEGORIES, COUNTRIES, STATUS_LABEL, STATUSES, type Risk } from '../data/types';
import { useFilters } from '../store/filters';

function ChipGroup<T extends string>({
  legend, options, selected, onToggle, format = (v) => v,
}: {
  legend: string;
  options: readonly T[];
  selected: T[];
  onToggle: (v: T) => void;
  format?: (v: T) => string;
}) {
  return (
    <fieldset>
      <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{legend}</legend>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => {
          const on = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              aria-pressed={on}
              onClick={() => onToggle(o)}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-blue-500 ${
                on ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
              }`}
            >
              {format(o)}
            </button>
          );
        })}
      </div>
    </fieldset>
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
    <aside className="flex flex-col gap-5 overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Filtres">
      <div>
        <label htmlFor={searchId} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Recherche
        </label>
        <input
          id={searchId}
          type="search"
          value={filters.search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Référence, sujet, règlement…"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>

      <ChipGroup legend="Statut" options={STATUSES} selected={filters.statuses} onToggle={(v) => toggle('statuses', v)} format={(s) => STATUS_LABEL[s]} />

      <div>
        <label htmlFor={riskId} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          Risque minimum : {filters.minRisk}
        </label>
        <input
          id={riskId}
          type="range"
          min={1}
          max={4}
          value={filters.minRisk}
          onChange={(e) => setMinRisk(Number(e.target.value) as Risk)}
          className="w-full"
        />
      </div>

      <ChipGroup legend="Catégorie" options={CATEGORIES} selected={filters.categories} onToggle={(v) => toggle('categories', v)} />
      <ChipGroup legend="Pays" options={COUNTRIES} selected={filters.countries} onToggle={(v) => toggle('countries', v)} />

      <button type="button" onClick={reset} className="self-start text-sm text-blue-700 underline-offset-2 hover:underline">
        Réinitialiser les filtres
      </button>
    </aside>
  );
}
