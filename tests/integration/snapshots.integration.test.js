/**
 * Integration tests for the Snapshot system in script.js.
 *
 * These tests load the full script in a jsdom environment and exercise the
 * complete snapshot lifecycle: save, display (DOM rendering), load, and
 * delete – verifying both the localStorage state and the DOM output.
 */

'use strict';

const { setupDashboardDOM, teardownDashboardDOM } = require('../helpers/dom-setup.js');
const { cloneData, buildSnapshot, FULL_WEEK_DATA } = require('../helpers/test-data.js');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadScript() {
  jest.resetModules();
  require('../../script.js');
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
}

/** Add an entry via the form so weeklyData is populated before saving. */
function enterDay({ day = 'Monday', revenue = '2000', labor = '28', hours = '8', jobs = '1' } = {}) {
  document.getElementById('daySelect').value           = day;
  document.getElementById('revenueInput').value        = revenue;
  document.getElementById('laborInput').value          = labor;
  document.getElementById('hoursInput').value          = hours;
  document.getElementById('jobsCompletedInput').value  = jobs;
  document.getElementById('addEntryBtn').click();
}

/** Click the delete button for the most recently rendered snapshot item. */
function clickSnapshotDeleteBtn() {
  const snapshotActions = document.querySelectorAll('.snapshot-actions .btn-delete');
  expect(snapshotActions.length).toBeGreaterThan(0);
  snapshotActions[snapshotActions.length - 1].click();
}

/** Click Save Snapshot and suppress the browser alert. */
function saveSnapshot() {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  document.getElementById('saveBtn').click();
}

/** Read raw snapshots array from localStorage. */
function getStoredSnapshots() {
  const raw = localStorage.getItem('snapshots');
  return raw ? JSON.parse(raw) : [];
}

// ---------------------------------------------------------------------------
// Setup / Teardown
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear();
  setupDashboardDOM();
  loadScript();
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
  teardownDashboardDOM();
});

// ---------------------------------------------------------------------------
// Saving snapshots
// ---------------------------------------------------------------------------
describe('Snapshot – saving', () => {
  it('should persist a snapshot to localStorage when Save is clicked by admin', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '3000', labor: '28', hours: '8', jobs: '1' });

    // Act
    saveSnapshot();

    // Assert
    const snapshots = getStoredSnapshots();
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].data.Monday.revenue).toBe(3000);
  });

  it('should store the current metrics inside the snapshot', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '4000', labor: '30', hours: '10', jobs: '1' });

    // Act
    saveSnapshot();

    // Assert
    const snap = getStoredSnapshots()[0];
    expect(snap.metrics.totalRevenue).toBe(4000);
    expect(snap.metrics.totalJobs).toBe(1);
  });

  it('should accumulate multiple snapshots without overwriting previous ones', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();
    enterDay({ day: 'Tuesday', revenue: '3000', labor: '29', hours: '9', jobs: '1' });
    saveSnapshot();

    // Assert
    expect(getStoredSnapshots()).toHaveLength(2);
  });

  it('should not save a snapshot when the role is not admin', () => {
    // Arrange – switch to editor
    const roleSelect = document.getElementById('userRole');
    roleSelect.value = 'editor';
    roleSelect.dispatchEvent(new Event('change'));

    // Act
    document.getElementById('saveBtn').click();

    // Assert – save button is disabled for editor; localStorage should be empty
    expect(getStoredSnapshots()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Displaying snapshots in the DOM
// ---------------------------------------------------------------------------
describe('Snapshot – DOM rendering', () => {
  it('should render saved snapshots in the snapshots list container', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();

    // Assert
    const list = document.getElementById('snapshotsList');
    expect(list.innerHTML).toContain('snapshot-item');
  });

  it('should show an empty-state message when no snapshots exist', () => {
    // No snapshots saved
    const list = document.getElementById('snapshotsList');
    expect(list.innerHTML).toContain('No snapshots saved yet');
  });

  it('should show the snapshot revenue in the rendered list item', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '3500', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();

    // Assert
    const list = document.getElementById('snapshotsList');
    expect(list.innerHTML).toContain('3500.00');
  });

  it('should display snapshots in reverse chronological order (newest first)', () => {
    // Arrange – save two snapshots with distinct revenue amounts
    enterDay({ day: 'Monday', revenue: '1000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();
    enterDay({ day: 'Tuesday', revenue: '9999', labor: '29', hours: '9', jobs: '1' });
    saveSnapshot();

    // Assert – the second snapshot (higher revenue) should appear first
    const list = document.getElementById('snapshotsList');
    const items = list.querySelectorAll('.snapshot-item');
    expect(items.length).toBeGreaterThanOrEqual(2);
    // The first rendered item should reflect the cumulative revenue of both days
    expect(items[0].textContent).toContain('10999.00');
  });
});

// ---------------------------------------------------------------------------
// Loading snapshots
// ---------------------------------------------------------------------------
describe('Snapshot – loading', () => {
  it('should restore weeklyData from a snapshot when Load is clicked', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '5000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();

    // Change the data to something different
    enterDay({ day: 'Monday', revenue: '100', labor: '50', hours: '1', jobs: '0' });

    // Act – click the Load button rendered inside the snapshots list
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    const loadBtn = document.querySelector('.snapshot-actions .btn-load');
    expect(loadBtn).not.toBeNull();
    loadBtn.click();

    // Assert – metrics should reflect the restored snapshot
    expect(document.getElementById('totalRevenue').textContent).toBe('$5000.00');
  });

  it('should update localStorage when a snapshot is loaded', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '5000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();
    const loadBtn = document.querySelector('.snapshot-actions .btn-load');
    jest.spyOn(window, 'alert').mockImplementation(() => {});

    // Act
    loadBtn.click();

    // Assert
    const stored = JSON.parse(localStorage.getItem('weeklyData'));
    expect(stored.Monday.revenue).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// Deleting snapshots
// ---------------------------------------------------------------------------
describe('Snapshot – deleting', () => {
  it('should remove the snapshot from localStorage when Delete is clicked', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();
    expect(getStoredSnapshots()).toHaveLength(1);

    // Act – use snapshot-scoped selector to avoid matching table row delete buttons
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    clickSnapshotDeleteBtn();

    // Assert
    expect(getStoredSnapshots()).toHaveLength(0);
  });

  it('should show the empty-state message after the last snapshot is deleted', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();

    // Act
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    clickSnapshotDeleteBtn();

    // Assert
    const list = document.getElementById('snapshotsList');
    expect(list.innerHTML).toContain('No snapshots saved yet');
  });

  it('should NOT delete the snapshot when the user cancels the confirmation', () => {
    // Arrange
    enterDay({ day: 'Monday', revenue: '2000', labor: '28', hours: '8', jobs: '1' });
    saveSnapshot();

    // Act – user cancels
    jest.spyOn(window, 'confirm').mockReturnValue(false);
    clickSnapshotDeleteBtn();

    // Assert – snapshot must still exist
    expect(getStoredSnapshots()).toHaveLength(1);
  });
});
