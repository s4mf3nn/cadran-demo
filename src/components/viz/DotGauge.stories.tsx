import type { Meta, StoryObj } from '@storybook/react-vite';
import { DotGauge, SegmentBar } from './DotGauge';

const meta = {
  title: 'Visualisations/DotGauge',
  component: DotGauge,
  args: { value: 0.6, dots: 10 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.05 } } },
} satisfies Meta<typeof DotGauge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
export const Vide: Story = { args: { value: 0 } };
export const Pleine: Story = { args: { value: 1 } };

/** Variante en 5 segments, utilisée dans les mini-cartes pays de l'assistant. */
export const BarreDeSegments: Story = {
  render: ({ value }) => <SegmentBar value={value} className="w-48" />,
};
