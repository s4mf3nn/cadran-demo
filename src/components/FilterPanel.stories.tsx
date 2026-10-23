import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { initialFilters, useFilters } from '../store/filters';
import { aggregates } from '../stories/fixtures';
import { FilterPanel } from './FilterPanel';

const meta = {
  title: 'Tableau de bord/FilterPanel',
  component: FilterPanel,
  args: { aggregates },
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="flex h-[800px] w-80 flex-col"><Story /></div>],
  beforeEach: () => useFilters.setState({ filters: initialFilters }),
} satisfies Meta<typeof FilterPanel>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
export const Chargement: Story = { args: { aggregates: undefined } };
export const FiltresActifs: Story = {
  beforeEach: () => useFilters.setState({ filters: { ...initialFilters, statuses: ['non_conforme'], minRisk: 4, dueWithin: 90 } }),
};

export const Reinitialisation: Story = {
  beforeEach: () => useFilters.setState({ filters: { ...initialFilters, statuses: ['non_conforme'] } }),
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole('button', { name: /réinitialiser/i }));
    await expect(useFilters.getState().filters).toEqual(initialFilters);
  },
};
