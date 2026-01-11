![GitHub Pages](https://img.shields.io/github/deployments/AntManThePro/scorecard-dashboard/github-pages?label=Deployed%20to%20GitHub%20Pages&logo=github&style=flat-square)
# Crew Performance Scorecard Dashboard

An interactive, mobile-first web application for tracking daily and weekly crew performance metrics.

## Features

### Core Functionality
- **Daily Entry System**: Input revenue, labor %, hours, and jobs completed for each day of the week
- **Automatic Calculations**: 
  - Weekly totals and averages
  - Revenue per job
  - Labor efficiency ($/hour)
  - Average labor percentage
- **Real-time Updates**: All metrics update automatically as data is entered

### Role-Based Access Control
- **Admin**: Full access to all features including edit, save, and export
- **Editor**: Can edit and view data, but cannot save snapshots or export
- **Viewer**: Read-only access to all data and visualizations

### Data Visualization
- **Revenue Trend Chart**: Bar chart showing daily revenue across the week
- **Labor % Trend Chart**: Line chart tracking labor percentage with target indicator (32%)
- Both charts update dynamically as data changes

### Smart Features
- **Color Coding**: 
  - Labor % > 30% = Red highlight (warning)
  - Labor % < 32% = Green highlight (good performance)
  - Input fields change color while typing based on thresholds
- **Bonus Logic**: Displays bonus eligibility indicator when average labor % is below 32%
- **Confetti Animation**: Celebrates when job completion reaches 100% (7 jobs for the week)

### Data Management
- **localStorage Persistence**: All data is automatically saved to browser storage
- **Snapshot System**: Admins can save weekly snapshots with timestamps
- **Load/Delete Snapshots**: Restore previous weeks' data or remove old snapshots
- **CSV Export**: Export weekly data with full metrics to CSV file

### Mobile-First Design
- Responsive layout optimized for mobile devices (375px+)
- Tablet-friendly (640px+)
- Desktop-optimized (1024px+)
- Touch-friendly interface elements

## Technology Stack

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern responsive design with CSS Grid and Flexbox
- **Vanilla JavaScript**: No frameworks - pure ES6+ JavaScript
- **SVG**: Custom charts using native SVG rendering
- **localStorage API**: Client-side data persistence

## Getting Started

1. Clone the repository
2. Open `index.html` in a modern web browser
3. No build process or dependencies required!

## Usage

### Adding Daily Data
1. Select the day of the week
2. Enter revenue, labor %, hours, and jobs completed
3. Click "Add Entry"
4. Data automatically saves and all metrics update

### Managing Snapshots
1. Enter a complete week of data
2. Click "Save Snapshot" (Admin only)
3. View saved snapshots in the "Saved Snapshots" section
4. Load or delete snapshots as needed

### Exporting Data
1. Click "Export CSV" button (Admin only)
2. CSV file downloads with complete weekly data and metrics

### Role Switching
1. Use the role selector in the header
2. Interface adapts based on selected role
3. Buttons and inputs enable/disable accordingly

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

See LICENSE file for details.

## Screenshots

![Dashboard Overview](https://github.com/user-attachments/assets/7f2be7e5-a52a-42f9-829e-41410e672888)
![Mobile View](https://github.com/user-attachments/assets/edefc313-a43f-41b2-90fe-1425f1e0acd5)
