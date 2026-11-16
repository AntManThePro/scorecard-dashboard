/**
 * Integration tests that exercise the dashboard through its actual HTML and
 * script.js event handlers.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { jest } from '@jest/globals';
import { clearStorage } from '../helpers/dom-setup.js';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
const dashboardScript = readFileSync(resolve(process.cwd(), 'script.js'), 'utf8');

function setupDashboard() {
  const page = new DOMParser().parseFromString(indexHtml, 'text/html');
  document.body.replaceWith(document.importNode(page.body, true));
  document.querySelector('script[src="script.js"]')?.remove();

  window.Function(dashboardScript)();
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

function enterDay({ day = 'Monday', revenue, labor, hours, jobs }) {
  document.getElementById('daySelect').value = day;
  document.getElementById('revenueInput').value = revenue;
  document.getElementById('laborInput').value = labor;
  document.getElementById('hoursInput').value = hours;
  document.getElementById('jobsCompletedInput').value = jobs;
  document.getElementById('addEntryBtn').click();
}

function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
  });
}

describe('Dashboard data-entry integration', () => {
  beforeEach(() => {
    clearStorage();
    window.alert = jest.fn();
    window.confirm = jest.fn(() => true);
    window.URL.createObjectURL = jest.fn(() => 'blob:scorecard');
    window.URL.revokeObjectURL = jest.fn();
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    setupDashboard();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('updates the dashboard and persists entries submitted through the form', () => {
    enterDay({ revenue: '1200', labor: '25', hours: '6', jobs: '3' });

    expect(document.getElementById('totalRevenue').textContent).toBe('$1200.00');
    expect(document.getElementById('avgLabor').textContent).toBe('25.0%');
    expect(document.getElementById('totalJobs').textContent).toBe('3');
    expect(document.getElementById('bonusIndicator').classList.contains('hidden')).toBe(false);
    expect(document.querySelector('#weeklyTableBody tr').textContent).toContain('Monday');
    expect(document.querySelector('#revenueChart .bar-value').textContent).toBe('$1200');
    expect(JSON.parse(localStorage.getItem('weeklyData')).Monday).toEqual({
      revenue: 1200,
      labor: 25,
      hours: 6,
      jobs: 3,
    });
    expect(document.getElementById('revenueInput').value).toBe('');
  });

  it('restores persisted entries when the dashboard is initialized again', () => {
    enterDay({ revenue: '850', labor: '28', hours: '5', jobs: '2' });
    setupDashboard();

    expect(document.getElementById('totalRevenue').textContent).toBe('$850.00');
    expect(document.getElementById('totalJobs').textContent).toBe('2');
    expect(document.querySelector('#weeklyTableBody tr').textContent).toContain('850.00');
  });

  it('applies editor and viewer permissions to the real dashboard controls', () => {
    const roleSelect = document.getElementById('userRole');
    roleSelect.value = 'editor';
    roleSelect.dispatchEvent(new Event('change'));

    expect(document.getElementById('addEntryBtn').disabled).toBe(false);
    expect(document.getElementById('saveBtn').disabled).toBe(true);
    expect(document.getElementById('exportBtn').disabled).toBe(true);

    roleSelect.value = 'viewer';
    roleSelect.dispatchEvent(new Event('change'));

    expect(document.getElementById('daySelect').disabled).toBe(true);
    expect(document.getElementById('revenueInput').disabled).toBe(true);
    expect(document.getElementById('addEntryBtn').disabled).toBe(true);
    expect(document.querySelector('.btn-delete').disabled).toBe(true);
  });

  it('deletes an entry through the dashboard handler and persists the change', () => {
    enterDay({ revenue: '1200', labor: '25', hours: '6', jobs: '3' });

    window.deleteEntry('Monday');

    expect(window.confirm).toHaveBeenCalledWith('Delete data for Monday?');
    expect(document.getElementById('totalRevenue').textContent).toBe('$0.00');
    expect(JSON.parse(localStorage.getItem('weeklyData')).Monday).toEqual({
      revenue: 0,
      labor: 0,
      hours: 0,
      jobs: 0,
    });
  });

  it('exports the real CSV Blob from the admin export control', async () => {
    enterDay({ revenue: '1200', labor: '25', hours: '6', jobs: '3' });

    document.getElementById('exportBtn').click();

    expect(window.URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith('blob:scorecard');
    const [blob] = window.URL.createObjectURL.mock.calls[0];
    expect(blob.type).toBe('text/csv');
    const csv = await readBlob(blob);
    expect(csv).toContain('Monday,1200.00,25.0,6.0,3,400.00');
    expect(csv).toContain('Totals/Averages,1200.00,25.0,6.0,3,400.00');
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledTimes(1);
  });

  it('saves a snapshot through the dashboard and displays it', () => {
    enterDay({ revenue: '1200', labor: '25', hours: '6', jobs: '3' });

    document.getElementById('saveBtn').click();

    const [snapshot] = JSON.parse(localStorage.getItem('snapshots'));
    expect(snapshot.data.Monday).toEqual({
      revenue: 1200,
      labor: 25,
      hours: 6,
      jobs: 3,
    });
    expect(document.querySelector('.snapshot-item')).not.toBeNull();
    expect(window.alert).toHaveBeenCalledWith('Snapshot saved successfully!');
  });
});
