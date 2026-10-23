import type { Meta, StoryObj } from '@storybook/react-vite';
import { Kbd } from './kbd';

const meta = { title: 'UI/Kbd', component: Kbd, args: { children: '/' } } satisfies Meta<typeof Kbd>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
/** Ligne de la boîte de dialogue « Raccourcis clavier ». */
export const Raccourci: Story = {
  render: () => (
    <div className="flex w-72 items-center justify-between gap-4 py-1.5 text-sm">
      <span>Ouvrir la recherche</span>
      <span className="flex gap-1"><Kbd>Ctrl</Kbd><Kbd>K</Kbd></span>
    </div>
  ),
};
