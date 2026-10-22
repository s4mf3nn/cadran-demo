import { type ReactNode } from 'react';
import {
  Alert02Icon, Globe02Icon, Layers01Icon, Search01Icon, Settings01Icon, SidebarLeftIcon,
} from '@hugeicons/core-free-icons';
import type { IconSvgElement } from '@hugeicons/react';
import { focusIn } from '@/lib/focus';
import { useFilters } from '@/store/filters';
import { useUi } from '@/store/ui';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export const SIDEBAR_ID = 'panel-left';

const ICON_BUTTON = 'grid size-11 shrink-0 place-items-center rounded-full text-muted hover:bg-surface hover:text-foreground data-[state=open]:bg-surface data-[state=open]:text-foreground';

function IconButton({ icon, label, onClick, side = 'right', ...props }: { icon: IconSvgElement; label: string; onClick?: () => void; side?: 'right' | 'bottom' } & React.ComponentProps<'button'>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" aria-label={label} onClick={onClick} className={ICON_BUTTON} {...props}>
          <Icon icon={icon} size={22} />
        </button>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}

/** Losange de 18 px en dégradé conique (rose, corail, ambre, cyan, violet). */
export function Logo() {
  return (
    <span
      aria-hidden="true"
      className="block size-[13px] shrink-0 rotate-45 rounded-[4px]"
      style={{ background: 'conic-gradient(from 200deg, #ff4f9a, #ff7a59, #ffb547, #3fd5e6, #8b6cff, #ff4f9a)' }}
    />
  );
}

export function Brand() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid size-[18px] place-items-center"><Logo /></span>
      <span className="text-lg font-semibold">cadran</span>
    </div>
  );
}

/** Menu Réglages : réinitialisations et aide des raccourcis (ex-« Paramètres de vue »). */
export function SettingsMenu({ side = 'bottom' }: { side?: 'right' | 'bottom' }) {
  const reset = useFilters((s) => s.reset);
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button type="button" aria-label="Réglages" className={ICON_BUTTON}>
              <Icon icon={Settings01Icon} size={22} />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side={side}>Réglages</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuItem onSelect={reset}>Réinitialiser les filtres</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => useFilters.setState({ sort: { key: 'dueAt', dir: 'asc' } })}>Réinitialiser le tri</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => useUi.getState().setHelpOpen(true)}>Raccourcis clavier</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Contenu du panneau de filtres, partagé entre la sidebar desktop et le tiroir mobile. */
export function SidebarBody({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
}

/** Panneau de gauche : carte de 280 px, ou rail de 68 px qui ne garde que des icônes. */
export function Sidebar({ children }: { children: ReactNode }) {
  const open = useUi((s) => s.leftOpen);
  const toggle = useUi((s) => s.togglePanel);
  const label = open ? 'Réduire le panneau de filtres' : 'Ouvrir le panneau de filtres';
  const toggleButton = (
    <IconButton icon={SidebarLeftIcon} label={`${label} (`} aria-label={label} aria-expanded={open} aria-controls={SIDEBAR_ID} onClick={() => toggle('left')} side={open ? 'bottom' : 'right'} />
  );

  return (
    <aside
      id={SIDEBAR_ID}
      aria-label="Filtres"
      className={cn(
        'hidden shrink-0 flex-col overflow-hidden rounded-card border-2 border-card-border bg-background md:flex',
        open ? 'w-[280px]' : 'w-[68px] items-center',
      )}
    >
      {open ? (
        <>
          <div className="flex h-[66px] shrink-0 items-center justify-between pr-2.5 pl-5">
            <Brand />
            <div className="flex items-center">
              {toggleButton}
              <SettingsMenu />
            </div>
          </div>
          <SidebarBody>{children}</SidebarBody>
        </>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col items-center gap-1 py-3">
          <span className="grid size-11 place-items-center"><Logo /></span>
          {toggleButton}
          <span aria-hidden="true" className="my-1 h-px w-6 bg-track" />
          <IconButton icon={Search01Icon} label="Rechercher" onClick={() => useUi.getState().setSearchOpen(true)} />
          <IconButton icon={Alert02Icon} label="Filtres : statut et risque" onClick={() => focusIn('left', 'filter-status')} />
          <IconButton icon={Layers01Icon} label="Filtres : catégories" onClick={() => focusIn('left', 'filter-category')} />
          <IconButton icon={Globe02Icon} label="Filtres : pays" onClick={() => focusIn('left', 'filter-country')} />
          <div className="mt-auto">
            <SettingsMenu side="right" />
          </div>
        </div>
      )}
    </aside>
  );
}
