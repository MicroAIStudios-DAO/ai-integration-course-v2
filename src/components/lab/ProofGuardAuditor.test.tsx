import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProofGuardAuditor } from './ProofGuardAuditor';

vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      getIdToken: vi.fn().mockResolvedValue('token-123'),
    },
  }),
}));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ProofGuardAuditor', () => {
  it('runs attestation on mount and renders the returned score', async () => {
    const onAuditComplete = vi.fn();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: vi.fn().mockReturnValue('application/json'),
      },
      json: vi.fn().mockResolvedValue({
        cqsScore: 92,
        attestationId: 'att-123',
        timestamp: '2026-06-09T00:00:00.000Z',
        complianceTarget: 'IMDA/AICM',
        vulnerabilities: [],
      }),
    });

    vi.stubGlobal('fetch', fetchMock as unknown as typeof fetch);

    render(
      <ProofGuardAuditor
        agentDefinition={{ name: 'demo-agent' }}
        onAuditComplete={onAuditComplete}
      />
    );

    expect(screen.getByText('Running attestation...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('92/100')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(onAuditComplete).toHaveBeenCalledTimes(1);
  });
});
