import type { Meta, StoryObj } from '@storybook/react-vite';
import { aggregates } from '../../stories/fixtures';
import { WorldMap } from './WorldMap';

const meta = {
  title: 'Visualisations/WorldMap',
  component: WorldMap,
  args: { a: aggregates, className: 'w-[720px]' },
  parameters: { layout: 'padded' },
} satisfies Meta<typeof WorldMap>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
