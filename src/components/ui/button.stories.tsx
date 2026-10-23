import type { Meta, StoryObj } from '@storybook/react-vite';
import { Search01Icon, SparklesIcon } from '@hugeicons/core-free-icons';
import { fn } from 'storybook/test';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Icon } from './icon';

const meta = {
  title: 'UI/Button',
  component: Button,
  args: { children: 'Réessayer', onClick: fn() },
  argTypes: {
    variant: { control: 'select', options: ['default', 'outline', 'secondary', 'ghost', 'destructive', 'link'] },
    size: { control: 'select', options: ['default', 'xs', 'sm', 'lg', 'icon', 'icon-xs', 'icon-sm', 'icon-lg'] },
  },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Seul usage « nu » dans l'app : l'action « Réessayer » de l'assistant. */
export const Reessayer: Story = { args: { size: 'xs', variant: 'outline' } };
export const Desactive: Story = { args: { disabled: true } };

/** Boutons du mode mobile (barre du bas, `MobileLayout`) : le Button shadcn surchargé en pilule de 44 px. */
export const PilulesMobile: Story = {
  render: () => (
    <div className="flex w-80 gap-2">
      <Button variant="ghost" className="h-11 flex-1 rounded-full bg-surface hover:bg-track">Filtres</Button>
      <Button variant="ghost" className="h-11 flex-1 rounded-full bg-foreground text-background hover:bg-foreground-soft">
        <Icon icon={SparklesIcon} size={20} />Assistant
      </Button>
    </div>
  ),
};

/** Icône seule de la barre mobile. */
export const IconeFantome: Story = {
  args: { variant: 'ghost', size: 'icon', 'aria-label': 'Rechercher', children: <Icon icon={Search01Icon} size={20} /> },
};

const PILL = 'inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-5 text-body font-medium';
/** Pilules écrites à la main dans le header, la fiche et l'assistant : mêmes classes que dans l'app (hors Button shadcn). */
export const PilulesDeLApp: Story = {
  render: () => (
    <div className="flex gap-2.5">
      <button type="button" className={cn(PILL, 'border-[1.5px] border-track hover:bg-surface')}>GitHub</button>
      <button type="button" className={cn(PILL, 'bg-surface hover:bg-track')}>Exporter</button>
      <button type="button" className={cn(PILL, 'justify-center bg-foreground text-background hover:bg-foreground-soft')}>
        <Icon icon={SparklesIcon} size={20} />Assistant
      </button>
      <button type="button" disabled className={cn(PILL, 'justify-center bg-foreground text-background disabled:bg-track disabled:text-muted')}>Désactivé</button>
    </div>
  ),
};
