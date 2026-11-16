import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { jest } from '@jest/globals';

const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

export async function setupDashboard() {
  const page = new DOMParser().parseFromString(indexHtml, 'text/html');
  document.body.replaceWith(document.importNode(page.body, true));

  const initializationListeners = [];
  const originalAddEventListener = document.addEventListener.bind(document);
  const addEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation((type, listener, options) => {
    if (type === 'DOMContentLoaded') {
      initializationListeners.push(listener);
    }
    return originalAddEventListener(type, listener, options);
  });

  try {
    await jest.isolateModulesAsync(async () => {
      await import('../../script.js');
    });
  } finally {
    addEventListenerSpy.mockRestore();
  }

  document.dispatchEvent(new Event('DOMContentLoaded'));
  initializationListeners.forEach((listener) => {
    document.removeEventListener('DOMContentLoaded', listener);
  });
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
