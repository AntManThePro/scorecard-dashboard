/**
 * Unit tests for localStorage persistence helpers.
 *
 * These tests exercise the save/load/snapshot storage logic extracted from
 * script.js, using Jest's built-in jsdom localStorage mock.
 */

'use strict';

const { cloneData, buildSnapshot, FULL_WEEK_DATA, EMPTY_WEEK_DATA } =
  require('../helpers/test-data.js');

// ---------------------------------------------------------------------------
// Inline reference implementations (mirrors script.js saveToLocalStorage,
// loadFromLocalStorage, getSnapshots, handleSaveSnapshot, deleteSnapshot)
// ---------------------------------------------------------------------------

const STORAGE_KEY_WEEKLY = 'weeklyData';
const STORAGE_KEY_SNAPSHOTS = 'snapshots';

function saveToLocalStorage(weeklyData) {
  localStorage.setItem(STORAGE_KEY_WEEKLY, JSON.stringify(weeklyData));
}

function loadFromLocalStorage() {
  const saved = localStorage.getItem(STORAGE_KEY_WEEKLY);
  return saved ? JSON.parse(saved) : null;
}

function getSnapshots() {
  const snapshots = localStorage.getItem(STORAGE_KEY_SNAPSHOTS);
  return snapshots ? JSON.parse(snapshots) : [];
}

function saveSnapshot(weeklyData, metrics) {
  const timestamp = new Date().toISOString();
  const snapshots = getSnapshots();
  const id = timestamp;
  const snapshot = {
    id,
    date: new Date().toLocaleString(),
    data: JSON.parse(JSON.stringify(weeklyData)),
    metrics,
  };
  snapshots.push(snapshot);
  localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots));
  return snapshot;
}

function deleteSnapshot(id) {
  let snapshots = getSnapshots();
  snapshots = snapshots.filter(s => s.id !== id);
  localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify(snapshots));
}

// ---------------------------------------------------------------------------
// beforeEach / afterEach
// ---------------------------------------------------------------------------
beforeEach(() => {
  localStorage.clear();
});

// ---------------------------------------------------------------------------
// saveToLocalStorage / loadFromLocalStorage
// ---------------------------------------------------------------------------
describe('saveToLocalStorage', () => {
  it('should persist weekly data to localStorage under the correct key', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);

    // Act
    saveToLocalStorage(data);

    // Assert
    const raw = localStorage.getItem(STORAGE_KEY_WEEKLY);
    expect(raw).not.toBeNull();
    expect(JSON.parse(raw)).toEqual(data);
  });

  it('should overwrite previously stored data', () => {
    // Arrange
    saveToLocalStorage(cloneData(FULL_WEEK_DATA));
    const newData = cloneData(EMPTY_WEEK_DATA);

    // Act
    saveToLocalStorage(newData);

    // Assert
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY_WEEKLY))).toEqual(newData);
  });

  it('should store data that survives a round-trip serialisation', () => {
    // Arrange
    const original = cloneData(FULL_WEEK_DATA);

    // Act
    saveToLocalStorage(original);
    const loaded = loadFromLocalStorage();

    // Assert
    expect(loaded).toEqual(original);
  });
});

describe('loadFromLocalStorage', () => {
  it('should return null when no data has been stored', () => {
    expect(loadFromLocalStorage()).toBeNull();
  });

  it('should return the stored data object when data exists', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    saveToLocalStorage(data);

    // Act
    const result = loadFromLocalStorage();

    // Assert
    expect(result).toEqual(data);
  });

  it('should preserve numeric types after serialisation round-trip', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    saveToLocalStorage(data);

    // Act
    const result = loadFromLocalStorage();

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
    expect(getSnapshots()).toEqual([]);
  });

  it('should return all stored snapshots', () => {
    // Arrange
    const snap1 = buildSnapshot(FULL_WEEK_DATA);
    const snap2 = buildSnapshot(EMPTY_WEEK_DATA);
    localStorage.setItem(STORAGE_KEY_SNAPSHOTS, JSON.stringify([snap1, snap2]));

    // Act
    const result = getSnapshots();

    // Assert
    expect(result).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// saveSnapshot
// ---------------------------------------------------------------------------
describe('saveSnapshot', () => {
  it('should add a new snapshot to localStorage', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    const metrics = { totalRevenue: 18900, avgLabor: 29 };

    // Act
    saveSnapshot(data, metrics);

    // Assert
    expect(getSnapshots()).toHaveLength(1);
  });

  it('should store a deep copy of weeklyData so later mutations do not corrupt the snapshot', () => {
    // Arrange
    const data = cloneData(FULL_WEEK_DATA);
    const metrics = { totalRevenue: 18900 };
    saveSnapshot(data, metrics);

    // Act – mutate the original
    data.Monday.revenue = 99999;

    // Assert – snapshot must be unchanged
    const saved = getSnapshots()[0];
    expect(saved.data.Monday.revenue).toBe(2500);
  });

  it('should accumulate multiple snapshots', () => {
    // Arrange
    const metrics = { totalRevenue: 0 };
    saveSnapshot(cloneData(FULL_WEEK_DATA),  metrics);
    saveSnapshot(cloneData(EMPTY_WEEK_DATA), metrics);
    saveSnapshot(cloneData(FULL_WEEK_DATA),  metrics);

    // Assert
    expect(getSnapshots()).toHaveLength(3);
  });

  it('should include an ISO timestamp as the snapshot id', () => {
    // Arrange / Act
    const snap = saveSnapshot(cloneData(FULL_WEEK_DATA), {});

    // Assert – id must begin with a parseable ISO date string
    const isoPrefix = snap.id.split('-').slice(0, 3).join('-');
    expect(isoPrefix).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });
});

// ---------------------------------------------------------------------------
// deleteSnapshot
// ---------------------------------------------------------------------------
describe('deleteSnapshot', () => {
  it('should remove the snapshot with the matching id', () => {
    // Arrange
    const snap1 = saveSnapshot(cloneData(FULL_WEEK_DATA),  { totalRevenue: 18900 });
    const snap2 = saveSnapshot(cloneData(EMPTY_WEEK_DATA), { totalRevenue: 0 });

    // Act
    deleteSnapshot(snap1.id);

    // Assert
    const remaining = getSnapshots();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(snap2.id);
  });

  it('should leave other snapshots intact when deleting one', () => {
    // Arrange – three snapshots
    const s1 = saveSnapshot(cloneData(FULL_WEEK_DATA), {});
    saveSnapshot(cloneData(EMPTY_WEEK_DATA), {});
    saveSnapshot(cloneData(FULL_WEEK_DATA), {});

    // Act
    deleteSnapshot(s1.id);

    // Assert
    expect(getSnapshots()).toHaveLength(2);
  });

  it('should not throw when the id does not exist', () => {
    // Arrange
    saveSnapshot(cloneData(FULL_WEEK_DATA), {});

    // Act & Assert
    expect(() => deleteSnapshot('non-existent-id')).not.toThrow();
    expect(getSnapshots()).toHaveLength(1);
  });

  it('should result in an empty list after deleting the only snapshot', () => {
    // Arrange
    const snap = saveSnapshot(cloneData(FULL_WEEK_DATA), {});

    // Act
    deleteSnapshot(snap.id);

    // Assert
    expect(getSnapshots()).toEqual([]);
  });
});
