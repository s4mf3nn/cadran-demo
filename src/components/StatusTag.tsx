import { STATUS_LABEL, type Status } from '../data/types';
import { cn } from '@/lib/utils';

export const STATUS_CLASS: Record<Status, string> = {
  conforme: 'bg-status-conforme-bg text-status-conforme-fg',
  en_cours: 'bg-status-en-cours-bg text-status-en-cours-fg',
  a_evaluer: 'bg-status-a-evaluer-bg text-status-a-evaluer-fg',
  non_conforme: 'bg-status-non-conforme-bg text-status-non-conforme-fg',
};

export const STATUS_DOT: Record<Status, string> = {
  conforme: 'bg-status-conforme',
  en_cours: 'bg-status-en-cours',
  a_evaluer: 'bg-status-a-evaluer',
  non_conforme: 'bg-status-non-conforme',
};

/** Pastille de couleur (décorative : le libellé accompagne toujours l'information). */
export function StatusDot({ status, className }: { status: Status; className?: string }) {
  return <span aria-hidden="true" className={cn('inline-block size-2 shrink-0 rounded-full', STATUS_DOT[status], className)} />;
}

/** Étiquette de statut : fond -bg, texte -fg et libellé, pour que la couleur ne porte jamais seule l'information. */
export function StatusTag({ status, className }: { status: Status; className?: string }) {
  return (
    <span className={cn('inline-flex h-5 items-center rounded-[6px] px-1.5 text-xs font-medium whitespace-nowrap', STATUS_CLASS[status], className)}>
      {STATUS_LABEL[status]}
    </span>
  );
}
