/**
 * Shared test fixtures for the scorecard dashboard test suite.
 *
 * These helpers provide consistent, reusable data that reflects real-world
 * usage patterns for the weekly scorecard system.
 */

'use strict';

/** A full week of sample scorecard data with realistic values. */
const FULL_WEEK_DATA = {
  Monday:    { revenue: 2500, labor: 28, hours: 8, jobs: 1 },
  Tuesday:   { revenue: 3100, labor: 31, hours: 9, jobs: 1 },
  Wednesday: { revenue: 2800, labor: 27, hours: 8, jobs: 1 },
  Thursday:  { revenue: 3500, labor: 29, hours: 10, jobs: 1 },
  Friday:    { revenue: 4000, labor: 30, hours: 11, jobs: 1 },
  Saturday:  { revenue: 1800, labor: 33, hours: 6, jobs: 1 },
  Sunday:    { revenue: 1200, labor: 25, hours: 4, jobs: 1 },
};

/** A week where all values are zero (empty state). */
const EMPTY_WEEK_DATA = {
  Monday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Tuesday:   { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Thursday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Friday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Saturday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Sunday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
};

/** A partial week — only Monday and Tuesday have data. */
const PARTIAL_WEEK_DATA = {
  Monday:    { revenue: 1000, labor: 25, hours: 8, jobs: 1 },
  Tuesday:   { revenue: 1500, labor: 28, hours: 9, jobs: 1 },
  Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Thursday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Friday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Saturday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  Sunday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
};

/** Weekly data where average labor % falls below the 32% bonus threshold. */
const BONUS_ELIGIBLE_DATA = {
  Monday:    { revenue: 3000, labor: 28, hours: 8, jobs: 1 },
  Tuesday:   { revenue: 3000, labor: 29, hours: 9, jobs: 1 },
  Wednesday: { revenue: 3000, labor: 27, hours: 8, jobs: 1 },
  Thursday:  { revenue: 3000, labor: 30, hours: 10, jobs: 1 },
  Friday:    { revenue: 3000, labor: 31, hours: 11, jobs: 1 },
  Saturday:  { revenue: 0,    labor: 0,  hours: 0,  jobs: 0 },
  Sunday:    { revenue: 0,    labor: 0,  hours: 0,  jobs: 0 },
};

/** Weekly data where average labor % exceeds the 32% bonus threshold. */
const BONUS_INELIGIBLE_DATA = {
  Monday:    { revenue: 2000, labor: 33, hours: 8, jobs: 1 },
  Tuesday:   { revenue: 2000, labor: 35, hours: 9, jobs: 1 },
  Wednesday: { revenue: 2000, labor: 34, hours: 8, jobs: 1 },
  Thursday:  { revenue: 2000, labor: 36, hours: 10, jobs: 1 },
  Friday:    { revenue: 2000, labor: 32, hours: 11, jobs: 1 },
  Saturday:  { revenue: 0,    labor: 0,  hours: 0,  jobs: 0 },
  Sunday:    { revenue: 0,    labor: 0,  hours: 0,  jobs: 0 },
};

/** Time-series data for trend analysis tests. */
const TREND_DATA_ASCENDING = [
  { week: '2025-W01', score: 20 },
  { week: '2025-W02', score: 22 },
  { week: '2025-W03', score: 25 },
  { week: '2025-W04', score: 28 },
  { week: '2025-W05', score: 30 },
];

const TREND_DATA_DESCENDING = [
  { week: '2025-W01', score: 30 },
  { week: '2025-W02', score: 28 },
  { week: '2025-W03', score: 25 },
  { week: '2025-W04', score: 22 },
  { week: '2025-W05', score: 20 },
];

const TREND_DATA_FLAT = [
  { week: '2025-W01', score: 25 },
  { week: '2025-W02', score: 25 },
  { week: '2025-W03', score: 25 },
];

const TREND_DATA_SINGLE = [{ week: '2025-W01', score: 15 }];

/**
 * Deep clone a data fixture so mutations in one test don't affect others.
 * @param {object} data
 * @returns {object}
 */
function cloneData(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * Build a minimal snapshot object matching the format used by handleSaveSnapshot.
 * @param {object} [weekData]
 * @returns {object}
 */
function buildSnapshot(weekData = FULL_WEEK_DATA) {
  const data = cloneData(weekData);
  return {
    id: new Date().toISOString(),
    date: new Date().toLocaleString(),
    data,
    metrics: {
      totalRevenue: Object.values(data).reduce((s, d) => s + d.revenue, 0),
      avgLabor: 29,
      totalHours: Object.values(data).reduce((s, d) => s + d.hours, 0),
      totalJobs: Object.values(data).reduce((s, d) => s + d.jobs, 0),
      avgRevenuePerJob: 0,
      laborEfficiency: 0,
    },
  };
}

module.exports = {
  FULL_WEEK_DATA,
  EMPTY_WEEK_DATA,
  PARTIAL_WEEK_DATA,
  BONUS_ELIGIBLE_DATA,
  BONUS_INELIGIBLE_DATA,
  TREND_DATA_ASCENDING,
  TREND_DATA_DESCENDING,
  TREND_DATA_FLAT,
  TREND_DATA_SINGLE,
  cloneData,
  buildSnapshot,
};
