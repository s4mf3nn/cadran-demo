import { Download04Icon, Github01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { exportCsv } from '@/lib/exportCsv';
import { focusIn } from '@/lib/focus';
import { useUi } from '@/store/ui';
import type { Requirement } from '@/data/types';
import { Icon } from '@/components/ui/icon';
import { nf } from '../viz/format';
import { RIGHT_PANEL_ID } from './RightPanel';

export interface Timings { init?: number; query?: number }

const PILL = 'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-body font-medium';

/** Ligne de mesures : volume du référentiel puis durées réelles du worker, arrondies à la milliseconde. */
export function TimingsText({ datasetSize, timings, isRefreshing }: { datasetSize?: number; timings: Timings; isRefreshing: boolean }) {
  return (
    <p className="truncate text-sm text-muted" aria-live="polite">
      {datasetSize != null && <span className="text-foreground">{nf.format(datasetSize)} exigences</span>}
      {timings.init != null && ` · génération ${Math.round(timings.init)} ms`}
      {timings.query != null && ` · requête ${Math.round(timings.query)} ms (hors main thread)`}
      {isRefreshing && ' · recalcul…'}
    </p>
  );
}

export function AppHeader({ rows, datasetSize, timings, isRefreshing }: { rows: Requirement[]; datasetSize?: number; timings: Timings; isRefreshing: boolean }) {
  const rightOpen = useUi((s) => s.rightOpen);
  const setPanel = useUi((s) => s.setPanel);

  return (
    <header className="flex h-[76px] shrink-0 items-center justify-between gap-4 pl-1">
      <div className="min-w-0">
        <h1 className="text-display leading-9 font-semibold tracking-[-0.02em]">Tableau de bord</h1>
        <TimingsText datasetSize={datasetSize} timings={timings} isRefreshing={isRefreshing} />
      </div>
      <div className="flex items-center gap-2.5">
        <a href="https://github.com/s4mf3nn/cadran-demo" target="_blank" rel="noopener" className={`${PILL} border-[1.5px] border-track hover:bg-surface`}>
          <Icon icon={Github01Icon} size={20} />
          GitHub
          <span className="sr-only"> (s'ouvre dans un nouvel onglet)</span>
        </a>
        <button
          type="button"
          disabled={rows.length === 0}
          onClick={() => exportCsv(rows)}
          aria-label={`Exporter en CSV les ${nf.format(rows.length)} exigences filtrées`}
          className={`${PILL} bg-surface hover:bg-track disabled:text-muted`}
        >
          <Icon icon={Download04Icon} size={20} />
          Exporter
        </button>
        {!rightOpen && (
          <button
            type="button"
            aria-expanded={false}
            aria-controls={RIGHT_PANEL_ID}
            onClick={() => { setPanel('right', true); focusIn('right', 'assistant-input'); }}
            className={`${PILL} bg-foreground text-background hover:bg-foreground-soft`}
          >
            <Icon icon={SparklesIcon} size={20} />
            Assistant
          </button>
        )}
      </div>
    </header>
  );
}
