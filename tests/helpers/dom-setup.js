/**
 * DOM setup utilities for tests that require browser-like environment.
 *
 * Use setupDashboardDOM() before importing app.js to satisfy the module-level
 * document.getElementById calls that run on load.
 */

/**
 * Insert the minimum HTML skeleton required by app.js / script.js into
 * the JSDOM document. Call this at the top of a beforeEach/beforeAll block.
 */
export function setupDashboardDOM() {
  document.body.innerHTML = `
    <select id="userRole">
      <option value="admin">Admin</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>

    <select id="daySelect">
      <option value="Monday">Monday</option>
      <option value="Tuesday">Tuesday</option>
      <option value="Wednesday">Wednesday</option>
      <option value="Thursday">Thursday</option>
      <option value="Friday">Friday</option>
      <option value="Saturday">Saturday</option>
      <option value="Sunday">Sunday</option>
    </select>

    <input id="revenueInput" type="number" />
    <input id="laborInput"   type="number" />
    <input id="hoursInput"   type="number" />
    <input id="jobsCompletedInput" type="number" />

    <button id="addEntryBtn">Add Entry</button>
    <button id="exportBtn">Export</button>
    <button id="saveBtn">Save</button>

    <tbody id="weeklyTableBody"></tbody>
    <tfoot id="weeklyTableFoot"></tfoot>

    <div id="totalRevenue"></div>
    <div id="avgLabor"></div>
    <div id="totalHours"></div>
    <div id="totalJobs"></div>
    <div id="avgRevenuePerJob"></div>
    <div id="laborEfficiency"></div>

    <div id="bonusIndicator" class="hidden"></div>
    <div id="revenueChart"></div>
    <div id="laborChart"></div>
    <div id="snapshotsList"></div>
    <div id="confettiContainer"></div>

    <!-- status/token fields used by repos.js -->
    <input id="githubToken" type="text" />
    <button id="loadReposBtn">Load Repos</button>
    <button id="makeAllPrivateBtn">Make All Private</button>
    <div id="repoSection" style="display:none"></div>
    <div id="repoContainer"></div>
    <div id="statusMessage"></div>
  `;
}

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
