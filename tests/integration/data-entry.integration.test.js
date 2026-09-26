/**
 * Integration tests for the data-entry flow in script.js.
 *
 * These tests load the full script in a jsdom environment, exercise the DOM
 * interactions (form fill → Add Entry button → table/metrics update), and
 * verify end-to-end behaviour without modifying any source files.
 *
 * Strategy
 * --------
 * 1. Build the exact DOM structure that script.js expects.
 * 2. Require script.js (side-effects run, globals attach to `global`).
 * 3. Trigger DOMContentLoaded so the app initialises.
 * 4. Interact with the DOM (set values, click buttons) and assert the results.
 *
 * Each test uses `jest.resetModules()` + a fresh DOM so there is no
 * cross-test bleed through the module cache or shared global state.
 */

'use strict';

const { setupDashboardDOM, teardownDashboardDOM } = require('../helpers/dom-setup.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Load script.js freshly into the current jsdom window.
 * Must be called AFTER setupDashboardDOM() so DOM elements exist.
 */
function loadScript() {
  jest.resetModules();
  require('../../script.js');
  // Fire DOMContentLoaded so the app initialises event listeners
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
}

/**
 * Fill the data-entry form and click Add Entry.
 */
function enterDay({ day = 'Monday', revenue = '0', labor = '0', hours = '0', jobs = '0' } = {}) {
  document.getElementById('daySelect').value           = day;
  document.getElementById('revenueInput').value        = revenue;
  document.getElementById('laborInput').value          = labor;
  document.getElementById('hoursInput').value          = hours;
  document.getElementById('jobsCompletedInput').value  = jobs;
  document.getElementById('addEntryBtn').click();
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear();
  setupDashboardDOM();
  loadScript();
});

afterEach(() => {
  teardownDashboardDOM();
});

// ---------------------------------------------------------------------------
// Adding entries updates the metrics display
// ---------------------------------------------------------------------------
describe('Data Entry – metrics display', () => {
  it('should update Total Revenue after entering a single day', () => {
    // Arrange / Act
    enterDay({ day: 'Monday', revenue: '3000', labor: '28', hours: '8', jobs: '1' });

    // Assert
    const display = document.getElementById('totalRevenue').textContent;
    expect(display).toBe('$3000.00');
  });

  it('should accumulate revenue across multiple day entries', () => {
    // Arrange / Act
    enterDay({ day: 'Monday',  revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    enterDay({ day: 'Tuesday', revenue: '3000', labor: '30', hours: '9', jobs: '1' });

    // Assert
    const display = document.getElementById('totalRevenue').textContent;
    expect(display).toBe('$5000.00');
  });

  it('should display correct Total Jobs after two day entries', () => {
    // Arrange / Act
    enterDay({ day: 'Monday',  revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    enterDay({ day: 'Tuesday', revenue: '1500', labor: '29', hours: '7', jobs: '1' });

    // Assert
    expect(document.getElementById('totalJobs').textContent).toBe('2');
  });

  it('should clear input fields after adding an entry', () => {
    // Arrange / Act
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });

    // Assert
    expect(document.getElementById('revenueInput').value).toBe('');
    expect(document.getElementById('laborInput').value).toBe('');
    expect(document.getElementById('hoursInput').value).toBe('');
    expect(document.getElementById('jobsCompletedInput').value).toBe('');
  });

  it('should show $0.00 total revenue when no entries exist', () => {
    // No entries – assert initial state
    expect(document.getElementById('totalRevenue').textContent).toBe('$0.00');
  });
});

// ---------------------------------------------------------------------------
// Updating an existing day overwrites its data
// ---------------------------------------------------------------------------
describe('Data Entry – overwrite behaviour', () => {
  it('should replace existing data when the same day is entered twice', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '1000', labor: '30', hours: '8', jobs: '1' });

    // Act – overwrite Monday
    enterDay({ day: 'Monday', revenue: '2500', labor: '27', hours: '8', jobs: '1' });

    // Assert – only the latest value should count
    const display = document.getElementById('totalRevenue').textContent;
    expect(display).toBe('$2500.00');
  });
});

// ---------------------------------------------------------------------------
// Weekly table rendering
// ---------------------------------------------------------------------------
describe('Data Entry – weekly table', () => {
  it('should render a row for Monday after adding an entry', () => {
    // Arrange / Act
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });

    // Assert
    const tbody = document.getElementById('weeklyTableBody');
    expect(tbody.innerHTML).toContain('Monday');
  });

  it('should render a separate row for each day entered', () => {
    // Arrange / Act
    enterDay({ day: 'Monday',  revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    enterDay({ day: 'Tuesday', revenue: '3000', labor: '29', hours: '9', jobs: '1' });

    // Assert
    const tbody = document.getElementById('weeklyTableBody');
    expect(tbody.innerHTML).toContain('Monday');
    expect(tbody.innerHTML).toContain('Tuesday');
  });
});

// ---------------------------------------------------------------------------
// Role-based access control
// ---------------------------------------------------------------------------
describe('Role-based access control', () => {
  it('should disable inputs for the viewer role', () => {
    // Arrange
    const roleSelect = document.getElementById('userRole');

    // Act – switch to viewer
    roleSelect.value = 'viewer';
    roleSelect.dispatchEvent(new Event('change'));

    // Assert
    expect(document.getElementById('daySelect').disabled).toBe(true);
    expect(document.getElementById('revenueInput').disabled).toBe(true);
    expect(document.getElementById('laborInput').disabled).toBe(true);
    expect(document.getElementById('hoursInput').disabled).toBe(true);
    expect(document.getElementById('jobsCompletedInput').disabled).toBe(true);
    expect(document.getElementById('addEntryBtn').disabled).toBe(true);
  });

  it('should disable save and export buttons for the editor role', () => {
    // Arrange
    const roleSelect = document.getElementById('userRole');

    // Act – switch to editor
    roleSelect.value = 'editor';
    roleSelect.dispatchEvent(new Event('change'));

    // Assert
    expect(document.getElementById('saveBtn').disabled).toBe(true);
    expect(document.getElementById('exportBtn').disabled).toBe(true);
  });

  it('should enable all controls when the role is set back to admin', () => {
    // Arrange – first switch to viewer
    const roleSelect = document.getElementById('userRole');
    roleSelect.value = 'viewer';
    roleSelect.dispatchEvent(new Event('change'));

    // Act – switch back to admin
    roleSelect.value = 'admin';
    roleSelect.dispatchEvent(new Event('change'));

    // Assert
    expect(document.getElementById('addEntryBtn').disabled).toBe(false);
    expect(document.getElementById('saveBtn').disabled).toBe(false);
    expect(document.getElementById('exportBtn').disabled).toBe(false);
  });

  it('should enable inputs for the editor role', () => {
    // Arrange
    const roleSelect = document.getElementById('userRole');
    // First make viewer (disables everything)
    roleSelect.value = 'viewer';
    roleSelect.dispatchEvent(new Event('change'));

    // Act – switch to editor
    roleSelect.value = 'editor';
    roleSelect.dispatchEvent(new Event('change'));

    // Assert – editing inputs should be enabled
    expect(document.getElementById('daySelect').disabled).toBe(false);
    expect(document.getElementById('revenueInput').disabled).toBe(false);
    expect(document.getElementById('addEntryBtn').disabled).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bonus indicator visibility
// ---------------------------------------------------------------------------
describe('Bonus indicator', () => {
  it('should show the bonus indicator when avg labor is below 32%', () => {
    // Arrange / Act – add days with labor well below 32%
    enterDay({ day: 'Monday',  revenue: '3000', labor: '28', hours: '8', jobs: '1' });
    enterDay({ day: 'Tuesday', revenue: '3000', labor: '29', hours: '9', jobs: '1' });

    // Assert
    const indicator = document.getElementById('bonusIndicator');
    expect(indicator.classList.contains('hidden')).toBe(false);
  });

  it('should hide the bonus indicator when avg labor is above 32%', () => {
    // Arrange / Act
    enterDay({ day: 'Monday',  revenue: '2000', labor: '33', hours: '8', jobs: '1' });
    enterDay({ day: 'Tuesday', revenue: '2000', labor: '35', hours: '9', jobs: '1' });

    // Assert
    const indicator = document.getElementById('bonusIndicator');
    expect(indicator.classList.contains('hidden')).toBe(true);
  });

  it('should hide the bonus indicator when there are no entries', () => {
    const indicator = document.getElementById('bonusIndicator');
    expect(indicator.classList.contains('hidden')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// localStorage persistence
// ---------------------------------------------------------------------------
describe('Data persistence via localStorage', () => {
  it('should persist entered data to localStorage', () => {
    // Arrange / Act
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });

    // Assert
    const saved = JSON.parse(localStorage.getItem('weeklyData'));
    expect(saved).not.toBeNull();
    expect(saved.Monday.revenue).toBe(2000);
  });

  it('should load persisted data on initialisation', () => {
    // Arrange – pre-seed localStorage as if the page was previously visited,
    // then set up a fresh DOM and reload the script to simulate a page load.
    const seededData = {
      Monday:    { revenue: 5000, labor: 27, hours: 10, jobs: 1 },
      Tuesday:   { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Thursday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Friday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Saturday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Sunday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    };

    // Reset DOM without wiping localStorage (teardownDashboardDOM clears it)
    document.body.innerHTML = '';
    localStorage.setItem('weeklyData', JSON.stringify(seededData));
    setupDashboardDOM();
    loadScript();

    // Assert
    const display = document.getElementById('totalRevenue').textContent;
    expect(display).toBe('$5000.00');
  });
});
