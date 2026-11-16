/**
 * Unit tests for src/utils/trends.js
 *
 * Covers: movingAverage, momentum, volatility, trendLabel
 */

'use strict';

const {
  movingAverage,
  momentum,
  volatility,
  trendLabel,
} = require('../../src/utils/trends.js');

const {
  TREND_DATA_ASCENDING,
  TREND_DATA_DESCENDING,
  TREND_DATA_FLAT,
  TREND_DATA_SINGLE,
} = require('../helpers/test-data.js');

// ---------------------------------------------------------------------------
// movingAverage
// ---------------------------------------------------------------------------
describe('movingAverage', () => {
  describe('with valid ascending data', () => {
    it('should return the same number of values as input', () => {
      // Arrange / Act
      const result = movingAverage(TREND_DATA_ASCENDING);

      // Assert
      expect(result).toHaveLength(TREND_DATA_ASCENDING.length);
    });

    it('should compute correct 3-period moving average for index 2', () => {
      // Arrange – scores are [20, 22, 25, 28, 30], window=3
      // Index 2: (20+22+25)/3 = 22.333…
      const result = movingAverage(TREND_DATA_ASCENDING, 3);

      // Act / Assert
      expect(result[2]).toBeCloseTo(22.333, 2);
    });

    it('should use first-point value when window exceeds available history', () => {
      // Arrange – index 0 has only 1 point, so average equals that point's score
      const result = movingAverage(TREND_DATA_ASCENDING, 3);

      // Assert
      expect(result[0]).toBe(20);
    });

    it('should compute full-window average at the last index', () => {
      // Arrange – last three scores: 25, 28, 30 → average 27.666…
      const result = movingAverage(TREND_DATA_ASCENDING, 3);

      // Assert
      expect(result[4]).toBeCloseTo(27.667, 2);
    });
  });

  describe('with a single data point', () => {
    it('should return that single score as the only result', () => {
      // Arrange / Act
      const result = movingAverage(TREND_DATA_SINGLE);

      // Assert
      expect(result).toEqual([15]);
    });
  });

  describe('with flat data', () => {
    it('should return the same score for every window position', () => {
      // Arrange / Act
      const result = movingAverage(TREND_DATA_FLAT);

      // Assert
      result.forEach(val => expect(val).toBe(25));
    });
  });

  describe('with window size of 1', () => {
    it('should return the original scores unchanged', () => {
      // Arrange
      const data = TREND_DATA_ASCENDING;

      // Act
      const result = movingAverage(data, 1);

      // Assert
      expect(result).toEqual(data.map(d => d.score));
    });
  });

  describe('edge cases', () => {
    it('should return an empty array for null input', () => {
      expect(movingAverage(null)).toEqual([]);
    });

    it('should return an empty array for undefined input', () => {
      expect(movingAverage(undefined)).toEqual([]);
    });

    it('should return an empty array for a non-array input', () => {
      expect(movingAverage('bad data')).toEqual([]);
    });

    it('should return an empty array for an empty array', () => {
      expect(movingAverage([])).toEqual([]);
    });
  });
});

// ---------------------------------------------------------------------------
// momentum
// ---------------------------------------------------------------------------
describe('momentum', () => {
  describe('with ascending data', () => {
    it('should return a positive value', () => {
      // Arrange – last two scores: 28, 30 → momentum = 2
      const result = momentum(TREND_DATA_ASCENDING);

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('with descending data', () => {
    it('should return a negative value', () => {
      // Arrange – last two scores: 22, 20 → momentum = -2
      const result = momentum(TREND_DATA_DESCENDING);

      // Assert
      expect(result).toBe(-2);
    });
  });

  describe('with flat data', () => {
    it('should return zero', () => {
      const result = momentum(TREND_DATA_FLAT);

      expect(result).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for a single-element array', () => {
      expect(momentum(TREND_DATA_SINGLE)).toBe(0);
    });

    it('should return 0 for an empty array', () => {
      expect(momentum([])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(momentum(null)).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      expect(momentum(undefined)).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// volatility
// ---------------------------------------------------------------------------
describe('volatility', () => {
  describe('with flat data', () => {
    it('should return 0 when all scores are identical', () => {
      const result = volatility(TREND_DATA_FLAT);

      expect(result).toBe(0);
    });
  });

  describe('with varying data', () => {
    it('should return a positive value when scores differ', () => {
      const result = volatility(TREND_DATA_ASCENDING);

      expect(result).toBeGreaterThan(0);
    });

    it('should compute the correct population standard deviation', () => {
      // Scores: [20, 22, 25, 28, 30]
      // mean = 25, variance = [(25)+(9)+(0)+(9)+(25)]/5 = 68/5 = 13.6
      // stddev ≈ 3.688
      const result = volatility(TREND_DATA_ASCENDING);

      expect(result).toBeCloseTo(3.688, 2);
    });

    it('should return a higher value for more spread-out data', () => {
      const lowSpread  = [{ week: 'W1', score: 25 }, { week: 'W2', score: 26 }];
      const highSpread = [{ week: 'W1', score: 10 }, { week: 'W2', score: 40 }];

      expect(volatility(highSpread)).toBeGreaterThan(volatility(lowSpread));
    });
  });

  describe('with a single data point', () => {
    it('should return 0 (no variance with one point)', () => {
      expect(volatility(TREND_DATA_SINGLE)).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should return 0 for an empty array', () => {
      expect(volatility([])).toBe(0);
    });

    it('should return 0 for null input', () => {
      expect(volatility(null)).toBe(0);
    });

    it('should return 0 for undefined input', () => {
      expect(volatility(undefined)).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// trendLabel
// ---------------------------------------------------------------------------
describe('trendLabel', () => {
  describe('UP label', () => {
    it('should return "UP" when momentum is greater than 0.5', () => {
      expect(trendLabel(1)).toBe('UP');
    });

    it('should return "UP" for large positive momentum', () => {
      expect(trendLabel(100)).toBe('UP');
    });

    it('should return "UP" for momentum just above the threshold (0.51)', () => {
      expect(trendLabel(0.51)).toBe('UP');
    });
  });

  describe('DOWN label', () => {
    it('should return "DOWN" when momentum is less than -0.5', () => {
      expect(trendLabel(-1)).toBe('DOWN');
    });

    it('should return "DOWN" for large negative momentum', () => {
      expect(trendLabel(-100)).toBe('DOWN');
    });

    it('should return "DOWN" for momentum just below the threshold (-0.51)', () => {
      expect(trendLabel(-0.51)).toBe('DOWN');
    });
  });

  describe('FLAT label', () => {
    it('should return "FLAT" for exactly 0', () => {
      expect(trendLabel(0)).toBe('FLAT');
    });

    it('should return "FLAT" for momentum at the upper boundary (0.5)', () => {
      expect(trendLabel(0.5)).toBe('FLAT');
    });

    it('should return "FLAT" for momentum at the lower boundary (-0.5)', () => {
      expect(trendLabel(-0.5)).toBe('FLAT');
    });

    it('should return "FLAT" for small positive momentum (0.3)', () => {
      expect(trendLabel(0.3)).toBe('FLAT');
    });

    it('should return "FLAT" for small negative momentum (-0.3)', () => {
      expect(trendLabel(-0.3)).toBe('FLAT');
    });
  });
});
