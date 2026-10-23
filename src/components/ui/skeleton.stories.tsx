import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './skeleton';

const meta = {
  title: 'UI/Skeleton',
  component: Skeleton,
  args: { className: 'h-6 w-64' },
} satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {};
