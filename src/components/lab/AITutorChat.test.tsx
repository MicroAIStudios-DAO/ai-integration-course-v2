import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { AITutorChat } from './AITutorChat';

Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
  value: vi.fn(),
  writable: true,
});

vi.mock('../../firebase', () => ({
  auth: {
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('token-123'),
    },
  },
}));

describe('AITutorChat', () => {
  it('shows fallback error message when tutor API returns non-OK status', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue('Authentication required for AI Tutor v2'),
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(
      <AITutorChat
        studentProfile={null}
        currentLabState="building"
        auditFeedback={null}
      />
    );

    await userEvent.type(screen.getByPlaceholderText('Ask about your agent architecture...'), 'help me');
    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(screen.getByText('I encountered an issue connecting. Please try again in a moment.')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    consoleErrorSpy.mockRestore();
  });
});
