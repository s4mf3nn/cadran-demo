import { lazy, Suspense } from 'react';
import { FilterPanel } from './components/FilterPanel';
import { RequirementsTable } from './components/RequirementsTable';
import { AssistantPanel } from './components/AssistantPanel';
import { DATASET_SIZE, useCompassData } from './hooks/useCompassData';

// ECharts pèse lourd : chargé à part pour ne pas retarder le premier affichage.
const Charts = lazy(() => import('./components/Charts').then((m) => ({ default: m.Charts })));

const nf = new Intl.NumberFormat('fr-FR');

function Kpi({ label, value, tone = 'text-slate-900' }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className={`text-2xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}

export default function App() {
  const { rows, aggregates, timings, isLoading, isRefreshing, error } = useCompassData();

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-slate-100 p-4 text-slate-900 lg:h-screen">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-xl font-bold">Compass · Pilotage de la conformité</h1>
        <p className="text-xs text-slate-500" aria-live="polite">
          {isLoading
            ? `Génération de ${nf.format(DATASET_SIZE)} exigences dans le worker…`
            : `${nf.format(DATASET_SIZE)} exigences · génération ${timings.init?.toFixed(0)} ms · dernière requête ${timings.query?.toFixed(0)} ms (hors main thread)`}
          {isRefreshing && !isLoading && ' · recalcul…'}
        </p>
      </header>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">Erreur : {String(error)}</p>}

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[18rem_1fr]">
        <FilterPanel />

        <main className="flex min-h-0 flex-col gap-4">
          {isLoading || !aggregates ? (
            <div className="grid flex-1 place-items-center rounded-xl bg-white text-slate-500" aria-busy="true">
              Chargement du référentiel…
            </div>
          ) : (
            <>
              <dl className={`grid grid-cols-2 gap-4 transition-opacity md:grid-cols-4 ${isRefreshing ? 'opacity-60' : ''}`}>
                <Kpi label="Exigences filtrées" value={nf.format(aggregates.total)} />
                <Kpi label="En risque" value={nf.format(aggregates.atRisk)} tone="text-red-700" />
                <Kpi label="Non conformes" value={nf.format(aggregates.byStatus.non_conforme)} tone="text-red-700" />
                <Kpi label="Conformes" value={nf.format(aggregates.byStatus.conforme)} tone="text-green-700" />
              </dl>
              <Suspense fallback={<div className="h-72 animate-pulse rounded-xl bg-white" aria-busy="true" />}>
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
  );
}
