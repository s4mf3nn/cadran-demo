import { useSyncExternalStore } from 'react';
import { subscribeTheme } from './theme';

/** Tokens CSS lus pour ECharts, tous convertis en rgb()/rgba() (ECharts ne sait pas parser oklch). */
export interface ChartTheme {
  foreground: string;
  mutedForeground: string;
  border: string;
  card: string;
  popover: string;
  popoverForeground: string;
  destructive: string;
  success: string;
  info: string;
  warning: string;
  /** chart-1 à chart-5 */
  series: string[];
  /** Rampe séquentielle (clair → foncé en thème clair, sombre → clair en thème sombre) : monotone dans les deux thèmes. */
  heat: string[];
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
  const token = (name: string) => toRgb(style.getPropertyValue(`--${name}`).trim());
  const card = token('card');
  // color-mix est résolu par le moteur CSS puis converti : pas de calcul de couleur à la main.
  const mixOnCard = (name: string, pct: number) =>
    toRgb(`color-mix(in oklab, ${style.getPropertyValue(`--${name}`).trim()} ${pct}%, ${style.getPropertyValue('--card').trim()})`);

  return {
    foreground: token('foreground'),
    mutedForeground: token('muted-foreground'),
    border: token('border'),
    card,
    popover: token('popover'),
    popoverForeground: token('popover-foreground'),
    destructive: token('destructive'),
    success: token('success'),
    info: token('info'),
    warning: token('warning'),
    series: [1, 2, 3, 4, 5].map((i) => token(`chart-${i}`)),
    heat: [mixOnCard('destructive', 10), mixOnCard('destructive', 55), token('destructive')],
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
