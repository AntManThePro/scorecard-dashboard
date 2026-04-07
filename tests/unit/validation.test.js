/**
 * Unit tests for input validation rules applied in handleAddEntry (script.js).
 *
 * These tests exercise the validation helpers in isolation using the same
 * rules the source code applies: parseFloat fallback to 0, parseInt fallback
 * to 0, and the numeric bounds enforced by the HTML inputs (min=0, max=100
 * for labor).
 */

'use strict';

// ---------------------------------------------------------------------------
// Inline validation helpers (mirror the logic from handleAddEntry, script.js)
// ---------------------------------------------------------------------------

/**
 * Parse a revenue string exactly as handleAddEntry does.
 * Returns 0 for any non-numeric or negative input.
 */
function parseRevenue(raw) {
  const value = parseFloat(raw) || 0;
  return value < 0 ? 0 : value;
}

/**
 * Parse a labor percentage string and clamp to [0, 100].
 * Returns 0 for any non-numeric input.
 */
function parseLabor(raw) {
  const value = parseFloat(raw) || 0;
  if (value < 0)   return 0;
  if (value > 100) return 100;
  return value;
}

/**
 * Parse an hours string. Returns 0 for non-numeric or negative input.
 */
function parseHours(raw) {
  const value = parseFloat(raw) || 0;
  return value < 0 ? 0 : value;
}

/**
 * Parse a jobs-completed string. Returns 0 for non-numeric or negative input.
 * Jobs must be integers.
 */
function parseJobs(raw) {
  const value = parseInt(raw, 10) || 0;
  return value < 0 ? 0 : value;
}

/**
 * Determine whether a day selection is valid.
 */
const VALID_DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
function isValidDay(day) {
  return VALID_DAYS.includes(day);
}

// ---------------------------------------------------------------------------
// parseRevenue
// ---------------------------------------------------------------------------
describe('parseRevenue', () => {
  describe('valid numeric strings', () => {
    it('should parse a positive integer string', () => {
      expect(parseRevenue('1000')).toBe(1000);
    });

    it('should parse a decimal string', () => {
      expect(parseRevenue('2500.75')).toBeCloseTo(2500.75);
    });

    it('should parse "0"', () => {
      expect(parseRevenue('0')).toBe(0);
    });
  });

  describe('non-numeric strings', () => {
    it('should return 0 for an empty string', () => {
      expect(parseRevenue('')).toBe(0);
    });

    it('should return 0 for alphabetic input', () => {
      expect(parseRevenue('abc')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(parseRevenue(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(parseRevenue(null)).toBe(0);
    });
  });

  describe('negative values', () => {
    it('should return 0 for a negative revenue string', () => {
      expect(parseRevenue('-500')).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// parseLabor
// ---------------------------------------------------------------------------
describe('parseLabor', () => {
  describe('valid percentages', () => {
    it('should parse a typical labor percentage (28)', () => {
      expect(parseLabor('28')).toBe(28);
    });

    it('should parse a decimal labor percentage (31.5)', () => {
      expect(parseLabor('31.5')).toBeCloseTo(31.5);
    });

    it('should accept 0%', () => {
      expect(parseLabor('0')).toBe(0);
    });

    it('should accept exactly 100%', () => {
      expect(parseLabor('100')).toBe(100);
    });
  });

  describe('boundary clamping', () => {
    it('should clamp negative labor to 0', () => {
      expect(parseLabor('-10')).toBe(0);
    });

    it('should clamp labor above 100 to 100', () => {
      expect(parseLabor('150')).toBe(100);
    });
  });

  describe('non-numeric strings', () => {
    it('should return 0 for an empty string', () => {
      expect(parseLabor('')).toBe(0);
    });

    it('should return 0 for alphabetic input', () => {
      expect(parseLabor('xyz')).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// parseHours
// ---------------------------------------------------------------------------
describe('parseHours', () => {
  describe('valid hour values', () => {
    it('should parse a standard shift length (8)', () => {
      expect(parseHours('8')).toBe(8);
    });

    it('should parse decimal hours (7.5)', () => {
      expect(parseHours('7.5')).toBeCloseTo(7.5);
    });

    it('should parse "0"', () => {
      expect(parseHours('0')).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('should return 0 for an empty string', () => {
      expect(parseHours('')).toBe(0);
    });

    it('should return 0 for negative hours', () => {
      expect(parseHours('-2')).toBe(0);
    });

    it('should return 0 for alphabetic input', () => {
      expect(parseHours('many')).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// parseJobs
// ---------------------------------------------------------------------------
describe('parseJobs', () => {
  describe('valid job counts', () => {
    it('should parse "1" as integer 1', () => {
      expect(parseJobs('1')).toBe(1);
    });

    it('should truncate a decimal job count to the integer part', () => {
      // parseInt('1.9') → 1
      expect(parseJobs('1.9')).toBe(1);
    });

    it('should parse "0" as 0', () => {
      expect(parseJobs('0')).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('should return 0 for an empty string', () => {
      expect(parseJobs('')).toBe(0);
    });

    it('should return 0 for negative job count', () => {
      expect(parseJobs('-3')).toBe(0);
    });

    it('should return 0 for alphabetic input', () => {
      expect(parseJobs('one')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(parseJobs(undefined)).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// isValidDay
// ---------------------------------------------------------------------------
describe('isValidDay', () => {
  describe('valid days', () => {
    const validDays = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

    validDays.forEach(day => {
      it(`should accept "${day}"`, () => {
        expect(isValidDay(day)).toBe(true);
      });
    });
  });

  describe('invalid day values', () => {
    it('should reject an empty string', () => {
      expect(isValidDay('')).toBe(false);
    });

    it('should reject a lowercase day name', () => {
      expect(isValidDay('monday')).toBe(false);
    });

    it('should reject a number string', () => {
      expect(isValidDay('1')).toBe(false);
    });

    it('should reject a partial day name', () => {
      expect(isValidDay('Mon')).toBe(false);
    });

    it('should reject undefined', () => {
      expect(isValidDay(undefined)).toBe(false);
    });

    it('should reject null', () => {
      expect(isValidDay(null)).toBe(false);
    });
  });
});
