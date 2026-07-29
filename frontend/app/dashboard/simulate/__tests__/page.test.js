import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SimulatePage from '../page';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/simulate',
  useSearchParams: () => ({
    get: () => 'football'
  })
}));

// Mock standard fetch
global.fetch = jest.fn((url) => {
  if (url.includes('/api/simulate')) {
    return Promise.resolve({
      json: () => Promise.resolve({
        results: [
          {
            id: 'test-match',
            home: { name: 'Arsenal', power: 85 },
            away: { name: 'Chelsea', power: 84 },
            odds: { '1': 1.5, 'X': 3.2, '2': 4.5 },
            weather: 'Sunny',
            events: []
          }
        ],
        next_fixtures: []
      }),
    });
  }
  return Promise.resolve({ json: () => Promise.resolve({}) });
});

// Mock HTMLCanvasElement for the 2D Pitch
HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
  fillRect: jest.fn(),
  clearRect: jest.fn(),
  getImageData: jest.fn(() => ({ data: new Array(4) })),
  putImageData: jest.fn(),
  createImageData: jest.fn([]),
  setTransform: jest.fn(),
  drawImage: jest.fn(),
  save: jest.fn(),
  fillText: jest.fn(),
  restore: jest.fn(),
  beginPath: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  closePath: jest.fn(),
  stroke: jest.fn(),
  translate: jest.fn(),
  scale: jest.fn(),
  rotate: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  measureText: jest.fn(() => ({ width: 0 })),
  transform: jest.fn(),
  rect: jest.fn(),
  clip: jest.fn(),
}));

describe('SimulatePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders default state and runs simulation on click', async () => {
    const user = userEvent.setup();
    render(<SimulatePage />);
    
    // Virtual Tabs should be present
    expect(screen.getByText('🎮 Matches')).toBeInTheDocument();
    
    // Click run simulation
    const runBtn = screen.getByText('▶ Run Live Simulation');
    await user.click(runBtn);
    
    // Wait for fetch to complete and UI to update
    await waitFor(() => {
      expect(screen.getAllByText('Arsenal').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Chelsea').length).toBeGreaterThan(0);
    });
    
    // Bet slip should be visible
    expect(screen.getByText('🎫 Active Bets')).toBeInTheDocument();
  });
});
