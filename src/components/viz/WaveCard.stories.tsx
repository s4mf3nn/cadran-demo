import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert02Icon } from '@hugeicons/core-free-icons';
import { WaveCard } from './WaveCard';

const meta = {
  title: 'Visualisations/WaveCard',
  component: WaveCard,
  args: {
    icon: Alert02Icon,
    title: 'En retard',
    detail: '1 750 non conformes',
    help: "Part des exigences non conformes dont l'échéance est passée.",
    value: 0.42,
    variant: 0,
  },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
  decorators: [(Story) => <div className="h-64 w-80 [&>div]:h-full"><Story /></div>],
} satisfies Meta<typeof WaveCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
export const Vide: Story = { args: { value: 0 } };
export const NonCalculable: Story = { args: { value: null } };
