/**
 * Unit tests for the production input parsing helpers exported from script.js.
 *
 * These tests call the real helper functions that handleAddEntry uses before
 * updating weeklyData.
 */

'use strict';

const { loadDashboardModule, teardownDashboardDOM } = require('../helpers/dashboard-module.js');

let dashboard;

beforeEach(() => {
  dashboard = loadDashboardModule();
});

afterEach(() => {
  jest.restoreAllMocks();
  teardownDashboardDOM();
});

// ---------------------------------------------------------------------------
// parseRevenue
// ---------------------------------------------------------------------------
describe('parseRevenue', () => {
  describe('valid numeric strings', () => {
    it('should parse a positive integer string', () => {
      expect(dashboard.parseRevenueInput('1000')).toBe(1000);
    });

    it('should parse a decimal string', () => {
      expect(dashboard.parseRevenueInput('2500.75')).toBeCloseTo(2500.75);
    });

    it('should parse "0"', () => {
      expect(dashboard.parseRevenueInput('0')).toBe(0);
    });
  });

  describe('non-numeric strings', () => {
    it('should return 0 for an empty string', () => {
      expect(dashboard.parseRevenueInput('')).toBe(0);
    });

    it('should return 0 for alphabetic input', () => {
      expect(dashboard.parseRevenueInput('abc')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(dashboard.parseRevenueInput(undefined)).toBe(0);
    });

    it('should return 0 for null', () => {
      expect(dashboard.parseRevenueInput(null)).toBe(0);
    });
  });

  describe('negative values', () => {
    it('should preserve a negative revenue string exactly as handleAddEntry does', () => {
      expect(dashboard.parseRevenueInput('-500')).toBe(-500);
    });
  });
});

// ---------------------------------------------------------------------------
// parseLabor
// ---------------------------------------------------------------------------
describe('parseLabor', () => {
  describe('valid percentages', () => {
    it('should parse a typical labor percentage (28)', () => {
      expect(dashboard.parseLaborInput('28')).toBe(28);
    });

    it('should parse a decimal labor percentage (31.5)', () => {
      expect(dashboard.parseLaborInput('31.5')).toBeCloseTo(31.5);
    });

    it('should accept 0%', () => {
      expect(dashboard.parseLaborInput('0')).toBe(0);
    });

    it('should accept exactly 100%', () => {
      expect(dashboard.parseLaborInput('100')).toBe(100);
    });
  });

  describe('unclamped values', () => {
    it('should preserve negative labor values exactly as handleAddEntry does', () => {
      expect(dashboard.parseLaborInput('-10')).toBe(-10);
    });

    it('should preserve labor above 100 exactly as handleAddEntry does', () => {
      expect(dashboard.parseLaborInput('150')).toBe(150);
    });
  });

  describe('non-numeric strings', () => {
    it('should return 0 for an empty string', () => {
      expect(dashboard.parseLaborInput('')).toBe(0);
    });

    it('should return 0 for alphabetic input', () => {
      expect(dashboard.parseLaborInput('xyz')).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// parseHours
// ---------------------------------------------------------------------------
describe('parseHours', () => {
  describe('valid hour values', () => {
    it('should parse a standard shift length (8)', () => {
      expect(dashboard.parseHoursInput('8')).toBe(8);
    });

    it('should parse decimal hours (7.5)', () => {
      expect(dashboard.parseHoursInput('7.5')).toBeCloseTo(7.5);
    });

    it('should parse "0"', () => {
      expect(dashboard.parseHoursInput('0')).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('should return 0 for an empty string', () => {
      expect(dashboard.parseHoursInput('')).toBe(0);
    });

    it('should preserve negative hours exactly as handleAddEntry does', () => {
      expect(dashboard.parseHoursInput('-2')).toBe(-2);
    });

    it('should return 0 for alphabetic input', () => {
      expect(dashboard.parseHoursInput('many')).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// parseJobs
// ---------------------------------------------------------------------------
describe('parseJobs', () => {
  describe('valid job counts', () => {
    it('should parse "1" as integer 1', () => {
      expect(dashboard.parseJobsInput('1')).toBe(1);
    });

    it('should truncate a decimal job count to the integer part', () => {
      // parseInt('1.9') → 1
      expect(dashboard.parseJobsInput('1.9')).toBe(1);
    });

    it('should parse "0" as 0', () => {
      expect(dashboard.parseJobsInput('0')).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('should return 0 for an empty string', () => {
      expect(dashboard.parseJobsInput('')).toBe(0);
    });

    it('should preserve negative job counts exactly as handleAddEntry does', () => {
      expect(dashboard.parseJobsInput('-3')).toBe(-3);
    });

    it('should return 0 for alphabetic input', () => {
      expect(dashboard.parseJobsInput('one')).toBe(0);
    });

    it('should return 0 for undefined', () => {
      expect(dashboard.parseJobsInput(undefined)).toBe(0);
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
      expect(dashboard.isValidDay(day)).toBe(true);
      });
    });
  });

  describe('invalid day values', () => {
    it('should reject an empty string', () => {
      expect(dashboard.isValidDay('')).toBe(false);
    });

    it('should reject a lowercase day name', () => {
      expect(dashboard.isValidDay('monday')).toBe(false);
    });

    it('should reject a number string', () => {
      expect(dashboard.isValidDay('1')).toBe(false);
    });

    it('should reject a partial day name', () => {
      expect(dashboard.isValidDay('Mon')).toBe(false);
    });

    it('should reject undefined', () => {
      expect(dashboard.isValidDay(undefined)).toBe(false);
    });

    it('should reject null', () => {
      expect(dashboard.isValidDay(null)).toBe(false);
    });
  });
});
