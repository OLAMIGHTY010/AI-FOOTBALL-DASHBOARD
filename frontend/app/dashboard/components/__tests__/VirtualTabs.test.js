import { render, screen } from '@testing-library/react';
import VirtualTabs from '../VirtualTabs';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(),
}));

import { usePathname } from 'next/navigation';

describe('VirtualTabs', () => {
  it('renders all 5 virtual tabs', () => {
    usePathname.mockReturnValue('/dashboard/simulate');
    render(<VirtualTabs />);
    
    expect(screen.getByText('🎮 Matches')).toBeInTheDocument();
    expect(screen.getByText('🏆 Standings')).toBeInTheDocument();
    expect(screen.getByText('📊 Sportsbook')).toBeInTheDocument();
    expect(screen.getByText('📜 Bet History')).toBeInTheDocument();
    expect(screen.getByText('👔 Tactics')).toBeInTheDocument();
  });

  it('highlights the active tab based on pathname', () => {
    usePathname.mockReturnValue('/dashboard/simulate');
    render(<VirtualTabs />);
    
    const simulateTab = screen.getByText('🎮 Matches').closest('a');
    expect(simulateTab).toHaveClass('bg-[var(--accent-primary)]', 'text-black');
    
    const standingsTab = screen.getByText('🏆 Standings').closest('a');
    expect(standingsTab).toHaveClass('bg-[var(--bg-card)]');
  });

  it('highlights standings tab when active', () => {
    usePathname.mockReturnValue('/dashboard/standings');
    render(<VirtualTabs />);
    
    const standingsTab = screen.getByText('🏆 Standings').closest('a');
    expect(standingsTab).toHaveClass('bg-[var(--accent-primary)]', 'text-black');
  });
});
