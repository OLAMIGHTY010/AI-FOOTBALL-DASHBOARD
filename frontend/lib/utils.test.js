import { MARKET_LABELS, getMarketLabel } from './utils';

describe('utils', () => {
  describe('getMarketLabel', () => {
    it('returns Home Win for 1', () => {
      expect(getMarketLabel("1", "Arsenal", "Chelsea")).toBe("Arsenal to Win");
    });
    
    it('returns Draw for X', () => {
      expect(getMarketLabel("X", "Arsenal", "Chelsea")).toBe("Draw");
    });

    it('returns default label for Over 2.5', () => {
      expect(getMarketLabel("O2.5", "Arsenal", "Chelsea")).toBe("Over 2.5");
    });
  });
});
