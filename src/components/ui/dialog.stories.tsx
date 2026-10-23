import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent } from 'storybook/test';
import { Button } from './button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';

const meta = {
  title: 'UI/Dialog',
  component: Dialog,
  render: (args) => (
    <Dialog {...args}>
      <DialogTrigger asChild><Button variant="outline">Ouvrir</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Réinitialiser les filtres</DialogTitle>
          <DialogDescription>Tous les filtres actifs seront retirés.</DialogDescription>
        </DialogHeader>
        <DialogFooter><Button>Confirmer</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  ),
} satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: 'Ouvrir' }));
    await expect(await screen.findByRole('dialog', { name: 'Réinitialiser les filtres' })).toBeInTheDocument();
  },
};
