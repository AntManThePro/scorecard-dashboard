import { jest } from '@jest/globals';
import { enterDay, mockDashboardDialogs, setupDashboard } from '../helpers/dashboard-module.js';
import { clearStorage } from '../helpers/dom-setup.js';
import { FULL_WEEK_DATA, HIGH_LABOR_WEEK_DATA, EMPTY_WEEK_DATA } from '../helpers/test-data.js';

describe('Dashboard calculations', () => {
  beforeEach(async () => {
    clearStorage();
    mockDashboardDialogs();
    await setupDashboard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders zero metrics for an empty week', async () => {
    // Arrange
    clearStorage();

    // Act
    await setupDashboard();

    // Assert
    expect(document.getElementById('totalRevenue').textContent).toBe('$0.00');
    expect(document.getElementById('avgLabor').textContent).toBe('0.0%');
    expect(document.getElementById('totalHours').textContent).toBe('0.0');
    expect(document.getElementById('totalJobs').textContent).toBe('0');
    expect(document.getElementById('avgRevenuePerJob').textContent).toBe('$0.00');
    expect(document.getElementById('laborEfficiency').textContent).toBe('$0.00/hr');
    expect(document.getElementById('bonusIndicator').classList.contains('hidden')).toBe(true);
  });

  it('calculates the weekly totals, averages, and derived metrics from entered days', () => {
    // Arrange
    const days = ['Thursday', 'Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday'];

    // Act
    days.forEach(day => enterDay({ day, ...FULL_WEEK_DATA[day] }));

    // Assert
    expect(document.getElementById('totalRevenue').textContent).toBe('$16500.00');
    expect(document.getElementById('avgLabor').textContent).toBe('24.7%');
    expect(document.getElementById('totalHours').textContent).toBe('51.5');
    expect(document.getElementById('totalJobs').textContent).toBe('19');
    expect(document.getElementById('avgRevenuePerJob').textContent).toBe('$868.42');
    expect(document.getElementById('laborEfficiency').textContent).toBe('$320.39/hr');
    expect(document.getElementById('bonusIndicator').classList.contains('hidden')).toBe(false);
  });

  it('calculates metrics when saved data omits days', async () => {
    // Arrange
    localStorage.setItem('weeklyData', JSON.stringify({
      Monday: { revenue: 1500, labor: 27, hours: 6, jobs: 2 },
      Wednesday: { revenue: 2200, labor: 33, hours: 8, jobs: 3 },
    }));

    // Act
    await setupDashboard();

    // Assert
    expect(document.getElementById('totalRevenue').textContent).toBe('$3700.00');
    expect(document.getElementById('avgLabor').textContent).toBe('30.0%');
    expect(document.getElementById('totalHours').textContent).toBe('14.0');
    expect(document.getElementById('totalJobs').textContent).toBe('5');
    expect(document.getElementById('avgRevenuePerJob').textContent).toBe('$740.00');
    expect(document.getElementById('laborEfficiency').textContent).toBe('$264.29/hr');
  });

  it('treats non-numeric form input as zero when calculating metrics', () => {
    // Arrange
    enterDay({ revenue: 1000, labor: 20, hours: 5, jobs: 2 });
    document.getElementById('daySelect').value = 'Tuesday';
    const inputs = ['revenueInput', 'laborInput', 'hoursInput', 'jobsCompletedInput']
      .map(id => document.getElementById(id));
    inputs.forEach(input => { input.value = 'not-a-number'; });

    // Act
    document.getElementById('addEntryBtn').click();

    // Assert
    expect(JSON.parse(localStorage.getItem('weeklyData')).Tuesday).toEqual({
      revenue: 0, labor: 0, hours: 0, jobs: 0,
    });
    expect(document.getElementById('totalRevenue').textContent).toBe('$1000.00');
    expect(document.getElementById('avgLabor').textContent).toBe('20.0%');
    expect(document.getElementById('totalHours').textContent).toBe('5.0');
    expect(document.getElementById('totalJobs').textContent).toBe('2');
    expect(document.getElementById('avgRevenuePerJob').textContent).toBe('$500.00');
    expect(document.getElementById('laborEfficiency').textContent).toBe('$200.00/hr');
  });

  it('uses the production labor-class thresholds for table cells', () => {
    Object.entries(HIGH_LABOR_WEEK_DATA).forEach(([day, entry]) => enterDay({ day, ...entry, jobs: 0 }));

    const laborClasses = Object.fromEntries(
      [...document.querySelectorAll('#weeklyTableBody tr')].map(row => [
        row.querySelector('td strong').textContent,
        row.querySelectorAll('td')[2].className,
      ]),
    );
    expect(laborClasses.Monday).toBe('high-labor');
    expect(laborClasses.Tuesday).toBe('good-labor');
    expect(laborClasses.Wednesday).toBe('good-labor');
    expect(laborClasses.Thursday).toBe('high-labor');
    expect(laborClasses.Friday).toBe('high-labor');
    expect(laborClasses.Saturday).toBe('');
  });

  it('shows no bonus when average labor reaches the bonus threshold', () => {
    enterDay({ day: 'Monday', ...HIGH_LABOR_WEEK_DATA.Thursday });

    expect(document.getElementById('avgLabor').textContent).toBe('32.0%');
    expect(document.getElementById('bonusIndicator').classList.contains('hidden')).toBe(true);
  });

  it('renders daily revenue per job and safely handles days with no jobs', () => {
    enterDay({ ...EMPTY_WEEK_DATA.Monday });
    expect(document.querySelector('#weeklyTableBody tr td:nth-child(6)').textContent).toBe('$0.00');

    enterDay({ revenue: 1000, labor: 25, hours: 5, jobs: 3 });
    expect(document.querySelector('#weeklyTableBody tr td:nth-child(6)').textContent).toBe('$333.33');
  });
});
