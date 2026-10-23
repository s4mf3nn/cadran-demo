import type { Meta, StoryObj } from '@storybook/react-vite';
import { RISKS } from '../data/types';
import { RiskMeter } from './RiskMeter';

const meta = {
  title: 'Données/RiskMeter',
  component: RiskMeter,
  args: { risk: 3 },
  argTypes: { risk: { control: 'radio', options: RISKS } },
} satisfies Meta<typeof RiskMeter>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Moyen: Story = {
  args: {
    risk: 5,
    className: "yo"
  }
};
export const Critique: Story = { args: { risk: 5 } };
export const Echelle: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {RISKS.map((r) => <RiskMeter key={r} risk={r} />)}
    </div>
  ),
};
