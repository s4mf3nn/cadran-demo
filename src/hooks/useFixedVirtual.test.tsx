import { describe, expect, it } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { MAX_SCROLL_HEIGHT, useFixedVirtual } from './useFixedVirtual';

/** Conteneur défilant factice : jsdom ne calcule ni hauteur ni défilement. */
function scroller(height: number) {
  const el = document.createElement('div');
  let top = 0;
  Object.defineProperty(el, 'clientHeight', { get: () => height });
  Object.defineProperty(el, 'scrollTop', {
    get: () => top,
    set: (v: number) => { top = v; el.dispatchEvent(new Event('scroll')); },
  });
  return { current: el };
}

const H = 46;
const HEADER = 36;

describe('useFixedVirtual', () => {
  it('ne met rien à l’échelle sous le plafond', () => {
    const ref = scroller(400);
    const { result } = renderHook(() => useFixedVirtual({ count: 150_000, itemHeight: H, overscan: 0, scrollRef: ref, offsetTop: HEADER }));
    expect(result.current.totalSize).toBe(150_000 * H);
    act(() => { ref.current.scrollTop = 10 * H; });
    expect(result.current.items[0]).toEqual({ index: 10, top: 10 * H });
  });

  it.each([500_000, 1_000_000])('rend la dernière ligne atteignable à %i lignes', (count) => {
    const ref = scroller(400);
    const { result } = renderHook(() => useFixedVirtual({ count, itemHeight: H, overscan: 0, scrollRef: ref, offsetTop: HEADER }));
    expect(result.current.totalSize).toBeLessThanOrEqual(MAX_SCROLL_HEIGHT);
    act(() => result.current.scrollToIndex(count - 1));
    const last = result.current.items.at(-1)!;
    expect(last.index).toBe(count - 1);
    // La dernière ligne finit au bas du conteneur des lignes, entièrement visible.
    expect(last.top + H).toBeLessThanOrEqual(result.current.totalSize);
    expect(last.top + H).toBeLessThanOrEqual(ref.current.scrollTop + 400 - HEADER);
    act(() => result.current.scrollToIndex(0));
    expect(result.current.items[0]).toEqual({ index: 0, top: 0 });
  });

  it('amène une ligne quelconque dans la zone visible à 1 M', () => {
    const ref = scroller(400);
    const { result } = renderHook(() => useFixedVirtual({ count: 1_000_000, itemHeight: H, overscan: 0, scrollRef: ref, offsetTop: HEADER }));
    for (const target of [123_456, 729_457, 999_000]) {
      act(() => result.current.scrollToIndex(target));
      const item = result.current.items.find((i) => i.index === target)!;
      expect(item.top).toBeGreaterThanOrEqual(ref.current.scrollTop);
      expect(item.top + H).toBeLessThanOrEqual(ref.current.scrollTop + 400 - HEADER);
    }
  });
});
