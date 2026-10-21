import { useSyncExternalStore } from 'react';

const QUERY = '(max-width: 767px)';

const subscribe = (cb: () => void) => {
  const mq = window.matchMedia(QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};

/** Vrai sous 768 px : les panneaux deviennent des tiroirs et la table une liste. */
export function useIsMobile(): boolean {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}
