// JavaScript Logic for Aegis Emergency Shelter System

// --- State Management ---
const systemState = {
    power: {
        batteryLevel: 85.0, // Percentage
        solarInput: 4.5, // kW
        usage: 2.1, // kW
        isCharging: true
    },
    safety: {
        temperature: 24.0, // Celsius
        airQuality: 98, // Index (0-100, 100 is best)
        fireRisk: 'Low', // Low, Moderate, High
        co2: 400 // ppm
    },
    services: {
        waterLevel: 72.0, // Percentage
        lightsOn: true,
        locksLocked: true
    },
    alerts: [],
    // New Feature: Location
    location: {
        scanning: false,
        environment: null,
        nearbyShelters: []
    }
};

// --- Constants & Config ---
const CONFIG = {
    batteryDrainRate: 0.05, // % per tick when usage > solar
    solarFluctuation: 0.2, // kW variance
    usageFluctuation: 0.1, // kW variance
    tickRate: 1000, // ms
    maxSolar: 8.0,
    nightMode: false // Toggles periodically to simulate day/night
};

// --- DOM Elements ---
const elements = {
    time: document.getElementById('current-time'),
    alertCount: document.getElementById('alert-count'),

    // Navigation (Views)
    mainView: document.getElementById('main-view'),
    navView: document.getElementById('navigation-view'),
    navBtns: document.querySelectorAll('.nav-btn'),

    // Power
    batteryLevel: document.getElementById('battery-level'),
    batteryBar: document.getElementById('battery-bar'),
    solarInput: document.getElementById('solar-input'),
    powerUsage: document.getElementById('power-usage'),

    // Safety
    tempVal: document.getElementById('temp-val'),
    airQuality: document.getElementById('air-quality'),
    fireStatus: document.getElementById('fire-status'),

    // Services
    waterLevel: document.getElementById('water-level-text'),
    waterBar: document.getElementById('water-bar'),
    lightsToggle: document.getElementById('lights-toggle'),
    locksToggle: document.getElementById('locks-toggle'),

    // Logs
    logList: document.getElementById('log-list'),

    // Location Module
    scanBtn: document.getElementById('scan-btn'),
    scannerVisual: document.getElementById('scanner-visual').parentElement, // Get card body or container to add class
    scanResults: document.getElementById('scan-results'),
    shelterList: document.getElementById('shelter-list'),
    radVal: document.getElementById('rad-val'),
    weatherVal: document.getElementById('weather-val'),
    windVal: document.getElementById('wind-val')
};

// --- View Navigation Logic ---
elements.navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Remove active class from all
        elements.navBtns.forEach(b => b.classList.remove('active'));
        // Add active to clicked
        btn.classList.add('active');

        // Handle View Switching
        const view = btn.dataset.view;
        if (view === 'navigation') {
            elements.mainView.classList.add('hidden');
            elements.navView.classList.remove('hidden');
            document.querySelector('.breadcrumbs h1').textContent = "Navigation & Location";
        } else {
            // Default back to dashboard for other tabs (simulated for now)
            elements.mainView.classList.remove('hidden');
            elements.navView.classList.add('hidden');

            if (view === 'dashboard') document.querySelector('.breadcrumbs h1').textContent = "System Overview";
            if (view === 'power') document.querySelector('.breadcrumbs h1').textContent = "Power Systems";
            if (view === 'safety') document.querySelector('.breadcrumbs h1').textContent = "Safety Monitoring";
            if (view === 'services') document.querySelector('.breadcrumbs h1').textContent = "Essential Services";
        }
    });
});

// --- Simulation Logic ---

function simulateEnvironment() {
    // 1. Time Update
    const now = new Date();
    elements.time.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // 2. Power Fluctuations
    // Random fluctuation in solar
    let solarChange = (Math.random() - 0.5) * CONFIG.solarFluctuation;
    // If night mode, solar drops drastically
    if (CONFIG.nightMode) {
        systemState.power.solarInput = Math.max(0, systemState.power.solarInput * 0.95);
    } else {
        systemState.power.solarInput = Math.min(CONFIG.maxSolar, Math.max(0, systemState.power.solarInput + solarChange));
    }

    // Usage fluctuation based on services
    let baseUsage = 1.0;
    if (systemState.services.lightsOn) baseUsage += 1.5;
    if (systemState.services.locksLocked) baseUsage += 0.2;
    systemState.power.usage = baseUsage + (Math.random() - 0.5) * CONFIG.usageFluctuation;

    // Battery Logic
    const powerNet = systemState.power.solarInput - systemState.power.usage;

    if (powerNet > 0) {
        // Charging
        systemState.power.batteryLevel = Math.min(100, systemState.power.batteryLevel + (powerNet * 0.1));
        systemState.power.isCharging = true;
    } else {
        // Draining
        systemState.power.batteryLevel = Math.max(0, systemState.power.batteryLevel + (powerNet * 0.1));
        systemState.power.isCharging = false;
    }

    // 3. Autonomous Actions
    autonomousManager();

    // 4. Update UI
    updateUI();
}

function autonomousManager() {
    // Emergency Power Saving
    if (systemState.power.batteryLevel < 20 && systemState.services.lightsOn) {
        systemState.services.lightsOn = false;
        logEvent('Autonomous: Low Battery. Lights turned OFF to save power.', 'alert');
        elements.lightsToggle.checked = false;
    }

    // Auto-Lock at "Night" (Simulated by simple check)
    // For demo, let's say if battery drops fast we lock down
    if (systemState.power.usage > 5 && !systemState.services.locksLocked) {
        systemState.services.locksLocked = true;
        logEvent('Autonomous: High power draw detected. Perimeter secured.', 'success');
        elements.locksToggle.checked = true;
    }

    // Safety Checks
    if (systemState.safety.temperature > 30) {
        logEvent('Warning: High Internal Temperature.', 'alert');
    }
}

function updateUI() {
    // Power
    elements.batteryLevel.textContent = systemState.power.batteryLevel.toFixed(1);
    elements.batteryBar.style.width = `${systemState.power.batteryLevel}%`;

    // Color change for battery
    if (systemState.power.batteryLevel < 20) {
        elements.batteryBar.style.backgroundColor = 'var(--danger)';
    } else {
        elements.batteryBar.style.backgroundColor = ''; // Reset to gradient
    }

    elements.solarInput.textContent = `${systemState.power.solarInput.toFixed(2)} kW`;
    elements.powerUsage.textContent = `${systemState.power.usage.toFixed(2)} kW`;

    // Services
    elements.waterBar.style.width = `${systemState.services.waterLevel}%`;
    elements.waterLevel.textContent = `${systemState.services.waterLevel.toFixed(0)}%`;

    // Safety
    elements.tempVal.textContent = `${systemState.safety.temperature.toFixed(1)}°C`;
}

function logEvent(message, type = 'system') {
    const li = document.createElement('li');
    li.className = `log-entry ${type}`;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    li.innerHTML = `<span class="time">${time}</span> ${message}`;
    elements.logList.prepend(li); // Add to top

    // cleanup old logs
    if (elements.logList.children.length > 20) {
        elements.logList.lastElementChild.remove();
    }

    // Update badge if alert
    if (type === 'alert') {
        incrementBadge();
    }
}

let badgeCount = 0;
function incrementBadge() {
    badgeCount++;
    elements.alertCount.textContent = badgeCount;
    elements.alertCount.style.display = 'flex';
}

// --- Event Listeners ---
elements.lightsToggle.addEventListener('change', (e) => {
    systemState.services.lightsOn = e.target.checked;
    logEvent(`Manual: Lights turned ${e.target.checked ? 'ON' : 'OFF'}`);
});

elements.locksToggle.addEventListener('change', (e) => {
    systemState.services.locksLocked = e.target.checked;
    logEvent(`Manual: Locks ${e.target.checked ? 'Engaged' : 'Disengaged'}`);
});

// Location & Scan Event
elements.scanBtn.addEventListener('click', () => {
    if (systemState.location.scanning) return;

    systemState.location.scanning = true;
    elements.scanBtn.disabled = true;
    elements.scanBtn.textContent = 'SCANNING...';
    // Add visual effect
    document.querySelector('.scanner-card').classList.add('scanning');

    logEvent('Location Scan Initiated...', 'system');

    // Simulate delay
    setTimeout(() => {
        completeScan();
    }, 3000);
});

function completeScan() {
    systemState.location.scanning = false;
    elements.scanBtn.disabled = false;
    elements.scanBtn.textContent = 'RE-SCAN AREA';
    document.querySelector('.scanner-card').classList.remove('scanning');

    // Random Env Data
    const rads = (Math.random() * 2 + 0.5).toFixed(2);
    const wind = Math.floor(Math.random() * 50 + 10);
    const weathers = ['Clear', 'Overcast', 'Stormy', 'Hazey'];
    const weather = weathers[Math.floor(Math.random() * weathers.length)];

    elements.radVal.textContent = `${rads} uSv/hr`;
    elements.windVal.textContent = `${wind} km/h`;
    elements.weatherVal.textContent = weather;

    elements.scanResults.classList.remove('hidden');

    // Random Shelters
    const shelters = [
        { name: "Alpha Outpost", dist: 1.2, status: "Open" },
        { name: "Beta Bunker", dist: 3.5, status: "Full" },
        { name: "Delta Hub", dist: 0.8, status: "Open" },
        { name: "Gamma Station", dist: 5.2, status: "Open" }
    ];

    renderShelters(shelters);
    logEvent(`Scan Complete. Found ${shelters.length} nearby shelters.`, 'success');
}

function renderShelters(shelters) {
    elements.shelterList.innerHTML = '';
    shelters.forEach(s => {
        const li = document.createElement('li');
        li.className = 'shelter-item';
        li.innerHTML = `
            <div class="shelter-info">
                <h4>${s.name}</h4>
                <span>${s.dist} km away</span>
                <span class="shelter-status ${s.status.toLowerCase()}">${s.status}</span>
            </div>
            <button class="nav-action-btn">NAVIGATE</button>
        `;
        elements.shelterList.appendChild(li);
    });
}


// --- Initialization ---
function init() {
    logEvent('System Boot Sequence Initiated...');
    setTimeout(() => logEvent('Power Systems: ONLINE', 'success'), 500);
    setTimeout(() => logEvent('Sensors: CALIBRATED', 'success'), 1200);
    setTimeout(() => logEvent('Autonomous Core: ACTIVE', 'success'), 2000);

    // Start Loop
    setInterval(simulateEnvironment, CONFIG.tickRate);
    updateUI();
}

init();
