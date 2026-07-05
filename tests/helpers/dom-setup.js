/**
 * Test storage utilities.
 */

/**
 * Clear localStorage between tests to prevent state leaking.
 */
export function clearStorage() {
  localStorage.clear();
  sessionStorage.clear();
}

/**
 * Seed localStorage with the provided weeklyData object.
 * @param {Object} weeklyData
 */
export function seedLocalStorage(weeklyData) {
  localStorage.setItem('weeklyData', JSON.stringify(weeklyData));
}
