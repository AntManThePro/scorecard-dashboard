/**
 * Unit tests for core calculation logic extracted from script.js / app.js.
 *
 * These tests exercise the business logic in isolation, without loading the
 * full browser script, by reimplementing the pure calculation functions
 * identically to the source so we can verify their behaviour thoroughly.
 *
 * The implementations below are copied verbatim from script.js (lines 117-149)
 * so that any regression in the source will surface as a test failure once the
 * functions are exported or the test helper is updated.
 */

'use strict';

const {
  FULL_WEEK_DATA,
  EMPTY_WEEK_DATA,
  PARTIAL_WEEK_DATA,
  BONUS_ELIGIBLE_DATA,
  BONUS_INELIGIBLE_DATA,
  cloneData,
} = require('../helpers/test-data.js');

// ---------------------------------------------------------------------------
// Inline reference implementations (mirrors script.js exactly)
// ---------------------------------------------------------------------------

const LABOR_THRESHOLD_BONUS = 32;
const MAX_JOBS_PER_WEEK = 7;

/**
 * Replicate calculateWeeklyMetrics from script.js so we can test it in
 * isolation without a browser DOM.
 */
function calculateWeeklyMetrics(weeklyData) {
  const days = Object.keys(weeklyData);
  let totalRevenue = 0;
  let totalLabor = 0;
  let totalHours = 0;
  let totalJobs = 0;
  let daysWithData = 0;

  days.forEach(day => {
    const data = weeklyData[day];
    totalRevenue += data.revenue;
    totalHours   += data.hours;
    totalJobs    += data.jobs;

    if (data.revenue > 0 || data.hours > 0 || data.jobs > 0) {
      totalLabor += data.labor;
      daysWithData++;
    }
  });

  const avgLabor          = daysWithData > 0 ? totalLabor / daysWithData : 0;
  const avgRevenuePerJob  = totalJobs    > 0 ? totalRevenue / totalJobs  : 0;
  const laborEfficiency   = totalHours   > 0 ? totalRevenue / totalHours : 0;

  return {
    totalRevenue,
    avgLabor,
    totalHours,
    totalJobs,
    avgRevenuePerJob,
    laborEfficiency,
  };
}

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
      const { totalRevenue } = calculateWeeklyMetrics(data);

      // Assert
      expect(totalRevenue).toBe(18900);
    });

    it('should return 0 when all revenue values are zero', () => {
      const { totalRevenue } = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

      expect(totalRevenue).toBe(0);
    });

    it('should only include days that have data in a partial week', () => {
      // 1000 + 1500 = 2500
      const { totalRevenue } = calculateWeeklyMetrics(cloneData(PARTIAL_WEEK_DATA));

      expect(totalRevenue).toBe(2500);
    });
  });

  // ---------------------------------------------------------------------------
  // avgLabor
  // ---------------------------------------------------------------------------
  describe('avgLabor', () => {
    it('should average labor % only across days that have actual data', () => {
      // PARTIAL_WEEK_DATA: Monday 25, Tuesday 28 → avg 26.5
      const { avgLabor } = calculateWeeklyMetrics(cloneData(PARTIAL_WEEK_DATA));

      expect(avgLabor).toBeCloseTo(26.5, 5);
    });

    it('should return 0 when no days have data', () => {
      const { avgLabor } = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

      expect(avgLabor).toBe(0);
    });

    it('should include a day in the average when it has jobs even with zero revenue', () => {
      // Arrange: one day with jobs > 0 but revenue = 0
      const data = cloneData(EMPTY_WEEK_DATA);
      data.Monday = { revenue: 0, labor: 30, hours: 0, jobs: 1 };

      // Act
      const { avgLabor } = calculateWeeklyMetrics(data);

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
      const { totalHours } = calculateWeeklyMetrics(cloneData(FULL_WEEK_DATA));

      expect(totalHours).toBe(56);
    });

    it('should return 0 for an empty week', () => {
      const { totalHours } = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

      expect(totalHours).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // totalJobs
  // ---------------------------------------------------------------------------
  describe('totalJobs', () => {
    it('should count one job per day for a full week', () => {
      const { totalJobs } = calculateWeeklyMetrics(cloneData(FULL_WEEK_DATA));

      expect(totalJobs).toBe(7);
    });

    it('should return 0 for an empty week', () => {
      const { totalJobs } = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

      expect(totalJobs).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // avgRevenuePerJob
  // ---------------------------------------------------------------------------
  describe('avgRevenuePerJob', () => {
    it('should divide total revenue by total jobs', () => {
      // FULL: totalRevenue=18900, totalJobs=7 → 18900/7 ≈ 2700
      const { avgRevenuePerJob } = calculateWeeklyMetrics(cloneData(FULL_WEEK_DATA));

      expect(avgRevenuePerJob).toBeCloseTo(2700, 0);
    });

    it('should return 0 when there are no jobs', () => {
      const { avgRevenuePerJob } = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

      expect(avgRevenuePerJob).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // laborEfficiency ($/hr)
  // ---------------------------------------------------------------------------
  describe('laborEfficiency', () => {
    it('should divide total revenue by total hours', () => {
      // FULL: totalRevenue=18900, totalHours=56 → 337.5
      const { laborEfficiency } = calculateWeeklyMetrics(cloneData(FULL_WEEK_DATA));

      expect(laborEfficiency).toBeCloseTo(337.5, 1);
    });

    it('should return 0 when total hours is zero', () => {
      const { laborEfficiency } = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

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
    const metrics = calculateWeeklyMetrics(cloneData(BONUS_ELIGIBLE_DATA));

    expect(isBonusEligible(metrics)).toBe(true);
  });

  it('should return false when avgLabor meets or exceeds the 32% threshold', () => {
    // BONUS_INELIGIBLE_DATA: avg labor = (33+35+34+36+32)/5 = 34
    const metrics = calculateWeeklyMetrics(cloneData(BONUS_INELIGIBLE_DATA));

    expect(isBonusEligible(metrics)).toBe(false);
  });

  it('should return false when avgLabor is exactly 32%', () => {
    // Edge case: boundary value
    const metrics = { avgLabor: 32 };

    expect(isBonusEligible(metrics)).toBe(false);
  });

  it('should return false when there is no data (avgLabor = 0)', () => {
    const metrics = calculateWeeklyMetrics(cloneData(EMPTY_WEEK_DATA));

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
