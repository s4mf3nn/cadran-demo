import { useFilters } from '@/store/filters';
import { useUi } from '@/store/ui';
import { focusIn } from '@/lib/focus';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';

export function QuickActions({ onExport }: { onExport: () => void }) {
  const open = useUi((s) => s.quickOpen);
  const setOpen = useUi((s) => s.setQuickOpen);
  const toggle = useUi((s) => s.togglePanel);
  const setHelpOpen = useUi((s) => s.setHelpOpen);
  const reset = useFilters((s) => s.reset);

  const run = (fn: () => void) => () => {
    setOpen(false);
    // Laisse le dialogue rendre le focus avant de le redéplacer.
    setTimeout(fn, 0);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} className="overflow-hidden p-0 sm:max-w-lg">
        <DialogTitle className="sr-only">Actions rapides</DialogTitle>
        <DialogDescription className="sr-only">Tapez pour filtrer les actions, Entrée pour lancer.</DialogDescription>
        <Command>
          <CommandInput placeholder="Rechercher une action…" />
          <CommandList>
            <CommandEmpty>Aucune action.</CommandEmpty>
            <CommandGroup heading="Actions">
              <CommandItem onSelect={run(() => focusIn('left', 'filter-search'))}>Rechercher une exigence</CommandItem>
              <CommandItem onSelect={run(reset)}>Réinitialiser les filtres</CommandItem>
              <CommandItem onSelect={run(onExport)}>Exporter en CSV</CommandItem>
              <CommandItem onSelect={run(() => focusIn('right', 'assistant-input'))}>Poser une question à l'assistant</CommandItem>
              <CommandItem onSelect={run(() => toggle('left'))}>Réduire ou rouvrir les filtres</CommandItem>
              <CommandItem onSelect={run(() => toggle('right'))}>Réduire ou rouvrir l'assistant</CommandItem>
              <CommandItem onSelect={run(() => setHelpOpen(true))}>Afficher les raccourcis clavier</CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
