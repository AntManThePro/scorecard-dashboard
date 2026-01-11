// Application State
let weeklyData = {
    Monday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    Tuesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    Wednesday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    Thursday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    Friday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    Saturday: { revenue: 0, labor: 0, hours: 0, jobs: 0 },
    Sunday: { revenue: 0, labor: 0, hours: 0, jobs: 0 }
};

let currentRole = 'admin';

// DOM Elements
const userRoleSelect = document.getElementById('userRole');
const daySelect = document.getElementById('daySelect');
const revenueInput = document.getElementById('revenueInput');
const laborInput = document.getElementById('laborInput');
const hoursInput = document.getElementById('hoursInput');
const jobsCompletedInput = document.getElementById('jobsCompletedInput');
const addEntryBtn = document.getElementById('addEntryBtn');
const exportBtn = document.getElementById('exportBtn');
const saveBtn = document.getElementById('saveBtn');
const weeklyTableBody = document.getElementById('weeklyTableBody');
const weeklyTableFoot = document.getElementById('weeklyTableFoot');

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    setupEventListeners();
    updateUI();
});

// Event Listeners
function setupEventListeners() {
    userRoleSelect.addEventListener('change', handleRoleChange);
    addEntryBtn.addEventListener('click', handleAddEntry);
    exportBtn.addEventListener('click', handleExport);
    saveBtn.addEventListener('click', handleSaveSnapshot);
    laborInput.addEventListener('input', handleLaborInputChange);
}

// Handle Role Change
function handleRoleChange(e) {
    currentRole = e.target.value;
    updateUIBasedOnRole();
}

// Update UI Based on Role
function updateUIBasedOnRole() {
    const isViewer = currentRole === 'viewer';
    const canEdit = currentRole === 'admin' || currentRole === 'editor';

    // Disable inputs for viewers
    daySelect.disabled = isViewer;
    revenueInput.disabled = isViewer;
    laborInput.disabled = isViewer;
    hoursInput.disabled = isViewer;
    jobsCompletedInput.disabled = isViewer;
    addEntryBtn.disabled = isViewer;

    // Only admins can save and export
    saveBtn.disabled = currentRole !== 'admin';
    exportBtn.disabled = currentRole !== 'admin';

    // Update delete buttons in table
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
        btn.disabled = !canEdit;
    });
}

// Handle Labor Input Change (Color Coding)
function handleLaborInputChange(e) {
    const value = parseFloat(e.target.value);
    if (value > 30) {
        laborInput.classList.add('high-labor');
    } else {
        laborInput.classList.remove('high-labor');
    }
}

// Handle Add Entry
function handleAddEntry() {
    const day = daySelect.value;
    const revenue = parseFloat(revenueInput.value) || 0;
    const labor = parseFloat(laborInput.value) || 0;
    const hours = parseFloat(hoursInput.value) || 0;
    const jobs = parseInt(jobsCompletedInput.value) || 0;

    // Update data
    weeklyData[day] = { revenue, labor, hours, jobs };

    // Clear inputs
    revenueInput.value = '';
    laborInput.value = '';
    hoursInput.value = '';
    jobsCompletedInput.value = '';
    laborInput.classList.remove('high-labor');

    // Check for confetti trigger (100% job completion)
    if (jobs > 0 && calculateWeeklyMetrics().totalJobs === calculateMaxPossibleJobs()) {
        triggerConfetti();
    }

    // Update UI
    updateUI();
    saveToLocalStorage();
}

// Calculate Weekly Metrics
function calculateWeeklyMetrics() {
    const days = Object.keys(weeklyData);
    let totalRevenue = 0;
    let totalLabor = 0;
    let totalHours = 0;
    let totalJobs = 0;
    let daysWithData = 0;

    days.forEach(day => {
        const data = weeklyData[day];
        totalRevenue += data.revenue;
        totalHours += data.hours;
        totalJobs += data.jobs;
        
        if (data.revenue > 0 || data.hours > 0 || data.jobs > 0) {
            totalLabor += data.labor;
            daysWithData++;
        }
    });

    const avgLabor = daysWithData > 0 ? totalLabor / daysWithData : 0;
    const avgRevenuePerJob = totalJobs > 0 ? totalRevenue / totalJobs : 0;
    const laborEfficiency = totalHours > 0 ? totalRevenue / totalHours : 0;

    return {
        totalRevenue,
        avgLabor,
        totalHours,
        totalJobs,
        avgRevenuePerJob,
        laborEfficiency
    };
}

// Calculate Max Possible Jobs (simple heuristic)
function calculateMaxPossibleJobs() {
    return 7; // Assuming at least 1 job per day = 100%
}

// Update UI
function updateUI() {
    updateTable();
    updateMetrics();
    updateCharts();
    updateBonusIndicator();
    updateUIBasedOnRole();
}

// Update Table
function updateTable() {
    const days = Object.keys(weeklyData);
    weeklyTableBody.innerHTML = '';

    days.forEach(day => {
        const data = weeklyData[day];
        const revenuePerJob = data.jobs > 0 ? (data.revenue / data.jobs).toFixed(2) : '0.00';
        
        const row = document.createElement('tr');
        
        // Apply color coding to labor cell
        const laborClass = data.labor > 30 ? 'high-labor' : (data.labor < 32 && data.labor > 0 ? 'good-labor' : '');
        
        row.innerHTML = `
            <td><strong>${day}</strong></td>
            <td>$${data.revenue.toFixed(2)}</td>
            <td class="${laborClass}">${data.labor.toFixed(1)}%</td>
            <td>${data.hours.toFixed(1)}</td>
            <td>${data.jobs}</td>
            <td>$${revenuePerJob}</td>
            <td>
                <button class="btn btn-delete" onclick="deleteEntry('${day}')" ${currentRole === 'viewer' ? 'disabled' : ''}>
                    🗑️ Delete
                </button>
            </td>
        `;
        
        weeklyTableBody.appendChild(row);
    });

    // Update footer with totals/averages
    updateTableFooter();
}

// Update Table Footer
function updateTableFooter() {
    const metrics = calculateWeeklyMetrics();
    weeklyTableFoot.innerHTML = `
        <tr>
            <td><strong>Totals/Averages</strong></td>
            <td><strong>$${metrics.totalRevenue.toFixed(2)}</strong></td>
            <td><strong>${metrics.avgLabor.toFixed(1)}%</strong></td>
            <td><strong>${metrics.totalHours.toFixed(1)}</strong></td>
            <td><strong>${metrics.totalJobs}</strong></td>
            <td><strong>$${metrics.avgRevenuePerJob.toFixed(2)}</strong></td>
            <td></td>
        </tr>
    `;
}

// Delete Entry
function deleteEntry(day) {
    if (currentRole === 'viewer') return;
    
    if (confirm(`Delete data for ${day}?`)) {
        weeklyData[day] = { revenue: 0, labor: 0, hours: 0, jobs: 0 };
        updateUI();
        saveToLocalStorage();
    }
}

// Update Metrics
function updateMetrics() {
    const metrics = calculateWeeklyMetrics();
    
    document.getElementById('totalRevenue').textContent = `$${metrics.totalRevenue.toFixed(2)}`;
    document.getElementById('avgLabor').textContent = `${metrics.avgLabor.toFixed(1)}%`;
    document.getElementById('totalHours').textContent = metrics.totalHours.toFixed(1);
    document.getElementById('totalJobs').textContent = metrics.totalJobs;
    document.getElementById('avgRevenuePerJob').textContent = `$${metrics.avgRevenuePerJob.toFixed(2)}`;
    document.getElementById('laborEfficiency').textContent = `$${metrics.laborEfficiency.toFixed(2)}/hr`;
}

// Update Bonus Indicator
function updateBonusIndicator() {
    const metrics = calculateWeeklyMetrics();
    const bonusIndicator = document.getElementById('bonusIndicator');
    
    if (metrics.avgLabor > 0 && metrics.avgLabor < 32) {
        bonusIndicator.classList.remove('hidden');
    } else {
        bonusIndicator.classList.add('hidden');
    }
}

// Initialize Charts with CSS/HTML
function initializeCharts() {
    updateCharts();
}

// Update Charts
function updateCharts() {
    updateRevenueChart();
    updateLaborChart();
}

// Update Revenue Chart (Bar Chart)
function updateRevenueChart() {
    const revenueChartEl = document.getElementById('revenueChart');
    const days = Object.keys(weeklyData);
    const maxRevenue = Math.max(...days.map(day => weeklyData[day].revenue), 1);
    
    revenueChartEl.innerHTML = '';
    
    days.forEach(day => {
        const data = weeklyData[day];
        const percentage = (data.revenue / maxRevenue) * 100;
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = `${percentage}%`;
        
        const label = document.createElement('div');
        label.className = 'bar-label';
        label.textContent = day.substring(0, 3);
        
        const value = document.createElement('div');
        value.className = 'bar-value';
        value.textContent = data.revenue > 0 ? `$${data.revenue.toFixed(0)}` : '';
        
        bar.appendChild(label);
        bar.appendChild(value);
        revenueChartEl.appendChild(bar);
    });
}

// Update Labor Chart (Line Chart with SVG)
function updateLaborChart() {
    const laborChartEl = document.getElementById('laborChart');
    const days = Object.keys(weeklyData);
    const width = laborChartEl.offsetWidth - 32;
    const height = 220;
    const padding = 30;
    
    // Create SVG
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'line-chart-svg');
    svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    // Draw grid lines
    for (let i = 0; i <= 4; i++) {
        const y = padding + (height - 2 * padding) * i / 4;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', padding);
        line.setAttribute('y1', y);
        line.setAttribute('x2', width - padding);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#e5e7eb');
        line.setAttribute('stroke-width', '1');
        svg.appendChild(line);
        
        // Add y-axis labels
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', '5');
        text.setAttribute('y', y + 4);
        text.setAttribute('fill', '#6b7280');
        text.setAttribute('font-size', '10');
        text.textContent = `${100 - (i * 25)}%`;
        svg.appendChild(text);
    }
    
    // Draw target line at 32%
    const targetY = padding + (height - 2 * padding) * (1 - 0.32);
    const targetLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    targetLine.setAttribute('x1', padding);
    targetLine.setAttribute('y1', targetY);
    targetLine.setAttribute('x2', width - padding);
    targetLine.setAttribute('y2', targetY);
    targetLine.setAttribute('stroke', '#10b981');
    targetLine.setAttribute('stroke-width', '2');
    targetLine.setAttribute('stroke-dasharray', '5,5');
    svg.appendChild(targetLine);
    
    // Plot data points and lines
    const stepX = (width - 2 * padding) / (days.length - 1);
    let pathD = '';
    
    days.forEach((day, index) => {
        const data = weeklyData[day];
        const x = padding + stepX * index;
        const y = padding + (height - 2 * padding) * (1 - data.labor / 100);
        
        // Draw line
        if (index === 0) {
            pathD = `M ${x} ${y}`;
        } else {
            pathD += ` L ${x} ${y}`;
        }
        
        // Draw point
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);
        circle.setAttribute('r', '4');
        circle.setAttribute('fill', data.labor > 30 ? '#ef4444' : '#2563eb');
        circle.setAttribute('stroke', 'white');
        circle.setAttribute('stroke-width', '2');
        svg.appendChild(circle);
        
        // Add day label
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', height - 5);
        text.setAttribute('fill', '#6b7280');
        text.setAttribute('font-size', '9');
        text.setAttribute('text-anchor', 'middle');
        text.textContent = day.substring(0, 3);
        svg.appendChild(text);
    });
    
    // Draw the path
    if (pathD) {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathD);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', '#ef4444');
        path.setAttribute('stroke-width', '2');
        svg.insertBefore(path, svg.firstChild);
    }
    
    laborChartEl.innerHTML = '';
    laborChartEl.appendChild(svg);
}

// Handle Export to CSV
function handleExport() {
    if (currentRole !== 'admin') {
        alert('Only admins can export data.');
        return;
    }

    const days = Object.keys(weeklyData);
    let csv = 'Day,Revenue ($),Labor (%),Hours,Jobs,Revenue per Job ($)\n';
    
    days.forEach(day => {
        const data = weeklyData[day];
        const revenuePerJob = data.jobs > 0 ? (data.revenue / data.jobs).toFixed(2) : '0.00';
        csv += `${day},${data.revenue.toFixed(2)},${data.labor.toFixed(1)},${data.hours.toFixed(1)},${data.jobs},${revenuePerJob}\n`;
    });

    // Add summary row
    const metrics = calculateWeeklyMetrics();
    csv += `\nTotals/Averages,${metrics.totalRevenue.toFixed(2)},${metrics.avgLabor.toFixed(1)},${metrics.totalHours.toFixed(1)},${metrics.totalJobs},${metrics.avgRevenuePerJob.toFixed(2)}\n`;
    csv += `\nMetrics\n`;
    csv += `Labor Efficiency,${metrics.laborEfficiency.toFixed(2)} $/hr\n`;
    csv += `Bonus Eligible,${metrics.avgLabor < 32 && metrics.avgLabor > 0 ? 'Yes' : 'No'}\n`;

    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scorecard-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}

// Handle Save Snapshot
function handleSaveSnapshot() {
    if (currentRole !== 'admin') {
        alert('Only admins can save snapshots.');
        return;
    }

    const timestamp = new Date().toISOString();
    const snapshots = getSnapshots();
    
    const snapshot = {
        id: timestamp,
        date: new Date().toLocaleString(),
        data: JSON.parse(JSON.stringify(weeklyData)),
        metrics: calculateWeeklyMetrics()
    };

    snapshots.push(snapshot);
    localStorage.setItem('snapshots', JSON.stringify(snapshots));
    
    displaySnapshots();
    alert('Snapshot saved successfully!');
}

// Get Snapshots from LocalStorage
function getSnapshots() {
    const snapshots = localStorage.getItem('snapshots');
    return snapshots ? JSON.parse(snapshots) : [];
}

// Display Snapshots
function displaySnapshots() {
    const snapshotsList = document.getElementById('snapshotsList');
    const snapshots = getSnapshots();

    if (snapshots.length === 0) {
        snapshotsList.innerHTML = '<div class="empty-state">No snapshots saved yet.</div>';
        return;
    }

    snapshotsList.innerHTML = '';
    
    // Display in reverse order (newest first)
    snapshots.reverse().forEach(snapshot => {
        const snapshotItem = document.createElement('div');
        snapshotItem.className = 'snapshot-item';
        snapshotItem.innerHTML = `
            <div class="snapshot-header">
                <div class="snapshot-title">📸 Snapshot</div>
                <div class="snapshot-date">${snapshot.date}</div>
            </div>
            <div class="snapshot-metrics">
                Revenue: $${snapshot.metrics.totalRevenue.toFixed(2)} | 
                Labor: ${snapshot.metrics.avgLabor.toFixed(1)}% | 
                Jobs: ${snapshot.metrics.totalJobs}
            </div>
            <div class="snapshot-actions">
                <button class="btn btn-load" onclick="loadSnapshot('${snapshot.id}')">
                    📂 Load
                </button>
                <button class="btn btn-delete" onclick="deleteSnapshot('${snapshot.id}')">
                    🗑️ Delete
                </button>
            </div>
        `;
        snapshotsList.appendChild(snapshotItem);
    });
}

// Load Snapshot
function loadSnapshot(id) {
    const snapshots = getSnapshots();
    const snapshot = snapshots.find(s => s.id === id);
    
    if (snapshot) {
        weeklyData = JSON.parse(JSON.stringify(snapshot.data));
        updateUI();
        saveToLocalStorage();
        alert('Snapshot loaded successfully!');
    }
}

// Delete Snapshot
function deleteSnapshot(id) {
    if (confirm('Delete this snapshot?')) {
        let snapshots = getSnapshots();
        snapshots = snapshots.filter(s => s.id !== id);
        localStorage.setItem('snapshots', JSON.stringify(snapshots));
        displaySnapshots();
    }
}

// Save to LocalStorage
function saveToLocalStorage() {
    localStorage.setItem('weeklyData', JSON.stringify(weeklyData));
}

// Load from LocalStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem('weeklyData');
    if (saved) {
        weeklyData = JSON.parse(saved);
    }
    displaySnapshots();
}

// Trigger Confetti
function triggerConfetti() {
    const container = document.getElementById('confettiContainer');
    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    const pieceCount = 100;
    
    for (let i = 0; i < pieceCount; i++) {
        setTimeout(() => {
            const piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 0.5 + 's';
            piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            const size = Math.random() * 10 + 5;
            piece.style.width = size + 'px';
            piece.style.height = size + 'px';
            
            container.appendChild(piece);
            
            // Remove after animation
            setTimeout(() => {
                piece.remove();
            }, 4000);
        }, i * 20);
    }
}

// Make functions globally available for onclick handlers
window.deleteEntry = deleteEntry;
window.loadSnapshot = loadSnapshot;
window.deleteSnapshot = deleteSnapshot;
