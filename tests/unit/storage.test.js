/**
 * Unit tests for localStorage persistence logic.
 *
 * These tests exercise the serialisation / deserialisation cycle used by
 * saveToLocalStorage() and loadFromLocalStorage() in app.js, as well as the
 * snapshot storage helpers getSnapshots() / handleSaveSnapshot().
 *
 * The JSDOM environment (jest-environment-jsdom) provides localStorage and
 * sessionStorage stubs.
 */

import {
  FULL_WEEK_DATA,
  EMPTY_WEEK_DATA,
} from '../helpers/test-data.js';
import { clearStorage, seedLocalStorage } from '../helpers/dom-setup.js';

// ---------------------------------------------------------------------------
// Implementations that mirror app.js storage helpers
// (Kept pure to test the logic independently of DOM bootstrap issues)
// ---------------------------------------------------------------------------

function saveWeeklyData(data) {
  localStorage.setItem('weeklyData', JSON.stringify(data));
}

function loadWeeklyData() {
  const saved = localStorage.getItem('weeklyData');
  return saved ? JSON.parse(saved) : null;
}

function saveSnapshots(snapshots) {
  localStorage.setItem('snapshots', JSON.stringify(snapshots));
}

function loadSnapshots() {
  const saved = localStorage.getItem('snapshots');
  return saved ? JSON.parse(saved) : [];
}

function createSnapshot(weeklyData, metrics) {
  const timestamp = new Date().toISOString();
  return {
    id:      timestamp,
    date:    new Date().toLocaleString(),
    data:    JSON.parse(JSON.stringify(weeklyData)),
    metrics: metrics,
  };
}

// ---------------------------------------------------------------------------
// Weekly data persistence
// ---------------------------------------------------------------------------
describe('Weekly data – localStorage persistence', () => {
  beforeEach(clearStorage);

  it('should return null when nothing has been saved yet', () => {
    expect(loadWeeklyData()).toBeNull();
  });

  it('should persist and retrieve weeklyData correctly', () => {
    saveWeeklyData(FULL_WEEK_DATA);
    const loaded = loadWeeklyData();
    expect(loaded).toEqual(FULL_WEEK_DATA);
  });

  it('should persist empty weeklyData correctly', () => {
    saveWeeklyData(EMPTY_WEEK_DATA);
    const loaded = loadWeeklyData();
    expect(loaded).toEqual(EMPTY_WEEK_DATA);
  });

  it('should overwrite previously saved data', () => {
    saveWeeklyData(FULL_WEEK_DATA);
    saveWeeklyData(EMPTY_WEEK_DATA);
    const loaded = loadWeeklyData();
    expect(loaded).toEqual(EMPTY_WEEK_DATA);
  });

  it('should survive a JSON round-trip (values are equal but not same reference)', () => {
    saveWeeklyData(FULL_WEEK_DATA);
    const loaded = loadWeeklyData();
    expect(loaded).not.toBe(FULL_WEEK_DATA); // different reference
    expect(loaded).toEqual(FULL_WEEK_DATA);  // same values
  });

  it('should preserve floating-point revenue values', () => {
    const data = {
      Monday: { revenue: 1234.56, labor: 27.5, hours: 7.25, jobs: 2 },
      Tuesday:   { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Thursday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Friday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Saturday:  { revenue: 0, labor: 0, hours: 0, jobs: 0 },
      Sunday:    { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    };
    saveWeeklyData(data);
    const loaded = loadWeeklyData();
    expect(loaded.Monday.revenue).toBe(1234.56);
    expect(loaded.Monday.labor).toBe(27.5);
  });
});

// ---------------------------------------------------------------------------
// Snapshot storage
// ---------------------------------------------------------------------------
describe('Snapshot storage', () => {
  beforeEach(clearStorage);

  it('should return an empty array when no snapshots are saved', () => {
    expect(loadSnapshots()).toEqual([]);
  });

  it('should save and retrieve a single snapshot', () => {
    const snap = createSnapshot(FULL_WEEK_DATA, { totalRevenue: 16500, avgLabor: 24.7 });
    saveSnapshots([snap]);
    const loaded = loadSnapshots();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].data).toEqual(FULL_WEEK_DATA);
  });

  it('should save and retrieve multiple snapshots in order', () => {
    const snap1 = createSnapshot(FULL_WEEK_DATA,  { totalRevenue: 16500 });
    const snap2 = createSnapshot(EMPTY_WEEK_DATA, { totalRevenue: 0 });
    saveSnapshots([snap1, snap2]);
    const loaded = loadSnapshots();
    expect(loaded).toHaveLength(2);
    expect(loaded[0].data).toEqual(FULL_WEEK_DATA);
    expect(loaded[1].data).toEqual(EMPTY_WEEK_DATA);
  });

  it('should be able to delete a snapshot by filtering on id', () => {
    const snap1 = { id: 'snap-001', date: '1/1/2025', data: JSON.parse(JSON.stringify(FULL_WEEK_DATA)),  metrics: { totalRevenue: 16500 } };
    const snap2 = { id: 'snap-002', date: '1/2/2025', data: JSON.parse(JSON.stringify(EMPTY_WEEK_DATA)), metrics: { totalRevenue: 0 } };
    saveSnapshots([snap1, snap2]);

    // Simulate deleteSnapshot(snap1.id)
    let snaps = loadSnapshots();
    snaps = snaps.filter(s => s.id !== snap1.id);
    saveSnapshots(snaps);

    const remaining = loadSnapshots();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].data).toEqual(EMPTY_WEEK_DATA);
  });

  it('should store a deep copy of weeklyData in the snapshot', () => {
    const original = { Monday: { revenue: 500, labor: 25, hours: 4, jobs: 1 } };
    const snap = createSnapshot(original, {});
    // Mutate original after snapshot – snapshot should not be affected
    original.Monday.revenue = 9999;
    expect(snap.data.Monday.revenue).toBe(500);
  });

  it('should store snapshot id as a valid ISO timestamp string', () => {
    const snap = createSnapshot(FULL_WEEK_DATA, {});
    expect(() => new Date(snap.id)).not.toThrow();
    expect(new Date(snap.id).toISOString()).toBe(snap.id);
  });

  it('should find a snapshot by id (simulating loadSnapshot)', () => {
    const snap1 = { id: 'snap-A', date: '1/1/2025', data: JSON.parse(JSON.stringify(FULL_WEEK_DATA)),  metrics: {} };
    const snap2 = { id: 'snap-B', date: '1/2/2025', data: JSON.parse(JSON.stringify(EMPTY_WEEK_DATA)), metrics: {} };
    saveSnapshots([snap1, snap2]);

    const snaps = loadSnapshots();
    const found = snaps.find(s => s.id === snap2.id);
    expect(found).toBeDefined();
    expect(found.data).toEqual(EMPTY_WEEK_DATA);
  });
});

// ---------------------------------------------------------------------------
// seedLocalStorage helper (from dom-setup.js)
// ---------------------------------------------------------------------------
describe('seedLocalStorage helper', () => {
  beforeEach(clearStorage);

  it('should write weeklyData so loadWeeklyData returns it', () => {
    seedLocalStorage(FULL_WEEK_DATA);
    expect(loadWeeklyData()).toEqual(FULL_WEEK_DATA);
  });
});
