import { useMemo } from 'react';
import { EChart } from './EChart';
import { useChartTheme } from './useChartTheme';
import { STATUS_LABEL, STATUSES, type Aggregates, type Status } from '../data/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const nf = new Intl.NumberFormat('fr-FR');
/** De bas en haut : Non conforme, À évaluer, En cours, Conforme. */
const STACK_ORDER: Status[] = ['non_conforme', 'a_evaluer', 'en_cours', 'conforme'];
const LEGEND_ORDER: Status[] = [...STATUSES];

export function DeadlinesChart({ aggregates, compact = false }: { aggregates: Aggregates; compact?: boolean }) {
  const t = useChartTheme();
  const { deadlines, deadlinesByStatus } = aggregates;

  const option = useMemo(() => {
    const months = deadlines.map((d) => d.month);
    const maxTotal = Math.max(...deadlines.map((d) => d.count), 0);
    // Axe gradué par pas de 4 000 (0, 4k, 8k, 12k), étendu si un mois dépasse 12 000.
    const yMax = Math.max(12_000, Math.ceil(maxTotal / 4000) * 4000);
    // Les coins arrondis vont sur le segment le plus haut de chaque barre (le dernier non vide en partant du bas).
    const topOf = deadlinesByStatus.map((m) => [...STACK_ORDER].reverse().find((s) => m[s] > 0));

    return {
      textStyle: { color: t.mutedForeground, fontFamily: 'Inter Variable, sans-serif' },
      legend: {
        top: 0,
        left: 'center',
        icon: 'circle',
        itemWidth: 8,
        itemHeight: 8,
        itemGap: 16,
        textStyle: { color: t.mutedForeground, fontSize: 12 },
        data: LEGEND_ORDER.map((s) => STATUS_LABEL[s]),
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow', shadowStyle: { color: 'rgba(0,0,0,0.04)' } },
        backgroundColor: t.popover,
        borderColor: t.border,
        textStyle: { color: t.popoverForeground, fontSize: 12 },
        formatter: (params: { dataIndex: number }[]) => {
          const i = params[0]!.dataIndex;
          const m = deadlinesByStatus[i]!;
          const rows = LEGEND_ORDER.map(
            (s) => `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${t.status[s]}"></span>${STATUS_LABEL[s]}<b style="margin-left:auto;padding-left:16px">${nf.format(m[s])}</b></div>`,
          ).join('');
          return `<div style="font-weight:600;margin-bottom:4px">${months[i]} · ${nf.format(deadlines[i]!.count)} échéances</div>${rows}`;
        },
      },
      grid: { left: 36, right: 4, top: 36, bottom: 22 },
      xAxis: {
        type: 'category',
        data: months,
        axisTick: { show: false },
        axisLine: { lineStyle: { color: t.input } },
        axisLabel: { color: t.mutedForeground, fontSize: 11, interval: 0, formatter: (v: string) => v.split(' ')[0] },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yMax,
        interval: 4000,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: t.mutedForeground, fontSize: 11, formatter: (v: number) => (v === 0 ? '0' : `${v / 1000}k`) },
        splitLine: { lineStyle: { color: t.input, type: 'dashed' } },
      },
      series: STACK_ORDER.map((s) => ({
        name: STATUS_LABEL[s],
        type: 'bar',
        stack: 'echeances',
        barMaxWidth: 36,
        itemStyle: { color: t.status[s], borderColor: t.background, borderWidth: 2 },
        data: deadlinesByStatus.map((m, i) => ({
          value: m[s],
          itemStyle: topOf[i] === s ? { borderRadius: [4, 4, 0, 0] } : { borderRadius: 0 },
        })),
      })),
    };
  }, [deadlines, deadlinesByStatus, t]);

  const first = deadlines[0]?.month;
  const last = deadlines[deadlines.length - 1]?.month;

  return (
    <Card size="sm" role="region" aria-label="Échéances sur 12 mois" className={compact ? '' : 'min-w-0 flex-1'}>
      <CardHeader>
        <CardTitle role="heading" aria-level={2}>Échéances sur 12 mois</CardTitle>
      </CardHeader>
      <CardContent className={compact ? '' : 'min-h-0 flex-1'}>
        <EChart
          className={compact ? 'h-56' : 'h-full min-h-56'}
          option={option}
          label={`Échéances réglementaires par mois et par statut, de ${first} à ${last}`}
        />
      </CardContent>
    </Card>
  );
}
