import { RISKS, type Risk } from '../data/types';
import { SEG_BG } from './viz/format';
import { cn } from '@/lib/utils';

/** 5 segments horizontaux de 12×6 px : allumés en --seg-n jusqu'au niveau de l'exigence, éteints en --track. */
export function RiskMeter({ risk, className }: { risk: Risk; className?: string }) {
  return (
    <span role="img" aria-label={`Risque ${risk} sur 5`} className={cn('inline-flex gap-1', className)}>
      {RISKS.map((level) => (
        <span key={level} aria-hidden="true" className={cn('h-1.5 w-3 rounded-full', level <= risk ? SEG_BG[level - 1] : 'bg-track')} />
      ))}
    </span>
  );
}
