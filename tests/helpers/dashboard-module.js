'use strict';

const { setupDashboardDOM, teardownDashboardDOM } = require('./dom-setup.js');

function loadDashboardModule() {
  jest.resetModules();
  setupDashboardDOM();
  const dashboard = require('../../script.js');
  document.dispatchEvent(new Event('DOMContentLoaded', { bubbles: true }));
  return dashboard;
}

module.exports = { loadDashboardModule, teardownDashboardDOM };
