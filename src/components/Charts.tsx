import { memo } from 'react';
import { DeadlinesChart } from './DeadlinesChart';
import { HeatmapCard } from './HeatmapCard';
import type { Aggregates } from '../data/types';

/** Rangée de graphiques ECharts (chargée à part) : échéances en largeur flexible, carte de chaleur à côté. */
export const Charts = memo(function Charts({ aggregates }: { aggregates: Aggregates }) {
  return (
    <div className="flex flex-col gap-4 lg:h-[340px] lg:flex-row">
      <DeadlinesChart aggregates={aggregates} />
      <HeatmapCard aggregates={aggregates} />
    </div>
  );
});
