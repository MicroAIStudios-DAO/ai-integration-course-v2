import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AI Integration Course app', () => {
  render(<App />);
  // Test for the main heading text that should appear on our homepage
  const headingElement = screen.getByText(/Accelerate Your Future Skills Now/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders navigation elements', () => {
  render(<App />);
  // Test for specific unique navigation text
  const getStartedButton = screen.getByText(/Get Started/i);
  expect(getStartedButton).toBeInTheDocument();
});
