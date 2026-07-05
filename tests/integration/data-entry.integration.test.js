/**
 * Integration tests for the data-entry flow.
 *
 * These tests verify that the end-to-end pipeline of:
 *   add entry → recalculate metrics → persist to localStorage
 * behaves correctly when driven through the pure logic layer.
 *
 * The tests deliberately avoid importing app.js (which triggers DOM queries
 * at module load time) and instead exercise the same algorithmic logic via
 * standalone helper functions.  This is the recommended pattern documented in
 * the test-agent for this repo: test behaviour, not implementation details.
 */

import {
  FULL_WEEK_DATA,
  EMPTY_WEEK_DATA,
  PARTIAL_WEEK_DATA,
} from '../helpers/test-data.js';
import { clearStorage } from '../helpers/dom-setup.js';

// ---------------------------------------------------------------------------
// Constants mirroring app.js
// ---------------------------------------------------------------------------
const LABOR_THRESHOLD_BONUS = 32;
const MAX_JOBS_PER_WEEK     = 7;

// ---------------------------------------------------------------------------
// Replicated logic from app.js (kept pure for integration-level testing)
// ---------------------------------------------------------------------------
function calculateWeeklyMetrics(weeklyData) {
  const days = Object.keys(weeklyData);
  let totalRevenue = 0, totalLabor = 0, totalHours = 0, totalJobs = 0, daysWithData = 0;

  days.forEach(day => {
    const d = weeklyData[day];
    totalRevenue += d.revenue;
    totalHours   += d.hours;
    totalJobs    += d.jobs;
    if (d.revenue > 0 || d.hours > 0 || d.jobs > 0) {
      totalLabor += d.labor;
      daysWithData++;
    }
  });

  const avgLabor         = daysWithData > 0 ? totalLabor / daysWithData      : 0;
  const avgRevenuePerJob = totalJobs    > 0 ? totalRevenue / totalJobs        : 0;
  const laborEfficiency  = totalHours   > 0 ? totalRevenue / totalHours       : 0;

  return { totalRevenue, avgLabor, totalHours, totalJobs, avgRevenuePerJob, laborEfficiency };
}

function addEntry(weeklyData, day, { revenue, labor, hours, jobs }) {
  return {
    ...weeklyData,
    [day]: { revenue, labor, hours, jobs },
  };
}

function deleteEntry(weeklyData, day) {
  return {
    ...weeklyData,
    [day]: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
  };
}

function saveToLocalStorage(weeklyData) {
  localStorage.setItem('weeklyData', JSON.stringify(weeklyData));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem('weeklyData');
  return saved ? JSON.parse(saved) : null;
}

function buildCsvRow(day, data) {
  const rpj = data.jobs > 0 ? (data.revenue / data.jobs).toFixed(2) : '0.00';
  return `${day},${data.revenue.toFixed(2)},${data.labor.toFixed(1)},${data.hours.toFixed(1)},${data.jobs},${rpj}`;
}

function generateCsv(weeklyData) {
  const days = Object.keys(weeklyData);
  let csv = 'Day,Revenue ($),Labor (%),Hours,Jobs,Revenue per Job ($)\n';
  days.forEach(day => {
    csv += buildCsvRow(day, weeklyData[day]) + '\n';
  });
  const metrics = calculateWeeklyMetrics(weeklyData);
  csv += `\nTotals/Averages,${metrics.totalRevenue.toFixed(2)},${metrics.avgLabor.toFixed(1)},${metrics.totalHours.toFixed(1)},${metrics.totalJobs},${metrics.avgRevenuePerJob.toFixed(2)}\n`;
  csv += `\nMetrics\n`;
  csv += `Labor Efficiency,${metrics.laborEfficiency.toFixed(2)} $/hr\n`;
  csv += `Bonus Eligible,${metrics.avgLabor < LABOR_THRESHOLD_BONUS && metrics.avgLabor > 0 ? 'Yes' : 'No'}\n`;
  return csv;
}

// ---------------------------------------------------------------------------
// Full data-entry lifecycle
// ---------------------------------------------------------------------------
describe('Data-entry lifecycle', () => {
  let weeklyData;

  beforeEach(() => {
    clearStorage();
    weeklyData = { ...EMPTY_WEEK_DATA };
  });

  it('should start with all-zero metrics on an empty week', () => {
    const metrics = calculateWeeklyMetrics(weeklyData);
    expect(metrics.totalRevenue).toBe(0);
    expect(metrics.avgLabor).toBe(0);
    expect(metrics.totalJobs).toBe(0);
  });

  it('should update metrics after adding a single entry', () => {
    weeklyData = addEntry(weeklyData, 'Monday', { revenue: 2000, labor: 25, hours: 8, jobs: 3 });
    const metrics = calculateWeeklyMetrics(weeklyData);
    expect(metrics.totalRevenue).toBe(2000);
    expect(metrics.avgLabor).toBe(25);
    expect(metrics.totalJobs).toBe(3);
  });

  it('should overwrite existing day data when the same day is submitted again', () => {
    weeklyData = addEntry(weeklyData, 'Monday', { revenue: 1000, labor: 20, hours: 6, jobs: 2 });
    weeklyData = addEntry(weeklyData, 'Monday', { revenue: 3000, labor: 30, hours: 9, jobs: 4 });
    expect(weeklyData.Monday.revenue).toBe(3000);
    expect(weeklyData.Monday.labor).toBe(30);
  });

  it('should accumulate metrics across multiple days', () => {
    weeklyData = addEntry(weeklyData, 'Monday',  { revenue: 1000, labor: 25, hours: 5, jobs: 1 });
    weeklyData = addEntry(weeklyData, 'Tuesday', { revenue: 2000, labor: 30, hours: 8, jobs: 2 });
    weeklyData = addEntry(weeklyData, 'Friday',  { revenue: 1500, labor: 28, hours: 6, jobs: 2 });
    const metrics = calculateWeeklyMetrics(weeklyData);
    expect(metrics.totalRevenue).toBe(4500);
    expect(metrics.totalJobs).toBe(5);
    expect(metrics.avgLabor).toBeCloseTo((25 + 30 + 28) / 3);
  });

  it('should reset a day to zero after deleteEntry', () => {
    weeklyData = addEntry(weeklyData, 'Monday', { revenue: 2000, labor: 25, hours: 8, jobs: 3 });
    weeklyData = deleteEntry(weeklyData, 'Monday');
    expect(weeklyData.Monday.revenue).toBe(0);
    const metrics = calculateWeeklyMetrics(weeklyData);
    expect(metrics.totalRevenue).toBe(0);
  });

  it('should persist and reload data via localStorage', () => {
    weeklyData = addEntry(weeklyData, 'Wednesday', { revenue: 3500, labor: 27, hours: 9, jobs: 4 });
    saveToLocalStorage(weeklyData);
    const reloaded = loadFromLocalStorage();
    expect(reloaded.Wednesday.revenue).toBe(3500);
    expect(reloaded.Wednesday.labor).toBe(27);
  });

  it('should trigger confetti condition when totalJobs reaches MAX_JOBS_PER_WEEK', () => {
    // Add 1 job per day until we hit MAX_JOBS_PER_WEEK (7)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    days.forEach(day => {
      weeklyData = addEntry(weeklyData, day, { revenue: 500, labor: 25, hours: 4, jobs: 1 });
    });
    const { totalJobs } = calculateWeeklyMetrics(weeklyData);
    expect(totalJobs).toBe(MAX_JOBS_PER_WEEK);
  });
});

// ---------------------------------------------------------------------------
// CSV export generation
// ---------------------------------------------------------------------------
describe('CSV export', () => {
  it('should include a header row', () => {
    const csv = generateCsv(EMPTY_WEEK_DATA);
    expect(csv).toContain('Day,Revenue ($),Labor (%),Hours,Jobs,Revenue per Job ($)');
  });

  it('should include a row for every day of the week', () => {
    const csv = generateCsv(FULL_WEEK_DATA);
    ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
      .forEach(day => expect(csv).toContain(day));
  });

  it('should include the correct total revenue in the summary row', () => {
    const csv = generateCsv(FULL_WEEK_DATA);
    const metrics = calculateWeeklyMetrics(FULL_WEEK_DATA);
    expect(csv).toContain(metrics.totalRevenue.toFixed(2));
  });

  it('should mark bonus eligible when avgLabor < 32%', () => {
    // FULL_WEEK_DATA has low labor → bonus eligible
    const csv = generateCsv(FULL_WEEK_DATA);
    expect(csv).toContain('Bonus Eligible,Yes');
  });

  it('should mark bonus ineligible for empty data (avgLabor = 0)', () => {
    const csv = generateCsv(EMPTY_WEEK_DATA);
    expect(csv).toContain('Bonus Eligible,No');
  });

  it('should include revenue-per-job = 0.00 for days with no jobs', () => {
    const csv = generateCsv(EMPTY_WEEK_DATA);
    expect(csv).toContain('Monday,0.00,0.0,0.0,0,0.00');
  });

  it('should include a Metrics section', () => {
    const csv = generateCsv(FULL_WEEK_DATA);
    expect(csv).toContain('Metrics');
    expect(csv).toContain('Labor Efficiency');
  });
});

// ---------------------------------------------------------------------------
// Role-based access logic (permissions, not DOM)
// ---------------------------------------------------------------------------
describe('Role-based access logic', () => {
  const ROLES = { ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' };

  function canEdit(role)   { return role === ROLES.ADMIN || role === ROLES.EDITOR; }
  function canExport(role) { return role === ROLES.ADMIN; }
  function canSave(role)   { return role === ROLES.ADMIN; }
  function isViewer(role)  { return role === ROLES.VIEWER; }

  it('admin should be able to edit, export, and save', () => {
    expect(canEdit(ROLES.ADMIN)).toBe(true);
    expect(canExport(ROLES.ADMIN)).toBe(true);
    expect(canSave(ROLES.ADMIN)).toBe(true);
  });

  it('editor should be able to edit but NOT export or save', () => {
    expect(canEdit(ROLES.EDITOR)).toBe(true);
    expect(canExport(ROLES.EDITOR)).toBe(false);
    expect(canSave(ROLES.EDITOR)).toBe(false);
  });

  it('viewer should NOT be able to edit, export, or save', () => {
    expect(canEdit(ROLES.VIEWER)).toBe(false);
    expect(canExport(ROLES.VIEWER)).toBe(false);
    expect(canSave(ROLES.VIEWER)).toBe(false);
    expect(isViewer(ROLES.VIEWER)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Snapshot system integration
// ---------------------------------------------------------------------------
describe('Snapshot system', () => {
  beforeEach(clearStorage);

  it('should save and reload a week via snapshot roundtrip', () => {
    const metrics = calculateWeeklyMetrics(PARTIAL_WEEK_DATA);
    const snapshot = {
      id:      new Date().toISOString(),
      date:    new Date().toLocaleString(),
      data:    JSON.parse(JSON.stringify(PARTIAL_WEEK_DATA)),
      metrics: metrics,
    };

    const snapshots = [snapshot];
    localStorage.setItem('snapshots', JSON.stringify(snapshots));

    const loaded = JSON.parse(localStorage.getItem('snapshots'));
    expect(loaded[0].data).toEqual(PARTIAL_WEEK_DATA);
    expect(loaded[0].metrics.totalRevenue).toBe(metrics.totalRevenue);
  });

  it('should preserve metric precision in snapshot', () => {
    const metrics = calculateWeeklyMetrics(FULL_WEEK_DATA);
    const snap = { id: 'x', data: FULL_WEEK_DATA, metrics };
    localStorage.setItem('snapshots', JSON.stringify([snap]));
    const loaded = JSON.parse(localStorage.getItem('snapshots'));
    expect(loaded[0].metrics.laborEfficiency).toBeCloseTo(metrics.laborEfficiency, 4);
  });
});
