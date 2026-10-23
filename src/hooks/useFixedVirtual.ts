import { useCallback, useLayoutEffect, useState, type RefObject } from 'react';

/**
 * Hauteur maximale sûre d'un élément : Firefox plafonne vers 17,9 M px, Chrome vers 33,5 M px.
 * À 1 M de lignes de 46 px (46 M px), la fin de la liste serait sinon inatteignable.
 */
export const MAX_SCROLL_HEIGHT = 15_000_000;

interface Options {
  count: number;
  itemHeight: number;
  overscan: number;
  scrollRef: RefObject<HTMLElement | null>;
  /** Hauteur occupée avant les lignes dans le conteneur défilant (en-tête collant). */
  offsetTop?: number;
}

/**
 * Virtualisation à hauteur de ligne fixe, sans plafond de volume : au-delà de MAX_SCROLL_HEIGHT,
 * la hauteur défilable est plafonnée et la position de défilement est mise à l'échelle
 * (un pixel défilé vaut `ratio` pixels de liste). En dessous, le comportement est celui d'une liste normale.
 */
export function useFixedVirtual({ count, itemHeight, overscan, scrollRef, offsetTop = 0 }: Options) {
  const [view, setView] = useState({ scrollTop: 0, height: 0 });

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const read = () =>
      setView((v) => (v.scrollTop === el.scrollTop && v.height === el.clientHeight ? v : { scrollTop: el.scrollTop, height: el.clientHeight }));
    read();
    el.addEventListener('scroll', read, { passive: true });
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(read);
    ro?.observe(el);
    return () => {
      el.removeEventListener('scroll', read);
      ro?.disconnect();
    };
  }, [scrollRef]);

  const viewport = Math.max(0, view.height - offsetTop);
  const total = count * itemHeight;
  const totalSize = Math.min(total, MAX_SCROLL_HEIGHT);
  const ratio = total > totalSize && totalSize > viewport ? (total - viewport) / (totalSize - viewport) : 1;
  /** Position dans la liste complète (en px de lignes), bornée à la fin de la liste. */
  const listTop = Math.max(0, Math.min(view.scrollTop * ratio, total - viewport));

  const items: { index: number; top: number }[] = [];
  if (count > 0) {
    const first = Math.max(0, Math.floor(listTop / itemHeight) - overscan);
    const last = Math.min(count - 1, Math.ceil((listTop + viewport) / itemHeight) + overscan);
    // Position dans le conteneur des lignes : relative au défilement réel, pas à la position mise à l'échelle.
    for (let i = first; i <= last; i++) items.push({ index: i, top: i * itemHeight - listTop + view.scrollTop });
  }

  /** Amène la ligne dans la zone visible (alignement minimal), en arrondissant du côté où elle reste entière. */
  const scrollToIndex = useCallback(
    (index: number) => {
      const el = scrollRef.current;
      if (!el) return;
      const top = index * itemHeight;
      if (top < listTop) el.scrollTop = Math.floor(top / ratio);
      else if (top + itemHeight > listTop + viewport) el.scrollTop = Math.ceil((top + itemHeight - viewport) / ratio);
    },
    [scrollRef, itemHeight, listTop, viewport, ratio],
  );

  return { items, totalSize, scrollToIndex };
}
