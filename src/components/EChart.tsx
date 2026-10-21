import { useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent, AriaComponent, TitleComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

// Import modulaire : on n'embarque que les graphiques utilisés (bundle bien plus léger).
echarts.use([
  BarChart, HeatmapChart, LineChart, PieChart,
  GridComponent, TooltipComponent, VisualMapComponent, AriaComponent, TitleComponent, LegendComponent,
  CanvasRenderer,
]);

interface Props {
  option: EChartsCoreOption;
  /** Description textuelle pour les lecteurs d'écran. */
  label: string;
  className?: string;
  /** Clic sur un élément du graphique (utilisé pour le filtrage croisé). */
  onItemClick?: (params: { name: string; data: unknown }) => void;
}

/**
 * Wrapper minimal autour d'ECharts : une instance par composant, mise à jour
 * incrémentale des options, resize via ResizeObserver, dispose au démontage.
 * Rendu canvas : des milliers de points sans créer un seul nœud DOM.
 */
export function EChart({ option, label, className, onItemClick }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);
  // Ref vers le dernier handler : pas besoin de ré-abonner l'événement à chaque rendu.
  const clickRef = useRef(onItemClick);
  clickRef.current = onItemClick;

  useEffect(() => {
    const el = ref.current!;
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    chart.on('click', (p) => clickRef.current?.({ name: p.name, data: p.data }));
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption({ aria: { enabled: true }, animationDuration: 300, ...option });
  }, [option]);

  return <div ref={ref} role="img" aria-label={label} className={className} />;
}
