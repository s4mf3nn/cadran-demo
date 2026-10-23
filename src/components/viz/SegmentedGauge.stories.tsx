import type { Meta, StoryObj } from '@storybook/react-vite';
import { SegmentedGauge } from './SegmentedGauge';

const meta = {
  title: 'Visualisations/SegmentedGauge',
  component: SegmentedGauge,
  args: { value: 0.57, label: 'En risque' },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
} satisfies Meta<typeof SegmentedGauge>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
/** Échelle inversée : une valeur haute est une bonne nouvelle (ex. « Conformes »). */
export const Inversee: Story = { args: { value: 0.8, label: 'Conformes', reversed: true } };
export const NonCalculable: Story = { args: { value: null } };
