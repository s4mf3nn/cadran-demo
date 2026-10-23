import type { Meta, StoryObj } from '@storybook/react-vite';
import { aggregates } from '../stories/fixtures';
import { Dashboard, GaugeRow, WaveGrid } from './Dashboard';

const meta = {
  title: 'Tableau de bord/Dashboard',
  component: Dashboard,
  args: { a: aggregates, isRefreshing: false },
  parameters: { layout: 'fullscreen' },
  decorators: [(Story) => <div className="h-[900px] p-4"><Story /></div>],
} satisfies Meta<typeof Dashboard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Complet: Story = {};
export const Recalcul: Story = { args: { isRefreshing: true } };

export const Jauges: Story = {
  render: () => <GaugeRow a={aggregates} className="w-[1000px] grid-cols-5" />,
  parameters: { layout: 'padded' },
};
export const Vagues: Story = {
  render: () => <WaveGrid a={aggregates} className="h-[420px] w-[640px]" />,
  parameters: { layout: 'padded' },
};
