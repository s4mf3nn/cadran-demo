import { useDeferredValue, useMemo } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { applyEdit } from '../data/edits';
import { rowAt } from '../data/generate';
import type { RowSet } from '../data/types';
import { dataWorker } from '../lib/dataWorker';
import { useDatasetSize } from '../store/dataset';
import { useEdits } from '../store/edits';
import { useFilters } from '../store/filters';

const SEED = 42;
const EMPTY: RowSet = [];

export function useDataset() {
  const size = useDatasetSize((s) => s.size);
  return useQuery({
    queryKey: ['dataset', size],
    queryFn: () => {
      const { edits, version } = useEdits.getState();
      return dataWorker().call<'init'>({ type: 'init', size, seed: SEED, edits, editsVersion: version });
    },
    staleTime: Infinity,
    // Une seule taille en mémoire : chaque changement de palier régénère réellement le référentiel.
    gcTime: 0,
    // L'ancien référentiel reste affiché pendant la génération du suivant.
    placeholderData: keepPreviousData,
  });
}

export function useCadranData() {
  const size = useDatasetSize((s) => s.size);
  const dataset = useDataset();
  const filters = useFilters((s) => s.filters);
  const sort = useFilters((s) => s.sort);
  const edits = useEdits((s) => s.edits);
  const editsVersion = useEdits((s) => s.version);
  const columns = dataset.isPlaceholderData ? undefined : dataset.data?.columns;

  // La saisie reste fluide : React traite la recherche en priorité basse.
  const deferredFilters = useDeferredValue(filters);
  const isStale = deferredFilters !== filters;

  const query = useQuery({
    queryKey: ['query', size, deferredFilters, sort, editsVersion],
    queryFn: async () => ({
      ...(await dataWorker().call<'query'>({ type: 'query', size, seed: SEED, edits, editsVersion, filters: deferredFilters, sort })),
      // Les index ne valent que pour les colonnes (et les modifications) du référentiel interrogé : on les garde ensemble.
      columns: columns!,
      edits,
    }),
    enabled: !!columns,
    // On garde le résultat précédent affiché pendant le recalcul (pas de flash vide).
    placeholderData: keepPreviousData,
  });

  const rows = useMemo<RowSet>(() => {
    if (!query.data) return EMPTY;
    const { columns, edits, result: { indices } } = query.data;
    // Lignes reconstruites à la demande : le tableau virtualisé n'en lit qu'une trentaine par rendu.
    return {
      length: indices.length,
      at: (i) => {
        if (i < 0 || i >= indices.length) return undefined;
        const id = indices[i]!;
        return applyEdit(rowAt(columns, id), edits[id]);
      },
    };
  }, [query.data]);

  /** Taille réelle du référentiel affiché (pas le palier demandé). */
  const datasetSize = query.data?.columns.status.length;
  const isScaling = datasetSize !== undefined && datasetSize !== size;

  return {
    rows,
    aggregates: query.data?.result.aggregates,
    timings: { init: dataset.data?.ms, query: query.data?.ms },
    datasetSize,
    /** Palier demandé, en cours de génération tant que `isScaling`. */
    requestedSize: size,
    isScaling,
    isLoading: !query.data && !query.error && !dataset.error,
    isRefreshing: isStale || isScaling || query.isPlaceholderData || query.isFetching,
    error: dataset.error ?? query.error,
  };
}
