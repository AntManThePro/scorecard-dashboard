import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { jest } from '@jest/globals';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

export async function setupDashboard() {
  const page = new DOMParser().parseFromString(indexHtml, 'text/html');
  document.body.replaceWith(document.importNode(page.body, true));

  await jest.isolateModulesAsync(async () => {
    await import('../../script.js');
  });
  document.dispatchEvent(new Event('DOMContentLoaded'));
}

export function enterDay({ day = 'Monday', revenue, labor, hours, jobs }) {
  document.getElementById('daySelect').value = day;
  document.getElementById('revenueInput').value = revenue;
  document.getElementById('laborInput').value = labor;
  document.getElementById('hoursInput').value = hours;
  document.getElementById('jobsCompletedInput').value = jobs;
  document.getElementById('addEntryBtn').click();
}

export function mockDashboardDialogs() {
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
  window.URL.createObjectURL = jest.fn(() => 'blob:scorecard');
  window.URL.revokeObjectURL = jest.fn();
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
}
