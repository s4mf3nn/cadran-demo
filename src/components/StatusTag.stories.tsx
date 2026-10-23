import type { Meta, StoryObj } from '@storybook/react-vite';
import { STATUSES } from '../data/types';
import { StatusTag } from './StatusTag';

const meta = {
  title: 'Données/StatusTag',
  component: StatusTag,
  args: { status: 'conforme' },
  argTypes: { status: { control: 'radio', options: STATUSES } },
} satisfies Meta<typeof StatusTag>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Conforme: Story = {};
export const NonConforme: Story = { args: { status: 'non_conforme' } };

/** La couleur ne porte jamais seule l'information : le libellé suit toujours le point. */
export const Tous: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {STATUSES.map((s) => <StatusTag key={s} status={s} />)}
    </div>
  ),
};
