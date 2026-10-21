import { type ReactNode } from 'react';
import {
  Alert02Icon, GridViewIcon, Globe02Icon, KeyboardIcon, PieChart02Icon, Search01Icon, SidebarLeftIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { focusIn } from '@/lib/focus';
import { useUi } from '@/store/ui';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Kbd } from '@/components/ui/kbd';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const SIDEBAR_ID = 'panel-left';

function RailButton({ icon, label, onClick }: { icon: IconSvgElement; label: string; onClick: () => void }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} onClick={onClick}>
          <Icon icon={icon} size={18} />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function Brand() {
  return (
    <div className="flex items-center gap-2">
      <span aria-hidden="true" className="grid size-[26px] shrink-0 place-items-center rounded-md bg-foreground text-background">
        <Icon icon={PieChart02Icon} size={16} strokeWidth={1.75} />
      </span>
      <span className="text-sm font-semibold">Cadran</span>
    </div>
  );
}

/** Contenu du panneau de filtres, partagé entre la sidebar desktop et le tiroir mobile. */
export function SidebarBody({ children }: { children: ReactNode }) {
  const setHelpOpen = useUi((s) => s.setHelpOpen);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <div className="border-t border-border p-3">
        <Button type="button" variant="ghost" className="h-9 w-full justify-start gap-2 px-2.5 text-muted-foreground" onClick={() => setHelpOpen(true)}>
          <Icon icon={KeyboardIcon} />
          <span className="flex-1 text-left">Raccourcis clavier</span>
          <Kbd>?</Kbd>
        </Button>
      </div>
    </div>
  );
}

/** Panneau de gauche : 260 px, ou rail de 52 px qui ne garde que des icônes. */
export function Sidebar({ children }: { children: ReactNode }) {
  const open = useUi((s) => s.leftOpen);
  const toggle = useUi((s) => s.togglePanel);
  const setHelpOpen = useUi((s) => s.setHelpOpen);
  const label = open ? 'Réduire le panneau de filtres' : 'Ouvrir le panneau de filtres';

  return (
    <aside
      id={SIDEBAR_ID}
      aria-label="Filtres"
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 motion-reduce:transition-none md:flex',
        open ? 'w-[260px]' : 'w-[52px] items-center',
      )}
    >
      <div className={cn('flex h-[52px] shrink-0 items-center', open ? 'justify-between px-3' : 'justify-center')}>
        {open && <Brand />}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button type="button" variant="ghost" size="icon" aria-label={label} aria-expanded={open} aria-controls={SIDEBAR_ID} onClick={() => toggle('left')}>
              <Icon icon={SidebarLeftIcon} size={18} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">{label} (</TooltipContent>
        </Tooltip>
      </div>

      {open ? (
        <SidebarBody>{children}</SidebarBody>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 py-2">
          <RailButton icon={Search01Icon} label="Rechercher" onClick={() => useUi.getState().setSearchOpen(true)} />
          <span aria-hidden="true" className="my-1 h-px w-6 bg-border" />
          <RailButton icon={Alert02Icon} label="Filtres : statut et risque" onClick={() => focusIn('left', 'filter-status')} />
          <RailButton icon={GridViewIcon} label="Filtres : catégories" onClick={() => focusIn('left', 'filter-category')} />
          <RailButton icon={Globe02Icon} label="Filtres : pays" onClick={() => focusIn('left', 'filter-country')} />
          <div className="mt-auto">
            <RailButton icon={KeyboardIcon} label="Raccourcis clavier" onClick={() => setHelpOpen(true)} />
          </div>
        </div>
      )}
    </aside>
  );
}
