/**
 * Shared test fixtures for the scorecard dashboard test suite.
 * Provides consistent sample data across all test files.
 */

/**
 * A fully-populated week of scorecard data.
 * All days have realistic values.
 */
export const FULL_WEEK_DATA = {
  Monday:    { revenue: 2500, labor: 28, hours: 8, jobs: 3 },
  Tuesday:   { revenue: 3200, labor: 25, hours: 9, jobs: 4 },
  Wednesday: { revenue: 1800, labor: 31, hours: 7, jobs: 2 },
  Thursday:  { revenue: 4100, labor: 22, hours: 10, jobs: 5 },
  Friday:    { revenue: 2900, labor: 29, hours: 8.5, jobs: 3 },
  Saturday:  { revenue: 1200, labor: 20, hours: 5, jobs: 1 },
  Sunday:    { revenue: 800,  labor: 18, hours: 4, jobs: 1 },
};

/**
 * A week where all values are zero (empty / untouched state).
 */
export const EMPTY_WEEK_DATA = {
  Monday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Tuesday:   { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Thursday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Friday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Saturday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Sunday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
};

/**
 * A partial week – only some days have data.
 */
export const PARTIAL_WEEK_DATA = {
  Monday:    { revenue: 1500, labor: 27, hours: 6, jobs: 2 },
  Tuesday:   { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
  Wednesday: { revenue: 2200, labor: 33, hours: 8, jobs: 3 },
  Thursday:  { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
  Friday:    { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
  Saturday:  { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
  Sunday:    { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
};

/**
 * A week where labor % crosses both thresholds.
 * LABOR_THRESHOLD_HIGH = 30, LABOR_THRESHOLD_BONUS = 32
 */
export const HIGH_LABOR_WEEK_DATA = {
  Monday:    { revenue: 1000, labor: 35, hours: 6, jobs: 1 }, // > 30 – high/red
  Tuesday:   { revenue: 1000, labor: 28, hours: 6, jobs: 1 }, // < 30 and < 32 – good/green
  Wednesday: { revenue: 1000, labor: 30, hours: 6, jobs: 1 }, // exactly 30 – boundary
  Thursday:  { revenue: 1000, labor: 32, hours: 6, jobs: 1 }, // exactly 32 – boundary
  Friday:    { revenue: 1000, labor: 40, hours: 6, jobs: 1 }, // well above high threshold
  Saturday:  { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
  Sunday:    { revenue: 0,    labor: 0,  hours: 0, jobs: 0 },
};

/**
 * Weekly trend data for trend utility tests.
 */
export const TREND_DATA_RISING = [
  { week: '2025-W01', score: 20 },
  { week: '2025-W02', score: 22 },
  { week: '2025-W03', score: 25 },
  { week: '2025-W04', score: 28 },
];

export const TREND_DATA_FALLING = [
  { week: '2025-W01', score: 30 },
  { week: '2025-W02', score: 27 },
  { week: '2025-W03', score: 24 },
  { week: '2025-W04', score: 20 },
];

export const TREND_DATA_FLAT = [
  { week: '2025-W01', score: 25 },
  { week: '2025-W02', score: 25 },
  { week: '2025-W03', score: 25 },
  { week: '2025-W04', score: 25 },
];

export const TREND_DATA_SINGLE = [
  { week: '2025-W01', score: 15 },
];

export const TREND_DATA_EMPTY = [];
