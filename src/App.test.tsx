import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('./components/UserJotWidget', () => ({
  UserJotWidget: () => null
}));

vi.mock('./utils/analytics', () => ({
  initGA4: vi.fn(),
  trackPageView: vi.fn()
}));

vi.mock('./pages/HomePage', () => ({
  default: () => <main>Mock Home Page</main>
}));

test('renders app root route', () => {
  render(<App />);
  expect(screen.getByText(/Mock Home Page/i)).toBeInTheDocument();
});

test('renders router without crashing', () => {
  render(<App />);
  expect(screen.getByText(/Mock Home Page/i)).toBeInTheDocument();
});
