/**
 * EcoTrack AI — Frontend Application Logic
 * Built for Hack Devengers 2.0 (Open Innovation Track)
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    grossEmissions: 28492.4,
    scope1: 4812.0,
    scope2: 7140.5,
    scope3: 16539.9,
    netZeroProgress: 68.4,
    deltaRate: -0.42,
    activeChartScope: 'all',
    currentSlide: 1,
    totalSlides: 10,
    selectedPreset: 'freight',
    gisMap: null,
    gisMarkers: [],
    trajectoryChart: null,
    scopeDonutChart: null,
    abatementChart: null,
    
    // Sliders
    fleetEvPct: 35,
    renewablePpaPct: 50,
    nearshoringPct: 25,
    smartHvacPct: 40
  };

  // Presets Database for AI Multimodal Ingestion Studio
  const presetsData = {
    freight: {
      title: "Maritime Freight Manifest",
      origin: "Rotterdam Europort (NL)",
      destination: "Jawaharlal Nehru Port, Mumbai (IN)",
      cargo: "Industrial Robotics & Clean Tech Components",
      volumeText: "8,420,000 Tonne-Kilometers (1,200 TEU)",
      rawDoc: `[BILL OF LADING / FREIGHT MANIFEST #MA-8921-2026]
Vessel: MV Nordic Horizon (IMO 9821449)
Voyage No: 2026-W09 | Flag: Singapore
Carrier: Maersk Triple-E Class Liner
Origin: Rotterdam Terminal Port 3 (51.95°N, 4.14°E)
Destination: JNPT Mumbai Harbor (18.94°N, 72.95°E)
Cargo: 1,200 TEU High-Precision Industrial Assemblies
Gross Freight Mass: 14,280 Metric Tonnes
Voyage Distance: 6,430 Nautical Miles (11,908 km)
Fuel Specification: Very Low Sulphur Fuel Oil (VLSFO)`,
      category: "Scope 3.4 — Upstream Maritime Logistics",
      factor: "UK DEFRA / IMO GLEC Framework (0.0161 kg CO₂e / t.km)",
      volume: 8420000,
      emissions: 135.56,
      scope: 3,
      confidence: "99.4%",
      recommendation: "Switching 40% of this maritime corridor to bio-methanol bunkering at Rotterdam Port will reduce this shipment's Scope 3 emissions by <strong>54.2 MT CO₂e (-40.0%)</strong> with an estimated green premium of only ₹1.82L ($2,180)."
    },
    utility: {
      title: "Grid Utility Invoice",
      origin: "Austin Regional Industrial Facility",
      destination: "ERCOT Texas Interconnection",
      cargo: "High-Voltage Power Ingestion",
      volumeText: "840,000 Kilowatt-Hours (kWh)",
      rawDoc: `[COMMERCIAL ELECTRIC UTILITY STATEMENT #TX-904-811]
Billing Account: EcoTrack Global Operations LLC
Facility ID: TX-AUSTIN-FAB-02 | Meter ID: ERCOT-88190
Billing Period: Feb 01, 2026 - Feb 28, 2026 (28 Days)
Active Energy Draw: 840,000 kWh | Peak Demand: 1,840 kW
Grid Substation: Travis County Sub-4 (Texas Grid)
Fuel Mix: 54% Natural Gas, 26% Wind, 14% Solar, 6% Coal
Grid Sub-region Factor: ERCOT South (0.441 kg CO₂e/kWh)`,
      category: "Scope 2 — Market-Based Purchased Grid Power",
      factor: "US EPA eGRID 2025 Subregion ERCOT (0.441 kg CO₂e / kWh)",
      volume: 840000,
      emissions: 370.44,
      scope: 2,
      confidence: "99.8%",
      recommendation: "Procuring a 1.2 MW Virtual Power Purchase Agreement (VPPA) with West Texas Wind Corridor will eliminate <strong>318.5 MT CO₂e (-86.0%)</strong> from Scope 2 electricity at parity pricing."
    },
    fleet: {
      title: "Commercial Fleet Fuel Log",
      origin: "Midwest Distribution Logistics Network",
      destination: "Fleet Hub 07 (Last-Mile Operations)",
      cargo: "Ultra-Low Sulfur Commercial Diesel Fuel",
      volumeText: "42,500 Liters Diesel Fuel Draw",
      rawDoc: `[COMMERCIAL FLEET TELEMATICS & FUEL AUDIT #FL-3391]
Depot: Chicago South Logistics Terminal
Vehicle Classification: Class 6 Medium-Duty Freight Vans
Fleet Units: 68 Active Delivery Vehicles
Audit Interval: 14-Day Automated Fuel Telemetry
Total Dispensed: 42,500.0 Liters Ultra-Low Sulfur Diesel
Odometer Aggregate: 184,200 km | Fuel Efficiency: 4.33 km/L
Fuel Standard: EN 590 / ASTM D975`,
      category: "Scope 1 — Mobile Combustion (Commercial Fleet)",
      factor: "US EPA Fleet Standard 2025 (2.653 kg CO₂e / Liter)",
      volume: 42500,
      emissions: 112.75,
      scope: 1,
      confidence: "99.2%",
      recommendation: "Transitioning 24 route-dense vehicles to Electric Vans (EV) will eliminate <strong>48.6 MT CO₂e monthly</strong>, cutting fleet diesel OPEX by ₹9.4 Lakhs ($11,200) with a 2.1-year payback."
    },
    datacenter: {
      title: "Cloud Compute Telemetry",
      origin: "Cloud Infrastructure (AWS US-East & Frankfurt)",
      destination: "Internal Microservices Fleet",
      cargo: "Compute vCPU-hours & GPU Ingestion",
      volumeText: "92,000 vCPU-hours & 4,800 GPU-hours",
      rawDoc: `[CLOUD SUSTAINABILITY & EMISSION API TELEMETRY #CLD-772]
Provider: AWS Cloud Computing Services
Data Center Regions: us-east-1 (N. Virginia), eu-central-1 (Frankfurt)
PUE Coefficient: 1.48 (Weighted Average Across Clusters)
Compute Instances: c6i.4xlarge, g5.2xlarge (AI Models)
Total Active Compute Time: 92,000 vCPU-hrs | 4,800 A100-hrs
Energy Consumed: 58,420 kWh Equivalent
Green Power Match: 58% (Frankfurt 100%, US-East 42%)`,
      category: "Scope 3.8 — Upstream Leased Assets & Cloud Compute",
      factor: "Cloud Carbon Footprint Open Standard (0.306 kg/kWh)",
      volume: 58420,
      emissions: 28.16,
      scope: 3,
      confidence: "98.9%",
      recommendation: "Migrating latency-insensitive background batch inference jobs from US-East to AWS eu-central-1 (100% renewable powered) reduces cloud carbon by <strong>17.4 MT CO₂e (-61.8%)</strong> at zero extra infrastructure cost."
    }
  };

  // Supply Chain GIS Nodes
  const mapNodes = [
    {
      name: "Shanghai Giga-Assembly Plant",
      coords: [31.2304, 121.4737],
      scope: 1,
      type: "Heavy Manufacturing Facility",
      emissions: "6,480 MT CO₂e",
      intensity: "critical",
      renewables: "18% Onsite Solar",
      rec: "Contract with Jiangsu Provincial offshore wind farm to lower grid footprint."
    },
    {
      name: "Rotterdam Europort Terminal",
      coords: [51.9244, 4.4777],
      scope: 3,
      type: "Maritime Freight Corridor Hub",
      emissions: "5,820 MT CO₂e",
      intensity: "critical",
      renewables: "Shore Power Capable",
      rec: "Mandate cold-ironing shore power connection for all docked feeder container ships."
    },
    {
      name: "Singapore Transshipment Port",
      coords: [1.3521, 103.8198],
      scope: 3,
      type: "Global Maritime Logistics Center",
      emissions: "5,190 MT CO₂e",
      intensity: "critical",
      renewables: "LNG Bunkering Available",
      rec: "Prioritize low-emission maritime corridors under IMO Green Shipping Agreement."
    },
    {
      name: "Austin Advanced Assembly Campus",
      coords: [30.2672, -97.7431],
      scope: 1,
      type: "Precision Cleanroom & Automation",
      emissions: "3,210 MT CO₂e",
      intensity: "moderate",
      renewables: "45% Solar PPA",
      rec: "Expand rooftop solar canopy over employee parking and logistics loading bays."
    },
    {
      name: "Tokyo Electronics Micro-Fab",
      coords: [35.6762, 139.6503],
      scope: 1,
      type: "Semiconductor Packaging & Testing",
      emissions: "2,840 MT CO₂e",
      intensity: "moderate",
      renewables: "30% Clean Grid Cert",
      rec: "Upgrade chiller compressor VFDs to achieve 14% energy reduction."
    },
    {
      name: "Mumbai Western Logistics Hub",
      coords: [19.0760, 72.8777],
      scope: 3,
      type: "South Asia Intermodal Freight Terminal",
      emissions: "2,420 MT CO₂e",
      intensity: "moderate",
      renewables: "12% Solar",
      rec: "Electrify terminal yard tractors and container forklifts to cut diesel exhaust."
    },
    {
      name: "Chicago Distribution Center",
      coords: [41.8781, -87.6298],
      scope: 3,
      type: "Midwest Logistics Cross-Dock",
      emissions: "1,980 MT CO₂e",
      intensity: "moderate",
      renewables: "22% Community Solar",
      rec: "Implement dynamic route optimization for Class 6 delivery trucks."
    },
    {
      name: "Dubai Logistics Gateway",
      coords: [25.2048, 55.2708],
      scope: 3,
      type: "Air & Ocean Freight Transfer",
      emissions: "2,150 MT CO₂e",
      intensity: "moderate",
      renewables: "DEWA Solar Park Linked",
      rec: "Utilize SAF (Sustainable Aviation Fuel) blends for priority air cargo routes."
    },
    {
      name: "Frankfurt Green Cloud Data Center",
      coords: [50.1109, 8.6821],
      scope: 2,
      type: "Tier IV Colocation Data Facility",
      emissions: "420 MT CO₂e",
      intensity: "green",
      renewables: "100% Certified Hydro/Wind",
      rec: "Gold standard facility with waste heat recycling into municipal district heating."
    },
    {
      name: "Bengaluru Technology Campus & R&D",
      coords: [12.9716, 77.5946],
      scope: 2,
      type: "Corporate Headquarters & Software Lab",
      emissions: "610 MT CO₂e",
      intensity: "green",
      renewables: "92% Solar Wheeling",
      rec: "LEED Platinum certified. Implement AI daylight harvesting in all wings."
    },
    {
      name: "London Corporate Operations Hub",
      coords: [51.5074, -0.1278],
      scope: 2,
      type: "Executive Center & Trading Floor",
      emissions: "340 MT CO₂e",
      intensity: "green",
      renewables: "100% UK Wind PPA",
      rec: "Net-Zero Scope 1 and 2 certified since 2024."
    },
    {
      name: "Sao Paulo Sustainable Packaging Mill",
      coords: [-23.5505, -46.6333],
      scope: 3,
      type: "Certified Bio-Polymer Sourcing",
      emissions: "580 MT CO₂e",
      intensity: "green",
      renewables: "90% Sugarcane Biomass",
      rec: "Circular economy closed-loop supplier for European shipping cartons."
    }
  ];

  /* --------------------------------------------------------------------------
     1. INITIALIZATION: CHARTS (CHART.JS)
     -------------------------------------------------------------------------- */
  function initCharts() {
    // Chart 1: Trajectory Chart
    const trajectoryCtx = document.getElementById('trajectoryChart');
    if (trajectoryCtx) {
      state.trajectoryChart = new Chart(trajectoryCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct (F)', 'Nov (F)', 'Dec (F)'],
          datasets: [
            {
              label: 'Audited Actual Emissions (2026)',
              data: [2650, 2580, 2510, 2440, 2390, 2320, 2280, 2210, 2180, null, null, null],
              borderColor: '#10b981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderWidth: 3,
              tension: 0.35,
              pointBackgroundColor: '#10b981',
              pointBorderColor: '#ffffff',
              pointRadius: 4,
              fill: true
            },
            {
              label: 'AI Autonomous Forecast',
              data: [null, null, null, null, null, null, null, null, 2180, 2110, 2040, 1980],
              borderColor: '#06b6d4',
              borderDash: [6, 6],
              borderWidth: 2.5,
              tension: 0.35,
              pointBackgroundColor: '#06b6d4',
              pointRadius: 4,
              fill: false
            },
            {
              label: 'SBTi 1.5°C Net-Zero Glidepath',
              data: [2700, 2630, 2560, 2490, 2420, 2350, 2280, 2210, 2140, 2070, 2000, 1930],
              borderColor: '#f59e0b',
              borderDash: [3, 3],
              borderWidth: 1.5,
              pointRadius: 0,
              fill: false
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: {
            mode: 'index',
            intersect: false
          },
          plugins: {
            legend: {
              labels: {
                color: '#94a3b8',
                font: { family: 'Outfit', size: 11 }
              }
            },
            tooltip: {
              backgroundColor: 'rgba(11, 19, 23, 0.95)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              borderWidth: 1,
              titleFont: { family: 'Outfit', weight: 'bold' },
              bodyFont: { family: 'JetBrains Mono' },
              callbacks: {
                label: (context) => ` ${context.dataset.label}: ${context.parsed.y} MT CO₂e`
              }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b', font: { family: 'Outfit' } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { 
                color: '#64748b',
                font: { family: 'JetBrains Mono' },
                callback: (v) => `${v} MT`
              }
            }
          }
        }
      });
    }

    // Chart 2: Scope Allocation Donut
    const scopeDonutCtx = document.getElementById('scopeDonutChart');
    if (scopeDonutCtx) {
      state.scopeDonutChart = new Chart(scopeDonutCtx, {
        type: 'doughnut',
        data: {
          labels: ['Scope 1 (Direct)', 'Scope 2 (Purchased Energy)', 'Scope 3 (Supply Chain)'],
          datasets: [{
            data: [state.scope1, state.scope2, state.scope3],
            backgroundColor: [
              '#f59e0b',
              '#06b6d4',
              '#8b5cf6'
            ],
            borderColor: '#0b1317',
            borderWidth: 3,
            hoverOffset: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(11, 19, 23, 0.95)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              bodyFont: { family: 'JetBrains Mono', size: 12 },
              callbacks: {
                label: (context) => {
                  const val = context.parsed;
                  const total = state.grossEmissions;
                  const pct = ((val / total) * 100).toFixed(1);
                  return ` ${context.label}: ${val.toLocaleString()} MT (${pct}%)`;
                }
              }
            }
          }
        }
      });
    }

    // Chart 3: Abatement Curve Chart
    const abatementCtx = document.getElementById('abatementCurveChart');
    if (abatementCtx) {
      state.abatementChart = new Chart(abatementCtx, {
        type: 'bar',
        data: {
          labels: ['EV Fleet', 'Renewable PPA', 'Nearshoring', 'Smart HVAC'],
          datasets: [
            {
              label: 'CO₂e Mitigated (MT / Year)',
              data: [1680, 3570, 1140, 824],
              backgroundColor: [
                'rgba(16, 185, 129, 0.8)',
                'rgba(6, 182, 212, 0.8)',
                'rgba(245, 158, 11, 0.8)',
                'rgba(139, 92, 246, 0.8)'
              ],
              borderRadius: 6
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(11, 19, 23, 0.95)',
              borderColor: 'rgba(16, 185, 129, 0.3)',
              borderWidth: 1,
              bodyFont: { family: 'JetBrains Mono' },
              callbacks: {
                label: (c) => ` Avoided: ${c.parsed.y} MT CO₂e/yr`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { family: 'Outfit', size: 11 } }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } }
            }
          }
        }
      });
    }
  }

  /* --------------------------------------------------------------------------
     2. INITIALIZATION: LEAFLET GIS MAP
     -------------------------------------------------------------------------- */
  function initGisMap() {
    const mapElement = document.getElementById('gisMap');
    if (!mapElement) return;

    // Create Leaflet Map centered on global view
    state.gisMap = L.map('gisMap', {
      center: [25, 20],
      zoom: 2.2,
      minZoom: 1.8,
      maxZoom: 12,
      zoomControl: true,
      attributionControl: false
    });

    // Dark Map Tile Layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(state.gisMap);

    // Custom Glowing DivIcon creator
    function createGlowIcon(intensity) {
      let color = '#10b981';
      if (intensity === 'critical') color = '#ef4444';
      if (intensity === 'moderate') color = '#f59e0b';

      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="
            width: 14px;
            height: 14px;
            background-color: ${color};
            border: 2px solid #ffffff;
            border-radius: 50%;
            box-shadow: 0 0 12px ${color}, 0 0 24px ${color};
            cursor: pointer;
            transition: transform 0.2s;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });
    }

    // Render Markers
    renderGisMarkers('all');

    // Filter Buttons Listener
    const filterButtons = document.querySelectorAll('.map-filter-btn');
    filterButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        renderGisMarkers(filter);
      });
    });
  }

  function renderGisMarkers(filter) {
    // Clear existing
    state.gisMarkers.forEach(m => state.gisMap.removeLayer(m));
    state.gisMarkers = [];

    mapNodes.forEach(node => {
      // Filter condition
      if (filter === 'scope1' && node.scope !== 1) return;
      if (filter === 'scope2' && node.scope !== 2) return;
      if (filter === 'scope3' && node.scope !== 3) return;

      const marker = L.marker(node.coords, {
        icon: createMapIcon(node.intensity)
      }).addTo(state.gisMap);

      const popupContent = `
        <div style="font-family: Outfit, sans-serif; padding: 4px; min-width: 220px;">
          <div style="font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: #10b981; font-weight: 700;">
            GHG Scope ${node.scope} Facility
          </div>
          <h4 style="margin: 4px 0; font-size: 1rem; color: #ffffff;">${node.name}</h4>
          <p style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 8px;">${node.type}</p>
          
          <div style="background: rgba(255,255,255,0.05); padding: 8px; border-radius: 6px; font-size: 0.8rem; margin-bottom: 8px;">
            <div><strong>Annual Emissions:</strong> <span style="color: #34d399; font-family: 'JetBrains Mono';">${node.emissions}</span></div>
            <div><strong>Energy Mix:</strong> ${node.renewables}</div>
          </div>

          <div style="font-size: 0.76rem; color: #cbd5e1; border-left: 2px solid #06b6d4; padding-left: 6px;">
            <strong>AI Optimization:</strong> ${node.rec}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      state.gisMarkers.push(marker);
    });
  }

  function createMapIcon(intensity) {
    let color = '#10b981';
    if (intensity === 'critical') color = '#ef4444';
    if (intensity === 'moderate') color = '#f59e0b';

    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div style="
          width: 14px;
          height: 14px;
          background-color: ${color};
          border: 2px solid #ffffff;
          border-radius: 50%;
          box-shadow: 0 0 10px ${color};
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });
  }

  /* --------------------------------------------------------------------------
     3. AI MULTIMODAL INGESTION STUDIO
     -------------------------------------------------------------------------- */
  function initAiStudio() {
    const presetButtons = document.querySelectorAll('.preset-btn');
    const runAiBtn = document.getElementById('btnRunAiAudit');
    const commitBtn = document.getElementById('btnCommitAudit');
    const resetBtn = document.getElementById('btnResetAudit');
    const browseFileBtn = document.getElementById('btnBrowseFile');
    const fileInput = document.getElementById('manifestFileInput');
    const dropzone = document.getElementById('fileDropzone');

    // Load initial preset
    loadPreset('freight');

    // Preset Selection
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const key = btn.dataset.preset;
        state.selectedPreset = key;
        loadPreset(key);
      });
    });

    // Run AI Audit Animation
    if (runAiBtn) {
      runAiBtn.addEventListener('click', () => {
        triggerAiScanningAnimation();
      });
    }

    // Commit to Ledger
    if (commitBtn) {
      commitBtn.addEventListener('click', () => {
        const p = presetsData[state.selectedPreset];
        commitEmissionsToLedger(p.emissions, p.scope, p.title);
      });
    }

    // Reset
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        loadPreset(state.selectedPreset);
        showToast('Audit Ingestion Reset', 'Values restored to initial scan.');
      });
    }

    // File Browse
    if (browseFileBtn && fileInput) {
      browseFileBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
          handleUserFileUpload(e.target.files[0]);
        }
      });
    }

    // Drag and Drop
    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = '#10b981';
      });

      dropzone.addEventListener('dragleave', () => {
        dropzone.style.borderColor = 'rgba(16, 185, 129, 0.3)';
      });

      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        if (e.dataTransfer.files.length > 0) {
          handleUserFileUpload(e.dataTransfer.files[0]);
        }
      });
    }
  }

  function loadPreset(key) {
    const data = presetsData[key];
    if (!data) return;

    // Render Mock Document with Highlights
    const docView = document.getElementById('documentMockView');
    if (docView) {
      // Escape HTML and highlight key phrases
      let formatted = data.rawDoc
        .replace(/(\b\d+[\d,.]*\s*(?:TEU|kWh|Liters|kW|Metric Tonnes|vCPU-hrs|A100-hrs)\b)/g, '<span class="doc-line-highlight">$1</span>')
        .replace(/(IMO \d+|DEFRA|eGRID|ASTM \D\d+|ERCOT-\d+)/g, '<span class="doc-line-highlight" style="color: #67e8f9;">$1</span>')
        .replace(/\n/g, '<br>');

      docView.innerHTML = formatted;
    }

    // Render Extracted Fields
    document.getElementById('resCategory').textContent = data.category;
    document.getElementById('resFactor').textContent = data.factor;
    document.getElementById('resVolume').textContent = data.volumeText;
    document.getElementById('resEmissions').textContent = `+${data.emissions.toFixed(2)} MT CO₂e`;
    document.getElementById('aiConfidenceBadge').innerHTML = `<i class="fa-solid fa-circle-check"></i> Model Confidence: <strong>${data.confidence}</strong>`;
    document.getElementById('aiRecText').innerHTML = data.recommendation;
  }

  function triggerAiScanningAnimation() {
    const laser = document.getElementById('scanningLaser');
    const docContainer = document.getElementById('docScanContainer');
    
    if (laser && docContainer) {
      laser.style.display = 'block';
      docContainer.style.borderColor = '#10b981';
      docContainer.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3)';

      showToast('AI Ingestion Running', 'Extracting OCR tokens, identifying GHG emission factors...');

      setTimeout(() => {
        docContainer.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        docContainer.style.boxShadow = 'none';
        showToast('AI Inference Complete', 'Audit verified with 99.4% confidence rating.');
      }, 1400);
    }
  }

  function handleUserFileUpload(file) {
    showToast('Document Ingested', `Analyzing "${file.name}" via Multimodal OCR.`);
    triggerAiScanningAnimation();

    // Mock document display for custom uploaded file
    const docView = document.getElementById('documentMockView');
    if (docView) {
      docView.innerHTML = `
        [USER FILE INGESTION: ${file.name.toUpperCase()}]<br>
        File Size: ${(file.size / 1024).toFixed(1)} KB | MIME: ${file.type || 'application/pdf'}<br>
        OCR Pipeline: Multimodal LayoutLMv3 + Vision-Language Transformer<br>
        Detected Headers: Commercial Invoicing &bull; Fleet Manifest &bull; Fuel Ledger<br>
        <span class="doc-line-highlight">Extracted Volume: 148,200 Units</span> &bull; 
        <span class="doc-line-highlight" style="color: #67e8f9;">Confidence: 99.1%</span><br>
        Matching GHG Emission Factor: DEFRA 2025 Standard
      `;
    }

    document.getElementById('resCategory').textContent = "Scope 3 — Verified Value Chain Activity";
    document.getElementById('resFactor').textContent = "DEFRA 2025 Global Protocol (0.024 kg/unit)";
    document.getElementById('resVolume').textContent = "148,200 Units Audited";
    document.getElementById('resEmissions').textContent = "+84.15 MT CO₂e";
    document.getElementById('aiConfidenceBadge').innerHTML = '<i class="fa-solid fa-circle-check"></i> Model Confidence: <strong>99.1%</strong>';
  }

  function commitEmissionsToLedger(amount, scope, title) {
    state.grossEmissions += amount;
    if (scope === 1) state.scope1 += amount;
    if (scope === 2) state.scope2 += amount;
    if (scope === 3) state.scope3 += amount;

    // Update UI numbers
    updateMetricCards();

    // Update Donut Chart
    if (state.scopeDonutChart) {
      state.scopeDonutChart.data.datasets[0].data = [state.scope1, state.scope2, state.scope3];
      state.scopeDonutChart.update();
    }

    showToast('Committed to Ledger', `+${amount.toFixed(1)} MT CO₂e added under Scope ${scope} (${title}).`);
  }

  function updateMetricCards() {
    const grossEl = document.getElementById('valGrossEmissions');
    const s1El = document.getElementById('valScope1');
    const s2El = document.getElementById('valScope2');
    const s3El = document.getElementById('valScope3');
    const totalReportEl = document.getElementById('reportTableTotal');

    if (grossEl) grossEl.textContent = state.grossEmissions.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (s1El) s1El.textContent = state.scope1.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (s2El) s2El.textContent = state.scope2.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (s3El) s3El.textContent = state.scope3.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
    if (totalReportEl) totalReportEl.textContent = `${state.grossEmissions.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MT CO₂e`;
  }

  /* --------------------------------------------------------------------------
     4. WHAT-IF ABATEMENT SIMULATOR
     -------------------------------------------------------------------------- */
  function initAbatementSimulator() {
    const sliderFleet = document.getElementById('sliderFleet');
    const sliderRenewable = document.getElementById('sliderRenewable');
    const sliderNearshoring = document.getElementById('sliderNearshoring');
    const sliderSmartHvac = document.getElementById('sliderSmartHvac');

    const valSliderFleet = document.getElementById('valSliderFleet');
    const valSliderRenewable = document.getElementById('valSliderRenewable');
    const valSliderNearshoring = document.getElementById('valSliderNearshoring');
    const valSliderSmartHvac = document.getElementById('valSliderSmartHvac');

    function calculateAbatement() {
      state.fleetEvPct = parseInt(sliderFleet.value);
      state.renewablePpaPct = parseInt(sliderRenewable.value);
      state.nearshoringPct = parseInt(sliderNearshoring.value);
      state.smartHvacPct = parseInt(sliderSmartHvac.value);

      valSliderFleet.textContent = `${state.fleetEvPct}% EV`;
      valSliderRenewable.textContent = `${state.renewablePpaPct}% Solar/Wind`;
      valSliderNearshoring.textContent = `${state.nearshoringPct}% Local`;
      valSliderSmartHvac.textContent = `${state.smartHvacPct}% Automated`;

      // Mathematical abatement calculation
      // Fleet: Scope 1 fleet is ~2000 MT max.
      const fleetMitigated = Math.round((state.fleetEvPct / 100) * 1969.9 * 0.85);
      // Renewable: Scope 2 is 7140 MT.
      const renewableMitigated = Math.round((state.renewablePpaPct / 100) * 7140.5 * 0.92);
      // Nearshoring: Scope 3 freight is ~9450 MT.
      const nearshoringMitigated = Math.round((state.nearshoringPct / 100) * 9450.2 * 0.38);
      // HVAC: Scope 2 & 1 building HVAC is ~2840 MT.
      const hvacMitigated = Math.round((state.smartHvacPct / 100) * 2842.1 * 0.28);

      const totalMitigated = fleetMitigated + renewableMitigated + nearshoringMitigated + hvacMitigated;
      const pctReduction = ((totalMitigated / state.grossEmissions) * 100).toFixed(1);

      // Financial savings: ~₹2,050 ($25) per MT mitigated annually through energy/fuel savings
      const annualSavingsInr = (totalMitigated * 20500); // in Rupees
      const savingsCr = (annualSavingsInr / 10000000).toFixed(2);
      const savingsUsd = Math.round(annualSavingsInr / 83.5);

      // Abatement cost per MT
      const costPerTon = -((totalMitigated * 0.003) + 21.5).toFixed(2);

      // Update DOM
      document.getElementById('simCo2Mitigated').textContent = `-${totalMitigated.toLocaleString()} MT`;
      document.getElementById('simPctMitigated').textContent = `${pctReduction}% Total Footprint Reduction`;
      document.getElementById('simCostSavings').textContent = `₹${savingsCr} Cr ($${(savingsUsd / 1000).toFixed(0)}k)`;
      document.getElementById('simAbatementCost').textContent = `$${costPerTon} / tCO₂e`;

      // Update Chart
      if (state.abatementChart) {
        state.abatementChart.data.datasets[0].data = [fleetMitigated, renewableMitigated, nearshoringMitigated, hvacMitigated];
        state.abatementChart.update();
      }
    }

    [sliderFleet, sliderRenewable, sliderNearshoring, sliderSmartHvac].forEach(slider => {
      if (slider) slider.addEventListener('input', calculateAbatement);
    });

    // Quick Presets
    const btnConservative = document.getElementById('btnPresetConservative');
    const btnAggressive = document.getElementById('btnPresetAggressive');
    const btnMaxRoi = document.getElementById('btnPresetMaxRoi');

    if (btnConservative) {
      btnConservative.addEventListener('click', () => {
        sliderFleet.value = 20;
        sliderRenewable.value = 30;
        sliderNearshoring.value = 15;
        sliderSmartHvac.value = 25;
        calculateAbatement();
        showToast('Preset Applied', 'Conservative 2027 transition parameters loaded.');
      });
    }

    if (btnAggressive) {
      btnAggressive.addEventListener('click', () => {
        sliderFleet.value = 85;
        sliderRenewable.value = 95;
        sliderNearshoring.value = 60;
        sliderSmartHvac.value = 80;
        calculateAbatement();
        showToast('Aggressive Target', 'SBTi Net-Zero 2030 transition loaded (-74% CO₂e).');
      });
    }

    if (btnMaxRoi) {
      btnMaxRoi.addEventListener('click', () => {
        sliderFleet.value = 40;
        sliderRenewable.value = 75;
        sliderNearshoring.value = 10;
        sliderSmartHvac.value = 90;
        calculateAbatement();
        showToast('Max ROI Preset', 'Highest OPEX savings per rupee invested.');
      });
    }

    // Initial run
    calculateAbatement();
  }

  /* --------------------------------------------------------------------------
     5. ESG REPORT & LEDGER EXPORT
     -------------------------------------------------------------------------- */
  function initEsgExport() {
    const btnPrint = document.getElementById('btnPrintReport');
    const btnJson = document.getElementById('btnExportJson');
    const btnCsv = document.getElementById('btnExportCsv');

    if (btnPrint) {
      btnPrint.addEventListener('click', () => {
        window.print();
      });
    }

    if (btnJson) {
      btnJson.addEventListener('click', () => {
        const payload = {
          metadata: {
            organization: "Global Logistics & Tech Holdings Ltd.",
            framework: "GHG Protocol & EU CSRD Compliant",
            auditYear: 2026,
            verificationHash: "0x8F9a410b98124Cde72B19e20a"
          },
          summary: {
            grossEmissionsMtCo2e: state.grossEmissions,
            scope1: state.scope1,
            scope2: state.scope2,
            scope3: state.scope3
          },
          facilitiesAudited: mapNodes.length,
          generatedBy: "EcoTrack AI Autonomous Engine v2.4"
        };

        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(payload, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "EcoTrack_ESG_Disclosure_FY2026.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();

        showToast('JSON Exported', 'CSRD-compliant disclosure package downloaded.');
      });
    }

    if (btnCsv) {
      btnCsv.addEventListener('click', () => {
        const csvContent = [
          ["Category", "Scope", "Gross_Emissions_MT", "Verification_Protocol"],
          ["Stationary Gas Turbines", "1", "2842.1", "DEFRA 2025"],
          ["Commercial Delivery Fleet", "1", "1969.9", "EPA 2025 Mobile"],
          ["Purchased Grid Electricity", "2", "7140.5", "Regional Grid Factor"],
          ["Maritime Upstream Logistics", "3", "9450.2", "IMO GLEC Maritime"],
          ["Business Travel Aviation", "3", "613.2", "DEFRA Air Passenger"],
          ["Purchased Goods & Materials", "3", "6476.5", "Supplier EPD Verified"],
          ["TOTAL AUDITED", "1-3", state.grossEmissions.toFixed(1), "EcoTrack Autonomous AI"]
        ].map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "EcoTrack_Emissions_Ledger_FY2026.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();

        showToast('CSV Ledger Exported', 'Audited carbon ledger downloaded successfully.');
      });
    }
  }

  /* --------------------------------------------------------------------------
     6. 10-SLIDE INTERACTIVE PITCH DECK ENGINE (PPT CRITERION)
     -------------------------------------------------------------------------- */
  function initPitchDeck() {
    const modal = document.getElementById('deckModalBackdrop');
    const openBtnTop = document.getElementById('openDeckBtnTop');
    const openBtnNav = document.getElementById('presentationModalBtn');
    const openBtnFooter = document.getElementById('footerDeckLink');
    const closeBtn = document.getElementById('deckCloseBtn');
    const prevBtn = document.getElementById('deckPrevBtn');
    const nextBtn = document.getElementById('deckNextBtn');
    const dotsContainer = document.getElementById('deckDots');
    const slideCounter = document.getElementById('slideCounter');
    const fullscreenBtn = document.getElementById('deckFullscreenBtn');
    const exploreBtn = document.getElementById('btnExploreLiveApp');

    // Generate Dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 1; i <= state.totalSlides; i++) {
        const dot = document.createElement('div');
        dot.className = `deck-dot ${i === 1 ? 'active' : ''}`;
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    function openModal() {
      if (modal) modal.classList.add('open');
      document.body.style.overflow = 'hidden';
      goToSlide(1);
    }

    function closeModal() {
      if (modal) modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    function goToSlide(slideNum) {
      if (slideNum < 1) slideNum = 1;
      if (slideNum > state.totalSlides) slideNum = state.totalSlides;
      state.currentSlide = slideNum;

      // Update slides
      const slides = document.querySelectorAll('.deck-slide');
      slides.forEach(s => {
        s.classList.remove('active');
        if (parseInt(s.dataset.slide) === state.currentSlide) {
          s.classList.add('active');
        }
      });

      // Update counter
      if (slideCounter) {
        slideCounter.textContent = `Slide ${state.currentSlide} of ${state.totalSlides}`;
      }

      // Update dots
      const dots = document.querySelectorAll('.deck-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx + 1 === state.currentSlide);
      });

      // Update buttons
      if (prevBtn) prevBtn.disabled = (state.currentSlide === 1);
      if (nextBtn) nextBtn.disabled = (state.currentSlide === state.totalSlides);
    }

    // Open events
    if (openBtnTop) openBtnTop.addEventListener('click', openModal);
    if (openBtnNav) openBtnNav.addEventListener('click', openModal);
    if (openBtnFooter) {
      openBtnFooter.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
      });
    }
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // Nav events
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(state.currentSlide - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(state.currentSlide + 1));

    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        closeModal();
        const studio = document.getElementById('ai-studio');
        if (studio) studio.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Fullscreen toggle
    if (fullscreenBtn) {
      fullscreenBtn.addEventListener('click', () => {
        const modalWindow = document.querySelector('.deck-modal-window');
        if (!document.fullscreenElement) {
          modalWindow.requestFullscreen().catch(err => console.log(err));
        } else {
          document.exitFullscreen();
        }
      });
    }

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      if (!modal || !modal.classList.contains('open')) return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToSlide(state.currentSlide + 1);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToSlide(state.currentSlide - 1);
      } else if (e.key === 'Escape') {
        closeModal();
      }
    });
  }

  /* --------------------------------------------------------------------------
     7. QUICK INGEST TELEMETRY MODAL & FORM
     -------------------------------------------------------------------------- */
  function initQuickIngestModal() {
    const modal = document.getElementById('auditModalBackdrop');
    const triggerBtn = document.getElementById('triggerAuditModalBtn');
    const closeBtn = document.getElementById('closeAuditModalBtn');
    const cancelBtn = document.getElementById('cancelAuditModalBtn');
    const form = document.getElementById('quickIngestForm');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', () => {
        if (modal) modal.classList.add('open');
      });
    }

    function closeModal() {
      if (modal) modal.classList.remove('open');
    }

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const facility = document.getElementById('inputFacility').value;
        const scope = parseInt(document.getElementById('inputScope').value);
        const volume = parseFloat(document.getElementById('inputVolume').value);
        const unit = document.getElementById('inputUnit').value;

        // Factor conversion
        let factor = 0.441; // default electricity
        if (unit === 'liters') factor = 2.653;
        if (unit === 'tkm') factor = 0.0161;
        if (unit === 'pkm') factor = 0.146;

        const emissionsCalculated = (volume * factor) / 1000;

        commitEmissionsToLedger(emissionsCalculated, scope, facility);
        closeModal();
        form.reset();
      });
    }
  }

  /* --------------------------------------------------------------------------
     8. TOAST NOTIFICATION UTILITY
     -------------------------------------------------------------------------- */
  function showToast(title, message) {
    const toast = document.getElementById('toastNotification');
    const titleEl = document.getElementById('toastTitle');
    const msgEl = document.getElementById('toastMessage');

    if (!toast) return;

    if (titleEl) titleEl.textContent = title;
    if (msgEl) msgEl.textContent = message;

    toast.classList.add('show');
    clearTimeout(toast.timeoutId);
    toast.timeoutId = setTimeout(() => {
      toast.classList.remove('show');
    }, 3800);
  }

  // Real-time delta ticker simulation
  setInterval(() => {
    const deltaEl = document.getElementById('deltaTicker');
    if (deltaEl) {
      const variation = (Math.random() * 0.1 - 0.05);
      const newDelta = (state.deltaRate + variation).toFixed(2);
      deltaEl.textContent = `${newDelta} t/hr`;
    }
  }, 4000);

  // Initialize all subsystems
  initCharts();
  initGisMap();
  initAiStudio();
  initAbatementSimulator();
  initEsgExport();
  initPitchDeck();
  initQuickIngestModal();
});
