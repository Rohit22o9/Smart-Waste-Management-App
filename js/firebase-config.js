// Firebase Configuration (Placeholder for actual ESP32/Firebase setup)
// To hook up real Firebase RTDB or Firestore, replace this config.

const firebaseConfig = {
    databaseURL: "https://econovasmartbin-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Mock Data Service to simulate Firebase for now.
const MockDB = {
    bins: [
        { id: "BIN-001", sector: "School", location: "Central Campus Dr", lat: 28.6139, lng: 77.2090, fillLevel: 85, lastUpdated: "Connecting...", status: "full", temp: 0, hum: 0, isIoT: true },
        { id: "BIN-002", sector: "Office", location: "Tech Plaza East", lat: 28.6145, lng: 77.2080, fillLevel: 45, lastUpdated: "12 mins ago", status: "medium" },
        { id: "BIN-003", sector: "Industrial", location: "Warehouse Block C", lat: 28.6150, lng: 77.2070, fillLevel: 10, lastUpdated: "2 mins ago", status: "empty" },
        { id: "BIN-004", sector: "Public", location: "City Square Mall", lat: 28.6160, lng: 77.2100, fillLevel: 95, lastUpdated: "1 min ago", status: "full" },
        { id: "BIN-005", sector: "School", location: "Main Library", lat: 28.6130, lng: 77.2110, fillLevel: 60, lastUpdated: "5 mins ago", status: "medium" },
        { id: "BIN-006", sector: "Public", location: "Kartavya Path", lat: 28.6125, lng: 77.2125, fillLevel: 72, lastUpdated: "Just now", status: "medium" },
        { id: "BIN-007", sector: "Office", location: "Delhi Gate St", lat: 28.6100, lng: 77.2100, fillLevel: 31, lastUpdated: "8 mins ago", status: "empty" },
        { id: "BIN-008", sector: "Industrial", location: "Rouse Ave", lat: 28.6180, lng: 77.2150, fillLevel: 88, lastUpdated: "4 mins ago", status: "full" },
        { id: "BIN-009", sector: "Public", location: "Mandi House", lat: 28.6165, lng: 77.2180, fillLevel: 22, lastUpdated: "12 mins ago", status: "empty" },
        { id: "BIN-010", sector: "Office", location: "Connaught Place", lat: 28.6200, lng: 77.2100, fillLevel: 55, lastUpdated: "3 mins ago", status: "medium" },
        { id: "BIN-011", sector: "School", location: "Shastri Bhawan", lat: 28.6140, lng: 77.2150, fillLevel: 68, lastUpdated: "Just now", status: "medium" },
        { id: "BIN-012", sector: "Public", location: "Indira Chowk", lat: 28.6210, lng: 77.2140, fillLevel: 42, lastUpdated: "7 mins ago", status: "medium" },
        { id: "BIN-013", sector: "Industrial", location: "Minto Rd", lat: 28.6250, lng: 77.2180, fillLevel: 91, lastUpdated: "1 min ago", status: "full" },
        { id: "BIN-014", sector: "Office", location: "Barakhamba", lat: 28.6220, lng: 77.2220, fillLevel: 15, lastUpdated: "20 mins ago", status: "empty" },
        { id: "BIN-015", sector: "Public", location: "Janpath Market", lat: 28.6180, lng: 77.2120, fillLevel: 79, lastUpdated: "Just now", status: "medium" }
    ],
    alerts: [
        { id: 1, type: "critical", msg: "BIN-004 is critically full (95%)", time: "2 mins ago" },
        { id: 2, type: "warning", msg: "BIN-001 reached 85% capacity", time: "10 mins ago" },
        { id: 3, type: "critical", msg: "Sensor Failure on BIN-008", time: "1 hr ago" }
    ],
    listeners: [],
    onChange: function (callback) { this.listeners.push(callback); },
    trigger: function () { this.listeners.forEach(cb => cb()); },
    getBins: () => Promise.resolve(MockDB.bins),
    getAlerts: () => Promise.resolve(MockDB.alerts)
};

// SIMULATOR: Automatically change data every 3 seconds to test Real-Time
setInterval(() => {
    let changed = false;
    let newAlerts = [];

    MockDB.bins.forEach(bin => {
        if (Math.random() > 0.5) {
            let oldLevel = bin.fillLevel;
            bin.fillLevel += Math.floor(Math.random() * 8) + 1;

            // If it hits 100, simulate truck collection
            if (bin.fillLevel >= 100) { bin.fillLevel = 0; }

            // Recalculate status ranges for visual coloring
            if (bin.fillLevel >= 90) bin.status = 'full';
            else if (bin.fillLevel >= 50) bin.status = 'medium';
            else bin.status = 'empty';

            bin.lastUpdated = "Just now";
            changed = true;

            // Trigger Real-Time Notification Logic at 3 Stages
            if (oldLevel < 90 && bin.fillLevel >= 90) {
                newAlerts.push({ binId: bin.id, type: 'critical', msg: `[Stage 3: FULL] ${bin.id} reached ${bin.fillLevel}%! Overflow risk.` });
            } else if (oldLevel < 50 && bin.fillLevel >= 50) {
                newAlerts.push({ binId: bin.id, type: 'warning', msg: `[Stage 2: HALF] ${bin.id} is now ${bin.fillLevel}% full.` });
            } else if (oldLevel < 25 && bin.fillLevel >= 25) {
                newAlerts.push({ binId: bin.id, type: 'info', msg: `[Stage 1: MONITOR] ${bin.id} has reached ${bin.fillLevel}% capacity.` });
            }
        }
    });

    // Simulate Random Sensor Failure for "Maintenance Required"
    if (Math.random() > 0.92) {
        let failedBin = `BIN-00${Math.floor(Math.random() * 5) + 1}`;
        newAlerts.push({ binId: failedBin, type: 'critical', msg: `[Maintenance Required] Sensor failure detected on ${failedBin}` });
        changed = true;
    }

    if (newAlerts.length > 0) {
        newAlerts.forEach(a => {
            a.id = Date.now() + Math.random();
            a.time = "Just now";
            MockDB.alerts.unshift(a);

            // Call the frontend pop-up toast system if available
            if (typeof app !== 'undefined' && app.showToast) {
                app.showToast(a.msg, a.type, a.binId);
            }
        });
        if (MockDB.alerts.length > 10) MockDB.alerts.length = 10;
    }
    if (changed) MockDB.trigger();
}, 2500);

// REAL-TIME FIREBASE CONNECTION
database.ref('SmartBin').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
        const bin = MockDB.bins.find(b => b.id === 'BIN-001');
        if (bin) {
            // Formula: 100 - ((dist / max_height) * 100)
            // Assuming bin max height is 300 (adjust as needed)
            const MAX_HEIGHT = 300;
            let level = Math.round(100 - ((data.distance / MAX_HEIGHT) * 100));
            if (level < 0) level = 0;
            if (level > 100) level = 100;

            bin.fillLevel = level;
            bin.temp = data.temperature;
            bin.hum = data.humidity;
            bin.lastUpdated = "Live Now";

            if (bin.fillLevel >= 90) bin.status = 'full';
            else if (bin.fillLevel >= 50) bin.status = 'medium';
            else bin.status = 'empty';

            MockDB.trigger();
        }
    }
});
