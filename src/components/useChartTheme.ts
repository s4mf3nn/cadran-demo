import { useSyncExternalStore } from 'react';
import type { Status } from '../data/types';
import { subscribeTheme } from './theme';

/** Tokens CSS lus pour ECharts, tous convertis en rgb()/rgba() (ECharts ne sait pas parser color-mix ni var()). */
export interface ChartTheme {
  foreground: string;
  mutedForeground: string;
  border: string;
  /** Pointillés de grille et axes. */
  input: string;
  background: string;
  popover: string;
  popoverForeground: string;
  /** Couleur pleine de chaque statut (chart-1 à chart-4, dans l'ordre Conforme, En cours, À évaluer, Non conforme). */
  status: Record<Status, string>;
  /** Rampe séquentielle de la carte de chaleur : bleu mélangé à 8 % puis à 90 % sur blanc. */
  heat: [string, string];
}

let ctx: CanvasRenderingContext2D | null | undefined;

/** Résout n'importe quelle couleur CSS (oklch, color-mix…) en rgb() via un canvas 1x1. */
function toRgb(css: string): string {
  ctx ??= document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx || !css) return css;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = 'rgb(0 0 0)';
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data as unknown as [number, number, number, number];
  return a === 255 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

function readTheme(): ChartTheme {
  const style = getComputedStyle(document.documentElement);
  const raw = (name: string) => style.getPropertyValue(`--${name}`).trim();
  const token = (name: string) => toRgb(raw(name));
  // color-mix est résolu par le moteur CSS puis converti : pas de calcul de couleur à la main.
  const mixOnWhite = (name: string, pct: number) => toRgb(`color-mix(in srgb, ${raw(name)} ${pct}%, white)`);

  return {
    foreground: token('foreground'),
    mutedForeground: token('muted-foreground'),
    border: token('border'),
    input: token('input'),
    background: token('background'),
    popover: token('popover'),
    popoverForeground: token('popover-foreground'),
    status: { conforme: token('chart-1'), en_cours: token('chart-2'), a_evaluer: token('chart-3'), non_conforme: token('chart-4') },
    heat: [mixOnWhite('chart-1', 8), mixOnWhite('chart-1', 90)],
  };
}

// Cache invalidé à chaque changement de thème : getSnapshot doit renvoyer une valeur stable entre deux changements.
let cache: ChartTheme | null = null;

function subscribe(onChange: () => void) {
  return subscribeTheme(() => {
    cache = null;
    onChange();
  });
}

function getSnapshot(): ChartTheme {
  return (cache ??= readTheme());
}

/** Couleurs du thème courant pour ECharts (canvas, donc incapable de lire var(--x)). Se met à jour au changement de thème. */
export function useChartTheme(): ChartTheme {
  return useSyncExternalStore(subscribe, getSnapshot);
}
