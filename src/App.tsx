import { lazy, Suspense } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { RequirementsTable } from './components/RequirementsTable';
import { AssistantPanel } from './components/AssistantPanel';
import { Kpi } from './components/Kpi';
import { StatusBar } from './components/StatusBar';
import { QuickActions } from './components/QuickActions';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { AppHeader } from './components/layout/AppHeader';
import { RightPanel } from './components/layout/RightPanel';
import { Sidebar } from './components/layout/Sidebar';
import { ViewBar } from './components/layout/ViewBar';
import { DATASET_SIZE, useCompassData } from './hooks/useCompassData';
import { useHotkeys } from './hooks/useHotkeys';
import { exportCsv } from './lib/exportCsv';
import { focusIn } from './lib/focus';
import { useUi } from './store/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ECharts pèse lourd : chargé à part pour ne pas retarder le premier affichage.
const Charts = lazy(() => import('./components/Charts').then((m) => ({ default: m.Charts })));

export default function App() {
  const { rows, aggregates, timings, isLoading, isRefreshing, error } = useCompassData();
  const ui = useUi.getState;

  useHotkeys({
    quickActions: () => ui().setQuickOpen(true),
    search: () => focusIn('left', 'filter-search'),
    help: () => ui().setHelpOpen(true),
    toggleLeft: () => ui().togglePanel('left'),
    toggleRight: () => ui().togglePanel('right'),
    focusAssistant: () => focusIn('right', 'assistant-input'),
    focusStatus: () => focusIn('left', 'filter-status'),
    focusRisk: () => focusIn('left', 'filter-risk'),
    focusCategory: () => focusIn('left', 'filter-category'),
    focusCountry: () => focusIn('left', 'filter-country'),
  });

  return (
    <TooltipProvider>
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar>
          <FilterPanel aggregates={aggregates} />
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader rows={rows} />
          <ViewBar timings={timings} isRefreshing={isRefreshing} />

          <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6 *:shrink-0">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>Erreur : {String(error)}</AlertDescription>
              </Alert>
            )}
            {isLoading || !aggregates ? (
              <Card className="flex-1 place-items-center justify-center text-muted-foreground" aria-busy="true">
                <p className="text-center" aria-live="polite">Génération de {DATASET_SIZE.toLocaleString('fr-FR')} exigences dans le worker…</p>
              </Card>
            ) : (
              <>
                <dl className={cn('grid grid-cols-2 gap-4 transition-opacity md:grid-cols-4', isRefreshing && 'opacity-60')}>
                  <Kpi label="Exigences filtrées" value={aggregates.total} total={DATASET_SIZE} />
                  <Kpi label="En risque" value={aggregates.atRisk} total={DATASET_SIZE} />
                  <Kpi label="Non conformes" value={aggregates.byStatus.non_conforme} total={DATASET_SIZE} />
                  <Kpi label="Conformes" value={aggregates.byStatus.conforme} total={DATASET_SIZE} />
                </dl>
                <StatusBar aggregates={aggregates} />
                <Suspense fallback={<Skeleton className="h-[340px] rounded-xl" aria-busy="true" />}>
                  <Charts aggregates={aggregates} />
                </Suspense>
                <div className="h-[36rem] shrink-0">
                  <RequirementsTable rows={rows} aggregates={aggregates} />
                </div>
              </>
            )}
          </main>
        </div>

        <RightPanel>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <AssistantPanel aggregates={aggregates} />
          </div>
        </RightPanel>
      </div>

      <QuickActions onExport={() => exportCsv(rows)} />
      <ShortcutsDialog />
    </TooltipProvider>
  );
}
