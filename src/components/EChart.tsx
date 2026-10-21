import { useEffect, useRef, type CSSProperties } from 'react';
import * as echarts from 'echarts/core';
import { BarChart, HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent, AriaComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsCoreOption } from 'echarts/core';

// Import modulaire : on n'embarque que les graphiques utilisés (bundle bien plus léger).
echarts.use([
  BarChart, HeatmapChart,
  GridComponent, TooltipComponent, VisualMapComponent, AriaComponent, LegendComponent,
  CanvasRenderer,
]);

interface Props {
  option: EChartsCoreOption;
  /** Description textuelle pour les lecteurs d'écran. */
  label: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Wrapper minimal autour d'ECharts : une instance par composant, mise à jour
 * incrémentale des options, resize via ResizeObserver, dispose au démontage.
 * Rendu canvas : des milliers de points sans créer un seul nœud DOM.
 */
export function EChart({ option, label, className, style }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    const el = ref.current!;
    const chart = echarts.init(el, undefined, { renderer: 'canvas' });
    chartRef.current = chart;
    const ro = new ResizeObserver(() => chart.resize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      chart.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption({ animationDuration: 300, ...option });
  }, [option]);

  return <div ref={ref} role="img" aria-label={label} className={className} style={style} />;
}
