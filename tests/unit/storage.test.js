/**
 * Unit tests for the production localStorage helpers exported from script.js.
 *
 * These tests load the real dashboard module in jsdom so persistence behaviour
 * stays aligned with the app code.
 */

'use strict';

const { loadDashboardModule, teardownDashboardDOM } = require('../helpers/dashboard-module.js');
const { cloneData, buildSnapshot, FULL_WEEK_DATA, EMPTY_WEEK_DATA } =
  require('../helpers/test-data.js');

const STORAGE_KEY_WEEKLY = 'weeklyData';
const STORAGE_KEY_SNAPSHOTS = 'snapshots';

let dashboard;

// ---------------------------------------------------------------------------
// beforeEach / afterEach
// ---------------------------------------------------------------------------
beforeEach(() => {
  dashboard = loadDashboardModule();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  teardownDashboardDOM();
});

// ---------------------------------------------------------------------------
// saveToLocalStorage / loadFromLocalStorage
// ---------------------------------------------------------------------------
describe('saveToLocalStorage', () => {
  it('should persist weekly data to localStorage under the correct key', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);

    // Act
    dashboard.__setWeeklyData(data);
    dashboard.saveToLocalStorage();

    // Assert
    const raw = localStorage.getItem(STORAGE_KEY_WEEKLY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw)).toEqual(data);
  });

  it('should overwrite previously stored data', () => {
    // Arrange
    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    dashboard.saveToLocalStorage();
    const newData = cloneData(EMPTY_WEEK_DATA);

    // Act
    dashboard.__setWeeklyData(newData);
    dashboard.saveToLocalStorage();

    // Assert
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_WEEKLY))).toEqual(newData);
  });

  it('should store data that survives a round-trip serialisation', () => {
    // Arrange
    const original = cloneData(FULL_WEEK_DATA);

    // Act
    dashboard.__setWeeklyData(original);
    dashboard.saveToLocalStorage();
    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
    dashboard.loadFromLocalStorage();

    // Assert
    expect(dashboard.__getWeeklyData()).toEqual(original);
  });
});

describe('loadFromLocalStorage', () => {
  it('should leave the current state unchanged when no data has been stored', () => {
    const emptyWeek = cloneData(EMPTY_WEEK_DATA);
    dashboard.__setWeeklyData(emptyWeek);

    dashboard.loadFromLocalStorage();

    expect(dashboard.__getWeeklyData()).toEqual(emptyWeek);
  });

  it('should restore the stored data object when data exists', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    dashboard.__setWeeklyData(data);
    dashboard.saveToLocalStorage();
    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));

    // Act
    dashboard.loadFromLocalStorage();

    // Assert
    expect(dashboard.__getWeeklyData()).toEqual(data);
  });

  it('should preserve numeric types after serialisation round-trip', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    dashboard.__setWeeklyData(data);
    dashboard.saveToLocalStorage();
    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));

    // Act
    dashboard.loadFromLocalStorage();
    const result = dashboard.__getWeeklyData();

    // Assert – revenue, labor, hours, jobs must all be numbers
    Object.values(result).forEach(day => {
      expect(typeof day.revenue).toBe('number');
      expect(typeof day.labor).toBe('number');
      expect(typeof day.hours).toBe('number');
      expect(typeof day.jobs).toBe('number');
    });
  });
});

// ---------------------------------------------------------------------------
// getSnapshots
// ---------------------------------------------------------------------------
describe('getSnapshots', () => {
  it('should return an empty array when no snapshots exist', () => {
    expect(dashboard.getSnapshots()).toEqual([]);
  });

  it('should return all stored snapshots', () => {
    // Arrange
    const snap1 = buildSnapshot(FULL_WEEK_DATA);
    const snap2 = buildSnapshot(EMPTY_WEEK_DATA);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify([snap1, snap2]));

    // Act
    const result = dashboard.getSnapshots();

    // Assert
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// saveSnapshot
// ---------------------------------------------------------------------------
describe('saveSnapshot', () => {
  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  it('should add a new snapshot to localStorage', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    dashboard.__setWeeklyData(data);

    // Act
    dashboard.handleSaveSnapshot();

    // Assert
    expect(dashboard.getSnapshots()).toHaveLength(1);
  });

  it('should store a deep copy of weeklyData so later state changes do not corrupt the snapshot', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    dashboard.__setWeeklyData(data);
    dashboard.handleSaveSnapshot();

    // Act – replace the live application state after saving
    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));

    // Assert – snapshot must be unchanged
    const saved = dashboard.getSnapshots()[0];
    expect(saved.data.Monday.revenue).toBe(2500);
  });

  it('should accumulate multiple snapshots', () => {
    // Arrange
    jest.useFakeTimers();

    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    dashboard.handleSaveSnapshot();

    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:01.000Z'));
    dashboard.handleSaveSnapshot();

    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:02.000Z'));
    dashboard.handleSaveSnapshot();

    // Assert
    expect(dashboard.getSnapshots()).toHaveLength(3);
  });

  it('should use the ISO timestamp as the snapshot id', () => {
    // Arrange / Act
    jest.useFakeTimers();
    const timestamp = new Date('2025-01-01T00:00:00.000Z');
    jest.setSystemTime(timestamp);
    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    dashboard.handleSaveSnapshot();
    const snap = dashboard.getSnapshots()[0];

    expect(snap.id).toBe(timestamp.toISOString());
  });
});

// ---------------------------------------------------------------------------
// deleteSnapshot
// ---------------------------------------------------------------------------
describe('deleteSnapshot', () => {
  it('should remove the snapshot with the matching id', () => {
    // Arrange
    jest.useFakeTimers();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    dashboard.handleSaveSnapshot();
    const snap1 = dashboard.getSnapshots()[0];

    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:01.000Z'));
    dashboard.handleSaveSnapshot();
    const snap2 = dashboard.getSnapshots()[1];

    // Act
    dashboard.deleteSnapshot(snap1.id);

    // Assert
    const remaining = dashboard.getSnapshots();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(snap2.id);
  });

  it('should leave other snapshots intact when deleting one', () => {
    // Arrange – three snapshots
    jest.useFakeTimers();
    jest.spyOn(window, 'confirm').mockReturnValue(true);

    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
    dashboard.handleSaveSnapshot();
    const s1 = dashboard.getSnapshots()[0];

    dashboard.__setWeeklyData(cloneData(EMPTY_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:01.000Z'));
    dashboard.handleSaveSnapshot();

    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    jest.setSystemTime(new Date('2025-01-01T00:00:02.000Z'));
    dashboard.handleSaveSnapshot();

    // Act
    dashboard.deleteSnapshot(s1.id);

    // Assert
    expect(dashboard.getSnapshots()).toHaveLength(2);
  });

  it('should not throw when the id does not exist', () => {
    // Arrange
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    dashboard.handleSaveSnapshot();

    // Act & Assert
    expect(() => dashboard.deleteSnapshot('non-existent-id')).not.toThrow();
    expect(dashboard.getSnapshots()).toHaveLength(1);
  });

  it('should result in an empty list after deleting the only snapshot', () => {
    // Arrange
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    dashboard.__setWeeklyData(cloneData(FULL_WEEK_DATA));
    dashboard.handleSaveSnapshot();
    const snap = dashboard.getSnapshots()[0];

    // Act
    dashboard.deleteSnapshot(snap.id);

    // Assert
    expect(dashboard.getSnapshots()).toEqual([]);
  });
});
