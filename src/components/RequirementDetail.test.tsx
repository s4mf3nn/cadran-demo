import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequirementDetail, dueLabel } from './RequirementDetail';
import { generateRequirements } from '../data/generate';
import { useEdits } from '../store/edits';
import { useFilters } from '../store/filters';
import type { AssistantApi } from '../hooks/useAssistant';

// jsdom n'a pas matchMedia, que focusIn utilise pour ouvrir le panneau de l'assistant.
vi.mock('../lib/focus', () => ({ focusIn: vi.fn() }));

const assistant = (send = vi.fn()) => ({ status: 'idle', ready: true, send }) as unknown as AssistantApi;

beforeEach(() => useFilters.setState({ opened: null }));

describe('RequirementDetail', () => {
  it("n'affiche rien tant qu'aucune exigence n'est ouverte", () => {
    render(<RequirementDetail assistant={assistant()} isMobile={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('affiche la fiche et envoie une question pré-remplie à l\'assistant', async () => {
    const send = vi.fn();
    const r = generateRequirements(1)[0]!;
    useFilters.setState({ opened: r });
    render(<RequirementDetail assistant={assistant(send)} isMobile={false} />);
    expect(screen.getByRole('dialog', { name: r.title })).toBeInTheDocument();
    expect(screen.getByText(r.ref)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /demander à l'assistant/i }));
    expect(send).toHaveBeenCalledWith(expect.stringContaining(r.ref));
    expect(useFilters.getState().opened).toBeNull();
  });

  it("formate l'échéance", () => {
    const now = Date.UTC(2026, 0, 10);
    expect(dueLabel(now, now)).toBe("aujourd'hui");
    expect(dueLabel(now + 86_400_000 * 12, now)).toBe('dans 12 jours');
    expect(dueLabel(now - 86_400_000, now)).toBe('dépassée de 1 jour');
  });
});

describe('RequirementDetail : modification', () => {
  beforeEach(() => {
    localStorage.clear();
    useEdits.setState({ edits: {}, version: 0 });
  });

  it('enregistre les changements, met à jour la fiche et les conserve en local', async () => {
    const r = generateRequirements(1)[0]!;
    useFilters.setState({ opened: r });
    render(<RequirementDetail assistant={assistant()} isMobile={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    const title = screen.getByLabelText('Intitulé');
    await userEvent.clear(title);
    await userEvent.type(title, 'Nouvel intitulé');
    await userEvent.selectOptions(screen.getByLabelText('Statut'), 'non_conforme');
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    expect(useEdits.getState().edits[r.id]).toEqual({ title: 'Nouvel intitulé', ...(r.status === 'non_conforme' ? {} : { status: 'non_conforme' }) });
    expect(useFilters.getState().opened).toMatchObject({ title: 'Nouvel intitulé', status: 'non_conforme' });
    expect(screen.getByRole('dialog', { name: 'Nouvel intitulé' })).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem('cadran:edits')!)[r.id].title).toBe('Nouvel intitulé');
  });

  it("refuse un intitulé vide et permet d'annuler", async () => {
    const r = generateRequirements(1)[0]!;
    useFilters.setState({ opened: r });
    render(<RequirementDetail assistant={assistant()} isMobile={false} />);
    await userEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    await userEvent.clear(screen.getByLabelText('Intitulé'));
    expect(screen.getByRole('alert')).toHaveTextContent("L'intitulé est obligatoire");
    await userEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));
    expect(useEdits.getState().edits).toEqual({});
    await userEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByLabelText('Intitulé')).toBeNull();
  });

  it("rétablit l'original", async () => {
    const r = generateRequirements(1)[0]!;
    useEdits.setState({ edits: { [r.id]: { risk: 5 } } });
    useFilters.setState({ opened: r });
    render(<RequirementDetail assistant={assistant()} isMobile={false} />);
    await userEvent.click(screen.getByRole('button', { name: "Rétablir l'original" }));
    expect(useEdits.getState().edits).toEqual({});
  });
});
