import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, screen } from 'storybook/test';
import { HelpTip } from './HelpTip';

const meta = {
  title: 'Visualisations/HelpTip',
  component: HelpTip,
  args: { label: 'En risque', text: 'Part des exigences non conformes ou de risque 4 (Élevé) ou 5 (Critique).' },
} satisfies Meta<typeof HelpTip>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  play: async ({ canvas }) => {
    await userEvent.tab();
    await expect(canvas.getByRole('button', { name: 'Aide : En risque' })).toHaveFocus();
    await expect(await screen.findByRole('tooltip')).toBeVisible();
  },
};
