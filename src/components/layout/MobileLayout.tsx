import { lazy, Suspense } from 'react';
import { AiMagicIcon, ArrowDown01Icon, FilterHorizontalIcon, Search01Icon } from '@hugeicons/core-free-icons';
import type { Aggregates, Requirement } from '@/data/types';
import { DATASET_SIZE } from '@/hooks/useCompassData';
import type { AssistantApi } from '@/hooks/useAssistant';
import { focusIn } from '@/lib/focus';
import { useFilters } from '@/store/filters';
import { useUi } from '@/store/ui';
import { AssistantPanel } from '../AssistantPanel';
import { FilterPanel } from '../FilterPanel';
import { Kpi } from '../Kpi';
import { RequirementsList } from '../RequirementsList';
import { StatusBar } from '../StatusBar';
import { Brand, SidebarBody } from './Sidebar';
import { SortButton } from './ViewBar';
import { AssistantHeader } from './RightPanel';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DeadlinesChart = lazy(() => import('../DeadlinesChart').then((m) => ({ default: m.DeadlinesChart })));

interface Props {
  rows: Requirement[];
  aggregates?: Aggregates;
  isLoading: boolean;
  isRefreshing: boolean;
  assistant: AssistantApi;
}

/** Mobile (< 768 px) : en-tête de 56 px, contenu empilé, panneaux en tiroirs ouverts depuis une barre flottante. */
export function MobileLayout({ rows, aggregates, isLoading, isRefreshing, assistant }: Props) {
  const leftDrawer = useUi((s) => s.leftDrawer);
  const rightDrawer = useUi((s) => s.rightDrawer);
  const setDrawer = useUi((s) => s.setDrawer);
  const activeFilters = useFilters((s) => {
    const f = s.filters;
    return f.statuses.length + f.categories.length + f.countries.length + (f.minRisk > 1 ? 1 : 0) + (f.search ? 1 : 0);
  });

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Brand />
        <Button type="button" variant="ghost" size="icon" aria-label="Rechercher" onClick={() => focusIn('left', 'filter-search')}>
          <Icon icon={Search01Icon} size={20} />
        </Button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-24 *:shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">Tableau de bord</h1>
          <Button type="button" variant="outline" size="sm" aria-label="Vue : toutes les exigences">
            Toutes
            <Icon icon={ArrowDown01Icon} size={14} />
          </Button>
        </div>
        <div className="flex gap-2">
          <SortButton className="flex-1" />
          <Button type="button" variant="outline" size="sm" className="flex-1 border-dashed shadow-none" onClick={() => setDrawer('left', true)}>
            <Icon icon={FilterHorizontalIcon} />
            Filtrer
            {activeFilters > 0 && <span className="rounded-full bg-accent px-1.5 text-xs tabular-nums">{activeFilters}</span>}
          </Button>
        </div>

        {isLoading || !aggregates ? (
          <p className="py-12 text-center text-muted-foreground" aria-live="polite">Chargement du référentiel…</p>
        ) : (
          <>
            <dl className={cn('grid grid-cols-2 gap-3 transition-opacity', isRefreshing && 'opacity-60')}>
              <Kpi label="Exigences filtrées" value={aggregates.total} total={DATASET_SIZE} />
              <Kpi label="En risque" value={aggregates.atRisk} total={DATASET_SIZE} />
              <Kpi label="Non conformes" value={aggregates.byStatus.non_conforme} total={DATASET_SIZE} />
              <Kpi label="Conformes" value={aggregates.byStatus.conforme} total={DATASET_SIZE} />
            </dl>
            <StatusBar aggregates={aggregates} />
            <Suspense fallback={<Skeleton className="h-56 rounded-xl" aria-busy="true" />}>
              <DeadlinesChart aggregates={aggregates} compact />
            </Suspense>
            <RequirementsList rows={rows} />
          </>
        )}
      </main>

      <nav aria-label="Panneaux" className="fixed inset-x-4 bottom-4 z-40 flex gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg">
        <Button type="button" variant="outline" className="h-11 flex-1" aria-haspopup="dialog" onClick={() => setDrawer('left', true)}>
          <Icon icon={FilterHorizontalIcon} />
          Filtres
        </Button>
        <Button type="button" variant="ghost" className="h-11 flex-1 bg-status-conforme-bg text-status-conforme-fg hover:bg-status-conforme-bg/80" aria-haspopup="dialog" onClick={() => setDrawer('right', true)}>
          <Icon icon={AiMagicIcon} />
          Assistant
        </Button>
      </nav>

      <Drawer open={leftDrawer} onOpenChange={(o) => setDrawer('left', o)}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Filtres</DrawerTitle>
            <DrawerDescription className="sr-only">Affiner les exigences affichées</DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-4">
            <SidebarBody>
              <FilterPanel aggregates={aggregates} />
            </SidebarBody>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={rightDrawer} onOpenChange={(o) => setDrawer('right', o)}>
        <DrawerContent className="h-[88dvh] data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle asChild><AssistantHeader /></DrawerTitle>
            <DrawerDescription className="sr-only">Poser une question sur la sélection courante</DrawerDescription>
          </DrawerHeader>
          <AssistantPanel assistant={assistant} total={aggregates?.total} />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
