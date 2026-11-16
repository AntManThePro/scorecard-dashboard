/**
 * Unit tests for src/utils/trends.js
 *
 * These tests cover every exported utility:
 *  - movingAverage
 *  - momentum
 *  - volatility
 *  - trendLabel
 */

import { movingAverage, momentum, volatility, trendLabel } from '../../src/utils/trends.js';
import {
  TREND_DATA_RISING,
  TREND_DATA_FALLING,
  TREND_DATA_FLAT,
  TREND_DATA_SINGLE,
  TREND_DATA_EMPTY,
} from '../helpers/test-data.js';

// ---------------------------------------------------------------------------
// movingAverage
// ---------------------------------------------------------------------------
describe('movingAverage', () => {
  describe('with default window (3)', () => {
    it('should return one value per input data point', () => {
      const result = movingAverage(TREND_DATA_RISING);
      expect(result).toHaveLength(TREND_DATA_RISING.length);
    });

    it('should compute correct moving average for a rising series', () => {
      // scores: 20, 22, 25, 28
      // MA[0]: 20/1 = 20
      // MA[1]: (20+22)/2 = 21
      // MA[2]: (20+22+25)/3 = 22.333…
      // MA[3]: (22+25+28)/3 = 25
      const result = movingAverage(TREND_DATA_RISING);
      expect(result[0]).toBeCloseTo(20);
      expect(result[1]).toBeCloseTo(21);
      expect(result[2]).toBeCloseTo(22.333, 2);
      expect(result[3]).toBeCloseTo(25);
    });

    it('should return the same value for each point in a flat series', () => {
      const result = movingAverage(TREND_DATA_FLAT);
      result.forEach(v => expect(v).toBeCloseTo(25));
    });

    it('should work with a single-element array', () => {
      const result = movingAverage(TREND_DATA_SINGLE);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(15);
    });
  });

  describe('with custom window size', () => {
    it('should compute a window-1 moving average (equals each score)', () => {
      const scores = TREND_DATA_RISING.map(d => d.score);
      const result = movingAverage(TREND_DATA_RISING, 1);
      result.forEach((v, i) => expect(v).toBeCloseTo(scores[i]));
    });

    it('should compute a window-2 moving average correctly', () => {
      // window=2; scores: 20, 22, 25, 28
      // MA[0]: 20/1 = 20
      // MA[1]: (20+22)/2 = 21
      // MA[2]: (22+25)/2 = 23.5
      // MA[3]: (25+28)/2 = 26.5
      const result = movingAverage(TREND_DATA_RISING, 2);
      expect(result[0]).toBeCloseTo(20);
      expect(result[1]).toBeCloseTo(21);
      expect(result[2]).toBeCloseTo(23.5);
      expect(result[3]).toBeCloseTo(26.5);
    });
  });

  describe('edge cases', () => {
    it('should return empty array for empty input', () => {
      expect(movingAverage(TREND_DATA_EMPTY)).toEqual([]);
    });

    it('should return empty array for null input', () => {
      expect(movingAverage(null)).toEqual([]);
    });

    it('should return empty array for undefined input', () => {
      expect(movingAverage(undefined)).toEqual([]);
    });

    it('should return empty array for non-array input', () => {
      expect(movingAverage('not an array')).toEqual([]);
      expect(movingAverage(42)).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// momentum
// ---------------------------------------------------------------------------
describe('momentum', () => {
  it('should return positive momentum for a rising series', () => {
    // last - second-to-last = 28 - 25 = 3
    expect(momentum(TREND_DATA_RISING)).toBe(3);
  });

  it('should return negative momentum for a falling series', () => {
    // 20 - 24 = -4
    expect(momentum(TREND_DATA_FALLING)).toBe(-4);
  });

  it('should return zero momentum for a flat series', () => {
    expect(momentum(TREND_DATA_FLAT)).toBe(0);
  });

  it('should return 0 for a single-element array (no pair to compare)', () => {
    expect(momentum(TREND_DATA_SINGLE)).toBe(0);
  });

  it('should return 0 for an empty array', () => {
    expect(momentum(TREND_DATA_EMPTY)).toBe(0);
  });

  it('should return 0 for null input', () => {
    expect(momentum(null)).toBe(0);
  });

  it('should return 0 for undefined input', () => {
    expect(momentum(undefined)).toBe(0);
  });

  it('should handle a two-element array correctly', () => {
    const data = [
      { week: '2025-W01', score: 10 },
      { week: '2025-W02', score: 18 },
    ];
    expect(momentum(data)).toBe(8);
  });
});

// ---------------------------------------------------------------------------
// volatility
// ---------------------------------------------------------------------------
describe('volatility', () => {
  it('should return 0 for a flat series (no variation)', () => {
    expect(volatility(TREND_DATA_FLAT)).toBe(0);
  });

  it('should return a positive value for a varying series', () => {
    expect(volatility(TREND_DATA_RISING)).toBeGreaterThan(0);
  });

  it('should return a higher value for a more volatile series', () => {
    const lowVol  = [{ score: 10 }, { score: 11 }, { score: 10 }, { score: 11 }];
    const highVol = [{ score: 0  }, { score: 50 }, { score: 0  }, { score: 50 }];
    expect(volatility(highVol)).toBeGreaterThan(volatility(lowVol));
  });

  it('should compute population std-dev correctly for a known dataset', () => {
    // scores: [2, 4, 4, 4, 5, 5, 7, 9]  mean=5, variance=4, std=2
    const data = [2, 4, 4, 4, 5, 5, 7, 9].map(s => ({ score: s }));
    expect(volatility(data)).toBeCloseTo(2);
  });

  it('should return 0 for an empty array', () => {
    expect(volatility(TREND_DATA_EMPTY)).toBe(0);
  });

  it('should return 0 for null input', () => {
    expect(volatility(null)).toBe(0);
  });

  it('should return 0 for undefined input', () => {
    expect(volatility(undefined)).toBe(0);
  });

  it('should return 0 for a single-element array', () => {
    expect(volatility(TREND_DATA_SINGLE)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// trendLabel
// ---------------------------------------------------------------------------
describe('trendLabel', () => {
  it('should return "UP" when momentum > 0.5', () => {
    expect(trendLabel(1)).toBe('UP');
    expect(trendLabel(0.6)).toBe('UP');
    expect(trendLabel(100)).toBe('UP');
  });

  it('should return "DOWN" when momentum < -0.5', () => {
    expect(trendLabel(-1)).toBe('DOWN');
    expect(trendLabel(-0.6)).toBe('DOWN');
    expect(trendLabel(-100)).toBe('DOWN');
  });

  it('should return "FLAT" when momentum is between -0.5 and 0.5 (inclusive boundaries)', () => {
    expect(trendLabel(0)).toBe('FLAT');
    expect(trendLabel(0.5)).toBe('FLAT');
    expect(trendLabel(-0.5)).toBe('FLAT');
    expect(trendLabel(0.1)).toBe('FLAT');
    expect(trendLabel(-0.1)).toBe('FLAT');
  });

  it('should handle boundary values at exactly ±0.5', () => {
    // Boundary: 0.5 is FLAT (not > 0.5), -0.5 is FLAT (not < -0.5)
    expect(trendLabel(0.5)).toBe('FLAT');
    expect(trendLabel(-0.5)).toBe('FLAT');
  });

  it('should work correctly with momentum() output from real data', () => {
    expect(trendLabel(momentum(TREND_DATA_RISING))).toBe('UP');   // 3
    expect(trendLabel(momentum(TREND_DATA_FALLING))).toBe('DOWN'); // -4
    expect(trendLabel(momentum(TREND_DATA_FLAT))).toBe('FLAT');    // 0
  });
});
