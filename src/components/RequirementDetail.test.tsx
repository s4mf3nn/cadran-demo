import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequirementDetail, dueLabel } from './RequirementDetail';
import { generateRequirements } from '../data/generate';
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
