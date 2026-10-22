import { cn } from '@/lib/utils';
import { SEG_BG } from './format';

/**
 * Jauge de 10 points de 8 px, allumés au prorata (0..1). Le point i prend la couleur
 * du segment ⌈(i + 1) / 2⌉ selon sa position ; les points éteints sont en --track.
 * Décorative : le volume est toujours écrit à côté.
 */
export function DotGauge({ value, dots = 10, className }: { value: number; dots?: number; className?: string }) {
  const lit = value > 0 ? Math.max(1, Math.round(value * dots)) : 0;
  return (
    <span aria-hidden="true" className={cn('flex gap-[5px]', className)}>
      {Array.from({ length: dots }, (_, i) => (
        <span key={i} className={cn('size-2 rounded-full', i < lit ? SEG_BG[Math.floor((i * 5) / dots)] : 'bg-track')} />
      ))}
    </span>
  );
}

/** Barre de 5 segments allumés au prorata (mini-cartes pays de l'assistant). */
export function SegmentBar({ value, className }: { value: number; className?: string }) {
  return (
    <span aria-hidden="true" className={cn('grid grid-cols-5 gap-1.5', className)}>
      {SEG_BG.map((bg, i) => {
        const fill = Math.min(1, Math.max(0, value * 5 - i));
        return (
          <span key={bg} className="h-1.5 overflow-hidden rounded-full bg-track">
            <span className={cn('block h-full rounded-full', bg)} style={{ width: `${fill * 100}%` }} />
          </span>
        );
      })}
    </span>
  );
}
