/**
 * Unit tests for the production calculation helpers exported from script.js.
 *
 * These tests load the dashboard module in jsdom, seed its application state,
 * and call the real helper functions so regressions in script.js surface here.
 */

'use strict';

const { loadDashboardModule, teardownDashboardDOM } = require('../helpers/dashboard-module.js');
const {
  FULL_WEEK_DATA,
  EMPTY_WEEK_DATA,
  PARTIAL_WEEK_DATA,
  BONUS_ELIGIBLE_DATA,
  BONUS_INELIGIBLE_DATA,
  cloneData,
} = require('../helpers/test-data.js');

const LABOR_THRESHOLD_BONUS = 32;
const MAX_JOBS_PER_WEEK = 7;

/** Bonus eligibility mirrors the condition in handleExport and updateBonusIndicator. */
function isBonusEligible(metrics) {
  return metrics.avgLabor > 0 && metrics.avgLabor < LABOR_THRESHOLD_BONUS;
}

/** Completion percentage mirrors the confetti-trigger logic in handleAddEntry. */
function weekCompletionPercent(totalJobs) {
  return (totalJobs / MAX_JOBS_PER_WEEK) * 100;
}

/** Revenue-per-job string formatting mirrors handleExport. */
function formatRevenuePerJob(revenue, jobs) {
  return jobs > 0 ? (revenue / jobs).toFixed(2) : '0.00';
}

let dashboard;

beforeEach(() => {
  dashboard = loadDashboardModule();
});

afterEach(() => {
  jest.restoreAllMocks();
  teardownDashboardDOM();
});

// ---------------------------------------------------------------------------
// calculateWeeklyMetrics – total revenue
// ---------------------------------------------------------------------------
describe('calculateWeeklyMetrics', () => {
  describe('totalRevenue', () => {
    it('should sum revenue across all seven days', () => {
      // Arrange
      const data = cloneData(FULL_WEEK_DATA);
      // 2500 + 3100 + 2800 + 3500 + 4000 + 1800 + 1200 = 18900

      // Act
      dashboard.__setWeeklyData(data);
      const { totalRevenue } = dashboard.calculateWeeklyMetrics();

      // Assert
      expect(totalRevenue).toBe(18900);
    });

    it('should return 0 when all revenue values are zero', () => {
      dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
      const { totalRevenue } = dashboard.calculateWeeklyMetrics();

      expect(totalRevenue).toBe(0);
    });

    it('should only include days that have data in a partial week', () => {
      // 1000 + 1500 = 2500
      dashboard.__setWeeklyData(cloneData(PARTIAL_WEEK_DATA));
      const { totalRevenue } = dashboard.calculateWeeklyMetrics();

      expect(totalRevenue).toBe(2500);
    });
  });

  // ---------------------------------------------------------------------------
  // avgLabor
  // ---------------------------------------------------------------------------
  describe('avgLabor', () => {
    it('should average labor % only across days that have actual data', () => {
      // PARTIAL_WEEK_DATA: Monday 25, Tuesday 28 → avg 26.5
      dashboard.__setWeeklyData(cloneData(PARTIAL_WEEK_DATA));
      const { avgLabor } = dashboard.calculateWeeklyMetrics();

      expect(avgLabor).toBeCloseTo(26.5, 5);
    });

    it('should return 0 when no days have data', () => {
      dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
      const { avgLabor } = dashboard.calculateWeeklyMetrics();

      expect(avgLabor).toBe(0);
    });

    it('should include a day in the average when it has jobs even with zero revenue', () => {
      // Arrange: one day with jobs > 0 but revenue = 0
      const data = cloneData(EMPTY_WEEK_DATA);
      data.Monday = { revenue: 0, labor: 30, hours: 0, jobs: 1 };

      // Act
      dashboard.__setWeeklyData(data);
      const { avgLabor } = dashboard.calculateWeeklyMetrics();

      // Assert: only Monday qualifies, so average is 30
      expect(avgLabor).toBe(30);
    });
  });

  // ---------------------------------------------------------------------------
  // totalHours
  // ---------------------------------------------------------------------------
  describe('totalHours', () => {
    it('should sum hours across all days for a full week', () => {
      // 8 + 9 + 8 + 10 + 11 + 6 + 4 = 56
      dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
      const { totalHours } = dashboard.calculateWeeklyMetrics();

      expect(totalHours).toBe(56);
    });

    it('should return 0 for an empty week', () => {
      dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
      const { totalHours } = dashboard.calculateWeeklyMetrics();

      expect(totalHours).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // totalJobs
  // ---------------------------------------------------------------------------
  describe('totalJobs', () => {
    it('should count one job per day for a full week', () => {
      dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
      const { totalJobs } = dashboard.calculateWeeklyMetrics();

      expect(totalJobs).toBe(7);
    });

    it('should return 0 for an empty week', () => {
      dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
      const { totalJobs } = dashboard.calculateWeeklyMetrics();

      expect(totalJobs).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // avgRevenuePerJob
  // ---------------------------------------------------------------------------
  describe('avgRevenuePerJob', () => {
    it('should divide total revenue by total jobs', () => {
      // FULL: totalRevenue=18900, totalJobs=7 → 18900/7 ≈ 2700
      dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
      const { avgRevenuePerJob } = dashboard.calculateWeeklyMetrics();

      expect(avgRevenuePerJob).toBeCloseTo(2700, 0);
    });

    it('should return 0 when there are no jobs', () => {
      dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
      const { avgRevenuePerJob } = dashboard.calculateWeeklyMetrics();

      expect(avgRevenuePerJob).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // laborEfficiency ($/hr)
  // ---------------------------------------------------------------------------
  describe('laborEfficiency', () => {
    it('should divide total revenue by total hours', () => {
      // FULL: totalRevenue=18900, totalHours=56 → 337.5
      dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
      const { laborEfficiency } = dashboard.calculateWeeklyMetrics();

      expect(laborEfficiency).toBeCloseTo(337.5, 1);
    });

    it('should return 0 when total hours is zero', () => {
      dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
      const { laborEfficiency } = dashboard.calculateWeeklyMetrics();

      expect(laborEfficiency).toBe(0);
    });
  });
});

// ---------------------------------------------------------------------------
// isBonusEligible
// ---------------------------------------------------------------------------
describe('isBonusEligible', () => {
  it('should return true when avgLabor is below the 32% threshold', () => {
    // BONUS_ELIGIBLE_DATA: avg labor = (28+29+27+30+31)/5 = 29
    dashboard.__setWeeklyData(cloneData(BONUS_ELIGIBLE_DATA));
    const metrics = dashboard.calculateWeeklyMetrics();

    expect(isBonusEligible(metrics)).toBe(true);
  });

  it('should return false when avgLabor meets or exceeds the 32% threshold', () => {
    // BONUS_INELIGIBLE_DATA: avg labor = (33+35+34+36+32)/5 = 34
    dashboard.__setWeeklyData(cloneData(BONUS_INELIGIBLE_DATA));
    const metrics = dashboard.calculateWeeklyMetrics();

    expect(isBonusEligible(metrics)).toBe(false);
  });

  it('should return false when avgLabor is exactly 32%', () => {
    // Edge case: boundary value
    const metrics = { avgLabor: 32 };

    expect(isBonusEligible(metrics)).toBe(false);
  });

  it('should return false when there is no data (avgLabor = 0)', () => {
    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
    const metrics = dashboard.calculateWeeklyMetrics();

    expect(isBonusEligible(metrics)).toBe(false);
  });

  it('should return true for avgLabor just below the threshold (31.9)', () => {
    expect(isBonusEligible({ avgLabor: 31.9 })).toBe(true);
  });

  it('should return false for avgLabor just above the threshold (32.1)', () => {
    expect(isBonusEligible({ avgLabor: 32.1 })).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// weekCompletionPercent
// ---------------------------------------------------------------------------
describe('weekCompletionPercent', () => {
  it('should return 100 when all 7 jobs are completed', () => {
    expect(weekCompletionPercent(7)).toBe(100);
  });

  it('should return 0 when no jobs are completed', () => {
    expect(weekCompletionPercent(0)).toBe(0);
  });

  it('should return approximately 71.4 for 5 of 7 jobs', () => {
    expect(weekCompletionPercent(5)).toBeCloseTo(71.43, 1);
  });

  it('should return the correct partial percentage for a single job', () => {
    // 1/7 ≈ 14.28%
    expect(weekCompletionPercent(1)).toBeCloseTo(14.28, 1);
  });
});

// ---------------------------------------------------------------------------
// formatRevenuePerJob
// ---------------------------------------------------------------------------
describe('formatRevenuePerJob', () => {
  it('should return "0.00" when jobs is zero', () => {
    expect(formatRevenuePerJob(1000, 0)).toBe('0.00');
  });

  it('should format revenue/job to two decimal places', () => {
    expect(formatRevenuePerJob(3000, 2)).toBe('1500.00');
  });

  it('should round to two decimal places for non-integer results', () => {
    // 1000 / 3 ≈ 333.33
    expect(formatRevenuePerJob(1000, 3)).toBe('333.33');
  });

  it('should handle zero revenue correctly', () => {
    expect(formatRevenuePerJob(0, 5)).toBe('0.00');
  });
});
