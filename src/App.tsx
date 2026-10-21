import { lazy, Suspense } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { RequirementsTable } from './components/RequirementsTable';
import { AssistantPanel } from './components/AssistantPanel';
import { Kpi } from './components/Kpi';
import { StatusBar } from './components/StatusBar';
import { RequirementDetail } from './components/RequirementDetail';
import { SearchDialog } from './components/SearchDialog';
import { ShortcutsDialog } from './components/ShortcutsDialog';
import { AppHeader } from './components/layout/AppHeader';
import { RightPanel } from './components/layout/RightPanel';
import { Sidebar } from './components/layout/Sidebar';
import { DATASET_SIZE, useCadranData } from './hooks/useCadranData';
import { useAssistant, SUGGESTIONS } from './hooks/useAssistant';
import { useHotkeys } from './hooks/useHotkeys';
import { useIsMobile } from './hooks/useIsMobile';
import { MobileLayout } from './components/layout/MobileLayout';
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
  const { rows, aggregates, timings, isLoading, isRefreshing, error } = useCadranData();
  const ui = useUi.getState;
  const isMobile = useIsMobile();
  const assistant = useAssistant(aggregates);
  const suggest = (i: number) => () => {
    if (assistant.status === 'thinking' || assistant.status === 'streaming') return;
    // L'assistant flottant est fermé par défaut : on l'ouvre pour que la réponse soit visible.
    focusIn('right', 'assistant-input');
    assistant.send(SUGGESTIONS[i]!);
  };

  useHotkeys({
    search: () => ui().setSearchOpen(true),
    help: () => ui().setHelpOpen(true),
    toggleLeft: () => ui().togglePanel('left'),
    focusAssistant: () => focusIn('right', 'assistant-input'),
    suggestion1: suggest(0),
    suggestion2: suggest(1),
    suggestion3: suggest(2),
    escape: () => assistant.stop(),
  });

  return (
    <TooltipProvider>
      {isMobile ? (
        <MobileLayout rows={rows} aggregates={aggregates} isLoading={isLoading} isRefreshing={isRefreshing} assistant={assistant} />
      ) : (
      <div className="flex h-screen bg-background text-foreground">
        <Sidebar>
          <FilterPanel aggregates={aggregates} />
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader rows={rows} timings={timings} isRefreshing={isRefreshing} />

          <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-6 *:shrink-0">
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
                <div role="group" aria-label="Indicateurs clés" className={cn('grid grid-cols-2 gap-4 transition-opacity md:grid-cols-4', isRefreshing && 'opacity-60')}>
                  <Kpi label="Exigences filtrées" value={aggregates.total} total={DATASET_SIZE} />
                  <Kpi label="En risque" value={aggregates.atRisk} total={DATASET_SIZE} />
                  <Kpi label="Non conformes" value={aggregates.byStatus.non_conforme} total={DATASET_SIZE} />
                  <Kpi label="Conformes" value={aggregates.byStatus.conforme} total={DATASET_SIZE} />
                </div>
                <StatusBar aggregates={aggregates} />
                <Suspense fallback={<Skeleton className="h-[340px] rounded-xl" aria-busy="true" />}>
                  <Charts aggregates={aggregates} />
                </Suspense>
                <div className="h-[80vh] shrink-0">
                  <RequirementsTable rows={rows} aggregates={aggregates} />
                </div>
              </>
            )}
          </main>
        </div>

        <RightPanel>
          <AssistantPanel assistant={assistant} total={aggregates?.total} />
        </RightPanel>
      </div>
      )}

      <RequirementDetail assistant={assistant} isMobile={isMobile} />
      <SearchDialog rows={rows} total={aggregates?.total} />
      <ShortcutsDialog />
    </TooltipProvider>
  );
}
