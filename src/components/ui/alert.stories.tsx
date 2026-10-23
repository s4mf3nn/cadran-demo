import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert, AlertDescription } from './alert';
import { Button } from './button';

const meta = {
  title: 'UI/Alert',
  component: Alert,
  args: { variant: 'destructive' },
  decorators: [(Story) => <div className="w-96"><Story /></div>],
} satisfies Meta<typeof Alert>;
export default meta;
type Story = StoryObj<typeof meta>;

/** Erreur de chargement des données (`App`). */
export const Erreur: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertDescription>Erreur : Failed to fetch</AlertDescription>
    </Alert>
  ),
};

/** Erreur de l'assistant, avec l'action « Réessayer » (`AssistantPanel`). */
export const ErreurAvecAction: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertDescription className="flex items-center justify-between gap-2">
        <span>Erreur : flux interrompu</span>
        <Button type="button" size="xs" variant="outline">Réessayer</Button>
      </AlertDescription>
    </Alert>
  ),
};
