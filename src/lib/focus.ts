import { useUi } from '../store/ui';

export const isMobileViewport = () => window.matchMedia('(max-width: 767px)').matches;

/** Ouvre le panneau (ou le tiroir sur mobile) qui contient l'élément, puis lui donne le focus une fois monté. */
export function focusIn(side: 'left' | 'right', id: string) {
  const ui = useUi.getState();
  if (isMobileViewport()) ui.setDrawer(side, true);
  else ui.setPanel(side, true);
  // Deux frames : le temps que le panneau (ou le tiroir) soit monté et visible.
  requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(id)?.focus()));
}
