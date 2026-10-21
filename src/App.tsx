import { lazy, Suspense } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { RequirementsTable } from './components/RequirementsTable';
import { AssistantPanel } from './components/AssistantPanel';
import { DATASET_SIZE, useCompassData } from './hooks/useCompassData';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// ECharts pèse lourd : chargé à part pour ne pas retarder le premier affichage.
const Charts = lazy(() => import('./components/Charts').then((m) => ({ default: m.Charts })));

const nf = new Intl.NumberFormat('fr-FR');

function Kpi({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <Card size="sm">
      <CardContent className="gap-0.5">
        <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
        <dd className={cn('text-2xl font-semibold tabular-nums', tone)}>{value}</dd>
      </CardContent>
    </Card>
  );
}

export default function App() {
  const { rows, aggregates, timings, isLoading, isRefreshing, error } = useCompassData();

  return (
    <TooltipProvider>
      <div className="flex min-h-screen flex-col gap-4 bg-background p-4 text-foreground lg:h-screen">
        <header className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-x-4">
            <h1 className="text-xl font-bold">Compass · Pilotage de la conformité</h1>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {isLoading
                ? `Génération de ${nf.format(DATASET_SIZE)} exigences dans le worker…`
                : `${nf.format(DATASET_SIZE)} exigences · génération ${timings.init?.toFixed(0)} ms · dernière requête ${timings.query?.toFixed(0)} ms (hors main thread)`}
              {isRefreshing && !isLoading && ' · recalcul…'}
            </p>
          </div>
        </header>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>Erreur : {String(error)}</AlertDescription>
          </Alert>
        )}

        <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_1fr]">
          <FilterPanel />

          <main className="flex min-h-0 flex-col gap-4">
            {isLoading || !aggregates ? (
              <Card className="flex-1 place-items-center justify-center text-muted-foreground" aria-busy="true">
                <p className="text-center">Chargement du référentiel…</p>
              </Card>
            ) : (
              <>
                <dl className={cn('grid grid-cols-2 gap-4 transition-opacity md:grid-cols-4', isRefreshing && 'opacity-60')}>
                  <Kpi label="Exigences filtrées" value={nf.format(aggregates.total)} />
                  <Kpi label="En risque" value={nf.format(aggregates.atRisk)} tone="text-destructive" />
                  <Kpi label="Non conformes" value={nf.format(aggregates.byStatus.non_conforme)} tone="text-destructive" />
                  <Kpi label="Conformes" value={nf.format(aggregates.byStatus.conforme)} tone="text-success" />
                </dl>
                <Suspense fallback={<Skeleton className="h-72 rounded-xl" aria-busy="true" />}>
                  <Charts aggregates={aggregates} />
                </Suspense>
                <div className="grid min-h-[24rem] flex-1 gap-4 xl:grid-cols-[1fr_22rem]">
                  <RequirementsTable rows={rows} />
                  <AssistantPanel aggregates={aggregates} />
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </TooltipProvider>
  );
}
