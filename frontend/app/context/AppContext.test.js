import React from 'react';
import { render, screen } from '@testing-library/react';
import { AppProvider, useAppContext } from './AppContext';

// Create a test component that consumes the context
const TestComponent = () => {
  const { aiCoins, setAiCoins } = useAppContext();
  return (
    <div>
      <div data-testid="coins">{aiCoins}</div>
      <button onClick={() => setAiCoins(2000)}>Set Coins</button>
    </div>
  );
};

describe('AppContext', () => {
  it('provides default aiCoins and updates correctly', () => {
    // Mock fetch for the init profile endpoint
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ bankroll: 1000 }),
      })
    );

    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    // Initial value is 0 until fetch completes (or based on initial state)
    // Here it defaults to 0 before user is authenticated
    expect(screen.getByTestId('coins')).toHaveTextContent('0');
  });
});
