import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent } from 'storybook/test';
import { Input } from './input';
import { Label } from './label';

const meta = {
  title: 'UI/Input',
  component: Input,
  args: { id: 'ref', placeholder: 'REG-000123' },
  decorators: [(Story, { args }) => (
    <div className="flex w-72 flex-col gap-1.5">
      <Label htmlFor={args.id}>Référence</Label>
      <Story />
    </div>
  )],
} satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Defaut: Story = {
  play: async ({ canvas }) => {
    const input = canvas.getByLabelText('Référence');
    await userEvent.type(input, 'REG-42');
    await expect(input).toHaveValue('REG-42');
  },
};
export const Desactive: Story = { args: { disabled: true } };
export const Invalide: Story = { args: { 'aria-invalid': true, defaultValue: '???' } };
