import { jest } from '@jest/globals';
import { enterDay, mockDashboardDialogs, setupDashboard } from '../helpers/dashboard-module.js';
import { clearStorage } from '../helpers/dom-setup.js';

describe('Dashboard persistence and snapshots', () => {
  beforeEach(async () => {
    clearStorage();
    mockDashboardDialogs();
    await setupDashboard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads saved weekly data into the dashboard on startup', async () => {
    localStorage.setItem('weeklyData', JSON.stringify({
      Monday: { revenue: 1234.56, labor: 27.5, hours: 7.25, jobs: 2 },
    }));
    await setupDashboard();

    expect(document.getElementById('totalRevenue').textContent).toBe('$1234.56');
    expect(document.getElementById('avgLabor').textContent).toBe('27.5%');
    expect(document.getElementById('totalHours').textContent).toBe('7.3');
    expect(document.getElementById('totalJobs').textContent).toBe('2');
  });

  it('saves entered weekly data through the application event handler', () => {
    enterDay({ revenue: 1234.56, labor: 27.5, hours: 7.25, jobs: 2 });

    expect(JSON.parse(localStorage.getItem('weeklyData')).Monday).toEqual({
      revenue: 1234.56,
      labor: 27.5,
      hours: 7.25,
      jobs: 2,
    });
  });

  it('creates a snapshot from live data and restores it through the load handler', () => {
    enterDay({ revenue: 500, labor: 25, hours: 4, jobs: 1 });
    document.getElementById('saveBtn').click();
    const [snapshot] = JSON.parse(localStorage.getItem('snapshots'));

    enterDay({ revenue: 9999, labor: 40, hours: 8, jobs: 4 });
    window.loadSnapshot(snapshot.id);

    expect(document.getElementById('totalRevenue').textContent).toBe('$500.00');
    expect(document.getElementById('totalJobs').textContent).toBe('1');
    expect(JSON.parse(localStorage.getItem('weeklyData')).Monday).toEqual({
      revenue: 500,
      labor: 25,
      hours: 4,
      jobs: 1,
    });
    expect(window.alert).toHaveBeenCalledWith('Snapshot loaded successfully!');
  });

  it('displays saved snapshots newest first and deletes the selected snapshot', () => {
    enterDay({ revenue: 100, labor: 20, hours: 2, jobs: 1 });
    document.getElementById('saveBtn').click();
    const first = JSON.parse(localStorage.getItem('snapshots'))[0];
    enterDay({ day: 'Tuesday', revenue: 200, labor: 21, hours: 3, jobs: 1 });
    document.getElementById('saveBtn').click();
    const snapshots = JSON.parse(localStorage.getItem('snapshots'));
    const second = snapshots[1];

    expect(document.querySelectorAll('.snapshot-item')).toHaveLength(2);
    expect([...document.querySelectorAll('.snapshot-item .snapshot-metrics')].map((item) => item.textContent.match(/Revenue: \$([\d.]+)/)?.[1])).toEqual([
      second.metrics.totalRevenue.toFixed(2),
      first.metrics.totalRevenue.toFixed(2),
    ]);

    window.deleteSnapshot(first.id);

    expect(JSON.parse(localStorage.getItem('snapshots'))).toHaveLength(1);
    expect(JSON.parse(localStorage.getItem('snapshots'))[0].id).toBe(second.id);
    expect(document.querySelectorAll('.snapshot-item')).toHaveLength(1);
  });
});
