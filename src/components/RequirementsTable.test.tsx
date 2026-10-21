import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RequirementsTable } from './RequirementsTable';
import { generateRequirements } from '../data/generate';
import { useFilters } from '../store/filters';

beforeAll(() => {
  // jsdom ne calcule pas de layout : on donne une hauteur au conteneur pour que le virtualizer rende des lignes.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, get: () => 400 });
  Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 800 });
});

beforeEach(() => {
  useFilters.setState({ sort: { key: 'dueAt', dir: 'asc' }, selectedId: null, opened: null });
});

describe('RequirementsTable', () => {
  it("n'insère dans le DOM qu'une fenêtre de lignes, même sur 10 000 éléments", async () => {
    render(<RequirementsTable rows={generateRequirements(10_000)} />);
    // Le virtualizer mesure le conteneur dans un effet, les lignes arrivent au rendu suivant.
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeLessThan(60);
    expect(screen.getByRole('grid')).toHaveAttribute('aria-rowcount', '10001');
  });

  it('expose le tri via aria-sort et le bascule au clic', async () => {
    render(<RequirementsTable rows={generateRequirements(50)} />);
    const header = screen.getByRole('columnheader', { name: /risque/i });
    expect(header).toHaveAttribute('aria-sort', 'none');
    await userEvent.click(screen.getByRole('button', { name: /risque/i }));
    expect(header).toHaveAttribute('aria-sort', 'ascending');
    await userEvent.click(screen.getByRole('button', { name: /risque/i }));
    expect(header).toHaveAttribute('aria-sort', 'descending');
  });

  it('ouvre le détail de la ligne active avec Entrée', async () => {
    const rows = generateRequirements(50);
    render(<RequirementsTable rows={rows} />);
    screen.getByRole('grid').focus();
    await userEvent.keyboard('{ArrowDown}{ArrowDown}{Enter}');
    expect(useFilters.getState().opened).toEqual(rows[2]);
  });

  it('ouvre le détail au clic simple', async () => {
    const rows = generateRequirements(50);
    render(<RequirementsTable rows={rows} />);
    await waitFor(() => expect(screen.getAllByRole('row').length).toBeGreaterThan(1));
    const row = document.getElementById(`row-${rows[1]!.id}`)!;
    await userEvent.click(row);
    expect(useFilters.getState().opened).toEqual(rows[1]);
  });

  it('affiche un état vide explicite', () => {
    render(<RequirementsTable rows={[]} />);
    expect(screen.getByText(/aucune exigence/i)).toBeInTheDocument();
  });
});
