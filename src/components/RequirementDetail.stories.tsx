import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, screen, userEvent } from 'storybook/test';
import { useEdits } from '../store/edits';
import { useFilters } from '../store/filters';
import { fakeAssistant, sample } from '../stories/fixtures';
import { RequirementDetail } from './RequirementDetail';

const meta = {
  title: 'Tableau de bord/RequirementDetail',
  component: RequirementDetail,
  args: { assistant: fakeAssistant, isMobile: false },
  parameters: { layout: 'fullscreen' },
  // La fiche lit l'exigence ouverte dans le store : on le prépare avant chaque story.
  beforeEach: () => {
    useEdits.setState({ edits: {}, version: 0 });
    useFilters.setState({ opened: sample });
  },
} satisfies Meta<typeof RequirementDetail>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Bureau: Story = {};
export const Mobile: Story = {
  args: { isMobile: true },
  globals: { viewport: { value: 'mobile' } },
};

export const Edition: Story = {
  play: async () => {
    await userEvent.click(await screen.findByRole('button', { name: /modifier/i }));
    await expect(await screen.findByRole('button', { name: /enregistrer/i })).toBeInTheDocument();
  },
};
