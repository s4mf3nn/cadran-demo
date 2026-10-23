import { useEffect } from 'react';
import { rowAt, type Columns } from '../data/generate';
import { decodeUrlState, encodeUrlState } from '../lib/urlState';
import { useFilters } from '../store/filters';
import { useDataset } from './useCadranData';

const currentQuery = () => window.location.search.replace(/^\?/, '');

/** Fiche demandée par l'URL, en attendant que le référentiel soit chargé pour la reconstruire. */
let pendingOpenId: number | null = null;
/** Colonnes du référentiel courant, pour rouvrir une fiche sur précédent/suivant. */
let loadedColumns: Columns | undefined;

function resolvePending() {
  if (pendingOpenId === null || !loadedColumns) return;
  const id = pendingOpenId;
  pendingOpenId = null;
  if (id < loadedColumns.status.length) {
    useFilters.setState({ selectedId: id });
    useFilters.getState().open(rowAt(loadedColumns, id));
  }
}

function applyUrl() {
  const { filters, sort, openId } = decodeUrlState(window.location.search);
  pendingOpenId = openId;
  const s = useFilters.getState();
  useFilters.setState({ filters, sort });
  if (openId === null && s.opened) s.open(null);
  resolvePending();
}

/**
 * Filtres, tri et fiche ouverte vivent aussi dans l'URL : la vue se partage par lien et
 * les boutons précédent/suivant du navigateur la rejouent. La saisie de recherche remplace
 * l'entrée d'historique courante au lieu d'en empiler une par frappe.
 */
export function useUrlState() {
  const dataset = useDataset();
  const columns = dataset.isPlaceholderData ? undefined : dataset.data?.columns;

  useEffect(() => {
    applyUrl();
    const onPop = () => applyUrl();
    window.addEventListener('popstate', onPop);

    let prev = useFilters.getState();
    const unsubscribe = useFilters.subscribe((s) => {
      const before = prev;
      prev = s;
      if (s.filters === before.filters && s.sort === before.sort && s.opened === before.opened) return;
      if (s.opened) pendingOpenId = null;
      const openId = s.opened?.id ?? pendingOpenId;
      const query = encodeUrlState({ filters: s.filters, sort: s.sort, openId });
      if (query === currentQuery()) return;
      const searchOnly = s.filters.search !== before.filters.search
        && s.filters.countries === before.filters.countries && s.filters.categories === before.filters.categories
        && s.filters.statuses === before.filters.statuses && s.filters.regulations === before.filters.regulations
        && s.filters.minRisk === before.filters.minRisk && s.filters.dueWithin === before.filters.dueWithin
        && s.sort === before.sort && s.opened === before.opened;
      const url = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
      window.history[searchOnly ? 'replaceState' : 'pushState'](null, '', url);
    });

    return () => {
      window.removeEventListener('popstate', onPop);
      unsubscribe();
    };
  }, []);

  // Ouvre la fiche demandée par l'URL dès que les colonnes sont là (ignorée si l'id n'existe pas).
  useEffect(() => {
    loadedColumns = columns;
    resolvePending();
  }, [columns]);
}
