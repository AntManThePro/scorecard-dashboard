/**
 * DOM setup utilities for scorecard dashboard unit and integration tests.
 *
 * Provides a minimal but complete replica of the HTML structure that
 * script.js expects so tests can load the module without null-reference errors.
 */

'use strict';

/**
 * Inject all DOM elements that script.js references at module-load time
 * and during runtime into document.body.  Call this before require()-ing
 * script.js inside a test.
 */
function setupDashboardDOM() {
  document.body.innerHTML = `
    <select id="userRole">
      <option value="admin" selected>Admin</option>
      <option value="editor">Editor</option>
      <option value="viewer">Viewer</option>
    </select>

    <select id="daySelect">
      <option value="Monday" selected>Monday</option>
      <option value="Tuesday">Tuesday</option>
      <option value="Wednesday">Wednesday</option>
      <option value="Thursday">Thursday</option>
      <option value="Friday">Friday</option>
      <option value="Saturday">Saturday</option>
      <option value="Sunday">Sunday</option>
    </select>

    <input id="revenueInput"       type="number" />
    <input id="laborInput"         type="number" />
    <input id="hoursInput"         type="number" />
    <input id="jobsCompletedInput" type="number" />

    <button id="addEntryBtn"></button>
    <button id="exportBtn"></button>
    <button id="saveBtn"></button>

    <table id="weeklyTable">
      <tbody  id="weeklyTableBody"></tbody>
      <tfoot  id="weeklyTableFoot"></tfoot>
    </table>

    <p id="totalRevenue">$0.00</p>
    <p id="avgLabor">0.0%</p>
    <p id="totalHours">0.0</p>
    <p id="totalJobs">0</p>
    <p id="avgRevenuePerJob">$0.00</p>
    <p id="laborEfficiency">$0.00/hr</p>

    <div id="bonusIndicator" class="bonus-indicator hidden"></div>
    <div id="revenueChart"></div>
    <div id="laborChart"></div>
    <div id="snapshotsList"></div>
    <div id="confettiContainer"></div>
  `;
}

/**
 * Tear down DOM and clear localStorage after each test.
 */
function teardownDashboardDOM() {
  document.body.innerHTML = '';
  localStorage.clear();
}

module.exports = { setupDashboardDOM, teardownDashboardDOM };
