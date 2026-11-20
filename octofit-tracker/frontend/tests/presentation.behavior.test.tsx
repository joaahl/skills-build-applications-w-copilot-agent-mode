import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('API-backed pages', () => {
  it('loads suggestions for the selected email and ignores stale responses', async () => {
    let resolveInitial!: (response: Response) => void;
    const initialRequest = new Promise<Response>((resolve) => { resolveInitial = resolve; });
    const fetchMock = vi.fn()
      .mockReturnValueOnce(initialRequest)
      .mockResolvedValueOnce(new Response(JSON.stringify({
        suggestions: [{ title: 'Strength Circuit', reason: 'Supports your goal' }],
      }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const user = userEvent.setup();

    render(<MemoryRouter initialEntries={['/workouts']}><App /></MemoryRouter>);
    const email = screen.getByLabelText('User email');
    await user.clear(email);
    await user.type(email, 'hubot@example.com');
    await user.click(screen.getByRole('button', { name: 'Show suggestions' }));

    expect(await screen.findByText('Strength Circuit')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith('/api/workouts/suggestions/hubot%40example.com');
    await act(async () => {
      resolveInitial(new Response(JSON.stringify({
        suggestions: [{ title: 'Old suggestion', reason: 'Earlier result' }],
      }), { status: 200 }));
      await initialRequest;
    });
    expect(screen.queryByText('Old suggestion')).not.toBeInTheDocument();
    expect(screen.getByText('Strength Circuit')).toBeInTheDocument();
  });

  it('reports an invalid response instead of showing an empty state', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ activities: null }), { status: 200 })));

    render(<MemoryRouter initialEntries={['/activities']}><App /></MemoryRouter>);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/invalid response/i));
    expect(screen.queryByText(/no activities/i)).not.toBeInTheDocument();
  });
});
