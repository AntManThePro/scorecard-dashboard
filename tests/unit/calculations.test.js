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

  it('renders zero metrics for an empty week', () => {
    expect(document.getElementById('totalRevenue').textContent).toBe('$0.00');
    expect(document.getElementById('avgLabor').textContent).toBe('0.0%');
    expect(document.getElementById('totalHours').textContent).toBe('0.0');
    expect(document.getElementById('totalJobs').textContent).toBe('0');
    expect(document.getElementById('avgRevenuePerJob').textContent).toBe('$0.00');
    expect(document.getElementById('laborEfficiency').textContent).toBe('$0.00/hr');
    expect(document.getElementById('bonusIndicator').classList.contains('hidden')).toBe(true);
  });

  it('calculates the weekly totals, averages, and derived metrics from entered days', () => {
    ['Thursday', 'Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday', 'Sunday']
      .forEach(day => enterDay({ day, ...FULL_WEEK_DATA[day] }));

    expect(document.getElementById('totalRevenue').textContent).toBe('$16500.00');
    expect(document.getElementById('avgLabor').textContent).toBe('24.7%');
    expect(document.getElementById('totalHours').textContent).toBe('51.5');
    expect(document.getElementById('totalJobs').textContent).toBe('19');
    expect(document.getElementById('avgRevenuePerJob').textContent).toBe('$868.42');
    expect(document.getElementById('laborEfficiency').textContent).toBe('$320.39/hr');
    expect(document.getElementById('bonusIndicator').classList.contains('hidden')).toBe(false);
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
