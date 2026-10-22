import { FilterPanel } from './components/FilterPanel';
import { RequirementsTable, TABLE_MIN_HEIGHT } from './components/RequirementsTable';
import { AssistantPanel } from './components/AssistantPanel';
import { Dashboard } from './components/Dashboard';
import { WorldMap } from './components/viz/WorldMap';
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
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function App() {
  const { rows, aggregates, timings, datasetSize, isLoading, isRefreshing, error } = useCadranData();
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
      <div className="flex h-screen gap-3.5 bg-background p-4 text-foreground">
        <Sidebar>
          <FilterPanel aggregates={aggregates} />
        </Sidebar>

        <div className="flex min-w-0 flex-1 flex-col gap-3.5">
          <AppHeader rows={rows} datasetSize={datasetSize} timings={timings} isRefreshing={isRefreshing} />

          <main className="relative flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>Erreur : {String(error)}</AlertDescription>
              </Alert>
            )}
            {isLoading || !aggregates ? (
              <div className="grid flex-1 place-items-center rounded-card border-2 border-card-border text-muted" aria-busy="true">
                <p className="text-center" aria-live="polite">Génération de {DATASET_SIZE.toLocaleString('fr-FR')} exigences dans le worker…</p>
              </div>
            ) : (
              <>
                <Dashboard a={aggregates} isRefreshing={isRefreshing} />
                <WorldMap a={aggregates} className={cn('shrink-0 transition-opacity', isRefreshing && 'opacity-60')} />
                <div className="flex flex-1 flex-col" style={{ minHeight: `min(${TABLE_MIN_HEIGHT}px, 100%)` }}>
                  <RequirementsTable rows={rows} aggregates={aggregates} />
                </div>
              </>
            )}
          </main>
        </div>

        <RightPanel>
          <AssistantPanel assistant={assistant} total={aggregates?.total} aggregates={aggregates} closable />
        </RightPanel>
      </div>
      )}

      <RequirementDetail assistant={assistant} isMobile={isMobile} />
      <SearchDialog rows={rows} total={aggregates?.total} />
      <ShortcutsDialog />
    </TooltipProvider>
  );
}
