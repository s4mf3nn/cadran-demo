import { HelpCircleIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** Icône d'aide « ? » : bouton qui affiche la définition de l'indicateur au survol ou au focus. */
export function HelpTip({ label, text, className }: { label: string; text: string; className?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={`Aide : ${label}`}
          className={cn('grid size-7 shrink-0 place-items-center rounded-full text-help hover:text-muted', className)}
        >
          <Icon icon={HelpCircleIcon} size={20} />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-64 text-caption leading-snug">{text}</TooltipContent>
    </Tooltip>
  );
}
