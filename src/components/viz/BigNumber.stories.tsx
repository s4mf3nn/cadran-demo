import type { Meta, StoryObj } from '@storybook/react-vite';
import { BigNumber } from './BigNumber';

const meta = {
  title: 'Visualisations/BigNumber',
  component: BigNumber,
  args: { value: 0.574, size: 64 },
  argTypes: { value: { control: { type: 'range', min: 0, max: 1, step: 0.01 } } },
} satisfies Meta<typeof BigNumber>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
/** Dénominateur nul : « — », jamais un 0 % inventé. */
export const NonCalculable: Story = { args: { value: null } };
