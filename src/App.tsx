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
import { useCadranData } from './hooks/useCadranData';
import { DatasetScaler } from './components/DatasetScaler';
import { useAssistant, SUGGESTIONS } from './hooks/useAssistant';
import { useHotkeys } from './hooks/useHotkeys';
import { useIsMobile } from './hooks/useIsMobile';
import { useUrlState } from './hooks/useUrlState';
import { MobileLayout } from './components/layout/MobileLayout';
import { focusIn, MAIN_ID } from './lib/focus';
import { useUi } from './store/ui';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SKIP_LINK = 'sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-full focus:bg-foreground focus:px-5 focus:py-3 focus:text-body focus:font-medium focus:text-background';

export default function App() {
  const { rows, aggregates, timings, datasetSize, requestedSize, isScaling, isLoading, isRefreshing, error } = useCadranData();
  useUrlState();
  const ui = useUi.getState;
  const isMobile = useIsMobile();
  const assistant = useAssistant(aggregates);
  const suggest = (i: number) => () => {
    if (assistant.status === 'thinking' || assistant.status === 'streaming') return;
    // L'assistant flottant est fermé par défaut : on l'ouvre pour que la réponse soit visible.
    focusIn('right', 'assistant-input');
    assistant.send(SUGGESTIONS[i]!);
  };

  // Sous 768 px, ni aide ni réglage des raccourcis : les touches simples y sont coupées (WCAG 2.1.4).
  useHotkeys({
    search: () => ui().setSearchOpen(true),
    help: () => ui().setHelpOpen(true),
    toggleLeft: () => ui().togglePanel('left'),
    focusAssistant: () => focusIn('right', 'assistant-input'),
    suggestion1: suggest(0),
    suggestion2: suggest(1),
    suggestion3: suggest(2),
    escape: () => assistant.stop(),
  }, { charKeys: !isMobile });

  return (
    <TooltipProvider>
      {/* RGAA 12.7 : lien d'évitement, premier élément tabulable, visible au focus. */}
      <a href={`#${MAIN_ID}`} className={SKIP_LINK}>Aller au contenu principal</a>
      {isMobile ? (
        <MobileLayout rows={rows} aggregates={aggregates} isLoading={isLoading} isRefreshing={isRefreshing} isScaling={isScaling} assistant={assistant} />
      ) : (
      <div className="flex h-screen gap-3.5 bg-background p-4 text-foreground">
        <Sidebar>
          <FilterPanel aggregates={aggregates} />
        </Sidebar>

        <div className="relative flex min-w-0 flex-1 flex-col gap-3.5">
          <AppHeader rows={rows} datasetSize={datasetSize} timings={timings} isRefreshing={isRefreshing} />

          <main id={MAIN_ID} tabIndex={-1} className="relative flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto outline-none">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>Erreur : {String(error)}</AlertDescription>
              </Alert>
            )}
            {isLoading || !aggregates ? (
              <div className="grid flex-1 place-items-center rounded-card border-2 border-card-border text-muted" aria-busy="true">
                <p className="text-center" aria-live="polite">Génération de {requestedSize.toLocaleString('fr-FR')} exigences dans le worker…</p>
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

          {/* En bas à droite du tableau de bord, sans recouvrir la saisie de l'assistant docké. */}
          <DatasetScaler isScaling={isScaling} className="absolute right-4 bottom-4 z-30" />
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
