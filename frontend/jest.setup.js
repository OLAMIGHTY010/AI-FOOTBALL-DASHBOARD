import '@testing-library/jest-dom';

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/simulate',
  useSearchParams: () => ({ get: () => 'football' })
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:8000';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
