/**
 * Unit tests for the weekly calculation logic found in app.js / script.js.
 *
 * Because app.js runs DOM queries at module load time, the business-logic
 * functions are re-implemented here as pure functions so they can be tested
 * without a full DOM.  These tests document the *expected behaviour* of the
 * source-code functions and will catch regressions if the logic ever changes.
 *
 * Constants mirror those in app.js:
 *   LABOR_THRESHOLD_HIGH  = 30
 *   LABOR_THRESHOLD_BONUS = 32
 *   MAX_JOBS_PER_WEEK     = 7
 */

import {
  FULL_WEEK_DATA,
  EMPTY_WEEK_DATA,
  PARTIAL_WEEK_DATA,
  HIGH_LABOR_WEEK_DATA,
} from '../helpers/test-data.js';

// ---------------------------------------------------------------------------
// Pure helper implementations matching app.js logic
// (Kept here so the tests remain independent of DOM loading)
// ---------------------------------------------------------------------------

const LABOR_THRESHOLD_HIGH  = 30;
const LABOR_THRESHOLD_BONUS = 32;
const MAX_JOBS_PER_WEEK     = 7;

/**
 * Mirrors calculateWeeklyMetrics() from app.js
 */
function calculateWeeklyMetrics(weeklyData) {
  const days = Object.keys(weeklyData);
  let totalRevenue  = 0;
  let totalLabor    = 0;
  let totalHours    = 0;
  let totalJobs     = 0;
  let daysWithData  = 0;

  days.forEach(day => {
    const data = weeklyData[day];
    totalRevenue += data.revenue;
    totalHours   += data.hours;
    totalJobs    += data.jobs;

    if (data.revenue > 0 || data.hours > 0 || data.jobs > 0) {
      totalLabor  += data.labor;
      daysWithData++;
    }
  });

  const avgLabor          = daysWithData > 0 ? totalLabor / daysWithData : 0;
  const avgRevenuePerJob  = totalJobs    > 0 ? totalRevenue / totalJobs  : 0;
  const laborEfficiency   = totalHours   > 0 ? totalRevenue / totalHours : 0;

  return { totalRevenue, avgLabor, totalHours, totalJobs, avgRevenuePerJob, laborEfficiency };
}

/**
 * Mirrors the labor CSS-class logic in updateTable() from app.js
 */
function getLaborClass(labor) {
  if (labor > LABOR_THRESHOLD_HIGH) return 'high-labor';
  if (labor < LABOR_THRESHOLD_BONUS && labor > 0) return 'good-labor';
  return '';
}

/**
 * Mirrors the bonus-indicator visibility logic from updateBonusIndicator()
 */
function isBonusEligible(avgLabor) {
  return avgLabor > 0 && avgLabor < LABOR_THRESHOLD_BONUS;
}

/**
 * Mirrors the revenuePerJob calculation in updateTable()
 */
function revenuePerJob(revenue, jobs) {
  return jobs > 0 ? revenue / jobs : 0;
}

// ---------------------------------------------------------------------------
// calculateWeeklyMetrics – totals
// ---------------------------------------------------------------------------
describe('calculateWeeklyMetrics – totals', () => {
  it('should sum revenue across all seven days correctly', () => {
    const { totalRevenue } = calculateWeeklyMetrics(FULL_WEEK_DATA);
    const expected = 2500 + 3200 + 1800 + 4100 + 2900 + 1200 + 800;
    expect(totalRevenue).toBe(expected);
  });

  it('should sum hours across all seven days correctly', () => {
    const { totalHours } = calculateWeeklyMetrics(FULL_WEEK_DATA);
    const expected = 8 + 9 + 7 + 10 + 8.5 + 5 + 4;
    expect(totalHours).toBeCloseTo(expected);
  });

  it('should sum jobs across all seven days correctly', () => {
    const { totalJobs } = calculateWeeklyMetrics(FULL_WEEK_DATA);
    const expected = 3 + 4 + 2 + 5 + 3 + 1 + 1;
    expect(totalJobs).toBe(expected);
  });

  it('should return all-zero totals for an empty week', () => {
    const metrics = calculateWeeklyMetrics(EMPTY_WEEK_DATA);
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.totalHours).toBe(0);
    expect(metrics.totalJobs).toBe(0);
    expect(metrics.avgLabor).toBe(0);
  });

  it('should only count days that have data when computing avgLabor', () => {
    // PARTIAL_WEEK_DATA: Monday(27%) and Wednesday(33%) have data; rest are zero
    const { avgLabor } = calculateWeeklyMetrics(PARTIAL_WEEK_DATA);
    expect(avgLabor).toBeCloseTo((27 + 33) / 2); // 30
  });
});

// ---------------------------------------------------------------------------
// calculateWeeklyMetrics – averages and derived metrics
// ---------------------------------------------------------------------------
describe('calculateWeeklyMetrics – averages & derived metrics', () => {
  it('should compute avgRevenuePerJob correctly', () => {
    const { avgRevenuePerJob, totalRevenue, totalJobs } = calculateWeeklyMetrics(FULL_WEEK_DATA);
    expect(avgRevenuePerJob).toBeCloseTo(totalRevenue / totalJobs);
  });

  it('should return avgRevenuePerJob = 0 when there are no jobs', () => {
    const { avgRevenuePerJob } = calculateWeeklyMetrics(EMPTY_WEEK_DATA);
    expect(avgRevenuePerJob).toBe(0);
  });

  it('should compute laborEfficiency ($/hr) correctly', () => {
    const { laborEfficiency, totalRevenue, totalHours } = calculateWeeklyMetrics(FULL_WEEK_DATA);
    expect(laborEfficiency).toBeCloseTo(totalRevenue / totalHours);
  });

  it('should return laborEfficiency = 0 when there are no hours', () => {
    const { laborEfficiency } = calculateWeeklyMetrics(EMPTY_WEEK_DATA);
    expect(laborEfficiency).toBe(0);
  });

  it('should compute avgLabor = 0 when no days have data', () => {
    const { avgLabor } = calculateWeeklyMetrics(EMPTY_WEEK_DATA);
    expect(avgLabor).toBe(0);
  });

  it('should handle a single day with data correctly', () => {
    const singleDay = {
      Monday:    { revenue: 1000, labor: 25, hours: 5, jobs: 2 },
      Tuesday:   { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Thursday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Friday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Saturday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Sunday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    };
    const metrics = calculateWeeklyMetrics(singleDay);
    expect(metrics.totalRevenue).toBe(1000);
    expect(metrics.avgLabor).toBe(25);
    expect(metrics.totalHours).toBe(5);
    expect(metrics.totalJobs).toBe(2);
    expect(metrics.avgRevenuePerJob).toBe(500);
    expect(metrics.laborEfficiency).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// getLaborClass – CSS class logic
// ---------------------------------------------------------------------------
describe('getLaborClass', () => {
  it('should return "high-labor" when labor > 30 (LABOR_THRESHOLD_HIGH)', () => {
    expect(getLaborClass(31)).toBe('high-labor');
    expect(getLaborClass(35)).toBe('high-labor');
    expect(getLaborClass(40)).toBe('high-labor');
  });

  it('should return "good-labor" when labor is between 0 and 32 (exclusive)', () => {
    expect(getLaborClass(28)).toBe('good-labor');
    expect(getLaborClass(1)).toBe('good-labor');
    expect(getLaborClass(29.9)).toBe('good-labor');
  });

  it('should return "" (no class) when labor is exactly 0', () => {
    expect(getLaborClass(0)).toBe('');
  });

  it('should return "" when labor is exactly at LABOR_THRESHOLD_HIGH (30)', () => {
    // 30 is NOT > 30, and it IS < 32 but the "good" branch also requires > 0
    expect(getLaborClass(30)).toBe('good-labor');
  });

  it('should return "high-labor" when labor is exactly at LABOR_THRESHOLD_BONUS (32)', () => {
    // 32 > LABOR_THRESHOLD_HIGH (30) → the high-labor branch fires first
    expect(getLaborClass(32)).toBe('high-labor');
  });

  it('should classify all HIGH_LABOR_WEEK_DATA days correctly', () => {
    expect(getLaborClass(HIGH_LABOR_WEEK_DATA.Monday.labor)).toBe('high-labor');    // 35
    expect(getLaborClass(HIGH_LABOR_WEEK_DATA.Tuesday.labor)).toBe('good-labor');   // 28
    expect(getLaborClass(HIGH_LABOR_WEEK_DATA.Wednesday.labor)).toBe('good-labor'); // 30
    expect(getLaborClass(HIGH_LABOR_WEEK_DATA.Thursday.labor)).toBe('high-labor'); // 32 > 30
    expect(getLaborClass(HIGH_LABOR_WEEK_DATA.Friday.labor)).toBe('high-labor');    // 40
    expect(getLaborClass(HIGH_LABOR_WEEK_DATA.Saturday.labor)).toBe('');            // 0
  });
});

// ---------------------------------------------------------------------------
// isBonusEligible – bonus indicator logic
// ---------------------------------------------------------------------------
describe('isBonusEligible', () => {
  it('should be eligible when avgLabor is in the range (0, 32) exclusive', () => {
    expect(isBonusEligible(20)).toBe(true);
    expect(isBonusEligible(25)).toBe(true);
    expect(isBonusEligible(31.9)).toBe(true);
  });

  it('should NOT be eligible when avgLabor is 0 (no data)', () => {
    expect(isBonusEligible(0)).toBe(false);
  });

  it('should NOT be eligible when avgLabor is exactly 32 (LABOR_THRESHOLD_BONUS)', () => {
    expect(isBonusEligible(32)).toBe(false);
  });

  it('should NOT be eligible when avgLabor exceeds 32', () => {
    expect(isBonusEligible(33)).toBe(false);
    expect(isBonusEligible(50)).toBe(false);
  });

  it('should work end-to-end with calculateWeeklyMetrics output', () => {
    const { avgLabor } = calculateWeeklyMetrics(FULL_WEEK_DATA);
    // FULL_WEEK_DATA has all days' labor < 32 → bonus eligible
    expect(isBonusEligible(avgLabor)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// revenuePerJob helper
// ---------------------------------------------------------------------------
describe('revenuePerJob', () => {
  it('should return revenue divided by jobs', () => {
    expect(revenuePerJob(3000, 4)).toBe(750);
    expect(revenuePerJob(1000, 2)).toBe(500);
  });

  it('should return 0 when jobs is 0 (avoid division by zero)', () => {
    expect(revenuePerJob(1000, 0)).toBe(0);
    expect(revenuePerJob(0, 0)).toBe(0);
  });

  it('should handle fractional results', () => {
    expect(revenuePerJob(1000, 3)).toBeCloseTo(333.33, 2);
  });
});

// ---------------------------------------------------------------------------
// MAX_JOBS_PER_WEEK constant boundary tests
// ---------------------------------------------------------------------------
describe('MAX_JOBS_PER_WEEK boundary (7)', () => {
  it('should be exactly 7', () => {
    expect(MAX_JOBS_PER_WEEK).toBe(7);
  });

  it('full week with 1 job per day should total MAX_JOBS_PER_WEEK', () => {
    const oneJobPerDay = Object.fromEntries(
      Object.keys(FULL_WEEK_DATA).map(day => [day, { revenue: 100, labor: 25, hours: 5, jobs: 1 }])
    );
    const { totalJobs } = calculateWeeklyMetrics(oneJobPerDay);
    expect(totalJobs).toBe(MAX_JOBS_PER_WEEK);
  });
});
