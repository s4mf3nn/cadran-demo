import { AiMagicIcon, Download04Icon, Settings02Icon } from '@hugeicons/core-free-icons';
import { exportCsv } from '@/lib/exportCsv';
import { focusIn } from '@/lib/focus';
import { useFilters } from '@/store/filters';
import { useUi } from '@/store/ui';
import type { Requirement } from '@/data/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { RIGHT_PANEL_ID } from './RightPanel';
import { TimingsText, type Timings } from './ViewBar';

export function AppHeader({ rows, timings, isRefreshing }: { rows: Requirement[]; timings: Timings; isRefreshing: boolean }) {
  const rightOpen = useUi((s) => s.rightOpen);
  const setPanel = useUi((s) => s.setPanel);
  const reset = useFilters((s) => s.reset);

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-3 border-b border-border px-6">
      <div className="flex min-w-0 items-baseline gap-3">
        <h1 className="shrink-0 text-sm font-semibold">Tableau de bord</h1>
        <TimingsText timings={timings} isRefreshing={isRefreshing} />
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm">
              <Icon icon={Settings02Icon} />
              Paramètres de vue
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={reset}>Réinitialiser les filtres</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => useFilters.setState({ sort: { key: 'dueAt', dir: 'asc' } })}>Réinitialiser le tri</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={rows.length === 0}>
              <Icon icon={Download04Icon} />
              Exporter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => exportCsv(rows)}>CSV · {rows.length.toLocaleString('fr-FR')} exigences filtrées</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        {!rightOpen && (
          <Button
            type="button"
            size="sm"
            aria-expanded={false}
            aria-controls={RIGHT_PANEL_ID}
            onClick={() => { setPanel('right', true); focusIn('right', 'assistant-input'); }}
          >
            <Icon icon={AiMagicIcon} />
            Assistant
            <Kbd className="border-primary-foreground/40 bg-transparent text-primary-foreground">⌘J</Kbd>
          </Button>
        )}
      </div>
    </header>
  );
}
