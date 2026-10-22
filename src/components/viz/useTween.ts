import { useEffect, useRef, useState } from 'react';

export const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Valeur qui glisse vers `target` en `duration` ms : depuis 0 au montage, puis depuis la valeur
 * affichée (une animation interrompue repart d'où elle en était). Immédiate si l'utilisateur
 * demande moins d'animations. Les jauges, nombres et vagues partagent la même durée et la même
 * courbe, si bien qu'ils restent synchrones.
 */
export function useTween(target: number, duration = 700): number {
  const [value, setValue] = useState(() => (reducedMotion() ? target : 0));
  const current = useRef(value);

  useEffect(() => {
    const from = current.current;
    if (from === target) return;
    if (reducedMotion()) {
      current.current = target;
      setValue(target);
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / duration);
      current.current = from + (target - from) * easeOutCubic(p);
      setValue(current.current);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
