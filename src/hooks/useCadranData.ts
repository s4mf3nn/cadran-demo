import { useDeferredValue, useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { dataWorker } from '../lib/dataWorker';
import { useFilters } from '../store/filters';

export const DATASET_SIZE = 150_000;

export function useDataset() {
  return useQuery({
    queryKey: ['dataset', DATASET_SIZE],
    queryFn: () => dataWorker().call<'init'>({ type: 'init', size: DATASET_SIZE, seed: 42 }),
    staleTime: Infinity,
  });
}

export function useCadranData() {
  const dataset = useDataset();
  const filters = useFilters((s) => s.filters);
  const sort = useFilters((s) => s.sort);

  // La saisie reste fluide : React traite la recherche en priorité basse.
  const deferredFilters = useDeferredValue(filters);
  const isStale = deferredFilters !== filters;

  const query = useQuery({
    queryKey: ['query', deferredFilters, sort],
    queryFn: () => dataWorker().call<'query'>({ type: 'query', filters: deferredFilters, sort }),
    enabled: dataset.isSuccess,
    // On garde le résultat précédent affiché pendant le recalcul (pas de flash vide).
    placeholderData: keepPreviousData,
  });

  const rows = useMemo(() => {
    const data = dataset.data?.data;
    const indices = query.data?.result.indices;
    if (!data || !indices) return [];
    const rows = Array.from(indices, (i) => data[i]!);
    // En dev, React 19 diffe en profondeur les props changées de chaque composant re-rendu
    // (pistes « Components » des DevTools) et sa limite de 100 éléments ne s'applique pas quand
    // les éléments diffèrent : un tableau dont les lignes se décalent (seuil de risque) coûte
    // ~1 s par commit. Un tag de type propre le fait traiter comme une valeur opaque.
    if (import.meta.env.DEV) Object.defineProperty(rows, Symbol.toStringTag, { value: 'Requirements' });
    return rows;
  }, [dataset.data, query.data]);

  return {
    rows,
    aggregates: query.data?.result.aggregates,
    timings: { init: dataset.data?.ms, query: query.data?.ms },
    /** Taille réelle du référentiel chargé (pas la constante demandée). */
    datasetSize: dataset.data?.data.length,
    isLoading: dataset.isPending || (query.isPending && query.fetchStatus !== 'idle'),
    isRefreshing: isStale || query.isPlaceholderData || query.isFetching,
    error: dataset.error ?? query.error,
  };
}
