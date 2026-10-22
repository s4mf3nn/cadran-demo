import { AiMagicIcon, FilterHorizontalIcon, Search01Icon } from '@hugeicons/core-free-icons';
import type { Aggregates, Requirement } from '@/data/types';
import type { AssistantApi } from '@/hooks/useAssistant';
import { useUi } from '@/store/ui';
import { AssistantPanel } from '../AssistantPanel';
import { FilterPanel } from '../FilterPanel';
import { GaugeRow, TopCountries, WaveGrid } from '../Dashboard';
import { RequirementsList } from '../RequirementsList';
import { Brand, SidebarBody } from './Sidebar';
import { SortButton } from './ViewBar';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

interface Props {
  rows: Requirement[];
  aggregates?: Aggregates;
  isLoading: boolean;
  isRefreshing: boolean;
  assistant: AssistantApi;
}

/** Mobile (< 768 px) : en-tête de 56 px, contenu empilé, panneaux en tiroirs ouverts depuis une barre flottante. */
export function MobileLayout({ rows, aggregates, isLoading, isRefreshing, assistant }: Props) {
  const leftDrawer = useUi((s) => s.leftDrawer);
  const rightDrawer = useUi((s) => s.rightDrawer);
  const setDrawer = useUi((s) => s.setDrawer);

  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <Brand />
        <Button type="button" variant="ghost" size="icon" aria-label="Rechercher" onClick={() => useUi.getState().setSearchOpen(true)}>
          <Icon icon={Search01Icon} size={20} />
        </Button>
      </header>

      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-4 pb-24 *:shrink-0">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold">Tableau de bord</h1>
          <SortButton />
        </div>

        {isLoading || !aggregates ? (
          <p className="py-12 text-center text-muted-foreground" aria-live="polite">Chargement du référentiel…</p>
        ) : (
          <>
            <div className={cn('flex flex-col gap-3 transition-opacity', isRefreshing && 'opacity-60')}>
              <GaugeRow a={aggregates} className="grid-cols-2 *:h-[168px] *:last:col-span-2" />
              <WaveGrid a={aggregates} className="h-[340px]" />
              <TopCountries a={aggregates} />
            </div>
            <RequirementsList rows={rows} />
          </>
        )}
      </main>

      <nav aria-label="Panneaux" className="fixed inset-x-4 bottom-4 z-40 flex gap-2 rounded-2xl border border-border bg-background p-2 shadow-lg">
        <Button type="button" variant="outline" className="h-11 flex-1" aria-haspopup="dialog" onClick={() => setDrawer('left', true)}>
          <Icon icon={FilterHorizontalIcon} />
          Filtres
        </Button>
        <Button type="button" variant="ghost" className="h-11 flex-1 bg-foreground text-background hover:bg-foreground/90" aria-haspopup="dialog" onClick={() => setDrawer('right', true)}>
          <Icon icon={AiMagicIcon} />
          Assistant
        </Button>
      </nav>

      <Drawer open={leftDrawer} onOpenChange={(o) => setDrawer('left', o)}>
        <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>Filtres</DrawerTitle>
            <DrawerDescription className="sr-only">Affiner les exigences affichées</DrawerDescription>
          </DrawerHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-4">
            <SidebarBody>
              <FilterPanel aggregates={aggregates} />
            </SidebarBody>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={rightDrawer} onOpenChange={(o) => setDrawer('right', o)}>
        <DrawerContent className="h-[88dvh] data-[vaul-drawer-direction=bottom]:max-h-[88dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="sr-only">Assistant</DrawerTitle>
            <DrawerDescription className="sr-only">Poser une question sur la sélection courante</DrawerDescription>
          </DrawerHeader>
          <AssistantPanel assistant={assistant} total={aggregates?.total} />
        </DrawerContent>
      </Drawer>
    </div>
  );
}
