import { useRef, useState } from 'react';
import { Cancel01Icon, Search01Icon } from '@hugeicons/core-free-icons';
import { STATUS_LABEL, type Requirement } from '../data/types';
import { useFilters } from '../store/filters';
import { useUi } from '../store/ui';
import { StatusDot } from './StatusTag';
import { Icon } from '@/components/ui/icon';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

const MAX_RESULTS = 8;
const nf = new Intl.NumberFormat('fr-FR');

interface Props {
  rows: Requirement[];
  total?: number;
}

/** Recherche plein texte centrée à l'écran : pilote le même filtre que le panneau latéral. */
export function SearchDialog({ rows, total }: Props) {
  const open = useUi((s) => s.searchOpen);
  const setOpen = useUi((s) => s.setSearchOpen);
  const search = useFilters((s) => s.filters.search);
  const setSearch = useFilters((s) => s.setSearch);
  const select = useFilters((s) => s.select);
  const openRow = useFilters((s) => s.open);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = search.trim() ? rows.slice(0, MAX_RESULTS) : [];
  const pick = (r: Requirement) => {
    select(r.id);
    openRow(r);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="gap-0 p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Rechercher une exigence</DialogTitle>
        <DialogDescription className="sr-only">Saisissez une référence, un sujet ou un règlement.</DialogDescription>
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <Icon icon={Search01Icon} className="shrink-0 text-muted-foreground" />
          <input
            ref={inputRef}
            autoFocus
            type="search"
            role="combobox"
            aria-expanded={results.length > 0}
            aria-controls="search-results"
            aria-label="Rechercher une exigence"
            value={search}
            placeholder="Référence, sujet, règlement…"
            className="h-full w-full bg-transparent text-sm outline-hidden placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
            onChange={(e) => { setSearch(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === 'Enter') { e.preventDefault(); const r = results[active]; if (r) pick(r); else setOpen(false); }
            }}
          />
          {search && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => { setSearch(''); setActive(0); inputRef.current?.focus(); }}
              className="flex size-6 shrink-0 items-center justify-center rounded-sm text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Icon icon={Cancel01Icon} size={14} />
            </button>
          )}
        </div>
        <ul id="search-results" role="listbox" aria-label="Résultats" className="max-h-80 overflow-y-auto p-1">
          {results.map((r, i) => (
            <li key={r.id} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm aria-selected:bg-accent data-[active=true]:bg-accent"
                data-active={i === active}
              >
                <StatusDot status={r.status} />
                <span className="shrink-0 font-mono text-xs text-muted-foreground">{r.ref}</span>
                <span className="min-w-0 flex-1 truncate">{r.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{r.country} · {STATUS_LABEL[r.status]}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground" aria-live="polite">
          {search.trim()
            ? total === undefined ? 'Recherche…' : `${nf.format(total)} résultat${total > 1 ? 's' : ''} - le tableau est filtré en conséquence`
            : 'Tapez pour filtrer les exigences'}
        </p>
      </DialogContent>
    </Dialog>
  );
}
