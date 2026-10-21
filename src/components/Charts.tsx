import { memo, useMemo, type ReactNode } from 'react';
import { EChart } from './EChart';
import { useChartTheme, type ChartTheme } from './useChartTheme';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CATEGORIES, STATUS_LABEL, STATUSES, type Aggregates, type Country } from '../data/types';
import { useFilters } from '../store/filters';

const nf = new Intl.NumberFormat('fr-FR', { notation: 'compact' });

function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card size="sm" role="region" aria-label={title}>
      <CardHeader>
        <CardTitle role="heading" aria-level={2} className="text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

/** Styles communs aux axes cartésiens : tout vient des tokens du thème courant. */
function axisStyle(t: ChartTheme) {
  return {
    axisLine: { lineStyle: { color: t.border } },
    axisTick: { lineStyle: { color: t.border } },
    axisLabel: { color: t.mutedForeground },
    splitLine: { lineStyle: { color: t.border } },
  };
}

function tooltipStyle(t: ChartTheme) {
  return {
    backgroundColor: t.popover,
    borderColor: t.border,
    textStyle: { color: t.popoverForeground },
  };
}

/** memo : les graphiques ne se recalculent que si les agrégats ou le thème changent réellement. */
export const Charts = memo(function Charts({ aggregates }: { aggregates: Aggregates }) {
  const toggle = useFilters((s) => s.toggle);
  const t = useChartTheme();

  const statusOption = useMemo(
    () => ({
      textStyle: { color: t.mutedForeground },
      tooltip: { trigger: 'item', ...tooltipStyle(t), valueFormatter: (v: number) => v.toLocaleString('fr-FR') },
      legend: { bottom: 0, itemWidth: 10, itemHeight: 10, textStyle: { fontSize: 11, color: t.mutedForeground } },
      // Même correspondance que les badges de la table : conforme = success, en cours = info, à évaluer = warning, non conforme = destructive.
      color: [t.success, t.info, t.warning, t.destructive],
      series: [{
        type: 'pie',
        radius: ['40%', '68%'],
        center: ['50%', '42%'],
        label: { show: false },
        itemStyle: { borderColor: t.card, borderWidth: 2 },
        data: STATUSES.map((s) => ({ name: STATUS_LABEL[s], value: aggregates.byStatus[s] })),
      }],
    }),
    [aggregates.byStatus, t],
  );

  const countryOption = useMemo(() => {
    const top = aggregates.byCountry.slice(0, 10).reverse();
    return {
      textStyle: { color: t.mutedForeground },
      tooltip: { trigger: 'axis', ...tooltipStyle(t) },
      grid: { left: 110, right: 16, top: 8, bottom: 24 },
      xAxis: { type: 'value', splitNumber: 3, ...axisStyle(t), axisLabel: { color: t.mutedForeground, formatter: (v: number) => nf.format(v) } },
      yAxis: { type: 'category', data: top.map((c) => c.country), ...axisStyle(t), splitLine: { show: false } },
      series: [{ type: 'bar', data: top.map((c) => c.count), itemStyle: { color: t.series[0], borderRadius: [0, 4, 4, 0] } }],
    };
  }, [aggregates.byCountry, t]);

  const heatOption = useMemo(() => {
    const heatCountries = aggregates.byCountry.slice(0, 12).map((c) => c.country);
    const values = aggregates.heatmap.filter((h) => heatCountries.includes(h.country)).map((h) => h.count);
    // Échelle bornée sur les valeurs réelles : sinon tout paraît uniforme quand les écarts sont faibles.
    const min = Math.min(...values);
    const max = Math.max(min + 1, ...values);
    return {
      textStyle: { color: t.mutedForeground },
      tooltip: { position: 'top', ...tooltipStyle(t) },
      grid: { left: 110, right: 16, top: 8, bottom: 70 },
      xAxis: { type: 'category', data: [...CATEGORIES], ...axisStyle(t), splitLine: { show: false }, axisLabel: { color: t.mutedForeground, rotate: 35 } },
      yAxis: { type: 'category', data: heatCountries, ...axisStyle(t), splitLine: { show: false } },
      // Rampe séquentielle tirée de --destructive : plus la valeur est élevée, plus la teinte est contrastée avec le fond de la carte.
      visualMap: { min, max, show: false, inRange: { color: t.heat } },
      series: [{
        type: 'heatmap',
        itemStyle: { borderColor: t.card, borderWidth: 1 },
        data: aggregates.heatmap
          .filter((h) => heatCountries.includes(h.country))
          .map((h) => [CATEGORIES.indexOf(h.category), heatCountries.indexOf(h.country), h.count]),
      }],
    };
  }, [aggregates.heatmap, aggregates.byCountry, t]);

  const deadlineOption = useMemo(
    () => ({
      textStyle: { color: t.mutedForeground },
      tooltip: { trigger: 'axis', ...tooltipStyle(t) },
      grid: { left: 48, right: 16, top: 8, bottom: 24 },
      xAxis: { type: 'category', data: aggregates.deadlines.map((d) => d.month), ...axisStyle(t), splitLine: { show: false } },
      yAxis: { type: 'value', ...axisStyle(t), axisLabel: { color: t.mutedForeground, formatter: (v: number) => nf.format(v) } },
      series: [{
        type: 'line',
        smooth: true,
        itemStyle: { color: t.series[1] },
        lineStyle: { color: t.series[1] },
        areaStyle: { color: t.series[1], opacity: 0.15 },
        data: aggregates.deadlines.map((d) => d.count),
      }],
    }),
    [aggregates.deadlines, t],
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <ChartCard title="Répartition par statut">
        <EChart className="h-56" option={statusOption} label="Répartition des exigences par statut de conformité" />
      </ChartCard>
      <ChartCard title="Pays les plus exposés (cliquer pour filtrer)">
        <EChart
          className="h-56"
          option={countryOption}
          label="Top 10 des pays par nombre d'exigences en risque"
          onItemClick={({ name }) => toggle('countries', name as Country)}
        />
      </ChartCard>
      <ChartCard title="Carte de chaleur pays × catégorie">
        <EChart className="h-56" option={heatOption} label="Exigences en risque par pays et catégorie de produit" />
      </ChartCard>
      <ChartCard title="Échéances sur 12 mois">
        <EChart className="h-56" option={deadlineOption} label="Nombre d'échéances réglementaires par mois" />
      </ChartCard>
    </div>
  );
});
