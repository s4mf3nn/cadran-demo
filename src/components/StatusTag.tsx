import { STATUS_LABEL, type Status } from '../data/types';
import { cn } from '@/lib/utils';

export const STATUS_DOT: Record<Status, string> = {
  conforme: 'bg-status-conforme',
  en_cours: 'bg-status-en-cours',
  a_evaluer: 'bg-status-a-evaluer',
  non_conforme: 'bg-status-non-conforme',
};

/** Point de couleur (décoratif : le libellé accompagne toujours l'information). */
export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', STATUS_DOT[status], className)} />;
}

/** Statut : point de couleur suivi du libellé, pour que la couleur ne porte jamais seule l'information. */
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <StatusDot status={status} />
      {STATUS_LABEL[status]}
    </span>
  );
}
