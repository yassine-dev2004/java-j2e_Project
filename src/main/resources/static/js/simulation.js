/**
 * AETHER LITE — Urban Simulation Engine & Decision Intelligence
 * Interactive Canvas 2D, Live WebSockets, What-If Studio, Agent Telemetry
 * 100% Match with Design Specification
 */

(function () {
    'use strict';

    // ── Application State ──────────────────────────────────────────────
    let liveState = {
        tick: 480,
        formattedTime: "Day 042  14:37",
        isRunning: true,
        speedMultiplier: 1,
        activeScenario: "BASELINE",
        citizenCount: 498,
        vehicleCount: 147,
        businessCount: 48,
        healthPct: 92.7,
        cpuUsage: 68,
        memoryUsage: 54,
        diskUsage: 32,
        networkUsage: 12,
        vehicles: [],
        events: []
    };

    let socket = null;
    let animFrame = 0;

    // Canvas & Viewport
    const canvas = document.getElementById('cityCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let scale = 1.0;
    let panX = 0;
    let panY = 0;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;

    // Layer Visibility Toggles
    let showTraffic = true;
    let showBuildings = true;
    let showZones = true;
    let showAgents = true;

    // Background Image
    const mapBgImage = new Image();
    mapBgImage.src = '/images/city_map_bg.jpg';
    let mapBgLoaded = false;
    mapBgImage.onload = () => { mapBgLoaded = true; };

    // Agent & Facility Visual Assets
    const avatarAgent317 = new Image();
    avatarAgent317.src = '/images/agent_317.jpg';

    const avatarAgentFemale = new Image();
    avatarAgentFemale.src = '/images/agent_female.jpg';

    const imgBuildingStore = new Image();
    imgBuildingStore.src = '/images/building_store.jpg';

    const imgBuildingResidence = new Image();
    imgBuildingResidence.src = '/images/building_residence.jpg';

    const imgAlertTraffic = new Image();
    imgAlertTraffic.src = '/images/alert_traffic.jpg';

    // Base World Dimensions for city_map_bg.jpg
    const MAP_WIDTH = 1376;
    const MAP_HEIGHT = 768;

    // Simulated Agent Pins on Map (Aligned with physical landmarks and sidewalks)
    const mapAgents = [
        { id: "CITIZEN_317", name: "Agent #317", x: 740, y: 370, ringColor: "#10b981", avatar: avatarAgent317, role: "Citizen", location: "Downtown Commercial Center", activity: "Working (Tech Store)", mood: "Happy" },
        { id: "CITIZEN_402", name: "Agent #402", x: 275, y: 595, ringColor: "#3b82f6", avatar: avatarAgentFemale, role: "Citizen", location: "Residential Park Avenue", activity: "Commuting", mood: "Focused" },
        { id: "CITIZEN_128", name: "Agent #128", x: 330, y: 175, ringColor: "#10b981", avatar: avatarAgent317, role: "Citizen", location: "Green Hills Crescent", activity: "Recreation", mood: "Relaxed" },
        { id: "CITIZEN_509", name: "Agent #509", x: 670, y: 355, ringColor: "#f59e0b", avatar: avatarAgentFemale, role: "Citizen", location: "Silicon Tech Plaza", activity: "Meeting", mood: "Optimistic" },
        { id: "CITIZEN_214", name: "Agent #214", x: 605, y: 352, ringColor: "#8b5cf6", avatar: avatarAgent317, role: "Citizen", location: "Civic Bridge Plaza", activity: "Shopping", mood: "Calm" },
        { id: "CITIZEN_088", name: "Agent #088", x: 560, y: 225, ringColor: "#0ea5e9", avatar: avatarAgentFemale, role: "Citizen", location: "Waterfront Promenade", activity: "Exercising", mood: "Energized" },
        { id: "CITIZEN_990", name: "Agent #990", x: 1085, y: 615, ringColor: "#f59e0b", avatar: avatarAgentFemale, role: "Citizen", location: "Stadium Arena Concourse", activity: "Attending Match", mood: "Excited" }
    ];

    // Simulated Place Pins on Map (Stores, Residences, Alerts accurately placed on buildings)
    const mapPlaces = [
        { id: "BIZ_23", name: "Nexus Tech Store", x: 740, y: 370, type: "STORE", icon: "🏪", color: "#f59e0b", avatar: imgBuildingStore, role: "Store", location: "Downtown Retail Core", activity: "Retail Tech Operations", mood: "High Demand", units: "Flagship Store", revenue: "$142,500 / mo" },
        { id: "BIZ_44", name: "Harbor Commerce", x: 605, y: 352, type: "STORE", icon: "🏪", color: "#f59e0b", avatar: imgBuildingStore, role: "Store", location: "Bridge Plaza Promenade", activity: "Trade & Freight Sales", mood: "Active Trade", units: "Commerce Center", revenue: "$188,000 / mo" },
        { id: "BIZ_12", name: "Metro Robotics", x: 670, y: 355, type: "STORE", icon: "🏪", color: "#f59e0b", avatar: imgBuildingStore, role: "Store", location: "Central Technology Plaza", activity: "Robotics Hardware Store", mood: "Profitable", units: "Retail Pavilion", revenue: "$210,400 / mo" },
        { id: "BIZ_99", name: "Apex Financial", x: 820, y: 390, type: "STORE", icon: "🏪", color: "#f59e0b", avatar: imgBuildingStore, role: "Store", location: "Financial High-Rise District", activity: "Corporate Advisory Hub", mood: "High Volume", units: "Commercial Suite", revenue: "$340,000 / mo" },
        { id: "RES_01", name: "Uptown Residences", x: 248, y: 470, type: "HOUSE", icon: "🏠", color: "#3b82f6", avatar: imgBuildingResidence, role: "House", location: "Uptown Community Avenue", activity: "Residential Living", mood: "98% Occupancy", units: "420 Urban Units", rating: "A+ Eco Certified" },
        { id: "RES_05", name: "Skyline Lofts", x: 575, y: 290, type: "HOUSE", icon: "🏠", color: "#3b82f6", avatar: imgBuildingResidence, role: "House", location: "Waterfront Skyline Towers", activity: "Luxury Condominiums", mood: "100% Occupancy", units: "280 Luxury Lofts", rating: "Smart Grid Enabled" },
        { id: "RES_09", name: "Bayside Condos", x: 390, y: 160, type: "HOUSE", icon: "🏠", color: "#3b82f6", avatar: imgBuildingResidence, role: "House", location: "Bayside Eco Heights", activity: "Apartment Community", mood: "95% Occupancy", units: "350 Waterfront Units", rating: "Passive Solar" },
        { id: "RES_14", name: "Arena View Heights", x: 1010, y: 590, type: "HOUSE", icon: "🏠", color: "#3b82f6", avatar: imgBuildingResidence, role: "House", location: "Stadium Park Residences", activity: "High-Rise Apartments", mood: "97% Occupancy", units: "510 Apartment Flats", rating: "Transit Oriented" },
        { id: "ALERT_01", name: "Traffic Congestion", x: 820, y: 508, type: "ALERT", icon: "⚠️", color: "#ef4444", avatar: imgAlertTraffic, role: "Alert", location: "Expressway River Bridge Junction", activity: "Traffic Flow Disruption", mood: "Capacity Exceeded", units: "Incident #1947", rating: "Warning Level 2" }
    ];

    // Vehicles moving along realistic physical streets
    const simulatedCars = [];
    const roadPaths = [
        // 1. Concrete Highway Bridge Eastbound (Dual Carriageway)
        [
            { x: 240, y: 768 }, { x: 360, y: 725 }, { x: 490, y: 670 }, { x: 600, y: 615 },
            { x: 710, y: 560 }, { x: 820, y: 508 }, { x: 955, y: 445 }, { x: 1095, y: 385 },
            { x: 1235, y: 320 }, { x: 1376, y: 255 }
        ],
        // 2. Concrete Highway Bridge Westbound (Dual Carriageway)
        [
            { x: 1376, y: 245 }, { x: 1230, y: 310 }, { x: 1090, y: 375 }, { x: 950, y: 435 },
            { x: 815, y: 498 }, { x: 705, y: 550 }, { x: 595, y: 605 }, { x: 485, y: 660 },
            { x: 355, y: 715 }, { x: 230, y: 760 }
        ],
        // 3. Suburban Residential Avenue Northbound
        [
            { x: 420, y: 768 }, { x: 380, y: 720 }, { x: 320, y: 660 }, { x: 275, y: 595 },
            { x: 252, y: 530 }, { x: 248, y: 470 }, { x: 240, y: 410 }, { x: 235, y: 340 },
            { x: 245, y: 270 }, { x: 275, y: 215 }, { x: 330, y: 175 }, { x: 390, y: 160 }
        ],
        // 4. Suburban Residential Avenue Southbound
        [
            { x: 390, y: 160 }, { x: 330, y: 175 }, { x: 275, y: 215 }, { x: 245, y: 270 },
            { x: 235, y: 340 }, { x: 240, y: 410 }, { x: 248, y: 470 }, { x: 252, y: 530 },
            { x: 275, y: 595 }, { x: 320, y: 660 }, { x: 380, y: 720 }, { x: 420, y: 768 }
        ],
        // 5. Outer Residential Crescent
        [
            { x: 45, y: 768 }, { x: 55, y: 690 }, { x: 70, y: 600 }, { x: 82, y: 510 },
            { x: 105, y: 420 }, { x: 140, y: 335 }, { x: 195, y: 265 }, { x: 260, y: 212 },
            { x: 330, y: 175 }, { x: 390, y: 160 }
        ],
        // 6. Middle River Bridge Eastbound (Residential to Commercial)
        [
            { x: 248, y: 470 }, { x: 330, y: 440 }, { x: 410, y: 412 }, { x: 475, y: 392 },
            { x: 540, y: 372 }, { x: 605, y: 352 }, { x: 670, y: 355 }, { x: 740, y: 370 },
            { x: 820, y: 390 }
        ],
        // 7. Middle River Bridge Westbound (Commercial to Residential)
        [
            { x: 820, y: 390 }, { x: 740, y: 370 }, { x: 670, y: 355 }, { x: 605, y: 352 },
            { x: 540, y: 372 }, { x: 475, y: 392 }, { x: 410, y: 412 }, { x: 330, y: 440 },
            { x: 248, y: 470 }
        ],
        // 8. Downtown Riverside Corniche Northbound
        [
            { x: 605, y: 352 }, { x: 575, y: 290 }, { x: 560, y: 225 }, { x: 560, y: 165 },
            { x: 575, y: 120 }, { x: 600, y: 95 }
        ],
        // 9. Commercial Station Boulevard Eastbound
        [
            { x: 670, y: 355 }, { x: 740, y: 370 }, { x: 820, y: 390 }, { x: 910, y: 410 },
            { x: 1010, y: 425 }, { x: 1110, y: 442 }, { x: 1210, y: 460 }, { x: 1310, y: 478 },
            { x: 1376, y: 490 }
        ],
        // 10. Stadium Perimeter Loop Road
        [
            { x: 820, y: 390 }, { x: 860, y: 440 }, { x: 900, y: 490 }, { x: 945, y: 545 },
            { x: 1010, y: 590 }, { x: 1085, y: 615 }, { x: 1170, y: 610 }, { x: 1250, y: 580 },
            { x: 1320, y: 535 }, { x: 1376, y: 490 }
        ]
    ];

    const carColors = ["#f97316", "#0ea5e9", "#38bdf8", "#facc15", "#10b981", "#ffffff", "#ec4899", "#8b5cf6"];

    for (let i = 0; i < 42; i++) {
        const path = roadPaths[i % roadPaths.length];
        simulatedCars.push({
            id: `VEH-${400 + i}`,
            path: path,
            t: (i * 0.11) % 1,
            speed: 0.0010 + ((i % 5) * 0.0004),
            color: carColors[i % carColors.length]
        });
    }

    // Currently Selected Entity
    let selectedAgent = mapAgents[0];

    // ── Initialization ──────────────────────────────────────────────────
    window.addEventListener('DOMContentLoaded', () => {
        setupCanvas();
        connectWebSocket();
        setupControls();
        setupModals();
        requestAnimationFrame(renderLoop);
    });

    // ── Canvas Setup & Events ───────────────────────────────────────────
    function setupCanvas() {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        canvas.addEventListener('mousedown', (e) => {
            isDragging = true;
            dragStartX = e.clientX - panX;
            dragStartY = e.clientY - panY;
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                const dpr = window.devicePixelRatio || 1;
                const viewW = canvas.width / dpr;
                const viewH = canvas.height / dpr;
                const baseW = MAP_WIDTH;
                const baseH = MAP_HEIGHT;
                const minPanX = Math.min(0, viewW - (baseW * scale));
                const minPanY = Math.min(0, viewH - (baseH * scale));

                let newX = e.clientX - dragStartX;
                let newY = e.clientY - dragStartY;
                panX = Math.min(0, Math.max(minPanX, newX));
                panY = Math.min(0, Math.max(minPanY, newY));
                updateMiniMapViewport();
            }
        });

        window.addEventListener('mouseup', () => { isDragging = false; });

        canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
            const newScale = Math.max(0.6, Math.min(2.2, scale * zoomFactor));

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            panX = mouseX - (mouseX - panX) * (newScale / scale);
            panY = mouseY - (mouseY - panY) * (newScale / scale);
            scale = newScale;
            updateMiniMapViewport();
        }, { passive: false });

        canvas.addEventListener('click', handleMapClick);
    }

    function resizeCanvas() {
        const container = canvas.parentElement;
        if (!container) return;
        canvas.width = container.clientWidth * (window.devicePixelRatio || 1);
        canvas.height = container.clientHeight * (window.devicePixelRatio || 1);
        canvas.style.width = container.clientWidth + 'px';
        canvas.style.height = container.clientHeight + 'px';
    }

    function updateMiniMapViewport() {
        const vp = document.getElementById('miniMapViewport');
        if (!vp) return;
        const normX = Math.max(0, Math.min(60, 20 - (panX * 0.03)));
        const normY = Math.max(0, Math.min(60, 20 - (panY * 0.03)));
        const normW = Math.max(25, Math.min(70, 55 / scale));
        const normH = Math.max(25, Math.min(70, 50 / scale));
        vp.style.left = normX + '%';
        vp.style.top = normY + '%';
        vp.style.width = normW + '%';
        vp.style.height = normH + '%';
    }

    // ── Click Detection on Map ──────────────────────────────────────────
    function handleMapClick(e) {
        const rect = canvas.getBoundingClientRect();
        const clickX = (e.clientX - rect.left - panX) / scale;
        const clickY = (e.clientY - rect.top - panY) / scale;

        // Check Agent Pins
        for (const ag of mapAgents) {
            if (Math.hypot(ag.x - clickX, ag.y - clickY) <= 18) {
                selectAgent(ag);
                return;
            }
        }

        // Check Places
        for (const pl of mapPlaces) {
            if (Math.hypot(pl.x - clickX, pl.y - clickY) <= 18) {
                selectPlace(pl);
                return;
            }
        }
    }

    function selectAgent(agent) {
        selectedAgent = agent;

        const headerTitleEl = document.getElementById('inspectorHeaderTitle');
        if (headerTitleEl) {
            headerTitleEl.innerHTML = `<span>👤</span><span>Citizen Details</span>`;
        }

        const titleEl = document.getElementById('inspectorTitle');
        if (titleEl) titleEl.textContent = agent.name;

        const badgeEl = document.getElementById('inspectorStatusBadge');
        if (badgeEl) badgeEl.innerHTML = `<span style="font-size: 0.5rem;">●</span><span>${agent.activity && agent.activity.includes('Working') ? 'At Work' : 'Active'}</span>`;

        const typeEl = document.getElementById('metaType');
        if (typeEl) typeEl.textContent = `👤 ${agent.role || 'Citizen'}`;

        const locEl = document.getElementById('metaLocation');
        if (locEl) locEl.textContent = `📍 ${agent.location || 'Urban District'}`;

        const actEl = document.getElementById('metaActivity');
        if (actEl) actEl.textContent = `💼 ${agent.activity || 'Active'}`;

        const moodEl = document.getElementById('metaMood');
        if (moodEl) moodEl.textContent = `😊 ${agent.mood || 'Normal'}`;

        const avatarEl = document.getElementById('inspectorAvatarImg');
        if (avatarEl) {
            avatarEl.src = (agent.avatar && agent.avatar.src) ? agent.avatar.src : '/images/agent_317.jpg';
        }
    }

    function selectPlace(place) {
        selectedAgent = place;

        const headerTitleEl = document.getElementById('inspectorHeaderTitle');
        if (headerTitleEl) {
            if (place.type === 'STORE') {
                headerTitleEl.innerHTML = `<span>🏪</span><span>Commercial Store Details</span>`;
            } else if (place.type === 'HOUSE') {
                headerTitleEl.innerHTML = `<span>🏠</span><span>Residential House Details</span>`;
            } else {
                headerTitleEl.innerHTML = `<span>⚠️</span><span>Urban Alert Details</span>`;
            }
        }

        const titleEl = document.getElementById('inspectorTitle');
        if (titleEl) titleEl.textContent = place.name;

        const badgeEl = document.getElementById('inspectorStatusBadge');
        if (badgeEl) {
            if (place.type === 'STORE') {
                badgeEl.innerHTML = `<span style="font-size: 0.5rem; color: #f59e0b;">●</span><span>Commercial Store</span>`;
            } else if (place.type === 'HOUSE') {
                badgeEl.innerHTML = `<span style="font-size: 0.5rem; color: #3b82f6;">●</span><span>Residential Complex</span>`;
            } else {
                badgeEl.innerHTML = `<span style="font-size: 0.5rem; color: #ef4444;">●</span><span>Alert Incident</span>`;
            }
        }

        const typeEl = document.getElementById('metaType');
        if (typeEl) {
            if (place.type === 'STORE') typeEl.textContent = `🏪 Commercial Retail`;
            else if (place.type === 'HOUSE') typeEl.textContent = `🏠 Residential Housing`;
            else typeEl.textContent = `⚠️ Infrastructure Alert`;
        }

        const locEl = document.getElementById('metaLocation');
        if (locEl) locEl.textContent = `📍 ${place.location || `Coordinates (${Math.round(place.x)}, ${Math.round(place.y)})`}`;

        const actEl = document.getElementById('metaActivity');
        if (actEl) actEl.textContent = `💼 ${place.activity || (place.type === 'STORE' ? 'Retail Store Commerce' : 'Residential Living')}`;

        const moodEl = document.getElementById('metaMood');
        if (moodEl) {
            if (place.type === 'STORE') moodEl.textContent = `📈 ${place.revenue || place.mood || 'Active Retail'}`;
            else if (place.type === 'HOUSE') moodEl.textContent = `👥 ${place.units || place.mood || '98% Occupied'}`;
            else moodEl.textContent = `⚠️ Active Alert`;
        }

        const avatarEl = document.getElementById('inspectorAvatarImg');
        if (avatarEl) {
            if (place.type === 'STORE') {
                avatarEl.src = '/images/building_store.jpg';
            } else if (place.type === 'HOUSE') {
                avatarEl.src = '/images/building_residence.jpg';
            } else if (place.type === 'ALERT') {
                avatarEl.src = '/images/alert_traffic.jpg';
            } else if (place.avatar && place.avatar.src) {
                avatarEl.src = place.avatar.src;
            } else {
                avatarEl.src = '/images/alert_traffic.jpg';
            }
        }
    }

    // ── WebSocket Integration ───────────────────────────────────────────
    function connectWebSocket() {
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${window.location.host}/ws/simulation`;

        socket = new WebSocket(wsUrl);

        socket.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.type === 'INIT_STATE' || msg.type === 'TICK_UPDATE') {
                    updateTelemetry(msg.data);
                }
            } catch (err) {}
        };

        socket.onclose = () => {
            setTimeout(connectWebSocket, 3000);
        };
    }

    function sendCommand(action, payload = {}) {
        const data = Object.assign({ action }, payload);
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(data));
        }
        fetch(`/api/simulation/${action}`, { method: 'POST' }).catch(() => {});
    }

    function updateTelemetry(data) {
        if (!data) return;
        Object.assign(liveState, data);

        // Header Updates
        const clockEl = document.getElementById('headerClockTime');
        if (clockEl && data.formattedTime) clockEl.textContent = data.formattedTime;

        const citEl = document.getElementById('headerCitizens');
        if (citEl && data.citizenCount !== undefined) citEl.textContent = `${data.citizenCount} / 500`;

        const vehEl = document.getElementById('headerVehicles');
        if (vehEl && data.vehicleCount !== undefined) vehEl.textContent = `${data.vehicleCount} / 150`;

        const bizEl = document.getElementById('headerBusinesses');
        if (bizEl && data.businessCount !== undefined) bizEl.textContent = `${data.businessCount} / 50`;

        // Right Sidebar Widgets: Numbers, Progress Bars, and Percentage Labels
        const statPop = document.getElementById('statPopText');
        const barPop = document.getElementById('barPop');
        const pctPop = document.getElementById('pctPopText');
        if (data.citizenCount !== undefined) {
            if (statPop) statPop.textContent = `${data.citizenCount} / 500`;
            const popPct = Math.min(100, Math.round((data.citizenCount / 500) * 1000) / 10);
            if (barPop) barPop.style.width = `${popPct}%`;
            if (pctPop) pctPop.textContent = `${popPct}%`;
        }

        const statVeh = document.getElementById('statVehText');
        const barVeh = document.getElementById('barVeh');
        const pctVeh = document.getElementById('pctVehText');
        if (data.vehicleCount !== undefined) {
            if (statVeh) statVeh.textContent = `${data.vehicleCount} / 150`;
            const vehPct = Math.min(100, Math.round((data.vehicleCount / 150) * 1000) / 10);
            if (barVeh) barVeh.style.width = `${vehPct}%`;
            if (pctVeh) pctVeh.textContent = `${vehPct}%`;
        }

        const statBiz = document.getElementById('statBizText');
        const barBiz = document.getElementById('barBiz');
        const pctBiz = document.getElementById('pctBizText');
        if (data.businessCount !== undefined) {
            if (statBiz) statBiz.textContent = `${data.businessCount} / 50`;
            const bizPct = Math.min(100, Math.round((data.businessCount / 50) * 1000) / 10);
            if (barBiz) barBiz.style.width = `${bizPct}%`;
            if (pctBiz) pctBiz.textContent = `${bizPct}%`;
        }

        // City Health Calculation (Satisfaction combined with congestion)
        const statHealth = document.getElementById('statHealthText');
        if (statHealth && (data.avgSatisfaction !== undefined || data.congestionRatio !== undefined)) {
            const sat = data.avgSatisfaction || 85;
            const congPenalty = (data.congestionRatio || 0.1) * 15;
            const health = Math.max(10, Math.min(100, Math.round((sat - congPenalty) * 10) / 10));
            statHealth.textContent = `${health}%`;
        }

        // Sync Scenario Selectors
        if (data.activeScenario) {
            const scenarioSelector = document.getElementById('scenarioSelector');
            const headerBranchSelect = document.getElementById('headerBranchSelect');
            if (scenarioSelector && scenarioSelector.value !== data.activeScenario) {
                for (let i = 0; i < scenarioSelector.options.length; i++) {
                    if (scenarioSelector.options[i].value === data.activeScenario) {
                        scenarioSelector.value = data.activeScenario;
                        break;
                    }
                }
            }
            if (headerBranchSelect && headerBranchSelect.value !== data.activeScenario) {
                for (let i = 0; i < headerBranchSelect.options.length; i++) {
                    if (headerBranchSelect.options[i].value === data.activeScenario) {
                        headerBranchSelect.value = data.activeScenario;
                        break;
                    }
                }
            }
        }

        // Dynamic Live Events Feed in Sidebar
        if (Array.isArray(data.events) && data.events.length > 0) {
            renderEventsList(data.events);
        }
    }

    function renderEventsList(events) {
        const container = document.getElementById('eventsListWidget');
        if (!container) return;

        const recent = events.slice(0, 5);
        container.innerHTML = recent.map(e => {
            let icon = 'ℹ️';
            let bg = '#e0f2fe';
            let color = '#0284c7';

            const sev = (e.severity || '').toUpperCase();
            const desc = e.description || '';
            const type = (e.eventType || '').toUpperCase();

            if (sev === 'CRITICAL' || desc.includes('closed') || desc.includes('CRITICAL')) {
                icon = '⚠️';
                bg = '#fee2e2';
                color = '#dc2626';
            } else if (sev === 'WARNING' || desc.includes('congestion') || desc.includes('JAM')) {
                icon = '⚠️';
                bg = '#fef3c7';
                color = '#d97706';
            } else if (desc.includes('Vehicle') || type.includes('TRAFFIC')) {
                icon = '🚗';
                bg = '#e0f2fe';
                color = '#0284c7';
            } else if (desc.includes('Business') || desc.includes('Grant') || desc.includes('STIMULUS')) {
                icon = '🏪';
                bg = '#fef3c7';
                color = '#d97706';
            } else if (desc.includes('Citizen') || desc.includes('wellness') || desc.includes('salary')) {
                icon = '👤';
                bg = '#dbeafe';
                color = '#2563eb';
            } else if (desc.includes('transit') || desc.includes('TRANSIT')) {
                icon = '🚆';
                bg = '#d1fae5';
                color = '#059669';
            }

            let timeStr = 'Now';
            if (e.timestamp) {
                const tMatch = String(e.timestamp).match(/(\d{2}:\d{2})/);
                if (tMatch) timeStr = tMatch[1];
            }

            const isAlert = (sev === 'CRITICAL' || sev === 'WARNING');
            return `
                <div class="event-row">
                    <div class="event-row-left">
                        <div class="event-icon-circle" style="background: ${bg}; color: ${color};">${icon}</div>
                        <span class="event-text ${isAlert ? 'text-danger' : ''}">${escapeHtml(desc)}</span>
                    </div>
                    <span class="event-time-tag">${timeStr}</span>
                </div>
            `;
        }).join('');
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ── Render Loop ─────────────────────────────────────────────────────
    function renderLoop() {
        animFrame++;
        drawMap();
        requestAnimationFrame(renderLoop);
    }

    function drawMap() {
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.translate(panX * dpr, panY * dpr);
        ctx.scale(scale * dpr, scale * dpr);

        // 1. Draw Aerial City Map Background
        if (mapBgLoaded) {
            ctx.drawImage(mapBgImage, 0, 0, MAP_WIDTH, MAP_HEIGHT);
        } else {
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
        }

        // 2. Draw Simulated Traffic & Vehicles
        if (showTraffic) {
            simulatedCars.forEach(car => {
                if (liveState.isRunning) {
                    car.t += car.speed * liveState.speedMultiplier;
                    if (car.t >= 1) car.t = 0;
                }

                // Interpolate along path
                const pt = getPointOnPath(car.path, car.t);
                if (pt) {
                    ctx.save();
                    ctx.translate(pt.x, pt.y);
                    ctx.rotate(pt.angle);

                    // Soft vehicle underglow
                    ctx.beginPath();
                    ctx.ellipse(0, 0, 7, 4, 0, 0, Math.PI * 2);
                    ctx.fillStyle = car.color + '40';
                    ctx.fill();

                    // Vehicle capsule body
                    ctx.beginPath();
                    if (ctx.roundRect) {
                        ctx.roundRect(-4.5, -2.2, 9, 4.4, 2);
                    } else {
                        ctx.rect(-4.5, -2.2, 9, 4.4);
                    }
                    ctx.fillStyle = car.color;
                    ctx.fill();
                    ctx.strokeStyle = '#ffffffaa';
                    ctx.lineWidth = 0.8;
                    ctx.stroke();

                    // Headlight dot (front +X)
                    ctx.beginPath();
                    ctx.arc(4, 0, 1.2, 0, Math.PI * 2);
                    ctx.fillStyle = '#ffffff';
                    ctx.fill();

                    // Taillights (rear -X)
                    ctx.beginPath();
                    ctx.arc(-4.5, -1.2, 0.8, 0, Math.PI * 2);
                    ctx.arc(-4.5, 1.2, 0.8, 0, Math.PI * 2);
                    ctx.fillStyle = '#ef4444';
                    ctx.fill();

                    ctx.restore();
                }
            });
        }

        // 3. Draw Place Markers (Stores, Houses, Alerts)
        if (showBuildings) {
            mapPlaces.forEach(pl => {
                const isSelected = selectedAgent && selectedAgent.id === pl.id;

                // Pulsing highlight if selected
                if (isSelected) {
                    const pulseR = 19 + Math.sin(animFrame * 0.15) * 3;
                    ctx.beginPath();
                    ctx.arc(pl.x, pl.y, pulseR, 0, Math.PI * 2);
                    ctx.strokeStyle = pl.color;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }

                // Pin outer shadow
                ctx.beginPath();
                ctx.arc(pl.x, pl.y, 14, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
                ctx.fill();

                // Pin circle
                ctx.beginPath();
                ctx.arc(pl.x, pl.y, 12, 0, Math.PI * 2);
                ctx.fillStyle = pl.color;
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.stroke();

                // Pin emoji/icon
                ctx.font = '11px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pl.icon, pl.x, pl.y + 0.5);
            });
        }

        // 4. Draw Agent Avatar Pins with Colored Rings
        if (showAgents) {
            mapAgents.forEach(ag => {
                const isSelected = selectedAgent && selectedAgent.id === ag.id;

                // Pulsing highlight if selected
                if (isSelected) {
                    const pulseR = 19 + Math.sin(animFrame * 0.15) * 3;
                    ctx.beginPath();
                    ctx.arc(ag.x, ag.y, pulseR, 0, Math.PI * 2);
                    ctx.strokeStyle = ag.ringColor;
                    ctx.lineWidth = 2.5;
                    ctx.stroke();
                }

                // Outer border shadow
                ctx.beginPath();
                ctx.arc(ag.x, ag.y, 15, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
                ctx.fill();

                // Ring
                ctx.beginPath();
                ctx.arc(ag.x, ag.y, 13, 0, Math.PI * 2);
                ctx.strokeStyle = ag.ringColor;
                ctx.lineWidth = 3;
                ctx.stroke();

                // Clipping circle for avatar image
                ctx.save();
                ctx.beginPath();
                ctx.arc(ag.x, ag.y, 11.5, 0, Math.PI * 2);
                ctx.clip();

                if (ag.avatar && ag.avatar.complete && ag.avatar.naturalWidth > 0) {
                    ctx.drawImage(ag.avatar, ag.x - 12, ag.y - 12, 24, 24);
                } else {
                    ctx.fillStyle = '#1e293b';
                    ctx.fill();
                    ctx.font = '700 8px "Inter"';
                    ctx.fillStyle = '#ffffff';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('AG', ag.x, ag.y);
                }
                ctx.restore();
            });
        }

        ctx.restore();
    }

    function getPointOnPath(path, t) {
        if (!path || path.length < 2) return null;
        const totalSegments = path.length - 1;
        const segmentIndex = Math.min(totalSegments - 1, Math.floor(t * totalSegments));
        const segT = (t * totalSegments) - segmentIndex;

        const p1 = path[segmentIndex];
        const p2 = path[segmentIndex + 1];

        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const angle = Math.atan2(dy, dx);

        return {
            x: p1.x + dx * segT,
            y: p1.y + dy * segT,
            angle: angle
        };
    }

    function panToCoords(targetX, targetY) {
        const dpr = window.devicePixelRatio || 1;
        const viewW = canvas.width / dpr;
        const viewH = canvas.height / dpr;
        panX = (viewW / 2) - (targetX * scale);
        panY = (viewH / 2) - (targetY * scale);
        updateMiniMapViewport();
    }

    // ── Toast Notification Helper ────────────────────────────────────────
    function showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type === 'success' ? 'toast-success' : (type === 'warning' ? 'toast-warning' : '')}`;
        const icon = type === 'success' ? '✅' : (type === 'warning' ? '⚠️' : '⚡');
        toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }

    // ── Controls & Interactivity Setup ──────────────────────────────────
    let followingAgent = false;

    function setupControls() {
        // Play / Pause / Reset Buttons
        const btnPlay = document.getElementById('btnStart');
        const btnPause = document.getElementById('btnPause');
        const btnReset = document.getElementById('btnReset');
        const btnQuickPause = document.getElementById('btnQuickPause');

        if (btnPlay) {
            btnPlay.addEventListener('click', () => {
                liveState.isRunning = true;
                sendCommand('start');
                updateStatusPill(true);
                showToast("Simulation running at " + liveState.speedMultiplier + "x speed", "success");
            });
        }

        if (btnPause) {
            btnPause.addEventListener('click', () => {
                liveState.isRunning = false;
                sendCommand('pause');
                updateStatusPill(false);
                showToast("Simulation execution paused", "warning");
            });
        }

        if (btnQuickPause) {
            btnQuickPause.addEventListener('click', () => {
                liveState.isRunning = !liveState.isRunning;
                sendCommand(liveState.isRunning ? 'start' : 'pause');
                updateStatusPill(liveState.isRunning);
                btnQuickPause.querySelector('span:last-child').textContent = liveState.isRunning ? 'Pause Simulation' : 'Resume Simulation';
                showToast(liveState.isRunning ? "Simulation resumed" : "Simulation paused");
            });
        }

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                sendCommand('reset');
                showToast("Simulation reset to baseline state", "warning");
            });
        }

        // Speed Range Slider
        const speedSlider = document.getElementById('simSpeedSlider');
        const speedLabel = document.getElementById('speedSliderLabel');
        if (speedSlider) {
            speedSlider.addEventListener('input', () => {
                const spd = parseFloat(speedSlider.value);
                liveState.speedMultiplier = spd;
                if (speedLabel) speedLabel.textContent = spd.toFixed(1) + 'x';
                sendCommand('speed', { value: Math.round(spd) });
            });
        }

        // Layer Toggles
        const tTraffic = document.getElementById('toggleTraffic');
        if (tTraffic) tTraffic.addEventListener('change', () => { showTraffic = tTraffic.checked; });

        const tBuildings = document.getElementById('toggleBuildings');
        if (tBuildings) tBuildings.addEventListener('change', () => { showBuildings = tBuildings.checked; });

        const tZones = document.getElementById('toggleZones');
        if (tZones) tZones.addEventListener('change', () => { showZones = tZones.checked; });

        const tAgents = document.getElementById('toggleAgents');
        if (tAgents) tAgents.addEventListener('change', () => { showAgents = tAgents.checked; });

        // Map Zoom Tools
        const btnZoomIn = document.getElementById('btnZoomIn');
        if (btnZoomIn) btnZoomIn.addEventListener('click', () => { scale = Math.min(2.2, scale * 1.15); updateMiniMapViewport(); });

        const btnZoomOut = document.getElementById('btnZoomOut');
        if (btnZoomOut) btnZoomOut.addEventListener('click', () => { scale = Math.max(0.6, scale * 0.85); updateMiniMapViewport(); });

        const btnResetView = document.getElementById('btnResetView');
        if (btnResetView) btnResetView.addEventListener('click', () => {
            scale = 1.0;
            panX = 0;
            panY = 0;
            followingAgent = false;
            const followBtn = document.getElementById('btnFollowAgent');
            if (followBtn) followBtn.textContent = 'Follow';
            updateMiniMapViewport();
            showToast("Camera view centered on city center");
        });

        // 2D / 3D Viewport Toggles
        const btnView2D = document.getElementById('btnView2D');
        const btnView3D = document.getElementById('btnView3D');
        const mapContainer = document.getElementById('mapContainer');

        if (btnView3D && mapContainer) {
            btnView3D.addEventListener('click', () => {
                btnView3D.classList.add('active');
                if (btnView2D) btnView2D.classList.remove('active');
                mapContainer.classList.add('mode-3d');
                showToast("3D Isometric Perspective View Activated", "info");
            });
        }

        if (btnView2D && mapContainer) {
            btnView2D.addEventListener('click', () => {
                btnView2D.classList.add('active');
                if (btnView3D) btnView3D.classList.remove('active');
                mapContainer.classList.remove('mode-3d');
                showToast("Returned to Standard 2D Orthographic View");
            });
        }

        // Layers Dropdown Popover
        const btnLayers = document.getElementById('btnLayersDropdown');
        const layersPopover = document.getElementById('layersPopover');
        if (btnLayers && layersPopover) {
            btnLayers.addEventListener('click', (e) => {
                e.stopPropagation();
                layersPopover.classList.toggle('open');
            });
            document.addEventListener('click', () => layersPopover.classList.remove('open'));
            layersPopover.addEventListener('click', (e) => e.stopPropagation());
        }

        // Search Autocomplete
        const searchInput = document.getElementById('mapSearchInput');
        const searchDropdown = document.getElementById('mapSearchResults');
        if (searchInput && searchDropdown) {
            searchInput.addEventListener('input', () => {
                const q = searchInput.value.trim().toLowerCase();
                if (!q) {
                    searchDropdown.classList.remove('open');
                    return;
                }

                const matches = [];
                mapAgents.forEach(ag => {
                    if (ag.name.toLowerCase().includes(q) || ag.activity.toLowerCase().includes(q) || ag.location.toLowerCase().includes(q)) {
                        matches.push({ type: 'agent', item: ag });
                    }
                });
                mapPlaces.forEach(pl => {
                    if (pl.name.toLowerCase().includes(q) || pl.type.toLowerCase().includes(q)) {
                        matches.push({ type: 'place', item: pl });
                    }
                });

                if (matches.length === 0) {
                    searchDropdown.innerHTML = `<div style="padding: 0.5rem 0.75rem; font-size: 0.75rem; color: var(--text-muted);">No entities found matching "${q}"</div>`;
                } else {
                    searchDropdown.innerHTML = matches.slice(0, 6).map(m => `
                        <div class="search-result-item" data-id="${m.item.id}" data-type="${m.type}">
                            <div>
                                <strong>${m.item.name}</strong>
                                <div style="font-size: 0.7rem; color: var(--text-muted);">${m.type === 'agent' ? m.item.activity : m.item.type}</div>
                            </div>
                            <span style="font-size: 0.7rem; color: var(--primary-blue); font-weight: 600;">Select →</span>
                        </div>
                    `).join('');

                    searchDropdown.querySelectorAll('.search-result-item').forEach(el => {
                        el.addEventListener('click', () => {
                            const id = el.getAttribute('data-id');
                            const type = el.getAttribute('data-type');
                            if (type === 'agent') {
                                const target = mapAgents.find(a => a.id === id);
                                if (target) {
                                    selectAgent(target);
                                    panToCoords(target.x, target.y);
                                }
                            } else {
                                const target = mapPlaces.find(p => p.id === id);
                                if (target) {
                                    selectPlace(target);
                                    panToCoords(target.x, target.y);
                                }
                            }
                            searchDropdown.classList.remove('open');
                            searchInput.value = '';
                        });
                    });
                }
                searchDropdown.classList.add('open');
            });

            document.addEventListener('click', (e) => {
                if (!searchInput.contains(e.target)) searchDropdown.classList.remove('open');
            });
        }

        // Camera Tracking: Follow Agent
        const btnFollow = document.getElementById('btnFollowAgent');
        if (btnFollow) {
            btnFollow.addEventListener('click', () => {
                followingAgent = !followingAgent;
                btnFollow.textContent = followingAgent ? '🟢 Following' : 'Follow';
                if (followingAgent && selectedAgent) {
                    panToCoords(selectedAgent.x, selectedAgent.y);
                    showToast(`Camera locked on ${selectedAgent.name}`, "info");
                } else {
                    showToast("Camera lock released");
                }
            });
        }

        // View Agent Profile Dossier
        const btnViewProf = document.getElementById('btnViewProfile');
        const dossierModal = document.getElementById('agentDossierModal');
        const dossierClose = document.getElementById('dossierModalClose');

        if (btnViewProf && dossierModal) {
            btnViewProf.addEventListener('click', () => {
                if (selectedAgent) {
                    const dPill = document.getElementById('dossierPill');
                    const dName = document.getElementById('dossierName');
                    const dId = document.getElementById('dossierId');
                    const dOcc = document.getElementById('dossierOccupation');
                    const dInc = document.getElementById('dossierIncome');
                    const dLoc = document.getElementById('dossierLocation');
                    const dHome = document.getElementById('dossierHome');
                    const dWork = document.getElementById('dossierWork');
                    const dAv = document.getElementById('dossierAvatar');
                    const dMood = document.getElementById('dossierMoodBadge');

                    const lblId = document.getElementById('dossierLabelId');
                    const lblOcc = document.getElementById('dossierLabelOccupation');
                    const lblInc = document.getElementById('dossierLabelIncome');
                    const lblLoc = document.getElementById('dossierLabelLocation');
                    const lblHome = document.getElementById('dossierLabelHome');
                    const lblWork = document.getElementById('dossierLabelWork');

                    const schedTitle = document.getElementById('dossierScheduleTitle');
                    const schedContent = document.getElementById('dossierScheduleContent');

                    if (selectedAgent.type === 'STORE') {
                        if (dPill) {
                            dPill.className = 'status-pill pill-live';
                            dPill.textContent = 'COMMERCIAL STORE & RETAIL DOSSIER';
                        }
                        if (dName) dName.textContent = `${selectedAgent.name} — Store Profile`;
                        if (dAv) dAv.src = '/images/building_store.jpg';
                        if (dMood) dMood.textContent = '📈 High Footfall & Profitable';
                        if (lblId) lblId.textContent = 'Enterprise ID:';
                        if (dId) dId.textContent = selectedAgent.id;
                        if (lblOcc) lblOcc.textContent = 'Commercial Sector:';
                        if (dOcc) dOcc.textContent = selectedAgent.activity || 'Commercial Store & Retail';
                        if (lblInc) lblInc.textContent = 'Monthly Revenue:';
                        if (dInc) dInc.textContent = selectedAgent.revenue || '$142,500 / mo';
                        if (lblLoc) lblLoc.textContent = 'District Zone:';
                        if (dLoc) dLoc.textContent = selectedAgent.location || 'Commercial Zone';
                        if (lblHome) lblHome.textContent = 'Store Type:';
                        if (dHome) dHome.textContent = selectedAgent.units || 'Flagship Retail Store';
                        if (lblWork) lblWork.textContent = 'Operating Schedule:';
                        if (dWork) dWork.textContent = 'Mon-Sun 08:00 - 22:00';
                        if (schedTitle) schedTitle.textContent = 'Store Operating Hours & Logistics:';
                        if (schedContent) {
                            schedContent.innerHTML = '<span>07:30 Restock</span><span>09:00 Store Open</span><span>18:30 Peak Footfall</span><span>22:00 Closing</span>';
                        }
                    } else if (selectedAgent.type === 'HOUSE') {
                        if (dPill) {
                            dPill.className = 'status-pill pill-live';
                            dPill.textContent = 'RESIDENTIAL PROPERTY & HOUSING DOSSIER';
                        }
                        if (dName) dName.textContent = `${selectedAgent.name} — Residence Profile`;
                        if (dAv) dAv.src = '/images/building_residence.jpg';
                        if (dMood) dMood.textContent = '🏡 98% Residential Occupancy';
                        if (lblId) lblId.textContent = 'Property ID:';
                        if (dId) dId.textContent = selectedAgent.id;
                        if (lblOcc) lblOcc.textContent = 'Housing Category:';
                        if (dOcc) dOcc.textContent = selectedAgent.activity || 'Modern Residential Complex';
                        if (lblInc) lblInc.textContent = 'Capacity / Units:';
                        if (dInc) dInc.textContent = selectedAgent.units || '420 Residential Units';
                        if (lblLoc) lblLoc.textContent = 'District Zone:';
                        if (dLoc) dLoc.textContent = selectedAgent.location || 'Green Residential Zone';
                        if (lblHome) lblHome.textContent = 'Sustainability:';
                        if (dHome) dHome.textContent = selectedAgent.rating || 'A+ Smart Sustainable Green';
                        if (lblWork) lblWork.textContent = 'Transit Links:';
                        if (dWork) dWork.textContent = 'Metro Line 3 & EV Charging Hub';
                        if (schedTitle) schedTitle.textContent = 'Building Facilities & Amenities:';
                        if (schedContent) {
                            schedContent.innerHTML = '<span>24/7 Concierge</span><span>06:00 Fitness Center</span><span>08:00 Co-Working Lounge</span><span>23:00 Quiet Hours</span>';
                        }
                    } else if (selectedAgent.type === 'ALERT') {
                        if (dPill) {
                            dPill.className = 'status-pill pill-offline';
                            dPill.textContent = 'URBAN INCIDENT & TRAFFIC TELEMETRY';
                        }
                        if (dName) dName.textContent = `${selectedAgent.name} — Incident Telemetry`;
                        if (dAv) dAv.src = '/images/alert_traffic.jpg';
                        if (dMood) dMood.textContent = '⚠️ Active Bottleneck (Severity Level 2)';
                        if (lblId) lblId.textContent = 'Incident ID:';
                        if (dId) dId.textContent = selectedAgent.id;
                        if (lblOcc) lblOcc.textContent = 'Incident Category:';
                        if (dOcc) dOcc.textContent = selectedAgent.activity || 'Roadway Congestion & Bottleneck';
                        if (lblInc) lblInc.textContent = 'Severity Metric:';
                        if (dInc) dInc.textContent = selectedAgent.rating || 'Warning Level 2 (High Delay)';
                        if (lblLoc) lblLoc.textContent = 'Corridor Location:';
                        if (dLoc) dLoc.textContent = selectedAgent.location || 'Avenue des Nations';
                        if (lblHome) lblHome.textContent = 'Impacted Routes:';
                        if (dHome) dHome.textContent = 'Bus Rapid Transit #4 & EV Expressway';
                        if (lblWork) lblWork.textContent = 'Remediation Status:';
                        if (dWork) dWork.textContent = 'Adaptive Traffic Light Reroute Active';
                        if (schedTitle) schedTitle.textContent = 'Incident Telemetry & Dispatch Timeline:';
                        if (schedContent) {
                            schedContent.innerHTML = '<span>14:15 Sensor Alert</span><span>14:22 Congestion Spike</span><span>14:30 Reroute Protocol</span><span>ETA 15m Clearance</span>';
                        }
                    } else {
                        // Citizen Agent
                        if (dPill) {
                            dPill.className = 'status-pill pill-live';
                            dPill.textContent = 'CITIZEN BIOMETRIC DOSSIER';
                        }
                        if (dName) dName.textContent = `${selectedAgent.name} — Biometric Dossier`;
                        if (dAv) dAv.src = (selectedAgent.avatar && selectedAgent.avatar.src) ? selectedAgent.avatar.src : '/images/agent_317.jpg';
                        if (dMood) dMood.textContent = `😊 ${selectedAgent.mood || 'Happy'} (94% Satisfaction)`;
                        if (lblId) lblId.textContent = 'Citizen ID:';
                        if (dId) dId.textContent = selectedAgent.id;
                        if (lblOcc) lblOcc.textContent = 'Occupation:';
                        if (dOcc) dOcc.textContent = selectedAgent.activity || 'Senior AI Engineer';
                        if (lblInc) lblInc.textContent = 'Monthly Income:';
                        if (dInc) dInc.textContent = '$4 850 / mo';
                        if (lblLoc) lblLoc.textContent = 'Current Location:';
                        if (dLoc) dLoc.textContent = selectedAgent.location || 'Business District';
                        if (lblHome) lblHome.textContent = 'Residence Node:';
                        if (dHome) dHome.textContent = 'Uptown Heights (N-UPTOWN-1)';
                        if (lblWork) lblWork.textContent = 'Workplace Node:';
                        if (dWork) dWork.textContent = 'Innovation Plaza (N-TECH-HUB)';
                        if (schedTitle) schedTitle.textContent = 'Daily Routine & Schedule:';
                        if (schedContent) {
                            schedContent.innerHTML = '<span>08:00 Commute</span><span>09:00 Work Shift</span><span>17:00 Recreation</span><span>20:00 Return Home</span>';
                        }
                    }
                }
                dossierModal.classList.add('open');
            });
        }

        if (dossierClose && dossierModal) {
            dossierClose.addEventListener('click', () => dossierModal.classList.remove('open'));
        }

        // Agent Intervention Scenario
        const btnAgScenario = document.getElementById('btnAgentScenario');
        const interventionModal = document.getElementById('agentInterventionModal');
        const interventionClose = document.getElementById('interventionModalClose');

        if (btnAgScenario && interventionModal) {
            btnAgScenario.addEventListener('click', () => {
                const targetNameEl = document.getElementById('interventionTargetName');
                if (targetNameEl && selectedAgent) targetNameEl.textContent = selectedAgent.name;
                interventionModal.classList.add('open');
            });
        }

        if (interventionClose && interventionModal) {
            interventionClose.addEventListener('click', () => interventionModal.classList.remove('open'));
        }

        // Intervention Card Triggers
        document.querySelectorAll('.intervention-card').forEach(card => {
            card.addEventListener('click', () => {
                const action = card.getAttribute('data-action');
                if (!selectedAgent) return;

                fetch(`/api/simulation/agent/${selectedAgent.id}/intervene?action=${action}`, { method: 'POST' })
                    .then(res => res.json())
                    .then(data => {
                        showToast(data.message || `Intervention applied: ${action}`, "success");
                        interventionModal.classList.remove('open');
                    })
                    .catch(() => {
                        showToast(`Action ${action} executed on ${selectedAgent.name}`, "success");
                        interventionModal.classList.remove('open');
                    });
            });
        });

        // Notifications Popover Toggle
        const btnNotifs = document.getElementById('btnHeaderNotifications');
        const notifsPopover = document.getElementById('notificationsPopover');
        const btnMarkRead = document.getElementById('btnMarkAllRead');

        if (btnNotifs && notifsPopover) {
            btnNotifs.addEventListener('click', (e) => {
                e.stopPropagation();
                notifsPopover.classList.toggle('open');
            });
            document.addEventListener('click', () => notifsPopover.classList.remove('open'));
            notifsPopover.addEventListener('click', (e) => e.stopPropagation());
        }

        if (btnMarkRead) {
            btnMarkRead.addEventListener('click', () => {
                const dot = btnNotifs.querySelector('.badge-dot');
                if (dot) dot.style.display = 'none';
                showToast("All system alerts marked as read");
            });
        }

        // User Profile Modal
        const btnProfile = document.getElementById('btnHeaderUserProfile');
        const profileModal = document.getElementById('userProfileModal');
        const profileClose = document.getElementById('userProfileModalClose');

        if (btnProfile && profileModal) {
            btnProfile.addEventListener('click', () => profileModal.classList.add('open'));
        }
        if (profileClose && profileModal) {
            profileClose.addEventListener('click', () => profileModal.classList.remove('open'));
        }

        // System Settings Modal
        const btnSettings = document.getElementById('btnHeaderSettings');
        const settingsModal = document.getElementById('settingsModal');
        const settingsClose = document.getElementById('settingsModalClose');
        const btnSaveSettings = document.getElementById('btnSaveSettings');

        if (btnSettings && settingsModal) {
            btnSettings.addEventListener('click', () => settingsModal.classList.add('open'));
        }
        if (settingsClose && settingsModal) {
            settingsClose.addEventListener('click', () => settingsModal.classList.remove('open'));
        }
        if (btnSaveSettings && settingsModal) {
            btnSaveSettings.addEventListener('click', () => {
                const cfgWeather = document.getElementById('cfgWeather');
                if (cfgWeather) {
                    const val = cfgWeather.value;
                    const iconEl = document.getElementById('headerWeatherIcon');
                    const textEl = document.getElementById('headerWeatherText');
                    let icon = '☀️';
                    let text = '21°C  Clear';
                    if (val === 'RAIN') { icon = '🌧️'; text = '16°C  Rain'; }
                    else if (val === 'FOG') { icon = '🌫️'; text = '12°C  Fog'; }
                    else if (val === 'HEATWAVE') { icon = '🔥'; text = '36°C  Heatwave'; }

                    if (iconEl) iconEl.textContent = icon;
                    if (textEl) textEl.textContent = text;
                }
                settingsModal.classList.remove('open');
                showToast("Simulation environment parameters updated", "success");
            });
        }

        // Scenarios Dropdown (Two-Way Synced)
        const scenarioSelector = document.getElementById('scenarioSelector');
        const headerBranchSelect = document.getElementById('headerBranchSelect');

        if (scenarioSelector) {
            scenarioSelector.addEventListener('change', () => {
                const val = scenarioSelector.value;
                if (headerBranchSelect) headerBranchSelect.value = val;
                sendCommand('whatif', { scenario: val });
                showToast(`Applied active scenario: ${scenarioSelector.options[scenarioSelector.selectedIndex].text}`, "info");
            });
        }

        if (headerBranchSelect) {
            headerBranchSelect.addEventListener('change', () => {
                const val = headerBranchSelect.value;
                if (scenarioSelector) scenarioSelector.value = val;
                sendCommand('whatif', { scenario: val });
                showToast(`Switched to What-If: ${headerBranchSelect.options[headerBranchSelect.selectedIndex].text}`, "info");
            });
        }
    }

    function panToCoords(x, y) {
        const dpr = window.devicePixelRatio || 1;
        const viewW = canvas.width / dpr;
        const viewH = canvas.height / dpr;
        const baseW = Math.max(1280, viewW);
        const baseH = Math.max(720, viewH);

        if (scale < 1.15) {
            scale = 1.25;
        }

        const minPanX = Math.min(0, viewW - (baseW * scale));
        const minPanY = Math.min(0, viewH - (baseH * scale));

        let targetX = (viewW / 2) - (x * scale);
        let targetY = (viewH / 2) - (y * scale);

        panX = Math.min(0, Math.max(minPanX, targetX));
        panY = Math.min(0, Math.max(minPanY, targetY));
        updateMiniMapViewport();
    }

    function updateStatusPill(running) {
        const pill = document.getElementById('headerStatusPill');
        const text = document.getElementById('headerStatusText');
        if (pill && text) {
            if (running) {
                pill.className = 'status-pill pill-live';
                text.textContent = 'Simulation Running';
            } else {
                pill.className = 'status-pill';
                text.textContent = 'Simulation Paused';
            }
        }
    }

    // ── Modals & Drawer Directories Setup ───────────────────────────────
    function setupModals() {
        // 1. Agents Directory Modal
        const navAgents = document.getElementById('navItemAgents');
        const agentsModal = document.getElementById('agentsDirectoryModal');
        const agentsClose = document.getElementById('agentsModalClose');
        const agentSearch = document.getElementById('agentSearchInput');

        if (navAgents && agentsModal) {
            navAgents.addEventListener('click', () => {
                agentsModal.classList.add('open');
                loadAgentsDirectory();
            });
        }
        if (agentsClose && agentsModal) {
            agentsClose.addEventListener('click', () => agentsModal.classList.remove('open'));
        }

        function loadAgentsDirectory() {
            const tbody = document.getElementById('agentsModalTableBody');
            if (!tbody) return;
            fetch('/api/simulation/citizens')
                .then(res => res.json())
                .then(citizens => {
                    renderAgentsTable(citizens);
                    if (agentSearch) {
                        agentSearch.oninput = () => {
                            const q = agentSearch.value.toLowerCase();
                            const filtered = citizens.filter(c => c.name.toLowerCase().includes(q) || c.occupation.toLowerCase().includes(q));
                            renderAgentsTable(filtered);
                        };
                    }
                })
                .catch(() => {
                    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">Failed to load agents list.</td></tr>`;
                });
        }

        function renderAgentsTable(citizens) {
            const tbody = document.getElementById('agentsModalTableBody');
            if (!tbody) return;
            if (citizens.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 1.5rem;">No matching citizens found.</td></tr>`;
                return;
            }
            tbody.innerHTML = citizens.slice(0, 50).map(c => `
                <tr>
                    <td>
                        <strong style="color: var(--text-main);">${c.name}</strong>
                        <div style="font-size: 0.68rem; color: var(--text-muted); font-family: var(--font-mono);">${c.id}</div>
                    </td>
                    <td>${c.occupation}</td>
                    <td style="font-family: var(--font-mono);">$${c.income}</td>
                    <td>
                        <span style="color: var(--green-accent); font-weight: 700;">${c.satisfaction}%</span>
                    </td>
                    <td>
                        <span class="status-pill pill-live" style="font-size: 0.65rem; padding: 0.15rem 0.45rem;">${c.state}</span>
                    </td>
                    <td style="text-align: right;">
                        <button type="button" class="btn btn-secondary btn-sm" onclick="window.inspectCitizenOnMap('${c.id}', ${c.posX}, ${c.posY}, '${c.name}', '${c.occupation}')">🎯 Track</button>
                    </td>
                </tr>
            `).join('');
        }

        window.inspectCitizenOnMap = (id, x, y, name, occ) => {
            if (agentsModal) agentsModal.classList.remove('open');
            selectAgent({
                id: id,
                name: name,
                x: x || 485,
                y: y || 395,
                ringColor: "#10b981",
                avatar: avatarAgent317,
                role: "Citizen",
                location: "Assigned District",
                activity: occ || "Active",
                mood: "Content"
            });
            panToCoords(x || 485, y || 395);
            showToast(`Tracking ${name} on map view`, "info");
        };

        // 2. Vehicles Fleet Modal
        const navVehicles = document.getElementById('navItemVehicles');
        const vehiclesModal = document.getElementById('vehiclesFleetModal');
        const vehiclesClose = document.getElementById('vehiclesModalClose');

        if (navVehicles && vehiclesModal) {
            navVehicles.addEventListener('click', () => {
                vehiclesModal.classList.add('open');
                fetch('/api/simulation/vehicles')
                    .then(res => res.json())
                    .then(vehicles => {
                        const tbody = document.getElementById('vehiclesModalTableBody');
                        if (tbody) {
                            tbody.innerHTML = vehicles.slice(0, 40).map(v => `
                                <tr>
                                    <td><strong>${v.name}</strong> <span style="font-size: 0.68rem; color: var(--text-muted);">(${v.id})</span></td>
                                    <td><span style="font-family: var(--font-mono); font-weight: 700; color: var(--sky-accent);">${v.currentSpeed} km/h</span></td>
                                    <td>${v.maxSpeed} km/h</td>
                                    <td style="font-family: var(--font-mono);">${v.originNodeId}</td>
                                    <td style="font-family: var(--font-mono);">${v.destinationNodeId}</td>
                                    <td>${v.rerouteCount}</td>
                                    <td><span class="status-pill pill-live" style="font-size: 0.65rem;">Routing A*</span></td>
                                </tr>
                            `).join('');
                        }
                    });
            });
        }
        if (vehiclesClose && vehiclesModal) {
            vehiclesClose.addEventListener('click', () => vehiclesModal.classList.remove('open'));
        }

        // 3. Businesses Directory Modal
        const navBusinesses = document.getElementById('navItemBusinesses');
        const businessesModal = document.getElementById('businessesModal');
        const businessesClose = document.getElementById('businessesModalClose');

        if (navBusinesses && businessesModal) {
            navBusinesses.addEventListener('click', () => {
                businessesModal.classList.add('open');
                fetch('/api/simulation/businesses')
                    .then(res => res.json())
                    .then(bizs => {
                        const tbody = document.getElementById('businessesModalTableBody');
                        if (tbody) {
                            tbody.innerHTML = bizs.map(b => `
                                <tr>
                                    <td><strong>${b.name}</strong></td>
                                    <td><span class="status-pill" style="font-size: 0.65rem;">${b.sector}</span></td>
                                    <td>${b.employees} / ${b.maxCapacity}</td>
                                    <td>$${b.averageSalary}</td>
                                    <td style="color: var(--green-accent); font-weight: 700;">$${b.revenue.toLocaleString()}</td>
                                    <td style="color: var(--sky-accent); font-weight: 700;">+$${b.netProfit.toLocaleString()}</td>
                                </tr>
                            `).join('');
                        }
                    });
            });
        }
        if (businessesClose && businessesModal) {
            businessesClose.addEventListener('click', () => businessesModal.classList.remove('open'));
        }

        // 4. Analytics Studio Modal
        const navAnalytics = document.getElementById('navItemAnalytics');
        const analyticsModal = document.getElementById('analyticsModal');
        const analyticsClose = document.getElementById('analyticsModalClose');

        if (navAnalytics && analyticsModal) {
            navAnalytics.addEventListener('click', () => {
                analyticsModal.classList.add('open');
                fetch('/api/simulation/analytics')
                    .then(res => res.json())
                    .then(data => {
                        const gcp = document.getElementById('analyticsGcp');
                        const cong = document.getElementById('analyticsCongestion');
                        const sat = document.getElementById('analyticsSat');
                        if (gcp && data.grossCityProduct) gcp.textContent = '$' + Math.round(data.grossCityProduct).toLocaleString();
                        if (cong && data.congestionRatio !== undefined) cong.textContent = Math.round(data.congestionRatio * 100) + '%';
                        if (sat && data.avgSatisfaction !== undefined) sat.textContent = Math.round(data.avgSatisfaction) + '%';
                    });
            });
        }
        if (analyticsClose && analyticsModal) {
            analyticsClose.addEventListener('click', () => analyticsModal.classList.remove('open'));
        }

        // 5. Logs & Events Modal
        const navLogs = document.getElementById('navItemLogs');
        const btnViewAll = document.getElementById('btnViewAllEvents');
        const logsModal = document.getElementById('logsModal');
        const logsClose = document.getElementById('logsModalClose');

        function openLogs() {
            if (logsModal) logsModal.classList.add('open');
            fetch('/api/simulation/events')
                .then(res => res.json())
                .then(events => {
                    const tbody = document.getElementById('logsModalTableBody');
                    if (tbody) {
                        tbody.innerHTML = events.map(ev => {
                            const badgeCls = ev.severity === 'CRITICAL' ? 'delta-bad' : (ev.severity === 'WARNING' ? 'status-pill' : 'delta-good');
                            return `
                                <tr>
                                    <td style="font-family: var(--font-mono); font-size: 0.72rem; color: var(--text-muted);">${ev.timestamp ? ev.timestamp.replace('T', ' ').substring(0, 19) : 'Live'}</td>
                                    <td><strong style="font-size: 0.75rem;">${ev.eventType}</strong></td>
                                    <td><span class="delta-badge ${badgeCls}">${ev.severity}</span></td>
                                    <td style="color: var(--text-body);">${ev.description}</td>
                                </tr>
                            `;
                        }).join('');
                    }
                });
        }

        if (navLogs) navLogs.addEventListener('click', openLogs);
        if (btnViewAll) btnViewAll.addEventListener('click', openLogs);
        if (logsClose && logsModal) logsClose.addEventListener('click', () => logsModal.classList.remove('open'));

        // 6. Focus Simulation Control in sidebar
        const navSimControl = document.getElementById('navItemSimControl');
        if (navSimControl) {
            navSimControl.addEventListener('click', () => {
                const card = document.querySelector('.sim-btn-row');
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.transition = 'box-shadow 0.3s';
                    card.style.boxShadow = '0 0 0 3px rgba(37, 99, 235, 0.4)';
                    setTimeout(() => card.style.boxShadow = 'none', 1500);
                }
            });
        }

        // 7. What-If Comparison Modal
        const whatIfModal = document.getElementById('whatIfModal');
        const modalClose = document.getElementById('modalClose');
        const btnQuickScenario = document.getElementById('btnQuickScenario');
        const btnManageScenarios = document.getElementById('btnManageScenarios');
        const btnOpenWhatIfModal = document.getElementById('btnOpenWhatIfModal');

        function openWhatIf() {
            fetch('/api/simulation/whatif/compare')
                .then(res => res.json())
                .then(data => {
                    const tbody = document.getElementById('comparisonTableBody');
                    if (tbody && data.metrics) {
                        let rows = '';
                        data.metrics.forEach(m => {
                            const badgeCls = m.isPositive ? 'delta-good' : 'delta-bad';
                            rows += `<tr>
                                <td><strong>${m.metricName}</strong></td>
                                <td>${m.baselineValue}</td>
                                <td>${m.scenarioValue}</td>
                                <td><span class="delta-badge ${badgeCls}">${m.delta}</span></td>
                            </tr>`;
                        });
                        tbody.innerHTML = rows;
                    }
                    if (whatIfModal) whatIfModal.classList.add('open');
                })
                .catch(() => {
                    if (whatIfModal) whatIfModal.classList.add('open');
                });
        }

        if (btnQuickScenario) btnQuickScenario.addEventListener('click', openWhatIf);
        if (btnManageScenarios) btnManageScenarios.addEventListener('click', openWhatIf);
        if (btnOpenWhatIfModal) btnOpenWhatIfModal.addEventListener('click', openWhatIf);
        if (modalClose && whatIfModal) modalClose.addEventListener('click', () => whatIfModal.classList.remove('open'));

        // 8. Architecture Modal
        const archModal = document.getElementById('architectureDocModal');
        const archClose = document.getElementById('docModalClose');
        const btnArch = document.getElementById('btnOpenArchitectureModal');

        if (btnArch && archModal) btnArch.addEventListener('click', () => archModal.classList.add('open'));
        if (archClose && archModal) archClose.addEventListener('click', () => archModal.classList.remove('open'));

        // 9. Export Data Modal & Downloads
        const btnQuickExport = document.getElementById('btnQuickExport');
        const exportModal = document.getElementById('exportModal');
        const exportClose = document.getElementById('exportModalClose');

        if (btnQuickExport && exportModal) btnQuickExport.addEventListener('click', () => exportModal.classList.add('open'));
        if (exportClose && exportModal) exportClose.addEventListener('click', () => exportModal.classList.remove('open'));

        const btnExpJson = document.getElementById('btnExportFullJson');
        if (btnExpJson) {
            btnExpJson.addEventListener('click', () => {
                fetch('/api/simulation/state')
                    .then(res => res.json())
                    .then(data => downloadFile(JSON.stringify(data, null, 2), 'aether_simulation_state.json', 'application/json'));
            });
        }

        const btnExpCitizens = document.getElementById('btnExportCitizensCsv');
        if (btnExpCitizens) {
            btnExpCitizens.addEventListener('click', () => {
                fetch('/api/simulation/citizens')
                    .then(res => res.json())
                    .then(citizens => {
                        let csv = 'ID,Name,Occupation,Income,Satisfaction,State\n';
                        citizens.forEach(c => csv += `"${c.id}","${c.name}","${c.occupation}",${c.income},${c.satisfaction},"${c.state}"\n`);
                        downloadFile(csv, 'citizens_registry.csv', 'text/csv');
                    });
            });
        }

        const btnExpVehicles = document.getElementById('btnExportVehiclesCsv');
        if (btnExpVehicles) {
            btnExpVehicles.addEventListener('click', () => {
                fetch('/api/simulation/vehicles')
                    .then(res => res.json())
                    .then(vehicles => {
                        let csv = 'ID,Name,Speed,Origin,Destination,Reroutes\n';
                        vehicles.forEach(v => csv += `"${v.id}","${v.name}",${v.currentSpeed},"${v.originNodeId}","${v.destinationNodeId}",${v.rerouteCount}\n`);
                        downloadFile(csv, 'vehicles_fleet.csv', 'text/csv');
                    });
            });
        }

        function downloadFile(content, fileName, contentType) {
            const a = document.createElement('a');
            const file = new Blob([content], { type: contentType });
            a.href = URL.createObjectURL(file);
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(a.href);
            showToast(`Exported ${fileName}`, "success");
        }

        // Print Report
        const btnReports = document.getElementById('btnQuickReports');
        if (btnReports) btnReports.addEventListener('click', () => window.print());
    }

    // ── Live Telemetry & System Resource Metrics Polling ─────────────────
    setInterval(() => {
        fetch('/api/simulation/metrics/system')
            .then(res => res.json())
            .then(m => {
                if (!m) return;
                // Update CPU Donut text and SVG arc
                const cpuBig = document.querySelector('.donut-pct-big');
                if (cpuBig) cpuBig.textContent = m.cpuUsage + '%';
                const donutArc = document.getElementById('donutArcCircle');
                if (donutArc && m.cpuUsage !== undefined) {
                    const arcLen = Math.round((m.cpuUsage / 100) * 226.2);
                    donutArc.setAttribute('stroke-dasharray', `${arcLen} 226`);
                }

                // Update Legend numbers
                const resVals = document.querySelectorAll('.resource-val');
                if (resVals.length >= 4) {
                    resVals[0].textContent = m.cpuUsage + '%';
                    resVals[1].textContent = (m.memoryUsagePct || 54) + '%';
                    resVals[2].textContent = (m.diskUsagePct || 32) + '%';
                    resVals[3].textContent = (m.networkUsagePct || 12) + '%';
                }
            })
            .catch(() => {});
    }, 4000);

})();
